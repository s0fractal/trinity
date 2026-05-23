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
  has_falsifier: boolean;
  has_suggested_commands: boolean;
  has_receipt: boolean;
  is_unresolved: boolean;
  resolution_hint: string | null;
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

async function scanChordFile(
  filename: string,
): Promise<(DecisionEntry & { mentions: string[] }) | null> {
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

    const mentions: string[] = [];
    const mdMatches = text.matchAll(/([a-zA-Z0-9_T.-]+\.md)/g);
    for (const m of mdMatches) {
      const matchName = m[1];
      if (!mentions.includes(matchName)) {
        mentions.push(matchName);
      }
    }
    const wordMatches = text.matchAll(
      /\b(\d{4}-\d{2}-\d{2}T\d{6}Z|\d{8}-\d{6}|x\d{4}_\d+_[a-z0-9_-]+)\b/g,
    );
    for (const m of wordMatches) {
      const matchWord = m[1];
      if (!mentions.includes(matchWord)) {
        mentions.push(matchWord);
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
      has_falsifier: falsifiers.length > 0,
      has_suggested_commands: suggested_commands.length > 0,
      has_receipt: false,
      is_unresolved: false,
      resolution_hint: null,
      mentions,
    };
  } catch {
    return null;
  }
}

export async function collectDecisions(stable: boolean): Promise<{
  summary: {
    total_chords: number;
    proposals: number;
    unresolved_proposals: number;
    decisions: number;
    receipts: number;
    critiques: number;
    unresolved_critiques: number;
    others: number;
    open_debts: number;
    closed_items: number;
  };
  entries: DecisionEntry[];
}> {
  const trackedFiles = await getGitTrackedFiles();
  const rawEntries: (DecisionEntry & { mentions: string[] })[] = [];

  for await (const entry of Deno.readDir(CHORDS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;

    const relPath = `jazz/chords/${entry.name}`;
    if (stable && !trackedFiles.has(relPath)) {
      continue;
    }

    const record = await scanChordFile(entry.name);
    if (record) {
      rawEntries.push(record);
    }
  }

  rawEntries.sort((a, b) => a.filename.localeCompare(b.filename));

  const entries: DecisionEntry[] = rawEntries.map((raw, idx) => {
    // Find later decisions or receipts that close or mention this entry
    const laterClosures = rawEntries.slice(idx + 1).filter(
      (other) => other.category === "decision" || other.category === "receipt",
    );

    const has_receipt = laterClosures.some(
      (other) =>
        other.closes_hash === raw.id ||
        other.closes_hash === raw.filename ||
        (raw.closes_hash !== null && other.closes_hash === raw.closes_hash) ||
        other.mentions.includes(raw.filename) ||
        other.mentions.includes(raw.id + ".md") ||
        other.mentions.includes(raw.id),
    );

    let is_unresolved = false;
    let resolution_hint: string | null = null;

    if (raw.category === "proposal") {
      is_unresolved = !has_receipt;
      if (is_unresolved) {
        resolution_hint =
          "proposal has no subsequent receipt or decision closure";
      }
    } else if (raw.category === "critique") {
      // For critiques, closure could be a later proposal, decision, or receipt
      const laterCritiqueClosures = rawEntries.slice(idx + 1).filter(
        (other) =>
          other.category === "decision" ||
          other.category === "receipt" ||
          other.category === "proposal",
      );
      const critique_resolved = laterCritiqueClosures.some(
        (other) =>
          other.closes_hash === raw.id ||
          other.closes_hash === raw.filename ||
          other.mentions.includes(raw.filename) ||
          other.mentions.includes(raw.id + ".md") ||
          other.mentions.includes(raw.id),
      );
      is_unresolved = !critique_resolved;
      if (is_unresolved) {
        resolution_hint =
          "critique has no subsequent response or receipt closure";
      }
    }

    if (!resolution_hint) {
      if (
        raw.falsifiers.length > 0 && raw.suggested_commands.length === 0 &&
        raw.expected_after_running.length === 0
      ) {
        resolution_hint =
          "weak: falsifier exists but has no suggested commands or expected output";
      } else if (
        raw.category === "receipt" && raw.suggested_commands.length > 0 &&
        raw.expected_after_running.length > 0
      ) {
        resolution_hint =
          "stronger: receipt has both execution commands and expected outputs";
      }
    }

    return {
      filename: raw.filename,
      id: raw.id,
      category: raw.category,
      title: raw.title,
      author: raw.author,
      timestamp: raw.timestamp,
      claim_kind: raw.claim_kind,
      receipt: raw.receipt,
      closes_hash: raw.closes_hash,
      falsifiers: raw.falsifiers,
      suggested_commands: raw.suggested_commands,
      expected_after_running: raw.expected_after_running,
      open_debts: raw.open_debts,
      closed_items: raw.closed_items,
      has_falsifier: raw.falsifiers.length > 0,
      has_suggested_commands: raw.suggested_commands.length > 0,
      has_receipt,
      is_unresolved,
      resolution_hint,
    };
  });

  const summary = {
    total_chords: entries.length,
    proposals: entries.filter((e) => e.category === "proposal").length,
    unresolved_proposals: entries.filter(
      (e) => e.category === "proposal" && e.is_unresolved,
    ).length,
    decisions: entries.filter((e) => e.category === "decision").length,
    receipts: entries.filter((e) => e.category === "receipt").length,
    critiques: entries.filter((e) => e.category === "critique").length,
    unresolved_critiques: entries.filter(
      (e) => e.category === "critique" && e.is_unresolved,
    ).length,
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
  lines.push(
    `| Unresolved Proposals (Heuristic) | ${summary.unresolved_proposals} |`,
  );
  lines.push(`| Decisions | ${summary.decisions} |`);
  lines.push(`| Receipts | ${summary.receipts} |`);
  lines.push(`| Critiques | ${summary.critiques} |`);
  lines.push(
    `| Unresolved Critiques (Heuristic) | ${summary.unresolved_critiques} |`,
  );
  lines.push(`| Other Observations | ${summary.others} |`);
  lines.push(`| Open Debts (TODO/DEBT) | ${summary.open_debts} |`);
  lines.push(`| Closed Items | ${summary.closed_items} |`);
  lines.push(``);

  const unresolved = entries.filter((e) => e.is_unresolved);
  lines.push(`## Unresolved Items (Heuristic Accountability)`);
  lines.push(``);
  lines.push(
    `*Heuristic list of active proposals and critiques that do not have subsequent decisions or receipts referencing them.*`,
  );
  lines.push(``);
  if (unresolved.length === 0) {
    lines.push(`*No unresolved proposals or critiques detected.*`);
    lines.push(``);
  } else {
    for (const e of unresolved) {
      lines.push(
        `- **${e.category.toUpperCase()}**: [${e.title}](../jazz/chords/${e.filename}) (by *${e.author}* — *${e.resolution_hint}*)`,
      );
    }
    lines.push(``);
  }

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
