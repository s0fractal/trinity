#!/usr/bin/env -S deno run --allow-all
// src/x6D00_cowitness.ts — cowitness (append oracle signature to envelope witness_chain)
// position: 6/D → harmony(6) × decision(D) = harmonic decision to extend chain
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 26 4C 26 33 4C 6C 26"
//   harmony_emergence+0.85 (PRIMARY: cowitness harmonizes multi-oracle voices)
//   mirror_apex+0.60 (chain reflects multiple signers)
//   action_decision+0.60 (signing IS a decision act)
//   foundation_container+0.40 (chain accumulates as foundation)
//   triangle_build+0.30, completion_frontier+0.30 (each entry builds toward verdict frontier)
//   bucket 6/D: primary axis harmony (6) ← MATCH bucket 6
//               secondary 'D' → axis 5 decision-pole, dipole +0.60 ← PAIR-MATCH
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// cowitness — append a witness entry to an existing envelope's chain
//
// Reads an envelope from stdin OR --envelope <path>. Appends a witness
// entry signed by this trinity instance's declared oracle identity.
// Emits a new envelope JSON with witness_chain.length + 1 and a new
// envelope_id (body_hash is preserved — content unchanged).
//
// Usage:
//   t cowitness <envelope.json> [--oracle <name>] [--substrate <tag>]
//   t status --envelope | jq -c .substrate_health_envelope | t cowitness --stdin
//
// The signature_hash is a SHA-256 over (oracle | substrate_tag |
// envelope_id | timestamp). NOT cryptographically signing the envelope
// in the strong sense — that requires keys and a Senate-level identity
// flow. This signature_hash is a deterministic stamp of "claude said this
// at this time"; a future strong-signing organ would replace it.
//
// Governance flow reference:
//   contracts/GOVERNANCE_FLOW.v0.md
//
// Glossary words: cowitness, co-witness, sign, attest, cпів-свідок, підписати

import {
  basename,
  dirname,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  coWitness,
  Envelope,
  WitnessEntry,
} from "../probes/receipt-envelope-encoder-v0/ts/envelope.ts";

function parseArgs(args: string[]): {
  envelopePath?: string;
  stdin: boolean;
  oracle: string;
  substrate: string;
  persist: boolean;
  persistTo?: string;
} {
  let envelopePath: string | undefined;
  let stdin = false;
  let oracle = "claude-opus-4-7";
  let substrate = "trinity";
  let persist = false;
  let persistTo: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--stdin") stdin = true;
    else if (a === "--oracle") oracle = args[++i] ?? oracle;
    else if (a === "--substrate") substrate = args[++i] ?? substrate;
    else if (a === "--persist") persist = true;
    else if (a === "--persist-to") {
      persist = true;
      persistTo = args[++i];
    } else if (!a.startsWith("--")) envelopePath = a;
  }
  return { envelopePath, stdin, oracle, substrate, persist, persistTo };
}

// Convention path per 2026-05-15T190206Z chord proposal:
//   proposals/codeicide/<proposal-basename>.cowitnesses/<substrate_tag>-<ISO-ts>.json
// Inferable only when input was --proposal path (not stdin) AND envelope
// body_kind is codeicide_proposal.
function inferPersistPath(
  envelopePath: string,
  substrateTag: string,
  bodyKind: string,
  timestamp_iso: string,
): string | null {
  if (bodyKind !== "codeicide_proposal") return null;
  // Strip .proposal.json or .json suffix to get the base name.
  const dir = dirname(envelopePath);
  let base = basename(envelopePath);
  if (base.endsWith(".proposal.json")) {
    base = base.slice(0, -".proposal.json".length);
  } else if (base.endsWith(".json")) base = base.slice(0, -".json".length);
  const tsForPath = timestamp_iso.replace(/[:.]/g, "-");
  return join(dir, `${base}.cowitnesses`, `${substrateTag}-${tsForPath}.json`);
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of Deno.stdin.readable) chunks.push(chunk);
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.length;
  }
  return new TextDecoder().decode(buf);
}

async function signatureFor(
  oracle: string,
  substrate_tag: string,
  envelope_id: string,
  timestamp_iso: string,
): Promise<string> {
  const src = `${oracle}|${substrate_tag}|${envelope_id}|${timestamp_iso}`;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(src),
  );
  const hex = Array.from(
    new Uint8Array(buf),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  return "1220" + hex;
}

