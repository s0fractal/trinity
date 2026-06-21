#!/usr/bin/env -S deno run -A
// src/x2400_cognition_snapshot.ts — cognition_snapshot (Mirror + Foundation)
// position: 2/4 → mirror(2) × foundation(4)
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 26 6C 26 59 26 26 26"
// placement_policy: axis
// intent: emit a content-bound cognitive observation; never an actuation signal

import {
  type FileProfile,
  REPOS,
  scanEcosystem,
  type ThoughtPhase,
} from "./x0020_scanner_core.ts";
import { MEASUREMENT_STANDING } from "./x2C00_cognition_phase_report.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

export const COGNITION_SNAPSHOT_SCHEMA =
  "trinity.cognition-snapshot.v0.2" as const;
export const COGNITION_CLASSIFIER_VERSION = "structural_l_ladder_v1" as const;

const PHASES: ThoughtPhase[] = [
  "raw-fantasy",
  "hypothesis",
  "proposal",
  "experiment",
  "receipt",
  "formula",
  "crystal",
  "compost",
];
const LEVELS = [
  "L1_fqdn",
  "L2_parseable",
  "L3_schema_valid",
  "L4a_hash_claimed",
  "L4b_hash_verified",
  "L5_graph_linked",
  "L6_recipe",
  "L7_receipt_backed",
  "L8_published",
] as const;
type Level = typeof LEVELS[number];

interface PhaseCounts extends Record<ThoughtPhase, number> {}
interface SnapshotCounts extends Record<Level, number> {
  total_md: number;
  thought_phases: PhaseCounts;
}

export interface CognitionSnapshot {
  type: "CognitionSnapshot";
  schema: typeof COGNITION_SNAPSHOT_SCHEMA;
  snapshot_id: string;
  comparable_key: string;
  classifier_version: typeof COGNITION_CLASSIFIER_VERSION;
  scan_scope: typeof MEASUREMENT_STANDING;
  global: SnapshotCounts;
  repos: Record<string, { total_md: number; thought_phases: PhaseCounts }>;
}

function phaseCounts(): PhaseCounts {
  return Object.fromEntries(PHASES.map((phase) => [phase, 0])) as PhaseCounts;
}

function globalCounts(): SnapshotCounts {
  return {
    total_md: 0,
    L1_fqdn: 0,
    L2_parseable: 0,
    L3_schema_valid: 0,
    L4a_hash_claimed: 0,
    L4b_hash_verified: 0,
    L5_graph_linked: 0,
    L6_recipe: 0,
    L7_receipt_backed: 0,
    L8_published: 0,
    thought_phases: phaseCounts(),
  };
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** Same observations under the same classifier/scope produce the same bytes and
 * snapshot id. Wall-clock time is deliberately not part of substrate state. */
export async function buildCognitionSnapshot(
  profiles: FileProfile[],
): Promise<CognitionSnapshot> {
  const global = globalCounts();
  const repos = Object.fromEntries(REPOS.map((repo) => [repo, {
    total_md: 0,
    thought_phases: phaseCounts(),
  }])) as CognitionSnapshot["repos"];

  for (const profile of profiles) {
    if (profile.isEntrypoint) continue;
    global.total_md++;
    repos[profile.repo] ??= { total_md: 0, thought_phases: phaseCounts() };
    repos[profile.repo].total_md++;
    for (const level of LEVELS) if (profile[level]) global[level]++;
    global.thought_phases[profile.thoughtPhase]++;
    repos[profile.repo].thought_phases[profile.thoughtPhase]++;
  }

  const comparisonContract = {
    schema: COGNITION_SNAPSHOT_SCHEMA,
    classifier_version: COGNITION_CLASSIFIER_VERSION,
    scanned_extensions: MEASUREMENT_STANDING.scanned_extensions,
    excludes_entrypoints: MEASUREMENT_STANDING.excludes_entrypoints,
  };
  const comparableKey = `sha256:${await sha256(comparisonContract)}`;
  const body = {
    type: "CognitionSnapshot" as const,
    schema: COGNITION_SNAPSHOT_SCHEMA,
    comparable_key: comparableKey,
    classifier_version: COGNITION_CLASSIFIER_VERSION,
    scan_scope: MEASUREMENT_STANDING,
    global,
    repos,
  };
  return { ...body, snapshot_id: `sha256:${await sha256(body)}` };
}

if (import.meta.main) {
  const wantJson = Deno.args.includes("--json");
  const write = Deno.args.includes("--write") || !wantJson;
  const snapshot = await buildCognitionSnapshot(
    await scanEcosystem(Deno.cwd()),
  );
  let out: string | null = null;
  if (write) {
    await ensureDir("src");
    out = `src/x2488_cognition_snapshot.${
      snapshot.snapshot_id.slice(7, 19)
    }.myc.json`;
    await Deno.writeTextFile(out, JSON.stringify(snapshot, null, 2) + "\n");
  }
  if (wantJson) {
    console.log(JSON.stringify({ ...snapshot, written_to: out }, null, 2));
  } else {
    console.log(`snapshot ${snapshot.snapshot_id}${out ? ` → ${out}` : ""}`);
  }
}
