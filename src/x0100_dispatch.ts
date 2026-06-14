#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x0100_dispatch.ts — t (the runtime dispatcher)
// position: 0/01 → foundation/byte01
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "6C 26 40 33 66 40 40 19"
//   void_infinity+0.85 first_penultimate+0.30 mirror_apex+0.50
//   triangle_build+0.40 foundation_container+0.80 action_decision+0.50
//   harmony_emergence+0.50 completion_frontier+0.20
//   primary axis: void (0) ← bucket MATCH
//   secondary: foundation (4) ← position '01' unclear under composite reading
//   measured by claude-opus-4-7-1m, anchor block 949260, audit phase 1
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

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { positionToPath as libPositionToPath } from "./x0010_dispatch_runner.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const SUBSTRATE_ROOT = dirname(HERE);
const GLOSSARY_PATH = join(SUBSTRATE_ROOT, "src", "x0001_glossary.ndjson");
const MAX_CONTINUATION_DEPTH = 10;

// Schema registry (type:07 records from glossary)
let SCHEMAS: Map<string, string[]> = new Map();

interface WordRec {
  /** First handle, used for fs-readable diagnostic. NOT "canonical" status. */
  primary: string;
  /** All equal handles in any language: synonyms and translations
   *  flattened to a single array with no priority among them. */
  handles: string[];
  /** Hex position this entity materializes at. */
  position: string;
}

async function fn_load_words(): Promise<WordRec[]> {
  // Reads kind:5 records. Per architect 2026-05-14: 0xN/M is an
  // interference pattern (M-in-context-N), and synonyms and translations
  // are equal handles, not priority list.
  //   00 (void)        kind marker "5"
  //   02 (mirror)      handles array — multilingual equal projections
  //   04 (foundation)  position — where this word materializes
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const out: WordRec[] = [];
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      if (r["00"] !== "5") continue;
      if (!Array.isArray(r["02"]) || typeof r["04"] !== "string") continue;
      const handles = (r["02"] as string[]).filter((s) =>
        typeof s === "string"
      );
      out.push({
        primary: handles[0] ?? "",
        handles,
        position: r["04"],
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
          const required = String(r["02"]).split(",").map((s) => s.trim())
            .filter(Boolean);
          map.set(r["01"], required);
        }
      } catch { /* skip bad lines */ }
    }
  } catch { /* glossary missing — schemas empty */ }
  return map;
}

function fn_validate_payload(
  payload: any,
): { valid: boolean; missing?: string[]; type?: string } {
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
  return missing.length === 0
    ? { valid: true }
    : { valid: false, missing, type: t };
}

function fn_resolve_word(input: string, records: WordRec[]): WordRec | null {
  // Two-pass resolution. Languages are equal, but "preferred name" matters:
  //  Pass 1: input matches a record's primary handle (its preferred name).
  //          Soft hierarchy — when you call a thing by its own name, you
  //          get that thing.
  //  Pass 2: input matches any equal handle (synonym in any language).
  //          File order decides among multiple records sharing a handle.
  // This honors topological equality of handles while resolving naming
  // collisions deterministically.
  for (const r of records) {
    if (r.primary === input) return r;
  }
  for (const r of records) {
    if (r.handles.includes(input)) return r;
  }
  return null;
}

