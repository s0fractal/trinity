#!/usr/bin/env -S deno run --allow-all
// src/x0A00_tap.ts — tap / touch / side-effect decorator
// position: 0/0A → foundation × ten/apex
// hex_dipole: "26 00 59 33 00 26 00 00"
//   mirror_apex+0.70 (PRIMARY: observes without consuming = reflection)
//   triangle_build+0.40 (composition decoration)
//   void_infinity+0.30 (passes primary through unchanged)
//   action_decision+0.30
//   bucket 0/0A: primary axis mirror (2), bucket 0 ← MISMATCH (projection)
//                secondary '0A' → hex A = axis 2 negative pole, dipole +0.70
//                on axis 2 ← PAIR-MATCH (sign-opposed pole) — defensible composite
//   measured by claude-opus-4-7-1m, anchor block 949260, audit phase 1
// lifecycle_phase: 0
// placement_policy: composite
//
// Primitive: run primary step, then side-effect step,
// return primary result unchanged.
//
// Usage: t tap verify health
//        → run verify (keep result), then run health (side-effect)
//
//        t pipe verify (t tap health log)
//        → verify, then health for side-effect, then log
//
// This is the side-effect primitive for composition.
// It lets you observe without changing the data flow.

import { resolveWord } from "./x0011_glossary_parser.ts";
import { runStep } from "./x5010_dispatch_runner.ts";

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
  const args = Deno.args;
  if (args.length < 2) {
    console.log(JSON.stringify({
      type: "error",
      message: "Usage: t tap <primary> <side-effect>",
    }));
    Deno.exit(1);
  }

  async function resolve(pos: string): Promise<string | null> {
    if (pos.match(/^[0-9A-Fa-f](\/[0-9A-Fa-f])+$/)) return pos;
    return await resolveWord(pos);
  }

  const primaryName = args[0];
  const sideName = args[1];

  const primaryPos = await resolve(primaryName);
  if (!primaryPos) {
    console.log(JSON.stringify({ type: "error", message: `Unknown: ${primaryName}` }));
    Deno.exit(1);
  }

  const sidePos = await resolve(sideName);
  if (!sidePos) {
    console.log(JSON.stringify({ type: "error", message: `Unknown side-effect: ${sideName}` }));
    Deno.exit(1);
  }

  const primaryResult = await runStep(primaryPos);
  const sideResult = await runStep(sidePos);

  const receipt = {
    type: "tap",
    action: "side-effect",
    primary: primaryName,
    side_effect: sideName,
    resolved_primary: primaryPos,
    resolved_side: sidePos,
    primary_ok: !isError(primaryResult),
    side_ok: !isError(sideResult),
    primary_result: primaryResult,
    side_result: sideResult,
    overall: !isError(primaryResult) ? "passed" : "failed",
    note: `Primary ${primaryName} executed, side-effect ${sideName} observed`,
    topology: "tap(p, s) = p() with s() as side-effect; return p's result",
  };

  console.log(JSON.stringify(receipt, null, 2));
  if (isError(primaryResult)) Deno.exit(1);
}
