#!/usr/bin/env -S deno run -A
// src/x5400_validate_schemas.ts — validate_schemas (Action + Foundation)
// position: 5/4 → action(5) × foundation(4)
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "26 26 26 26 59 6C 26 26"
// placement_policy: axis
//
// validate_schemas.ts — validate substrate artifacts against contracts/schema/*.json
//
// Walks chord surface files and validates each chord's YAML frontmatter against
// contracts/schema/chord.schema.json. Validates src/x5288_cognition_recommendation.latest.myc.json
// against recommendation.schema.json. Reports pass/fail counts and the first few errors.
//
// Adoption: this is a soft-validation pass. Failures are surfaced but do not block.
// Chords emitted before the schema landing receipt are grandfathered by default.
// Strict mode fails only on non-grandfathered failures.

import { parse as parseYaml } from "jsr:@std/yaml@1.0.5";
import { parseArgs } from "jsr:@std/cli@1.0.13/parse-args";
import Ajv2020Module from "npm:ajv@8.17.1/dist/2020.js";
import { listChordSurfaceFiles } from "./x2F21_chord_surface.ts";
import {
  buildIndex,
  chordRefs,
  defaultRoots,
  type Index,
} from "./x2F30_fqdn_resolver.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const DEFAULT_GRANDFATHER_BEFORE = "2026-05-12T130546Z";

interface ValidationResult {
  total: number;
  passed: number;
  failed: number;
  grandfathered: number;
  enforceFailed: number;
  aliasesResolved: number;
  errors: ValidationError[];
  grandfatheredErrors: ValidationError[];
}

export type DebtCategory =
  | "parse_corruption"
  | "identity_debt"
  | "shape_debt"
  | "link_rot";

interface ValidationError {
  path: string;
  message: string;
  category: DebtCategory;
  // Validation is intentionally non-actuating. Historical records are repaired
  // by an append-only correction/alias, never by rewriting their signed bytes.
  repair_policy: "supersede_or_alias_never_rewrite";
}

interface ChordFile {
  path: string;
  relPath: string;
}

type AjvError = {
  instancePath?: string;
  message?: string;
  params?: { missingProperty?: string };
};

type AjvValidator = {
  errors?: AjvError[] | null;
  (data: unknown): boolean;
};

type AjvInstance = {
  compile(schema: unknown): AjvValidator;
};

type AjvConstructor = new (
  options: { allErrors: boolean; strict: boolean },
) => AjvInstance;

const Ajv2020 = Ajv2020Module as unknown as AjvConstructor;

function extractFrontmatter(content: string): unknown {
  if (!content.startsWith("---")) {
    throw new Error("no YAML frontmatter delimiter");
  }
  const closingIdx = content.indexOf("\n---", 4);
  if (closingIdx < 0) {
    throw new Error("unterminated YAML frontmatter");
  }
  const fmText = content.slice(4, closingIdx);
  return parseYaml(fmText);
}

function parseChordTimestamp(path: string): Date | null {
  const filename = path.split("/").pop() ?? path;

  let match = filename.match(
    /^x[0-9A-Fa-f]{4}_t(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})_/,
  );
  if (match) {
    const [, y, mo, d, h, mi, s] = match;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
  }

  match = filename.match(
    /^(\d{4})-?(\d{2})-?(\d{2})T(\d{2}):?(\d{2}):?(\d{2})Z/,
  );
  if (match) {
    const [, y, mo, d, h, mi, s] = match;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
  }

  match = filename.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
  if (match) {
    const [, y, mo, d, h, mi, s] = match;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
  }

  return null;
}

