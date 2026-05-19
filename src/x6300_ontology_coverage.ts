#!/usr/bin/env -S deno run -A
// src/x6300_ontology_coverage.ts — ontology_coverage (Harmony + Build)
// position: 6/3 → harmony(6) × build(3)
// hex_dipole: "26 26 26 59 26 26 6C 26"
// placement_policy: axis
//
// ontology_coverage.ts — evaluate coverage of ontology nodes

import { REPOS, scanEcosystem } from "./x0020_scanner_core.ts";

async function main() {
  const cwd = Deno.cwd();
  const profiles = await scanEcosystem(cwd);
  
  const repoStats: Record<string, any> = {};
  for (const repo of REPOS) {
    repoStats[repo] = { total: 0, L1: 0, L2: 0, L3: 0, L4a: 0, L4b: 0, L5: 0, L6: 0, L7: 0, L8: 0 };
  }

  let total_md = 0;
  let entrypoint_md = 0;
  const globalCounts = { L1: 0, L2: 0, L3: 0, L4a: 0, L4b: 0, L5: 0, L6: 0, L7: 0, L8: 0 };

  for (const profile of profiles) {
    total_md++;
    if (profile.isEntrypoint) {
      entrypoint_md++;
      continue;
    }

    repoStats[profile.repo].total++;

    if (profile.L1_fqdn) { repoStats[profile.repo].L1++; globalCounts.L1++; }
    if (profile.L2_parseable) { repoStats[profile.repo].L2++; globalCounts.L2++; }
    if (profile.L3_schema_valid) { repoStats[profile.repo].L3++; globalCounts.L3++; }
    if (profile.L4a_hash_claimed) { repoStats[profile.repo].L4a++; globalCounts.L4a++; }
    if (profile.L4b_hash_verified) { repoStats[profile.repo].L4b++; globalCounts.L4b++; }
    if (profile.L5_graph_linked) { repoStats[profile.repo].L5++; globalCounts.L5++; }
    if (profile.L6_recipe) { repoStats[profile.repo].L6++; globalCounts.L6++; }
    if (profile.L7_receipt_backed) { repoStats[profile.repo].L7++; globalCounts.L7++; }
    if (profile.L8_published) { repoStats[profile.repo].L8++; globalCounts.L8++; }
  }

  const actual_total = total_md - entrypoint_md;
  const p = (count: number, total: number) => total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%";

  console.log("\n=======================================================");
  console.log("             ONTOLOGICAL COVERAGE REPORT               ");
  console.log("=======================================================\n");

  console.log(`total_md: ${total_md}`);
  console.log(`entrypoint_md: ${entrypoint_md}`);
  console.log(`ontology_candidate_md: ${actual_total}\n`);

  console.log(`L1_fqdn:           ${String(globalCounts.L1).padEnd(5)} ${p(globalCounts.L1, actual_total)}`);
  console.log(`L2_parseable:      ${String(globalCounts.L2).padEnd(5)} ${p(globalCounts.L2, actual_total)}`);
  console.log(`L3_schema_valid:   ${String(globalCounts.L3).padEnd(5)} ${p(globalCounts.L3, actual_total)}`);
  console.log(`L4a_hash_claimed:  ${String(globalCounts.L4a).padEnd(5)} ${p(globalCounts.L4a, actual_total)}`);
  console.log(`L4b_hash_verified: ${String(globalCounts.L4b).padEnd(5)} ${p(globalCounts.L4b, actual_total)}`);
  console.log(`L5_graph_linked:   ${String(globalCounts.L5).padEnd(5)} ${p(globalCounts.L5, actual_total)}`);
  console.log(`L6_recipe:         ${String(globalCounts.L6).padEnd(5)} ${p(globalCounts.L6, actual_total)}`);
  console.log(`L7_receipt_backed: ${String(globalCounts.L7).padEnd(5)} ${p(globalCounts.L7, actual_total)}`);
  console.log(`L8_published:      ${String(globalCounts.L8).padEnd(5)} ${p(globalCounts.L8, actual_total)}`);

  console.log("\n=======================================================");
  console.log("Repo      MD    FQDN  Pars  Schm  HashC HashV Grph  Recp  Rcpt  Publ");
  console.log("---------------------------------------------------------------------");
  
  for (const repo of REPOS) {
    const s = repoStats[repo];
    console.log(
      `${repo.padEnd(9)} ` +
      `${String(s.total).padEnd(5)} ` +
      `${String(s.L1).padEnd(5)} ` +
      `${String(s.L2).padEnd(5)} ` +
      `${String(s.L3).padEnd(5)} ` +
      `${String(s.L4a).padEnd(5)} ` +
      `${String(s.L4b).padEnd(5)} ` +
      `${String(s.L5).padEnd(5)} ` +
      `${String(s.L6).padEnd(5)} ` +
      `${String(s.L7).padEnd(5)} ` +
      `${String(s.L8).padEnd(5)}`
    );
  }
  console.log("=======================================================\n");

  console.log("TARGETS:");
  console.log(`[${(globalCounts.L2 / actual_total) >= 0.8 ? "x" : " "}] 80% important semantic md must be at least L2/L3`);
  console.log(`[${(globalCounts.L4b / actual_total) >= 0.3 ? "x" : " "}] 30% must be L4b hash/FQDN verified`);
  console.log(`[${(globalCounts.L6 / actual_total) >= 0.1 ? "x" : " "}] 10% must be L6 recipe/replayable`);
}

main();
