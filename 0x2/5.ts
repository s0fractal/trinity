#!/usr/bin/env -S deno run -A
// 0x2/5.ts — cognition_field (Mirror + Action)
// position: 2/5 → mirror(2) × action(5)
// hex_dipole: "26 26 6C 26 26 59 26 26"
// placement_policy: axis
//
// cognition_field.ts — evaluate cognitive field

import { parse as parseYaml } from "https://deno.land/std@0.224.0/yaml/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { REPOS, scanEcosystem, type ThoughtPhase } from "../tools/scanner_core.ts";

const REC_PATH = "reports/cognition/recommendation.latest.json";
const OUT_JSON = "reports/cognition/field.latest.json";
const OUT_MD = "reports/cognition/field.latest.md";
const CHORDS_DIR = "jazz/chords";

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

interface Recommendation {
  rank: number;
  repo: string;
  vector: string;
  pressure: number;
  action: string;
  expected_receipt: string;
  commands: string[];
}

interface PastReceipt {
  path: string;
  tension: string;
  actor: string;
  receipt: string;
  mode: string;
}

function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    const doc = parseYaml(match[1]);
    return doc && typeof doc === "object"
      ? doc as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

async function commandOutput(cmd: string, args: string[]): Promise<string> {
  const out = await new Deno.Command(cmd, {
    args,
    stdout: "piped",
    stderr: "piped",
  }).output();
  return new TextDecoder().decode(out.stdout).trim();
}

async function collectDirtyTotal(): Promise<number> {
  let total = 0;
  for (const repo of REPOS) {
    const cwd = repo === "trinity" ? Deno.cwd() : join(Deno.cwd(), repo);
    try {
      const status = await commandOutput("git", [
        "-C",
        cwd,
        "status",
        "--short",
        "--untracked-files=all",
      ]);
      if (status) total += status.split("\n").length;
    } catch {
      total++;
    }
  }
  return total;
}

async function readRecommendations(): Promise<Recommendation[]> {
  try {
    const descriptor = JSON.parse(await Deno.readTextFile(REC_PATH));
    return Array.isArray(descriptor.recommendations)
      ? descriptor.recommendations.slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

async function readPastReceipts(limit = 5): Promise<PastReceipt[]> {
  const entries: { name: string; mtime: number }[] = [];
  try {
    for await (const entry of Deno.readDir(CHORDS_DIR)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      const stat = await Deno.stat(join(CHORDS_DIR, entry.name));
      entries.push({ name: entry.name, mtime: stat.mtime?.getTime() ?? 0 });
    }
  } catch {
    return [];
  }

  entries.sort((a, b) => b.mtime - a.mtime || b.name.localeCompare(a.name));
  const receipts: PastReceipt[] = [];
  for (const entry of entries) {
    const path = join(CHORDS_DIR, entry.name);
    const body = await Deno.readTextFile(path);
    const fm = parseFrontmatter(body);
    if (!fm || !fm.receipt || fm.receipt === "none") continue;
    receipts.push({
      path,
      tension: String(fm.tension ?? "unspecified"),
      actor: String(fm.actor ?? "unknown"),
      receipt: String(fm.receipt),
      mode: String(fm.mode ?? "unknown"),
    });
    if (receipts.length >= limit) break;
  }
  return receipts;
}

function dominantPhase(counts: Record<ThoughtPhase, number>): ThoughtPhase {
  return PHASES.reduce((best, phase) =>
    counts[phase] > counts[best] ? phase : best
  );
}

function markdown(field: any): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push('type: "CognitiveFieldDescriptor"');
  lines.push('version: "0.1"');
  lines.push(`created_at: "${field.timestamp}"`);
  lines.push("---");
  lines.push("");
  lines.push("# Cognitive Field");
  lines.push("");
  lines.push("## Current Empty Point");
  lines.push("");
  lines.push(`- total_md: ${field.current.total_md}`);
  lines.push(`- dominant_phase: ${field.current.dominant_phase}`);
  lines.push(`- dirty_total: ${field.current.dirty_total}`);
  lines.push("");
  lines.push("## Past Projection");
  lines.push("");
  if (field.past_projection.length === 0) {
    lines.push("- (no recent receipt chords visible)");
  } else {
    for (const receipt of field.past_projection) {
      lines.push(
        `- ${receipt.tension} (${receipt.actor}, ${receipt.receipt}) -> \`${receipt.path}\``,
      );
    }
  }
  lines.push("");
  lines.push("## Future Projection");
  lines.push("");
  if (field.future_projection.length === 0) {
    lines.push("- (no current recommendation pressure visible)");
  } else {
    for (const rec of field.future_projection) {
      lines.push(
        `- #${rec.rank} ${rec.repo}/${rec.vector} p=${
          rec.pressure.toFixed(3)
        }: ${rec.action}`,
      );
    }
  }
  lines.push("");
  lines.push("## Flow");
  lines.push("");
  lines.push(`- preferred: ${field.flow.preferred}`);
  lines.push(`- rule: ${field.flow.rule}`);
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const profiles = await scanEcosystem(Deno.cwd());
  const phaseCounts = Object.fromEntries(
    PHASES.map((phase) => [phase, 0]),
  ) as Record<ThoughtPhase, number>;
  let total = 0;

  for (const profile of profiles) {
    if (profile.isEntrypoint) continue;
    total++;
    phaseCounts[profile.thoughtPhase]++;
  }

  const field = {
    type: "CognitiveFieldDescriptor",
    version: "0.1",
    timestamp: new Date().toISOString(),
    current: {
      total_md: total,
      dominant_phase: dominantPhase(phaseCounts),
      dirty_total: await collectDirtyTotal(),
      phase_distribution: phaseCounts,
    },
    past_projection: await readPastReceipts(),
    future_projection: await readRecommendations(),
    flow: {
      preferred: "low-cost/high-reward overlap",
      rule:
        "collapse one future affordance into past evidence, then rerender the field",
    },
  };

  await ensureDir("reports/cognition");
  await Deno.writeTextFile(OUT_JSON, JSON.stringify(field, null, 2));
  await Deno.writeTextFile(OUT_MD, markdown(field));

  console.log("Cognitive field written:");
  console.log(`  ${OUT_MD}`);
  console.log(`  ${OUT_JSON}`);
  console.log(
    `Current: ${field.current.dominant_phase}, future: ${
      field.future_projection[0]?.repo ?? "none"
    }, past receipts: ${field.past_projection.length}`,
  );
}

main();
