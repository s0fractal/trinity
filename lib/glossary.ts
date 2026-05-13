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

/** Resolve any handle (in any language) to its hex position.
 *  Two-pass: primary-handle match first, then any equal handle.
 *  Accepts both kind:5 (topological) and kind:05 (legacy) records. */
export async function resolveWord(word: string): Promise<string | null> {
  // Two-pass: collect all matches, then prefer primary
  const primaryMatches: string[] = [];
  const anyMatches: string[] = [];
  for await (const r of readGlossaryLines()) {
    const kind = r["00"];
    if (kind === "5") {
      // Topological form
      const handles = Array.isArray(r["02"]) ? r["02"] : [];
      const position = r["04"];
      if (typeof position !== "string") continue;
      if (handles[0] === word) primaryMatches.push(position);
      if (handles.includes(word)) anyMatches.push(position);
    } else if (kind === "05") {
      // Legacy form
      const position = r["12"];
      if (typeof position !== "string") continue;
      if (r["01"] === word) primaryMatches.push(position);
      const tr = (r["10"] ?? {}) as Record<string, string>;
      const synonyms: string[] = [r["01"] as string];
      for (const lang of Object.keys(tr)) {
        for (const syn of String(tr[lang]).split("/")) {
          synonyms.push(syn.trim());
        }
      }
      if (synonyms.includes(word)) anyMatches.push(position);
    }
  }
  if (primaryMatches.length > 0) return primaryMatches[0];
  if (anyMatches.length > 0) return anyMatches[0];
  return null;
}

/** Load all substrate mappings for a given position.
 *  Accepts both kind:6 (topological) and kind:06 (legacy) records. */
export async function loadSubstrateMappings(position: string): Promise<SubstrateMapping[]> {
  const defs: SubstrateMapping[] = [];
  for await (const r of readGlossaryLines()) {
    const kind = r["00"];
    if (kind === "6") {
      // Topological form:
      //   02 = handles (multilingual substrate name array)
      //   03 = position this mapping serves
      //   04 = cwd
      //   05 = command
      //   09 = note
      if (r["03"] !== position) continue;
      const handles = Array.isArray(r["02"]) ? r["02"] : [];
      const cmd = r["05"] ? String(r["05"]).split(" ") : null;
      defs.push({
        name: String(handles[0] ?? ""),
        position: String(r["03"]),
        cwd: String(r["04"] ?? "."),
        cmd,
        note: String(r["09"] ?? ""),
      });
    } else if (kind === "06") {
      // Legacy form: 01=substrate, 02=position, 03=command, 04=cwd, 05=note
      if (r["02"] !== position) continue;
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
