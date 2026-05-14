#!/usr/bin/env -S deno run -A
// validate_schemas.ts — validate substrate artifacts against contracts/schema/*.json
//
// Walks jazz/chords/*.md and validates each chord's YAML frontmatter against
// contracts/schema/chord.schema.json. Validates reports/cognition/recommendation.latest.json
// against recommendation.schema.json. Reports pass/fail counts and the first few errors.
//
// Adoption: this is a soft-validation pass. Failures are surfaced but do not block.
// Chords emitted before the schema landing receipt are grandfathered by default.
// Strict mode fails only on non-grandfathered failures.

import { parse as parseYaml } from "jsr:@std/yaml@1.0.5";
import { walk } from "jsr:@std/fs@1.0.5/walk";
import { parseArgs } from "jsr:@std/cli@1.0.13/parse-args";
import Ajv2020Module from "npm:ajv@8.17.1/dist/2020.js";

const ROOT = new URL("..", import.meta.url).pathname;
const DEFAULT_GRANDFATHER_BEFORE = "2026-05-12T130546Z";

interface ValidationResult {
  total: number;
  passed: number;
  failed: number;
  grandfathered: number;
  enforceFailed: number;
  errors: Array<{ path: string; message: string }>;
  grandfatheredErrors: Array<{ path: string; message: string }>;
}

interface ChordFile {
  path: string;
}

type AjvError = {
  instancePath?: string;
  message?: string;
};

type AjvValidator = {
  errors?: AjvError[] | null;
  (data: unknown): boolean;
};

type AjvInstance = {
  compile(schema: unknown): AjvValidator;
};

type AjvConstructor = new (options: { allErrors: boolean; strict: boolean }) => AjvInstance;

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

  let match = filename.match(/^(\d{4})-?(\d{2})-?(\d{2})T(\d{2}):?(\d{2}):?(\d{2})Z/);
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
    errors: [],
    grandfatheredErrors: [],
  };
}

function recordFailure(
  result: ValidationResult,
  path: string,
  message: string,
  grandfathered: boolean,
): void {
  result.failed++;
  if (grandfathered) {
    result.grandfathered++;
    result.grandfatheredErrors.push({ path, message });
  } else {
    result.enforceFailed++;
    result.errors.push({ path, message });
  }
}

async function listChordFiles(trackedOnly: boolean): Promise<ChordFile[]> {
  if (trackedOnly) {
    const output = await new Deno.Command("git", {
      args: ["ls-files", "jazz/chords/*.md"],
      cwd: ROOT,
      stdout: "piped",
      stderr: "piped",
    }).output();
    if (output.code !== 0) {
      const stderr = new TextDecoder().decode(output.stderr).trim();
      throw new Error(`git ls-files failed: ${stderr}`);
    }
    return new TextDecoder().decode(output.stdout).trim().split("\n")
      .filter(Boolean)
      .map((path) => ({ path: `${ROOT}${path}` }));
  }

  const files: ChordFile[] = [];
  const chordsDir = `${ROOT}jazz/chords`;
  for await (const entry of walk(chordsDir, { exts: [".md"], maxDepth: 4 })) {
    if (entry.isFile) files.push({ path: entry.path });
  }
  return files;
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
    const path = entry.path.replace(ROOT, "");
    const grandfathered = isGrandfathered(entry.path, grandfatherBefore);
    try {
      const content = await Deno.readTextFile(entry.path);
      const fm = extractFrontmatter(content);
      if (validate(fm)) {
        result.passed++;
      } else {
        const errs = validate.errors ?? [];
        const msg = errs.slice(0, 2).map((e: AjvError) => `${e.instancePath || "/"} ${e.message}`).join("; ");
        recordFailure(result, path, msg, grandfathered);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      recordFailure(result, path, `parse: ${msg}`, grandfathered);
    }
  }
  return result;
}

