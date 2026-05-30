#!/usr/bin/env -S deno run -A
// src/x2C00_cognition_phase_report.ts — cognition_phase_report (Mirror + Build-pair)
// position: 2/C → mirror(2) × build-pair(C)
// maturity: active
// skill_safe: yes
// hex_dipole: "26 26 6C 59 26 26 26 26"
// placement_policy: axis
//
// cognition_phase_report.ts — report cognitive phases

import { REPOS, scanEcosystem } from "./x0020_scanner_core.ts";

interface RepoStats {
  total: number;
  "raw-fantasy": number;
  "hypothesis": number;
  "proposal": number;
  "experiment": number;
  "receipt": number;
  "formula": number;
  "crystal": number;
  "compost": number;
}

function determineArchetype(stats: RepoStats): string {
  if (stats.total === 0) return "Dormant";

  const raw = stats["raw-fantasy"];
  const cryst = stats["crystal"];
  const recp = stats["receipt"];
  const exp = stats["experiment"];
  const prop = stats["proposal"];

  if (raw / stats.total > 0.4) return "Over-imagining";
  if (cryst / stats.total > 0.4) return "Over-crystallized";
  if (prop / stats.total > 0.4) return "Over-planning";
  if (recp / stats.total > 0.4) return "Rigid-Verifying";
  if (exp / stats.total > 0.4) return "Chaotic-Testing";

  return "Balanced";
}

async function main() {
  const cwd = Deno.cwd();
  const profiles = await scanEcosystem(cwd);

  const repoStats: Record<string, RepoStats> = {};
  for (const repo of REPOS) {
    repoStats[repo] = {
      total: 0,
      "raw-fantasy": 0,
      "hypothesis": 0,
      "proposal": 0,
      "experiment": 0,
      "receipt": 0,
      "formula": 0,
      "crystal": 0,
      "compost": 0,
    };
  }

  for (const profile of profiles) {
    if (profile.isEntrypoint) continue;
    repoStats[profile.repo].total++;
    repoStats[profile.repo][profile.thoughtPhase]++;
  }

  console.log(
    "\n==========================================================================",
  );
  console.log(
    "                      COGNITIVE PHASE REPORT                              ",
  );
  console.log(
    "==========================================================================\n",
  );

  console.log(
    "Repo      Raw   Hyp   Prop  Exp   Rcpt  Form  Cryst Comp  Archetype",
  );
  console.log(
    "--------------------------------------------------------------------------",
  );

  for (const repo of REPOS) {
    const s = repoStats[repo];
    const arch = determineArchetype(s);
    console.log(
      `${repo.padEnd(9)} ` +
        `${String(s["raw-fantasy"]).padEnd(5)} ` +
        `${String(s["hypothesis"]).padEnd(5)} ` +
        `${String(s["proposal"]).padEnd(5)} ` +
        `${String(s["experiment"]).padEnd(5)} ` +
        `${String(s["receipt"]).padEnd(5)} ` +
        `${String(s["formula"]).padEnd(5)} ` +
        `${String(s["crystal"]).padEnd(5)} ` +
        `${String(s["compost"]).padEnd(5)} ` +
        `${arch}`,
    );
  }
  console.log(
    "==========================================================================\n",
  );
}

main();