function fn_position_to_path(pos: string): string {
  const parts = pos.split("/");
  if (parts.length < 2) throw new Error(`position needs depth≥2: ${pos}`);
  return libPositionToPath(pos);
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
    stdin: "inherit", // pipe parent's stdin through to organ (enables `t cowitness --stdin` etc.)
  });
  const result = await proc.output();
  const raw = new TextDecoder().decode(result.stdout).trim();
  if (raw) {
    const payloadResult = await fn_process_payload(raw, depth);
    if (payloadResult !== 0) return payloadResult;
  }
  return result.code;
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
    return await fn_run_at_position(
      payload.next,
      payload.args ?? [],
      depth + 1,
    );
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
      note:
        "Prediction Error: executable output does not match glossary schema (type:07)",
    };
    fn_render_human(errorPayload);
    return 2; // non-zero: schema mismatch
  }

  // render — terminal gets human format, pipe gets raw JSON.
  // Errors and validation_errors are still surfaced to stderr by their
  // render path, so this only governs the stdout payload representation.
  if (Deno.stdout.isTerminal()) {
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
    fn_render_status(p);
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
  } else if (t === "each") {
    fn_render_each(p);
  } else if (t === "pipe") {
    fn_render_pipe(p);
  } else if (t === "cond") {
    fn_render_cond(p);
  } else if (t === "try") {
    fn_render_try(p);
  } else if (t === "join") {
    fn_render_join(p);
  } else if (t === "repeat") {
    fn_render_repeat(p);
  } else if (t === "tap") {
    fn_render_tap(p);
  } else if (t === "until") {
    fn_render_until(p);
  } else if (t === "any") {
    fn_render_any(p);
  } else if (t === "spore_apply") {
    fn_render_spore_apply(p);
  } else {
    // fallback: pretty JSON
    console.log(JSON.stringify(p, null, 2));
  }
}

function fn_render_spore_apply(p: any): void {
  console.log(`# apply @ ${p.position ?? "5/F"}`);
  console.log(
    `# protocol: ${p.protocol ?? "spore.v0"}  backend: ${
      p.backend_kind ?? "unknown"
    }`,
  );
  if (p.simulation === true) {
    console.log(
      `# ⚠ SIMULATION — receipt_kind: ${
        p.receipt_kind ?? "simulated_spore_apply"
      } (not a verified SPORE.v0 receipt)`,
    );
  }
  console.log(`# mutator: ${p.mutator}`);
  console.log(`# state:   ${p.state}`);
  if (p.inputs && p.inputs.length > 0) {
    console.log(`# inputs:  ${p.inputs.join(", ")}`);
  }
  console.log(`# -> ${p.output}`);
  if (p.note) console.log(`# ${p.note}`);
}

function fn_render_cross_substrate_verify(p: any): void {
  const mode = p.mode ?? "quick";
  const summary = p.summary ?? {};
  const label = p.type === "all" ? "all" : "cross-verify";
  console.log(`# ${label} @ ${p.position ?? "?"} (${mode} mode)`);
  console.log("# " + "─".repeat(50));
  for (const s of p.substrates ?? []) {
    const icon = s.status === "passed"
      ? "✓"
      : s.status === "failed"
      ? "✗"
      : s.status === "timeout"
      ? "⏱"
      : "⊘";
    const cmd = s.command ?? "not implemented";
    const shortCmd = cmd.length > 35 ? cmd.slice(0, 32) + "..." : cmd;
    const dur = s.duration_ms ?? 0;
    console.log(
      `# ${s.substrate.padEnd(9)} ${icon} ${s.status.padEnd(14)} ${
        dur.toString().padStart(5)
      }ms  ${shortCmd}`,
    );
  }
  console.log("# " + "─".repeat(50));
  const overallIcon = summary.overall === "passed" ? "✓" : "✗";
  console.log(
    `# overall:  ${overallIcon} ${summary.overall ?? "?"}  ${
      summary.passed ?? 0
    }/${summary.total ?? 0} passed`,
  );
}

function fn_render_health(p: any): void {
  const summary = p.summary ?? {};
  const icon = summary.overall === "healthy"
    ? "✓"
    : summary.overall === "degraded"
    ? "⚠"
    : "✗";
  console.log(
    `# health @ ${p.position ?? "?"} — ${icon} ${summary.overall ?? "?"}`,
  );
  console.log("# " + "─".repeat(40));
  for (const c of p.checks ?? []) {
    const ci = c.status === "ok" ? "✓" : c.status === "warn" ? "⚠" : "✗";
    console.log(`# ${ci} ${c.name.padEnd(20)} ${c.detail}`);
  }
  console.log("# " + "─".repeat(40));
  console.log(
    `# checks: ${summary.ok ?? 0} ok, ${summary.warn ?? 0} warn, ${
      summary.fail ?? 0
    } fail`,
  );
}

