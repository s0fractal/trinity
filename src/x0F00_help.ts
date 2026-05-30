#!/usr/bin/env -S deno run --allow-read
// src/x0F00_help.ts — help (substrate self-introspection)
// position: 0/0F → foundation × frontier-edge
// maturity: active
// skill_safe: yes
// hex_dipole: "00 00 00 00 59 00 00 59"
//   foundation_container+0.70, completion_frontier+0.70 (Kimi: container/edge view)
//   bucket 0/0F: primary axis foundation (4) or completion (7), bucket 0 ← MISMATCH
//                secondary '0F' → hex F = axis 7 negative pole, dipole +0.70 on
//                axis 7 ← PAIR-MATCH (sign-opposed) — partial composite rescue
//   alt reading (claude): help is mirror_apex-heavy (reflects substrate state);
//                         not re-measured; Kimi's reading kept
//   audit phase 1 annotation: claude-opus-4-7-1m, anchor block 949260
// lifecycle_phase: 1
// placement_policy: composite
//
// Returns structured help payload. Dispatcher (0x0/01.ts) renders for TTY.
// No arg: mode=list. With arg: mode=detail (with semantic decomposition).

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  exists as fn_exists,
  positionToPath as fn_position_to_path,
} from "./x0010_dispatch_runner.ts";

const SUBSTRATE_ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const GLOSSARY_PATH = join(SUBSTRATE_ROOT, "src", "x0001_glossary.ndjson");

interface WordRec {
  primary: string;
  handles: string[];
  position: string;
  note: string;
}

async function fn_load_all(): Promise<
  { words: WordRec[]; symbols: Map<string, any> }
> {
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const words: WordRec[] = [];
  const symbols = new Map<string, any>();
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      const kind = r["00"];
      if (kind === "5") {
        if (Array.isArray(r["02"]) && typeof r["04"] === "string") {
          const handles = (r["02"] as string[]).filter((s) =>
            typeof s === "string"
          );
          words.push({
            primary: handles[0] ?? "",
            handles,
            position: r["04"],
            note: (r["09"] as string) ?? "",
          });
        }
      } else if (kind === "03") {
        symbols.set(r["01"], r);
      }
    } catch { /* skip */ }
  }
  return { words, symbols };
}

function fn_resolve(input: string, words: WordRec[]): WordRec | null {
  // Primary-first resolution, then any handle (see 0x0/01.ts comment)
  for (const r of words) {
    if (r.primary === input) return r;
  }
  for (const r of words) {
    if (r.handles.includes(input)) return r;
  }
  return null;
}

// Position→path + exists imported from x0010_dispatch_runner: single
// source of truth for flat-src resolution. Pre-flat-src this organ had
// its own 0xN/M-style resolver; after 2026-05-18 migration that
// resolver always returned false (architect's 2026-05-23 audit found
// it). Reusing the dispatcher's resolver keeps help in sync with
// actual t-dispatch behavior.

if (import.meta.main) {
  const { words, symbols } = await fn_load_all();
  const target = Deno.args.find((arg) => !arg.startsWith("--"));

  if (!target) {
    // list mode
    const records = await Promise.all(words.map(async (r) => {
      const path = fn_position_to_path(r.position);
      return {
        primary: r.primary,
        position: r.position,
        handles_count: r.handles.length,
        exists: await fn_exists(path),
      };
    }));
    console.log(JSON.stringify({ type: "help", mode: "list", records }));
  } else {
    // detail mode
    const r = fn_resolve(target, words);
    if (!r) {
      console.log(
        JSON.stringify({ type: "error", message: `unknown word: ${target}` }),
      );
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
        primary: r.primary,
        handles: r.handles,
        position: r.position,
        path,
        exists,
        note: r.note,
      },
      decomposition,
    }));
  }
}
