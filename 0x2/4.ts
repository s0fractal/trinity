#!/usr/bin/env -S deno run -A
// 0x2/4.ts — cognition_snapshot (Mirror + Foundation)
// position: 2/4 → mirror(2) × foundation(4)
// hex_dipole: "26 26 6C 26 59 26 26 26"
// placement_policy: axis
//
// cognition_snapshot.ts — capture cognitive state
import { REPOS, scanEcosystem } from "./tools/scanner_core.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { dirname } from "https://deno.land/std@0.224.0/path/mod.ts";

async function main() {
  const cwd = Deno.cwd();
  console.log("📸 Capturing Cognitive Snapshot...");
  const profiles = await scanEcosystem(cwd);

  const snapshot = {
    type: "SystemSnapshotDescriptor",
    timestamp: new Date().toISOString(),
    global: {
      total_md: 0,
      L1_fqdn: 0,
      L2_parseable: 0,
      L4a_hash_claimed: 0,
      L4b_hash_verified: 0,
      L6_recipe: 0,
      thought_phases: {
        "raw-fantasy": 0,
        "hypothesis": 0,
        "proposal": 0,
        "experiment": 0,
        "receipt": 0,
        "formula": 0,
        "crystal": 0,
        "compost": 0,
      }
    },
    repos: {} as Record<string, any>
  };

  for (const repo of REPOS) {
    snapshot.repos[repo] = {
      total: 0,
      thought_phases: {
        "raw-fantasy": 0,
        "hypothesis": 0,
        "proposal": 0,
        "experiment": 0,
        "receipt": 0,
        "formula": 0,
        "crystal": 0,
        "compost": 0,
      }
    };
  }

  for (const profile of profiles) {
    if (profile.isEntrypoint) continue;

    snapshot.global.total_md++;
    snapshot.repos[profile.repo].total++;

    if (profile.L1_fqdn) snapshot.global.L1_fqdn++;
    if (profile.L2_parseable) snapshot.global.L2_parseable++;
    if (profile.L4a_hash_claimed) snapshot.global.L4a_hash_claimed++;
    if (profile.L4b_hash_verified) snapshot.global.L4b_hash_verified++;
    if (profile.L6_recipe) snapshot.global.L6_recipe++;

    snapshot.global.thought_phases[profile.thoughtPhase]++;
    snapshot.repos[profile.repo].thought_phases[profile.thoughtPhase]++;
  }

  const outDir = "reports/cognition";
  await ensureDir(outDir);
  const outPath = `${outDir}/snapshot.${snapshot.timestamp}.json`;
  await Deno.writeTextFile(outPath, JSON.stringify(snapshot, null, 2));

  console.log(`✅ Snapshot saved to: ${outPath}`);
}

main();
