// src/x0010_dispatch_runner.ts — shared runner utilities
// maturity: active
// skill_safe: yes-readonly
// Hex substrate infrastructure: NOT an executable.
// Provides position→path resolution, step execution, and substrate
// spawning with timeout/abort. Centralizes duplicated logic from
// src/x0300_all.ts, src/x0400_each.ts, src/x0500_pipe.ts, and src/x5C00_cross_verify.ts.

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const SUBSTRATE_ROOT = join(dirname(fromFileUrl(import.meta.url)), "..");
const TIMEOUT_MS = 60000;

/** Position→filename lookup. Position is the glossary's "N/M" key.
 *  After 2026-05-18 flat-src migration, files live in src/ with x<coord>_<handle>.ts names.
 *  Position "N/0" historically meant "void of archetype N" — now lives at xN001 (X000 reserved for aggregator).
 */
export const POSITION_TO_FILE: Record<string, string> = {
  "0/01": "x0100_dispatch.ts",
  "0/03": "x0300_all.ts",
  "0/04": "x0400_each.ts",
  "0/05": "x0500_pipe.ts",
  "0/06": "x0600_try.ts",
  "0/07": "x0700_cond.ts",
  "0/08": "x0800_join.ts",
  "0/09": "x0900_repeat.ts",
  "0/0A": "x0A00_tap.ts",
  "0/0B": "x0B00_until.ts",
  "0/0C": "x0C00_any.ts",
  "0/0F": "x0F00_help.ts",
  "2/0": "x2001_voices.ts",
  "2/2": "x2200_ecosystem.ts",
  "2/3": "x2300_self_portrait.ts",
  "2/4": "x2400_cognition_snapshot.ts",
  "2/5": "x2500_cognition_field.ts",
  "2/6": "x2600_cognition_delta.ts",
  "2/7": "x2700_heartbeat.ts",
  "2/8": "x2800_ask.ts",
  "2/A": "x2A00_lexicon.ts",
  "2/B": "x2B00_keytimeline.ts",
  "2/C": "x2C00_cognition_phase_report.ts",
  "2/D": "x2D00_inbox.ts",
  "2/E": "x2E00_status.ts",
  "2/F": "x2F00_self.ts",
  "2/F3": "x2F30_fqdn_resolver.ts",
  "2/F37": "x2F37_voice_keys.ts",
  "3/5": "x3500_chord_play.ts",
  "3/A": "x3A00_balance.ts",
  "3/C": "x3C00_recipes.ts",
  "4/0": "x4001_chord.ts",
  "4/1": "x4100_style.ts",
  "4/3": "x4300_scaffold.ts",
  "4/A": "x4A00_capabilities.ts",
  "4/D": "x4D00_propose.ts",
  "4/E": "x4E00_snapshot.ts",
  "4/F": "x4F00_contracts.ts",
  "4/F1": "x4F01_contract_audit.ts",
  "4/011": "x4011_contract_status_compiler.ts",
  "5/0": "x5001_block.ts",
  "5/2": "x5200_cognition_recommend.ts",
  "5/3": "x5300_recommend_to_chord.ts",
  "5/4": "x5400_validate_schemas.ts",
  "5/5": "x5500_resonance_field.ts",
  "5/6": "x5600_metabolism.ts",
  "5/51": "x5510_myc_proxy.ts",
  "5/52": "x5520_run_literate.ts",
  "5/9": "x5900_nay.ts",
  "5/91": "x5910_compost_watchdog.ts",
  "5/A": "x5A00_fresh.ts",
  "5/B": "x5B00_affordances.ts",
  "5/C": "x5C00_cross_verify.ts",
  "5/C2": "x5C20_autonomy.ts",
  "5/C3": "x5C30_autonomy_context.ts",
  "5/D": "x5D00_apply_codeicide.ts",
  "5/E": "x5E00_cognition_recommend_receipt.ts",
  "5/E1": "x5E10_warrant.ts",
  "5/F": "x5F00_apply.ts",
  "6/02": "x6020_gravity.ts",
  "6/3": "x6300_ontology_coverage.ts",
  "6/6": "x6600_coherence.ts",
  "6/A": "x6A00_health.ts",
  "6/B": "x6B00_reconcile.ts",
  "6/C": "x6C00_audit.ts",
  "6/D": "x6D00_cowitness.ts",
  "6/E": "x6E00_court.ts",
  "6/F": "x6F00_check.ts",
  "7/0": "x7001_grind.ts",
  "7/4": "x7400_export_clean.ts",
  "7/B": "x7B00_evidence.ts",
  "7/C": "x7C00_author.ts",
  "7/D": "x7D00_verdict.ts",
  "7/E": "x7E00_anchor_prep.ts",
  "7/F": "x7F00_daemon.ts",
  "8/7": "x8700_network.ts",
  "8/8": "x8800_agents_gen.ts",
  "8/9": "x8900_coordinate_guide_gen.ts",
  "8/A": "x8A00_voice_memory_gen.ts",
  "8/B": "x8B00_decisions_gen.ts",
  "8/C": "x8C00_skill_gen.ts",
  "8/D": "x8D00_roadmap_gen.ts",
  "8/E": "x8E00_probes_gen.ts",
  "8/F": "x8F00_external_surfaces_gen.ts",
  "8/F2": "x8F20_chord_migrate.ts",
  "9/4A": "x94A0_myc_capabilities.ts",
  "9/6C": "x96C0_myc_protocol_audit.ts",
  "9/2E": "x92E0_myc_status.ts",
};

