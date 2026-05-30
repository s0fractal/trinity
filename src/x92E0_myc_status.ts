#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x92E0_myc_status.ts — myc-status-shadow / x9 myc status bridge
// position: 9/2E → imported-substrate namespace(9) × native MYC status(2/E)
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "00 00 6C 33 00 00 00 00"
//   mirror_apex+0.85 (PRIMARY: reflects native MYC status into Trinity)
//   triangle_build+0.40 (wraps one substrate receipt into another)
//   bucket 9/2E: x9 imported-substrate namespace; native axis 2 ← MATCH
// lifecycle_phase: 0
// placement_policy: substrate_namespace
//
// myc-status-shadow — prototype x9 adapter for MYC status without copying MYC.

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const SOURCE = join(ROOT, "myc", "src", "x2E00_status.ts");

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

function nativeOverall(native: any): string {
  return native?.summary?.overall ??
    native?.summary?.health?.overall ??
    native?.summary?.health?.status ??
    "unknown";
}

async function callNativeMycStatus(): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  parsed: any | null;
}> {
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-read", SOURCE],
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
  const sourceExists = await fileExists(SOURCE);
  if (!sourceExists) {
    console.log(JSON.stringify(
      {
        type: "status",
        position: "9/2E",
        action: "status",
        substrate: "myc",
        shadow: true,
        source: "myc/src/x2E00_status.ts",
        summary: {
          overall: "missing",
          parity: "source-missing",
        },
        error: "MYC native status source is missing",
      },
      null,
      2,
    ));
    Deno.exit(1);
  }

  const native = await callNativeMycStatus();
  const nativeStatus = native.parsed ? nativeOverall(native.parsed) : "invalid";
  const overall = native.code === 0 && native.parsed ? nativeStatus : "failed";

  const payload = {
    type: "status",
    position: "9/2E",
    action: "status",
    substrate: "myc",
    shadow: true,
    source: "myc/src/x2E00_status.ts",
    source_exit_code: native.code,
    summary: {
      overall,
      parity: native.parsed ? "shadow-calls-native" : "native-output-invalid",
      native_overall: nativeStatus,
    },
    native: native.parsed,
    stderr: native.stderr || undefined,
  };

  console.log(JSON.stringify(payload, null, 2));
  if (native.code !== 0 || !native.parsed) Deno.exit(1);
}

if (import.meta.main) {
  await main();
}
