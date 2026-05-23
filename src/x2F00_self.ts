#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x2F00_self.ts — substrate self / unified self-introspection
// position: 2/F → mirror(2) × frontier-pair(F) = completion-edge of self-mirror
// hex_dipole: "26 26 6C 26 26 26 26 59"
//   mirror_apex+0.85 (PRIMARY: reflects substrate state; bucket 2 MATCH)
//   completion_frontier+0.70 (frontier-pair sub-position F)
//   triangle/foundation/action/harmony+0.30 (composes all axes)
// placement_policy: axis
// intent: composed substrate self-introspection — status + organ count + voices + chord activity + probe distribution + contracts in one summary
// maturity: active
// horizon: none (refresh and submodule rollups implemented)
// skill_tag: self
// skill_safe: yes
//
// "self" — single command answering "show me yourself".
//
// Composes the six self-description axes (agents/skill/memory/roadmap/
// probes/external-surfaces) + status into one tight dashboard. Supports --refresh flag

// to regenerate axes in parallel first.
//
// Uses parallel() from x0030_compose for concurrent reads. Substrate-
// pointed by architect 2026-05-23 audit "next steps" #3: "додати t self
// як композиція status + agents + skill + memory + roadmap + probes".
//
// Reads (all lightweight scans, no full regen):
//   - `t status --json` for composite health + audit summary + submodules
//   - src/x*.ts file scan for organ count grouped by bucket
//   - src/x8A*_voice_*.myc.json count for voice registry
//   - jazz/chords/*.md count for chord trail size
//   - probes/* dir count for experimental frontier
//   - `t contracts --json` for sunset/draft summary
//
// Glossary words: self, я, себе, substrate-self, substrate

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { parallel, tryOr } from "./x0030_compose.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const T_SHIM = join(ROOT, "t");

const ORGAN_FILE_RE = /^x([0-9A-Fa-f])([0-9A-Fa-f]{3})_/;
const VOICE_FILE_RE = /^x8A[0-9A-Fa-f]{2}_voice_([^.]+)\.myc\.json$/;

// Invoke `t <cmd> ...args` and parse JSON from the first JSON-shaped line
// of stdout (dispatcher prepends a `# <action> → <pos>` header).
async function callT(cmd: string, args: string[] = []): Promise<unknown> {
  const proc = new Deno.Command(T_SHIM, {
    args: [cmd, ...args],
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout } = await proc.output();
  const text = new TextDecoder().decode(stdout);
  const jsonLine = text.split("\n").find((l) =>
    l.trimStart().startsWith("{") || l.trimStart().startsWith("[")
  );
  if (!jsonLine) throw new Error(`callT: no JSON in ${cmd} output`);
  return JSON.parse(jsonLine);
}

async function scanOrgans(): Promise<
  { total: number; byBucket: Record<string, number> }
> {
  const byBucket: Record<string, number> = {};
  let total = 0;
  for await (const entry of Deno.readDir(HERE)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(".ts")) continue;
    const m = ORGAN_FILE_RE.exec(entry.name);
    if (!m) continue;
    total++;
    const bucket = m[1].toUpperCase();
    byBucket[bucket] = (byBucket[bucket] ?? 0) + 1;
  }
  return { total, byBucket };
}

async function scanVoices(): Promise<{ total: number; identities: string[] }> {
  const identities: string[] = [];
  for await (const entry of Deno.readDir(HERE)) {
    if (!entry.isFile) continue;
    const m = VOICE_FILE_RE.exec(entry.name);
    if (!m) continue;
    identities.push(m[1]);
  }
  identities.sort();
  return { total: identities.length, identities };
}

async function scanChords(): Promise<{ total: number; newForm: number }> {
  const dir = join(ROOT, "jazz", "chords");
  let total = 0;
  let newForm = 0;
  for await (const entry of Deno.readDir(dir)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    total++;
    if (/^x[0-9A-Fa-f]{4}_\d+_/.test(entry.name)) newForm++;
  }
  return { total, newForm };
}

async function scanProbes(): Promise<{ total: number }> {
  const dir = join(ROOT, "probes");
  let total = 0;
  for await (const entry of Deno.readDir(dir)) {
    if (!entry.isDirectory) continue;
    total++;
  }
  return { total };
}

async function countSubmoduleOrgans(sub: string): Promise<number> {
  let count = 0;
  try {
    for await (const entry of Deno.readDir(join(ROOT, sub, "src"))) {
      if (
        entry.isFile &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".rs"))
      ) {
        count++;
      }
    }
  } catch { /* ignore */ }
  return count;
}

interface StatusShape {
  summary?: { overall?: string; audit?: { match: number; total: number } };
  substrate_health?: { overall?: string };
  submodules?: Record<string, { summary?: { overall?: string } } | null>;
}