async function validateRecommendation(ajv: AjvInstance): Promise<ValidationResult | null> {
  const schemaPath = `${ROOT}contracts/schema/recommendation.schema.json`;
  const dataPath = `${ROOT}reports/cognition/recommendation.latest.json`;
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
      const msg = errs.slice(0, 3).map((e: AjvError) => `${e.instancePath || "/"} ${e.message}`).join("; ");
      result.errors.push({ path: "recommendation.latest.json", message: msg });
    }
    return result;
  } catch (e) {
    console.error(`recommendation validation skipped: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

function printResult(label: string, r: ValidationResult): void {
  const pct = r.total === 0 ? 0 : ((r.passed / r.total) * 100).toFixed(1);
  const debt = r.grandfathered > 0 ? `, ${r.grandfathered} grandfathered` : "";
  const active = r.enforceFailed > 0 ? `, ${r.enforceFailed} active failures` : "";
  console.log(`${label}: ${r.passed}/${r.total} passed (${pct}%), ${r.failed} failed${debt}${active}`);
  if (r.errors.length > 0) {
    console.log(`  first ${r.errors.length} active errors:`);
    for (const err of r.errors) {
      console.log(`    ${err.path}: ${err.message}`);
    }
  }
  if (r.grandfatheredErrors.length > 0) {
    console.log(`  first ${r.grandfatheredErrors.length} grandfathered errors:`);
    for (const err of r.grandfatheredErrors) {
      console.log(`    ${err.path}: ${err.message}`);
    }
  }
}

function printResultJson(
  chordResult: ValidationResult,
  recResult: ValidationResult | null,
  options: {
    grandfatherBefore: string | null;
    trackedOnly: boolean;
    strict: boolean;
  },
): void {
  const total = chordResult.total + (recResult?.total ?? 0);
  const passed = chordResult.passed + (recResult?.passed ?? 0);
  const failed = chordResult.failed + (recResult?.failed ?? 0);
  const activeFailures = chordResult.enforceFailed + (recResult?.enforceFailed ?? 0);
  console.log(JSON.stringify({
    type: "schema_validation",
    options,
    summary: {
      total,
      passed,
      failed,
      active_failures: activeFailures,
      grandfathered_failures: chordResult.grandfathered,
    },
    chords: chordResult,
    recommendation: recResult,
  }, null, 2));
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
  const grandfatherBefore = flags["grandfather-before"] ? parseCutoff(String(flags["grandfather-before"])) : null;
  const ajv = new Ajv2020({ allErrors: true, strict: false });

  const chordResult = await validateChords(ajv, grandfatherBefore, Boolean(flags["tracked-only"]));

  const recResult = await validateRecommendation(ajv);

  if (flags.json) {
    printResultJson(chordResult, recResult, {
      grandfatherBefore: flags["grandfather-before"] ? String(flags["grandfather-before"]) : null,
      trackedOnly: Boolean(flags["tracked-only"]),
      strict: Boolean(flags.strict),
    });
  } else {
    const maxErrors = Math.max(0, Number(flags["max-errors"] ?? 5));
    const originalActive = chordResult.errors;
    const originalGrandfathered = chordResult.grandfatheredErrors;
    chordResult.errors = originalActive.slice(0, maxErrors);
    chordResult.grandfatheredErrors = originalGrandfathered.slice(0, Math.min(3, maxErrors));
    printResult("chords", chordResult);
    chordResult.errors = originalActive;
    chordResult.grandfatheredErrors = originalGrandfathered;
    if (recResult) printResult("recommendation", recResult);
  }

  const total = chordResult.total + (recResult?.total ?? 0);
  const passed = chordResult.passed + (recResult?.passed ?? 0);
  const failed = chordResult.failed + (recResult?.failed ?? 0);
  const enforceFailed = chordResult.enforceFailed + (recResult?.enforceFailed ?? 0);
  if (!flags.json) {
    console.log(`\noverall: ${passed}/${total} passed, ${failed} failed, ${enforceFailed} active failures`);
  }
  Deno.exit(flags.strict && enforceFailed > 0 ? 1 : 0);
}
