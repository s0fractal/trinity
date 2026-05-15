#!/usr/bin/env -S deno run --allow-read
// 0x2/0.ts — voices / synthetic voice profiles from chord history
// position: 2/0 → mirror(2) × void(0) = reflection surface / identity pool
// hex_dipole: "33 26 6C 26 26 26 26 26"
//   axis 0 void_infinity +0.30 (secondary: reflection surface from emptiness)
//   axis 2 mirror_apex +0.85 (PRIMARY: reflects who speaks into substrate)
//   bucket 2/0: primary axis mirror (2), bucket 2 ← MATCH
//               secondary '0' → axis 0 void, dipole +0.30 on axis 0 ← weak
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
//
// voices — surface synthetic voice profiles from chord history
//
// Reads jazz/chords/*.md, parses frontmatter, aggregates per voice.
// Comfort field is synthetic (historical average) unless a voice record
// exists in glossary with self-declared slot 11.
//
// Usage:
//   t voices              # text table
//   t voices --json       # machine-readable
//   t voices claude       # detail one voice
//   t voices --json claude
//
// Glossary words: voices, voice, голоси, голос

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const CHORDS_DIR = join(ROOT, "jazz", "chords");

// ── types ──────────────────────────────────────────────────────────────────

interface ChordFm {
  id?: string;
  speaker?: string;
  created?: string;
  mode?: string;
  oct?: string;
  topic?: string;
  claim_kind?: string;
  energy?: number;
  chord?: string[] | { primary?: string; secondary?: string[] };
  dipole?: string | number[];
  [key: string]: unknown;
}

interface VoiceProfile {
  identity: string;
  chords: number;
  avg_energy: number;
  top_primary_oct: string;
  top_topic: string;
  standing: "active" | "observing" | "paused";
  comfort_field_synthetic: number[];
}

// ── yaml frontmatter parser (minimal, no deps) ─────────────────────────────

function parseYamlFrontmatter(text: string): { fm: Record<string, unknown>; body: string } | null {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  const yaml = text.slice(4, end);
  const body = text.slice(end + 4).trimStart();
  const fm: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let inList = false;
  const listItems: unknown[] = [];

  for (const line of yaml.split("\n")) {
    const trimmed = line.trimStart();
    if (trimmed.length === 0) continue;

    const listMatch = trimmed.match(/^-\s+(.*)$/);
    if (listMatch) {
      if (!inList && currentKey) {
        inList = true;
      }
      if (inList) {
        listItems.push(coerce(listMatch[1].trim()));
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
        fm[currentKey] = coerce(val);
      }
    }
  }

  if (inList && currentKey) {
    fm[currentKey] = listItems.slice();
  }

  return { fm, body };
}

function coerce(v: string): unknown {
  if (v === "true" || v === "True") return true;
  if (v === "false" || v === "False") return false;
  if (v === "null" || v === "~") return null;
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  if (/^\d+\.\d+$/.test(v)) return parseFloat(v);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  // JSON-in-YAML: chord: ["oct:3.2", "oct:6.4"]
  if (v.startsWith("[") && v.endsWith("]")) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
  }
  // JSON object: chord: {"primary": "oct:3.2", ...}
  if (v.startsWith("{") && v.endsWith("}")) {
    try {
      const parsed = JSON.parse(v);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch { /* fall through */ }
  }
  return v;
}

// ── voice profile builders (from falsifier probe, cleaned) ─────────────────

function normSpeaker(s: string): string {
  const lower = s.trim().toLowerCase();
  if (lower.startsWith("claude")) return "claude";
  if (lower.startsWith("codex")) return "codex";
  if (lower.startsWith("gemini")) return "gemini";
  if (lower.startsWith("kimi")) return "kimi";
  if (lower.startsWith("antigravity")) return "antigravity";
  return lower;
}

function parseDipole(d: unknown): number[] {
  if (typeof d === "string") {
    return d.split(/\s+/).map((h) => parseInt(h, 16)).filter((n) => !isNaN(n));
  }
  if (Array.isArray(d)) {
    return d.map((v) => (typeof v === "number" ? v : 0)).filter((n) => !isNaN(n));
  }
  return [];
}

