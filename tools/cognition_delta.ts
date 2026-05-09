import { expandGlob } from "https://deno.land/std@0.224.0/fs/expand_glob.ts";
import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";

async function getMostRecentSnapshots(): Promise<[string, string] | null> {
  const snapshots: string[] = [];
  for await (const file of expandGlob("reports/cognition/snapshot.*.json")) {
    snapshots.push(file.path);
  }
  snapshots.sort();
  if (snapshots.length < 2) return null;
  return [snapshots[snapshots.length - 2], snapshots[snapshots.length - 1]];
}

async function main() {
  const flags = parse(Deno.args);
  let fileA = flags.from;
  let fileB = flags.to;

  if (!fileA || !fileB) {
    console.log("No --from and --to provided. Attempting to use the two most recent snapshots...");
    const recent = await getMostRecentSnapshots();
    if (!recent) {
      console.error("Not enough snapshots found in reports/cognition/");
      Deno.exit(1);
    }
    fileA = recent[0];
    fileB = recent[1];
  }

  const snapA = JSON.parse(await Deno.readTextFile(fileA));
  const snapB = JSON.parse(await Deno.readTextFile(fileB));

  console.log(`\n========================================`);
  console.log(`      COGNITIVE DELTA DESCRIPTOR        `);
  console.log(`========================================`);
  console.log(`FROM: ${snapA.timestamp}`);
  console.log(`TO:   ${snapB.timestamp}\n`);

  console.log("Global Phase Shifts:");
  let changed = false;
  for (const phase in snapA.global.thought_phases) {
    const a = snapA.global.thought_phases[phase];
    const b = snapB.global.thought_phases[phase];
    if (a !== b) {
      const diff = b - a;
      const sign = diff > 0 ? "+" : "";
      console.log(`  ${phase.padEnd(12)}: ${sign}${diff}`);
      changed = true;
    }
  }
  if (!changed) console.log("  (no changes)");

  console.log("\nOntology Coverage Shifts:");
  changed = false;
  for (const key of ["L1_fqdn", "L2_parseable", "L4a_hash_claimed", "L4b_hash_verified", "L6_recipe"]) {
    const a = snapA.global[key];
    const b = snapB.global[key];
    if (a !== b) {
      const diff = b - a;
      const sign = diff > 0 ? "+" : "";
      console.log(`  ${key.padEnd(17)}: ${sign}${diff}`);
      changed = true;
    }
  }
  if (!changed) console.log("  (no changes)");

  console.log("\nThermodynamic Interpretation:");
  const diffRaw = snapB.global.thought_phases["raw-fantasy"] - snapA.global.thought_phases["raw-fantasy"];
  const diffReceipt = snapB.global.thought_phases["receipt"] - snapA.global.thought_phases["receipt"];
  const diffL4b = snapB.global.L4b_hash_verified - snapA.global.L4b_hash_verified;

  if (diffL4b > 0) {
    console.log("  🟢 ATP Generated: System increased verified cryptographic reality.");
  }
  if (diffReceipt > 0) {
    console.log("  🟢 ATP Generated: New verification receipts materialized.");
  }
  if (diffRaw > 0 && diffReceipt <= 0) {
    console.log("  🔴 ATP Consumed: Speculation increased without verification.");
  }
  if (diffRaw === 0 && diffReceipt === 0 && diffL4b === 0 && !changed) {
    console.log("  ⚪ Zero-Energy State: No cognitive movement detected.");
  }

  console.log("========================================\n");
}

main();
