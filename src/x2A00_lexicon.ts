#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
// src/x2A00_lexicon.ts — chord-form effects dictionary
// position: 2/A → mirror(2) × apex(A) = highest reflection of substrate self
// hex_dipole: "26 26 6C 26 26 26 26 26"
//   mirror_apex+0.85 (PRIMARY: reflects substrate chord-form usage)
//   void_infinity+0.30 (statistical accumulation has cache flavor)
//   bucket 2/A: primary axis mirror (2), bucket 2 ← MATCH
// lifecycle_phase: 0
// placement_policy: axis
// intent: accumulate empirical statistics over chord-form patterns to
//         give cognition:recommend evidence-based suggestions instead of
//         ungrounded guess
// maturity: active
// horizon: cross-axis feed into x52 cognition:recommend; per-voice
//          breakdown when chord history >1000 makes voice-specific
//          patterns statistically meaningful
// skill_tag: lexicon
// skill_safe: yes
//
// lexicon — empirical chord-form dictionary
//
// Reads all chords in jazz/chords/, aggregates statistics per
// (chord.primary, mode-normalized) pattern. Skips patterns with <2
// occurrences (weak signal). Outputs both human table and JSON sidecar
// for cross-axis consumption by cognition:recommend.
//
// Imported from kairos-consciousness Lexicon pattern (per
// x7500_950920 re-survey receipt — Tier 1 import). Adapted for chord
// schema: kairos tracked stability/entropy/harmony; trinity tracks
// occurrence/voices/falsifier-rate/closure-rate/downstream-refs.
//
// Subcommands:
//   t lexicon           # human table
//   t lexicon --json    # machine-readable
//   t lexicon --stable  # deterministic (no generated_at)
//
// Glossary words: lexicon, dictionary, словник, accumulated-effects

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const TRINITY_ROOT = dirname(HERE);
const CHORDS_DIR = join(TRINITY_ROOT, "jazz", "chords");
const OUT = HERE;

// Chord filename forms — reusing patterns established in x8D00/x8A00/x8E00.
const NEW_FORM = /^x([0-9A-Fa-f]{4})_(\d+)_([a-z0-9-]+)_(.+)\.md$/;
const OLD_FORM = /^(\d{4}-\d{2}-\d{2}T\d{6}Z)-([a-z]+)-(.+)\.md$/;
const PROTO_FORM =
  /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})Z?-([a-z]+)-(.+)\.md$/;

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;
const PRIMARY_RE = /(?:^|\n)\s*primary:\s*["']?([^"'\n]+)["']?/;
const MODE_RE = /^mode:\s*([^\n]+)/m;
const CLOSES_HASH_RE = /^closes_hash:\s*["']?([^"'\n]+)["']?/m;
const CLOSES_BLOCK_RE = /^closes:\s*\n((?:[ \t]+.+\n?)*)/m;
const FALSIFIER_LINE_RE = /^falsifiers?:/m;

interface Chord {
  filename: string;
  voice: string;
  primary: string | null;
  mode_norm: string;
  has_falsifier: boolean;
  closes_path_hint: string | null;
  body: string;
  sort_key: number;
}