interface ContractsShape {
  summary?: {
    total: number;
    active: number;
    draft: number;
    pinned: number;
  };
}

if (import.meta.main) {
  const wantJson = Deno.args.includes("--json");
  const wantRefresh = Deno.args.includes("--refresh");

  if (wantRefresh) {
    // Run the six self-description axes in parallel before gathering info
    await Promise.all([
      tryOr(() => callT("agents", ["--stable"]), null),
      tryOr(() => callT("skill", ["--stable"]), null),
      tryOr(() => callT("memory", ["--stable"]), null),
      tryOr(() => callT("roadmap", ["--stable"]), null),
      tryOr(() => callT("probes", ["--stable"]), null),
      tryOr(() => callT("external-surfaces", ["--stable"]), null),
    ]);
  }

  // Parallel reads. Each is independently failure-tolerant via tryOr
  // so one slow/missing source doesn't block the others.
  const data = await parallel({
    status: () => tryOr(() => callT("status", ["--json"]), null),
    contracts: () => tryOr(() => callT("contracts", ["--json"]), null),
    organs: scanOrgans,
    voices: scanVoices,
    chords: scanChords,
    probes: scanProbes,
    liquidOrgans: () => countSubmoduleOrgans("liquid"),
    omegaOrgans: () => countSubmoduleOrgans("omega"),
    mycOrgans: () => countSubmoduleOrgans("myc"),
  });

  const status = data.status as StatusShape | null;
  const contracts = data.contracts as ContractsShape | null;

  const composite = status?.substrate_health?.overall ?? "unknown";
  const audit = status?.summary?.audit
    ? `${status.summary.audit.match}/${status.summary.audit.total}`
    : "?/?";
  const submodules = status?.submodules ?? {};

  const receipt = {
    type: "self",
    position: "2/F",
    action: "self",
    note:
      "mirror+frontier-pair — composed substrate self-introspection across the 6 self-description axes",
    composite_health: composite,
    audit_match: audit,
    organs: data.organs,
    voices: { count: data.voices.total, identities: data.voices.identities },
    chords: data.chords,
    probes: data.probes,
    contracts: contracts?.summary ?? null,
    submodules: {
      liquid: {
        health: submodules.liquid?.summary?.overall ?? "missing",
        organs: data.liquidOrgans,
      },
      omega: {
        health: submodules.omega?.summary?.overall ?? "missing",
        organs: data.omegaOrgans,
      },
      myc: {
        health: submodules.myc?.summary?.overall ?? "missing",
        organs: data.mycOrgans,
      },
    },
    synonyms: ["self", "я", "себе", "substrate-self", "substrate"],
    topology:
      "parallel reads of status + contracts + organ/voice/chord/probe scans; renders unified dashboard; --refresh option regenerates all 6 self-description axes in parallel before scanning",
  };

  if (wantJson) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    console.log(`# self @ 2/F — substrate self-mirror`);
    console.log(`# ${"─".repeat(70)}`);
    console.log(`# health:      ${composite} (${audit} audit match)`);
    console.log(
      `# organs:      ${data.organs.total} across ${
        Object.keys(data.organs.byBucket).length
      } buckets`,
    );
    const buckets = Object.entries(data.organs.byBucket).sort()
      .map(([b, n]) => `${b}:${n}`).join("  ");
    console.log(`#              ${buckets}`);
    console.log(
      `# voices:      ${data.voices.total} registered (${
        data.voices.identities.join(", ")
      })`,
    );
    console.log(
      `# chords:      ${data.chords.total} total, ${data.chords.newForm} flat-src form (${
        ((data.chords.newForm / data.chords.total) * 100).toFixed(1)
      }%)`,
    );
    console.log(`# probes:      ${data.probes.total} experimental dirs`);
    if (contracts?.summary) {
      console.log(
        `# contracts:   ${contracts.summary.total} total (active:${contracts.summary.active} draft:${contracts.summary.draft} pinned:${contracts.summary.pinned})`,
      );
    }
    console.log(`# submodules:`);
    console.log(
      `#   liquid   ${receipt.submodules.liquid.health} (${receipt.submodules.liquid.organs} organs)`,
    );
    console.log(
      `#   omega    ${receipt.submodules.omega.health} (${receipt.submodules.omega.organs} organs)`,
    );
    console.log(
      `#   myc      ${receipt.submodules.myc.health} (${receipt.submodules.myc.organs} organs)`,
    );
    console.log(`# ${"─".repeat(70)}`);
    console.log(`# drill-downs:`);
    console.log(`#   t status / t audit / t agents / t skill / t memory`);
    console.log(`#   t roadmap / t probes / t contracts / t voices / t help`);
    console.log(
      `#   t self --refresh  (to regenerate self-description axes first)`,
    );
  }
}
