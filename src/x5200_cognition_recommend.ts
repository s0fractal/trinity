#!/usr/bin/env -S deno run -A
// src/x5200_cognition_recommend.ts — cognition_recommend (Action + Mirror)
// position: 5/2 → action(5) × mirror(2)
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 26 59 26 26 6C 26 26"
// placement_policy: axis
//
// cognition_recommend.ts — suggest recommendations

import {
  REPOS,
  scanEcosystem,
  type ThoughtPhase,
} from "./x0020_scanner_core.ts";
import { loadOrganHorizons, type OrganHorizon } from "./x8D00_roadmap_gen.ts";
type RepoName = typeof REPOS[number];

/** A declared organ horizon is "open" unless it begins with "none". */
function isOpenHorizon(h: OrganHorizon): boolean {
  return !/^none\b/i.test(h.horizon.trim());
}

interface RepoSignal {
  repo: RepoName;
  total: number;
  L1_fqdn: number;
  L2_parseable: number;
  L3_schema_valid: number;
  L4a_hash_claimed: number;
  L4b_hash_verified: number;
  L5_graph_linked: number;
  L6_recipe: number;
  L7_receipt_backed: number;
  L8_published: number;
  phases: Record<ThoughtPhase, number>;
  dirtyLines: string[];
}

interface Recommendation {
  rank: number;
  repo: RepoName;
  vector: string;
  phase_from: ThoughtPhase;
  phase_to: ThoughtPhase;
  pressure: number;
  action: string;
  rationale: string;
  expected_receipt: string;
  commands: string[];
}

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

const VECTORS: Record<RepoName, string> = {
  trinity: "metacognition",
  myc: "publication",
  liquid: "identity-resolution",
  omega: "deterministic-execution",
};

function emptySignal(repo: RepoName): RepoSignal {
  return {
    repo,
    total: 0,
    L1_fqdn: 0,
    L2_parseable: 0,
    L3_schema_valid: 0,
    L4a_hash_claimed: 0,
    L4b_hash_verified: 0,
    L5_graph_linked: 0,
    L6_recipe: 0,
    L7_receipt_backed: 0,
    L8_published: 0,
    phases: Object.fromEntries(PHASES.map((phase) => [phase, 0])) as Record<
      ThoughtPhase,
      number
    >,
    dirtyLines: [],
  };
}

