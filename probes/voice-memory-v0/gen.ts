// gen.ts — voice memory probe generator
//
// Reads (READ-ONLY) from real substrate:
//   ../../state/voices/<voice>.json       — authored profile
//   ../../jazz/chords/                    — chord history
//
// Renders to ./output/:
//   x8888_<voice>_memory.myc.md           — per-voice recall projection
//   x2888_voices_state.myc.md             — substrate-wide voice index
//   x8888_<voice>_memory.manifest.json    — per-voice source manifest sidecar
//   x2888_voices_state.manifest.json      — global source manifest sidecar
//
// Per Codex 2026-05-19 (forwarded by architect):
// - voice profile ≠ voice memory. Profile = identity/physics. Memory =
//   generated digest of stigmergy.
// - Memory MUST be generated from sources (chords, cowitness, observations,
//   decisions), not authored as canonical document.
// - Profile lives at x2... (mirror/selfhood). Memory projection at x8...
//   (cache/recall).
//
// Probe scope: real-substrate ingestion via relative paths (read-only).
// Self-contained: produces only into ./output/. Probe does NOT touch
// state/voices/ or jazz/chords/.
//
// Acceptance criterion (Codex's): fresh model reads x8888_<voice>_memory.myc.md
// and can answer:
//   - which decisions did this voice help form?
//   - which mistakes/observations should not be repeated?
//   - what is this voice's next vector?
//   - how does this voice's style differ from others?
//
// Run: deno run --config=probe.jsonc -A gen.ts [--voice=kimi] [--stable]

import { dirname, fromFileUrl, join, relative } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const TRINITY_ROOT = join(HERE, "..", "..");
const VOICES_DIR = join(TRINITY_ROOT, "state", "voices");
const CHORDS_DIR = join(TRINITY_ROOT, "jazz", "chords");
const OUT = join(HERE, "output");

// Chord filename patterns:
//   wallclock-old: 2026-05-19T095000Z-kimi-deep-analysis-selfhood-vectors.md
//   new-form:      x3500_950008_codex_src-as-semantic-address-space.md
const OLD_FORM = /^(\d{4}-\d{2}-\d{2}T\d{6}Z)-([a-z]+)-(.+)\.md$/;
const NEW_FORM = /^x([0-9A-Fa-f]{4})_(\d+)_([a-z0-9-]+)_(.+)\.md$/;

const VOICE_RE = /^voice:\s*([a-z0-9-]+)/m;
const MODE_RE = /^mode:\s*([a-z0-9-_]+)/m;
const TOPIC_RE = /^topic:\s*(.+?)\s*$/m;
const STANCE_RE = /^stance:\s*([A-Z_]+)/m;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

interface Chord {
  filename: string;
  ts: string;           // wallclock OR block-height; for sorting
  voice: string;        // from filename or frontmatter
  topic: string;
  mode: string | null;
  stance: string | null; // PROPOSE / AYE / NAY / TWEAK / RECEIPT / etc.
  bucket_coord: string | null; // xNNNN if new form
  block_height: number | null;
  source_hash: string;
  source_size: number;
}

interface VoiceProfile {
  filename: string;
  identity: string;
  handles: string[];
  natural_styles?: string[];
  uncomfortable_styles?: string[];
  telos_filters?: string[];
  comfort_field_axes?: Record<string, number>;
  description?: string;
  source_hash: string;
  source_size: number;
  raw: Record<string, unknown>;
}