// Non-executable library organs registered to prevent audit warnings:
// "x2F32_fqdn_witness.ts"
// "x2F36_fqdn_sovereignty.ts"

export interface SubstrateDef {
  name: string;
  cwd: string;
  cmd: string[] | null;
  note: string;
}

export interface SubstrateResult {
  substrate: string;
  command: string | null;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  duration_ms: number;
  status: "passed" | "failed" | "timeout" | "not_implemented";
}

/** Map a glossary position to a filesystem path.
 *  Glossary keeps semantic positions like "5/C", "2/E".
 *  Files now live in src/x<coord>_<handle>.ts after the flat-src migration.
 *  "5/C" → "src/x5C00_cross_verify.ts"
 *  "2/E" → "src/x2E00_status.ts"
 *  Unknown positions return a deterministic path (for error reporting / future organs).
 */
export function positionToPath(pos: string): string {
  const file = POSITION_TO_FILE[pos];
  if (file) return join(SUBSTRATE_ROOT, "src", file);
  // Fallback: synthesize an unregistered path. Caller's exists() will see it doesn't exist.
  return join(
    SUBSTRATE_ROOT,
    "src",
    `unregistered_${pos.replace(/\//g, "_")}.ts`,
  );
}

/** Check if a file exists. */
export async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

// ── execution kernel (codex Phase B) ────────────────────────────────────────
// One narrow boundary for "run an organ and receive a bounded, structured
// result" — shared by the dispatcher capture, the court witnesses, and the
// daemon law-watch, which each used to construct Deno.Command independently
// (codex R5). It adds the per-process budgets deferred from R3: a deadline
// (organ can't hang the caller) and an output byte cap (organ can't flood it).
// NOT for git/phi-specific subprocesses — only the organ→payload boundary.

// ── runtime permission profiles (codex x5d00_953682 Phase C / F3) ───────────
// Static effect classification PREDICTS what an organ can do; a Deno permission
// profile CONFINES what it may actually do. The safe eval path must launch
// leaves with a restricted profile, never `--allow-all`, so a missed effect or
// a wrong static verdict is still denied by the runtime. `t eval --safe` uses
// `read-local`; the human CLI and unrestricted eval keep `privileged` for
// backward compatibility.

export type PermissionProfile = "pure" | "read-local" | "privileged";

