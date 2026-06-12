#!/usr/bin/env -S deno run --allow-read --allow-write
// src/x0160_import_map_gen.ts — bare `import "foo.myc.md"`: the generated map.
// position: 0/160 → void(0) — foundation tooling beside the literate parser
// maturity: active
// horizon: none (bare-import map generation landed; consumption grows organically)
// skill_safe: yes
// hex_dipole: "5F 00 33 26 40 00 00 26"
// placement_policy: axis
// (character: void_infinity +0.75 PRIMARY — the map is the blank ground
//  itself, where a bare name becomes an address; foundation_container +0.50
//  — carries the address space; mirror_apex +0.40 — the map reflects the
//  src tree; triangle_build +0.30 — composes entries; completion_frontier
//  +0.30 — output is final form. Measured by claude-fable-5.)
//
// THE STEP THIS CLOSES (declared in x5510's header): the proxy serves
// extracted TS at `http://myc.md/src/<name>.myc.md`; deno.jsonc prefix-maps
// `myc.md/`. What was missing is the BARE form — `import "foo.myc.md"` —
// which import maps can only express as explicit per-name entries. This
// generator scans src/ for executable literate organs (.myc.md containing a
// ```typescript block) and emits a tracked, deterministic import map:
//
//   "x0888_skill.myc.md" → "http://myc.md/src/x0888_skill.myc.md"
//   "skill.myc.md"       → same (handle alias, only when unique across src/)
//
// Usage of the map: x5520_run_literate passes it to the child deno run
// automatically (with `deno task proxy` up and HTTP_PROXY pointed at it,
// the bare handle IS the function). Regenerate: `deno task import-map`.

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
export const IMPORT_MAP_PATH = join(HERE, "x0188_import_map.json");

// Handle alias only for clean organ names (x0888_skill.myc.md → skill.myc.md).
// Chords carry block/timestamp/voice segments after the coordinate — their
// "remainder" is not a handle, so they stay addressable by full name only.
const COORD_RE = /^x[0-9A-Fa-f]{4}_([^_]+)\.myc\.md$/;
const TS_BLOCK_RE = /```typescript\b/;

export interface GeneratedImportMap {
  imports: Record<string, string>;
}

/** Scan src/ for executable literate organs and build the bare-import map. */
export async function buildImportMap(
  srcDir: string = HERE,
): Promise<{ map: GeneratedImportMap; skippedAmbiguous: string[] }> {
  const fullNames: string[] = [];
  for await (const entry of Deno.readDir(srcDir)) {
    if (!entry.isFile || !entry.name.endsWith(".myc.md")) continue;
    const text = await Deno.readTextFile(join(srcDir, entry.name));
    if (!TS_BLOCK_RE.test(text)) continue;
    fullNames.push(entry.name);
  }
  fullNames.sort();

  // Handle aliases (name without the coordinate prefix) only when unique —
  // an ambiguous handle stays coordinate-only rather than guessing.
  const handleCount = new Map<string, number>();
  for (const name of fullNames) {
    const m = COORD_RE.exec(name);
    if (!m) continue;
    const handle = `${m[1]}.myc.md`;
    handleCount.set(handle, (handleCount.get(handle) ?? 0) + 1);
  }

  const imports: Record<string, string> = {
    // Keep the prefix bridge so explicit `myc.md/src/...` imports keep working
    // under this map too (it replaces, not merges with, deno.jsonc imports).
    "myc.md/": "http://myc.md/",
  };
  const skippedAmbiguous: string[] = [];
  for (const name of fullNames) {
    const target = `http://myc.md/src/${name}`;
    imports[name] = target;
    const m = COORD_RE.exec(name);
    if (!m) continue;
    const handle = `${m[1]}.myc.md`;
    if (handleCount.get(handle) === 1) {
      imports[handle] = target;
    } else if (!skippedAmbiguous.includes(handle)) {
      skippedAmbiguous.push(handle);
    }
  }
  return { map: { imports }, skippedAmbiguous };
}

async function main() {
  const { map, skippedAmbiguous } = await buildImportMap();
  await Deno.writeTextFile(
    IMPORT_MAP_PATH,
    JSON.stringify(map, null, 2) + "\n",
  );
  console.log(JSON.stringify({
    type: "import_map_gen",
    position: "0/160",
    written: "src/x0188_import_map.json",
    entries: Object.keys(map.imports).length,
    skipped_ambiguous_handles: skippedAmbiguous,
  }));
}

if (import.meta.main) {
  await main();
}
