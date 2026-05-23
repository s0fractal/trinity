#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
// src/x8B00_decisions_gen.ts — chord decision ledger generator
// position: 8/B → void-infinity(8) × build-apex(B) = action/decisions ledger build
// hex_dipole: "93 00 00 00 00 00 00 33"
//   void_infinity-1.09 (PRIMARY: builds the index of decisions from chords)
//   harmony_emergence+0.33 (systemic coherence)
// placement_policy: axis
// intent: parse chords in jazz/chords/ and generate src/x2B88_decisions.myc.md ledger
// maturity: active
// horizon: none
// skill_tag: decisions
// skill_safe: yes

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { formatGeneratedFile } from "./x0012_generated_format.ts";
import { getGitTrackedFiles } from "./x8F10_external_surfaces_core.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const CHORDS_DIR = join(ROOT, "jazz", "chords");
const OUTPUT_PATH = join(HERE, "x2B88_decisions.myc.md");

export interface DecisionEntry {
  filename: string;
  id: string;
  category: "proposal" | "decision" | "receipt" | "critique" | "other";
  title: string;
  author: string;
  timestamp: string;
  claim_kind: string | null;
  receipt: string | null;
  closes_hash: string | null;
  falsifiers: string[];
  suggested_commands: string[];
  expected_after_running: string[];
  open_debts: string[];
  closed_items: string[];
}

// Minimal YAML frontmatter parser — extracts only the flat scalar fields we need.
function parseFrontmatter(text: string): Record<string, any> {
  const out: Record<string, any> = {};
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return out;
  const fm = m[1];
  for (const line of fm.split("\n")) {
    const kv = line.match(/^([\w_]+):\s*"?([^"#\n]*?)"?\s*(#.*)?$/);
    if (kv) {
      const v = kv[2].trim();
      if (v) out[kv[1]] = v;
    }
  }
  return out;
}

function classifyCategory(
  filename: string,
  fm: Record<string, any>,
): DecisionEntry["category"] {
  const name = filename.toLowerCase();
  const claimKind = String(fm.claim_kind ?? "").toLowerCase();
  const mode = String(fm.mode ?? "").toLowerCase();

  if (
    claimKind === "critique" ||
    mode === "critique" ||
    name.includes("critique") ||
    name.includes("nay")
  ) {
    return "critique";
  }
  if (claimKind === "proposal" || name.includes("proposal")) {
    return "proposal";
  }
  if (claimKind === "receipt" || name.includes("receipt")) {
    return "receipt";
  }
  if (
    claimKind === "decision" ||
    name.includes("decision") ||
    name.includes("verdict") ||
    name.includes("aye")
  ) {
    return "decision";
  }
  return "other";
}

function extractFalsifiers(text: string, fm: Record<string, any>): string[] {
  const list: string[] = [];
  if (fm.falsifier) list.push(String(fm.falsifier));
  if (fm.falsifiers) {
    if (Array.isArray(fm.falsifiers)) {
      list.push(...fm.falsifiers.map(String));
    } else {
      list.push(String(fm.falsifiers));
    }
  }

  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (m) {
    const fmText = m[1];
    const lines = fmText.split("\n");
    let inFalsifiers = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("falsifiers:")) {
        inFalsifiers = true;
        continue;
      }
      if (inFalsifiers) {
        if (trimmed.startsWith("-")) {
          const val = trimmed.slice(1).trim().replace(/^"|"$/g, "");
          if (val) list.push(val);
        } else if (trimmed.includes(":") || trimmed === "") {
          inFalsifiers = false;
        }
      }
    }
  }

  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^falsifiers?:\s*(.*)$/i);
    if (match && match[1].trim()) {
      const val = match[1].trim().replace(/^"|"$/g, "");
      if (val && !list.includes(val)) {
        list.push(val);
      }
    }
  }

  return [...new Set(list)];
}

function extractSuggestedCommands(
  text: string,
  fm: Record<string, any>,
): string[] {
  const list: string[] = [];
  if (fm.suggested_command) list.push(String(fm.suggested_command));
  if (fm.suggested_commands) {
    if (Array.isArray(fm.suggested_commands)) {
      list.push(...fm.suggested_commands.map(String));
    } else {
      list.push(String(fm.suggested_commands));
    }
  }

  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (m) {
    const fmText = m[1];
    const lines = fmText.split("\n");
    let inCmds = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("suggested_commands:")) {
        inCmds = true;
        continue;
      }
      if (inCmds) {
        if (trimmed.startsWith("-")) {
          const val = trimmed.slice(1).trim().replace(/^"|"$/g, "");
          if (val) list.push(val);
        } else if (trimmed.includes(":") || trimmed === "") {
          inCmds = false;
        }
      }
    }
  }

  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^suggested_commands?:\s*(.*)$/i);
    if (match && match[1].trim()) {
      const val = match[1].trim().replace(/^"|"$/g, "");
      if (val && !list.includes(val)) {
        list.push(val);
      }
    }
  }
  return [...new Set(list)];
}

