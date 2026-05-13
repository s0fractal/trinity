// lib/runner.ts — shared runner utilities
// Hex substrate infrastructure: NOT an executable.
// Provides position→path resolution, step execution, and substrate
// spawning with timeout/abort. Centralizes duplicated logic from
// 0x0/03.ts, 0x0/04.ts, 0x0/05.ts, and 0x5/C.ts.

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const SUBSTRATE_ROOT = join(dirname(fromFileUrl(import.meta.url)), "..");
const TIMEOUT_MS = 60000;

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

/** Map a fractal hex position to a filesystem path.
 *  "5/C"     → "0x5/C.ts"
 *  "5/C/A"   → "0x5/C/A.ts"
 *  "5/C/A/3" → "0x5/C/A/3.ts"
 */
export function positionToPath(pos: string): string {
  const parts = pos.split("/");
  const top = `0x${parts[0]}`;
  const mid = parts.slice(1, -1);
  const file = parts[parts.length - 1] + ".ts";
  return join(SUBSTRATE_ROOT, top, ...mid, file);
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
 * 0x0/03.ts and 0x5/C.ts.
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
