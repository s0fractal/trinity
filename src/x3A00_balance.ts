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
// intent: read audit signals and propose where drifting files should be relocated
// maturity: active
// horizon: cross-link with x3C00_recipes — when a balance suggestion has a matching recipe, surface it as remediation candidate (pairs with x3C00's "recipe-as-remediation" horizon)
// skill_tag: balance
// skill_safe: yes
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

import {
  dirname,
  fromFileUrl,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const DIPOLE_AXES = [
  "void_infinity",
  "first_penultimate",
  "mirror_apex",
  "triangle_build",
  "foundation_container",
  "action_decision",
  "harmony_emergence",
  "completion_frontier",
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
  summary: {
    match: number;
    mismatch: number;
    no_dipole: number;
    malformed: number;
  };
  reports: AuditReport[];
}

interface GravityEdge {
  source: string;
  target: string;
  source_file: string;
  target_file: string;
  delta_primary: number;
  delta_hamming: number;
}

interface GravityResponse {
  type: "gravity";
  edges_by_tension: GravityEdge[];
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

async function call_gravity(): Promise<GravityResponse | null> {
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", DISPATCHER, "gravity", "--json"],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  if (!out.success) return null;

  try {
    const raw = new TextDecoder().decode(out.stdout).trim();
    return JSON.parse(raw) as GravityResponse;
  } catch {
    return null;
  }
}

function secondaryAxis(
  signature: number[],
  primaryAxis: number,
): { axis: number; value: number } | null {
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
  return bestAxis === -1 || bestMag === 0
    ? null
    : { axis: bestAxis, value: signature[bestAxis] };
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
  const gravity = await call_gravity();
  const edges = gravity?.edges_by_tension ?? [];
  const gravityWarning = gravity === null
    ? "gravity unavailable; semantic balance only"
    : null;

  const suggestions: Array<{
    path: string;
    current_bucket: string;
    suggested_bucket: string | null;
    pressures: ("semantic" | "coupling")[];
    primary_axis: string | null;
    primary_value: number | null;
    composite_rescue: boolean;
    gravity_edges: Array<{
      target: string;
      target_file: string;
      delta_primary: number;
      delta_hamming: number;
    }>;
    strong_candidate: boolean;
    aligned: boolean;
    note: string;
  }> = [];

  for (const r of audit.reports) {
    const filename = r.path.split("/").pop()!;
    const fileEdges = edges.filter(
      (e) => e.source_file === filename && e.delta_primary >= 2,
    );

    const hasSemantic = r.match === "mismatch";
    const hasCoupling = fileEdges.length > 0;

    if (!hasSemantic && !hasCoupling) continue;

    const pressures: ("semantic" | "coupling")[] = [];
    if (hasSemantic) pressures.push("semantic");
    if (hasCoupling) pressures.push("coupling");

    let suggested_bucket: string | null = null;
    let primary_axis: string | null = null;
    let primary_value: number | null = null;
    let rescue = false;

    if (hasSemantic) {
      const primaryAxis = r.strongest_axes[0];
      suggested_bucket = "0x" + primaryAxis.toString(16).toUpperCase();
      primary_axis = r.strongest_axes_names[0];
      primary_value = r.signature[primaryAxis];
      rescue = compositeRescue(r);
    } else {
      // Coupling is pressure, not authority: do not turn gravity-only edges into move advice.
      suggested_bucket = null;
    }

    const strong_candidate = hasSemantic && hasCoupling;

    // Check if suggested bucket aligns with any of the gravity target buckets
    const targetBuckets = fileEdges.map((e) =>
      "0x" + e.target[0].toUpperCase()
    );
    const aligned = strong_candidate &&
      suggested_bucket !== null &&
      targetBuckets.includes(suggested_bucket);

    let note = "";
    if (strong_candidate) {
      note = aligned
        ? "strong candidate (aligned: dipole mismatch matches high-tension gravity edge target)"
        : "strong candidate (dissonant: dipole mismatch and gravity target point to different buckets)";
    } else if (hasSemantic) {
      note = rescue
        ? "current placement defensible under composite reading (secondary matches second-axis)"
        : "no composite rescue — clear projection-reading dissonance";
    } else {
      note =
        `coupling pressure only — review dependency shape; no bucket move suggested (${fileEdges.length} high-tension edge(s))`;
    }

    suggestions.push({
      path: r.path,
      current_bucket: r.bucket,
      suggested_bucket,
      pressures,
      primary_axis,
      primary_value,
      composite_rescue: rescue,
      gravity_edges: fileEdges.map((e) => ({
        target: e.target,
        target_file: e.target_file,
        delta_primary: e.delta_primary,
        delta_hamming: e.delta_hamming,
      })),
      strong_candidate,
      aligned,
      note,
    });
  }

  // Sort suggestions: strong candidates first, then semantic, then coupling, and then by path
  suggestions.sort((a, b) => {
    if (a.strong_candidate && !b.strong_candidate) return -1;
    if (!a.strong_candidate && b.strong_candidate) return 1;

    const aHasSemantic = a.pressures.includes("semantic");
    const bHasSemantic = b.pressures.includes("semantic");
    if (aHasSemantic && !bHasSemantic) return -1;
    if (!aHasSemantic && bHasSemantic) return 1;

    return a.path.localeCompare(b.path);
  });

  const receipt = {
    type: "balance",
    position: "3/A",
    action: "suggest",
    note:
      "triangle(3) × mirror-pair(A) — gravity-informed dipole rebalance proposals (read-only)",
    summary: {
      total_recommendations: suggestions.length,
      strong_candidates: suggestions.filter((s) => s.strong_candidate).length,
      aligned_strong_candidates: suggestions.filter((s) =>
        s.strong_candidate && s.aligned
      ).length,
      semantic_only: suggestions.filter((s) =>
        s.pressures.includes("semantic") && !s.pressures.includes("coupling")
      ).length,
      coupling_only: suggestions.filter((s) =>
        !s.pressures.includes("semantic") && s.pressures.includes("coupling")
      ).length,
    },
    gravity_warning: gravityWarning,
    suggestions,
    topology:
      "audit + gravity → integrated placement pressure analysis; no moves performed",
    synonyms: [
      "balance",
      "suggest",
      "recommend",
      "rebalance",
      "баланс",
      "балансуй",
      "запропонуй",
      "порадь",
    ],
  };

  if (wantJson) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    // Human-friendly table
    console.log("# balance @ 3/A (proposals only — no moves performed)");
    console.log("# " + "─".repeat(78));
    console.log(
      `# ${receipt.summary.total_recommendations} recommendations: ` +
        `${receipt.summary.strong_candidates} strong (${receipt.summary.aligned_strong_candidates} aligned), ` +
        `${receipt.summary.semantic_only} semantic-only, ${receipt.summary.coupling_only} coupling-only`,
    );
    if (receipt.gravity_warning) {
      console.log(`# warning: ${receipt.gravity_warning}`);
    }
    console.log("# ");
    console.log(
      "# " +
        "path".padEnd(36) +
        "current → suggested".padEnd(24) +
        "pressure".padEnd(22) +
        "details / rescue",
    );
    console.log("# " + "─".repeat(78));
    for (const s of suggestions) {
      const arrow = s.suggested_bucket === null
        ? `0x${s.current_bucket} → review`
        : `0x${s.current_bucket} → ${s.suggested_bucket}`;
      const pressuresLabel = `[${s.pressures.join(", ")}]`;
      const col1 = `# ${s.path.padEnd(34)}`;
      const col2 = `${arrow.padEnd(22)} ${pressuresLabel.padEnd(20)}`;

      let detail = "";
      if (s.strong_candidate) {
        detail = s.aligned ? "★ STRONG (aligned) ★" : "★ STRONG (dissonant) ★";
      } else if (s.pressures.includes("semantic")) {
        detail = s.composite_rescue
          ? "(composite-rescued)"
          : "(clear dissonance)";
      } else {
        const sortedEdges = [...s.gravity_edges].sort(
          (a, b) =>
            b.delta_primary - a.delta_primary ||
            b.delta_hamming - a.delta_hamming,
        );
        const topEdge = sortedEdges[0];
        detail =
          `review coupling to x${topEdge.target}_* (Δp=${topEdge.delta_primary}); no move suggested`;
      }
      console.log(`${col1} ${col2} ${detail}`);
    }
    console.log("# " + "─".repeat(78));
    console.log(`# To execute moves: not yet implemented. Architect decision.`);
  }
}
