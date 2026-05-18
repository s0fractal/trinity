#!/usr/bin/env -S deno run -A
// src/x5300_recommend_to_chord.ts — recommend_to_chord (Action + Triangle/Build)
// position: 5/3 → action(5) × triangle(3)
// hex_dipole: "26 26 26 59 26 6C 26 26"
// placement_policy: axis
//
// recommend_to_chord.ts — convert recommendation to chord

import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { sha256Hex } from "./x4010_hash.ts";

/**
 * recommend_to_chord
 *
 * Reads the latest CognitiveRecommendationDescriptor JSON and writes one
 * chord per recommendation into jazz/chords/.
 *
 * Scene model: a chord is a self-contained sonic gesture. It may have
 * heard zero, one, or many prior chords (or non-ontological inputs like
 * dreams, observations, free-form context). The scene is a single flat
 * stream of chords; causation lives in the `hears:` field, not in the
 * filesystem layout.
 *
 * Dry-run: this tool only emits chords. No CLI is invoked, no listener
 * is woken automatically. Other voices (human or model) may add their
 * own chords in response, in support, in dissonance, or unprompted.
 */

const REC_PATH = "reports/cognition/recommendation.latest.json";
const CHORDS_DIR = "jazz/chords";
const ACTOR = "trinity-cognition";

const REPO_OCTET: Record<string, string> = {
  trinity: "oct:7.2",
  myc: "oct:7.2",
  liquid: "oct:6.4",
  omega: "oct:1.5",
};

const REPO_OCTET_SECONDARY: Record<string, string[]> = {
  trinity: ["oct:5.5", "oct:6.4"],
  myc: ["oct:5.5", "oct:6.4"],
  liquid: ["oct:7.2", "oct:5.1"],
  omega: ["oct:5.1", "oct:6.4"],
};

interface Recommendation {
  rank: number;
  repo: string;
  vector: string;
  phase_from: string;
  phase_to: string;
  pressure: number;
  action: string;
  rationale: string;
  expected_receipt: string;
  commands: string[];
}

interface RecommendationDescriptor {
  type: string;
  version: string;
  timestamp: string;
  recommendations: Recommendation[];
}

function modeFromPhase(phase_to: string): string {
  switch (phase_to) {
    case "receipt":
      return "REVIEW";
    case "formula":
      return "RIFF";
    case "crystal":
      return "PATCH";
    case "compost":
      return "COMPOST";
    default:
      return "OBSERVE";
  }
}

function slugify(text: string, maxLen = 60): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
}

function chordTimestamp(): string {
  // YYYYMMDD-HHMMSS in UTC
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    d.getUTCFullYear(),
    pad(d.getUTCMonth() + 1),
    pad(d.getUTCDate()),
    "-",
    pad(d.getUTCHours()),
    pad(d.getUTCMinutes()),
    pad(d.getUTCSeconds()),
  ].join("");
}

async function chordFingerprint(
  rec: Recommendation,
): Promise<string> {
  // Stable across runs: same action + same commands → same fingerprint.
  // Excludes timestamp, pressure, and hears (the snapshot hash changes
  // each cognition:recommend run even when the recommendation itself is
  // unchanged).
  const material = JSON.stringify({
    actor: ACTOR,
    repo: rec.repo,
    vector: rec.vector,
    action: rec.action,
    commands: rec.commands,
  });
  return `h.${(await sha256Hex(material)).slice(0, 12)}`;
}

async function findChordByFingerprint(fp: string): Promise<string | null> {
  try {
    for await (const entry of Deno.readDir(CHORDS_DIR)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      const body = await Deno.readTextFile(join(CHORDS_DIR, entry.name));
      const match = body.match(/^fingerprint:\s*"?([^"\n]+)"?$/m);
      if (match && match[1] === fp) return entry.name;
    }
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }
  return null;
}

