#!/usr/bin/env -S deno run --allow-all
// 0x0/04.ts — each / for-each / sequential apply
// position: 0/04 → foundation × cardinal/four-square
// hex_dipole: "00 00 00 6C 00 40 40 33"
//   triangle_build+0.85 (PRIMARY: sequential composition is the act)
//   action_decision+0.50, harmony_emergence+0.50 (ordered doing)
//   completion_frontier+0.40 (gather all then return)
//   bucket 0/04: primary axis triangle (3), bucket 0 ← MISMATCH (projection)
//                secondary '04' → axis 4 foundation, dipole 0.00 ← does not rescue
//   measured by claude-opus-4-7-1m, anchor block 949260, audit phase 1
// lifecycle_phase: 0
//
// Primitive: apply a list of positions sequentially.
// No new code needed for common workflows — just compose.
//
// Usage: t each verify health
//        t each 5/A 5/C 6/A
//        t each health cross-verify
//
// Returns array receipt with per-step results.

import { resolveWord } from "../lib/glossary.ts";
import { runStep } from "../lib/runner.ts";

if (import.meta.main) {
  const steps = Deno.args;
  if (steps.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message: "Usage: t each <position|word>...",
    }));
    Deno.exit(1);
  }

  const results: any[] = [];
  for (const step of steps) {
    let pos = step;
    if (!step.match(/^[0-9A-Fa-f](\/[0-9A-Fa-f])+$/)) {
      const resolved = await resolveWord(step);
      if (!resolved) {
        results.push({ type: "error", message: `Unknown: ${step}` });
        continue;
      }
      pos = resolved;
    }
    results.push(await runStep(pos));
  }

  const errors = results.filter((r) => r.type === "error" || r.code !== 0 && r.code !== undefined).length;

  console.log(JSON.stringify({
    type: "each",
    action: "sequence",
    steps,
    count: results.length,
    errors,
    overall: errors === 0 ? "passed" : "failed",
    results,
    note: "Sequential composition primitive: do this, then that",
    topology: "each(position₁, position₂, ...) = apply(apply(position₁), position₂, ...)",
  }, null, 2));
}
