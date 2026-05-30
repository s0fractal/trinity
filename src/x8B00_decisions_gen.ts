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
  resolution_status: "open" | "closed" | "superseded" | "historical" | null;
  resolved_by: string[];
  resolved_by_valid: boolean;
  resolution_validation_errors: string[];
  // For receipt-category entries: true if the chord references a contract,
  // a closing hash, suggested commands, or falsifiers. A "ritual receipt"
  // (substance=false) is a narrative chord that claims work was done without
  // pointing at any verifiable artifact. Always true for non-receipt categories.
  substance: boolean;
  proposal_triage: ProposalTriage | null;
}

interface ProposalTriage {
  stance: "candidate" | "revalidate" | "review";
  risks: string[];
  reason: string;
}

interface DecisionNextAction {
  kind: "proposal" | "critique" | "ritual_receipt";
  id: string;
  filename: string;
  author: string;
  timestamp: string;
  reason: string;
  triage_stance: ProposalTriage["stance"] | null;
  risks: string[];
  suggested_command: string;
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

// Bitcoin anchor for hex-block chord dates (matches x2700_heartbeat and
// x5910_compost_watchdog): block 950000 ≈ epoch 1779148800, 600s/block.
const BTC_ANCHOR_BLOCK = 950000;
const BTC_ANCHOR_EPOCH = 1779148800;
const BTC_SEC_PER_BLOCK = 600;

function blockHeightToISO(block: number): string {
  return new Date(
    (BTC_ANCHOR_EPOCH + (block - BTC_ANCHOR_BLOCK) * BTC_SEC_PER_BLOCK) * 1000,
  ).toISOString();
}

// Resolve a chord's authoritative timestamp from its filename. Prefers
// embedded ISO/compact timestamps, falls back to block-height conversion
// for hex-block names. Returns null when no time signal exists in filename.
function timestampFromFilename(filename: string): string | null {
  const isoMatch = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
  );
  if (isoMatch) {
    const [_, y, mo, d, h, mi, s] = isoMatch;
    return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  }
  const legacyMatch = filename.match(
    /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/,
  );
  if (legacyMatch) {
    const [_, y, mo, d, h, mi, s] = legacyMatch;
    return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  }
  const hexBlockMatch = filename.match(/^x[0-9A-Fa-f]{4}_(\d+)_/);
  if (hexBlockMatch) {
    const block = Number(hexBlockMatch[1]);
    if (Number.isFinite(block) && block > 0) {
      return blockHeightToISO(block);
    }
  }
  return null;
}

function daysSinceTimestamp(
  timestamp: string,
  nowMs = Date.now(),
): number | null {
  const t = new Date(timestamp).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((nowMs - t) / 86_400_000));
}

function triageProposal(entry: {
  category: DecisionEntry["category"];
  is_unresolved: boolean;
  filename: string;
  title: string;
  timestamp: string;
  has_falsifier: boolean;
  has_suggested_commands: boolean;
}): ProposalTriage | null {
  if (entry.category !== "proposal" || !entry.is_unresolved) return null;

  const risks: string[] = [];
  const lower = `${entry.filename} ${entry.title}`.toLowerCase();
  const ageDays = daysSinceTimestamp(entry.timestamp);

  if (ageDays !== null && ageDays >= 14) {
    risks.push(`stale_${ageDays}d`);
  }
  if (!entry.has_falsifier) risks.push("missing_falsifier");
  if (!entry.has_suggested_commands) risks.push("missing_suggested_commands");
  if (
    /delete|codeicide|folder[- ]topology|scattered|overlay|shadow|recursive-dispatcher/
      .test(lower)
  ) {
    risks.push("topology_or_destructive_risk");
  }

  const stance: ProposalTriage["stance"] = risks.includes(
      "topology_or_destructive_risk",
    )
    ? "review"
    : risks.some((r) => r.startsWith("stale_")) || risks.length > 0
    ? "revalidate"
    : "candidate";

  const reason = stance === "candidate"
    ? "proposal has enough shape for implementation review"
    : stance === "review"
    ? "proposal may degrade topology, safety, or repository cognition; review before any implementation"
    : "proposal is old or under-specified; revalidate against current substrate before implementation";

  return { stance, risks, reason };
}

