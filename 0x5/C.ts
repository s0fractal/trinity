#!/usr/bin/env -S deno run --allow-all
// 0x5/C.ts — cross-substrate verify / container action
// position: 5/C → action(5) × container/cycle(C)
// hex_dipole: "00 00 59 00 00 00 59 00"
//   mirror_apex+0.70, harmony_emergence+0.70 (Kimi: reflects substrates, restores order)
//   bucket 5/C: primary axis is mirror (2) or harmony (6), bucket 5 ← MISMATCH
//               NO axis 5 (action) component in dipole at all
//               secondary 'C' → hex C = axis 4 negative pole, dipole 0 on axis 4
//               ← does not rescue
//   honest assessment: this LEGACY cross-verify file shows clear bucket dissonance
//                      — it's now overlapped by `t all 5/C` (0x0/03.ts).
//                      Belongs at 0x2/6 or 0x6/2 under composite reading.
//   audit phase 1 annotation: claude-opus-4-7-1m, anchor block 949260
// lifecycle_phase: 1
//
// Cross-substrate verification: executes verify/test across
// all available substrates and collects results into unified
// receipt format. Demonstrates adapter pattern: shared hex
// addressing (0x5/C = verify) with substrate-specific execution.
//
// LEGACY: This file predates the `all` primitive (0x0/03.ts).
// New code should prefer `t all 5/C` or `t pipe verify all`.
// Kept for backward compatibility and as bootstrap anchor.

import { loadSubstrateMappings } from "../lib/glossary.ts";
import { runSubstrate, type SubstrateDef, type SubstrateResult } from "../lib/runner.ts";

const FALLBACK_SUBSTRATES: SubstrateDef[] = [
  {
    name: "trinity",
    cwd: ".",
    cmd: ["deno", "check", "0x0/01.ts", "0x5/0.ts", "0x5/A.ts", "0x5/C.ts"],
    note: "Trinity substrate: type-check hex substrate files (deno test skipped — liquid/tests have pre-existing TS errors)",
  },
  {
    name: "omega",
    cwd: "omega",
    cmd: ["cargo", "check"],
    note: "Omega substrate: compile check only (use --deep for full tests)",
  },
  {
    name: "liquid",
    cwd: "liquid",
    cmd: ["deno", "check", "00_core/liquid_pipe.ts", "00_core/phase_engine.ts", "00_core/hydrate.ts", "00_core/seed.ts"],
    note: "Liquid substrate: type-check core files (hex→φ adapter pending; tests hang, audit has drift)",
  },
  {
    name: "myc",
    cwd: "myc",
    cmd: ["deno", "task", "test"],
    note: "MYC substrate: deno task test (42 tests, protocol audit + myc core)",
  },
];

async function getSubstrates(deep: boolean, position: string): Promise<SubstrateDef[]> {
  const fromGlossary = await loadSubstrateMappings(position);
  // Map glossary SubstrateMapping to SubstrateDef (compatible shapes)
  const base: SubstrateDef[] = fromGlossary.length > 0
    ? fromGlossary.map((m) => ({ name: m.name, cwd: m.cwd, cmd: m.cmd, note: m.note }))
    : FALLBACK_SUBSTRATES;
  return base.map((d) => {
    if (d.name === "omega" && deep) {
      return { ...d, cmd: ["cargo", "test"], note: d.note + " (deep mode)" };
    }
    return d;
  });
}

if (import.meta.main) {
  const args = [...Deno.args];
  const deep = args.includes("--deep");
  const filterArgs = args.filter((a) => a !== "--deep");
  const filter = filterArgs[0];

  const SUBSTRATES = await getSubstrates(deep, "5/C");
  const targets = filter
    ? SUBSTRATES.filter((s) => s.name === filter)
    : SUBSTRATES;

  if (targets.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      position: "5/C",
      message: `Unknown substrate: ${filter}`,
      available: SUBSTRATES.map((s) => s.name),
    }));
    Deno.exit(1);
  }

  // Run all targets in parallel
  const results = await Promise.all(targets.map(runSubstrate));

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "not_implemented").length;
  const timeouts = results.filter((r) => r.status === "timeout").length;

  const receipt = {
    type: "cross_substrate_verify",
    position: "5/C",
    action: "verify",
    mode: deep ? "deep" : "quick",
    note: `5(action) × C(container) — verify across all substrates (${deep ? "deep" : "quick"} mode)`,
    summary: {
      total: results.length,
      passed,
      failed,
      skipped,
      timeout: timeouts,
      overall: failed === 0 && timeouts === 0 ? "passed" : "failed",
    },
    substrates: results,
    adapter_pattern: "shared_hex_addressing + substrate_specific_execution",
    falsifier: "If any substrate shows 'not_implemented' forever, this is a sketch not a bridge",
  };

  console.log(JSON.stringify(receipt, null, 2));
}
