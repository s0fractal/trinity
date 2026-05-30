#!/usr/bin/env -S deno run --allow-all
// src/x6E00_court.ts — court (Substrate Court verifier)
// position: 6/E → harmony(6) × harmony-pair(E) = verdict-of-witnesses
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "26 26 33 26 33 26 6C 59"
//   harmony_emergence+0.85 (PRIMARY: court harmonizes witness envelopes)
//   completion_frontier+0.70 (verdict completes a witness chain)
//   mirror_apex+0.40 (court reflects substrate state)
//   foundation_container+0.40 (verification is foundational)
//   action_decision+0.30, triangle_build+0.30 (composes verdict from inputs)
//   bucket 6/E: primary axis harmony (6), bucket 6 ← MATCH on axis 6
//               secondary 'E' → completion-pair, verdict-shape
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// court — multi-envelope cross-substrate verdict
//
// Routes to probes/substrate-court-v0/ts/court.ts. Accepts envelope
// JSON file paths as positional args; emits SubstrateCourtVerdict.
//
// Usage:
//   t court <env1.json> <env2.json> [<env3.json> ...]
//
// Exit code 0 if agreement, non-zero if any conflict detected.
//
// Glossary words: court, verdict, witness-verdict, суд, вердикт

import {
  dirname,
  fromFileUrl,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const COURT = `${ROOT}/probes/substrate-court-v0/ts/court.ts`;

async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message: "court requires at least one envelope path",
      position: "6/E",
      available: "t court <envelope1.json> [envelope2.json ...]",
    }));
    Deno.exit(1);
  }

  const envelopeArgs: string[] = [];
  for (const a of args) {
    envelopeArgs.push("--envelope", a);
  }

  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-read", COURT, ...envelopeArgs],
    stdout: "piped",
    stderr: "inherit",
  });
  const out = await proc.output();

  // Pass through the verdict JSON verbatim (court already emits clean JSON).
  const verdict = new TextDecoder().decode(out.stdout);
  Deno.stdout.writeSync(new TextEncoder().encode(verdict));
  Deno.exit(out.code);
}

if (import.meta.main) {
  await main();
}
