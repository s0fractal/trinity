#!/usr/bin/env -S deno run --allow-all
// 0x0/03.ts — all / map / broadcast
// position: 0/03 → foundation × triangle/trinity
// hex_dipole: "00 00 00 00 00 00 00 00"
// lifecycle_phase: 0
//
// Functional primitive: map a hex signal across all substrates
// that have type:06 registry entries for this position.
//
// This is the topological truth per Gemini (16:45Z):
//   t = apply
//   cross-substrate verification = map(0x5/C, substrates) + join
//
// Usage: t all verify   → map verify (5/A) across substrates
//        t all 5/C      → map 5/C across substrates
//        t all health    → map health (6/A) across substrates
//        t all 5/C --deep omega  → map with deep override for omega
//
// Returns unified receipt with per-substrate results.
// Does NOT hardcode substrate commands — reads from glossary type:06.

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const GLOSSARY_PATH = join(dirname(fromFileUrl(import.meta.url)), "..", "0x0", "00.ndjson");
const TIMEOUT_MS = 60000;

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

async function fn_resolve_word(word: string): Promise<string | null> {
  try {
    const text = await Deno.readTextFile(GLOSSARY_PATH);
    for (const line of text.trim().split("\n")) {
      try {
        const r = JSON.parse(line);
        if (r["00"] === "05" && r["01"] === word) return r["12"];
      } catch { /* skip */ }
    }
  } catch { /* glossary missing */ }
  return null;
}

async function fn_load_substrate_mappings(position: string): Promise<SubstrateDef[]> {
  const defs: SubstrateDef[] = [];
  try {
    const text = await Deno.readTextFile(GLOSSARY_PATH);
    for (const line of text.trim().split("\n")) {
      try {
        const r = JSON.parse(line);
        if (r["00"] === "06" && r["02"] === position) {
          const cmd = r["03"] ? String(r["03"]).split(" ") : null;
          defs.push({ name: r["01"], cwd: r["04"] ?? ".", cmd, note: r["05"] ?? "" });
        }
      } catch { /* skip bad lines */ }
    }
  } catch { /* glossary missing */ }
  return defs;
}

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
  const args = [...Deno.args];
  const deepIdx = args.indexOf("--deep");
  const deepSubstrate = deepIdx >= 0 ? args[deepIdx + 1] : null;
  const filteredArgs = deepIdx >= 0 ? args.filter((_, i) => i !== deepIdx && i !== deepIdx + 1) : args;
  const target = filteredArgs[0];

  if (!target) {
    console.log(JSON.stringify({
      type: "error",
      message: "Usage: t all <position|word> [--deep <substrate>]",
    }));
    Deno.exit(1);
  }

  // Resolve word to position if needed
  let position = target;
  if (!target.match(/^[0-9A-Fa-f]\/[0-9A-Fa-f]$/)) {
    const resolved = await fn_resolve_word(target);
    if (!resolved) {
      console.log(JSON.stringify({
        type: "error",
        message: `Unknown word: ${target}`,
      }));
      Deno.exit(1);
    }
    position = resolved;
  }

  let substrates = await fn_load_substrate_mappings(position);
  if (substrates.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message: `No substrate mappings for ${position}`,
      available: [],
    }));
    Deno.exit(1);
  }

  // Apply deep override
  if (deepSubstrate) {
    substrates = substrates.map((d) => {
      if (d.name === deepSubstrate && d.cmd && d.cmd[0] === "cargo" && d.cmd[1] === "check") {
        return { ...d, cmd: ["cargo", "test"], note: d.note + " (deep mode)" };
      }
      return d;
    });
  }

  // Run all targets in parallel
  const results = await Promise.all(substrates.map(runSubstrate));

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "not_implemented").length;
  const timeouts = results.filter((r) => r.status === "timeout").length;

  const receipt = {
    type: "all",
    position,
    action: "map",
    mode: deepSubstrate ? `deep:${deepSubstrate}` : "quick",
    note: `map(${position}) across ${substrates.length} substrates`,
    summary: {
      total: results.length,
      passed,
      failed,
      skipped,
      timeout: timeouts,
      overall: failed === 0 && timeouts === 0 ? "passed" : "failed",
    },
    substrates: results,
    topology: "map + join (functional composition)",
    falsifier: "If type:06 registry is empty, all is useless — it becomes a fancy no-op",
  };

  console.log(JSON.stringify(receipt, null, 2));
}
