#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x94A0_myc_capabilities.ts — myc-capabilities-shadow / x9 myc capabilities bridge
// position: 9/4A → imported-substrate namespace(9) × native MYC capabilities(4/A)
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "00 00 00 00 6C 33 00 00"
//   foundation_container+0.85 (PRIMARY: reflects MYC capability foundation)
//   action_decision+0.40 (wraps native command execution)
//   bucket 9/4A: x9 imported-substrate namespace; native axis 4 ← MATCH
// lifecycle_phase: 0
// placement_policy: substrate_namespace
//
// myc-capabilities-shadow — prototype x9 adapter for MYC capabilities.

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const SOURCE = join(ROOT, "myc", "src", "x4A00_capabilities.ts");

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function callNativeMycCapabilities(): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  parsed: any | null;
}> {
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-read", SOURCE, "--json"],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  const stdout = new TextDecoder().decode(out.stdout).trim();
  const stderr = new TextDecoder().decode(out.stderr).trim();
  let parsed: any | null = null;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    parsed = null;
  }
  return { code: out.code, stdout, stderr, parsed };
}

async function main() {
  if (!(await fileExists(SOURCE))) {
    console.log(JSON.stringify(
      {
        type: "capabilities",
        position: "9/4A",
        action: "capabilities",
        substrate: "myc",
        shadow: true,
        source: "myc/src/x4A00_capabilities.ts",
        summary: {
          overall: "missing",
          parity: "source-missing",
        },
        capabilities: [],
        error: "MYC native capabilities source is missing",
      },
      null,
      2,
    ));
    Deno.exit(1);
  }

  const native = await callNativeMycCapabilities();
  const nativeOverall = native.parsed?.summary?.overall ?? "invalid";
  const overall = native.code === 0 && native.parsed ? nativeOverall : "failed";
  const payload = {
    type: "capabilities",
    position: "9/4A",
    action: "capabilities",
    substrate: "myc",
    shadow: true,
    source: "myc/src/x4A00_capabilities.ts",
    source_exit_code: native.code,
    summary: {
      overall,
      parity: native.parsed ? "shadow-calls-native" : "native-output-invalid",
      native_overall: nativeOverall,
      total: native.parsed?.summary?.total ?? 0,
    },
    capabilities: native.parsed?.capabilities ?? [],
    native: native.parsed,
    stderr: native.stderr || undefined,
  };

  console.log(JSON.stringify(payload, null, 2));
  if (native.code !== 0 || !native.parsed) Deno.exit(1);
}

if (import.meta.main) {
  await main();
}
