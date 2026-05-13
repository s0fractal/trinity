#!/usr/bin/env -S deno run --allow-all
// 0x0/04.ts — each / for-each / sequential apply
// position: 0/04 → foundation × cardinal/four-square
// hex_dipole: "00 00 00 00 00 00 00 00"
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
      const resolved = await fn_resolve_word(step);
      if (!resolved) {
        results.push({ type: "error", message: `Unknown: ${step}` });
        continue;
      }
      pos = resolved;
    }
    results.push(await fn_run_step(pos));
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