function extractExpectedAfterRunning(
  text: string,
  fm: Record<string, any>,
): string[] {
  const list: string[] = [];
  if (fm.expected_after_running) list.push(String(fm.expected_after_running));

  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (m) {
    const fmText = m[1];
    const lines = fmText.split("\n");
    let inExpected = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("expected_after_running:")) {
        inExpected = true;
        continue;
      }
      if (inExpected) {
        if (trimmed.startsWith("-")) {
          const val = trimmed.slice(1).trim().replace(/^"|"$/g, "");
          if (val) list.push(val);
        } else if (trimmed.includes(":") || trimmed === "") {
          inExpected = false;
        }
      }
    }
  }

  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^expected_after_running:\s*(.*)$/i);
    if (match && match[1].trim()) {
      const val = match[1].trim().replace(/^"|"$/g, "");
      if (val && !list.includes(val)) {
        list.push(val);
      }
    }
  }
  return [...new Set(list)];
}

function extractClosesHash(
  text: string,
  fm: Record<string, any>,
): string | null {
  if (fm.closes_hash) return String(fm.closes_hash);
  if (fm.closes && typeof fm.closes === "object" && fm.closes.body_hash) {
    return String(fm.closes.body_hash);
  }

  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (m) {
    const fmText = m[1];
    const closesMatch = fmText.match(/closes_hash:\s*"?([^"\n]+)"?/);
    if (closesMatch) return closesMatch[1].trim();

    const bodyHashMatch = fmText.match(
      /closes:\s*[\s\S]*?body_hash:\s*"?([^"\n]+)"?/,
    );
    if (bodyHashMatch) return bodyHashMatch[1].trim();
  }
  return null;
}

async function scanChordFile(filename: string): Promise<DecisionEntry | null> {
  try {
    const path = join(CHORDS_DIR, filename);
    const text = await Deno.readTextFile(path);
    const fm = parseFrontmatter(text);

    let title = filename;
    const h1Match = text.match(/^#\s+(.*)$/m);
    if (h1Match && h1Match[1].trim()) {
      title = h1Match[1].trim();
    } else {
      const h2Match = text.match(/^##\s+(.*)$/m);
      if (h2Match && h2Match[1].trim()) {
        title = h2Match[1].trim();
      }
    }

    const category = classifyCategory(filename, fm);
    const author = String(
      fm.speaker ?? fm.actor ?? fm.author_identity ?? "unknown",
    );

    let timestamp = new Date().toISOString();
    const tsMatch = filename.match(/^(\d{4}-\d{2}-\d{2}T\d{6}Z|\d{8}-\d{6})/);
    if (tsMatch) {
      timestamp = tsMatch[1];
    } else if (typeof fm.id === "string" && fm.id.includes("T")) {
      timestamp = fm.id.split("-").slice(0, 3).join("-");
    }

    const falsifiers = extractFalsifiers(text, fm);
    const suggested_commands = extractSuggestedCommands(text, fm);
    const expected_after_running = extractExpectedAfterRunning(text, fm);
    const closes_hash = extractClosesHash(text, fm);
    const claim_kind = fm.claim_kind ? String(fm.claim_kind).trim() : null;
    const receipt = fm.receipt ? String(fm.receipt).trim() : null;

    const open_debts: string[] = [];
    const closed_items: string[] = [];

    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- [ ]")) {
        const task = trimmed.slice(5).trim();
        if (task) open_debts.push(task);
      } else if (trimmed.startsWith("- [x]")) {
        const task = trimmed.slice(5).trim();
        if (task) closed_items.push(task);
      } else {
        const todoMatch = trimmed.match(/(?:TODO|DEBT):\s*(.*)$/i);
        if (todoMatch && todoMatch[1].trim()) {
          open_debts.push(todoMatch[1].trim());
        }
      }
    }

    return {
      filename,
      id: String(fm.id ?? filename.replace(/\.md$/, "")),
      category,
      title,
      author,
      timestamp,
      claim_kind,
      receipt,
      closes_hash,
      falsifiers,
      suggested_commands,
      expected_after_running,
      open_debts,
      closed_items,
    };
  } catch {
    return null;
  }
}