/** The exact `deno run` permission flags for a profile. Pure; exported for the
 *  test and for capability receipts (the precise flags are part of the record).
 *  `read-local` reads are scoped to the substrate root (covers trinity + the
 *  submodules nested under it) and allows env reads (benign without net, which
 *  is denied); no write, net, run, or ffi under either confined profile. */
export function permissionFlags(profile: PermissionProfile): string[] {
  switch (profile) {
    case "pure":
      return ["--no-prompt"];
    case "read-local":
      return ["--no-prompt", `--allow-read=${SUBSTRATE_ROOT}`, "--allow-env"];
    case "privileged":
      return ["--allow-all"];
  }
}

export interface OrganRunResult {
  code: number;
  stdout: string;
  stderr: string;
  timed_out: boolean;
  truncated: boolean;
}

export interface OrganRunOptions {
  cwd?: string;
  timeout_ms?: number;
  max_output_bytes?: number;
}

const ORGAN_DEFAULT_TIMEOUT_MS = 60_000;
const ORGAN_DEFAULT_MAX_BYTES = 2_000_000;

/** Read a child stream incrementally, capping at `maxBytes` counted in BYTES
 *  (not UTF-16 units). On overflow it keeps only up to the cap, flags
 *  truncation, and invokes `onOverflow` (the caller kills the child) — so a
 *  flooding organ cannot buffer unbounded memory in the parent (codex Phase E /
 *  F4). Never throws: a stream error (e.g. the process was killed) returns what
 *  was read so far. */
async function readCapped(
  stream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
  onOverflow: () => void,
): Promise<{ bytes: Uint8Array; truncated: boolean }> {
  if (!stream) return { bytes: new Uint8Array(0), truncated: false };
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      if (total + value.byteLength > maxBytes) {
        const room = Math.max(0, maxBytes - total);
        if (room > 0) chunks.push(value.subarray(0, room));
        total = maxBytes;
        truncated = true;
        onOverflow();
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } catch {
    /* stream errored (process killed) — keep what we have */
  } finally {
    try {
      await reader.cancel();
    } catch { /* ignore */ }
  }
  const bytes = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    bytes.set(c, off);
    off += c.byteLength;
  }
  return { bytes, truncated };
}

/** Run a command with a deadline + output byte cap; never throws. The child is
 *  spawned and its streams are read incrementally (codex Phase E): a hung organ
 *  is killed at the deadline (code 124, timed_out), and a flooding organ is
 *  killed once its output passes the byte cap (truncated) — the cap bounds memory
 *  consumed WHILE the process runs, not just the returned string, and counts
 *  bytes (not UTF-16 length). */
export async function runOrgan(
  cmd: string,
  args: string[],
  opts: OrganRunOptions = {},
): Promise<OrganRunResult> {
  const timeoutMs = opts.timeout_ms ?? ORGAN_DEFAULT_TIMEOUT_MS;
  const maxBytes = opts.max_output_bytes ?? ORGAN_DEFAULT_MAX_BYTES;
  let timedOut = false;
  let child: Deno.ChildProcess;
  try {
    child = new Deno.Command(cmd, {
      args,
      cwd: opts.cwd,
      stdout: "piped",
      stderr: "piped",
    }).spawn();
  } catch (e) {
    return {
      code: 1,
      stdout: "",
      stderr: e instanceof Error ? e.message : String(e),
      timed_out: false,
      truncated: false,
    };
  }
  const kill = () => {
    try {
      child.kill("SIGKILL");
    } catch { /* already exited */ }
  };
  const timer = setTimeout(() => {
    timedOut = true;
    kill();
  }, timeoutMs);
  const timedOutResult = (): OrganRunResult => ({
    code: 124,
    stdout: "",
    stderr: `timeout after ${timeoutMs}ms`,
    timed_out: true,
    truncated: false,
  });
  try {
    // Read both streams concurrently (avoids the pipe-buffer deadlock), each
    // capped; overflow on either kills the child.
    const [out, err] = await Promise.all([
      readCapped(child.stdout, maxBytes, kill),
      readCapped(child.stderr, maxBytes, kill),
    ]);
    const status = await child.status;
    clearTimeout(timer);
    if (timedOut) return timedOutResult();
    const dec = new TextDecoder();
    return {
      code: status.code,
      stdout: dec.decode(out.bytes),
      stderr: dec.decode(err.bytes),
      timed_out: false,
      truncated: out.truncated || err.truncated,
    };
  } catch (e) {
    clearTimeout(timer);
    if (timedOut) return timedOutResult();
    return {
      code: 1,
      stdout: "",
      stderr: e instanceof Error ? e.message : String(e),
      timed_out: false,
      truncated: false,
    };
  }
}

