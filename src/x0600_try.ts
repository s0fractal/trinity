#!/usr/bin/env -S deno run --allow-all
// src/x0600_try.ts — try / attempt / graceful fallback
// position: 0/06 → foundation × serpent/curve
// hex_dipole: "00 00 26 00 00 33 59 40"
//   harmony_emergence+0.70 (PRIMARY: graceful recovery = order restoration)
//   completion_frontier+0.50 (handles boundary case)
//   action_decision+0.40, mirror_apex+0.30
//   bucket 0/06: primary axis harmony (6), bucket 0 ← MISMATCH (projection)
//                secondary '06' → axis 6 harmony, dipole +0.70 ← COMPOSITE-READING RESCUE
//   measured by claude-opus-4-7-1m, anchor block 949260, audit phase 1
// lifecycle_phase: 0
// placement_policy: composite
//
// Primitive: attempt a step; if it fails, try the fallback.
// If both fail, return the last error.
//
// Usage: t try verify health
//        → run verify; if failed → run health
//
//        t try cross-verify verify
//        → run cross-verify; if failed → run verify
//
// This is the recovery primitive. Compose with pipe for
// complex retry: t pipe (t try step1 step2) step3
//
// Returns the successful result, or error if both fail.

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
      message: "Usage: t try <position|word> <fallback-position|fallback-word>",
    }));
    Deno.exit(1);
  }

  async function resolve(pos: string): Promise<string | null> {
    if (pos.match(/^[0-9A-Fa-f](\/[0-9A-Fa-f])+$/)) return pos;
    return await resolveWord(pos);
  }

  const primaryName = args[0];
  const fallbackName = args[1];

  const primaryPos = await resolve(primaryName);
  const fallbackPos = await resolve(fallbackName);

  if (!fallbackPos) {
    console.log(JSON.stringify({
      type: "error",
      message: `Unknown fallback: ${fallbackName}`,
    }));
    Deno.exit(1);
  }

  let primaryResult: any;
  if (!primaryPos) {
    primaryResult = { type: "error", message: `Unknown: ${primaryName}` };
  } else {
    primaryResult = await runStep(primaryPos);
  }

  if (!isError(primaryResult)) {
    console.log(JSON.stringify({
      type: "try",
      action: "attempt",
      primary: primaryName,
      fallback: fallbackName,
      resolved_primary: primaryPos ?? "(unknown)",
      resolved_fallback: fallbackPos,
      used: "primary",
      overall: "passed",
      result: primaryResult,
      note: `Primary ${primaryName} succeeded — fallback not needed`,
      topology: "try(p, f) = if ok(p) then p else f",
    }, null, 2));
    Deno.exit(0);
  }

  const fallbackResult = await runStep(fallbackPos);
  const fallbackOk = !isError(fallbackResult);

  console.log(JSON.stringify({
    type: "try",
    action: "attempt",
    primary: primaryName,
    fallback: fallbackName,
    resolved_primary: primaryPos ?? "(unknown)",
    resolved_fallback: fallbackPos,
    used: fallbackOk ? "fallback" : "none",
    overall: fallbackOk ? "passed" : "failed",
    primary_error: primaryResult,
    result: fallbackOk ? fallbackResult : fallbackResult,
    note: fallbackOk
      ? `Primary ${primaryName} failed — fallback ${fallbackName} succeeded`
      : `Both ${primaryName} and ${fallbackName} failed`,
    topology: "try(p, f) = if ok(p) then p else if ok(f) then f else error",
  }, null, 2));

  if (!fallbackOk) Deno.exit(1);
}
