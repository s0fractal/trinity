// lib/glossary.ts — shared glossary parser
// Hex substrate infrastructure: NOT an executable.
// Centralizes 00.ndjson access so executables don't duplicate
// the same line-by-line parse loop in every file.
//
// Design note: This is a deliberate exception to "no imports between
// executables" — lib/ is infrastructure, not substrate. Executables
// may import it to avoid ~200 lines of duplication.

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

function getGlossaryPath(): string {
  // lib/glossary.ts is at lib/glossary.ts; glossary is at 0x0/00.ndjson
  return join(dirname(fromFileUrl(import.meta.url)), "..", "0x0", "00.ndjson");
}

export interface WordRecord {
  word: string;
  position: string;
  synonyms: Record<string, string>;
  dipole: string;
  note: string;
}

export interface SubstrateMapping {
  name: string;
  position: string;
  cwd: string;
  cmd: string[] | null;
  note: string;
}

export interface SchemaRecord {
  type: string;
  fields: string[];
}

async function* readGlossaryLines(): AsyncGenerator<any, void, unknown> {
  try {
    const text = await Deno.readTextFile(getGlossaryPath());
    for (const line of text.trim().split("\n")) {
      try {
        yield JSON.parse(line);
      } catch { /* skip bad lines */ }
    }
  } catch { /* glossary missing — yield nothing */ }
}

/** Resolve a canonical word to its hex position (field 12). */
export async function resolveWord(word: string): Promise<string | null> {
  for await (const r of readGlossaryLines()) {
    if (r["00"] === "05" && r["01"] === word) return String(r["12"]);
  }
  return null;
}

/** Load all type:06 substrate mappings for a given position. */
export async function loadSubstrateMappings(position: string): Promise<SubstrateMapping[]> {
  const defs: SubstrateMapping[] = [];
  for await (const r of readGlossaryLines()) {
    if (r["00"] === "06" && r["02"] === position) {
      const cmd = r["03"] ? String(r["03"]).split(" ") : null;
      defs.push({
        name: String(r["01"]),
        position: String(r["02"]),
        cwd: String(r["04"] ?? "."),
        cmd,
        note: String(r["05"] ?? ""),
      });
    }
  }
  return defs;
}

/** Load all type:07 schema definitions. */
export async function loadSchemas(): Promise<Map<string, string[]>> {
  const schemas = new Map<string, string[]>();
  for await (const r of readGlossaryLines()) {
    if (r["00"] === "07" && r["01"] && r["02"]) {
      schemas.set(String(r["01"]), String(r["02"]).split(",").map((f) => f.trim()));
    }
  }
  return schemas;
}

/** Validate a payload against a loaded schema. */
export function validatePayload(payload: any, type: string, schemas: Map<string, string[]>): { ok: boolean; missing: string[]; actual: string[] } {
  const required = schemas.get(type);
  if (!required) return { ok: true, missing: [], actual: [] };
  const actual = Object.keys(payload || {});
  const missing = required.filter((f) => !actual.includes(f));
  return { ok: missing.length === 0, missing, actual };
}
