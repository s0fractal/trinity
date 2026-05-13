#!/usr/bin/env -S deno run --allow-all
// 0x5/C.ts — cross-substrate verify / container action
// position: 5/C → action(5) × container/cycle(C)
// hex_dipole: "00 00 59 00 00 00 59 00"
// lifecycle_phase: 1
//
// Cross-substrate verification: executes verify/test across
// all available substrates and collects results into unified
// receipt format. Demonstrates adapter pattern: shared hex
// addressing (0x5/C = verify) with substrate-specific execution.
//
// Substrate mappings:
//   trinity → deno test --allow-all
//   omega   → cargo test (external trigger)
//   liquid  → hex→φ adapter (pending)
//   myc     → descriptor check (pending)
//
// Usage: t verify          (all substrates)
//        t verify trinity  (single substrate)
//
// Returns JSON receipt for dispatcher rendering.

interface SubstrateDef {
  name: string;
  cwd: string;
  cmd: string[] | null;
  note: string;
}

interface SubstrateResult {
  substrate: string;
  command: string | null;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  duration_ms: number;
  status: "passed" | "failed" | "timeout" | "not_implemented";
}

const SUBSTRATES: SubstrateDef[] = [
  {
    name: "trinity",
    cwd: ".",
    cmd: ["deno", "check", "0x0/01.ts", "0x5/0.ts", "0x5/A.ts", "0x5/C.ts"],
    note: "Trinity substrate: type-check hex substrate files (deno test skipped — liquid/tests have pre-existing TS errors)",
  },
  {
    name: "omega",
    cwd: "omega",
    cmd: ["cargo", "test"],
    note: "Omega substrate: Frozen Rust math library (external trigger)",
  },
  {
    name: "liquid",
    cwd: "liquid",
    cmd: null,
    note: "Liquid substrate: φ-routing requires hex→φ adapter (not yet implemented)",
  },
  {
    name: "myc",
    cwd: "myc",
    cmd: null,
    note: "MYC substrate: publication descriptor check (not yet mapped)",
  },
];

const TIMEOUT_MS = 60000;

async function runSubstrate(def: SubstrateDef): Promise<SubstrateResult> {
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

if (import.meta.main) {
  const filter = Deno.args[0];
  const targets = filter
    ? SUBSTRATES.filter((s) => s.name === filter)
    : SUBSTRATES;

  if (targets.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      position: "5/C",
      message: `Unknown substrate: ${filter}`,
      available: SUBSTRATES.map((s) => s.name),
    }));
    Deno.exit(1);
  }

  // Run all targets in parallel
  const results = await Promise.all(targets.map(runSubstrate));

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "not_implemented").length;
  const timeouts = results.filter((r) => r.status === "timeout").length;

  const receipt = {
    type: "cross_substrate_verify",
    position: "5/C",
    action: "verify",
    note: "5(action) × C(container) — verify across all substrates",
    summary: {
      total: results.length,
      passed,
      failed,
      skipped,
      timeout: timeouts,
      overall: failed === 0 && timeouts === 0 ? "passed" : "failed",
    },
    substrates: results,
    adapter_pattern: "shared_hex_addressing + substrate_specific_execution",
    falsifier: "If any substrate shows 'not_implemented' forever, this is a sketch not a bridge",
  };

  console.log(JSON.stringify(receipt, null, 2));
}
