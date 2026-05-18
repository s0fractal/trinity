#!/usr/bin/env -S deno run --allow-all
// src/x0500_pipe.ts — pipe / flow / conditional compose
// position: 0/05 → foundation × hand/action
// hex_dipole: "00 00 00 66 00 33 33 40"
//   triangle_build+0.80 (PRIMARY: chain composition)
//   completion_frontier+0.50 (short-circuit termination)
//   action_decision+0.40, harmony_emergence+0.40
//   bucket 0/05: primary axis triangle (3), bucket 0 ← MISMATCH (projection)
//                secondary '05' → axis 5 action, dipole +0.40 ← weak partial composite
//   measured by claude-opus-4-7-1m, anchor block 949260, audit phase 1
// lifecycle_phase: 0
// placement_policy: tier
//
// Primitive: conditional sequential composition with short-circuit.
// If any step fails, stop and return the error.
// If all steps pass, return the last result.
//
// Usage: t pipe verify health
//        t pipe 5/A 6/A
//        t pipe cross-verify health
//
// This is the basic workflow primitive.
// No new code for common patterns — just pipe existing ones.

import { resolveWord } from "./x0011_glossary_parser.ts";
import { runStep } from "./x0010_dispatch_runner.ts";

function isError(result: any): boolean {
  if (!result || typeof result !== "object") return true;
  if (result.type === "error") return true;
  if (result.type === "validation_error") return true;
  if (result.summary?.overall === "failed") return true;
  if (result.overall === "failed") return true;
  if (result.code !== undefined && result.code !== 0) return true;
  return false;
}

if (import.meta.main) {
  const steps = Deno.args;
  if (steps.length === 0) {
    console.log(JSON.stringify({ type: "error", message: "Usage: t pipe <position|word>..." }));
    Deno.exit(1);
  }

  let lastResult: any = null;
  let stoppedAt: string | null = null;

  for (const step of steps) {
    let pos = step;
    if (!step.match(/^[0-9A-Fa-f](\/[0-9A-Fa-f])+$/)) {
      const resolved = await resolveWord(step);
      if (!resolved) {
        lastResult = { type: "error", message: `Unknown: ${step}` };
        stoppedAt = step;
        break;
      }
      pos = resolved;
    }

    lastResult = await runStep(pos);
    if (isError(lastResult)) {
      stoppedAt = pos;
      break;
    }
  }

  const receipt = {
    type: "pipe",
    action: "flow",
    steps,
    stoppedAt,
    overall: stoppedAt ? "failed" : "passed",
    result: lastResult,
    note: stoppedAt
      ? `Short-circuit at ${stoppedAt}: ${lastResult.message ?? lastResult.type ?? "error"}`
      : `All ${steps.length} steps passed — returning last result`,
    topology: "pipe(step₁, step₂, ...) = if step₁ ok then step₂ else error",
  };

  const encoder = new TextEncoder();
  Deno.stdout.writeSync(encoder.encode(JSON.stringify(receipt, null, 2) + "\n"));
  if (stoppedAt) Deno.exit(1);
}