function chooseNextAction(entries: DecisionEntry[]): DecisionNextAction | null {
  const unresolved = entries
    .filter((e) => e.is_unresolved)
    .sort((a, b) => {
      const priority = (e: DecisionEntry) =>
        e.proposal_triage?.stance === "review"
          ? 0
          : e.proposal_triage?.stance === "revalidate"
          ? 1
          : 2;
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      return a.timestamp.localeCompare(b.timestamp);
    });
  const firstUnresolved = unresolved[0];
  if (firstUnresolved) {
    const triage = firstUnresolved.proposal_triage;
    return {
      kind: firstUnresolved.category === "critique" ? "critique" : "proposal",
      id: firstUnresolved.id,
      filename: firstUnresolved.filename,
      author: firstUnresolved.author,
      timestamp: firstUnresolved.timestamp,
      reason: firstUnresolved.resolution_hint ??
        `${firstUnresolved.category} has no subsequent decision/receipt closure`,
      triage_stance: triage?.stance ?? null,
      risks: triage?.risks ?? [],
      suggested_command:
        `Review jazz/chords/${firstUnresolved.filename}; do not implement before deciding whether to revalidate, supersede, compost, or close it with a decision/receipt chord that references this id.`,
    };
  }

  const ritualReceipt = entries
    .filter((e) => e.category === "receipt" && !e.substance)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0];
  if (ritualReceipt) {
    return {
      kind: "ritual_receipt",
      id: ritualReceipt.id,
      filename: ritualReceipt.filename,
      author: ritualReceipt.author,
      timestamp: ritualReceipt.timestamp,
      reason: "receipt has no verifiable artifact link",
      triage_stance: null,
      risks: [],
      suggested_command:
        `Review jazz/chords/${ritualReceipt.filename} and add artifact evidence or mark it as narrative-only.`,
    };
  }

  return null;
}

// Recover author from chord filename when frontmatter omits speaker/actor/
// author_identity/voice. Three filename conventions are supported:
//   ISO timestamp:  2026-05-23T164713Z-<voice>-<slug>.md
//   legacy compact: 20260509-103147-<voice>-<slug>.md
//   hex-block:      xNNNN_<height>_<voice>_<slug>.md
// Returns null when no clear voice token is present.
function extractAuthorFromFilename(filename: string): string | null {
  // ISO timestamp + voice
  let m = filename.match(/^\d{4}-\d{2}-\d{2}T\d{6}Z-([a-z][a-z0-9]*?)(?:-|\.)/);
  if (m) return m[1];
  // Legacy compact + voice
  m = filename.match(/^\d{8}-\d{6}-([a-z][a-z0-9]*?)(?:-|\.)/);
  if (m) return m[1];
  // Hex-block + voice
  m = filename.match(/^x[0-9A-Fa-f]{4}_\d+_([a-z][a-z0-9]*?)_/);
  if (m) return m[1];
  return null;
}

function classifyCategory(
  filename: string,
  fm: Record<string, any>,
): DecisionEntry["category"] {
  const name = filename.toLowerCase();
  const claimKind = String(fm.claim_kind ?? "").toLowerCase();
  const mode = String(fm.mode ?? "").toLowerCase();

  // Frontmatter is authoritative when an explicit claim_kind or mode is set.
  // Filename heuristics are fallback only — otherwise a receipt chord whose
  // slug mentions the proposal it closes (e.g. "paired-critique-receipt")
  // gets misclassified as the closed item.
  // Both claim_kind and mode are honored symmetrically — new-form chords
  // (x<coord>_<block>_<voice>_<slug>.md) typically declare mode: only.
  if (claimKind === "critique" || mode === "critique") return "critique";
  if (claimKind === "proposal" || mode === "proposal") return "proposal";
  if (claimKind === "receipt" || mode === "receipt") return "receipt";
  if (claimKind === "decision" || mode === "decision") return "decision";

  if (name.includes("critique") || name.includes("nay")) return "critique";
  if (name.includes("proposal")) return "proposal";
  if (name.includes("receipt")) return "receipt";
  if (
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

function extractResolvedBy(text: string, fm: Record<string, any>): string[] {
  const list: string[] = [];
  if (fm.resolved_by) {
    if (Array.isArray(fm.resolved_by)) {
      list.push(...fm.resolved_by.map(String));
    } else {
      list.push(String(fm.resolved_by));
    }
  }

  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (m) {
    const fmText = m[1];
    const lines = fmText.split("\n");
    let inResolvedBy = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("resolved_by:")) {
        inResolvedBy = true;
        continue;
      }
      if (inResolvedBy) {
        if (trimmed.startsWith("-")) {
          const val = trimmed.slice(1).trim().replace(/^"|"$/g, "");
          if (val) list.push(val);
        } else if (trimmed.includes(":") || trimmed === "") {
          inResolvedBy = false;
        }
      }
    }
  }
  return [...new Set(list)];
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
      fm.speaker ?? fm.actor ?? fm.author_identity ?? fm.voice ??
        extractAuthorFromFilename(filename) ?? "unknown",
    );

    let timestamp = timestampFromFilename(filename);
    if (timestamp === null) {
      // Last resort: chord-id frontmatter contains a timestamp prefix
      if (typeof fm.id === "string" && fm.id.includes("T")) {
        timestamp = fm.id.split("-").slice(0, 3).join("-");
      } else {
        // Truly unknown — best-effort current time so downstream code can
        // still sort, but flag this case if it ever matters.
        timestamp = new Date().toISOString();
      }
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
      resolution_status: fm.resolution_status
        ? String(fm.resolution_status).trim().toLowerCase() as any
        : null,
      resolved_by: extractResolvedBy(text, fm),
      resolved_by_valid: true,
      resolution_validation_errors: [],
      substance: true,
      proposal_triage: null,
      mentions,
    };
  } catch {
    return null;
  }
}