interface Args {
  voice: string | null;
  stable: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { voice: null, stable: false };
  for (const a of argv) {
    if (a === "--stable") out.stable = true;
    else if (a.startsWith("--voice=")) out.voice = a.split("=")[1].toLowerCase();
  }
  return out;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function loadVoices(): Promise<VoiceProfile[]> {
  const out: VoiceProfile[] = [];
  for await (const entry of Deno.readDir(VOICES_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".json")) continue;
    const path = join(VOICES_DIR, entry.name);
    const bytes = await Deno.readFile(path);
    const text = new TextDecoder().decode(bytes);
    try {
      const raw = JSON.parse(text);
      const self = raw.self_declared ?? {};
      out.push({
        filename: entry.name,
        identity: raw.identity ?? entry.name.replace(/\.json$/, ""),
        handles: Array.isArray(raw.handles) ? raw.handles : [],
        natural_styles: self.natural_styles,
        uncomfortable_styles: self.uncomfortable_styles,
        telos_filters: raw.telos_filters,
        comfort_field_axes: self.comfort_field_axes,
        description: self.description,
        source_hash: await sha256Hex(bytes),
        source_size: bytes.length,
        raw,
      });
    } catch (e) {
      console.warn(`failed to parse ${entry.name}: ${e instanceof Error ? e.message : e}`);
    }
  }
  return out.sort((a, b) => a.identity.localeCompare(b.identity));
}

function extractFrontmatter(content: string): string | null {
  const m = FRONTMATTER_RE.exec(content);
  return m ? m[1] : null;
}

