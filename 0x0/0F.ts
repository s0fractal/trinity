#!/usr/bin/env -S deno run --allow-read
// 0x0/0F.ts — help (substrate self-introspection)
// position: 0/0F → foundation × frontier-edge
// search strategy: tier-1 canonical, tier-2 multilingual (same as runtime)

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const SUBSTRATE_ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const GLOSSARY_PATH = join(SUBSTRATE_ROOT, "0x0", "00.ndjson");

interface WordRec {
  canonical: string;
  position: string;
  translations: Record<string, string>;
  note: string;
}

async function fn_load_all(): Promise<{ words: WordRec[]; symbols: Map<string, any> }> {
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const words: WordRec[] = [];
  const symbols = new Map<string, any>();
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      if (r["00"] === "05") {
        words.push({
          canonical: r["01"],
          position: r["12"],
          translations: r["10"] ?? {},
          note: r["09"] ?? "",
        });
      } else if (r["00"] === "03") {
        symbols.set(r["01"], r);
      }
    } catch { /* skip */ }
  }
  return { words, symbols };
}

function fn_resolve(input: string, words: WordRec[]): WordRec | null {
  for (const r of words) if (r.canonical === input) return r;
  for (const r of words) {
    for (const lang of Object.keys(r.translations)) {
      const syns = r.translations[lang].split("/").map((s) => s.trim());
      if (syns.includes(input)) return r;
    }
  }
  return null;
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
  console.log("# substrate words (canonical, position, synonym count, exists):");
  for (const r of words) {
    const path = fn_position_to_path(r.position);
    const exists = (await fn_exists(path)) ? "✓" : "✗";
    const langs = Object.keys(r.translations);
    let total = 0;
    for (const l of langs) total += r.translations[l].split("/").length;
    console.log(`  ${exists} ${r.position.padEnd(8)} ${r.canonical.padEnd(10)} ${total} syn / ${langs.length} lang`);
  }
  console.log("");
  console.log("# detail: t help <any-synonym-any-language>");
}

async function fn_word_detail(target: string, words: WordRec[], symbols: Map<string, any>): Promise<void> {
  const r = fn_resolve(target, words);
  if (!r) {
    console.error(`# unknown word: ${target}`);
    Deno.exit(1);
  }
  const path = fn_position_to_path(r.position);
  const exists = await fn_exists(path);

  console.log(`canonical: ${r.canonical}`);
  if (target !== r.canonical) console.log(`matched:   ${target} (synonym)`);
  console.log(`position:  ${r.position}`);
  console.log(`path:      ${path}`);
  console.log(`status:    ${exists ? "✓ executable exists" : "✗ no executable"}`);
  console.log(`note:      ${r.note}`);

  console.log("\nsynonyms by language:");
  for (const lang of Object.keys(r.translations)) {
    console.log(`  ${lang}: ${r.translations[lang]}`);
  }

  console.log("\nsemantic decomposition:");
  const parts = r.position.split("/");
  for (const p of parts) {
    if (p.length === 1) {
      const sym = symbols.get(p);
      if (sym) {
        const base = sym["10"];
        console.log(`  ${p}: ${base?.en ?? "?"} / ${base?.uk ?? "?"}`);
      }
    } else {
      console.log(`  ${p}: byte-position`);
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
