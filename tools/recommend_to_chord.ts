import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

/**
 * recommend_to_chord
 *
 * Reads the latest CognitiveRecommendationDescriptor JSON and emits one
 * JAZZ event per recommendation into trinity/jazz/events/.
 *
 * Dry-run by default: this tool emits chord *events*, not actions. No CLI
 * is invoked, no listener is woken automatically. The events sit on the
 * scene until a listener (or a human) picks them up. This is the
 * minimum-viable JAZZ-meta loop: cognition → chord → scene.
 *
 * Why not auto-execute: per JAZZ §10 (anti-loop) and codex.0006 — daemon
 * hardening must come before automatic invocation. This tool is the
 * conservation-laws-first half of the loop.
 */

const REC_PATH = "reports/cognition/recommendation.latest.json";
const EVENTS_DIR = "jazz/events";

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

function eventTimestamp(): string {
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

function buildEvent(rec: Recommendation, eventId: string): string {
  const primary = REPO_OCTET[rec.repo] ?? "oct:7.2";
  const secondary = REPO_OCTET_SECONDARY[rec.repo] ?? ["oct:5.5"];
  const energy = Math.max(0, Math.min(1, rec.pressure));
  const mode = modeFromPhase(rec.phase_to);
  const tension = slugify(rec.action);
  const commandsBlock = rec.commands.length > 0
    ? rec.commands.map((c) => `  - "${c}"`).join("\n")
    : '  - "(no commands listed)"';

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
source: "trinity/cognition:recommend"
---

# JAZZ-meta event: ${rec.repo} → ${rec.phase_to}

## Origin

This event was auto-emitted from trinity's cognitive recommendation loop.

- event_id: \`${eventId}\`
- emitter: \`tools/recommend_to_chord.ts\`
- source descriptor: \`${REC_PATH}\`
- rank: ${rec.rank}
- pressure: ${rec.pressure.toFixed(3)}
- vector: ${rec.vector}
- phase: ${rec.phase_from} → ${rec.phase_to}

## Ask

${rec.action}

## Rationale

${rec.rationale}

## Falsifier (expected_receipt)

This call is not worth action if no path produces:

> ${rec.expected_receipt}

## Suggested commands (not executed)

\`\`\`text
${rec.commands.join("\n") || "(no commands listed)"}
\`\`\`

\`\`\`yaml
suggested_commands:
${commandsBlock}
\`\`\`

## Listener Guidance

This is a **dry-run** chord event:

- listeners MAY read this and propose a response in
  \`jazz/responses/\` with a chord frontmatter, mode, claim, evidence, and
  falsifier;
- listeners MUST NOT auto-execute the suggested commands without explicit
  warrant from the operator;
- a response is valid even if it concludes \`COMPOST\` or \`DISSONATE\` with
  reason.

## Anti-Loop

If a previous event with the same \`tension\` and same suggested commands
already exists in this scene without a closing receipt, prefer
\`mode: REST\` and surface the duplication.
`;
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

  await ensureDir(EVENTS_DIR);
  const ts = eventTimestamp();

  let emitted = 0;
  for (const rec of descriptor.recommendations) {
    const eventId = `event-${ts}-${rec.repo}-${slugify(rec.vector, 20)}`;
    const filename = `${eventId}.md`;
    const path = join(EVENTS_DIR, filename);

    try {
      // emit only if not already present (idempotent within a second)
      await Deno.stat(path);
      console.log(`↺  exists, skipping: ${path}`);
      continue;
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) throw e;
    }

    const body = buildEvent(rec, eventId);
    await Deno.writeTextFile(path, body);
    emitted++;
    console.log(`✅ emitted: ${path}`);
  }

  console.log(
    `\nSummary: ${emitted} event(s) emitted, ${
      descriptor.recommendations.length - emitted
    } skipped`,
  );
  console.log(
    "\nThis is dry-run scene emission. No commands were executed. Listeners",
  );
  console.log(
    "may respond by writing to jazz/responses/ with chord+falsifier+evidence.",
  );
}

main();
