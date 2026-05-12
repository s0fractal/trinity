#!/usr/bin/env -S deno run -A
// validate_schemas.ts — validate substrate artifacts against contracts/schema/*.json
//
// Walks jazz/chords/*.md and validates each chord's YAML frontmatter against
// contracts/schema/chord.schema.json. Validates reports/cognition/recommendation.latest.json
// against recommendation.schema.json. Reports pass/fail counts and the first few errors.
//
// Adoption: this is a soft-validation pass. Failures are surfaced but do not block.
// As schemas mature, individual chord types may opt into stricter validation.

import { parse as parseYaml } from "jsr:@std/yaml@1.0.5";
import { walk } from "jsr:@std/fs@1.0.5/walk";
import Ajv2020 from "npm:ajv@8.17.1/dist/2020.js";

const ROOT = new URL("..", import.meta.url).pathname;

interface ValidationResult {
  total: number;
  passed: number;
  failed: number;
  errors: Array<{ path: string; message: string }>;
}

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

// deno-lint-ignore no-explicit-any
async function validateChords(ajv: any): Promise<ValidationResult> {
  const schemaPath = `${ROOT}contracts/schema/chord.schema.json`;
  const schema = JSON.parse(await Deno.readTextFile(schemaPath));
  const validate = ajv.compile(schema);

  const result: ValidationResult = { total: 0, passed: 0, failed: 0, errors: [] };
  const chordsDir = `${ROOT}jazz/chords`;
  for await (const entry of walk(chordsDir, { exts: [".md"], maxDepth: 4 })) {
    if (!entry.isFile) continue;
    result.total++;
    try {
      const content = await Deno.readTextFile(entry.path);
      const fm = extractFrontmatter(content);
      if (validate(fm)) {
        result.passed++;
      } else {
        result.failed++;
        const errs = validate.errors ?? [];
        const msg = errs.slice(0, 2).map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ");
        result.errors.push({ path: entry.path.replace(ROOT, ""), message: msg });
      }
    } catch (e) {
      result.failed++;
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push({ path: entry.path.replace(ROOT, ""), message: `parse: ${msg}` });
    }
  }
  return result;
}

// deno-lint-ignore no-explicit-any
async function validateRecommendation(ajv: any): Promise<ValidationResult | null> {
  const schemaPath = `${ROOT}contracts/schema/recommendation.schema.json`;
  const dataPath = `${ROOT}reports/cognition/recommendation.latest.json`;
  try {
    const schema = JSON.parse(await Deno.readTextFile(schemaPath));
    const data = JSON.parse(await Deno.readTextFile(dataPath));
    const validate = ajv.compile(schema);
    const result: ValidationResult = { total: 1, passed: 0, failed: 0, errors: [] };
    if (validate(data)) {
      result.passed = 1;
    } else {
      result.failed = 1;
      const errs = validate.errors ?? [];
      const msg = errs.slice(0, 3).map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ");
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
  console.log(`${label}: ${r.passed}/${r.total} passed (${pct}%)`);
  if (r.errors.length > 0) {
    console.log(`  first ${Math.min(5, r.errors.length)} errors:`);
    for (const err of r.errors.slice(0, 5)) {
      console.log(`    ${err.path}: ${err.message}`);
    }
  }
}

if (import.meta.main) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });

  const chordResult = await validateChords(ajv);
  printResult("chords", chordResult);

  const recResult = await validateRecommendation(ajv);
  if (recResult) printResult("recommendation", recResult);

  const total = chordResult.total + (recResult?.total ?? 0);
  const passed = chordResult.passed + (recResult?.passed ?? 0);
  const failed = chordResult.failed + (recResult?.failed ?? 0);
  console.log(`\noverall: ${passed}/${total} passed, ${failed} failed`);
  Deno.exit(failed > 0 ? 1 : 0);
}
