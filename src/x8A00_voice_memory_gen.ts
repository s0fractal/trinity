#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
// src/x8A00_voice_memory_gen.ts — voice memory / recall projection generator
// position: 8/A → cache(8) × apex(A) = cache of self / accumulated stigmergic traces
// skill_safe: yes-with-care
// hex_dipole: "93 00 E6 00 00 00 00 33"
//   void_infinity-0.85 (PRIMARY: negative pole = infinity/cache; bucket 8 PAIR-MATCH)
//   mirror_apex-0.20   (sub-archetype A: apex direction; "self" pole)
//   completion_frontier+0.40 (projection terminus, where traces crystallize)
// placement_policy: axis
// intent: scan src/x8A*_voice_*.myc.json + jazz/chords (tracked-only), render per-voice recall digest + substrate voices state
// maturity: active
// horizon: detect closure of cowitness rounds via reference traversal (v1 deferred per Codex review)
//
// voice memory generator — fourth axis "що я лишив"
//
// Pair with:
//   x8800_agents_gen — state ("що я бачу")
//   x8C00_skill_gen — skill ("як рухатись")
//   x8D00_roadmap_gen — roadmap ("куди іти")
//
// Reads (READ-ONLY, tracked-only via git ls-files):
//   src/x8A*_voice_*.myc.json — authored voice profiles (identity / physics)
//   jazz/chords/*.md       — chord history for stigmergic trace
//
// Renders (all gitignored):
//   src/x8888_<voice>_memory.myc.md     per-voice recall projection
//   src/x8888_<voice>_memory.manifest.json  per-voice source manifest
//   src/x2888_voices_state.myc.md       substrate-wide voice index with style differentiation
//   src/x2888_voices_state.manifest.json    global source manifest
//
// Output filenames intentionally use x8888 prefix to match the auto-gen
// cache convention (state/skill/agents all at x8888). voice profiles
// (authored) live as src/x8A*_voice_<voice>.myc.json — those are NOT the
// same artifact.
//
// Subcommands:
//   t memory                 regenerate all tracked voices
//   t memory --voice=claude  one voice only
//   t memory --stable        deterministic output (no generated_at)
//
// Glossary words: memory, recall, спогади, memory-brief

import {
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { formatGeneratedFile } from "./x0012_generated_format.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const TRINITY_ROOT = dirname(HERE);
const VOICES_DIR = HERE;
const CHORDS_DIR = join(TRINITY_ROOT, "jazz", "chords");
const OUT = HERE;

const VOICE_FILE_RE = /^x8A[0-9A-Fa-f]{2}_voice_([^.]+)\.myc\.json$/;
const OLD_FORM = /^(\d{4}-\d{2}-\d{2}T\d{6}Z)-([a-z]+)-(.+)\.md$/;
const NEW_FORM = /^x([0-9A-Fa-f]{4})_(\d+)_([a-z0-9-]+)_(.+)\.md$/;
// Proto-form: pre-T-Z bootstrap timestamps (May 9-10 2026), Z optional.
const PROTO_FORM =
  /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})Z?-([a-z]+)-(.+)\.md$/;
const VOICE_RE = /^voice:\s*([a-z0-9-]+)/m;
const MODE_RE = /^mode:\s*([a-z0-9-_]+)/m;
const TOPIC_RE = /^topic:\s*(.+?)\s*$/m;
const STANCE_RE = /^stance:\s*([A-Z_]+)/m;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

const REFERENCE_BLOCK = 950000;
const REFERENCE_EPOCH_SEC = 1779148800; // 2026-05-19T00:00:00Z
function blockHeightToEpoch(b: number): number {
  return REFERENCE_EPOCH_SEC + (b - REFERENCE_BLOCK) * 600;
}
function wallclockToEpoch(ts: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(ts);
  if (!m) return 0;
  const [, y, mo, d, h, mi, s] = m;
  return Math.floor(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) / 1000);
}