function normalizeMode(raw: string): string {
  const m = raw.trim().replace(/['"]/g, "").toLowerCase();
  // Strip "_..." suffixes (e.g. PROPOSE_EXPERIMENT → propose)
  const base = m.split(/[_\s]/)[0];
  // Coalesce synonyms
  if (base === "propose") return "proposal";
  return base;
}

function parsePrimary(fmText: string): string | null {
  const m = PRIMARY_RE.exec(fmText);
  if (m) return m[1].trim().replace(/['"]/g, "");
  return null;
}

function parseClosesPathHint(fmText: string): string | null {
  const blockM = CLOSES_BLOCK_RE.exec(fmText);
  if (!blockM) return null;
  const m = blockM[1].match(/path_hint:\s*["']?([^"'\n]+)["']?/);
  return m ? m[1].trim() : null;
}

function parseVoice(fmText: string, filename: string): string {
  // Try multiple field names: voice, speaker, actor, author_identity
  for (const key of ["voice", "speaker", "actor", "author_identity"]) {
    const m = new RegExp(`^${key}:\\s*([^\\n]+)`, "m").exec(fmText);
    if (m) {
      const v = m[1].trim().replace(/['"]/g, "").toLowerCase();
      return v.split("-")[0]; // claude-opus-4-7 → claude
    }
  }
  // Fall back to filename inference
  const newM = NEW_FORM.exec(filename);
  if (newM) return newM[3].toLowerCase();
  const oldM = OLD_FORM.exec(filename);
  if (oldM) return oldM[2].toLowerCase();
  const protoM = PROTO_FORM.exec(filename);
  if (protoM) return protoM[7].toLowerCase();
  return "unknown";
}

function epochFromCompactUtc(
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
  second: string,
): number {
  return Math.floor(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ) / 1000,
  );
}

function blockHeight(filename: string): number {
  const n = NEW_FORM.exec(filename);
  if (n) return parseInt(n[2], 10);
  const o = OLD_FORM.exec(filename);
  if (o) {
    const compact = o[1].match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    );
    if (!compact) return 0;
    const [, y, mo, d, h, mi, s] = compact;
    const epoch = epochFromCompactUtc(y, mo, d, h, mi, s);
    return 950000 + Math.floor((epoch - 1779148800) / 600);
  }
  const p = PROTO_FORM.exec(filename);
  if (p) {
    const [, y, mo, d, h, mi, s] = p;
    const epoch = epochFromCompactUtc(y, mo, d, h, mi, s);
    return 950000 + Math.floor((epoch - 1779148800) / 600);
  }
  return 0;
}

async function loadChord(filename: string): Promise<Chord | null> {
  try {
    const text = await Deno.readTextFile(join(CHORDS_DIR, filename));
    const fm = FRONTMATTER_RE.exec(text);
    if (!fm) return null;
    const fmText = fm[1];
    const modeRaw = MODE_RE.exec(fmText)?.[1] ?? "";
    if (!modeRaw) return null; // chord without mode is non-tracking
    return {
      filename,
      voice: parseVoice(fmText, filename),
      primary: parsePrimary(fmText),
      mode_norm: normalizeMode(modeRaw),
      has_falsifier: FALSIFIER_LINE_RE.test(fmText),
      closes_path_hint: parseClosesPathHint(fmText),
      body: text,
      sort_key: blockHeight(filename),
    };
  } catch {
    return null;
  }
}

async function loadAllChords(): Promise<Chord[]> {
  const out: Chord[] = [];
  for await (const entry of Deno.readDir(CHORDS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const c = await loadChord(entry.name);
    if (c) out.push(c);
  }
  return out;
}

interface LexiconEntry {
  pattern: string; // "<primary>+mode:<mode>"
  primary: string;
  mode: string;
  occurrences: number;
  voices: string[];
  falsifier_rate: number; // 0..1
  closure_rate: number | null; // null when N/A (e.g., already a receipt)
  downstream_ref_avg: number; // avg later-chord refs to chords in this pattern
  first_seen_block: number;
  last_seen_block: number;
}

function aggregate(chords: Chord[]): LexiconEntry[] {
  // Build downstream-ref index: filename → count of later chords mentioning it
  const downstreamRefs = new Map<string, number>();
  for (const c of chords) downstreamRefs.set(c.filename, 0);
  for (const c of chords) {
    // Find other chord filenames mentioned in this one's body
    for (const other of chords) {
      if (other.filename === c.filename) continue;
      if (other.sort_key >= c.sort_key) continue; // only count forward-in-time refs
      if (c.body.includes(other.filename)) {
        downstreamRefs.set(
          other.filename,
          downstreamRefs.get(other.filename)! + 1,
        );
      }
    }
  }

  // Closure detection: a chord is "closed" if any LATER chord's closes.path_hint
  // matches its filename, or its filename appears in any later chord's body
  // alongside a "receipt"-class mode marker.
  const closedBy = new Map<string, Chord[]>();
  for (const c of chords) closedBy.set(c.filename, []);
  for (const c of chords) {
    if (c.mode_norm === "receipt" || c.mode_norm === "decision") {
      // path_hint is strongest closure signal
      if (c.closes_path_hint) {
        const target = c.closes_path_hint.replace(/^jazz\/chords\//, "").trim();
        if (closedBy.has(target)) {
          closedBy.get(target)!.push(c);
        }
      }
    }
  }

  // Group chords by (primary, mode) pattern
  const groups = new Map<string, Chord[]>();
  for (const c of chords) {
    if (!c.primary) continue; // patterns without primary are unaggregatable
    const key = `${c.primary}+${c.mode_norm}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  const entries: LexiconEntry[] = [];
  const closureRelevant = new Set([
    "proposal",
    "critique",
    "exploration",
    "doctrine",
    "strategic",
    "survey",
    "reflection",
    "riff",
  ]);

  for (const [key, members] of groups) {
    if (members.length < 2) continue; // skip singleton patterns
    const voices = [...new Set(members.map((m) => m.voice))].sort();
    const falsifierCount = members.filter((m) => m.has_falsifier).length;
    const downstreamSum = members.reduce(
      (sum, m) => sum + (downstreamRefs.get(m.filename) ?? 0),
      0,
    );
    const isClosurePendable = closureRelevant.has(members[0].mode_norm);
    const closedCount = members.filter(
      (m) => (closedBy.get(m.filename) ?? []).length > 0,
    ).length;
    const blocks = members.map((m) => m.sort_key).filter((b) => b > 0);
    entries.push({
      pattern: key,
      primary: members[0].primary!,
      mode: members[0].mode_norm,
      occurrences: members.length,
      voices,
      falsifier_rate: falsifierCount / members.length,
      closure_rate: isClosurePendable ? closedCount / members.length : null,
      downstream_ref_avg: downstreamSum / members.length,
      first_seen_block: blocks.length ? Math.min(...blocks) : 0,
      last_seen_block: blocks.length ? Math.max(...blocks) : 0,
    });
  }

  // Sort by occurrences desc, then by downstream_ref_avg desc
  entries.sort((a, b) =>
    b.occurrences - a.occurrences ||
    b.downstream_ref_avg - a.downstream_ref_avg
  );
  return entries;
}

// Substrate grammar — bigram transitions between consecutive chord-forms.
// Reveals "after pattern A often comes pattern B" — the state-machine
// hidden in chord history. Ordered by sort_key; only counts pairs where
// both ends have known patterns.
interface BigramEntry {
  from_pattern: string;
  to_pattern: string;
  occurrences: number;
  example_pair: [string, string]; // filenames
}

function bigrams(chords: Chord[]): BigramEntry[] {
  const sorted = chords
    .filter((c) => c.primary)
    .slice()
    .sort((a, b) =>
      a.sort_key - b.sort_key || a.filename.localeCompare(b.filename)
    );
  const counts = new Map<string, BigramEntry>();
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    const from = `${a.primary}+${a.mode_norm}`;
    const to = `${b.primary}+${b.mode_norm}`;
    const key = `${from} → ${to}`;
    const existing = counts.get(key);
    if (existing) {
      existing.occurrences++;
    } else {
      counts.set(key, {
        from_pattern: from,
        to_pattern: to,
        occurrences: 1,
        example_pair: [a.filename, b.filename],
      });
    }
  }
  return [...counts.values()]
    .filter((e) => e.occurrences >= 2)
    .sort((a, b) => b.occurrences - a.occurrences);
}

interface Receipt {
  type: "lexicon";
  position: "2/A";
  action: "accumulate";
  note: string;
  generated_at: string | null;
  summary: {
    total_chords: number;
    chords_with_primary: number;
    unique_patterns: number;
    surfaced_patterns: number; // those with occurrences >= 2
    surfaced_bigrams: number;
  };
  entries: LexiconEntry[];
  bigrams: BigramEntry[];
  topology: string;
  synonyms: string[];
}

function buildReceipt(
  chords: Chord[],
  entries: LexiconEntry[],
  bigramEntries: BigramEntry[],
  stable: boolean,
): Receipt {
  return {
    type: "lexicon",
    position: "2/A",
    action: "accumulate",
    note: "mirror(2) × apex(A) — empirical statistics over chord-form patterns",
    generated_at: stable ? null : new Date().toISOString(),
    summary: {
      total_chords: chords.length,
      chords_with_primary: chords.filter((c) => c.primary).length,
      unique_patterns: new Set(
        chords.filter((c) => c.primary).map((c) =>
          `${c.primary}+${c.mode_norm}`
        ),
      ).size,
      surfaced_patterns: entries.length,
      surfaced_bigrams: bigramEntries.length,
    },
    entries,
    bigrams: bigramEntries,
    topology:
      "reads jazz/chords/ → groups by (chord.primary, mode-normalized) → emits surfaced patterns + bigram transitions (occurrences ≥ 2)",
    synonyms: ["lexicon", "dictionary", "словник", "accumulated-effects"],
  };
}

function renderHuman(receipt: Receipt): string {
  const lines: string[] = [];
  lines.push("# lexicon @ 2/A — chord-form effects dictionary");
  lines.push("# " + "─".repeat(78));
  const s = receipt.summary;
  lines.push(
    `# ${s.total_chords} chords scanned (${s.chords_with_primary} with chord.primary)`,
  );
  lines.push(
    `# ${s.surfaced_patterns} surfaced patterns (occurrences ≥ 2) of ${s.unique_patterns} unique`,
  );
  lines.push("# ");
  lines.push(
    "# " + "pattern".padEnd(38) + "n".padStart(4) +
      "  voices  fals%  clos%  dref",
  );
  lines.push("# " + "─".repeat(78));
  for (const e of receipt.entries.slice(0, 25)) {
    const falsPct = (e.falsifier_rate * 100).toFixed(0).padStart(3);
    const closPct = e.closure_rate === null
      ? "  - "
      : (e.closure_rate * 100).toFixed(0).padStart(3) + " ";
    const dref = e.downstream_ref_avg.toFixed(1).padStart(4);
    const voices = e.voices.length.toString().padStart(2);
    lines.push(
      `# ${e.pattern.padEnd(38)} ${
        e.occurrences.toString().padStart(3)
      }  ${voices}      ${falsPct}%  ${closPct}%  ${dref}`,
    );
  }
  if (receipt.entries.length > 25) {
    lines.push(
      `# ... and ${receipt.entries.length - 25} more (full table via --json)`,
    );
  }
  lines.push("# " + "─".repeat(78));
  lines.push(
    "# legend: n=occurrences  voices=distinct authors  fals%=falsifier-present rate",
  );
  lines.push(
    "#         clos%=closure rate (- if mode is not closure-pendable)",
  );
  lines.push("#         dref=avg downstream references (proxy for influence)");

  // Substrate grammar — bigram transitions.
  if (receipt.bigrams.length > 0) {
    lines.push("");
    lines.push("# substrate grammar — most-common chord-form transitions");
    lines.push("# " + "─".repeat(78));
    lines.push("# " + "from → to".padEnd(70) + "  n");
    lines.push("# " + "─".repeat(78));
    for (const b of receipt.bigrams.slice(0, 15)) {
      const arrow = `${b.from_pattern}  →  ${b.to_pattern}`;
      lines.push(
        `# ${arrow.padEnd(68)}  ${b.occurrences.toString().padStart(3)}`,
      );
    }
    if (receipt.bigrams.length > 15) {
      lines.push(
        `# ... and ${
          receipt.bigrams.length - 15
        } more transitions (full via --json)`,
      );
    }
    lines.push("# " + "─".repeat(78));
  }

  return lines.join("\n");
}

interface Args {
  json: boolean;
  stable: boolean;
}
function parseArgs(argv: string[]): Args {
  return {
    json: argv.includes("--json"),
    stable: argv.includes("--stable"),
  };
}

if (import.meta.main) {
  const args = parseArgs(Deno.args);
  const chords = await loadAllChords();
  const entries = aggregate(chords);
  const bigramEntries = bigrams(chords);
  const receipt = buildReceipt(chords, entries, bigramEntries, args.stable);

  if (args.json) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    console.log(renderHuman(receipt));
  }

  // Always write cached sidecar so cross-axis consumers can read without
  // re-running aggregation.
  const sidecarPath = join(OUT, "x2A88_lexicon.myc.json");
  await Deno.writeTextFile(
    sidecarPath,
    JSON.stringify(receipt, null, 2) + "\n",
  );
}