async function loadChords(): Promise<{ fm: ChordFm; body: string }[]> {
  const entries: { fm: ChordFm; body: string }[] = [];
  for await (const entry of Deno.readDir(CHORDS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const text = await Deno.readTextFile(join(CHORDS_DIR, entry.name));
    const parsed = parseYamlFrontmatter(text);
    if (!parsed) continue;
    const fm = parsed.fm as ChordFm;
    if (!fm.speaker || !fm.id) continue;
    fm.speaker = normSpeaker(fm.speaker);
    entries.push({ fm, body: parsed.body });
  }
  // chronological by created timestamp
  entries.sort((a, b) => {
    const ta = a.fm.created ? new Date(a.fm.created).getTime() : 0;
    const tb = b.fm.created ? new Date(b.fm.created).getTime() : 0;
    return ta - tb;
  });
  return entries;
}

function buildVoiceProfiles(chords: { fm: ChordFm; body: string }[]): VoiceProfile[] {
  const byVoice = new Map<string, { fm: ChordFm; body: string }[]>();
  for (const c of chords) {
    const v = c.fm.speaker!;
    if (!byVoice.has(v)) byVoice.set(v, []);
    byVoice.get(v)!.push(c);
  }

  const profiles: VoiceProfile[] = [];
  for (const [identity, list] of byVoice) {
    const energies = list.map((c) => c.fm.energy ?? 0.5).filter((e) => typeof e === "number");
    const avgEnergy = energies.length > 0
      ? energies.reduce((a, b) => a + b, 0) / energies.length
      : 0.5;

    const octCounts = new Map<string, number>();
    for (const c of list) {
      const octs: string[] = [];
      if (c.fm.oct) {
        octs.push(String(c.fm.oct));
      } else if (c.fm.primary) {
        octs.push(String(c.fm.primary));
        if (Array.isArray(c.fm.secondary)) {
          octs.push(...c.fm.secondary.map(String));
        }
      } else if (Array.isArray(c.fm.chord)) {
        octs.push(...c.fm.chord.map(String));
      } else if (c.fm.chord && typeof c.fm.chord === "object") {
        const ch = c.fm.chord as { primary?: string; secondary?: string[] };
        if (ch.primary) octs.push(ch.primary);
        if (ch.secondary) octs.push(...ch.secondary);
      }
      const pri = octs[0] || "unknown";
      octCounts.set(pri, (octCounts.get(pri) || 0) + 1);
    }
    let topOct = "unknown";
    let topOctCount = 0;
    for (const [oct, count] of octCounts) {
      if (count > topOctCount) {
        topOctCount = count;
        topOct = oct;
      }
    }

    const topicCounts = new Map<string, number>();
    for (const c of list) {
      const topic = c.fm.topic || "unknown";
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    }
    let topTopic = "unknown";
    let topTopicCount = 0;
    for (const [topic, count] of topicCounts) {
      if (count > topTopicCount) {
        topTopicCount = count;
        topTopic = topic;
      }
    }

    const dipoles: number[][] = [];
    for (const c of list) {
      const d = parseDipole(c.fm.dipole);
      if (d.length === 8) dipoles.push(d);
    }
    const comfort = dipoles.length > 0
      ? dipoles.reduce((acc, d) => acc.map((v, i) => v + d[i]), new Array(8).fill(0))
          .map((v) => Math.round(v / dipoles.length))
      : new Array(8).fill(0x26);

    profiles.push({
      identity,
      chords: list.length,
      avg_energy: Math.round(avgEnergy * 100) / 100,
      top_primary_oct: topOct,
      top_topic: topTopic,
      standing: "active",
      comfort_field_synthetic: comfort,
    });
  }

  profiles.sort((a, b) => b.chords - a.chords);
  return profiles;
}

// ── output formatters ──────────────────────────────────────────────────────

function fmtHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

function renderTable(profiles: VoiceProfile[], detailIdentity?: string): string {
  const filtered = detailIdentity
    ? profiles.filter((p) => p.identity === detailIdentity)
    : profiles;

  if (filtered.length === 0) {
    return `# voices @ 2/0 — no voices found${detailIdentity ? ` matching "${detailIdentity}"` : ""}`;
  }

  const lines: string[] = [
    `# voices @ 2/0 — synthetic profiles from chord history`,
    `# ─────────────────────────────────────────────────────────────────────────`,
    `# voice      chords  standing   top oct               avg energy  comfort (synth)`,
    `# ─────────────────────────────────────────────────────────────────────────`,
  ];

  for (const p of filtered) {
    const idPad = p.identity.padEnd(10);
    const octPad = p.top_primary_oct.padEnd(21);
    lines.push(
      `# ${idPad}  ${String(p.chords).padStart(4)}  ${p.standing.padEnd(8)}  ${octPad}  ${p.avg_energy.toFixed(2).padStart(6)}      ${fmtHex(p.comfort_field_synthetic)}`,
    );
  }

  if (!detailIdentity) {
    lines.push(`# ─────────────────────────────────────────────────────────────────────────`);
    lines.push(`# Total: ${profiles.reduce((s, p) => s + p.chords, 0)} chords across ${profiles.length} voices`);
  }

  return lines.join("\n");
}

function renderJson(profiles: VoiceProfile[], detailIdentity?: string): string {
  const filtered = detailIdentity
    ? profiles.filter((p) => p.identity === detailIdentity)
    : profiles;

  const payload = {
    type: "voices_projection",
    schema: "trinity.voices.v0.1",
    generated_at: new Date().toISOString(),
    voices: filtered.map((p) => ({
      identity: p.identity,
      standing: p.standing,
      chords: p.chords,
      avg_energy: p.avg_energy,
      top_primary_oct: p.top_primary_oct,
      top_topic: p.top_topic,
      comfort_field_synthetic: fmtHex(p.comfort_field_synthetic),
    })),
  };

  return JSON.stringify(payload, null, 2);
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = Deno.args;
  const useJson = args.includes("--json");
  const identity = args.find((a) => !a.startsWith("-")) || undefined;

  const chords = await loadChords();

  const profiles = buildVoiceProfiles(chords);

  if (useJson) {
    console.log(renderJson(profiles, identity));
  } else {
    console.log(renderTable(profiles, identity));
  }
}

main();
