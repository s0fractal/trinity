#!/usr/bin/env -S deno run --allow-all
// 0x6/D.ts — cowitness (append oracle signature to envelope witness_chain)
// position: 6/D → harmony(6) × decision(D) = harmonic decision to extend chain
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
// Glossary words: cowitness, co-witness, sign, attest, cпів-свідок, підписати

import { coWitness, Envelope, WitnessEntry } from "../probes/receipt-envelope-encoder-v0/ts/envelope.ts";

function parseArgs(args: string[]): {
  envelopePath?: string;
  stdin: boolean;
  oracle: string;
  substrate: string;
} {
  let envelopePath: string | undefined;
  let stdin = false;
  let oracle = "claude-opus-4-7";
  let substrate = "trinity";
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--stdin") stdin = true;
    else if (a === "--oracle") oracle = args[++i] ?? oracle;
    else if (a === "--substrate") substrate = args[++i] ?? substrate;
    else if (!a.startsWith("--")) envelopePath = a;
  }
  return { envelopePath, stdin, oracle, substrate };
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of Deno.stdin.readable) chunks.push(chunk);
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { buf.set(c, off); off += c.length; }
  return new TextDecoder().decode(buf);
}

async function signatureFor(
  oracle: string,
  substrate_tag: string,
  envelope_id: string,
  timestamp_iso: string,
): Promise<string> {
  const src = `${oracle}|${substrate_tag}|${envelope_id}|${timestamp_iso}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(src));
  const hex = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  return "1220" + hex;
}

async function main() {
  const { envelopePath, stdin, oracle, substrate } = parseArgs(Deno.args);

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
    envelope = JSON.parse(envelopeText) as Envelope;
  } catch (e) {
    console.log(JSON.stringify({
      type: "error",
      message: `cowitness: invalid envelope JSON: ${(e as Error).message}`,
      position: "6/D",
    }));
    Deno.exit(1);
  }

  if (envelope.schema !== "trinity.receipt-envelope.v0.1") {
    console.log(JSON.stringify({
      type: "error",
      message: `cowitness: unexpected schema ${envelope.schema}; expected trinity.receipt-envelope.v0.1`,
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
    note: "Signature is a deterministic identity stamp, not a cryptographic key signature. Senate-level signing belongs to a future strong-signing organ.",
  };

  console.log(JSON.stringify(payload));
}

if (import.meta.main) {
  await main();
}
