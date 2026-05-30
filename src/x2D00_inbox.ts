#!/usr/bin/env -S deno run --allow-read
// src/x2D00_inbox.ts — inbox (chords addressed to a voice that the voice has not yet responded to)
// position: 2/D → mirror(2) × decision(D) = reflect-on-pending-decisions
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 26 6C 26 33 4C 33 26"
//   axis 2 mirror_apex +0.85 (PRIMARY: inbox IS reflection of incoming)
//   axis 5 action_decision +0.60 (secondary: hex D = axis 5 decision-pole;
//          inbox = "things waiting for my decision")
//   axis 4 foundation +0.51, axis 6 harmony +0.51 (medium; inbox grounds
//          awareness + harmonizes pending responses)
//   bucket 2/D: primary axis mirror (2), bucket 2 ← MATCH on axis 2
//               secondary 'D' → axis 5 decision-pole ← PAIR-MATCH
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// inbox — what a voice has been addressed to without yet responding
//
// Reads jazz/chords/*.md frontmatter. For a given voice:
//   1. Find all chords with this voice in `addressed_to` field
//   2. Find all chords by this voice that hear those chords (via `hears`)
//   3. Inbox = addressed-to set MINUS hears-by-voice set
//
// Reduces architect-shuttling: one command shows backlog instead of
// paste-per-chord. Does NOT auto-invoke the voice — just surfaces the
// queue. Per VOICE_DAEMON.v0.draft: surfacing is in scope; invoking is not.
//
// Usage:
//   t inbox                # all voices, count summary
//   t inbox <voice>        # chord list for one voice
//   t inbox <voice> --json # machine-readable
//
// Glossary words: inbox, pending, backlog, очікує, скринька

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const CHORDS_DIR = join(ROOT, "jazz", "chords");

// ── types ──────────────────────────────────────────────────────────────────

interface ChordFm {
  id?: string;
  speaker?: string;
  created?: string;
  topic?: string;
  mode?: string;
  energy?: number;
  hears?: string[];
  addressed_to?: string[];
  [key: string]: unknown;
}

interface InboxItem {
  chord_id: string;
  chord_path: string;
  speaker: string;
  created: string | null;
  topic: string | null;
  mode: string | null;
  energy: number | null;
  addressed_to: string[];
}

interface InboxNextAction {
  voice: string;
  chord_id: string;
  chord_path: string;
  speaker: string;
  topic: string | null;
  mode: string | null;
  oldest_days_ago: number | null;
  suggested_command: string;
  response_hint: string;
}

// ── helpers ────────────────────────────────────────────────────────────────

function normSpeaker(s: string): string {
  // Strip everything after first whitespace or paren (handles
  // "hermes (await first chord)" → "hermes").
  let v = s.split(/[\s(]/)[0].toLowerCase().trim();
  // Strip versioned suffixes like -opus-4.7-1m, -gpt-5, -3.1-pro, -k1.6.
  v = v.replace(
    /[-_](opus|gpt|k|3|claude|gemini|codex|kimi|hermes)[-_.0-9].*$/i,
    "",
  );
  // Strip plain version dots/dashes at end ("claude-opus" → "claude").
  v = v.replace(/-(opus|sonnet|haiku|pro|flash|k\d+|gpt-?\d+).*$/i, "");
  return v;
}

function extractChordId(hearsEntry: string): string | null {
  // Accept "jazz/chords/2026-...md", "2026-...md", "2026-..." (no .md)
  let s = hearsEntry.trim();
  if (s.startsWith("jazz/chords/")) s = s.slice("jazz/chords/".length);
  if (s.endsWith(".md")) s = s.slice(0, -3);
  return s || null;
}

function parseYamlFrontmatter(text: string): ChordFm | null {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  const yaml = text.slice(4, end);

  const fm: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let inList = false;
  const listItems: string[] = [];

  for (const line of yaml.split("\n")) {
    const trimmed = line.trimStart();
    if (trimmed.length === 0) continue;

    const listMatch = trimmed.match(/^-\s+(.*)$/);
    if (listMatch) {
      if (currentKey && !inList) inList = true;
      if (inList) {
        let v = listMatch[1].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        listItems.push(v);
      }
      continue;
    }

    if (inList && currentKey) {
      fm[currentKey] = listItems.slice();
      listItems.length = 0;
      inList = false;
      currentKey = null;
    }

    const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val.length > 0) {
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          fm[currentKey] = val.slice(1, -1);
        } else if (/^\d+$/.test(val)) fm[currentKey] = parseInt(val, 10);
        else if (/^\d+\.\d+$/.test(val)) fm[currentKey] = parseFloat(val);
        else fm[currentKey] = val;
      }
    }
  }
  if (inList && currentKey) fm[currentKey] = listItems.slice();
  return fm as ChordFm;
}