function fn_render_help(p: any): void {
  if (p.mode === "list") {
    console.log(
      "# substrate words (exists, position, primary handle, handles count):",
    );
    for (const r of p.records ?? []) {
      const exists = r.exists ? "✓" : "✗";
      console.log(
        `  ${exists} ${r.position.padEnd(8)} ${r.primary.padEnd(14)} ${
          r.handles_count.toString().padStart(2)
        } handles`,
      );
    }
    console.log("\n# detail: t help <any-handle-any-language>");
  } else if (p.mode === "detail") {
    const r = p.record;
    console.log(`primary:   ${r.primary}`);
    if (p.matched && p.matched !== r.primary) {
      console.log(`matched:   ${p.matched} (equal handle)`);
    }
    console.log(`position:  ${r.position}`);
    console.log(`path:      ${r.path}`);
    console.log(
      `status:    ${r.exists ? "✓ executable exists" : "✗ no executable"}`,
    );
    if (Array.isArray(r.handles)) {
      console.log("\nhandles (equal, no priority):");
      for (const h of r.handles) console.log(`  ${h}`);
    }
    if (p.decomposition) {
      console.log("\nsemantic decomposition:");
      for (const [k, v] of Object.entries(p.decomposition)) {
        console.log(`  ${k}: ${v}`);
      }
    }
  }
}

function fn_render_status(p: any): void {
  // SUBSTRATE_HEALTH.v0.1 projection — preferred if present.
  // Falls back to legacy `summary` field for backward compat.
  if (p.summary?.overall) {
    const s = p.summary;
    const sh = p.substrate_health;

    // Use the more honest overall when SUBSTRATE_HEALTH is present.
    // CI freshness is orthogonal — reported as a side-badge, not gating
    // the overall health label.
    const overall = sh?.overall ?? s.overall;
    const icon = overall === "healthy" || overall === "well"
      ? "✓"
      : overall === "degraded" || overall === "drifting"
      ? "⚠"
      : "✗";
    const ciStale = sh?.external_ci?.is_stale;
    const ciBadge = ciStale ? "  ⏰ ci stale" : "";
    const legacyNote = sh && sh.overall !== s.overall
      ? ` (legacy: ${s.overall})`
      : "";
    console.log(
      `# status @ ${
        p.position ?? "?"
      } — ${icon} ${overall}${legacyNote}${ciBadge}`,
    );
    if (p.note) console.log(`# ${p.note}`);
    console.log("# " + "─".repeat(40));

    if (s.health) {
      const hi = s.health.overall === "healthy"
        ? "✓"
        : s.health.overall === "degraded"
        ? "⚠"
        : "✗";
      console.log(
        `# health:   ${hi} ${s.health.overall}  (${s.health.ok ?? 0} ok, ${
          s.health.fail ?? 0
        } fail)`,
      );
    }
    if (s.audit) {
      const ai = s.audit.match > 0 && s.audit.mismatch === 0 ? "✓" : "⚠";
      console.log(`# audit:    ${ai} ${s.audit.match}/${s.audit.total} match`);
    }
    if (s.worktree) {
      const wt = s.worktree;
      const wi = wt.dirty ? "⚠" : "✓";
      console.log(
        `# worktree: ${wi} ${wt.dirty ? "dirty" : "clean"}  (${
          wt.changed_files ?? 0
        } files; staged:${wt.staged ?? 0} unstaged:${
          wt.unstaged ?? 0
        } untracked:${wt.untracked ?? 0})`,
      );
      for (const file of (wt.sample ?? []).slice(0, 5)) {
        console.log(`#   • ${file}`);
      }
    }

    // External CI (SUBSTRATE_HEALTH.v0.1). Surface red_signals visibly.
    if (sh?.external_ci) {
      const ci = sh.external_ci;
      const ci_icon = ci.green === true ? "✓" : ci.green === false ? "⚠" : "·";
      const stale_tag = ci.is_stale ? " (stale)" : "";
      const age = ci.age_seconds !== null ? ` ${ci.age_seconds}s old` : "";
      console.log(`# ext_ci:   ${ci_icon} green=${ci.green}${stale_tag}${age}`);
      if (ci.red_signals && ci.red_signals.length > 0) {
        for (const sig of ci.red_signals) {
          console.log(`#   ✗ ${sig}`);
        }
      }
    }

    if (p.submodules) {
      for (const [name, sub] of Object.entries(p.submodules)) {
        if (!sub) continue;
        const subData = sub as any;
        const subOvr = subData.substrate_health?.overall ??
          subData.summary?.overall ?? "unknown";
        const si = subOvr === "healthy"
          ? "✓"
          : subOvr === "degraded"
          ? "⚠"
          : "✗";
        console.log(`# sub[${name.padEnd(6)}]: ${si} ${subOvr}`);
      }
    }
  } else {
    console.log(`# ${p.action ?? "?"} @ ${p.position ?? "?"}`);
    if (p.args && p.args.length) console.log(`# args: ${p.args.join(" ")}`);
    if (p.note) console.log(`# ${p.note}`);
    if (p.synonyms) console.log(`# synonyms: ${p.synonyms.join(", ")}`);
  }
}

