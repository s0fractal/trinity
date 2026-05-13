#!/usr/bin/env -S deno run --allow-all
// 0x0/09.ts — repeat / loop / iterate
// position: 0/09 → foundation × completion/circle
// hex_dipole: "00 00 00 00 00 00 00 00"
// lifecycle_phase: 0
//
// Primitive: execute a step N times, collecting each result.
// Useful for stress tests, retry loops, or batch execution.
//
// Usage: t repeat 3 verify
//        → run verify 3 times, return all results
//
//        t repeat 5 health
//        → run health 5 times
//
// Returns receipt with iterations array and summary stats.

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
  if (args.length < 2) {
    console.log(JSON.stringify({
      type: "error",
      message: "Usage: t repeat <count> <position|word>",
    }));
    Deno.exit(1);
  }

  const countRaw = args[0];
  const target = args[1];
  const count = parseInt(countRaw, 10);

  if (isNaN(count) || count < 1) {
    console.log(JSON.stringify({
      type: "error",
      message: `Invalid count: ${countRaw} (must be positive integer)`,
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

  const iterations: any[] = [];
  let firstError: number | null = null;

  for (let i = 0; i < count; i++) {
    const result = await runStep(pos);
    iterations.push({
      index: i,
      result,
      ok: !isError(result),
    });
    if (firstError === null && isError(result)) {
      firstError = i;
    }
  }

  const errors = iterations.filter((it) => !it.ok).length;

  console.log(JSON.stringify({
    type: "repeat",
    action: "iterate",
    target,
    resolved: pos,
    requested_count: count,
    actual_count: iterations.length,
    errors,
    first_error_at: firstError,
    overall: errors === 0 ? "passed" : "failed",
    iterations,
    note: errors === 0
      ? `All ${count} iterations passed`
      : `${errors}/${count} iterations failed (first at ${firstError})`,
    topology: "repeat(n, f) = [f(), f(), ...] n times",
  }, null, 2));

  if (errors > 0) Deno.exit(1);
}
