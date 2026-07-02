// agentseal.ts — bound an agent action, then emit a witnessed, content-addressed
// receipt of it. The composition that turns the three real primitives into a product:
//
//   classify (autonomy-kernel) — what is this action's blast radius (A0..A4)?
//   address  (canonical-receipt) — deterministic canonical bytes → one content id
//   witness  (witness keystone)  — m-of-n ed25519 co-signatures, Sybil-resistant
//
// Single-player value the day you install it: classify and audit your own agent,
// fail-closed on sovereign (A4) actions. As receipts spread, they become
// cross-vendor, locally-verifiable provenance — no shared IdP, no trusted host.

import {
  type ActionClass,
  type AdmissionContext,
  admit,
  type Anchor,
  type AutonomyIntent,
  type AutonomyMandate,
  classifyIntent,
  type ReasonCode,
} from "@s0fractal/autonomy-kernel";
import { encodeCanonical } from "@s0fractal/canonical-receipt";
import {
  coSign,
  type CoSignature,
  type QuorumResult,
  sha256,
  toHex,
  verifyQuorum,
  type Witness,
} from "@s0fractal/witness";

export interface SealedAction {
  intent: AutonomyIntent;
  cls: ActionClass; // A0 observe · A1 reversible · A2 repo · A3 external · A4 sovereign
  allowed: boolean; // false for A4 unless explicitly authorized out of band
  reason: string;
  at?: number; // optional caller-supplied anchor (block height / logical time)
  receiptDigest: string; // hex sha-256 of the canonical receipt body
  coSignatures: CoSignature[]; // who witnessed the bounded action
}

export interface SealOptions {
  /** Authorize an A4 (sovereign) action — a fresh human/quorum decision, never auto. */
  allowSovereign?: boolean;
  /** Caller-supplied anchor recorded in the receipt (e.g. a block height). */
  at?: number;
}

/** The canonical receipt body — the exact bytes a witness signs. `at` is omitted
 *  when absent so the canonical encoder never sees an `undefined`. */
function canonicalBody(
  intent: AutonomyIntent,
  cls: ActionClass,
  allowed: boolean,
  reason: string,
  at?: number,
): Record<string, unknown> {
  const body: Record<string, unknown> = { intent, cls, allowed, reason };
  if (at !== undefined) body.at = at;
  return body;
}

/** Bound an agent action, content-address it, and collect witness co-signatures. */
export async function seal(
  intent: AutonomyIntent,
  witnesses: Witness[],
  opts: SealOptions = {},
): Promise<SealedAction> {
  const { cls, reason } = classifyIntent(intent);
  const allowed = cls !== "A4" || !!opts.allowSovereign;
  const body = canonicalBody(intent, cls, allowed, reason, opts.at);

  // deterministic canonical bytes → one content address everyone recomputes
  const digest = await sha256(encodeCanonical(body as never));
  const coSignatures = allowed
    ? await Promise.all(witnesses.map((w) => coSign(w, digest)))
    : []; // a refused action is recorded but not witnessed as authorized

  const sealed: SealedAction = {
    intent,
    cls,
    allowed,
    reason,
    receiptDigest: toHex(digest),
    coSignatures,
  };
  if (opts.at !== undefined) sealed.at = opts.at;
  return sealed;
}

export interface SealVerdict extends QuorumResult {
  receiptIntact: boolean; // the body still hashes to receiptDigest (no tampering)
}

/**
 * Verify a sealed action LOCALLY: recompute the content address from the body
 * (tamper check), then check that an m-of-n quorum of authorized keys co-signed it.
 * No host is contacted.
 */
export async function verifySeal(
  sealed: SealedAction,
  authorized: Uint8Array[],
  threshold: number,
): Promise<SealVerdict> {
  const digest = await sha256(
    encodeCanonical(
      canonicalBody(
        sealed.intent,
        sealed.cls,
        sealed.allowed,
        sealed.reason,
        sealed.at,
      ) as never,
    ),
  );
  const receiptIntact = toHex(digest) === sealed.receiptDigest;
  const quorum = await verifyQuorum(
    digest,
    sealed.coSignatures,
    authorized,
    threshold,
  );
  return { ...quorum, receiptIntact };
}

// ── mandate-gated seal — the full "under-which-mandate" claim ────────────────
// `seal` records WHAT class an action is. `sealAdmitted` records that a specific
// ratified MANDATE authorized it — the who-did-what-UNDER-WHICH-MANDATE receipt.
// It runs the kernel's fail-closed `admit` (A4 never auto-admitted, no matching
// profile is denial, an effect above the profile ceiling is escalation, editing
// the mandate itself is recursive) and binds the mandate commitment INTO the
// content address, so the receipt cannot be re-pointed at a different mandate.

export interface AdmittedSeal extends SealedAction {
  mandateCommitment: string | null; // WHICH mandate authorized it (bound in the address)
  reasonCode: ReasonCode; // why it was admitted or refused
}

/** The canonical body for a mandate-gated receipt — the base body plus the
 *  mandate binding, so tampering with either the action or the mandate breaks
 *  the content address. */
function canonicalAdmittedBody(
  intent: AutonomyIntent,
  cls: ActionClass,
  allowed: boolean,
  reason: string,
  mandateCommitment: string | null,
  reasonCode: ReasonCode,
  at?: number,
): Record<string, unknown> {
  const body = canonicalBody(intent, cls, allowed, reason, at);
  body.mandate_commitment = mandateCommitment;
  body.reason_code = reasonCode;
  return body;
}

/** Admit an agent action against a ratified mandate, then (if admitted)
 *  content-address and witness it. A refused action is recorded, not witnessed. */
export async function sealAdmitted(
  intent: AutonomyIntent,
  mandate: AutonomyMandate | null,
  at: Anchor,
  witnesses: Witness[],
  context: AdmissionContext = { anchor_verified: false },
): Promise<AdmittedSeal> {
  const verdict = admit(intent, mandate, at, context);
  const allowed = verdict.admitted;
  const body = canonicalAdmittedBody(
    intent,
    verdict.cls,
    allowed,
    verdict.reason,
    verdict.mandate_commitment,
    verdict.reason_code,
    at.height,
  );
  const digest = await sha256(encodeCanonical(body as never));
  const coSignatures = allowed
    ? await Promise.all(witnesses.map((w) => coSign(w, digest)))
    : [];
  return {
    intent,
    cls: verdict.cls,
    allowed,
    reason: verdict.reason,
    at: at.height,
    receiptDigest: toHex(digest),
    coSignatures,
    mandateCommitment: verdict.mandate_commitment,
    reasonCode: verdict.reason_code,
  };
}

/** Verify a mandate-gated seal LOCALLY: recompute the address (tamper + mandate
 *  binding check), then check the m-of-n quorum. No host is contacted. */
export async function verifyAdmittedSeal(
  sealed: AdmittedSeal,
  authorized: Uint8Array[],
  threshold: number,
): Promise<SealVerdict> {
  const digest = await sha256(
    encodeCanonical(
      canonicalAdmittedBody(
        sealed.intent,
        sealed.cls,
        sealed.allowed,
        sealed.reason,
        sealed.mandateCommitment,
        sealed.reasonCode,
        sealed.at,
      ) as never,
    ),
  );
  const receiptIntact = toHex(digest) === sealed.receiptDigest;
  const quorum = await verifyQuorum(
    digest,
    sealed.coSignatures,
    authorized,
    threshold,
  );
  return { ...quorum, receiptIntact };
}
