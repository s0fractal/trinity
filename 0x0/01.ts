#!/usr/bin/env -S deno run --allow-read --allow-run
// 0x0/01.ts — t (the runtime dispatcher)
// position: 0/01 → foundation/byte01
// hex_dipole: "00 00 00 00 00 00 00 00"
// lifecycle_phase: 0
//
// Topological LISP Evaluator (per gemini proposal 134500Z):
//   - executables are pure functions that return structured JSON
//   - dispatcher captures via stdout:piped, parses, renders/routes
//   - recursive continuations: payload {intent:"continue",next:"5/C",args:[...]}
//   - TTY-aware: pretty-print for human, raw JSON for pipe
//
// Resolution strategy (unchanged):
//   1. canonical match (record's 01 field)
//   2. multilingual search (record's 10 field, '/' delimited per language)

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const SUBSTRATE_ROOT = dirname(HERE);
const GLOSSARY_PATH = join(SUBSTRATE_ROOT, "0x0", "00.ndjson");
const MAX_CONTINUATION_DEPTH = 10;

// Schema registry (type:07 records from glossary)
let SCHEMAS: Map<string, string[]> = new Map();

interface WordRec {
  canonical: string;
  position: string;
  translations: Record<string, string>;
}

async function fn_load_words(): Promise<WordRec[]> {
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const out: WordRec[] = [];
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      if (r["00"] !== "05") continue;
      out.push({
        canonical: r["01"],
        position: r["12"],
        translations: r["10"] ?? {},
      });
    } catch { /* skip */ }
  }
  return out;
}

async function fn_load_schemas(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  try {
    const text = await Deno.readTextFile(GLOSSARY_PATH);
    for (const line of text.trim().split("\n")) {
      try {
        const r = JSON.parse(line);
        if (r["00"] === "07" && r["01"] && r["02"]) {
          const required = String(r["02"]).split(",").map((s) => s.trim()).filter(Boolean);
          map.set(r["01"], required);
        }
      } catch { /* skip bad lines */ }
    }
  } catch { /* glossary missing — schemas empty */ }
  return map;
}

function fn_validate_payload(payload: any): { valid: boolean; missing?: string[]; type?: string } {
  if (!payload || typeof payload !== "object") {
    return { valid: false, missing: ["payload is not an object"] };
  }
  const t = payload.type;
  if (!t) return { valid: false, missing: ["type field missing"] };
  const required = SCHEMAS.get(t);
  if (!required) return { valid: true }; // no schema known — permissive
  const missing: string[] = [];
  for (const field of required) {
    if (!(field in payload)) missing.push(field);
  }
  return missing.length === 0 ? { valid: true } : { valid: false, missing, type: t };
}

function fn_resolve_word(input: string, records: WordRec[]): WordRec | null {
  for (const r of records) if (r.canonical === input) return r;
  for (const r of records) {
    for (const lang of Object.keys(r.translations)) {
      const synonyms = r.translations[lang].split("/").map((s) => s.trim());
      if (synonyms.includes(input)) return r;
    }
  }
  return null;
}

function fn_position_to_path(pos: string): string {
  const parts = pos.split("/");
  if (parts.length < 2) throw new Error(`position needs depth≥2: ${pos}`);
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

async function fn_run_at_position(
  pos: string,
  args: string[],
  depth: number,
): Promise<number> {
  if (depth > MAX_CONTINUATION_DEPTH) {
    console.error(`# continuation depth exceeded: ${depth}`);
    return 3;
  }
  const path = fn_position_to_path(pos);
  if (!(await fn_exists(path))) {
    console.error(`# no executable at ${path}`);
    return 2;
  }
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", path, ...args],
    stdout: "piped",
    stderr: "inherit",
  });
  const result = await proc.output();
  if (result.code !== 0) return result.code;
  const raw = new TextDecoder().decode(result.stdout).trim();
  if (!raw) return 0;
  return await fn_process_payload(raw, depth);
}

async function fn_process_payload(raw: string, depth: number): Promise<number> {
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    // not JSON — passthrough as-is
    fn_write_raw(raw);
    return 0;
  }
  // recursive continuation
  if (payload?.intent === "continue" && typeof payload.next === "string") {
    return await fn_run_at_position(payload.next, payload.args ?? [], depth + 1);
  }
  // schema validation (glossary-driven, type:07)
  const validation = fn_validate_payload(payload);
  if (!validation.valid) {
    const errorPayload = {
      type: "validation_error",
      position: payload?.position ?? "?",
      expected_type: validation.type,
      missing_fields: validation.missing,
      actual_keys: Object.keys(payload ?? {}),
      note: "Prediction Error: executable output does not match glossary schema (type:07)",
    };
    fn_render_human(errorPayload);
    return 2; // non-zero: schema mismatch
  }

  // render
  const isTty = Deno.stdout.isTerminal();
  const forceHuman = payload?.type === "cross_substrate_verify" || payload?.type === "health" || payload?.type === "validation_error" || payload?.type === "all";
  if (isTty || forceHuman) {
    fn_render_human(payload);
  } else {
    fn_write_raw(JSON.stringify(payload));
  }
  return 0;
}

function fn_write_raw(s: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(s + "\n"));
}

