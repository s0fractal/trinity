// seal_to_warrant.ts — bridge an agentseal receipt into a Warrant record.
//
// agentseal answers "what class is this action, under which mandate, and who
// witnessed it?" (A0–A4 classification + m-of-n quorum, canonical-CBOR digest).
// Warrant answers "what was decided, under which pinned policy, with what
// re-runnable reasons, in what settled chain?" (Ed25519 over a JCS WarrantID,
// settlement semantics). They are different formats with different crypto — this
// bridge maps a SealedAction into the field values of a Warrant record and
// carries the full receipt as evidence, so an agent using agentseal produces a
// Warrant-verifiable evidence pack. Each layer stays verifiable by its own tool:
// warrant verifies the record, agentseal's verifyQuorum re-checks the embedded
// receipt. Neither reimplements the other's cryptography.
//
// This module is PURE: it computes field values + content-addressed blob bytes.
// Signing/filing is done by the `warrant` CLI (see examples/seal_to_warrant.ts),
// so there is no second Warrant signing implementation to keep in sync.

import { sha256, toHex } from "@s0fractal/witness";
import type { AdmittedSeal, SealedAction } from "./agentseal.ts";

/** A content-addressed blob: its SHA-256 (hex) and the exact bytes. */
export interface Blob {
  hash: string;
  bytes: Uint8Array;
}

/** The field values a `warrant` filing verb needs, plus the blobs to store. */
export interface WarrantRecordFields {
  decision: "accept" | "reject"; // allowed → accept, refused → reject
  subject: string; // hex: the pinned intent
  under: string; // hex: the pinned classification/mandate basis
  evidence: string[]; // hex: the full agentseal receipt
  reason: string; // prose: class, verdict, quorum, receipt digest
  actor: string; // the acting agent's Warrant actor id (caller-supplied)
  prior: string[]; // WarrantIDs this action follows
  ts: number; // unix seconds (the seal's anchor, or caller-supplied)
  blobs: { subject: Blob; basis: Blob; receipt: Blob };
}

export interface BridgeOptions {
  actor: string; // required: the Warrant actor id of the acting agent
  prior?: string[]; // optional: prior WarrantIDs (the session chain)
  ts?: number; // optional: overrides the seal's `at` (else required if no `at`)
}

/** Deterministic, sorted-key JSON bytes — the content-addressed blob encoding. */
function canonJson(value: unknown): Uint8Array {
  const stable = (v: unknown): unknown => {
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(stable);
    const o = v as Record<string, unknown>;
    return Object.keys(o).sort().reduce((acc, k) => {
      acc[k] = stable(o[k]);
      return acc;
    }, {} as Record<string, unknown>);
  };
  return new TextEncoder().encode(JSON.stringify(stable(value)));
}

async function blob(value: unknown): Promise<Blob> {
  const bytes = canonJson(value);
  return { hash: toHex(await sha256(bytes)), bytes };
}

function isAdmitted(s: SealedAction | AdmittedSeal): s is AdmittedSeal {
  return "mandateCommitment" in s;
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** A JSON-safe form of a receipt: the `coSignatures` (raw Ed25519 bytes) are
 *  hex-encoded so the receipt survives a JSON evidence blob intact. */
export function serializeReceipt(
  s: SealedAction | AdmittedSeal,
): Record<string, unknown> {
  return {
    ...s,
    coSignatures: s.coSignatures.map((c) => ({
      publicKey: toHex(c.publicKey),
      signature: toHex(c.signature),
    })),
  };
}

/** Inverse of `serializeReceipt`: reconstruct a SealedAction (Uint8Array
 *  co-signatures) from the evidence blob, ready for agentseal's `verifySeal` /
 *  `verifyAdmittedSeal`. This is how a verifier re-checks the m-of-n quorum
 *  straight from a Warrant evidence pack, no host contacted. */
export function deserializeReceipt(
  json: Record<string, unknown>,
): SealedAction | AdmittedSeal {
  const cosigs =
    (json.coSignatures as Array<{ publicKey: string; signature: string }>)
      .map((c) => ({
        publicKey: fromHex(c.publicKey),
        signature: fromHex(c.signature),
      }));
  return { ...json, coSignatures: cosigs } as unknown as
    | SealedAction
    | AdmittedSeal;
}

/**
 * Map an agentseal SealedAction / AdmittedSeal to Warrant record field values.
 *
 * - decision: `accept` if allowed, else `reject` (a refused A4 is a first-class
 *   record, not an absence).
 * - subject: the pinned intent (what the action was about).
 * - under: a pinned "basis" blob carrying the class, effects, and — for a
 *   mandate-gated seal — the mandate_commitment and reason_code. (Warrant `under`
 *   must be a resolvable hash; the raw mandate commitment may not be, so it is
 *   pinned inside this basis blob.)
 * - evidence: the full agentseal receipt, so agentseal's verifyQuorum can
 *   independently re-check the m-of-n witnesses from inside the pack.
 * - reason: prose recording the class, verdict, quorum size, and receipt digest.
 */
export async function sealToWarrant(
  sealed: SealedAction | AdmittedSeal,
  opts: BridgeOptions,
): Promise<WarrantRecordFields> {
  if (!opts.actor) throw new Error("sealToWarrant: opts.actor is required");
  const ts = sealed.at ?? opts.ts;
  if (ts === undefined) {
    throw new Error(
      "sealToWarrant: no timestamp (seal has no `at`; pass opts.ts)",
    );
  }

  const admitted = isAdmitted(sealed);
  const basisValue: Record<string, unknown> = {
    kind: "agentseal-basis",
    cls: sealed.cls,
    effects: sealed.intent.effects,
  };
  if (admitted) {
    basisValue.mandate_commitment = sealed.mandateCommitment;
    basisValue.reason_code = sealed.reasonCode;
  }

  const subjectBlob = await blob(sealed.intent);
  const basisBlob = await blob(basisValue);
  const receiptBlob = await blob(serializeReceipt(sealed));

  const quorumNote = sealed.allowed
    ? `quorum ${sealed.coSignatures.length} co-signature(s)`
    : "refused (fail-closed), not witnessed";
  const mandateNote = admitted
    ? `; mandate ${
      sealed.mandateCommitment ?? "none"
    }; reason_code ${sealed.reasonCode}`
    : "";
  const reason = `agentseal ${sealed.cls} — ${sealed.reason}; ${quorumNote}; ` +
    `receipt ${sealed.receiptDigest}${mandateNote}`;

  return {
    decision: sealed.allowed ? "accept" : "reject",
    subject: subjectBlob.hash,
    under: basisBlob.hash,
    evidence: [receiptBlob.hash],
    reason,
    actor: opts.actor,
    prior: opts.prior ?? [],
    ts,
    blobs: { subject: subjectBlob, basis: basisBlob, receipt: receiptBlob },
  };
}