function fn_render_pipe(p: any): void {
  const icon = p.overall === "passed" ? "✓" : "✗";
  const label = p.stoppedAt
    ? `stopped at ${p.stoppedAt}`
    : `${p.steps?.length ?? 0} steps passed`;
  console.log(
    `# pipe @ ${p.position ?? "0/05"} — ${icon} ${p.overall ?? "?"} (${label})`,
  );
  if (p.note) console.log(`# ${p.note}`);
}

function fn_render_each(p: any): void {
  const icon = p.overall === "passed" ? "✓" : "✗";
  console.log(
    `# each @ ${p.position ?? "0/04"} — ${icon} ${p.overall ?? "?"}  (${
      p.count ?? 0
    } steps, ${p.errors ?? 0} errors)`,
  );
  if (p.note) console.log(`# ${p.note}`);
}

function fn_render_cond(p: any): void {
  const icon = p.overall === "passed" ? "✓" : "✗";
  const branch = p.taken ?? "?";
  console.log(
    `# cond @ ${p.position ?? "0/07"} — ${icon} ${
      p.overall ?? "?"
    }  (took ${branch})`,
  );
  if (p.note) console.log(`# ${p.note}`);
}

function fn_render_try(p: any): void {
  const icon = p.overall === "passed" ? "✓" : "✗";
  const used = p.used ?? "?";
  console.log(
    `# try @ ${p.position ?? "0/06"} — ${icon} ${
      p.overall ?? "?"
    }  (used: ${used})`,
  );
  if (p.note) console.log(`# ${p.note}`);
}

function fn_render_join(p: any): void {
  const icon = p.overall === "passed" ? "✓" : "✗";
  console.log(
    `# join @ ${p.position ?? "0/08"} — ${icon} ${p.overall ?? "?"}  (${
      p.count ?? 0
    } parallel, ${p.errors ?? 0} errors)`,
  );
  if (p.note) console.log(`# ${p.note}`);
}

function fn_render_repeat(p: any): void {
  const icon = p.overall === "passed" ? "✓" : "✗";
  const err = p.first_error_at !== null
    ? `first error at ${p.first_error_at}`
    : "all ok";
  console.log(
    `# repeat @ ${p.position ?? "0/09"} — ${icon} ${p.overall ?? "?"}  (${
      p.requested_count ?? 0
    }×, ${err})`,
  );
  if (p.note) console.log(`# ${p.note}`);
}

function fn_render_tap(p: any): void {
  const picon = p.primary_ok ? "✓" : "✗";
  const sicon = p.side_ok ? "✓" : "✗";
  console.log(
    `# tap @ ${p.position ?? "0/0A"} — primary ${picon}, side ${sicon}`,
  );
  if (p.note) console.log(`# ${p.note}`);
}

function fn_render_until(p: any): void {
  const icon = p.overall === "passed" ? "✓" : "✗";
  const at = p.success_at !== null
    ? `success at attempt ${(p.success_at as number) + 1}`
    : `failed after ${p.attempts ?? 0}`;
  console.log(
    `# until @ ${p.position ?? "0/0B"} — ${icon} ${p.overall ?? "?"}  (${at})`,
  );
  if (p.note) console.log(`# ${p.note}`);
}

