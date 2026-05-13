#!/usr/bin/env -S deno run --allow-all
// 0x0/08.ts — join / zip / parallel collect
// position: 0/08 → foundation × infinity/all
// hex_dipole: "00 00 00 00 00 00 00 00"
// lifecycle_phase: 0
//
// Primitive: execute steps in parallel, collect all results.
// Unlike `all` which reads substrate registry, join takes
// explicit positions/words and runs them as a parallel bundle.
//
// Usage: t join verify health
//        t join 5/A 6/A cross-verify
//        t join (t all verify) health  ← compose
//
// Returns unified receipt with all results preserved.

import { resolveWord } from "../lib/glossary.ts";
import { runStep } from "../lib/runner.ts";

if (import.meta.main) {
  const steps = Deno.args;
  if (steps.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message: "Usage: t join <position|word>...",
    }));
    Deno.exit(1);
  }

  async function resolve(pos: string): Promise<string | null> {
    if (pos.match(/^[0-9A-Fa-f](\/[0-9A-Fa-f])+$/)) return pos;
    return await resolveWord(pos);
  }

  // Resolve all positions first (sequential, fast)
  const resolved: { name: string; pos: string | null }[] = [];
  for (const step of steps) {
    resolved.push({ name: step, pos: await resolve(step) });
  }

  const unknown = resolved.filter((r) => r.pos === null);
  if (unknown.length > 0) {
    console.log(JSON.stringify({
      type: "error",
      message: `Unknown: ${unknown.map((u) => u.name).join(", ")}`,
    }));
    Deno.exit(1);
  }

  // Run all in parallel
  const results = await Promise.all(
    resolved.map((r) => runStep(r.pos!))
  );

  const errors = results.filter((r) =>
    r.type === "error" || r.type === "validation_error" ||
    r.summary?.overall === "failed" || r.overall === "failed" ||
    (r.code !== undefined && r.code !== 0)
  ).length;

  console.log(JSON.stringify({
    type: "join",
    action: "parallel-collect",
    steps,
    resolved: resolved.map((r) => ({ name: r.name, position: r.pos })),
    count: results.length,
    errors,
    overall: errors === 0 ? "passed" : "failed",
    results,
    note: `Parallel execution of ${steps.length} steps, all results collected`,
    topology: "join(a, b, ...) = [a(), b(), ...] evaluated in parallel",
  }, null, 2));

  if (errors > 0) Deno.exit(1);
}
