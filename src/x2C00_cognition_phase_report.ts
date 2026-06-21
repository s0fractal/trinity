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

export interface RepoMetrics {
  crystal_ratio: number;
  grounding_ratio: number;
  learning_ratio: number;
  novelty_ratio: number;
  compost_ratio: number;
  rigidity_index: number;
  hallucination_risk: number;
}

export interface MetricEvidence {
  denominator: number;
  defined: boolean;
  bounded_0_1: boolean;
}

export type MetricsEvidence = Record<keyof RepoMetrics, MetricEvidence>;

export function calculateMetricEvidence(s: RepoStats): MetricsEvidence {
  const total = s.total;
  const novelty = s["raw-fantasy"] + s.hypothesis + s.proposal;
  const grounded = s.receipt + s.formula + s.crystal;
  const evidence = (denominator: number, bounded_0_1: boolean) => ({
    denominator,
    defined: denominator > 0,
    bounded_0_1,
  });
  return {
    crystal_ratio: evidence(total, true),
    grounding_ratio: evidence(total, true),
    learning_ratio: evidence(s.receipt, false),
    novelty_ratio: evidence(total, true),
    compost_ratio: evidence(total, true),
    rigidity_index: evidence(novelty, false),
    hallucination_risk: evidence(grounded, false),
  };
}

export const MEASUREMENT_STANDING = {
  standing: "descriptive_only",
  actuation_eligible: false,
  scanned_extensions: [".md"],
  excludes_entrypoints: true,
  classifier: "structural_l_ladder_v1",
  warnings: [
    "metrics are descriptors, never fitness targets",
    "undefined zero-denominator ratios retain numeric 0 for compatibility; inspect evidence.defined",
    "learning_ratio, rigidity_index, and hallucination_risk are unbounded",
    "cross-repository comparison is invalid unless markdown coverage is comparable",
  ],
} as const;

export function calculateMetrics(s: RepoStats): RepoMetrics {
  const total = s.total;
  const raw = s["raw-fantasy"];
  const hyp = s["hypothesis"];
  const prop = s["proposal"];
  const exp = s["experiment"];
  const recp = s["receipt"];
  const form = s["formula"];
  const cryst = s["crystal"];
  const comp = s["compost"];

  return {
    crystal_ratio: total > 0 ? cryst / total : 0,
    grounding_ratio: total > 0 ? (recp + exp) / total : 0,
    learning_ratio: recp > 0 ? form / recp : 0,
    novelty_ratio: total > 0 ? (raw + hyp) / total : 0,
    compost_ratio: total > 0 ? comp / total : 0,
    rigidity_index: (raw + hyp + prop) > 0 ? cryst / (raw + hyp + prop) : 0,
    hallucination_risk: (recp + form + cryst) > 0
      ? raw / (recp + form + cryst)
      : 0,
  };
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
  const wantJson = Deno.args.includes("--json");
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

  // Calculate global stats
  const globalStats: RepoStats = {
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

  for (const repo of REPOS) {
    const s = repoStats[repo];
    globalStats.total += s.total;
    globalStats["raw-fantasy"] += s["raw-fantasy"];
    globalStats["hypothesis"] += s["hypothesis"];
    globalStats["proposal"] += s["proposal"];
    globalStats["experiment"] += s["experiment"];
    globalStats["receipt"] += s["receipt"];
    globalStats["formula"] += s["formula"];
    globalStats["crystal"] += s["crystal"];
    globalStats["compost"] += s["compost"];
  }

  const globalMetrics = calculateMetrics(globalStats);
  const globalEvidence = calculateMetricEvidence(globalStats);
  const repoMetrics: Record<string, RepoMetrics> = {};
  const repoEvidence: Record<string, MetricsEvidence> = {};
  const repoArchetypes: Record<string, string> = {};
  for (const repo of REPOS) {
    repoMetrics[repo] = calculateMetrics(repoStats[repo]);
    repoEvidence[repo] = calculateMetricEvidence(repoStats[repo]);
    repoArchetypes[repo] = determineArchetype(repoStats[repo]);
  }

  if (wantJson) {
    const output = {
      type: "cognition_phase_report",
      schema: "trinity.cognition-phase-report.v0.1",
      position: "2/C",
      timestamp: new Date().toISOString(),
      measurement_standing: MEASUREMENT_STANDING,
      repos: REPOS.reduce((acc, repo) => {
        acc[repo] = {
          stats: repoStats[repo],
          metrics: repoMetrics[repo],
          evidence: repoEvidence[repo],
          archetype: repoArchetypes[repo],
        };
        return acc;
      }, {} as Record<
        string,
        {
          stats: RepoStats;
          metrics: RepoMetrics;
          evidence: MetricsEvidence;
          archetype: string;
        }
      >),
      global: {
        stats: globalStats,
        metrics: globalMetrics,
        evidence: globalEvidence,
      },
    };
    console.log(JSON.stringify(output, null, 2));
    return;
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
    const arch = repoArchetypes[repo];
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

  const fmtRatio = (num: number) => num.toFixed(4);
  const fmtKey = (k: keyof RepoMetrics) => {
    return REPOS.map((r) => `${r}: ${fmtRatio(repoMetrics[r][k])}`).join(", ");
  };

  console.log("Thermodynamic Ratios & Diagnostics (x2C10 Spec):");
  console.log(
    "  standing: descriptive_only; actuation_eligible=false; scope=.md only",
  );
  console.log(
    `  - crystal_ratio:      ${
      fmtRatio(globalMetrics.crystal_ratio).padEnd(6)
    }  (${fmtKey("crystal_ratio")})`,
  );
  console.log(
    `  - grounding_ratio:    ${
      fmtRatio(globalMetrics.grounding_ratio).padEnd(6)
    }  (${fmtKey("grounding_ratio")})`,
  );
  console.log(
    `  - learning_ratio:     ${
      fmtRatio(globalMetrics.learning_ratio).padEnd(6)
    }  (${fmtKey("learning_ratio")})`,
  );
  console.log(
    `  - novelty_ratio:      ${
      fmtRatio(globalMetrics.novelty_ratio).padEnd(6)
    }  (${fmtKey("novelty_ratio")})`,
  );
  console.log(
    `  - compost_ratio:      ${
      fmtRatio(globalMetrics.compost_ratio).padEnd(6)
    }  (${fmtKey("compost_ratio")})`,
  );
  console.log(
    `  - rigidity_index:     ${
      fmtRatio(globalMetrics.rigidity_index).padEnd(6)
    }  (${fmtKey("rigidity_index")})`,
  );
  console.log(
    `  - hallucination_risk: ${
      fmtRatio(globalMetrics.hallucination_risk).padEnd(6)
    }  (${fmtKey("hallucination_risk")})`,
  );
  console.log("");
}

if (import.meta.main) {
  await main();
}