function parseCutoff(value: string): Date | null {
  const asChordTimestamp = parseChordTimestamp(`${value}-cutoff.md`);
  if (asChordTimestamp) return asChordTimestamp;
  const parsed = new Date(value.endsWith("Z") ? value : `${value}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isGrandfathered(path: string, cutoff: Date | null): boolean {
  if (!cutoff) return false;
  const timestamp = parseChordTimestamp(path);
  return timestamp !== null && timestamp < cutoff;
}

function emptyResult(): ValidationResult {
  return {
    total: 0,
    passed: 0,
    failed: 0,
    grandfathered: 0,
    enforceFailed: 0,
    aliasesResolved: 0,
    errors: [],
    grandfatheredErrors: [],
  };
}

function recordFailure(
  result: ValidationResult,
  path: string,
  message: string,
  grandfathered: boolean,
  category: DebtCategory,
): void {
  const error: ValidationError = {
    path,
    message,
    category,
    repair_policy: "supersede_or_alias_never_rewrite",
  };
  result.failed++;
  if (grandfathered) {
    result.grandfathered++;
    result.grandfatheredErrors.push(error);
  } else {
    result.enforceFailed++;
    result.errors.push(error);
  }
}

/** Stable routing for schema debt. Root-level missing identity markers are
 * identity debt; valid chord identities with malformed fields are shape debt. */
export function classifySchemaFailure(
  message: string,
  errors: AjvError[] = [],
): DebtCategory {
  if (message.startsWith("parse:")) return "parse_corruption";
  const identityProperties = new Set([
    "chord",
    "voice",
    "author",
    "speaker",
    "mode",
    "type",
    "id",
    "octant",
  ]);
  const missingIdentity = errors.some((error) => {
    const params = error.params;
    return error.instancePath === "" &&
      !!params?.missingProperty &&
      identityProperties.has(params.missingProperty);
  });
  return missingIdentity ? "identity_debt" : "shape_debt";
}

async function listChordFiles(trackedOnly: boolean): Promise<ChordFile[]> {
  return (await listChordSurfaceFiles({ stable: trackedOnly })).map((
    chord,
  ) => ({
    path: chord.fullPath,
    relPath: chord.relPath,
  }));
}

async function validateChords(
  ajv: AjvInstance,
  grandfatherBefore: Date | null,
  trackedOnly: boolean,
): Promise<ValidationResult> {
  const schemaPath = `${ROOT}contracts/schema/chord.schema.json`;
  const schema = JSON.parse(await Deno.readTextFile(schemaPath));
  const validate = ajv.compile(schema);

  const result = emptyResult();
  for (const entry of await listChordFiles(trackedOnly)) {
    result.total++;
    const path = entry.relPath;
    const grandfathered = isGrandfathered(entry.path, grandfatherBefore);
    try {
      const content = await Deno.readTextFile(entry.path);
      const fm = extractFrontmatter(content);
      if (validate(fm)) {
        result.passed++;
      } else {
        const errs = validate.errors ?? [];
        const msg = errs.slice(0, 2).map((e: AjvError) =>
          `${e.instancePath || "/"} ${e.message}`
        ).join("; ");
        recordFailure(
          result,
          path,
          msg,
          grandfathered,
          classifySchemaFailure(msg, errs),
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      recordFailure(
        result,
        path,
        `parse: ${msg}`,
        grandfathered,
        "parse_corruption",
      );
    }
  }
  return result;
}

async function validateRecommendation(
  ajv: AjvInstance,
): Promise<ValidationResult | null> {
  const schemaPath = `${ROOT}contracts/schema/recommendation.schema.json`;
  const dataPath = `${ROOT}src/x5288_cognition_recommendation.latest.myc.json`;
  try {
    const schema = JSON.parse(await Deno.readTextFile(schemaPath));
    const data = JSON.parse(await Deno.readTextFile(dataPath));
    const validate = ajv.compile(schema);
    const result: ValidationResult = { ...emptyResult(), total: 1 };
    if (validate(data)) {
      result.passed = 1;
    } else {
      result.failed = 1;
      result.enforceFailed = 1;
      const errs = validate.errors ?? [];
      const msg = errs.slice(0, 3).map((e: AjvError) =>
        `${e.instancePath || "/"} ${e.message}`
      ).join("; ");
      result.errors.push({
        path: "recommendation.latest.json",
        message: msg,
        category: "shape_debt",
        repair_policy: "supersede_or_alias_never_rewrite",
      });
    }
    return result;
  } catch (e) {
    console.error(
      `recommendation validation skipped: ${
        e instanceof Error ? e.message : e
      }`,
    );
    return null;
  }
}

async function fileExists(absPath: string): Promise<boolean> {
  try {
    await Deno.stat(absPath);
    return true;
  } catch {
    return false;
  }
}

// Roots a path-form `hears:` ref may live under. A ref whose first segment is
// none of these (legacy `0x0/…`, `ref:lambda-foundation/…`) is NOT validated —
// it is an old/external scheme, not a live content path.
const KNOWN_PATH_ROOTS = new Set([
  "src",
  "contracts",
  "docs",
  "probes",
  "papers",
  "jazz",
  "omega",
  "liquid",
  "myc",
]);

interface HearsAlias {
  from: string;
  // `renamed_to`/`moved_to` assert byte identity (a git rename/move preserved the
  // content). `superseded_by` preserves historical REACHABILITY while explicitly
  // DENYING byte identity — the cited draft name was never a tracked file; a later,
  // distinct document carries the same wire schema and supersedes it (codex
  // x7700_954582). All three satisfy hears-reachability; only the first two claim
  // the bytes are the same.
  to: string;
  relation: "renamed_to" | "moved_to" | "superseded_by";
  evidence: string;
}

interface HearsAliasRegistry {
  type: "trinity.hears-alias-registry.v0.1";
  aliases: HearsAlias[];
}

export async function loadHearsAliases(
  path = `${ROOT}src/x2F31_hears_aliases.myc.json`,
): Promise<Map<string, string>> {
  const registry = JSON.parse(
    await Deno.readTextFile(path),
  ) as HearsAliasRegistry;
  if (
    registry.type !== "trinity.hears-alias-registry.v0.1" ||
    !Array.isArray(registry.aliases)
  ) throw new Error("invalid hears alias registry envelope");
  const aliases = new Map<string, string>();
  for (const entry of registry.aliases) {
    if (
      typeof entry.from !== "string" || typeof entry.to !== "string" ||
      !["renamed_to", "moved_to", "superseded_by"].includes(entry.relation) ||
      typeof entry.evidence !== "string" || entry.evidence.trim() === "" ||
      entry.from === entry.to ||
      aliases.has(entry.from)
    ) throw new Error(`invalid or duplicate hears alias: ${entry.from}`);
    aliases.set(entry.from, entry.to);
  }
  return aliases;
}

export interface HearsRefResult {
  error: string | null;
  aliasApplied: string | null;
}

/** Resolve one citation with at most one exact alias hop. Alias targets must
 * independently resolve; chains and cycles are rejected by construction. */
export async function resolveHearsRef(
  ref: string,
  index: Index,
  aliases: ReadonlyMap<string, string> = new Map(),
): Promise<HearsRefResult> {
  const directError = await checkHearsRefDirect(ref, index);
  if (!directError) return { error: null, aliasApplied: null };
  const target = aliases.get(ref.trim());
  if (!target) return { error: directError, aliasApplied: null };
  if (aliases.has(target)) {
    return {
      error: `alias chain forbidden: ${ref.trim()} -> ${target}`,
      aliasApplied: null,
    };
  }
  const targetError = await checkHearsRefDirect(target, index);
  return targetError
    ? {
      error:
        `alias target unresolved: ${ref.trim()} -> ${target} (${targetError})`,
      aliasApplied: null,
    }
    : { error: null, aliasApplied: `${ref.trim()} -> ${target}` };
}

/** Classify a single `hears:` reference and, ONLY when it is unambiguously a
 *  citation, test that it points at something real. `hears:` is empirically a
 *  free-form "what this chord responds to" log — it holds architect utterances
 *  (`architect: …`), prompt/command quotes, prose, and `free:`/`ref:` notes as
 *  well as real citations. So we validate just the two unambiguous citation
 *  forms and skip everything else (anything with whitespace, a free-form prefix,
 *  or an unknown path root):
 *    - coordinate stem `xNNNN_…` (no slash) → resolve via the FQDN resolver;
 *    - path under a known live root          → check file existence under ROOT.
 *  Returns a reason string only for a genuine dangling citation, else null. */
export async function checkHearsRef(
  ref: string,
  index: Index,
  aliases: ReadonlyMap<string, string> = new Map(),
): Promise<string | null> {
  return (await resolveHearsRef(ref, index, aliases)).error;
}

async function checkHearsRefDirect(
  ref: string,
  index: Index,
): Promise<string | null> {
  const r = ref.trim();
  // Free-form context, not a citation: prefixes, URLs, or any whitespace
  // (paths and stems are single tokens; prompts/commands/prose are not).
  if (
    r === "" || /\s/.test(r) || /^(free:|ref:)/.test(r) ||
    /^https?:\/\//.test(r)
  ) return null;
  if (r.includes("/")) {
    const root = r.split("/")[0];
    if (!KNOWN_PATH_ROOTS.has(root)) return null; // legacy/external scheme
    return (await fileExists(`${ROOT}${r}`)) ? null : `missing path: ${r}`;
  }
  if (!/^x[0-9A-Fa-f]{4}_/.test(r)) return null; // bare non-coordinate token
  const refs = await chordRefs(index, r);
  return refs.node.found ? null : `unresolvable stem: ${r}`;
}

/** Verify every chord's `hears:` edges point at a reachable node (codex Graph-v2
 *  edges that dangle = a broken knowledge graph). Read-only. Reuses the chord
 *  grandfather cutoff, so pre-cutoff chords with stale links are debt, not active
 *  failures. The empirical trap this avoids: a naive existence check floods false
 *  positives on `free:` notes and refs into non-src roots — `checkHearsRef`
 *  classifies first. */
async function validateHearsLinks(
  grandfatherBefore: Date | null,
  trackedOnly: boolean,
): Promise<ValidationResult> {
  const index = await buildIndex(defaultRoots());
  const aliases = await loadHearsAliases();
  const result = emptyResult();
  for (const entry of await listChordFiles(trackedOnly)) {
    let hears: unknown;
    try {
      const fm = extractFrontmatter(await Deno.readTextFile(entry.path));
      hears = (fm as { hears?: unknown })?.hears;
    } catch {
      continue; // malformed frontmatter is the schema pass's concern, not ours
    }
    if (!Array.isArray(hears) || hears.length === 0) continue;
    result.total++;
    const grandfathered = isGrandfathered(entry.path, grandfatherBefore);
    const bad: string[] = [];
    for (const h of hears) {
      if (typeof h !== "string") continue;
      const resolution = await resolveHearsRef(h, index, aliases);
      if (resolution.error) bad.push(resolution.error);
      if (resolution.aliasApplied) result.aliasesResolved++;
    }
    if (bad.length === 0) {
      result.passed++;
    } else {
      recordFailure(
        result,
        entry.relPath,
        `hears ${bad.join("; ")}`,
        grandfathered,
        "link_rot",
      );
    }
  }
  return result;
}

function printResult(label: string, r: ValidationResult): void {
  const pct = r.total === 0 ? 0 : ((r.passed / r.total) * 100).toFixed(1);
  const debt = r.grandfathered > 0 ? `, ${r.grandfathered} grandfathered` : "";
  const active = r.enforceFailed > 0
    ? `, ${r.enforceFailed} active failures`
    : "";
  console.log(
    `${label}: ${r.passed}/${r.total} passed (${pct}%), ${r.failed} failed${debt}${active}`,
  );
  if (r.aliasesResolved > 0) {
    console.log(`  exact aliases resolved: ${r.aliasesResolved}`);
  }
  const categories = countCategories(r.errors);
  if (Object.keys(categories).length > 0) {
    console.log(
      `  active debt: ${
        Object.entries(categories).map(([kind, count]) => `${kind}=${count}`)
          .join(", ")
      }`,
    );
  }
  if (r.errors.length > 0) {
    console.log(`  first ${r.errors.length} active errors:`);
    for (const err of r.errors) {
      console.log(`    ${err.path}: ${err.message}`);
    }
  }
  if (r.grandfatheredErrors.length > 0) {
    console.log(
      `  first ${r.grandfatheredErrors.length} grandfathered errors:`,
    );
    for (const err of r.grandfatheredErrors) {
      console.log(`    ${err.path}: ${err.message}`);
    }
  }
}

function countCategories(
  errors: ValidationError[],
): Partial<Record<DebtCategory, number>> {
  const counts: Partial<Record<DebtCategory, number>> = {};
  for (const error of errors) {
    counts[error.category] = (counts[error.category] ?? 0) + 1;
  }
  return counts;
}

function printResultJson(
  chordResult: ValidationResult,
  recResult: ValidationResult | null,
  hearsResult: ValidationResult,
  options: {
    grandfatherBefore: string | null;
    trackedOnly: boolean;
    strict: boolean;
  },
): void {
  const total = chordResult.total + (recResult?.total ?? 0) +
    hearsResult.total;
  const passed = chordResult.passed + (recResult?.passed ?? 0) +
    hearsResult.passed;
  const failed = chordResult.failed + (recResult?.failed ?? 0) +
    hearsResult.failed;
  const activeFailures = chordResult.enforceFailed +
    (recResult?.enforceFailed ?? 0) + hearsResult.enforceFailed;
  console.log(JSON.stringify(
    {
      type: "schema_validation",
      options,
      summary: {
        total,
        passed,
        failed,
        active_failures: activeFailures,
        active_schema_failures: chordResult.enforceFailed +
          (recResult?.enforceFailed ?? 0),
        dangling_hears: hearsResult.enforceFailed,
        grandfathered_failures: chordResult.grandfathered +
          hearsResult.grandfathered,
      },
      debt_ledgers: {
        parse_corruption: chordResult.errors.filter((e) =>
          e.category === "parse_corruption"
        ),
        identity_debt: chordResult.errors.filter((e) =>
          e.category === "identity_debt"
        ),
        shape_debt: [
          ...chordResult.errors,
          ...(recResult?.errors ?? []),
        ].filter((e) => e.category === "shape_debt"),
        link_rot: hearsResult.errors,
      },
      chords: chordResult,
      recommendation: recResult,
      hears_links: hearsResult,
    },
    null,
    2,
  ));
}

if (import.meta.main) {
  const flags = parseArgs(Deno.args, {
    boolean: ["strict", "json", "tracked-only"],
    string: ["grandfather-before", "max-errors"],
    default: {
      strict: false,
      json: false,
      "tracked-only": false,
      "grandfather-before": DEFAULT_GRANDFATHER_BEFORE,
      "max-errors": "5",
    },
  });
  const grandfatherBefore = flags["grandfather-before"]
    ? parseCutoff(String(flags["grandfather-before"]))
    : null;
  const ajv = new Ajv2020({ allErrors: true, strict: false });

  const chordResult = await validateChords(
    ajv,
    grandfatherBefore,
    Boolean(flags["tracked-only"]),
  );

  const recResult = await validateRecommendation(ajv);

  const hearsResult = await validateHearsLinks(
    grandfatherBefore,
    Boolean(flags["tracked-only"]),
  );

  if (flags.json) {
    printResultJson(chordResult, recResult, hearsResult, {
      grandfatherBefore: flags["grandfather-before"]
        ? String(flags["grandfather-before"])
        : null,
      trackedOnly: Boolean(flags["tracked-only"]),
      strict: Boolean(flags.strict),
    });
  } else {
    const maxErrors = Math.max(0, Number(flags["max-errors"] ?? 5));
    const originalActive = chordResult.errors;
    const originalGrandfathered = chordResult.grandfatheredErrors;
    chordResult.errors = originalActive.slice(0, maxErrors);
    chordResult.grandfatheredErrors = originalGrandfathered.slice(
      0,
      Math.min(3, maxErrors),
    );
    printResult("chords", chordResult);
    chordResult.errors = originalActive;
    chordResult.grandfatheredErrors = originalGrandfathered;
    if (recResult) printResult("recommendation", recResult);
    const hearsActive = hearsResult.errors;
    const hearsGrandfathered = hearsResult.grandfatheredErrors;
    hearsResult.errors = hearsActive.slice(0, maxErrors);
    hearsResult.grandfatheredErrors = hearsGrandfathered.slice(
      0,
      Math.min(3, maxErrors),
    );
    printResult("hears-links", hearsResult);
    hearsResult.errors = hearsActive;
    hearsResult.grandfatheredErrors = hearsGrandfathered;
  }

  const total = chordResult.total + (recResult?.total ?? 0) + hearsResult.total;
  const passed = chordResult.passed + (recResult?.passed ?? 0) +
    hearsResult.passed;
  const failed = chordResult.failed + (recResult?.failed ?? 0) +
    hearsResult.failed;
  // Only SCHEMA validity gates strict mode. `hears:` link-rot is a read-only
  // diagnostic — a citation valid when authored breaks when its target is later
  // renamed/versioned (e.g. RECEIPT_ENVELOPE v0.1→v1.0), which is real but
  // historical, not an authoring error to block on.
  const schemaEnforceFailed = chordResult.enforceFailed +
    (recResult?.enforceFailed ?? 0);
  if (!flags.json) {
    console.log(
      `\noverall: ${passed}/${total} passed, ${failed} failed, ${schemaEnforceFailed} active schema failures; ${hearsResult.enforceFailed} dangling hears (diagnostic, non-gating)`,
    );
  }
  // Do not call Deno.exit() here: a large --json report may still be buffered
  // on stdout and can be truncated before an automation consumer reads it.
  Deno.exitCode = flags.strict && schemaEnforceFailed > 0 ? 1 : 0;
}