/** Extract one JSON payload from dispatcher-style organ stdout (drops leading
 *  `#` comment lines). `undefined` = empty/no output; `{ text }` = non-JSON.
 *  Pure — the canonical extractor the kernel callers share (codex R5). */
export function extractOrganJson(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch { /* tolerate stray # comment lines */ }
  const stripped = trimmed
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("#"))
    .join("\n")
    .trim();
  if (stripped) {
    try {
      return JSON.parse(stripped);
    } catch { /* fall through */ }
  }
  return { text: trimmed };
}

/** Run a single hex executable and capture its JSON stdout.
 * Returns structured receipt or raw fallback.
 */
export async function runStep(pos: string): Promise<any> {
  const path = positionToPath(pos);
  if (!(await exists(path))) {
    return {
      type: "error",
      position: pos,
      message: `no executable at ${path}`,
    };
  }
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", path],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  const raw = new TextDecoder().decode(out.stdout).trim();
  try {
    return JSON.parse(raw);
  } catch {
    return { type: "raw", position: pos, code: out.code, stdout: raw };
  }
}

/** Run a substrate command with timeout and abort support.
 * Byte-for-byte compatible with the duplicated runSubstrate in
 * src/x0300_all.ts and src/x5C00_cross_verify.ts.
 */
export async function runSubstrate(
  def: SubstrateDef,
): Promise<SubstrateResult> {
  const start = performance.now();

  if (def.cmd === null) {
    return {
      substrate: def.name,
      command: null,
      exit_code: null,
      stdout: "",
      stderr: "",
      duration_ms: 0,
      status: "not_implemented",
    };
  }

  const abort = new AbortController();
  const timeoutId = setTimeout(() => abort.abort(), TIMEOUT_MS);

  try {
    const proc = new Deno.Command(def.cmd[0], {
      args: def.cmd.slice(1),
      cwd: def.cwd,
      stdout: "piped",
      stderr: "piped",
      signal: abort.signal,
    });

    const output = await proc.output();
    clearTimeout(timeoutId);

    const stdout = new TextDecoder().decode(output.stdout);
    const stderr = new TextDecoder().decode(output.stderr);
    const duration = Math.round(performance.now() - start);

    return {
      substrate: def.name,
      command: def.cmd.join(" "),
      exit_code: output.code,
      stdout: stdout.slice(0, 4000),
      stderr: stderr.slice(0, 4000),
      duration_ms: duration,
      status: output.code === 0 ? "passed" : "failed",
    };
  } catch (e) {
    clearTimeout(timeoutId);
    const duration = Math.round(performance.now() - start);

    if (e instanceof DOMException && e.name === "AbortError") {
      return {
        substrate: def.name,
        command: def.cmd.join(" "),
        exit_code: null,
        stdout: "",
        stderr: `Timeout after ${TIMEOUT_MS}ms`,
        duration_ms: duration,
        status: "timeout",
      };
    }

    return {
      substrate: def.name,
      command: def.cmd.join(" "),
      exit_code: null,
      stdout: "",
      stderr: String(e).slice(0, 4000),
      duration_ms: duration,
      status: "failed",
    };
  }
}