function buildChord(
  rec: Recommendation,
  chordId: string,
  hears: string[],
  fingerprint: string,
): string {
  const primary = REPO_OCTET[rec.repo] ?? "oct:7.2";
  const secondary = REPO_OCTET_SECONDARY[rec.repo] ?? ["oct:5.5"];
  const energy = Math.max(0, Math.min(1, rec.pressure));
  const mode = modeFromPhase(rec.phase_to);
  const tension = slugify(rec.action);
  const hearsBlock = hears.length > 0
    ? hears.map((h) => `  - "${h}"`).join("\n")
    : "  []";

  const dateUtc = new Date().toISOString();
  return `---
chord:
  primary: "${primary}"
  secondary: ${JSON.stringify(secondary)}
energy: ${energy.toFixed(3)}
stake_q16: 0
mode: "${mode}"
tension: "${tension}"
confidence: "medium"
receipt: "none"
actor: "${ACTOR}"
fingerprint: "${fingerprint}"
hears:
${hearsBlock}
transition_receipt:
  idea_id: "${chordId}"
  from: "${rec.phase_from}"
  to: "${rec.phase_to}"
  decided_at_utc: "${dateUtc}"
  decided_by:
    - "${ACTOR}"
  evidence:
    - type: "recommendation"
      ref: "${rec.expected_receipt.replace(/"/g, '\\"')}"
---

# Chord: ${rec.repo} → ${rec.phase_to}

- chord_id: \`${chordId}\`
- emitter: \`0x5/3.ts\`
- vector: ${rec.vector}
- phase: ${rec.phase_from} → ${rec.phase_to}
- pressure: ${rec.pressure.toFixed(3)}

## Voice

${rec.action}

## Reason

${rec.rationale}

## Falsifier (expected_receipt)

This voice is not worth the air it took if no path produces:

> ${rec.expected_receipt}

## Suggested commands (not executed)

\`\`\`text
${rec.commands.join("\n") || "(no commands listed)"}
\`\`\`

## Anti-Loop

If a chord with the same \`tension\` and same suggested commands already
exists in the scene without a closing receipt, prefer \`mode: REST\` and
surface the duplication.
`;
}

async function snapshotHash(): Promise<string> {
  // Hash the recommendation file we are reading, so other chords can
  // reference "I heard this exact snapshot of cognition state".
  try {
    const text = await Deno.readTextFile(REC_PATH);
    const sha = await sha256Hex(text);
    return `h.${sha.slice(0, 12)}`;
  } catch {
    return "free:cognition-snapshot-unavailable";
  }
}

async function main() {
  let descriptor: RecommendationDescriptor;
  try {
    const text = await Deno.readTextFile(REC_PATH);
    descriptor = JSON.parse(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`🚨 cannot read ${REC_PATH}: ${msg}`);
    console.error("   run \`deno task cognition:recommend\` first");
    Deno.exit(1);
  }

  if (!descriptor.recommendations || descriptor.recommendations.length === 0) {
    console.log("ℹ️  no recommendations in latest descriptor; nothing to emit");
    return;
  }

  await ensureDir(CHORDS_DIR);
  const ts = chordTimestamp();
  const sourceHash = await snapshotHash();
  const hears = [sourceHash];

  let emitted = 0;
  let skipped = 0;
  for (const rec of descriptor.recommendations) {
    const fp = await chordFingerprint(rec);
    const existing = await findChordByFingerprint(fp);
    if (existing) {
      skipped++;
      console.log(`↺  fingerprint match: ${existing} (${fp}) — skipping`);
      continue;
    }

    const topic = `${rec.repo}-${slugify(rec.vector, 24)}`;
    const chordId = `${ts}-${ACTOR}-${topic}`;
    const filename = `${chordId}.md`;
    const path = join(CHORDS_DIR, filename);

    const body = buildChord(rec, chordId, hears, fp);
    await Deno.writeTextFile(path, body);
    emitted++;
    console.log(`✅ chord: ${path} [fp=${fp}]`);
  }

  console.log(
    `\nSummary: ${emitted} chord(s) emitted, ${skipped} skipped (fingerprint match)`,
  );
  console.log(
    "\nThis is dry-run scene emission. No commands were executed.",
  );
  console.log(
    "Other voices may add their own chords; causation lives in `hears:`.",
  );
}

main();
