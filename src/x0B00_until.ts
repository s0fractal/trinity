#!/usr/bin/env -S deno run --allow-all
// src/x0B00_until.ts — until / retry / loop-until-success
// position: 0/0B → foundation × edge/eleven
// hex_dipole: "00 33 26 00 00 40 00 59"
//   completion_frontier+0.70 (PRIMARY: until IS termination condition)
//   action_decision+0.50 (retry body)
//   first_penultimate+0.40 (approaches-completion cyclic),
//   mirror_apex+0.30
//   bucket 0/0B: primary axis completion (7), bucket 0 ← MISMATCH (projection)
//                secondary '0B' → hex B = axis 3 negative pole, dipole 0 on
//                axis 3 ← does not rescue
//                belongs at 0xF/... or 0x7/... under projection reading
//   measured by claude-opus-4-7-1m, anchor block 949260, audit phase 1
// lifecycle_phase: 0
// placement_policy: tier
//
// Primitive: retry a step until it succeeds or max retries exhausted.
// Useful for flaky operations, eventual consistency checks,
// or stress-test recovery.
//
// Usage: t until verify
//        → retry verify until passed (max 10, delay 1s)
//
//        t until --max 5 --delay 500 health
//        → retry health up to 5 times, 500ms between attempts
//
// Returns the first successful result, or last error if all fail.

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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

if (import.meta.main) {
  const args = [...Deno.args];

  const maxIdx = args.indexOf("--max");
  const delayIdx = args.indexOf("--delay");

  const maxRetries = maxIdx >= 0 ? parseInt(args[maxIdx + 1], 10) : 10;
  const delayMs = delayIdx >= 0 ? parseInt(args[delayIdx + 1], 10) : 1000;

  const exclude = new Set<number>();
  if (maxIdx >= 0) { exclude.add(maxIdx); exclude.add(maxIdx + 1); }
  if (delayIdx >= 0) { exclude.add(delayIdx); exclude.add(delayIdx + 1); }
  const filtered = args.filter((_, i) => !exclude.has(i));

  const target = filtered[0];

  if (!target) {
    console.log(JSON.stringify({
      type: "error",
      message: "Usage: t until [--max N] [--delay MS] <position|word>",
    }));
    Deno.exit(1);
  }

  let pos = target;
  if (!target.match(/^[0-9A-Fa-f](\/[0-9A-Fa-f])+$/)) {
    const resolved = await resolveWord(target);
    if (!resolved) {
      console.log(JSON.stringify({ type: "error", message: `Unknown: ${target}` }));
      Deno.exit(1);
    }
    pos = resolved;
  }

  const attempts: any[] = [];
  let finalResult: any = null;
  let successAt: number | null = null;

  for (let i = 0; i < maxRetries; i++) {
    const result = await runStep(pos);
    attempts.push({ index: i, result, ok: !isError(result) });
    if (!isError(result)) {
      finalResult = result;
      successAt = i;
      break;
    }
    finalResult = result;
    if (i < maxRetries - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const receipt = {
    type: "until",
    action: "retry-until-success",
    target,
    resolved: pos,
    max_retries: maxRetries,
    delay_ms: delayMs,
    attempts: attempts.length,
    success_at: successAt,
    overall: successAt !== null ? "passed" : "failed",
    final_result: finalResult,
    note: successAt !== null
      ? `Succeeded at attempt ${successAt + 1}/${attempts.length}`
      : `Failed after ${attempts.length} attempts`,
    topology: "until(f, max, delay) = retry f until ok or exhausted",
  };

  console.log(JSON.stringify(receipt, null, 2));
  if (successAt === null) Deno.exit(1);
}
