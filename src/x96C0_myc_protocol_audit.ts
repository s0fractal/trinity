#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x96C0_myc_protocol_audit.ts — myc-protocol-audit-shadow / x9 myc audit bridge
// position: 9/6C → imported-substrate namespace(9) × native MYC protocol audit(6/C)
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "00 00 33 00 00 00 6C 33"
//   harmony_emergence+0.85 (PRIMARY: reflects MYC protocol consistency)
//   mirror_apex+0.40 (reports native audit result into Trinity)
//   bucket 9/6C: x9 imported-substrate namespace; native axis 6 ← MATCH
// lifecycle_phase: 0
// placement_policy: substrate_namespace
//
// myc-protocol-audit-shadow — prototype x9 adapter for MYC protocol audit.

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const SOURCE = join(ROOT, "myc", "src", "x6C00_protocol_audit.ts");
const MYC_ROOT = join(ROOT, "myc");

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function callNativeMycProtocolAudit(): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  parsed: any | null;
}> {
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-read", SOURCE, MYC_ROOT],
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
        type: "myc_protocol_audit_shadow",
        position: "9/6C",
        action: "audit",
        substrate: "myc",
        shadow: true,
        source: "myc/src/x6C00_protocol_audit.ts",
        summary: {
          overall: "missing",
          parity: "source-missing",
        },
        error: "MYC native protocol audit source is missing",
      },
      null,
      2,
    ));
    Deno.exit(1);
  }

  const native = await callNativeMycProtocolAudit();
  const nativeOk = native.parsed?.ok === true;
  const overall = native.code === 0 && nativeOk ? "healthy" : "failed";
  const payload = {
    type: "myc_protocol_audit_shadow",
    position: "9/6C",
    action: "audit",
    substrate: "myc",
    shadow: true,
    source: "myc/src/x6C00_protocol_audit.ts",
    source_root: "myc",
    source_exit_code: native.code,
    summary: {
      overall,
      parity: native.parsed ? "shadow-calls-native" : "native-output-invalid",
      ok: nativeOk,
      checked_files: native.parsed?.checked_files ?? 0,
      errors: native.parsed?.errors?.length ?? null,
      warnings: native.parsed?.warnings?.length ?? null,
    },
    native: native.parsed,
    stderr: native.stderr || undefined,
  };

  console.log(JSON.stringify(payload, null, 2));
  if (native.code !== 0 || !nativeOk) Deno.exit(1);
}

if (import.meta.main) {
  await main();
}