function fn_render_any(p: any): void {
  const icon = p.overall === "passed" ? "✓" : "✗";
  const first = p.first_success_at !== null
    ? `first success: ${p.steps?.[p.first_success_at] ?? "?"}`
    : "all failed";
  console.log(
    `# any @ ${p.position ?? "0/0C"} — ${icon} ${p.overall ?? "?"}  (${first})`,
  );
  if (p.note) console.log(`# ${p.note}`);
}

async function fn_list(): Promise<void> {
  const records = await fn_load_words();
  const payload = {
    type: "help",
    mode: "list",
    records: await Promise.all(records.map(async (r) => {
      const path = fn_position_to_path(r.position);
      return {
        primary: r.primary,
        position: r.position,
        handles_count: r.handles.length,
        exists: await fn_exists(path),
      };
    })),
  };
  await fn_process_payload(JSON.stringify(payload), 0);
}

async function fn_dispatch_word(word: string, rest: string[]): Promise<number> {
  // Fractal path: direct hex position execution (e.g., 5/C, 5/C/A, 5/C/A/3)
  const clean = word.replace(/^0x/, "");
  if (/^[0-9A-Fa-f](\/[0-9A-Fa-f])+$/.test(clean)) {
    console.error(`# ${word} → direct position`);
    return await fn_run_at_position(clean, rest, 0);
  }

  // Word resolution via glossary — any handle in any language matches
  const records = await fn_load_words();
  const found = fn_resolve_word(word, records);
  if (!found) {
    console.error(`# unknown word: ${word}`);
    console.error(
      `# known handles: ${records.flatMap((r) => r.handles).join(", ")}`,
    );
    return 1;
  }
  if (word !== found.primary) {
    console.error(
      `# ${word} → ${found.primary} (equal handle) → ${found.position}`,
    );
  } else {
    console.error(`# ${word} → ${found.position}`);
  }
  return await fn_run_at_position(found.position, rest, 0);
}

// ── JSON-RPC server mode (`t rpc`) — antigravity vision R5 ──────────────────
// Agents shouldn't have to parse TTY output. `t rpc` speaks newline-delimited
// JSON-RPC 2.0 over stdio: one request object per line in, one response object
// per line out. Each request's `method` is any trinity handle (`status`,
// `resolve`, `roadmap`, …) and `params` are the CLI args; the result is the
// organ's structured payload, already JSON, with no `#` lines or TTY markup.
// Same authority as the CLI (no privilege escalation) — just a clean transport.

/** Extract an organ's JSON payload from its captured stdout. Organs emit pure
 *  JSON, but tolerate stray leading `#` comment lines; non-JSON output (e.g.
 *  `resolve --show` content) is returned as `{ text }`. Pure. */
export function extractJsonPayload(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch { /* try stripping comment lines */ }
  const stripped = trimmed
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("#"))
    .join("\n")
    .trim();
  if (stripped) {
    try {
      return JSON.parse(stripped);
    } catch { /* fall through to text */ }
  }
  return { text: trimmed };
}

interface RpcRequest {
  id: number | string | null;
  method: string;
  params: string[];
  /** Original params value, un-stringified — used by `eval`, whose first param
   *  is a nested AST that must survive intact. */
  rawParams: unknown;
  isNotification: boolean;
}

/** Parse one JSON-RPC request line into a normalized request, or an error code.
 *  `params` may be a positional array (CLI args verbatim) or an object (mapped
 *  to `--key=value` flags). Pure. */
export function parseRpcRequest(
  line: string,
): { req: RpcRequest } | { errorCode: number; message: string } {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(line);
  } catch {
    return { errorCode: -32700, message: "Parse error" };
  }
  if (
    typeof obj !== "object" || obj === null || typeof obj.method !== "string"
  ) {
    return { errorCode: -32600, message: "Invalid Request: missing method" };
  }
  let params: string[] = [];
  if (Array.isArray(obj.params)) {
    params = obj.params.map((p) => String(p));
  } else if (obj.params && typeof obj.params === "object") {
    params = Object.entries(obj.params as Record<string, unknown>).map((
      [k, v],
    ) => (v === true ? `--${k}` : `--${k}=${v}`));
  }
  const id = (obj.id ?? null) as number | string | null;
  return {
    req: {
      id,
      method: obj.method,
      params,
      rawParams: obj.params,
      isNotification: !("id" in obj),
    },
  };
}

