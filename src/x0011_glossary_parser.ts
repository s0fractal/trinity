// src/x0011_glossary_parser.ts — shared glossary parser
// maturity: active
// skill_safe: yes
// Coordinate 0011 = void/primitives → singular → singular → void (primitive of identity registry).
// Centralizes glossary access so organs don't duplicate the line-by-line parse loop.
// Importable from any organ; the convention "no imports between executables" was retired
// when all infrastructure moved into src/ with explicit coordinates.

import { dirname, fromFileUrl, join } from "@std/path";

function getGlossaryPath(): string {
  return join(dirname(fromFileUrl(import.meta.url)), "x0001_glossary.ndjson");
}

export interface WordRecord {
  primary: string;
  handles: string[];
  position: string;
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

async function* readGlossaryLines(): AsyncGenerator<
  Record<string, unknown>,
  void,
  unknown
> {
  try {
    const text = await Deno.readTextFile(getGlossaryPath());
    for (const line of text.trim().split("\n")) {
      try {
        const value: unknown = JSON.parse(line);
        if (value && typeof value === "object" && !Array.isArray(value)) {
          yield value as Record<string, unknown>;
        }
      } catch { /* skip bad lines */ }
    }
  } catch { /* glossary missing — yield nothing */ }
}

/** Load command handles once in the shape shared by the dispatcher and
 * composition organs. File order is preserved because it is the deterministic
 * tie-break for equal non-primary handles. */
export async function loadWordRecords(): Promise<WordRecord[]> {
  const records: WordRecord[] = [];
  for await (const r of readGlossaryLines()) {
    if (r["00"] !== "5") continue;
    if (!Array.isArray(r["02"]) || typeof r["04"] !== "string") continue;
    const handles = r["02"].filter((value: unknown): value is string =>
      typeof value === "string"
    );
    records.push({
      primary: handles[0] ?? "",
      handles,
      position: r["04"],
    });
  }
  return records;
}

/** Resolve against an already-loaded registry. Primary names win; otherwise
 * the first equal handle in glossary order wins. */
export function resolveWordRecord(
  word: string,
  records: WordRecord[],
): WordRecord | null {
  return records.find((record) => record.primary === word) ??
    records.find((record) => record.handles.includes(word)) ?? null;
}

/** Resolve any handle (in any language) to its hex position.
 *  Two-pass: primary-handle match first, then any equal handle.
 *  Reads kind:5 records (topological form). */
export async function resolveWord(word: string): Promise<string | null> {
  return resolveWordRecord(word, await loadWordRecords())?.position ?? null;
}

/** Load substrate mappings for a given position.
 *  Reads kind:6 records (topological form).
 *  Slot semantics: 02=handles, 03=position served, 04=cwd, 05=command, 09=note. */
export async function loadSubstrateMappings(
  position: string,
): Promise<SubstrateMapping[]> {
  const defs: SubstrateMapping[] = [];
  for await (const r of readGlossaryLines()) {
    if (r["00"] !== "6") continue;
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
  }
  return defs;
}

/** Load all type:07 schema definitions. */
export async function loadSchemas(): Promise<Map<string, string[]>> {
  const schemas = new Map<string, string[]>();
  for await (const r of readGlossaryLines()) {
    if (r["00"] === "07" && r["01"] && r["02"]) {
      schemas.set(
        String(r["01"]),
        String(r["02"]).split(",").map((f) => f.trim()),
      );
    }
  }
  return schemas;
}

/** Validate a payload against a loaded schema. */
export function validatePayload(
  payload: unknown,
  type: string,
  schemas: Map<string, string[]>,
): { ok: boolean; missing: string[]; actual: string[] } {
  const required = schemas.get(type);
  if (!required) return { ok: true, missing: [], actual: [] };
  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : {};
  const actual = Object.keys(record);
  const missing = required.filter((f) => !actual.includes(f));
  return { ok: missing.length === 0, missing, actual };
}
