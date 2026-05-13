#!/usr/bin/env -S deno run --allow-all
// 0x0/07.ts — cond / branch / if-then-else
// position: 0/07 → foundation × threshold/seven
// hex_dipole: "00 00 26 33 00 66 33 00"
//   action_decision+0.80 (PRIMARY: cond IS the decision primitive)
//   triangle_build+0.40 (branches into structure)
//   harmony_emergence+0.40 (predicate evaluates), mirror_apex+0.30
//   bucket 0/07: primary axis action (5), bucket 0 ← MISMATCH (projection)
//                secondary '07' → axis 7 completion, dipole 0.00 ← does not rescue
//                under composite reading, cond belongs at 0x5/... or 0x5/7
//   measured by claude-opus-4-7-1m, anchor block 949260, audit phase 1
// lifecycle_phase: 0
// placement_policy: tier
//
// Primitive: evaluate predicate; if ok → run then-branch,
// else → run else-branch. Returns the branch result.
//
// Usage: t cond health verify cross-verify
//        → run health; if passed → run verify; else → run cross-verify
//
//        t cond verify init status
//        → run verify; if passed → run init; else → run status
//
// This is the branching primitive. Compose with pipe for
// guarded sequences: t pipe (t cond check step1 step2) step3
//
// Returns the branch that was taken, or error if predicate
// fails and else-branch also fails.

import { resolveWord } from "../lib/glossary.ts";
import { runStep } from "../lib/runner.ts";

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
  if (args.length < 3) {
    console.log(JSON.stringify({
      type: "error",
      message: "Usage: t cond <predicate> <then> <else>",
    }));
    Deno.exit(1);
  }

  async function resolve(pos: string): Promise<string | null> {
    if (pos.match(/^[0-9A-Fa-f](\/[0-9A-Fa-f])+$/)) return pos;
    return await resolveWord(pos);
  }

  const [predicateName, thenName, elseName] = args;

  const predicatePos = await resolve(predicateName);
  if (!predicatePos) {
    console.log(JSON.stringify({ type: "error", message: `Unknown predicate: ${predicateName}` }));
    Deno.exit(1);
  }

  const thenPos = await resolve(thenName);
  if (!thenPos) {
    console.log(JSON.stringify({ type: "error", message: `Unknown then-branch: ${thenName}` }));
    Deno.exit(1);
  }

  const elsePos = await resolve(elseName);
  if (!elsePos) {
    console.log(JSON.stringify({ type: "error", message: `Unknown else-branch: ${elseName}` }));
    Deno.exit(1);
  }

  const predicateResult = await runStep(predicatePos);
  const predicateOk = !isError(predicateResult);

  const branchName = predicateOk ? thenName : elseName;
  const branchPos = predicateOk ? thenPos : elsePos;
  const branchResult = await runStep(branchPos);
  const branchOk = !isError(branchResult);

  console.log(JSON.stringify({
    type: "cond",
    action: "branch",
    predicate: predicateName,
    then: thenName,
    else: elseName,
    resolved_predicate: predicatePos,
    resolved_then: thenPos,
    resolved_else: elsePos,
    predicate_ok: predicateOk,
    taken: branchName,
    overall: branchOk ? "passed" : "failed",
    predicate_result: predicateResult,
    result: branchResult,
    note: predicateOk
      ? `Predicate ${predicateName} ok → took then-branch ${thenName}`
      : `Predicate ${predicateName} failed → took else-branch ${elseName}`,
    topology: "cond(p, t, e) = if ok(p) then t else e",
  }, null, 2));

  if (!branchOk) Deno.exit(1);
}