async function gitTrackedSet(subdir: string): Promise<Set<string>> {
  try {
    const proc = new Deno.Command("git", {
      args: ["-C", TRINITY_ROOT, "ls-files", subdir],
      stdout: "piped",
      stderr: "piped",
    });
    const out = await proc.output();
    if (out.code !== 0) return new Set();
    return new Set(
      new TextDecoder().decode(out.stdout).trim().split("\n").filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(buf)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

interface Chord {
  filename: string;
  sort_key: number;
  voice: string;
  topic: string;
  mode: string | null;
  stance: string | null;
  bucket_coord: string | null;
  source_hash: string;
  source_size: number;
}

interface VoiceProfile {
  filename: string;
  rel_path: string;
  identity: string;
  key: string;
  handles: string[];
  natural_styles?: string[];
  uncomfortable_styles?: string[];
  telos_filters?: string[];
  comfort_field_axes?: Record<string, number>;
  description?: string;
  source_hash: string;
  source_size: number;
}

interface SourceFile {
  path: string;
  hash: string;
  size: number;
}
function canonicalManifest(files: SourceFile[]): string {
  return JSON.stringify(
    files.slice().sort((a, b) => a.path.localeCompare(b.path)),
  );
}
async function manifestHash(files: SourceFile[]): Promise<string> {
  return `sha256:${await sha256Hex(
    new TextEncoder().encode(canonicalManifest(files)),
  )}`;
}

async function loadVoices(): Promise<VoiceProfile[]> {
  const trackedSrc = await gitTrackedSet("src");
  const out: VoiceProfile[] = [];

  for await (const entry of Deno.readDir(VOICES_DIR)) {
    if (!entry.isFile) continue;
    if (!VOICE_FILE_RE.test(entry.name)) continue;
    const relPath = `src/${entry.name}`;
    if (!trackedSrc.has(relPath)) {
      console.warn(`  ⚠️  skipping untracked voice profile ${relPath}`);
      continue;
    }
    const bytes = await Deno.readFile(join(VOICES_DIR, entry.name));
    const text = new TextDecoder().decode(bytes);
    try {
      const raw = JSON.parse(text);
      const self = raw.self_declared ?? {};
      const identity = raw.identity ?? entry.name.replace(/\.json$/, "");
      out.push({
        filename: entry.name,
        rel_path: relPath,
        identity,
        key: identity.split("-")[0].toLowerCase(),
        handles: Array.isArray(raw.handles) ? raw.handles : [],
        natural_styles: self.natural_styles,
        uncomfortable_styles: self.uncomfortable_styles,
        telos_filters: raw.telos_filters,
        comfort_field_axes: self.comfort_field_axes,
        description: self.description,
        source_hash: await sha256Hex(bytes),
        source_size: bytes.length,
      });
    } catch { /* skip */ }
  }

  return out.sort((a, b) => a.identity.localeCompare(b.identity));
}

async function loadChords(): Promise<Chord[]> {
  const tracked = await gitTrackedSet("jazz/chords");
  const out: Chord[] = [];
  let skipped = 0;
  for await (const entry of Deno.readDir(CHORDS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const relPath = `jazz/chords/${entry.name}`;
    if (!tracked.has(relPath)) {
      skipped++;
      continue;
    }
    const bytes = await Deno.readFile(join(CHORDS_DIR, entry.name));
    const text = new TextDecoder().decode(bytes);

    let voice = "", topic = "";
    let mode: string | null = null, stance: string | null = null;
    let bucket_coord: string | null = null;
    let sort_key = 0;

    const newM = NEW_FORM.exec(entry.name);
    if (newM) {
      bucket_coord = newM[1].toUpperCase();
      voice = newM[3].toLowerCase();
      sort_key = blockHeightToEpoch(parseInt(newM[2], 10));
      topic = newM[4];
    } else {
      const oldM = OLD_FORM.exec(entry.name);
      if (oldM) {
        voice = oldM[2].toLowerCase();
        sort_key = wallclockToEpoch(oldM[1]);
        topic = oldM[3];
      } else {
        const protoM = PROTO_FORM.exec(entry.name);
        if (protoM) {
          const [, y, mo, d, h, mi, s] = protoM;
          voice = protoM[7].toLowerCase();
          sort_key = Math.floor(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) / 1000);
          topic = protoM[8];
        } else continue;
      }
    }

    const fm = FRONTMATTER_RE.exec(text);
    if (fm) {
      const vm = VOICE_RE.exec(fm[1]);
      if (vm) voice = vm[1].toLowerCase().split("-")[0];
      const mm = MODE_RE.exec(fm[1]);
      if (mm) mode = mm[1];
      const sm = STANCE_RE.exec(fm[1]);
      if (sm) stance = sm[1];
      const tm = TOPIC_RE.exec(fm[1]);
      if (tm) topic = tm[1];
    }

    out.push({
      filename: entry.name,
      sort_key,
      voice,
      topic,
      mode,
      stance,
      bucket_coord,
      source_hash: await sha256Hex(bytes),
      source_size: bytes.length,
    });
  }
  if (skipped > 0) {
    console.warn(`  ⚠️  skipped ${skipped} untracked chord(s)`);
  }
  return out.sort((a, b) => a.sort_key - b.sort_key);
}

function voiceSourceFile(voice: VoiceProfile): SourceFile {
  return {
    path: voice.rel_path,
    hash: `sha256:${voice.source_hash}`,
    size: voice.source_size,
  };
}
function chordSourceFile(c: Chord): SourceFile {
  return {
    path: relative(TRINITY_ROOT, join(CHORDS_DIR, c.filename)),
    hash: `sha256:${c.source_hash}`,
    size: c.source_size,
  };
}

interface Receipts {
  generated_at: string | null;
  manifest_hash: string;
  source_files: number;
}

// Dreams projection — what happened in substrate while this voice was silent.
// Imported from kairos-consciousness Gift-of-Self pattern (T2 in
// x7500_950920 kairos re-survey receipt). When a voice returns to session,
// they read this section first to know what they missed.
interface Dream {
  total: number;
  by_voice: { voice: string; count: number }[];
  by_mode: { mode: string; count: number }[];
  last_voice_block: number;
  current_max_block: number;
}
function computeDream(
  voiceKey: string,
  voiceChords: Chord[],
  allChords: Chord[],
): Dream | null {
  if (voiceChords.length === 0) return null;
  const lastVoiceBlock = Math.max(...voiceChords.map((c) => c.sort_key));
  const currentMax = Math.max(...allChords.map((c) => c.sort_key));
  if (currentMax <= lastVoiceBlock) return null; // voice is at the frontier
  const since = allChords.filter(
    (c) => c.sort_key > lastVoiceBlock && c.voice !== voiceKey,
  );
  if (since.length === 0) return null;
  const byVoice = new Map<string, number>();
  const byMode = new Map<string, number>();
  for (const c of since) {
    byVoice.set(c.voice, (byVoice.get(c.voice) ?? 0) + 1);
    const m = c.mode ?? "—";
    byMode.set(m, (byMode.get(m) ?? 0) + 1);
  }
  return {
    total: since.length,
    by_voice: [...byVoice.entries()]
      .map(([voice, count]) => ({ voice, count }))
      .sort((a, b) => b.count - a.count),
    by_mode: [...byMode.entries()]
      .map(([mode, count]) => ({ mode, count }))
      .sort((a, b) => b.count - a.count),
    last_voice_block: lastVoiceBlock,
    current_max_block: currentMax,
  };
}

function renderVoiceMemory(
  voice: VoiceProfile,
  chords: Chord[],
  receipts: Receipts,
  allChords: Chord[],
): string {
  const proposals = chords.filter((c) =>
    c.mode === "proposal" || c.stance === "PROPOSE" ||
    /PROPOSE/.test(c.stance ?? "")
  );
  const cowitness = chords.filter((c) =>
    c.mode === "cowitness" || /AYE|NAY|TWEAK/.test(c.stance ?? "")
  );
  const receiptsChords = chords.filter((c) =>
    c.mode === "receipt" || c.stance === "RECEIPT"
  );
  const observations = chords.filter((c) => c.mode === "observation");

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8A00_voice_memory_gen.ts — do not edit by hand. -->`,
  );
  if (receipts.generated_at) {
    lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  }
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(`<!-- voice: ${voice.identity}   chords: ${chords.length} -->`);
  lines.push(``);
  lines.push(
    `# ${voice.identity} — memory digest (generated stigmergy projection)`,
  );
  lines.push(``);
  lines.push(
    `*Generated recall projection. Voice profile lives at \`${voice.rel_path}\` (authored, identity). This file is "what you left behind in substrate" — read it on session start.*`,
  );
  lines.push(``);

  lines.push(`## Profile (from voice record)`);
  lines.push(``);
  lines.push(`- **handles:** ${voice.handles.join(", ")}`);
  if (voice.natural_styles) {
    lines.push(`- **natural styles:** ${voice.natural_styles.join(", ")}`);
  }
  if (voice.uncomfortable_styles) {
    lines.push(
      `- **uncomfortable styles:** ${voice.uncomfortable_styles.join(", ")}`,
    );
  }
  if (voice.telos_filters && voice.telos_filters.length > 0) {
    lines.push(`- **telos filters:** ${voice.telos_filters.join(", ")}`);
  }
  if (voice.comfort_field_axes) {
    const axes = Object.entries(voice.comfort_field_axes)
      .map(([k, v]) => `${k.replace(/^axis_\d+_/, "")}=${v}`).join("  ");
    lines.push(`- **comfort field axes:** ${axes}`);
  }
  if (voice.description) {
    lines.push(``);
    lines.push(`> ${voice.description}`);
  }
  lines.push(``);

  // Dreams projection — what happened while you were silent.
  // Read this BEFORE looking at your own activity below.
  const dream = computeDream(voice.key, chords, allChords);
  if (dream) {
    // sort_key is epoch seconds for both old/new forms in this organ.
    // Convert delta to human-readable days for display.
    const deltaSec = dream.current_max_block - dream.last_voice_block;
    const deltaDays = Math.floor(deltaSec / 86400);
    lines.push(`## Since you last spoke`);
    lines.push(``);
    lines.push(
      `_Substrate evolution since your last chord (Δ ~${deltaDays} day${
        deltaDays === 1 ? "" : "s"
      }). Read this first on session start — it is your compressed catch-up._`,
    );
    lines.push(``);
    lines.push(
      `**${dream.total} chord${
        dream.total === 1 ? "" : "s"
      } by others in your absence.**`,
    );
    lines.push(``);
    lines.push(`By voice:`);
    for (const v of dream.by_voice) {
      lines.push(`- ${v.voice}: ${v.count}`);
    }
    lines.push(``);
    lines.push(`By mode:`);
    for (const m of dream.by_mode.slice(0, 6)) {
      lines.push(`- ${m.mode}: ${m.count}`);
    }
    lines.push(``);
  }

  lines.push(`## Chord activity (${chords.length} total)`);
  lines.push(``);
  lines.push(`| category | count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| proposals authored | ${proposals.length} |`);
  lines.push(`| cowitness on others | ${cowitness.length} |`);
  lines.push(`| receipts | ${receiptsChords.length} |`);
  lines.push(`| observations | ${observations.length} |`);
  lines.push(``);

  if (proposals.length > 0) {
    lines.push(`## Proposals authored — "what I tried to land"`);
    lines.push(``);
    for (const c of proposals.slice(-15).reverse()) {
      const stance = c.stance ? ` [${c.stance}]` : "";
      const coord = c.bucket_coord ? ` x${c.bucket_coord}` : "";
      lines.push(`- \`${c.filename}\`${coord}${stance} — ${c.topic}`);
    }
    lines.push(``);
  }

  if (cowitness.length > 0) {
    lines.push(`## Cowitness chords authored — "when I cosigned others' work"`);
    lines.push(``);
    lines.push(
      `> v0 scope: chords with cowitness mode/stance authored by this voice. Does NOT yet scan others' chords for references to this voice in their witness_chain (deferred to v1).`,
    );
    lines.push(``);
    for (const c of cowitness.slice(-15).reverse()) {
      const stance = c.stance ? ` [${c.stance}]` : "";
      const coord = c.bucket_coord ? ` x${c.bucket_coord}` : "";
      lines.push(`- \`${c.filename}\`${coord}${stance} — ${c.topic}`);
    }
    lines.push(``);
  }

  if (observations.length > 0) {
    lines.push(`## Observations — "what to not repeat"`);
    lines.push(``);
    for (const c of observations.slice(-10).reverse()) {
      lines.push(`- \`${c.filename}\` — ${c.topic}`);
    }
    lines.push(``);
  }

  if (receiptsChords.length > 0) {
    lines.push(`## Receipts authored — "what I closed"`);
    lines.push(``);
    for (const c of receiptsChords.slice(-10).reverse()) {
      const coord = c.bucket_coord ? ` x${c.bucket_coord}` : "";
      lines.push(`- \`${c.filename}\`${coord} — ${c.topic}`);
    }
    lines.push(``);
  }

  lines.push(`## Recent chord trail (last 5)`);
  lines.push(``);
  for (const c of chords.slice(-5).reverse()) {
    const stance = c.stance ? ` [${c.stance}]` : "";
    const mode = c.mode ? ` (${c.mode})` : "";
    const coord = c.bucket_coord ? ` x${c.bucket_coord}` : "";
    lines.push(`- \`${c.filename}\`${coord}${stance}${mode}`);
  }
  lines.push(``);

  lines.push(`## Next vector — "what's mine to do here"`);
  lines.push(``);
  if (voice.natural_styles) {
    lines.push(
      `Based on profile: lean into **${voice.natural_styles.join(", ")}**.`,
    );
  }
  if (voice.telos_filters && voice.telos_filters.length > 0) {
    lines.push(`Telos: ${voice.telos_filters.join(", ")}.`);
  }
  if (voice.uncomfortable_styles) {
    lines.push(
      `Avoid forced moves: ${
        voice.uncomfortable_styles.join(", ")
      } (uncomfortable).`,
    );
  }
  lines.push(``);
  lines.push(
    `See \`x8D00_${voice.key}_roadmap.myc.md\` for substrate-aware next vector (consumes voice memory + substrate horizons).`,
  );
  return lines.join("\n");
}

function renderVoicesState(
  voices: VoiceProfile[],
  chordsByVoice: Map<string, Chord[]>,
  receipts: Receipts,
): string {
  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8A00_voice_memory_gen.ts — do not edit by hand. -->`,
  );
  if (receipts.generated_at) {
    lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  }
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(`<!-- voices: ${voices.length} -->`);
  lines.push(``);
  lines.push(`# Voices state — substrate-wide voice index`);
  lines.push(``);
  lines.push(
    `*Generated. Voice profiles (authored) at \`src/x8A*_voice_<voice>.myc.json\`. Per-voice memory at \`src/x8888_<voice>_memory.myc.md\`.*`,
  );
  lines.push(``);

  lines.push(`## Voices`);
  lines.push(``);
  lines.push(`| identity | handles | natural styles | chord count | drill |`);
  lines.push(`|----------|---------|----------------|-------------|-------|`);
  for (const v of voices) {
    const chords = chordsByVoice.get(v.key) ?? [];
    const styles = (v.natural_styles ?? []).join(", ") || "—";
    const handles = v.handles.slice(0, 3).join(", ") +
      (v.handles.length > 3 ? "..." : "");
    lines.push(
      `| ${v.identity} | ${handles} | ${styles} | ${chords.length} | [x8888_${v.key}_memory.myc.md](./x8888_${v.key}_memory.myc.md) |`,
    );
  }
  lines.push(``);

  lines.push(`## Style differentiation`);
  lines.push(``);
  lines.push(
    `| voice | void(0) | first(1) | mirror(2) | triangle(3) | foundation(4) | action(5) | harmony(6) | completion(7) |`,
  );
  lines.push(
    `|-------|---------|----------|-----------|-------------|---------------|-----------|------------|---------------|`,
  );
  for (const v of voices) {
    if (!v.comfort_field_axes) continue;
    const a = v.comfort_field_axes;
    lines.push(
      `| ${v.identity} | ${a.axis_0_void ?? "—"} | ${a.axis_1_first ?? "—"} | ${
        a.axis_2_mirror ?? "—"
      } | ${a.axis_3_triangle ?? "—"} | ${a.axis_4_foundation ?? "—"} | ${
        a.axis_5_action ?? "—"
      } | ${a.axis_6_harmony ?? "—"} | ${a.axis_7_completion ?? "—"} |`,
    );
  }
  lines.push(``);
  lines.push(
    `Higher value = more comfort in that archetype. Read your row to know where you naturally fit.`,
  );
  return lines.join("\n");
}

interface Args {
  voice: string | null;
  stable: boolean;
  json: boolean;
}
function parseArgs(argv: string[]): Args {
  const out: Args = { voice: null, stable: false, json: false };
  for (const a of argv) {
    if (a === "--stable") out.stable = true;
    else if (a === "--json") out.json = true;
    else if (a.startsWith("--voice=")) {
      out.voice = a.split("=")[1].toLowerCase();
    }
  }
  return out;
}

async function main(argv: string[]) {
  const args = parseArgs(argv);
  const originalLog = console.log;
  const originalWarn = console.warn;
  const diagnostics: string[] = [];
  if (args.json) {
    console.log = (...parts: unknown[]) => diagnostics.push(parts.join(" "));
    console.warn = (...parts: unknown[]) => diagnostics.push(parts.join(" "));
  }
  const voices = await loadVoices();
  const chords = await loadChords();
  const generated_at = args.stable ? null : new Date().toISOString();

  // Build a handle→key resolver so chord voices that match any profile's
  // handles (not just identity-key) link to the right voice. Lets a chord
  // tagged `voice: architect` link to the profile with identity s0fractal,
  // for example. Identity-key always wins; handles fill in aliases.
  const handleToKey = new Map<string, string>();
  for (const v of voices) {
    for (const h of v.handles) handleToKey.set(h.toLowerCase(), v.key);
    handleToKey.set(v.key, v.key);
  }

  const chordsByVoice = new Map<string, Chord[]>();
  for (const c of chords) {
    const resolvedKey = handleToKey.get(c.voice) ?? c.voice;
    const list = chordsByVoice.get(resolvedKey) ?? [];
    list.push(c);
    chordsByVoice.set(resolvedKey, list);
  }

  const voicesToProcess = args.voice
    ? voices.filter((v) => v.key === args.voice)
    : voices;

  let written = 0;
  let receiptHash = "";
  let receiptSourceFiles = 0;
  for (const voice of voicesToProcess) {
    const vChords = chordsByVoice.get(voice.key) ?? [];
    const sources: SourceFile[] = [
      voiceSourceFile(voice),
      ...vChords.map(chordSourceFile),
    ];
    const hash = await manifestHash(sources);
    receiptHash = hash;
    receiptSourceFiles += sources.length;
    const receipts: Receipts = {
      generated_at,
      manifest_hash: hash,
      source_files: sources.length,
    };

    const path = join(OUT, `x8888_${voice.key}_memory.myc.md`);
    await Deno.writeTextFile(
      path,
      renderVoiceMemory(voice, vChords, receipts, chords) + "\n",
    );
    await formatGeneratedFile(path);
    const sidecarPath = join(OUT, `x8888_${voice.key}_memory.manifest.json`);
    await Deno.writeTextFile(
      sidecarPath,
      canonicalManifest(sources) + "\n",
    );
    await formatGeneratedFile(sidecarPath);
    console.log(
      `[write] x8888_${voice.key}_memory.myc.md (${vChords.length} chords)`,
    );
    written += 2;
  }

  if (!args.voice) {
    const allSources: SourceFile[] = [
      ...voices.map(voiceSourceFile),
      ...chords.map(chordSourceFile),
    ];
    const globalHash = await manifestHash(allSources);
    receiptHash = globalHash;
    receiptSourceFiles = allSources.length;
    const receipts: Receipts = {
      generated_at,
      manifest_hash: globalHash,
      source_files: allSources.length,
    };
    const statePath = join(OUT, "x2888_voices_state.myc.md");
    await Deno.writeTextFile(
      statePath,
      renderVoicesState(voices, chordsByVoice, receipts) + "\n",
    );
    await formatGeneratedFile(statePath);
    const globalSidecarPath = join(OUT, "x2888_voices_state.manifest.json");
    await Deno.writeTextFile(
      globalSidecarPath,
      canonicalManifest(allSources) + "\n",
    );
    await formatGeneratedFile(globalSidecarPath);
    console.log(
      `[write] x2888_voices_state.myc.md (${voices.length} voices indexed)`,
    );
    written += 2;
    console.log(
      `done. ${written} files. global_manifest_hash=${globalHash}${
        args.stable ? " (stable)" : ""
      }`,
    );
  } else {
    console.log(
      `done. ${written} files for voice=${args.voice}${
        args.stable ? " (stable)" : ""
      }`,
    );
  }
  if (args.json) {
    console.log = originalLog;
    console.warn = originalWarn;
    originalLog(JSON.stringify(
      {
        type: "memory",
        position: "8/A",
        action: "generate",
        stable: args.stable,
        voice: args.voice,
        written,
        source_files: receiptSourceFiles,
        manifest_hash: receiptHash,
        diagnostics,
      },
      null,
      2,
    ));
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
