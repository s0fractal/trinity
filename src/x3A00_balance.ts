#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x3A00_balance.ts — balance / suggest / recommend / rebalance
// position: 3/A → triangle(3) × mirror-pair(A) = composition of reflection
// hex_dipole: "00 00 40 6C 26 33 4C 40"
//   triangle_build+0.85 (PRIMARY: composes audit → restructuring proposals)
//   harmony_emergence+0.60 (proposes order)
//   mirror_apex+0.50 (reflects current vs intended)
//   completion_frontier+0.50 (produces final recommendation list)
//   action_decision+0.40 (suggests actions but does not take them)
//   foundation_container+0.30 (reads container state via audit)
//   bucket 3/A: primary axis triangle (3), bucket 3 ← MATCH
//               secondary 'A' → hex A = axis 2 negative pole, dipole +0.50
//               on axis 2 ← PAIR-MATCH (sign-opposed; offer on need-bucket)
//   measured by claude-opus-4-7-1m. First file at 0x3/ — establishes bucket.
// lifecycle_phase: 0
//
// balance — dipole-driven rebalancing proposals (read-only)
//
// Spawns `t audit --json`, parses, and for each mismatched file emits
// a suggested target bucket based on strongest axis. Pure advisory:
// no file moves, no glossary edits, no destructive ops. The architect
// (or a future autonomous voice) decides whether to execute.
//
// Output: list of proposed moves like
//   0x0/03.ts  →  0x3/?  (triangle+0.85)
//   0x0/06.ts  →  0x6/?  (harmony+0.70)  composite-rescue: /06 matches
//
// Secondary character intentionally '?' — the bucket axis is determined
// by dipole, but secondary placement within bucket remains a creative
// choice for the author.
//
// Composite-rescue note: files whose secondary position already matches
// their second-strongest axis (e.g. 0x0/06 try, where /06 matches
// harmony) are flagged as "current placement defensible under composite
// reading". Suggestion still emitted; tag tells reader the move is
// optional.
//
// Glossary words: balance, suggest, recommend, rebalance, баланс,
//                 балансуй, запропонуй, порадь

import { dirname, fromFileUrl } from "https://deno.land/std@0.224.0/path/mod.ts";

const DIPOLE_AXES = [
  "void_infinity", "first_penultimate", "mirror_apex", "triangle_build",
  "foundation_container", "action_decision", "harmony_emergence", "completion_frontier",
] as const;

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const DISPATCHER = `${ROOT}/src/x0100_dispatch.ts`;

interface AuditReport {
  path: string;
  bucket: string;
  signature: number[];
  strongest_axes: number[];
  strongest_axes_names: string[];
  match: string;
}

interface AuditResponse {
  type: string;
  total: number;
  summary: { match: number; mismatch: number; no_dipole: number; malformed: number };
  reports: AuditReport[];
}

async function call_audit(): Promise<AuditResponse> {
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", DISPATCHER, "audit", "--json"],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  const raw = new TextDecoder().decode(out.stdout).trim();
  return JSON.parse(raw) as AuditResponse;
}

function secondaryAxis(signature: number[], primaryAxis: number): { axis: number; value: number } | null {
  let bestAxis = -1;
  let bestMag = -1;
  for (let i = 0; i < signature.length; i++) {
    if (i === primaryAxis) continue;
    const mag = Math.abs(signature[i]);
    if (mag > bestMag) {
      bestMag = mag;
      bestAxis = i;
    }
  }
  return bestAxis === -1 || bestMag === 0 ? null : { axis: bestAxis, value: signature[bestAxis] };
}

function compositeRescue(report: AuditReport): boolean {
  // Does the file's secondary path char match its second-strongest axis?
  // path looks like "0x0/06.ts" or "0x5/C/A.ts"
  const parts = report.path.replace(/\.ts$|\.sh$/, "").split("/");
  if (parts.length < 2) return false;
  const secondary = parts[1];
  // For depth-2 ("0x0/06"), secondary is "06" — interpret last hex char as axis
  // For depth-3 ("0x5/C/A"), still take parts[1]
  const lastChar = secondary[secondary.length - 1];
  if (!lastChar.match(/^[0-9A-Fa-f]$/)) return false;
  const secAxisRaw = parseInt(lastChar, 16);
  const secAxis = secAxisRaw % 8;
  const second = secondaryAxis(report.signature, report.strongest_axes[0]);
  if (!second) return false;
  return secAxis === second.axis;
}

if (import.meta.main) {
  const wantJson = Deno.args.includes("--json");
  const audit = await call_audit();
  const suggestions: Array<{
    path: string;
    current_bucket: string;
    suggested_bucket: string;
    primary_axis: string;
    primary_value: number;
    composite_rescue: boolean;
    note: string;
  }> = [];

  for (const r of audit.reports) {
    if (r.match !== "mismatch") continue;
    const primaryAxis = r.strongest_axes[0]; // tie-break: lowest index
    const suggestedBucket = primaryAxis.toString(16).toUpperCase();
    const primaryValue = r.signature[primaryAxis];
    const rescue = compositeRescue(r);
    suggestions.push({
      path: r.path,
      current_bucket: r.bucket,
      suggested_bucket: `0x${suggestedBucket}`,
      primary_axis: r.strongest_axes_names[0],
      primary_value: primaryValue,
      composite_rescue: rescue,
      note: rescue
        ? "current placement defensible under composite reading (secondary matches second-axis)"
        : "no composite rescue — clear projection-reading dissonance",
    });
  }

  const receipt = {
    type: "balance",
    position: "3/A",
    action: "suggest",
    note: "triangle(3) × mirror-pair(A) — dipole-driven rebalance proposals (read-only)",
    summary: {
      total_mismatches: suggestions.length,
      with_composite_rescue: suggestions.filter((s) => s.composite_rescue).length,
      clean_dissonance: suggestions.filter((s) => !s.composite_rescue).length,
    },
    suggestions,
    topology: "audit (mismatch list) → primary-axis projection → suggested bucket; no moves performed",
    synonyms: ["balance", "suggest", "recommend", "rebalance", "баланс", "балансуй", "запропонуй", "порадь"],
  };

  if (wantJson) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    // Human-friendly table (passes through dispatcher as raw text)
    console.log("# balance @ 3/A (proposals only — no moves performed)");
    console.log("# " + "─".repeat(74));
    console.log(`# ${suggestions.length} mismatches, ${receipt.summary.with_composite_rescue} composite-rescued, ${receipt.summary.clean_dissonance} clean`);
    console.log("# ");
    console.log("# path".padEnd(22) + "current → suggested  strongest axis             rescue");
    console.log("# " + "─".repeat(74));
    for (const s of suggestions) {
      const arrow = `0x${s.current_bucket} → ${s.suggested_bucket}`;
      const axisLabel = `axis ${parseInt(s.suggested_bucket.slice(2), 16)} ${s.primary_axis}`.padEnd(28);
      const rescue = s.composite_rescue ? "(composite-rescued)" : "";
      console.log(`# ${s.path.padEnd(20)} ${arrow.padEnd(14)} ${axisLabel}  ${rescue}`);
    }
    console.log("# " + "─".repeat(74));
    console.log(`# To execute moves: not yet implemented. Architect decision.`);
  }
}
