#!/usr/bin/env -S deno run --allow-read
// 0x0/0F.ts — help (substrate self-introspection)
// position: 0/0F → foundation × frontier-edge
// hex_dipole: "00 00 00 00 59 00 00 59"
// lifecycle_phase: 1
//
// Returns structured help payload. Dispatcher (0x0/01.ts) renders for TTY.
// No arg: mode=list. With arg: mode=detail (with semantic decomposition).

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

if (import.meta.main) {
  const { words, symbols } = await fn_load_all();
  const [target] = Deno.args;

  if (!target) {
    // list mode
    const records = await Promise.all(words.map(async (r) => {
      const path = fn_position_to_path(r.position);
      const langs = Object.keys(r.translations);
      let total = 0;
      for (const l of langs) total += r.translations[l].split("/").length;
      return {
        canonical: r.canonical,
        position: r.position,
        synonym_count: total,
        lang_count: langs.length,
        exists: await fn_exists(path),
      };
    }));
    console.log(JSON.stringify({ type: "help", mode: "list", records }));
  } else {
    // detail mode
    const r = fn_resolve(target, words);
    if (!r) {
      console.log(JSON.stringify({ type: "error", message: `unknown word: ${target}` }));
      Deno.exit(1);
    }
    const path = fn_position_to_path(r.position);
    const exists = await fn_exists(path);
    const decomposition: Record<string, string> = {};
    for (const p of r.position.split("/")) {
      if (p.length === 1) {
        const sym = symbols.get(p);
        if (sym) {
          const base = sym["10"];
          decomposition[p] = `${base?.en ?? "?"} / ${base?.uk ?? "?"}`;
        }
      } else {
        decomposition[p] = "byte-position";
      }
    }
    console.log(JSON.stringify({
      type: "help",
      mode: "detail",
      matched: target,
      record: {
        canonical: r.canonical,
        position: r.position,
        path,
        exists,
        note: r.note,
        translations: r.translations,
      },
      decomposition,
    }));
  }
}