function validateResolvedByEntries(
  resolved_by: string[],
  resolution_status: DecisionEntry["resolution_status"],
  trackedFiles: Set<string>,
  chordIdSet: Set<string>,
  stable: boolean,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (resolved_by.length === 0) {
    // No resolved_by is only an error if the entry is manually marked closed/
    // superseded/historical without any pointer to evidence.
    if (
      resolution_status === "closed" ||
      resolution_status === "superseded" ||
      resolution_status === "historical"
    ) {
      errors.push(
        `resolution_status is ${resolution_status} but resolved_by is empty`,
      );
      return { valid: false, errors };
    }
    return { valid: true, errors };
  }

  for (const raw of resolved_by) {
    const ref = raw.trim();
    if (!ref) continue;

    if (ref.includes("/") || /\.(md|ts|json|sh)$/.test(ref)) {
      // Path-like reference.
      const normalized = ref.replace(/^\.\//, "");
      if (stable) {
        if (!trackedFiles.has(normalized)) {
          // Allow root-level symlinks like AGENTS.md / SKILLS.md / HUMAN.md
          // that may not be tracked as files but resolve via filesystem.
          let fsOk = false;
          try {
            const stat = Deno.statSync(join(ROOT, normalized));
            fsOk = stat.isFile || stat.isDirectory;
          } catch {
            fsOk = false;
          }
          if (!fsOk) {
            errors.push(`resolved_by path not tracked: ${normalized}`);
          }
        }
      } else {
        try {
          const stat = Deno.statSync(join(ROOT, normalized));
          if (!(stat.isFile || stat.isDirectory)) {
            errors.push(`resolved_by path not a file/dir: ${normalized}`);
          }
        } catch {
          errors.push(`resolved_by path missing on disk: ${normalized}`);
        }
      }
    } else {
      // Bare reference — treat as chord-ID.
      if (!chordIdSet.has(ref) && !chordIdSet.has(ref + ".md")) {
        errors.push(`resolved_by chord-id not found: ${ref}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
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
    invalid_closures: number;
    ritual_receipts: number;
    ritual_receipts_recent_7d: number;
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

  const entries: DecisionEntry[] = rawEntries.map((raw) => {
    // Find later decisions or receipts that close or mention this entry.
    // Use chronology (timestamp), not alphabetical filename order: new-form
    // chord coords decouple coord-prefix from chronology, e.g. a receipt at
    // coord x2600 closing a proposal at x8800 sorts BEFORE the proposal
    // alphabetically but AFTER it in real time. slice(idx+1) would miss it.
    const laterClosures = rawEntries.filter(
      (other) =>
        other.filename !== raw.filename &&
        other.timestamp >= raw.timestamp &&
        (other.category === "decision" || other.category === "receipt"),
    );

    let has_receipt = laterClosures.some(
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

    // Validate resolved_by against tracked files / chord-ID universe.
    const chordIdSet = new Set(rawEntries.map((r) => r.filename));
    const validation = validateResolvedByEntries(
      raw.resolved_by,
      raw.resolution_status,
      trackedFiles,
      chordIdSet,
      stable,
    );

    if (
      raw.resolution_status === "closed" ||
      raw.resolution_status === "superseded" ||
      raw.resolution_status === "historical"
    ) {
      if (!validation.valid) {
        // Manual closure with invalid evidence — surface as unresolved.
        has_receipt = false;
        is_unresolved = true;
        resolution_hint =
          `marked ${raw.resolution_status} but resolved_by validation failed: ${
            validation.errors.join("; ")
          }`;
      } else {
        has_receipt = true;
        is_unresolved = false;
        resolution_hint = `manually marked as ${raw.resolution_status}`;
      }
    } else if (raw.resolution_status === "open") {
      has_receipt = false;
      is_unresolved = true;
      resolution_hint = `explicitly marked as open`;
    } else {
      if (raw.category === "proposal") {
        is_unresolved = !has_receipt;
        if (is_unresolved) {
          resolution_hint =
            "proposal has no subsequent receipt or decision closure";
        }
      } else if (raw.category === "critique") {
        // For critiques, closure could be a later proposal, decision, or receipt.
        // Same chronology-not-alphabetical fix as above.
        const laterCritiqueClosures = rawEntries.filter(
          (other) =>
            other.filename !== raw.filename &&
            other.timestamp >= raw.timestamp &&
            (other.category === "decision" ||
              other.category === "receipt" ||
              other.category === "proposal"),
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

    const proposal_triage = triageProposal({
      category: raw.category,
      is_unresolved,
      filename: raw.filename,
      title: raw.title,
      timestamp: raw.timestamp,
      has_falsifier: raw.falsifiers.length > 0,
      has_suggested_commands: raw.suggested_commands.length > 0,
    });

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
      resolution_status: raw.resolution_status,
      resolved_by: raw.resolved_by,
      resolved_by_valid: validation.valid,
      resolution_validation_errors: validation.errors,
      substance: raw.category !== "receipt" || (
        raw.closes_hash !== null ||
        raw.suggested_commands.length > 0 ||
        raw.falsifiers.length > 0 ||
        raw.resolved_by.length > 0 ||
        raw.mentions.some((m) =>
          m.startsWith("contracts/") ||
          /\.md$/.test(m) && m.includes("contracts")
        )
      ),
      proposal_triage,
    };
  });

  const triagedProposals = entries.filter((e) => e.proposal_triage !== null);
  const summary = {
    total_chords: entries.length,
    proposals: entries.filter((e) => e.category === "proposal").length,
    unresolved_proposals: entries.filter(
      (e) => e.category === "proposal" && e.is_unresolved,
    ).length,
    proposal_triage: {
      candidate:
        triagedProposals.filter((e) =>
          e.proposal_triage?.stance === "candidate"
        ).length,
      revalidate:
        triagedProposals.filter((e) =>
          e.proposal_triage?.stance === "revalidate"
        ).length,
      review:
        triagedProposals.filter((e) => e.proposal_triage?.stance === "review")
          .length,
    },
    decisions: entries.filter((e) => e.category === "decision").length,
    receipts: entries.filter((e) => e.category === "receipt").length,
    critiques: entries.filter((e) => e.category === "critique").length,
    unresolved_critiques: entries.filter(
      (e) => e.category === "critique" && e.is_unresolved,
    ).length,
    others: entries.filter((e) => e.category === "other").length,
    open_debts: entries.reduce((acc, e) => acc + e.open_debts.length, 0),
    closed_items: entries.reduce((acc, e) => acc + e.closed_items.length, 0),
    invalid_closures: entries.filter(
      (e) =>
        (e.resolution_status === "closed" ||
          e.resolution_status === "superseded" ||
          e.resolution_status === "historical") &&
        !e.resolved_by_valid,
    ).length,
    ritual_receipts: entries.filter(
      (e) => e.category === "receipt" && !e.substance,
    ).length,
    ritual_receipts_recent_7d: (() => {
      const cutoff = Date.now() - 7 * 86400000;
      return entries.filter((e) => {
        if (e.category !== "receipt" || e.substance) return false;
        const t = new Date(e.timestamp).getTime();
        return Number.isFinite(t) && t >= cutoff;
      }).length;
    })(),
  };

  return { summary, entries };
}

async function main() {
  const args = Deno.args;
  const wantJson = args.includes("--json");
  const wantVolatile = args.includes("--volatile");
  const wantNext = args.includes("--next");
  const stable = args.includes("--stable") || !wantVolatile;

  const { summary, entries } = await collectDecisions(stable);
  const next_action = chooseNextAction(entries);

  if (wantNext) {
    const payload = {
      type: "decisions_next",
      position: "8/B",
      action: "next",
      next_action,
    };
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (wantJson) {
    const payload = {
      type: "decisions",
      position: "8/B",
      summary,
      next_action,
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
  lines.push(`| Invalid Closures | ${summary.invalid_closures} |`);
  lines.push(
    `| Ritual Receipts (no verifiable artifact) | ${summary.ritual_receipts} |`,
  );
  lines.push(
    `| ↳ recent (last 7d) | ${summary.ritual_receipts_recent_7d} |`,
  );
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

  const invalidClosures = entries.filter(
    (e) =>
      (e.resolution_status === "closed" ||
        e.resolution_status === "superseded" ||
        e.resolution_status === "historical") &&
      !e.resolved_by_valid,
  );
  lines.push(`## Invalid Closures`);
  lines.push(``);
  lines.push(
    `*Entries manually marked as closed/superseded/historical whose resolved_by paths or chord-IDs failed validation. These are surfaced as unresolved above.*`,
  );
  lines.push(``);
  if (invalidClosures.length === 0) {
    lines.push(`*No invalid closures detected.*`);
    lines.push(``);
  } else {
    for (const e of invalidClosures) {
      lines.push(
        `- **${e.category.toUpperCase()}** [${e.filename}](../jazz/chords/${e.filename}) marked \`${e.resolution_status}\`:`,
      );
      for (const err of e.resolution_validation_errors) {
        lines.push(`  - ${err}`);
      }
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
