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

interface DecisionEntry {
  filename: string;
  id: string;
  category: "proposal" | "decision" | "receipt" | "critique" | "other";
  title: string;
  author: string;
  timestamp: string;
  falsifier: string | null;
  open_debts: string[];
  closed_items: string[];
}

function parseFrontmatter(text: string): Record<string, string | number> {
  const out: Record<string, string | number> = {};
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
  fm: Record<string, string | number>,
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

async function scanChordFile(filename: string): Promise<DecisionEntry | null> {
  try {
    const path = join(CHORDS_DIR, filename);
    const text = await Deno.readTextFile(path);
    const fm = parseFrontmatter(text);

    // Try to extract a clean title from the first H1 or H2, fallback to filename
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

    // Attempt to extract timestamp from filename prefix or frontmatter id
    let timestamp = new Date().toISOString();
    const tsMatch = filename.match(/^(\d{4}-\d{2}-\d{2}T\d{6}Z|\d{8}-\d{6})/);
    if (tsMatch) {
      timestamp = tsMatch[1];
    } else if (typeof fm.id === "string" && fm.id.includes("T")) {
      timestamp = fm.id.split("-").slice(0, 3).join("-");
    }

    const falsifier = fm.falsifier || fm.falsifiers || null;
    let falsifierStr = falsifier ? String(falsifier) : null;

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

      if (!falsifierStr) {
        const m = trimmed.match(/^falsifiers?:\s*(.*)$/i);
        if (m && m[1].trim()) {
          falsifierStr = m[1].trim();
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
      falsifier: falsifierStr,
      open_debts,
      closed_items,
    };
  } catch {
    return null;
  }
}

async function main() {
  const args = Deno.args;
  const wantJson = args.includes("--json");
  const stable = args.includes("--stable");

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

  // Deterministic sorting: by filename ascending (chronological order)
  entries.sort((a, b) => a.filename.localeCompare(b.filename));

  // Compute statistics
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

  // Extract all open debts
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
    `| Chord | Category | Author | Falsifier | Debts | Closed |`,
  );
  lines.push(
    `| :--- | :--- | :--- | :--- | :---: | :---: |`,
  );
  for (const e of entries) {
    const falsifierCell = e.falsifier ? e.falsifier : "*none*";
    lines.push(
      `| [${e.filename}](../jazz/chords/${e.filename}) | **${e.category.toUpperCase()}** | ${e.author} | ${falsifierCell} | ${e.open_debts.length} | ${e.closed_items.length} |`,
    );
  }
  lines.push(``);

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
