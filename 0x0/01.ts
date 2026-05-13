#!/usr/bin/env -S deno run --allow-read --allow-run
// 0x0/01.ts — t (the runtime dispatcher)
// position: 0/01 → foundation/byte01
// reads 0x0/00.ndjson (glossary), resolves word→hex position, executes
//
// Tier 1 only: explicit glossary lookup. Unknown words → error (no BLAKE3 fallback yet).
//
// Pattern: position "5/A" → path 0x5/A.ts
//          position "0/01" → path 0x0/01.ts
//          position "5/A/B" → path 0x5/A/B.ts

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const SUBSTRATE_ROOT = dirname(HERE);
const GLOSSARY_PATH = join(SUBSTRATE_ROOT, "0x0", "00.ndjson");

async function fn_load_words(): Promise<Map<string, string>> {
  // reads glossary, returns map word → position string
  // tracks records with 00:"05" (word-entry per glossary code 18)
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const map = new Map<string, string>();
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      if (r["00"] === "05") map.set(r["01"], r["12"]);
    } catch { /* skip */ }
  }
  return map;
}

function fn_position_to_path(pos: string): string {
  // "5/A"   → SUBSTRATE_ROOT/0x5/A.ts
  // "0/01"  → SUBSTRATE_ROOT/0x0/01.ts
  // "5/A/B" → SUBSTRATE_ROOT/0x5/A/B.ts
  const parts = pos.split("/");
  if (parts.length < 2) throw new Error(`position needs depth≥2: ${pos}`);
  const top = `0x${parts[0]}`;
  const mid = parts.slice(1, -1);
  const file = parts[parts.length - 1] + ".ts";
  return join(SUBSTRATE_ROOT, top, ...mid, file);
}

async function fn_dispatch(word: string, rest: string[]): Promise<number> {
  const words = await fn_load_words();
  const pos = words.get(word);

  if (!pos) {
    console.error(`# unknown word: ${word}`);
    console.error(`# learned: ${[...words.keys()].join(", ")}`);
    return 1;
  }

  const path = fn_position_to_path(pos);
  console.error(`# ${word} → ${pos} → ${path}`);

  try {
    await Deno.stat(path);
  } catch {
    console.error(`# no executable at ${path}`);
    return 2;
  }

  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", path, ...rest],
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();
  const status = await proc.status;
  return status.code;
}

async function fn_list(): Promise<void> {
  const words = await fn_load_words();
  console.log("# substrate words (word → position → path):");
  for (const [word, pos] of words) {
    const path = fn_position_to_path(pos);
    let exists = "";
    try {
      await Deno.stat(path);
      exists = "✓";
    } catch {
      exists = "✗";
    }
    console.log(`  ${exists} ${word.padEnd(10)} ${pos.padEnd(8)} ${path}`);
  }
}

if (import.meta.main) {
  const [word, ...rest] = Deno.args;
  if (!word) {
    await fn_list();
    Deno.exit(0);
  }
  Deno.exit(await fn_dispatch(word, rest));
}
