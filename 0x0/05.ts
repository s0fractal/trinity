#!/usr/bin/env -S deno run --allow-all
// 0x0/05.ts — pipe / flow / conditional compose
// position: 0/05 → foundation × hand/action
// hex_dipole: "00 00 00 00 00 00 00 00"
// lifecycle_phase: 0
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

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const GLOSSARY_PATH = join(dirname(fromFileUrl(import.meta.url)), "..", "0x0", "00.ndjson");
const SUBSTRATE_ROOT = join(dirname(fromFileUrl(import.meta.url)), "..");

async function fn_resolve_word(word: string): Promise<string | null> {
  try {
    const text = await Deno.readTextFile(GLOSSARY_PATH);
    for (const line of text.trim().split("\n")) {
      try {
        const r = JSON.parse(line);
        if (r["00"] === "05" && r["01"] === word) return r["12"];
      } catch { /* skip */ }
    }
  } catch { /* glossary missing */ }
  return null;
}

function fn_position_to_path(pos: string): string {
  const parts = pos.split("/");
  const top = `0x${parts[0]}`;
  const mid = parts.slice(1, -1);
  const file = parts[parts.length - 1] + ".ts";
  return join(SUBSTRATE_ROOT, top, ...mid, file);
}

async function fn_run_step(pos: string): Promise<any> {
  const path = fn_position_to_path(pos);
  try {
    await Deno.stat(path);
  } catch {
    return { type: "error", position: pos, message: `no executable at ${path}` };
  }
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", path],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  const raw = new TextDecoder().decode(out.stdout).trim();
  try {
    return JSON.parse(raw);
  } catch {
    return { type: "raw", position: pos, code: out.code, stdout: raw };
  }
}

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
      const resolved = await fn_resolve_word(step);
      if (!resolved) {
        lastResult = { type: "error", message: `Unknown: ${step}` };
        stoppedAt = step;
        break;
      }
      pos = resolved;
    }

    lastResult = await fn_run_step(pos);
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
