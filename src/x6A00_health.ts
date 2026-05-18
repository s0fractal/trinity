#!/usr/bin/env -S deno run --allow-read
// src/x6A00_health.ts — health / harmony / fresh check
// position: 6/A → harmony(6) × apex/fresh(A)
// hex_dipole: "00 59 00 00 00 00 59 00"
//   first_penultimate+0.70, harmony_emergence+0.70 (Kimi: cyclic check, order signal)
//   bucket 6/A: primary axis tied (first_pen 1, harmony 6), bucket 6 ← MATCH on harmony
//               secondary 'A' → hex A = axis 2 negative pole, dipole 0 on axis 2
//               ← does not rescue secondary
//   primary-axis MATCH; secondary is loose
//   audit phase 1 annotation: claude-opus-4-7-1m, anchor block 949260
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
    const text = await Deno.readTextFile(join(ROOT, "..", "src", "x0001_glossary.ndjson"));
    const lines = text.trim().split("\n").filter((l) => l.trim());
    let words = 0;
    let records = 0;
    for (const line of lines) {
      try {
        const r = JSON.parse(line);
        records++;
        // type:5 records (words) are stored as `"00":"5"` in the glossary,
        // while schema/dipole records use the two-char form (`"00":"05"`).
        // Accept both so this counter stays honest under either convention.
        if (r["00"] === "5" || r["00"] === "05") words++;
      } catch { /* skip */ }
    }
    return { ok: true, records, words };
  } catch (e) {
    return { ok: false, records: 0, words: 0 };
  }
}

if (import.meta.main) {
  const checks: HealthCheck[] = [];

  // Dynamically scan all hex executables (0x*/**/*.ts, *.sh)
  async function scan(dir: string, prefix: string): Promise<string[]> {
    const out: string[] = [];
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (entry.isFile && (entry.name.endsWith(".ts") || entry.name.endsWith(".sh"))) {
          out.push(prefix + entry.name);
        } else if (entry.isDirectory && entry.name.match(/^(0x)?[0-9A-Fa-f]$/)) {
          const sub = await scan(`${dir}/${entry.name}`, prefix + entry.name + "/");
          out.push(...sub);
        }
      }
    } catch { /* skip unreadable dirs */ }
    return out;
  }

  const allFiles = await scan(`${ROOT}/..`, "");

  for (const f of allFiles) {
    const exists = await checkFile(`../${f}`);
    checks.push({
      name: `file:${f}`,
      status: exists ? "ok" : "fail",
      detail: exists ? "exists" : "missing",
    });
  }

  for (const f of allFiles) {
    const hasDipole = await checkDipole(`../${f}`);
    checks.push({
      name: `dipole:${f}`,
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