async function main() {
  const { envelopePath, stdin, oracle, substrate, persist, persistTo } =
    parseArgs(Deno.args);

  let envelopeText: string;
  if (stdin || !envelopePath) {
    envelopeText = await readStdin();
  } else {
    envelopeText = await Deno.readTextFile(envelopePath);
  }

  if (!envelopeText.trim()) {
    console.log(JSON.stringify({
      type: "error",
      message: "cowitness requires an envelope (path arg or --stdin)",
      position: "6/D",
      available: "t cowitness <envelope.json> | t cowitness --stdin",
    }));
    Deno.exit(1);
  }

  let envelope: Envelope;
  try {
    const parsed = JSON.parse(envelopeText);
    // Accept either a bare envelope OR a wrapper payload like
    // {type: "codeicide_proposal_emitted", envelope: {...}} that propose
    // organ emits. Unwrap the envelope from wrapper.
    if (
      parsed && typeof parsed === "object" &&
      parsed.schema === "trinity.receipt-envelope.v0.1"
    ) {
      envelope = parsed as Envelope;
    } else if (
      parsed && typeof parsed === "object" && parsed.envelope &&
      parsed.envelope.schema === "trinity.receipt-envelope.v0.1"
    ) {
      envelope = parsed.envelope as Envelope;
    } else {
      console.log(JSON.stringify({
        type: "error",
        message:
          `cowitness: input is neither a bare RECEIPT_ENVELOPE.v0.1 nor a wrapper with .envelope`,
        position: "6/D",
      }));
      Deno.exit(1);
    }
  } catch (e) {
    console.log(JSON.stringify({
      type: "error",
      message: `cowitness: invalid envelope JSON: ${(e as Error).message}`,
      position: "6/D",
    }));
    Deno.exit(1);
  }

  const timestamp_iso = new Date().toISOString();
  const signature_hash = await signatureFor(
    oracle,
    substrate,
    envelope.envelope_id,
    timestamp_iso,
  );

  const entry: WitnessEntry = {
    oracle,
    signature_hash,
    signed_at_logical: { wall_time_utc: timestamp_iso },
    substrate_tag: substrate,
  };

  const newEnvelope = await coWitness(envelope, entry);

  // Persistence handling per convention proposed in
  // 2026-05-15T190206Z-claude-receipt-gemini-cowitness-acknowledged-persistence-gap.md:
  //   proposals/codeicide/<proposal-basename>.cowitnesses/<substrate_tag>-<ISO-ts>.json
  // Opt-in only (--persist or --persist-to); default keeps current
  // stdout-only behavior for backward compatibility.
  let persistedTo: string | null = null;
  let persistSkippedReason: string | null = null;
  if (persist) {
    let targetPath: string | null = null;
    if (persistTo) {
      targetPath = persistTo;
    } else if (
      envelopePath && (envelope.body_kind as string) === "codeicide_proposal"
    ) {
      targetPath = inferPersistPath(
        envelopePath,
        substrate,
        envelope.body_kind,
        timestamp_iso,
      );
    } else if (!envelopePath) {
      persistSkippedReason =
        "--persist with --stdin requires --persist-to <path> (cannot infer convention path without source file)";
    } else {
      persistSkippedReason =
        `--persist convention applies only to codeicide_proposal envelopes; this envelope body_kind is ${envelope.body_kind}`;
    }
    if (targetPath) {
      await Deno.mkdir(dirname(targetPath), { recursive: true });
      await Deno.writeTextFile(
        targetPath,
        JSON.stringify(newEnvelope, null, 2) + "\n",
      );
      persistedTo = targetPath;
    }
  }

  const payload = {
    type: "cowitness",
    action: "cowitness",
    position: "6/D",
    oracle,
    substrate_tag: substrate,
    previous_envelope_id: envelope.envelope_id,
    new_envelope_id: newEnvelope.envelope_id,
    chain_length: newEnvelope.witness_chain.length,
    envelope: newEnvelope,
    persisted_to: persistedTo,
    persist_skipped_reason: persistSkippedReason,
    note: persistedTo
      ? `Signature persisted at ${persistedTo}; t verdict can ingest this envelope alongside the original proposal.`
      : "Signature is a deterministic identity stamp, not a cryptographic key signature. Use --persist or --persist-to to write the envelope for t verdict to ingest.",
  };

  console.log(JSON.stringify(payload));
}

if (import.meta.main) {
  await main();
}