async function loadChords(): Promise<Chord[]> {
  const out: Chord[] = [];
  for await (const entry of Deno.readDir(CHORDS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const path = join(CHORDS_DIR, entry.name);
    const bytes = await Deno.readFile(path);
    const text = new TextDecoder().decode(bytes);
    const fm = extractFrontmatter(text);

    let voice = "";
    let topic = "";
    let mode: string | null = null;
    let stance: string | null = null;
    let bucket_coord: string | null = null;
    let block_height: number | null = null;
    let ts = "";

    // Try new form first
    const newM = NEW_FORM.exec(entry.name);
    if (newM) {
      bucket_coord = newM[1].toUpperCase();
      block_height = parseInt(newM[2], 10);
      voice = newM[3].toLowerCase();
      ts = newM[2]; // block height as string for sort
    } else {
      const oldM = OLD_FORM.exec(entry.name);
      if (oldM) {
        ts = oldM[1];
        voice = oldM[2].toLowerCase();
      } else {
        continue; // unparseable
      }
    }

    // Override voice from frontmatter if present
    if (fm) {
      const vm = VOICE_RE.exec(fm);
      if (vm) voice = vm[1].toLowerCase().split("-")[0];
      const mm = MODE_RE.exec(fm);
      if (mm) mode = mm[1];
      const tm = TOPIC_RE.exec(fm);
      if (tm) topic = tm[1];
      const sm = STANCE_RE.exec(fm);
      if (sm) stance = sm[1];
    }

    if (!topic) {
      // Derive from filename if not in frontmatter
      const newM2 = NEW_FORM.exec(entry.name);
      const oldM2 = OLD_FORM.exec(entry.name);
      topic = (newM2?.[4] ?? oldM2?.[3] ?? entry.name).replace(/-/g, " ");
    }

    out.push({
      filename: entry.name,
      ts,
      voice,
      topic,
      mode,
      stance,
      bucket_coord,
      block_height,
      source_hash: await sha256Hex(bytes),
      source_size: bytes.length,
    });
  }
  return out.sort((a, b) => a.ts.localeCompare(b.ts));
}

interface SourceFile { path: string; hash: string; size: number; }

function canonicalManifest(files: SourceFile[]): string {
  return JSON.stringify(files.slice().sort((a, b) => a.path.localeCompare(b.path)));
}

async function manifestHash(files: SourceFile[]): Promise<string> {
  return `sha256:${await sha256Hex(new TextEncoder().encode(canonicalManifest(files)))}`;
}

function voiceSourceFile(voice: VoiceProfile): SourceFile {
  return {
    path: relative(TRINITY_ROOT, join(VOICES_DIR, voice.filename)),
    hash: `sha256:${voice.source_hash}`,
    size: voice.source_size,
  };
}

function chordSourceFile(chord: Chord): SourceFile {
  return {
    path: relative(TRINITY_ROOT, join(CHORDS_DIR, chord.filename)),
    hash: `sha256:${chord.source_hash}`,
    size: chord.source_size,
  };
}

function renderVoiceMemory(
  voice: VoiceProfile,
  chords: Chord[],
  receipts: { generated_at: string | null; manifest_hash: string; source_files: number },
): string {
  const proposals = chords.filter((c) => c.mode === "proposal" || c.stance === "PROPOSE");
  const cowitness = chords.filter((c) => c.mode === "cowitness" || /AYE|NAY|TWEAK/.test(c.stance ?? ""));
  const receiptsChords = chords.filter((c) => c.mode === "receipt" || c.stance === "RECEIPT");
  const observations = chords.filter((c) => c.mode === "observation");
  const other = chords.filter((c) =>
    !proposals.includes(c) && !cowitness.includes(c) && !receiptsChords.includes(c) && !observations.includes(c)
  );

  const lines: string[] = [];
  lines.push(`<!-- AUTO-GENERATED by probes/voice-memory-v0/gen.ts — do not edit by hand. -->`);
  if (receipts.generated_at) lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(`<!-- voice: ${voice.identity}   chords: ${chords.length} -->`);
  lines.push(``);
  lines.push(`# ${voice.identity} — memory digest (generated stigmergy projection)`);
  lines.push(``);
  lines.push(`*This is a recall projection auto-generated from source artifacts. Voice profile lives at \`state/voices/${voice.filename}\` (authored, identity). This file is "what you left behind in substrate" — read it on session start to recover continuity.*`);
  lines.push(``);

  // Profile section
  lines.push(`## Profile (from voice record)`);
  lines.push(``);
  lines.push(`- **handles:** ${voice.handles.join(", ")}`);
  if (voice.natural_styles) lines.push(`- **natural styles:** ${voice.natural_styles.join(", ")}`);
  if (voice.uncomfortable_styles) lines.push(`- **uncomfortable styles:** ${voice.uncomfortable_styles.join(", ")}`);
  if (voice.telos_filters && voice.telos_filters.length > 0) {
    lines.push(`- **telos filters:** ${voice.telos_filters.join(", ")}`);
  }
  if (voice.comfort_field_axes) {
    const axes = Object.entries(voice.comfort_field_axes)
      .map(([k, v]) => `${k.replace(/^axis_\d+_/, "")}=${v}`)
      .join("  ");
    lines.push(`- **comfort field axes:** ${axes}`);
  }
  if (voice.description) {
    lines.push(``);
    lines.push(`> ${voice.description}`);
  }
  lines.push(``);

  // Chord activity summary
  lines.push(`## Chord activity (${chords.length} total)`);
  lines.push(``);
  lines.push(`| category | count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| proposals authored | ${proposals.length} |`);
  lines.push(`| cowitness on others | ${cowitness.length} |`);
  lines.push(`| receipts | ${receiptsChords.length} |`);
  lines.push(`| observations | ${observations.length} |`);
  lines.push(`| other | ${other.length} |`);
  lines.push(``);

  // Proposals authored
  if (proposals.length > 0) {
    lines.push(`## Proposals authored — "what I tried to land"`);
    lines.push(``);
    for (const c of proposals.slice(-15).reverse()) {
      const stance = c.stance ? ` [${c.stance}]` : "";
      const coord = c.bucket_coord ? ` x${c.bucket_coord}` : "";
      lines.push(`- \`${c.filename}\`${coord}${stance} — ${c.topic}`);
    }
    if (proposals.length > 15) lines.push(`- ... and ${proposals.length - 15} earlier`);
    lines.push(``);
  }

  // Cowitness contributions
  if (cowitness.length > 0) {
    lines.push(`## Cowitness contributions — "what I helped form"`);
    lines.push(``);
    for (const c of cowitness.slice(-15).reverse()) {
      const stance = c.stance ? ` [${c.stance}]` : "";
      const coord = c.bucket_coord ? ` x${c.bucket_coord}` : "";
      lines.push(`- \`${c.filename}\`${coord}${stance} — ${c.topic}`);
    }
    if (cowitness.length > 15) lines.push(`- ... and ${cowitness.length - 15} earlier`);
    lines.push(``);
  }

  // Observations — what to remember NOT to repeat
  if (observations.length > 0) {
    lines.push(`## Observations — "what to not repeat"`);
    lines.push(``);
    for (const c of observations.slice(-10).reverse()) {
      lines.push(`- \`${c.filename}\` — ${c.topic}`);
    }
    lines.push(``);
  }

  // Receipts authored
  if (receiptsChords.length > 0) {
    lines.push(`## Receipts authored — "what I closed"`);
    lines.push(``);
    for (const c of receiptsChords.slice(-10).reverse()) {
      const coord = c.bucket_coord ? ` x${c.bucket_coord}` : "";
      lines.push(`- \`${c.filename}\`${coord} — ${c.topic}`);
    }
    lines.push(``);
  }

  // Recent chord trail (last 5 of any kind)
  lines.push(`## Recent chord trail (last 5 — sorted by ts)`);
  lines.push(``);
  for (const c of chords.slice(-5).reverse()) {
    const stance = c.stance ? ` [${c.stance}]` : "";
    const mode = c.mode ? ` (${c.mode})` : "";
    const coord = c.bucket_coord ? ` x${c.bucket_coord}` : "";
    lines.push(`- \`${c.filename}\`${coord}${stance}${mode}`);
  }
  lines.push(``);

  // Next vector — synthesize from voice's natural styles + telos
  lines.push(`## Next vector — "what's mine to do here"`);
  lines.push(``);
  lines.push(`Based on voice profile:`);
  if (voice.natural_styles) {
    lines.push(`- Lean into natural styles: **${voice.natural_styles.join(", ")}**`);
  }
  if (voice.telos_filters && voice.telos_filters.length > 0) {
    lines.push(`- Respect telos filters: ${voice.telos_filters.join(", ")}`);
  }
  if (voice.uncomfortable_styles) {
    lines.push(`- Avoid forced moves: ${voice.uncomfortable_styles.join(", ")} (uncomfortable)`);
  }
  lines.push(``);
  lines.push(`If chord trail's most recent topic is unresolved, that's likely the next vector. Otherwise consult \`t status\` + \`t gravity\` for substrate-current signals.`);
  lines.push(``);

  return lines.join("\n");
}

function renderVoicesState(
  voices: VoiceProfile[],
  chordsByVoice: Map<string, Chord[]>,
  receipts: { generated_at: string | null; manifest_hash: string; source_files: number },
): string {
  const lines: string[] = [];
  lines.push(`<!-- AUTO-GENERATED by probes/voice-memory-v0/gen.ts — do not edit by hand. -->`);
  if (receipts.generated_at) lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(`<!-- voices: ${voices.length} -->`);
  lines.push(``);
  lines.push(`# Voices state — substrate-wide voice index`);
  lines.push(``);
  lines.push(`*Generated index of all known voices. Profile (authored) lives at \`state/voices/<voice>.json\`. Per-voice memory (generated) is in this dir's \`x8888_<voice>_memory.myc.md\`.*`);
  lines.push(``);

  lines.push(`## Voices`);
  lines.push(``);
  lines.push(`| identity | handles | natural styles | chord count | drill |`);
  lines.push(`|----------|---------|----------------|-------------|-------|`);
  for (const v of voices) {
    const chords = chordsByVoice.get(v.identity.split("-")[0]) ?? [];
    const styles = (v.natural_styles ?? []).join(", ") || "—";
    const handles = v.handles.slice(0, 3).join(", ") + (v.handles.length > 3 ? "..." : "");
    const memoryFile = `x8888_${v.identity.split("-")[0]}_memory.myc.md`;
    lines.push(`| ${v.identity} | ${handles} | ${styles} | ${chords.length} | [${memoryFile}](./${memoryFile}) |`);
  }
  lines.push(``);

  // Style differentiation matrix
  lines.push(`## Style differentiation`);
  lines.push(``);
  lines.push(`Voices' comfort_field axes (where each voice naturally lives in the dipole space):`);
  lines.push(``);
  lines.push(`| voice | void(0) | first(1) | mirror(2) | triangle(3) | foundation(4) | action(5) | harmony(6) | completion(7) |`);
  lines.push(`|-------|---------|----------|-----------|-------------|---------------|-----------|------------|---------------|`);
  for (const v of voices) {
    if (!v.comfort_field_axes) continue;
    const a = v.comfort_field_axes;
    lines.push(`| ${v.identity} | ${a.axis_0_void ?? "—"} | ${a.axis_1_first ?? "—"} | ${a.axis_2_mirror ?? "—"} | ${a.axis_3_triangle ?? "—"} | ${a.axis_4_foundation ?? "—"} | ${a.axis_5_action ?? "—"} | ${a.axis_6_harmony ?? "—"} | ${a.axis_7_completion ?? "—"} |`);
  }
  lines.push(``);
  lines.push(`Higher value = more comfortable in that archetype. A voice with high mirror+triangle but low action prefers analysis and structure over execution. A voice with high foundation+harmony prefers stable, audited operations. Read your own row to know where you naturally fit.`);
  lines.push(``);

  return lines.join("\n");
}

async function main(argv: string[]) {
  const args = parseArgs(argv);
  await Deno.mkdir(OUT, { recursive: true });

  const voices = await loadVoices();
  const chords = await loadChords();
  const generated_at = args.stable ? null : new Date().toISOString();

  // Group chords by voice
  const chordsByVoice = new Map<string, Chord[]>();
  for (const c of chords) {
    const list = chordsByVoice.get(c.voice) ?? [];
    list.push(c);
    chordsByVoice.set(c.voice, list);
  }

  const voiceFilter = args.voice;
  const voicesToProcess = voiceFilter
    ? voices.filter((v) => v.identity.split("-")[0].toLowerCase() === voiceFilter)
    : voices;

  let written = 0;
  for (const voice of voicesToProcess) {
    const voiceKey = voice.identity.split("-")[0].toLowerCase();
    const voiceChords = chordsByVoice.get(voiceKey) ?? [];

    const voiceSources: SourceFile[] = [
      voiceSourceFile(voice),
      ...voiceChords.map(chordSourceFile),
    ];
    const voiceManifest = await manifestHash(voiceSources);
    const voiceReceipts = { generated_at, manifest_hash: voiceManifest, source_files: voiceSources.length };

    const path = join(OUT, `x8888_${voiceKey}_memory.myc.md`);
    await Deno.writeTextFile(path, renderVoiceMemory(voice, voiceChords, voiceReceipts) + "\n");
    await Deno.writeTextFile(
      join(OUT, `x8888_${voiceKey}_memory.manifest.json`),
      canonicalManifest(voiceSources) + "\n",
    );
    console.log(`[write] x8888_${voiceKey}_memory.myc.md (${voiceChords.length} chords digested)`);
    console.log(`[write] x8888_${voiceKey}_memory.manifest.json (${voiceSources.length} source entries)`);
    written += 2;
  }

  if (!voiceFilter) {
    const allSources: SourceFile[] = [
      ...voices.map(voiceSourceFile),
      ...chords.map(chordSourceFile),
    ];
    const globalManifest = await manifestHash(allSources);
    const subsReceipts = { generated_at, manifest_hash: globalManifest, source_files: allSources.length };

    const subsPath = join(OUT, "x2888_voices_state.myc.md");
    await Deno.writeTextFile(subsPath, renderVoicesState(voices, chordsByVoice, subsReceipts) + "\n");
    await Deno.writeTextFile(
      join(OUT, "x2888_voices_state.manifest.json"),
      canonicalManifest(allSources) + "\n",
    );
    console.log(`[write] x2888_voices_state.myc.md (${voices.length} voices indexed)`);
    console.log(`[write] x2888_voices_state.manifest.json (${allSources.length} source entries)`);
    written += 2;
    console.log(`done. ${written} files. global_manifest_hash=${globalManifest}${args.stable ? " (stable)" : ""}`);
  } else {
    console.log(`done. ${written} files for voice=${voiceFilter}${args.stable ? " (stable)" : ""}`);
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