function ratio(part: number, total: number): number {
  return total > 0 ? part / total : 0;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

async function commandOutput(
  cmd: string,
  args: string[],
  cwd: string,
): Promise<string> {
  const out = await new Deno.Command(cmd, {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  }).output();

  const text = new TextDecoder().decode(out.stdout).trim();
  const err = new TextDecoder().decode(out.stderr).trim();
  return [text, err].filter(Boolean).join("\n");
}

async function collectDirtyLines(
  cwd: string,
): Promise<Record<RepoName, string[]>> {
  const result = Object.fromEntries(REPOS.map((repo) => [repo, []])) as Record<
    RepoName,
    string[]
  >;

  for (const repo of REPOS) {
    const repoCwd = repo === "trinity" ? cwd : `${cwd}/${repo}`;
    try {
      const status = await commandOutput("git", [
        "status",
        "--short",
        "--untracked-files=all",
      ], repoCwd);
      result[repo] = status ? status.split("\n") : [];
    } catch {
      result[repo] = ["status unavailable"];
    }
  }

  return result;
}

function chooseDominantPhase(signal: RepoSignal): ThoughtPhase {
  let best: ThoughtPhase = "hypothesis";
  for (const phase of PHASES) {
    if (signal.phases[phase] > signal.phases[best]) best = phase;
  }
  return best;
}

function buildRecommendations(
  signal: RepoSignal,
  openHorizons: OrganHorizon[],
): Recommendation[] {
  const recs: Omit<Recommendation, "rank">[] = [];
  const rawPressure = ratio(
    signal.phases["raw-fantasy"] + signal.phases.hypothesis,
    signal.total,
  );
  const experimentPressure = ratio(
    signal.L6_recipe - signal.L7_receipt_backed,
    signal.total,
  );
  const receiptPressure = ratio(
    signal.L7_receipt_backed - signal.phases.formula,
    signal.total,
  );
  const hashGap = ratio(
    signal.L4a_hash_claimed - signal.L4b_hash_verified,
    signal.total,
  );
  const dirtyPressure = Math.min(1, signal.dirtyLines.length / 8);

  if (signal.repo === "trinity") {
    // Pull from declared roadmap horizons rather than a hardcoded self-audit:
    // the substrate already states where each organ thinks it should go next.
    const top = openHorizons[0];
    const horizonPressure = Math.min(1, openHorizons.length / 8);
    recs.push({
      repo: signal.repo,
      vector: VECTORS[signal.repo],
      phase_from: chooseDominantPhase(signal),
      phase_to: "proposal",
      pressure: Math.max(rawPressure, hashGap, dirtyPressure, horizonPressure),
      action: top
        ? `Pursue declared horizon x${top.coordinate}_${top.handle}: ${top.horizon}`
        : "No open organ horizons — survey for the next frontier (t roadmap).",
      rationale: top
        ? `${openHorizons.length} organ horizon(s) are declared open in the roadmap; the substrate is pulling toward them. Top by coordinate: x${top.coordinate}_${top.handle} (${
          top.maturity ?? "active"
        }).`
        : "All declared organ horizons are closed; recommend a survey/expedition to find the next frontier.",
      expected_receipt: top
        ? `A proposal or receipt chord advancing x${top.coordinate}_${top.handle} and refining or closing its horizon field.`
        : "A survey receipt naming candidate next frontiers.",
      commands: top
        ? [
          "./t roadmap",
          "./t self",
          `./t chord receipt --voice=VOICE --topic='advance ${top.handle}' --write`,
        ]
        : ["./t roadmap", "./t self"],
    });
  }

  if (signal.repo === "liquid") {
    recs.push({
      repo: signal.repo,
      vector: VECTORS[signal.repo],
      phase_from: "experiment",
      phase_to: "receipt",
      pressure: Math.max(experimentPressure, hashGap),
      action:
        "Turn FQDN Semantic DNS into a resolver fixture with hash-verified before/after examples.",
      rationale:
        "Liquid has high recipe mass; the next gain is proving semantic alias resolution against immutable physical FQDNs.",
      expected_receipt:
        "A deterministic resolver fixture that maps semantic FQDN input to physical h.* output and verifies the hash.",
      commands: [
        "deno task check:liquid:doctor",
        "deno task check:liquid:audit",
      ],
    });
  }

  if (signal.repo === "omega") {
    recs.push({
      repo: signal.repo,
      vector: VECTORS[signal.repo],
      phase_from: rawPressure > 0.5 ? "hypothesis" : "formula",
      phase_to: "receipt",
      pressure: Math.max(rawPressure, dirtyPressure, receiptPressure),
      action:
        "Convert the next deterministic execution result into a receipt or compost it explicitly.",
      rationale:
        "Omega is formula-heavy and currently has uncommitted test output pressure; outputs should become receipts or leave the active graph.",
      expected_receipt:
        "A named verification artifact from cargo/deno tests, or an explicit compost decision for non-canonical output.",
      commands: ["deno task check:omega:rust", "deno task check:omega:deno"],
    });
  }

  return recs
    .filter((rec) => Number.isFinite(rec.pressure) && rec.pressure > 0)
    .sort((a, b) => b.pressure - a.pressure)
    .map((rec, index) => ({ ...rec, rank: index + 1 }));
}

function markdownReport(
  timestamp: string,
  signals: RepoSignal[],
  recs: Recommendation[],
): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push('type: "CognitiveRecommendationDescriptor"');
  lines.push('version: "0.1"');
  lines.push(`created_at: "${timestamp}"`);
  lines.push("---");
  lines.push("");
  lines.push("# Cognitive Development Recommendations");
  lines.push("");
  lines.push(
    "This report turns current repository state into a ranked development signal.",
  );
  lines.push("");
  lines.push("## State");
  lines.push("");
  lines.push(
    "| Repo | MD | L2 parseable | L4b verified | L6 recipe | L7 receipt | L8 public | Dominant phase | Dirty |",
  );
  lines.push("|---|---:|---:|---:|---:|---:|---:|---|---:|");
  for (const s of signals) {
    lines.push(
      `| ${s.repo} | ${s.total} | ${pct(ratio(s.L2_parseable, s.total))} | ${
        pct(ratio(s.L4b_hash_verified, s.total))
      } | ${pct(ratio(s.L6_recipe, s.total))} | ${
        pct(ratio(s.L7_receipt_backed, s.total))
      } | ${pct(ratio(s.L8_published, s.total))} | ${
        chooseDominantPhase(s)
      } | ${s.dirtyLines.length} |`,
    );
  }
  lines.push("");
  lines.push("## Ranked Signal");
  lines.push("");
  for (const rec of recs) {
    lines.push(`### ${rec.rank}. ${rec.repo} / ${rec.vector}`);
    lines.push("");
    lines.push(`- pressure: ${rec.pressure.toFixed(3)}`);
    lines.push(`- phase: ${rec.phase_from} -> ${rec.phase_to}`);
    lines.push(`- action: ${rec.action}`);
    lines.push(`- rationale: ${rec.rationale}`);
    lines.push(`- expected_receipt: ${rec.expected_receipt}`);
    lines.push(
      `- commands: ${rec.commands.map((cmd) => `\`${cmd}\``).join(", ")}`,
    );
    lines.push("");
  }
  lines.push("## Control Rule");
  lines.push("");
  lines.push(
    "Commit pressure should be guided by state delta: prefer commits that increase verified hash coverage, receipts, resolver fixtures, or explicit compost decisions.",
  );
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const cwd = Deno.cwd();
  const profiles = await scanEcosystem(cwd);
  const dirty = await collectDirtyLines(cwd);
  const signals = Object.fromEntries(
    REPOS.map((repo) => [repo, emptySignal(repo)]),
  ) as Record<
    RepoName,
    RepoSignal
  >;

  for (const profile of profiles) {
    if (profile.isEntrypoint) continue;
    const s = signals[profile.repo as RepoName];
    s.total++;
    if (profile.L1_fqdn) s.L1_fqdn++;
    if (profile.L2_parseable) s.L2_parseable++;
    if (profile.L3_schema_valid) s.L3_schema_valid++;
    if (profile.L4a_hash_claimed) s.L4a_hash_claimed++;
    if (profile.L4b_hash_verified) s.L4b_hash_verified++;
    if (profile.L5_graph_linked) s.L5_graph_linked++;
    if (profile.L6_recipe) s.L6_recipe++;
    if (profile.L7_receipt_backed) s.L7_receipt_backed++;
    if (profile.L8_published) s.L8_published++;
    s.phases[profile.thoughtPhase]++;
  }

  for (const repo of REPOS) {
    signals[repo].dirtyLines = dirty[repo];
  }
  const timestamp = new Date().toISOString();
  const signalList = REPOS.map((repo) => signals[repo]);
  const openHorizons = (await loadOrganHorizons())
    .filter(isOpenHorizon)
    .sort((a, b) => a.coordinate.localeCompare(b.coordinate));
  const recommendations = signalList
    .flatMap((s) => buildRecommendations(s, openHorizons))
    .sort((a, b) => b.pressure - a.pressure)
    .map((rec, index) => ({ ...rec, rank: index + 1 }));

  const descriptor = {
    type: "CognitiveRecommendationDescriptor",
    version: "0.1",
    timestamp,
    basis: {
      scanner: "src/x0020_scanner_core.ts",
      roadmap: "src/x8D00_roadmap_gen.ts (open organ horizons)",
      contract: "contracts/COGNITIVE_RECOMMENDATION.v0.1.md",
      git_status: "observed",
    },
    open_horizons: openHorizons.map((h) => ({
      coordinate: h.coordinate,
      handle: h.handle,
      horizon: h.horizon,
      maturity: h.maturity ?? "active",
    })),
    signals: signalList,
    recommendations,
  };

  await Deno.mkdir("src", { recursive: true });
  await Deno.writeTextFile(
    "src/x5288_cognition_recommendation.latest.myc.json",
    JSON.stringify(descriptor, null, 2),
  );
  await Deno.writeTextFile(
    "src/x5288_cognition_recommendation.latest.myc.md",
    markdownReport(timestamp, signalList, recommendations),
  );

  console.log("Cognitive recommendation written:");
  console.log("  src/x5288_cognition_recommendation.latest.myc.md");
  console.log("  src/x5288_cognition_recommendation.latest.myc.json");
  if (recommendations[0]) {
    console.log(
      `Top signal: ${recommendations[0].repo} -> ${recommendations[0].action}`,
    );
  }
}

main();
