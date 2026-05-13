#!/usr/bin/env -S deno run --allow-read
// 0x6/A.ts — health / harmony / fresh check
// position: 6/A → harmony(6) × apex/fresh(A)
// hex_dipole: "00 59 00 00 00 00 59 00"
// lifecycle_phase: 1
//
// Quick health check: validates substrate structure without
// running tests. Checks file existence, dipole headers, glossary
// consistency. Returns health receipt.
//
// Glossary words: health, check, status, harmony, гармонія, здоров'я

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const ROOT = dirname(fromFileUrl(import.meta.url));

interface HealthCheck {
  name: string;
  status: "ok" | "warn" | "fail";
  detail: string;
}

async function checkFile(path: string): Promise<boolean> {
  try {
    await Deno.stat(join(ROOT, path));
    return true;
  } catch {
    return false;
  }
}

async function checkDipole(path: string): Promise<boolean> {
  try {
    const text = await Deno.readTextFile(join(ROOT, path));
    return text.includes("hex_dipole:");
  } catch {
    return false;
  }
}

async function checkGlossary(): Promise<{ ok: boolean; records: number; words: number }> {
  try {
    const text = await Deno.readTextFile(join(ROOT, "..", "0x0", "00.ndjson"));
    const lines = text.trim().split("\n").filter((l) => l.trim());
    let words = 0;
    let records = 0;
    for (const line of lines) {
      try {
        const r = JSON.parse(line);
        records++;
        if (r["00"] === "05") words++;
      } catch { /* skip */ }
    }
    return { ok: true, records, words };
  } catch (e) {
    return { ok: false, records: 0, words: 0 };
  }
}

if (import.meta.main) {
  const checks: HealthCheck[] = [];

  // Check core executables exist
  const executables = ["../0x0/01.ts", "../0x0/0F.ts", "../0x5/0.ts", "../0x5/A.ts", "../0x5/C.ts", "../0x5/D.ts"];
  for (const exe of executables) {
    const exists = await checkFile(exe);
    checks.push({
      name: `file:${exe.replace("../", "")}`,
      status: exists ? "ok" : "fail",
      detail: exists ? "exists" : "missing",
    });
  }

  // Check dipole headers
  const dipoleFiles = ["../0x0/01.ts", "../0x0/02.sh", "../0x0/0F.ts", "../0x5/0.ts", "../0x5/A.ts", "../0x5/C.ts", "../0x5/D.ts"];
  for (const f of dipoleFiles) {
    const hasDipole = await checkDipole(f);
    checks.push({
      name: `dipole:${f.replace("../", "")}`,
      status: hasDipole ? "ok" : "warn",
      detail: hasDipole ? "header present" : "missing hex_dipole",
    });
  }

  // Check glossary
  const glossary = await checkGlossary();
  checks.push({
    name: "glossary:records",
    status: glossary.ok ? "ok" : "fail",
    detail: glossary.ok ? `${glossary.records} records, ${glossary.words} words` : "cannot read",
  });

  // Check substrate directories exist
  for (const dir of ["../omega", "../liquid", "../myc"]) {
    const exists = await checkFile(dir);
    checks.push({
      name: `dir:${dir.replace("../", "")}`,
      status: exists ? "ok" : "warn",
      detail: exists ? "present" : "missing",
    });
  }

  const ok = checks.filter((c) => c.status === "ok").length;
  const warn = checks.filter((c) => c.status === "warn").length;
  const fail = checks.filter((c) => c.status === "fail").length;

  const receipt = {
    type: "health",
    position: "6/A",
    action: "health",
    note: "6(harmony) × A(apex/fresh) — fresh health check",
    summary: {
      total: checks.length,
      ok,
      warn,
      fail,
      overall: fail === 0 ? "healthy" : warn === 0 ? "degraded" : "critical",
    },
    checks,
    synonyms: ["health", "check", "status", "harmony", "гармонія", "здоров'я"],
  };

  console.log(JSON.stringify(receipt, null, 2));
}
