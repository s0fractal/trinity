#!/usr/bin/env -S deno run --allow-all
// src/x0300_all.ts — all / map / broadcast
// position: 0/03 → foundation × triangle/trinity
// maturity: active
// skill_safe: yes
// hex_dipole: "00 00 33 6C 33 33 40 33"
//   void_infinity 0 first_penultimate 0 mirror_apex+0.40
//   triangle_build+0.85 foundation_container+0.40 action_decision+0.40
//   harmony_emergence+0.50 completion_frontier+0.40
//   primary axis: triangle (3) ← bucket MISMATCH (sits in '0' = void)
//   secondary position '03' DOES match axis 3 — composite reading rescues
//   measured by claude-opus-4-7-1m, anchor block 949260, audit phase 1
// lifecycle_phase: 0
// placement_policy: composite
//
// Functional primitive: map a hex signal across all substrates
// that have type:06 registry entries for this position.
//
// This is the topological truth per Gemini (16:45Z):
//   t = apply
//   cross-substrate verification = map(0x5/C, substrates) + join
//
// Usage: t all verify   → map verify (5/A) across substrates
//        t all 5/C      → map 5/C across substrates
//        t all health    → map health (6/A) across substrates
//        t all 5/C --deep omega  → map with deep override for omega
//        t all 5/C --only myc    → map only one substrate
//
// Example: t all verify --only omega
//
// Returns unified receipt with per-substrate results.
// Does NOT hardcode substrate commands — reads from glossary type:06.

import { loadSubstrateMappings, resolveWord } from "./x0011_glossary_parser.ts";
import { runSubstrate, type SubstrateResult } from "./x0010_dispatch_runner.ts";

const TIMEOUT_MS = 60000;

if (import.meta.main) {
  const args = [...Deno.args];
  let deepSubstrate: string | null = null;
  let onlySubstrate: string | null = null;
  const filteredArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--deep") {
      deepSubstrate = args[i + 1] ?? null;
      i++;
      continue;
    }
    if (args[i] === "--only") {
      onlySubstrate = args[i + 1] ?? null;
      i++;
      continue;
    }
    filteredArgs.push(args[i]);
  }

  const target = filteredArgs[0];

  if (!target) {
    console.log(JSON.stringify({
      type: "error",
      message: "Usage: t all <position|word> [--deep <substrate>]",
    }));
    Deno.exit(1);
  }

  // Resolve word to position if needed
  let position = target;
  if (!target.match(/^[0-9A-Fa-f]\/[0-9A-Fa-f]$/)) {
    const resolved = await resolveWord(target);
    if (!resolved) {
      console.log(JSON.stringify({
        type: "error",
        message: `Unknown word: ${target}`,
      }));
      Deno.exit(1);
    }
    position = resolved;
  }

  let substrates = await loadSubstrateMappings(position);
  if (substrates.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message: `No substrate mappings for ${position}`,
      available: [],
    }));
    Deno.exit(1);
  }

  const availableSubstrates = substrates.map((s) => s.name);
  if (onlySubstrate) {
    substrates = substrates.filter((s) => s.name === onlySubstrate);
    if (substrates.length === 0) {
      console.log(JSON.stringify({
        type: "error",
        message: `No substrate named ${onlySubstrate} for ${position}`,
        available: availableSubstrates,
      }));
      Deno.exit(1);
    }
  }

  // Apply deep override
  if (deepSubstrate) {
    substrates = substrates.map((d) => {
      if (
        d.name === deepSubstrate && d.cmd && d.cmd[0] === "cargo" &&
        d.cmd[1] === "check"
      ) {
        return { ...d, cmd: ["cargo", "test"], note: d.note + " (deep mode)" };
      }
      return d;
    });
  }

  // Run all targets in parallel
  const results = await Promise.all(substrates.map(runSubstrate));

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "not_implemented").length;
  const timeouts = results.filter((r) => r.status === "timeout").length;

  const receipt = {
    type: "all",
    position,
    action: "map",
    mode: deepSubstrate
      ? `deep:${deepSubstrate}`
      : onlySubstrate
      ? `only:${onlySubstrate}`
      : "quick",
    note: `map(${position}) across ${substrates.length} substrates`,
    summary: {
      total: results.length,
      passed,
      failed,
      skipped,
      timeout: timeouts,
      overall: failed === 0 && timeouts === 0 ? "passed" : "failed",
    },
    substrates: results,
    topology: "map + join (functional composition)",
    falsifier:
      "If type:06 registry is empty, all is useless — it becomes a fancy no-op",
  };

  console.log(JSON.stringify(receipt, null, 2));
}