async function loadAllChords(): Promise<{ fm: ChordFm; path: string }[]> {
  const out: { fm: ChordFm; path: string }[] = [];
  try {
    for await (const entry of Deno.readDir(CHORDS_DIR)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      const path = join("jazz", "chords", entry.name);
      const text = await Deno.readTextFile(join(CHORDS_DIR, entry.name));
      const fm = parseYamlFrontmatter(text);
      if (!fm) continue;
      if (!fm.id) fm.id = entry.name.replace(/\.md$/, "");
      if (fm.speaker) fm.speaker = normSpeaker(fm.speaker);
      out.push({ fm, path });
    }
  } catch {
    /* directory missing */
  }
  return out;
}

// ── inbox computation ──────────────────────────────────────────────────────

function computeInbox(
  voice: string,
  chords: { fm: ChordFm; path: string }[],
): InboxItem[] {
  // Set of chord_ids that this voice has heard (responded to).
  const heard = new Set<string>();
  for (const { fm } of chords) {
    if (fm.speaker !== voice) continue;
    if (!Array.isArray(fm.hears)) continue;
    for (const h of fm.hears) {
      const id = extractChordId(String(h));
      if (id) heard.add(id);
    }
  }

  // Filter to chords addressed to this voice that voice has not heard.
  const items: InboxItem[] = [];
  for (const { fm, path } of chords) {
    if (!Array.isArray(fm.addressed_to)) continue;
    const addrs = fm.addressed_to.map((a) => normSpeaker(String(a)));
    if (!addrs.includes(voice)) continue;
    if (fm.id && heard.has(fm.id)) continue;
    // Skip if composted, rejected, superseded, or deprecated
    if (
      fm.status === "compost" ||
      fm.status === "rejected" ||
      fm.status === "superseded" ||
      fm.status === "deprecated"
    ) {
      continue;
    }
    // Also skip if this voice is the speaker (addressed-to-self is OK to skip)
    if (fm.speaker === voice) continue;
    items.push({
      chord_id: fm.id ?? "(unknown)",
      chord_path: path,
      speaker: fm.speaker ?? "(unknown)",
      created: fm.created ?? null,
      topic: fm.topic ?? null,
      mode: fm.mode ?? null,
      energy: typeof fm.energy === "number" ? fm.energy : null,
      addressed_to: addrs,
    });
  }
  // Sort oldest-first; oldest backlog has highest priority.
  items.sort((
    a,
    b,
  ) => (a.chord_id < b.chord_id ? -1 : a.chord_id > b.chord_id ? 1 : 0));
  return items;
}

function listAllVoices(chords: { fm: ChordFm; path: string }[]): string[] {
  const voices = new Set<string>();
  for (const { fm } of chords) {
    if (fm.speaker) voices.add(fm.speaker);
    if (Array.isArray(fm.addressed_to)) {
      for (const a of fm.addressed_to) voices.add(normSpeaker(String(a)));
    }
  }
  // Filter out "architect" — it's a standing, not a voice (per VOICES.v0.1).
  voices.delete("architect");
  return [...voices].sort();
}

// ── output ─────────────────────────────────────────────────────────────────

// Compute approximate days-ago from a chord_id string. Handles new-form
// (x<NNNN>_<block>_...), old-form (YYYY-MM-DDTHHMMSSZ-...), and proto-form
// (YYYYMMDD-HHMMSSZ?-...). Returns null if no time signal extractable.
const BTC_BLOCK_SEC = 600;
const BTC_REF_BLOCK = 950000;
const BTC_REF_EPOCH = 1779148800; // 2026-05-19T00:00:00Z
function chordDaysAgo(chord_id: string, nowMs = Date.now()): number | null {
  const newM = /^x[0-9A-Fa-f]{4}_(\d+)_/.exec(chord_id);
  if (newM) {
    const block = parseInt(newM[1], 10);
    const epoch = BTC_REF_EPOCH + (block - BTC_REF_BLOCK) * BTC_BLOCK_SEC;
    return Math.floor((nowMs / 1000 - epoch) / 86400);
  }
  const oldM = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})Z/.exec(chord_id);
  if (oldM) {
    const [, y, mo, d, h, mi, s] = oldM;
    const epoch = Math.floor(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) / 1000);
    return Math.floor((nowMs / 1000 - epoch) / 86400);
  }
  const protoM = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})Z?/.exec(
    chord_id,
  );
  if (protoM) {
    const [, y, mo, d, h, mi, s] = protoM;
    const epoch = Math.floor(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) / 1000);
    return Math.floor((nowMs / 1000 - epoch) / 86400);
  }
  return null;
}

