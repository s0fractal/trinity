// src/x5010_dispatch_runner.ts — shared runner utilities
// Hex substrate infrastructure: NOT an executable.
// Provides position→path resolution, step execution, and substrate
// spawning with timeout/abort. Centralizes duplicated logic from
// src/x0300_all.ts, src/x0400_each.ts, src/x0500_pipe.ts, and src/x5C00_cross_verify.ts.

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const SUBSTRATE_ROOT = join(dirname(fromFileUrl(import.meta.url)), "..");
const TIMEOUT_MS = 60000;

/** Position→filename lookup. Position is the glossary's "N/M" key.
 *  After 2026-05-18 flat-src migration, files live in src/ with x<coord>_<handle>.ts names.
 *  Position "N/0" historically meant "void of archetype N" — now lives at xN001 (X000 reserved for aggregator).
 */
const POSITION_TO_FILE: Record<string, string> = {
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
  "2/3": "x2300_self_portrait.ts",
  "2/4": "x2400_cognition_snapshot.ts",
  "2/5": "x2500_cognition_field.ts",
  "2/6": "x2600_cognition_delta.ts",
  "2/C": "x2C00_cognition_phase_report.ts",
  "2/D": "x2D00_inbox.ts",
  "2/E": "x2E00_status.ts",
  "3/5": "x3500_chord_play.ts",
  "3/A": "x3A00_balance.ts",
  "3/C": "x3C00_recipes.ts",
  "4/0": "x4001_chord.ts",
  "4/1": "x4100_style.ts",
  "4/A": "x4A00_capabilities.ts",
  "4/D": "x4D00_propose.ts",
  "4/E": "x4E00_snapshot.ts",
  "4/F": "x4F00_contracts.ts",
  "5/0": "x5001_block.ts",
  "5/2": "x5200_cognition_recommend.ts",
  "5/3": "x5300_recommend_to_chord.ts",
  "5/4": "x5400_validate_schemas.ts",
  "5/9": "x5900_nay.ts",
  "5/A": "x5A00_fresh.ts",
  "5/C": "x5C00_cross_verify.ts",
  "5/D": "x5D00_apply_codeicide.ts",
  "5/E": "x5E00_cognition_recommend_receipt.ts",
  "5/F": "x5F00_apply.ts",
  "6/3": "x6300_ontology_coverage.ts",
  "6/A": "x6A00_health.ts",
  "6/C": "x6C00_audit.ts",
  "6/D": "x6D00_cowitness.ts",
  "6/E": "x6E00_court.ts",
  "7/0": "x7001_grind.ts",
  "7/D": "x7D00_verdict.ts",
  "7/E": "x7E00_anchor_prep.ts",
  "7/F": "x7F00_daemon.ts",
};

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
  return join(SUBSTRATE_ROOT, "src", `unregistered_${pos.replace(/\//g, "_")}.ts`);
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

/** Run a single hex executable and capture its JSON stdout.
 * Returns structured receipt or raw fallback.
 */
export async function runStep(pos: string): Promise<any> {
  const path = positionToPath(pos);
  if (!(await exists(path))) {
    return { type: "error", position: pos, message: `no executable at ${path}` };
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
export async function runSubstrate(def: SubstrateDef): Promise<SubstrateResult> {
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
