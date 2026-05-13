#!/usr/bin/env -S deno run --allow-read --allow-run
// 0x0/01.ts — t (the runtime dispatcher)
// position: 0/01 → foundation/byte01
// reads 0x0/00.ndjson (glossary), resolves word→hex position, executes
//
// Resolution strategy:
//   1. canonical match (record's 01 field)
//   2. multilingual search (record's 10 field, '/' delimited per language)
//
// Position string "5/A" → SUBSTRATE_ROOT/0x5/A.ts
// Position "0/01"        → SUBSTRATE_ROOT/0x0/01.ts
// Position "5/A/B"       → SUBSTRATE_ROOT/0x5/A/B.ts

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const SUBSTRATE_ROOT = dirname(HERE);
const GLOSSARY_PATH = join(SUBSTRATE_ROOT, "0x0", "00.ndjson");

interface WordRec {
  canonical: string;
  position: string;
  translations: Record<string, string>;
}

async function fn_load_words(): Promise<WordRec[]> {
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const out: WordRec[] = [];
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      if (r["00"] !== "05") continue;
      out.push({
        canonical: r["01"],
        position: r["12"],
        translations: r["10"] ?? {},
      });
    } catch { /* skip */ }
  }
  return out;
}

function fn_resolve_word(input: string, records: WordRec[]): WordRec | null {
  // tier 1: canonical exact match
  for (const r of records) {
    if (r.canonical === input) return r;
  }
  // tier 2: multilingual search through 10 field
  for (const r of records) {
    for (const lang of Object.keys(r.translations)) {
      const synonyms = r.translations[lang].split("/").map((s) => s.trim());
      if (synonyms.includes(input)) return r;
    }
  }
  return null;
}

function fn_position_to_path(pos: string): string {
  const parts = pos.split("/");
  if (parts.length < 2) throw new Error(`position needs depth≥2: ${pos}`);
  const top = `0x${parts[0]}`;
  const mid = parts.slice(1, -1);
  const file = parts[parts.length - 1] + ".ts";
  return join(SUBSTRATE_ROOT, top, ...mid, file);
}

async function fn_exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function fn_dispatch(word: string, rest: string[]): Promise<number> {
  const records = await fn_load_words();
  const found = fn_resolve_word(word, records);

  if (!found) {
    console.error(`# unknown word: ${word}`);
    console.error(`# canonical words: ${records.map((r) => r.canonical).join(", ")}`);
    return 1;
  }

  const path = fn_position_to_path(found.position);
  // diagnostic if word ≠ canonical (matched via translation)
  if (word !== found.canonical) {
    console.error(`# ${word} (synonym of ${found.canonical}) → ${found.position} → ${path}`);
  } else {
    console.error(`# ${word} → ${found.position} → ${path}`);
  }

  if (!(await fn_exists(path))) {
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
  const records = await fn_load_words();
  console.log("# substrate words (canonical → position → path):");
  for (const r of records) {
    const path = fn_position_to_path(r.position);
    const exists = (await fn_exists(path)) ? "✓" : "✗";
    const langs = Object.keys(r.translations);
    const synonymCount = langs.reduce((sum, l) => sum + r.translations[l].split("/").length, 0);
    console.log(
      `  ${exists} ${r.position.padEnd(8)} ${r.canonical.padEnd(10)} (${synonymCount} synonyms across ${langs.length} langs)`,
    );
  }
  console.log("");
  console.log("# show details (any synonym in any lang): t help <word>");
}

if (import.meta.main) {
  const [word, ...rest] = Deno.args;
  if (!word) {
    await fn_list();
    Deno.exit(0);
  }
  Deno.exit(await fn_dispatch(word, rest));
}
