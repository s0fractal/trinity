#!/usr/bin/env -S deno run -A
// src/x2600_cognition_delta.ts — cognition_delta (Mirror + Harmony)
// position: 2/6 → mirror(2) × harmony(6)
// maturity: active
// skill_safe: yes
// hex_dipole: "26 26 6C 26 26 26 59 26"
// placement_policy: axis
// intent: compare only commensurable cognition snapshots; descriptive, never authority

import { expandGlob } from "https://deno.land/std@0.224.0/fs/expand_glob.ts";
import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import type { CognitionSnapshot } from "./x2400_cognition_snapshot.ts";

export interface CognitionDelta {
  type: "CognitionDelta";
  schema: "trinity.cognition-delta.v0.2";
  comparable: boolean;
  actuation_eligible: false;
  reasons: string[];
  from: string;
  to: string;
  phase_delta: Record<string, number>;
  level_delta: Record<string, number>;
}

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

export function compareCognitionSnapshots(
  from: CognitionSnapshot,
  to: CognitionSnapshot,
): CognitionDelta {
  const reasons: string[] = [];
  if (!from.comparable_key || !to.comparable_key) {
    reasons.push("missing comparable_key (legacy snapshot)");
  } else if (from.comparable_key !== to.comparable_key) {
    reasons.push("classifier/schema/scan-scope mismatch");
  }
  const comparable = reasons.length === 0;
  const phaseDelta: Record<string, number> = {};
  const levelDelta: Record<string, number> = {};
  if (comparable) {
    const toPhases = to.global.thought_phases as Record<string, number>;
    for (
      const [phase, count] of Object.entries(
        from.global.thought_phases as Record<string, number>,
      )
    ) {
      phaseDelta[phase] = (toPhases[phase] ?? 0) - count;
    }
    for (const level of LEVELS) {
      levelDelta[level] = to.global[level] - from.global[level];
    }
  }
  return {
    type: "CognitionDelta",
    schema: "trinity.cognition-delta.v0.2",
    comparable,
    actuation_eligible: false,
    reasons,
    from: from.snapshot_id ?? "legacy:unknown",
    to: to.snapshot_id ?? "legacy:unknown",
    phase_delta: phaseDelta,
    level_delta: levelDelta,
  };
}

async function recentSnapshots(): Promise<[string, string] | null> {
  const snapshots: Array<{ path: string; mtime: number }> = [];
  for await (
    const file of expandGlob("src/x2488_cognition_snapshot.*.myc.json")
  ) {
    const stat = await Deno.stat(file.path);
    snapshots.push({ path: file.path, mtime: stat.mtime?.getTime() ?? 0 });
  }
  snapshots.sort((a, b) => a.mtime - b.mtime || a.path.localeCompare(b.path));
  if (snapshots.length < 2) return null;
  return [snapshots.at(-2)!.path, snapshots.at(-1)!.path];
}

if (import.meta.main) {
  const flags = parse(Deno.args);
  let fromPath = flags.from as string | undefined;
  let toPath = flags.to as string | undefined;
  if (!fromPath || !toPath) {
    const recent = await recentSnapshots();
    if (!recent) throw new Error("not enough cognition snapshots");
    [fromPath, toPath] = recent;
  }
  const from = JSON.parse(
    await Deno.readTextFile(fromPath),
  ) as CognitionSnapshot;
  const to = JSON.parse(await Deno.readTextFile(toPath)) as CognitionSnapshot;
  const delta = compareCognitionSnapshots(from, to);
  if (flags.json) {
    console.log(JSON.stringify(delta, null, 2));
  } else if (!delta.comparable) {
    console.log(`NOT COMPARABLE: ${delta.reasons.join("; ")}`);
  } else {
    console.log(JSON.stringify(delta, null, 2));
  }
  Deno.exitCode = delta.comparable ? 0 : 2;
}
