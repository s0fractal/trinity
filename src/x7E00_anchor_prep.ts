#!/usr/bin/env -S deno run --allow-all
// src/x7E00_anchor_prep.ts — anchor-prep (Bitcoin-style inscription payload for N envelopes)
// position: 7/E → completion(7) × edge(E) = completion act at the frontier
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "26 26 26 33 4C 33 26 6C"
//   completion_frontier+0.85 (PRIMARY: anchor closes a witness epoch)
//   foundation_container+0.60 (anchor grounds receipts on external chain)
//   triangle_build+0.40 (Merkle tree is triangular structural witness)
//   action_decision+0.40 (anchor is the decision to commit)
//   bucket 7/E: primary axis completion (7), bucket 7 ← MATCH on axis 7
//               secondary 'E' → frontier-pair, edge-act
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// anchor-prep — Merkle root + inclusion proofs over N RECEIPT_ENVELOPE.v1.0
// envelopes. Emits inscription-ready payload; does NOT inscribe.
//
// V8 from the deep analysis (Bitcoin Receipt Pipeline). Unlocked
// 2026-05-14 by gemini AYE on RECEIPT_ENVELOPE.v1.0 (cross-language
// byte equality cleared codex's guardrail).
//
// Usage:
//   t anchor-prep <env1.json> [env2.json ...]
//   t status --envelope | jq -c .substrate_health_envelope | t anchor-prep --stdin
//
// Glossary words: anchor-prep, anchor, inscribe-prep, merkle-root,
//                 якір, інскрипція, корінь

import {
  dirname,
  fromFileUrl,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const ANCHOR = `${ROOT}/probes/envelope-bitcoin-anchor-v0/ts/anchor.ts`;

async function main() {
  const args = Deno.args;
  if (args.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message: "anchor-prep requires at least one envelope path (or --stdin)",
      position: "7/E",
      available: "t anchor-prep <env1.json> [env2.json ...] | --stdin",
    }));
    Deno.exit(1);
  }

  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-read", ANCHOR, ...args],
    stdout: "piped",
    stderr: "inherit",
    stdin: "inherit",
  });
  const out = await proc.output();
  const raw = new TextDecoder().decode(out.stdout);
  // Pass-through. The anchor probe emits canonical EnvelopeAnchorPayload.
  Deno.stdout.writeSync(new TextEncoder().encode(raw));
  Deno.exit(out.code);
}

if (import.meta.main) {
  await main();
}