function fn_render_human(p: any): void {
  // type-based pretty printing for TTY
  if (!p || typeof p !== "object") {
    console.log(p);
    return;
  }
  const t = p.type;
  if (t === "scalar" || t === "block") {
    console.log(String(p.value));
  } else if (t === "status") {
    console.log(`# ${p.action ?? "?"} @ ${p.position ?? "?"}`);
    if (p.args && p.args.length) console.log(`# args: ${p.args.join(" ")}`);
    if (p.note) console.log(`# ${p.note}`);
    if (p.synonyms) console.log(`# synonyms: ${p.synonyms.join(", ")}`);
  } else if (t === "help") {
    fn_render_help(p);
  } else if (t === "error") {
    console.error(`# error: ${p.message ?? "unknown"}`);
  } else if (t === "validation_error") {
    console.error(`# validation error @ ${p.position ?? "?"}`);
    console.error(`# expected type: ${p.expected_type ?? "?"}`);
    console.error(`# missing fields: ${(p.missing_fields ?? []).join(", ")}`);
    console.error(`# actual keys: ${(p.actual_keys ?? []).join(", ")}`);
    if (p.note) console.error(`# ${p.note}`);
  } else if (t === "cross_substrate_verify" || t === "all") {
    fn_render_cross_substrate_verify(p);
  } else if (t === "health") {
    fn_render_health(p);
  } else {
    // fallback: pretty JSON
    console.log(JSON.stringify(p, null, 2));
  }
}

function fn_render_cross_substrate_verify(p: any): void {
  const mode = p.mode ?? "quick";
  const summary = p.summary ?? {};
  const label = p.type === "all" ? "all" : "cross-verify";
  console.log(`# ${label} @ ${p.position ?? "?"} (${mode} mode)`);
  console.log("# " + "─".repeat(50));
  for (const s of p.substrates ?? []) {
    const icon = s.status === "passed" ? "✓" : s.status === "failed" ? "✗" : s.status === "timeout" ? "⏱" : "⊘";
    const cmd = s.command ?? "not implemented";
    const shortCmd = cmd.length > 35 ? cmd.slice(0, 32) + "..." : cmd;
    const dur = s.duration_ms ?? 0;
    console.log(`# ${s.substrate.padEnd(9)} ${icon} ${s.status.padEnd(14)} ${dur.toString().padStart(5)}ms  ${shortCmd}`);
  }
  console.log("# " + "─".repeat(50));
  const overallIcon = summary.overall === "passed" ? "✓" : "✗";
  console.log(`# overall:  ${overallIcon} ${summary.overall ?? "?"}  ${summary.passed ?? 0}/${summary.total ?? 0} passed`);
}

function fn_render_health(p: any): void {
  const summary = p.summary ?? {};
  const icon = summary.overall === "healthy" ? "✓" : summary.overall === "degraded" ? "⚠" : "✗";
  console.log(`# health @ ${p.position ?? "?"} — ${icon} ${summary.overall ?? "?"}`);
  console.log("# " + "─".repeat(40));
  for (const c of p.checks ?? []) {
    const ci = c.status === "ok" ? "✓" : c.status === "warn" ? "⚠" : "✗";
    console.log(`# ${ci} ${c.name.padEnd(20)} ${c.detail}`);
  }
  console.log("# " + "─".repeat(40));
  console.log(`# checks: ${summary.ok ?? 0} ok, ${summary.warn ?? 0} warn, ${summary.fail ?? 0} fail`);
}

function fn_render_help(p: any): void {
  if (p.mode === "list") {
    console.log("# substrate words (exists, position, canonical, synonyms across langs):");
    for (const r of p.records ?? []) {
      const exists = r.exists ? "✓" : "✗";
      console.log(
        `  ${exists} ${r.position.padEnd(8)} ${r.canonical.padEnd(10)} ${r.synonym_count} syn / ${r.lang_count} lang`,
      );
    }
    console.log("\n# detail: t help <any-synonym-any-language>");
  } else if (p.mode === "detail") {
    const r = p.record;
    console.log(`canonical: ${r.canonical}`);
    if (p.matched && p.matched !== r.canonical) console.log(`matched:   ${p.matched} (synonym)`);
    console.log(`position:  ${r.position}`);
    console.log(`path:      ${r.path}`);
    console.log(`status:    ${r.exists ? "✓ executable exists" : "✗ no executable"}`);
    console.log(`note:      ${r.note ?? ""}`);
    if (r.translations) {
      console.log("\nsynonyms by language:");
      for (const lang of Object.keys(r.translations)) {
        console.log(`  ${lang}: ${r.translations[lang]}`);
      }
    }
    if (p.decomposition) {
      console.log("\nsemantic decomposition:");
      for (const [k, v] of Object.entries(p.decomposition)) {
        console.log(`  ${k}: ${v}`);
      }
    }
  }
}

async function fn_list(): Promise<void> {
  const records = await fn_load_words();
  const payload = {
    type: "help",
    mode: "list",
    records: await Promise.all(records.map(async (r) => {
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
    })),
  };
  await fn_process_payload(JSON.stringify(payload), 0);
}

async function fn_dispatch_word(word: string, rest: string[]): Promise<number> {
  const records = await fn_load_words();
  const found = fn_resolve_word(word, records);
  if (!found) {
    console.error(`# unknown word: ${word}`);
    console.error(`# canonical words: ${records.map((r) => r.canonical).join(", ")}`);
    return 1;
  }
  if (word !== found.canonical) {
    console.error(`# ${word} → ${found.canonical} (synonym) → ${found.position}`);
  } else {
    console.error(`# ${word} → ${found.position}`);
  }
  return await fn_run_at_position(found.position, rest, 0);
}

if (import.meta.main) {
  SCHEMAS = await fn_load_schemas();
  const [word, ...rest] = Deno.args;
  if (!word) {
    await fn_list();
    Deno.exit(0);
  }
  Deno.exit(await fn_dispatch_word(word, rest));
}
