#!/usr/bin/env -S deno run --allow-all
// 0x0/0C.ts — any / race / first-success
// position: 0/0C → foundation × container/cycle
// hex_dipole: "00 00 00 00 00 00 00 00"
// lifecycle_phase: 0
//
// Primitive: run steps in parallel, return the first success.
// If all fail, return the last error.
//
// Usage: t any verify health cross-verify
//        → run all in parallel, return first that passes
//
// This is the speculative execution primitive.
// Try multiple paths, take the first that works.

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
  const steps = Deno.args;
  if (steps.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message: "Usage: t any <position|word>...",
    }));
    Deno.exit(1);
  }

  async function resolve(pos: string): Promise<string | null> {
    if (pos.match(/^[0-9A-Fa-f](\/[0-9A-Fa-f])+$/)) return pos;
    return await resolveWord(pos);
  }

  const resolved = await Promise.all(
    steps.map(async (name) => ({ name, pos: await resolve(name) }))
  );

  const unknown = resolved.filter((r) => r.pos === null);
  if (unknown.length > 0) {
    console.log(JSON.stringify({
      type: "error",
      message: `Unknown: ${unknown.map((u) => u.name).join(", ")}`,
    }));
    Deno.exit(1);
  }

  // Run all in parallel — we still wait for all to settle,
  // but we record which succeeded first (by array order as tie-break).
  const results = await Promise.all(
    resolved.map((r) => runStep(r.pos!))
  );

  let firstSuccessIndex = -1;
  for (let i = 0; i < results.length; i++) {
    if (!isError(results[i])) {
      firstSuccessIndex = i;
      break;
    }
  }

  const receipt = {
    type: "any",
    action: "race",
    steps,
    resolved: resolved.map((r) => ({ name: r.name, position: r.pos })),
    count: results.length,
    first_success_at: firstSuccessIndex >= 0 ? firstSuccessIndex : null,
    overall: firstSuccessIndex >= 0 ? "passed" : "failed",
    results,
    note: firstSuccessIndex >= 0
      ? `First success at ${steps[firstSuccessIndex]} (index ${firstSuccessIndex})`
      : `All ${steps.length} steps failed`,
    topology: "any(a, b, ...) = first ok in parallel set",
  };

  console.log(JSON.stringify(receipt, null, 2));
  if (firstSuccessIndex < 0) Deno.exit(1);
}