// Most-common-sender for a voice's pending inbox. Returns null when empty.
function topSenderOf(items: InboxItem[]): string | null {
  if (items.length === 0) return null;
  const counts = new Map<string, number>();
  for (const it of items) {
    const s = (it.speaker ?? "?").split("-")[0].toLowerCase();
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  let best = "", bestN = 0;
  for (const [s, n] of counts) {
    if (n > bestN) {
      best = s;
      bestN = n;
    }
  }
  return bestN > 0 ? `${best}×${bestN}` : null;
}

function inboxSummary(allInboxes: Record<string, InboxItem[]>): {
  voices: number;
  voices_with_pending: number;
  total_pending: number;
  oldest_days_ago: number | null;
  top_backlog_voice: string | null;
} {
  const entries = Object.entries(allInboxes);
  let totalPending = 0;
  let voicesWithPending = 0;
  let oldestDays: number | null = null;
  let topVoice: string | null = null;
  let topCount = 0;

  for (const [voice, items] of entries) {
    totalPending += items.length;
    if (items.length > 0) voicesWithPending++;
    if (items.length > topCount) {
      topVoice = voice;
      topCount = items.length;
    }
    const age = items[0] ? chordDaysAgo(items[0].chord_id) : null;
    if (age !== null && (oldestDays === null || age > oldestDays)) {
      oldestDays = age;
    }
  }

  return {
    voices: entries.length,
    voices_with_pending: voicesWithPending,
    total_pending: totalPending,
    oldest_days_ago: oldestDays,
    top_backlog_voice: topVoice && topCount > 0
      ? `${topVoice}×${topCount}`
      : null,
  };
}

function pendingVoiceSummaries(
  allInboxes: Record<string, InboxItem[]>,
): Array<{
  voice: string;
  count: number;
  oldest: string | null;
  oldest_path: string | null;
  oldest_days_ago: number | null;
  top_sender: string | null;
}> {
  return Object.entries(allInboxes)
    .map(([voice, items]) => ({
      voice,
      count: items.length,
      oldest: items[0]?.chord_id ?? null,
      oldest_path: items[0]?.chord_path ?? null,
      oldest_days_ago: items[0] ? chordDaysAgo(items[0].chord_id) : null,
      top_sender: topSenderOf(items),
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const ageA = a.oldest_days_ago ?? -1;
      const ageB = b.oldest_days_ago ?? -1;
      if (ageB !== ageA) return ageB - ageA;
      return a.voice.localeCompare(b.voice);
    });
}

function chooseNextAction(
  allInboxes: Record<string, InboxItem[]>,
): InboxNextAction | null {
  const pending = pendingVoiceSummaries(allInboxes);
  const top = pending[0];
  if (!top?.oldest_path) return null;
  const item = allInboxes[top.voice]?.[0];
  if (!item) return null;
  return {
    voice: top.voice,
    chord_id: item.chord_id,
    chord_path: item.chord_path,
    speaker: item.speaker,
    topic: item.topic,
    mode: item.mode,
    oldest_days_ago: top.oldest_days_ago,
    suggested_command: `./t inbox ${top.voice} --json`,
    response_hint:
      `Write a ${top.voice} chord whose frontmatter includes hears: [${item.chord_path}].`,
  };
}

function renderTextSummary(allInboxes: Record<string, InboxItem[]>): string {
  const nextAction = chooseNextAction(allInboxes);
  const lines: string[] = [
    `# inbox @ 2/D — chords addressed to each voice, unresponded`,
    `# ──────────────────────────────────────────────────────────────────────`,
    `# voice          pending  age_days  top_sender   oldest_addressed_chord`,
    `# ──────────────────────────────────────────────────────────────────────`,
  ];
  const voices = Object.keys(allInboxes).sort();
  for (const v of voices) {
    const items = allInboxes[v];
    const oldest = items.length > 0 ? items[0].chord_id : "—";
    const ageDays = items.length > 0 ? chordDaysAgo(items[0].chord_id) : null;
    const ageStr = ageDays === null ? "  — " : String(ageDays).padStart(4);
    const topSender = (topSenderOf(items) ?? "—").padEnd(10);
    const oldestShort = oldest.length > 36
      ? oldest.slice(0, 33) + "..."
      : oldest;
    lines.push(
      `# ${v.padEnd(14)} ${
        String(items.length).padStart(4)
      }     ${ageStr}    ${topSender}   ${oldestShort}`,
    );
  }
  lines.push(
    `# ──────────────────────────────────────────────────────────────────────`,
  );
  lines.push(
    `# Total voices: ${voices.length}.  Use 't inbox <voice>' for detail.`,
  );
  if (nextAction) {
    lines.push(
      `# Next: ${nextAction.voice} should hear ${nextAction.chord_path}`,
    );
    lines.push(`#       ${nextAction.suggested_command}`);
  }
  return lines.join("\n");
}

function renderTextDetail(voice: string, items: InboxItem[]): string {
  const lines: string[] = [
    `# inbox @ 2/D — ${voice}`,
    `# ─────────────────────────────────────────────────────────────────────`,
  ];
  if (items.length === 0) {
    lines.push(
      `# (nothing pending — ${voice} has responded to every chord they were addressed in)`,
    );
    return lines.join("\n");
  }
  lines.push(`# ${items.length} pending  (oldest first)`);
  lines.push(
    `# ─────────────────────────────────────────────────────────────────────`,
  );
  for (const item of items) {
    const energy = item.energy !== null ? item.energy.toFixed(2) : " —";
    const mode = (item.mode ?? "?").padEnd(12);
    const speaker = (item.speaker ?? "?").padEnd(8);
    lines.push(`# ${item.chord_id}`);
    lines.push(`#   from ${speaker}  mode=${mode}  energy=${energy}`);
    if (item.topic) lines.push(`#   topic: ${item.topic}`);
    lines.push(`#   ${item.chord_path}`);
    lines.push("");
  }
  return lines.join("\n");
}

function renderTextNext(action: InboxNextAction | null): string {
  if (!action) return "# inbox @ 2/D — no pending next action";
  return [
    `# inbox @ 2/D — next action`,
    `# voice: ${action.voice}`,
    `# chord: ${action.chord_path}`,
    `# from: ${action.speaker}`,
    action.topic ? `# topic: ${action.topic}` : null,
    action.mode ? `# mode: ${action.mode}` : null,
    `# age_days: ${action.oldest_days_ago ?? "unknown"}`,
    `# command: ${action.suggested_command}`,
    `# hint: ${action.response_hint}`,
  ].filter((line): line is string => line !== null).join("\n");
}

function numericArg(args: string[], name: string, fallback: number): number {
  const i = args.indexOf(name);
  if (i === -1 || i + 1 >= args.length) return fallback;
  const n = Number(args[i + 1]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

async function compostChordFile(path: string) {
  const text = await Deno.readTextFile(path);
  if (!text.startsWith("---\n")) return;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return;
  const fmText = text.slice(4, end);
  const bodyText = text.slice(end);

  const lines = fmText.split("\n");
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith("status:")) {
      lines[i] = lines[i].replace(/status:\s*.*$/, "status: compost");
      replaced = true;
      break;
    }
  }
  if (!replaced) {
    lines.push("status: compost");
  }
  const newText = "---\n" + lines.join("\n") + bodyText;
  await Deno.writeTextFile(path, newText);
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = Deno.args;
  const jsonMode = args.includes("--json");
  const nextMode = args.includes("--next");
  const compostStale = args.includes("--compost-stale");
  const voiceArg = args.find((a) =>
    !a.startsWith("--") && a !== "compost-stale"
  );

  const chords = await loadAllChords();

  if (compostStale) {
    const apply = args.includes("--apply");
    const minAgeDays = numericArg(args, "--min-age-days", 14);
    const nowMs = Date.now();

    const voices = listAllVoices(chords);
    const allInboxes: Record<string, InboxItem[]> = {};
    for (const v of voices) {
      allInboxes[v] = computeInbox(v, chords);
    }

    const staleCandidates = new Map<
      string,
      { chord_id: string; path: string; age_days: number }
    >();
    for (const items of Object.values(allInboxes)) {
      for (const item of items) {
        const age = chordDaysAgo(item.chord_id, nowMs);
        if (age !== null && age >= minAgeDays) {
          staleCandidates.set(item.chord_id, {
            chord_id: item.chord_id,
            path: item.chord_path,
            age_days: age,
          });
        }
      }
    }

    const candidates = [...staleCandidates.values()].sort(
      (a, b) => b.age_days - a.age_days || a.chord_id.localeCompare(b.chord_id),
    );

    const applied: string[] = [];
    if (apply) {
      for (const candidate of candidates) {
        await compostChordFile(join(ROOT, candidate.path));
        applied.push(candidate.path);
      }
    }

    const payload = {
      type: "inbox_compost_stale",
      position: "2/D",
      action: "compost_stale",
      dry_run: !apply,
      min_age_days: minAgeDays,
      summary: {
        candidates: candidates.length,
        applied: applied.length,
      },
      candidates,
      applied,
    };

    if (jsonMode) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(`# inbox @ 2/D — compost stale chords (dry_run: ${!apply})`);
      console.log(`# ${"─".repeat(70)}`);
      if (candidates.length === 0) {
        console.log(`# no stale chords found (min-age: ${minAgeDays} days)`);
      } else {
        for (const c of candidates) {
          const action = apply ? "COMPOSTED" : "WOULD COMPOST";
          console.log(
            `#   • [${action}] ${c.chord_id} (${c.age_days}d ago) -> ${c.path}`,
          );
        }
        if (!apply) {
          console.log(
            `# Run with --apply to write status: compost to frontmatter of these chords.`,
          );
        }
      }
    }
    return;
  }

  if (voiceArg) {
    const voice = normSpeaker(voiceArg);
    const items = computeInbox(voice, chords);
    if (jsonMode) {
      console.log(JSON.stringify(
        {
          type: "inbox",
          schema: "trinity.inbox.v0.1",
          action: "inbox",
          position: "2/D",
          voice,
          oldest_days_ago: items[0] ? chordDaysAgo(items[0].chord_id) : null,
          top_sender: topSenderOf(items),
          count: items.length,
          items,
          note:
            "Chords addressed to voice via addressed_to[] field that voice has not yet listed in hears[] of any of their own chord.",
          synonyms: ["inbox", "pending", "backlog", "очікує", "скринька"],
        },
        null,
        2,
      ));
    } else {
      console.log(renderTextDetail(voice, items));
    }
    return;
  }

  // No voice arg: summary across all known voices.
  const voices = listAllVoices(chords);
  const allInboxes: Record<string, InboxItem[]> = {};
  for (const v of voices) {
    allInboxes[v] = computeInbox(v, chords);
  }
  const next_action = chooseNextAction(allInboxes);
  if (nextMode) {
    if (jsonMode) {
      console.log(JSON.stringify(
        {
          type: "inbox_next",
          schema: "trinity.inbox.v0.1",
          action: "next",
          position: "2/D",
          next_action,
        },
        null,
        2,
      ));
    } else {
      console.log(renderTextNext(next_action));
    }
    return;
  }
  if (jsonMode) {
    const summary = inboxSummary(allInboxes);
    const pending_voices = pendingVoiceSummaries(allInboxes);
    console.log(JSON.stringify(
      {
        type: "inbox",
        schema: "trinity.inbox.v0.1",
        action: "inbox",
        position: "2/D",
        mode: "summary",
        summary,
        pending_voices,
        next_action,
        voices: Object.fromEntries(
          Object.entries(allInboxes).map((
            [v, items],
          ) => [v, {
            voice: v,
            count: items.length,
            oldest: items[0]?.chord_id ?? null,
            oldest_path: items[0]?.chord_path ?? null,
            oldest_days_ago: items[0] ? chordDaysAgo(items[0].chord_id) : null,
            top_sender: topSenderOf(items),
          }]),
        ),
        note:
          "Per-voice unresponded-to count. Use 't inbox <voice>' for detail.",
        synonyms: ["inbox", "pending", "backlog", "очікує", "скринька"],
      },
      null,
      2,
    ));
  } else {
    console.log(renderTextSummary(allInboxes));
  }
}

if (import.meta.main) {
  await main();
}