export async function collectDecisions(stable: boolean): Promise<{
  summary: {
    total_chords: number;
    proposals: number;
    decisions: number;
    receipts: number;
    critiques: number;
    others: number;
    open_debts: number;
    closed_items: number;
  };
  entries: DecisionEntry[];
}> {
  const trackedFiles = await getGitTrackedFiles();
  const entries: DecisionEntry[] = [];

  for await (const entry of Deno.readDir(CHORDS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;

    const relPath = `jazz/chords/${entry.name}`;
    if (stable && !trackedFiles.has(relPath)) {
      continue;
    }

    const record = await scanChordFile(entry.name);
    if (record) {
      entries.push(record);
    }
  }

  entries.sort((a, b) => a.filename.localeCompare(b.filename));

  const summary = {
    total_chords: entries.length,
    proposals: entries.filter((e) => e.category === "proposal").length,
    decisions: entries.filter((e) => e.category === "decision").length,
    receipts: entries.filter((e) => e.category === "receipt").length,
    critiques: entries.filter((e) => e.category === "critique").length,
    others: entries.filter((e) => e.category === "other").length,
    open_debts: entries.reduce((acc, e) => acc + e.open_debts.length, 0),
    closed_items: entries.reduce((acc, e) => acc + e.closed_items.length, 0),
  };

  return { summary, entries };
}

async function main() {
  const args = Deno.args;
  const wantJson = args.includes("--json");
  const wantVolatile = args.includes("--volatile");
  const stable = args.includes("--stable") || !wantVolatile;

  const { summary, entries } = await collectDecisions(stable);

  if (wantJson) {
    const payload = {
      type: "decisions",
      position: "8/B",
      summary,
      entries,
    };
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8B00_decisions_gen.ts — do not edit by hand. -->`,
  );
  if (!stable) {
    lines.push(`<!-- generated_at: ${new Date().toISOString()} -->`);
  }
  lines.push(``);
  lines.push(`# Substrate decision ledger`);
  lines.push(``);
  lines.push(
    `*Generated index of proposals, decisions, receipts, critiques, and open/closed tasks extracted from the chord trail in jazz/chords/.*`,
  );
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`| Metric | Count |`);
  lines.push(`| :--- | :---: |`);
  lines.push(`| Total Chords | ${summary.total_chords} |`);
  lines.push(`| Proposals | ${summary.proposals} |`);
  lines.push(`| Decisions | ${summary.decisions} |`);
  lines.push(`| Receipts | ${summary.receipts} |`);
  lines.push(`| Critiques | ${summary.critiques} |`);
  lines.push(`| Other Observations | ${summary.others} |`);
  lines.push(`| Open Debts (TODO/DEBT) | ${summary.open_debts} |`);
  lines.push(`| Closed Items | ${summary.closed_items} |`);
  lines.push(``);

  const allOpenDebts: { task: string; chord: string }[] = [];
  for (const e of entries) {
    for (const d of e.open_debts) {
      allOpenDebts.push({ task: d, chord: e.filename });
    }
  }

  lines.push(`## Open Debts`);
  lines.push(``);
  if (allOpenDebts.length === 0) {
    lines.push(`*No open debts detected in the chord trail.*`);
    lines.push(``);
  } else {
    for (const d of allOpenDebts) {
      lines.push(
        `- [ ] ${d.task} (in [${d.chord}](../jazz/chords/${d.chord}))`,
      );
    }
    lines.push(``);
  }

  lines.push(`## Actionable Ledger`);
  lines.push(``);
  lines.push(
    `| Chord | Category | Author | Debts | Closed |`,
  );
  lines.push(
    `| :--- | :--- | :--- | :---: | :---: |`,
  );
  for (const e of entries) {
    lines.push(
      `| [${e.filename}](../jazz/chords/${e.filename}) | **${e.category.toUpperCase()}** | ${e.author} | ${e.open_debts.length} | ${e.closed_items.length} |`,
    );
  }
  lines.push(``);

  // Section with details for chords containing actionable statements
  const detailedEntries = entries.filter(
    (e) =>
      e.falsifiers.length > 0 ||
      e.suggested_commands.length > 0 ||
      e.expected_after_running.length > 0 ||
      e.closes_hash !== null,
  );

  lines.push(`## Actionable Details`);
  lines.push(``);
  if (detailedEntries.length === 0) {
    lines.push(`*No detailed actionable metadata found in the chord trail.*`);
    lines.push(``);
  } else {
    for (const e of detailedEntries) {
      lines.push(`### [${e.filename}](../jazz/chords/${e.filename})`);
      lines.push(
        `- **Category**: \`${e.category.toUpperCase()}\` (Author: \`${e.author}\`)`,
      );
      if (e.claim_kind) {
        lines.push(`- **Claim Kind**: \`${e.claim_kind}\``);
      }
      if (e.receipt) {
        lines.push(`- **Receipt Type**: \`${e.receipt}\``);
      }
      if (e.closes_hash) {
        lines.push(`- **Closes**: \`${e.closes_hash}\``);
      }
      if (e.falsifiers.length > 0) {
        lines.push(`- **Falsifiers**:`);
        for (const f of e.falsifiers) {
          lines.push(`  - *${f}*`);
        }
      }
      if (e.suggested_commands.length > 0) {
        lines.push(`- **Suggested Commands**:`);
        for (const c of e.suggested_commands) {
          lines.push(`  - \`${c}\``);
        }
      }
      if (e.expected_after_running.length > 0) {
        lines.push(`- **Expected After Running**:`);
        for (const ex of e.expected_after_running) {
          lines.push(`  - *${ex}*`);
        }
      }
      lines.push(``);
    }
  }

  await Deno.writeTextFile(OUTPUT_PATH, lines.join("\n"));
  await formatGeneratedFile(OUTPUT_PATH);

  const receipt = {
    type: "decisions_gen",
    position: "8/B",
    action: "generate",
    note: "decision ledger generated successfully",
    summary,
  };

  console.log(JSON.stringify(receipt, null, 2));
}

if (import.meta.main) {
  await main();
}
