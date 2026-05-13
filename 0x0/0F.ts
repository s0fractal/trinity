#!/usr/bin/env -S deno run --allow-read
// 0x0/0F.ts — help (substrate self-introspection)
// position: 0/0F → foundation × frontier-edge (show boundary/info)
// words mapped here: help, допомога (ukrainian synonym)
//
// No arg: list all words clustered by position (shows synonym groups)
// With arg: show specific word's details + co-located synonyms

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const SUBSTRATE_ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const GLOSSARY_PATH = join(SUBSTRATE_ROOT, "0x0", "00.ndjson");

interface WordRec {
  word: string;
  pos: string;
  note: string;
}

async function fn_load_all(): Promise<{ words: WordRec[]; symbols: Map<string, any>; projections: any[] }> {
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const words: WordRec[] = [];
  const symbols = new Map<string, any>();
  const projections: any[] = [];
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      if (r["00"] === "05") words.push({ word: r["01"], pos: r["12"], note: r["09"] ?? "" });
      else if (r["00"] === "03") symbols.set(r["01"], r);
      else if (r["00"] === "04") projections.push(r);
    } catch { /* skip */ }
  }
  return { words, symbols, projections };
}

function fn_position_to_path(pos: string): string {
  const parts = pos.split("/");
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

async function fn_list_clustered(words: WordRec[]): Promise<void> {
  // group by position to show synonym clusters
  const byPos = new Map<string, WordRec[]>();
  for (const w of words) {
    if (!byPos.has(w.pos)) byPos.set(w.pos, []);
    byPos.get(w.pos)!.push(w);
  }
  const sortedPos = [...byPos.keys()].sort();
  console.log("# substrate words clustered by position:");
  for (const pos of sortedPos) {
    const cluster = byPos.get(pos)!;
    const path = fn_position_to_path(pos);
    const exists = await fn_exists(path) ? "✓" : "✗";
    const synonyms = cluster.map((c) => c.word).join(", ");
    console.log(`  ${exists} ${pos.padEnd(8)} ${synonyms}`);
  }
  console.log("");
  console.log("# show details: t help <word>");
}

async function fn_word_detail(target: string, words: WordRec[], symbols: Map<string, any>): Promise<void> {
  const entry = words.find((w) => w.word === target);
  if (!entry) {
    console.error(`# unknown word: ${target}`);
    Deno.exit(1);
  }
  const path = fn_position_to_path(entry.pos);
  const exists = await fn_exists(path);

  console.log(`word:     ${entry.word}`);
  console.log(`position: ${entry.pos}`);
  console.log(`path:     ${path}`);
  console.log(`status:   ${exists ? "✓ executable exists" : "✗ no executable at path"}`);
  console.log(`note:     ${entry.note}`);

  // synonyms at same position
  const syns = words.filter((w) => w.pos === entry.pos && w.word !== entry.word);
  if (syns.length > 0) {
    console.log(`synonyms: ${syns.map((s) => s.word).join(", ")}`);
  }

  // referenced symbols (decompose position)
  const parts = entry.pos.split("/");
  console.log("\n# semantic decomposition:");
  for (const p of parts) {
    if (p.length === 1) {
      const sym = symbols.get(p);
      if (sym) {
        const base = sym["10"];
        console.log(`  ${p}: ${base?.en ?? "?"} / ${base?.uk ?? "?"}`);
      }
    } else {
      console.log(`  ${p}: byte/sub-position`);
    }
  }
}

if (import.meta.main) {
  const { words, symbols } = await fn_load_all();
  const [target] = Deno.args;
  if (!target) {
    await fn_list_clustered(words);
  } else {
    await fn_word_detail(target, words, symbols);
  }
}