export function rpcResult(id: number | string | null, result: unknown): string {
  return JSON.stringify({ jsonrpc: "2.0", id, result });
}

export function rpcError(
  id: number | string | null,
  code: number,
  message: string,
): string {
  return JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } });
}

/** Run an organ at a position and capture its raw stdout (no rendering). */
async function fn_capture_at_position(
  pos: string,
  args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  const path = fn_position_to_path(pos);
  if (!(await fn_exists(path))) {
    return { code: 2, stdout: "", stderr: `no executable at ${path}` };
  }
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", path, ...args],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  return {
    code: out.code,
    stdout: new TextDecoder().decode(out.stdout),
    stderr: new TextDecoder().decode(out.stderr),
  };
}

/** Dispatch one parsed RPC request to its organ; return a response string, or
 *  null for a notification (no id → no response, per JSON-RPC). */
async function fn_handle_rpc(
  req: RpcRequest,
  records: WordRec[],
): Promise<string | null> {
  // `eval` is the composition method: params[0] is a LISP-shaped AST evaluated
  // over the command space (T4 over the sovereign channel). Lets an agent submit
  // a whole composition, not just single calls.
  if (req.method === "eval") {
    const ast = Array.isArray(req.rawParams) ? req.rawParams[0] : req.rawParams;
    try {
      const result = await evalAstBounded(ast, await fn_eval_leaf(records));
      return req.isNotification ? null : rpcResult(req.id, result);
    } catch (e) {
      return req.isNotification ? null : rpcError(
        req.id,
        -32000,
        `eval: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
  const found = fn_resolve_word(req.method, records);
  if (!found) {
    return req.isNotification
      ? null
      : rpcError(req.id, -32601, `Method not found: ${req.method}`);
  }
  const { code, stdout, stderr } = await fn_capture_at_position(
    found.position,
    req.params,
  );
  if (req.isNotification) return null;
  if (code !== 0) {
    return rpcError(
      req.id,
      -32000,
      `Organ exited ${code}: ${stderr.trim() || "(no stderr)"}`,
    );
  }
  return rpcResult(req.id, extractJsonPayload(stdout));
}

/** stdio JSON-RPC loop: read newline-delimited requests, write responses. */
async function fn_rpc_loop(): Promise<void> {
  const records = await fn_load_words();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buf = "";
  const flush = async (line: string) => {
    const parsed = parseRpcRequest(line);
    let response: string | null;
    if ("errorCode" in parsed) {
      response = rpcError(null, parsed.errorCode, parsed.message);
    } else {
      response = await fn_handle_rpc(parsed.req, records);
    }
    if (response) {
      await Deno.stdout.write(encoder.encode(response + "\n"));
    }
  };
  for await (const chunk of Deno.stdin.readable) {
    buf += decoder.decode(chunk);
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) await flush(line);
    }
  }
  const tail = buf.trim();
  if (tail) await flush(tail);
}

// ── AST evaluator (`t eval`) — antigravity vision T4 (Sovereign API) ─────────
// Agents shouldn't hand-write Bash/Deno-task pipelines (syntax-error-prone).
// `t eval` evaluates a LISP-shaped JSON AST over the trinity command space:
//   ["pipe", ["status"], ["audit"]]       run in order, return the last result
//   ["all",  ["status"], ["roadmap"]]     run all, return the array of results
//   ["try",  ["resolve","x"], ["status"]] try the first; on error, the fallback
//   ["cond", [test, then], ..., [else]]   first truthy test wins (else = lone arm)
//   ["status", "--json"]                  a leaf: a handle + its CLI args
// Pure control flow; leaves carry the same authority as the CLI (no escalation).

/** A leaf executor: run one trinity handle with args, return its JSON payload. */
export type LeafExec = (handle: string, args: string[]) => Promise<unknown>;

function isTruthy(v: unknown): boolean {
  if (v === null || v === undefined || v === false) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return Boolean(v);
}

/** Evaluate a JSON AST. Pure traversal; all organ I/O goes through `exec`, so
 *  the combinator logic is unit-testable with a mock. Non-array nodes are
 *  literals (returned as-is). Exported for the test. */
export async function evalAst(node: unknown, exec: LeafExec): Promise<unknown> {
  if (!Array.isArray(node) || node.length === 0) return node; // literal
  const [op, ...args] = node;
  if (typeof op !== "string") {
    throw new Error("eval: AST head must be a string op/handle");
  }
  switch (op) {
    case "pipe": {
      let result: unknown = null;
      for (const a of args) result = await evalAst(a, exec);
      return result;
    }
    case "all":
    case "each":
      return await Promise.all(args.map((a) => evalAst(a, exec)));
    case "try": {
      try {
        return await evalAst(args[0], exec);
      } catch {
        return args.length > 1 ? await evalAst(args[1], exec) : null;
      }
    }
    case "cond": {
      for (const arm of args) {
        if (Array.isArray(arm) && arm.length === 1) {
          return await evalAst(arm[0], exec); // lone arm = else
        }
        if (Array.isArray(arm) && arm.length >= 2) {
          if (isTruthy(await evalAst(arm[0], exec))) {
            return await evalAst(arm[1], exec);
          }
        }
      }
      return null;
    }
    default:
      // Leaf: `op` is a trinity handle, the rest are CLI args (stringified).
      return await exec(op, args.map((a) => String(a)));
  }
}

// ── execution-plan budgets (codex R3 / Phase C) ─────────────────────────────
// An AST is an execution plan. Before any leaf subprocess runs, the plan is
// admitted against a budget — depth, node count, leaf count, and max parallel
// width — so a cheaply-composable channel can't become an unbounded resource
// bomb. Admission is PURE and pre-execution: a rejected plan launches zero
// leaves. (Per-process timeout/byte limits live in the execution kernel,
// Phase B; capability allow-lists arrive with the registry, Phase E — the
// optional `allowed_handles` here is the seam.)

export interface ExecutionBudget {
  max_depth: number;
  max_nodes: number;
  max_leaves: number;
  max_parallel: number;
  /** When set, every referenced handle must be in this allow-list. */
  allowed_handles?: string[];
}

/** Conservative default for direct `t eval` / RPC without an explicit envelope. */
export const DEFAULT_BUDGET: ExecutionBudget = {
  max_depth: 8,
  max_nodes: 256,
  max_leaves: 64,
  max_parallel: 16,
};

const COMBINATORS = new Set(["pipe", "all", "each", "try", "cond"]);

interface PlanStats {
  depth: number;
  nodes: number;
  leaves: number;
  max_parallel: number;
  handles: string[];
}

/** Pure static analysis of an AST — no execution. */
export function planStats(node: unknown): PlanStats {
  const zero: PlanStats = {
    depth: 0,
    nodes: 0,
    leaves: 0,
    max_parallel: 0,
    handles: [],
  };
  if (!Array.isArray(node) || node.length === 0) return zero; // literal
  const [op, ...args] = node;
  if (typeof op !== "string") return zero;
  if (!COMBINATORS.has(op)) {
    return { depth: 1, nodes: 1, leaves: 1, max_parallel: 1, handles: [op] };
  }
  // Combinator: its sub-ASTs are the args (for cond, the arms' elements).
  const children = op === "cond"
    ? args.flatMap((arm) => (Array.isArray(arm) ? arm : []))
    : args;
  const sub = children.map(planStats);
  const childDepth = sub.reduce((m, s) => Math.max(m, s.depth), 0);
  let max_parallel = sub.reduce((m, s) => Math.max(m, s.max_parallel), 1);
  if (op === "all" || op === "each") {
    max_parallel = Math.max(max_parallel, args.length);
  }
  return {
    depth: 1 + childDepth,
    nodes: 1 + sub.reduce((a, s) => a + s.nodes, 0),
    leaves: sub.reduce((a, s) => a + s.leaves, 0),
    max_parallel,
    handles: sub.flatMap((s) => s.handles),
  };
}

export type PlanAdmission =
  | { ok: true; stats: PlanStats }
  | { ok: false; violations: string[]; stats: PlanStats };

/** Admit an AST against a budget BEFORE execution. Pure. */
export function analyzeExecutionPlan(
  ast: unknown,
  budget: ExecutionBudget,
): PlanAdmission {
  const stats = planStats(ast);
  const violations: string[] = [];
  if (stats.depth > budget.max_depth) {
    violations.push(`depth ${stats.depth} > max_depth ${budget.max_depth}`);
  }
  if (stats.nodes > budget.max_nodes) {
    violations.push(`nodes ${stats.nodes} > max_nodes ${budget.max_nodes}`);
  }
  if (stats.leaves > budget.max_leaves) {
    violations.push(`leaves ${stats.leaves} > max_leaves ${budget.max_leaves}`);
  }
  if (stats.max_parallel > budget.max_parallel) {
    violations.push(
      `parallel width ${stats.max_parallel} > max_parallel ${budget.max_parallel}`,
    );
  }
  if (budget.allowed_handles) {
    const allow = new Set(budget.allowed_handles);
    for (const h of new Set(stats.handles)) {
      if (!allow.has(h)) {
        violations.push(`handle '${h}' not in capability allow-list`);
      }
    }
  }
  return violations.length === 0
    ? { ok: true, stats }
    : { ok: false, violations, stats };
}

/** Admit-then-evaluate: reject an over-budget plan with a structured error
 *  BEFORE the first leaf runs; otherwise evaluate normally. Admitted plans have
 *  parallel width ≤ budget.max_parallel, so the unbounded Promise.all in `all`
 *  is already bounded by admission — no separate worker pool needed. */
export async function evalAstBounded(
  ast: unknown,
  exec: LeafExec,
  budget: ExecutionBudget = DEFAULT_BUDGET,
): Promise<unknown> {
  const admission = analyzeExecutionPlan(ast, budget);
  if (!admission.ok) {
    throw new Error(
      `execution plan rejected: ${admission.violations.join("; ")}`,
    );
  }
  return await evalAst(ast, exec);
}

/** Real leaf executor: resolve a handle → run its organ → JSON payload. */
async function fn_eval_leaf(records: WordRec[]): Promise<LeafExec> {
  return async (handle: string, args: string[]) => {
    const found = fn_resolve_word(handle, records);
    if (!found) throw new Error(`eval: unknown handle '${handle}'`);
    const { code, stdout, stderr } = await fn_capture_at_position(
      found.position,
      args,
    );
    if (code !== 0) {
      throw new Error(`eval: '${handle}' exited ${code}: ${stderr.trim()}`);
    }
    return extractJsonPayload(stdout);
  };
}

async function fn_eval(astJson: string): Promise<number> {
  let ast: unknown;
  try {
    ast = JSON.parse(astJson);
  } catch {
    console.error(`# eval: argument is not valid JSON`);
    return 1;
  }
  const exec = await fn_eval_leaf(await fn_load_words());
  try {
    const result = await evalAstBounded(ast, exec);
    console.log(JSON.stringify(result, null, 2));
    return 0;
  } catch (e) {
    console.error(`# eval error: ${e instanceof Error ? e.message : e}`);
    return 1;
  }
}

if (import.meta.main) {
  SCHEMAS = await fn_load_schemas();
  const [word, ...rest] = Deno.args;
  if (!word) {
    await fn_list();
    Deno.exit(0);
  }
  // `t rpc` / `t listen`: dispatcher-level server mode, intercepted before
  // glossary word resolution (it wraps the dispatcher itself, not an organ).
  if (word === "rpc" || word === "listen") {
    await fn_rpc_loop();
    Deno.exit(0);
  }
  // `t eval '<json-ast>'`: evaluate a LISP-shaped composition over the command
  // space (antigravity T4). Dispatcher built-in (wraps the dispatcher itself).
  if (word === "eval") {
    Deno.exit(await fn_eval(rest[0] ?? "null"));
  }
  Deno.exit(await fn_dispatch_word(word, rest));
}
