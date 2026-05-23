// gen.ts — roadmap-gen-v0 — fourth axis of substrate self-description
//
// Per Codex's local 2026-05-19 roadmap-axis proposal, trinity now has three
// generated self-description axes (state, skill, memory) and is missing the
// fourth:
//
//   state   — "що я бачу"    (x8800_agents_gen   live)
//   skill   — "як рухатись"  (x8C00_skill_gen    live)
//   memory  — "що я лишив"   (voice-memory-v0    probe-only)
//   ROADMAP — "куди іти"     (this probe)
//
// Roadmap is "frontier tension" — where the substrate is being pulled next.
// NOT memory (retained trace), NOT skill (operational posture), NOT state
// (present perception). Different time-load.
//
// Inputs (READ-ONLY, tracked-only via git ls-files):
//   ../../src/                   organ headers (horizon: fields)
//   ../../jazz/chords/           recent chord pressure (proposal/cowitness/receipt)
//   ../../state/voices/          voice profiles (for per-voice roadmap)
//
// Outputs (./output/):
//   x8D00_roadmap.myc.md            substrate-wide roadmap
//   x8D00_<voice>_roadmap.myc.md    per-voice roadmap
//   plus per-output manifest sidecars
//
// Coordinate 8D = cache(8) × decision(D) = "decision-pressure buffer".
// D is intentional, per Codex: roadmap is decision pressure, not just cache.
//
// Codex's falsifiers (must not violate):
//   - roadmap merely repeating last N chord filenames → not roadmap, index
//   - hand-authored canonical truth → duplicates contracts/governance
//   - per-voice roadmap restating voice profile → belongs in skill
//   - cannot cite source artifacts + hashes → not ready for live src
//   - claimed memory/state/skill dependency without reading those sources
//     directly → fake dependency
//
// Run: deno run --config=probe.jsonc -A gen.ts [--voice=<name>] [--stable]

import {
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const TRINITY_ROOT = join(HERE, "..", "..");
const SRC = join(TRINITY_ROOT, "src");
const CHORDS_DIR = join(TRINITY_ROOT, "jazz", "chords");
const VOICES_DIR = join(TRINITY_ROOT, "state", "voices");
const OUT = join(HERE, "output");

const ORGAN_FILE_RE = /^x([0-9A-Fa-f])([0-9A-Fa-f]{3})_([^.]+)\.ts$/;
const HEADER_RE = /^\/\/\s*(\w+):\s*(.+?)\s*$/;
const OLD_FORM = /^(\d{4}-\d{2}-\d{2}T\d{6}Z)-([a-z]+)-(.+)\.md$/;
const NEW_FORM = /^x([0-9A-Fa-f]{4})_(\d+)_([a-z0-9-]+)_(.+)\.md$/;
const VOICE_RE = /^voice:\s*([a-z0-9-]+)/m;
const MODE_RE = /^mode:\s*([a-z0-9_-]+)/m;
const STANCE_RE = /^stance:\s*([A-Z_]+)/m;
const TOPIC_RE = /^topic:\s*(.+?)\s*$/m;
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

interface OrganHorizon {
  filename: string;
  coordinate: string;
  bucket: string;
  handle: string;
  horizon: string;
  maturity?: string;
  source_hash: string;
  source_size: number;
}

interface ChordRef {
  filename: string;
  sort_key: number;
  voice: string;
  topic: string;
  mode: string | null;
  stance: string | null;
  source_hash: string;
  source_size: number;
}

interface VoiceProfile {
  filename: string;
  identity: string;
  key: string; // first segment, e.g. "claude"
  comfort_field_axes?: Record<string, number>;
  natural_styles?: string[];
  telos_filters?: string[];
  source_hash: string;
  source_size: number;
}

async function loadOrganHorizons(): Promise<OrganHorizon[]> {
  const tracked = await gitTrackedSet("src");
  const out: OrganHorizon[] = [];
  for await (const entry of Deno.readDir(SRC)) {
    if (!entry.isFile) continue;
    const m = ORGAN_FILE_RE.exec(entry.name);
    if (!m) continue;
    const relPath = `src/${entry.name}`;
    if (!tracked.has(relPath)) continue;
    const [, bucket, sub, handle] = m;
    const bytes = await Deno.readFile(join(SRC, entry.name));
    const text = new TextDecoder().decode(bytes);
    let horizon = "";
    let maturity: string | undefined;
    const lines = text.split("\n").slice(0, 40);
    for (const line of lines) {
      const hm = HEADER_RE.exec(line);
      if (!hm) continue;
      if (hm[1] === "horizon") horizon = hm[2];
      else if (hm[1] === "maturity") maturity = hm[2];
    }
    if (!horizon) continue; // skip organs without declared horizon — they're not pulling
    out.push({
      filename: entry.name,
      coordinate: (bucket + sub).toUpperCase(),
      bucket: bucket.toUpperCase(),
      handle,
      horizon,
      maturity,
      source_hash: await sha256Hex(bytes),
      source_size: bytes.length,
    });
  }
  return out.sort((a, b) => a.coordinate.localeCompare(b.coordinate));
}

async function loadChords(): Promise<ChordRef[]> {
  const tracked = await gitTrackedSet("jazz/chords");
  const out: ChordRef[] = [];
  for await (const entry of Deno.readDir(CHORDS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const relPath = `jazz/chords/${entry.name}`;
    if (!tracked.has(relPath)) continue;
    const bytes = await Deno.readFile(join(CHORDS_DIR, entry.name));
    const text = new TextDecoder().decode(bytes);

    let voice = "";
    let topic = "";
    let mode: string | null = null;
    let stance: string | null = null;
    let sort_key = 0;

    const newM = NEW_FORM.exec(entry.name);
    if (newM) {
      voice = newM[3].toLowerCase();
      sort_key = blockHeightToEpoch(parseInt(newM[2], 10));
      topic = newM[4];
    } else {
      const oldM = OLD_FORM.exec(entry.name);
      if (oldM) {
        voice = oldM[2].toLowerCase();
        sort_key = wallclockToEpoch(oldM[1]);
        topic = oldM[3];
      } else continue;
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
      source_hash: await sha256Hex(bytes),
      source_size: bytes.length,
    });
  }
  return out.sort((a, b) => a.sort_key - b.sort_key);
}

async function loadVoices(): Promise<VoiceProfile[]> {
  const tracked = await gitTrackedSet("state/voices");
  const out: VoiceProfile[] = [];
  for await (const entry of Deno.readDir(VOICES_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".json")) continue;
    const relPath = `state/voices/${entry.name}`;
    if (!tracked.has(relPath)) continue;
    const bytes = await Deno.readFile(join(VOICES_DIR, entry.name));
    const text = new TextDecoder().decode(bytes);
    try {
      const raw = JSON.parse(text);
      const self = raw.self_declared ?? {};
      const identity = raw.identity ?? entry.name.replace(/\.json$/, "");
      out.push({
        filename: entry.name,
        identity,
        key: identity.split("-")[0].toLowerCase(),
        comfort_field_axes: self.comfort_field_axes,
        natural_styles: self.natural_styles,
        telos_filters: raw.telos_filters,
        source_hash: await sha256Hex(bytes),
        source_size: bytes.length,
      });
    } catch { /* skip unreadable */ }
  }
  return out.sort((a, b) => a.identity.localeCompare(b.identity));
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

function organSource(o: OrganHorizon): SourceFile {
  return {
    path: `src/${o.filename}`,
    hash: `sha256:${o.source_hash}`,
    size: o.source_size,
  };
}
function chordSource(c: ChordRef): SourceFile {
  return {
    path: `jazz/chords/${c.filename}`,
    hash: `sha256:${c.source_hash}`,
    size: c.source_size,
  };
}
function voiceSource(v: VoiceProfile): SourceFile {
  return {
    path: `state/voices/${v.filename}`,
    hash: `sha256:${v.source_hash}`,
    size: v.source_size,
  };
}

interface Receipts {
  generated_at: string | null;
  manifest_hash: string;
  source_files: number;
}

function renderSubstrateRoadmap(
  horizons: OrganHorizon[],
  chords: ChordRef[],
  voices: VoiceProfile[],
  receipts: Receipts,
): string {
  // Bucket-level: aggregate horizons by bucket digit
  const byBucket = new Map<string, OrganHorizon[]>();
  for (const h of horizons) {
    const list = byBucket.get(h.bucket) ?? [];
    list.push(h);
    byBucket.set(h.bucket, list);
  }

  // Recent activity window: last ~14 days of chords (≈ 1.2M seconds)
  const now_estimate = Math.max(...chords.map((c) => c.sort_key), 0);
  const recentWindow = now_estimate - 14 * 86400;
  const recent = chords.filter((c) => c.sort_key >= recentWindow);
  const recentProposals = recent.filter((c) =>
    c.mode === "proposal" || c.stance === "PROPOSE" ||
    /PROPOSE/.test(c.stance ?? "")
  );
  const recentCowitness = recent.filter((c) =>
    c.mode === "cowitness" || /AYE|NAY|TWEAK/.test(c.stance ?? "")
  );
  const recentReceipts = recent.filter((c) =>
    c.mode === "receipt" || c.stance === "RECEIPT"
  );

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by probes/roadmap-gen-v0/gen.ts — do not edit by hand. -->`,
  );
  if (receipts.generated_at) {
    lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  }
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(
    `<!-- horizons: ${horizons.length}   chords: ${chords.length}   recent (14d): ${recent.length}   voices: ${voices.length} -->`,
  );
  lines.push(``);
  lines.push(`# Substrate roadmap — frontier tension`);
  lines.push(``);
  lines.push(
    `*Generated. Says "куди тягнеться substrate" (Codex's fourth axis: where am I being pulled next?). Paired with x8888_agents.myc.md (state, "що я бачу"), x8888_skills.myc.md (skill, "як рухатись"), and per-voice memory files ("що я лишив"). Roadmap ≠ memory; this is decision pressure, not retained trace.*`,
  );
  lines.push(``);

  // 1. Pulling forward — declared horizons by bucket
  lines.push(`## Pulling forward — horizons declared by organs`);
  lines.push(``);
  lines.push(
    `Aggregated from \`horizon:\` header fields. Each line is what THAT organ thinks should come next; together they describe the substrate's declared frontier.`,
  );
  lines.push(``);
  for (const [bucket, hs] of [...byBucket.entries()].sort()) {
    lines.push(`### Bucket ${bucket} (${hs.length} declared horizons)`);
    lines.push(``);
    for (const h of hs) {
      const m = h.maturity ? ` [${h.maturity}]` : "";
      lines.push(`- **x${h.coordinate}_${h.handle}**${m} — ${h.horizon}`);
    }
    lines.push(``);
  }

  // 2. In motion — recent chord activity by stance
  lines.push(`## In motion — recent chord activity (last 14 days)`);
  lines.push(``);
  lines.push(
    `Pressure from the dialog layer: what's being proposed, cowitnessed, sealed right now.`,
  );
  lines.push(``);
  lines.push(`| activity | count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| recent proposals | ${recentProposals.length} |`);
  lines.push(`| recent cowitness rounds | ${recentCowitness.length} |`);
  lines.push(`| recent receipts (closures) | ${recentReceipts.length} |`);
  lines.push(``);

  if (recentProposals.length > 0) {
    lines.push(`### Recent proposals`);
    lines.push(``);
    for (const c of recentProposals.slice(-10).reverse()) {
      lines.push(`- \`${c.filename}\` (by ${c.voice}) — ${c.topic}`);
    }
    lines.push(``);
  }

  if (recentReceipts.length > 0) {
    lines.push(`### Recent receipts (what just closed)`);
    lines.push(``);
    for (const c of recentReceipts.slice(-5).reverse()) {
      lines.push(`- \`${c.filename}\` (by ${c.voice}) — ${c.topic}`);
    }
    lines.push(``);
  }

  // 3. Per-voice frontier index
  lines.push(`## Per-voice roadmaps`);
  lines.push(``);
  lines.push(
    `Each voice has its own frontier tension, derived from its profile's natural styles + comfort field + recent chord activity.`,
  );
  lines.push(``);
  lines.push(`| voice | drill |`);
  lines.push(`|-------|-------|`);
  for (const v of voices) {
    lines.push(
      `| ${v.identity} | [x8D00_${v.key}_roadmap.myc.md](./x8D00_${v.key}_roadmap.myc.md) |`,
    );
  }
  lines.push(``);

  lines.push(`## Receipt`);
  lines.push(``);
  lines.push(
    `Sources: ${horizons.length} organ horizons + ${chords.length} chords + ${voices.length} voice profiles.`,
  );
  lines.push(
    `Manifest hash is over the canonical JSON list of all sources (sorted by path, each with sha256+size).`,
  );
  lines.push(
    `v0 source set is direct sources only: organ horizons + tracked chords + tracked voice profiles. It does not read generated state/skill/memory outputs yet; that cross-axis dependency is deferred to v1.`,
  );
  return lines.join("\n");
}

function renderVoiceRoadmap(
  voice: VoiceProfile,
  voiceChords: ChordRef[],
  substrateHorizons: OrganHorizon[],
  receipts: Receipts,
): string {
  // Voice's recent chord trail (last 10 by sort_key)
  const recent = voiceChords.slice(-10).reverse();

  // Open commitments: proposals authored by this voice without obvious receipt
  // closure. Heuristic v0: proposal chord that doesn't share filename-stem with
  // any receipt chord. Not perfect — receipts often have different stems —
  // but sufficient to flag candidates.
  const myProposals = voiceChords.filter((c) =>
    c.mode === "proposal" || c.stance === "PROPOSE" ||
    /PROPOSE/.test(c.stance ?? "")
  );

  // Comfort fit: substrate buckets with horizons that match high-comfort archetypes
  // of this voice. Voice's comfort_field_axes gives 0-7 scores; find top 2 axes.
  const comfortFit: string[] = [];
  if (voice.comfort_field_axes) {
    const axes = voice.comfort_field_axes;
    const sorted = Object.entries(axes)
      .map(([k, v]) => ({ axis: k.match(/axis_(\d+)/)?.[1] ?? "?", value: v }))
      .filter((x) => x.axis !== "?")
      .sort((a, b) => b.value - a.value);
    const topAxes = sorted.slice(0, 2).map((x) => x.axis);
    for (const ax of topAxes) {
      const horizonsInBucket = substrateHorizons.filter((h) => h.bucket === ax);
      if (horizonsInBucket.length > 0) {
        comfortFit.push(
          `- **bucket ${ax}** (your comfort axis ${ax} = high): ${horizonsInBucket.length} declared horizons; ${
            horizonsInBucket.slice(0, 3).map((h) =>
              `x${h.coordinate}_${h.handle}`
            ).join(", ")
          }${horizonsInBucket.length > 3 ? "..." : ""}`,
        );
      }
    }
  }

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by probes/roadmap-gen-v0/gen.ts — do not edit by hand. -->`,
  );
  if (receipts.generated_at) {
    lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  }
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(
    `<!-- voice: ${voice.identity}   chords: ${voiceChords.length} -->`,
  );
  lines.push(``);
  lines.push(`# ${voice.identity} — roadmap (frontier tension, generated)`);
  lines.push(``);
  lines.push(
    `*Where this voice is being pulled next. Derived from voice profile + voice's chord trail + substrate's declared horizons. NOT a restatement of profile (that's x8888_skills.myc.md territory).*`,
  );
  lines.push(``);

  // 1. Topics this voice was just touching
  if (recent.length > 0) {
    lines.push(`## Topics in motion — my recent chord trail`);
    lines.push(``);
    for (const c of recent) {
      const mode = c.mode ? ` (${c.mode})` : "";
      const stance = c.stance ? ` [${c.stance}]` : "";
      lines.push(`- \`${c.filename}\`${stance}${mode} — ${c.topic}`);
    }
    lines.push(``);
  }

  // 2. Open commitments
  if (myProposals.length > 0) {
    lines.push(`## Open commitments — proposals I authored`);
    lines.push(``);
    lines.push(
      `v0 lists all proposals authored by this voice; future v1 should detect which are still open vs closed by tracking cowitness/receipt references.`,
    );
    lines.push(``);
    for (const c of myProposals.slice(-10).reverse()) {
      lines.push(`- \`${c.filename}\` — ${c.topic}`);
    }
    lines.push(``);
  }

  // 3. Comfort-fit work
  if (comfortFit.length > 0) {
    lines.push(
      `## Comfort-fit work — substrate horizons in my high-comfort buckets`,
    );
    lines.push(``);
    lines.push(
      `Substrate has declared horizons in buckets matching this voice's top 2 comfort axes. These are the moves that should feel natural to take on.`,
    );
    lines.push(``);
    for (const line of comfortFit) lines.push(line);
    lines.push(``);
  }

  // 4. Telos as guardrail
  if (voice.telos_filters && voice.telos_filters.length > 0) {
    lines.push(`## Telos filters (always-on guardrails)`);
    lines.push(``);
    for (const t of voice.telos_filters) lines.push(`- ${t}`);
    lines.push(``);
  }

  return lines.join("\n");
}

interface Args {
  voice: string | null;
  stable: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { voice: null, stable: false };
  for (const a of argv) {
    if (a === "--stable") out.stable = true;
    else if (a.startsWith("--voice=")) {
      out.voice = a.split("=")[1].toLowerCase();
    }
  }
  return out;
}

async function main(argv: string[]) {
  const args = parseArgs(argv);
  await Deno.mkdir(OUT, { recursive: true });

  const horizons = await loadOrganHorizons();
  const chords = await loadChords();
  const voices = await loadVoices();
  const generated_at = args.stable ? null : new Date().toISOString();

  // Group chords by voice key
  const chordsByVoice = new Map<string, ChordRef[]>();
  for (const c of chords) {
    const list = chordsByVoice.get(c.voice) ?? [];
    list.push(c);
    chordsByVoice.set(c.voice, list);
  }

  // Build full source set
  const allSources: SourceFile[] = [
    ...horizons.map(organSource),
    ...chords.map(chordSource),
    ...voices.map(voiceSource),
  ];
  const globalHash = await manifestHash(allSources);
  const globalReceipts: Receipts = {
    generated_at,
    manifest_hash: globalHash,
    source_files: allSources.length,
  };

  let written = 0;

  // Substrate roadmap (unless --voice=N)
  if (!args.voice) {
    const path = join(OUT, "x8D00_roadmap.myc.md");
    await Deno.writeTextFile(
      path,
      renderSubstrateRoadmap(horizons, chords, voices, globalReceipts) + "\n",
    );
    await Deno.writeTextFile(
      join(OUT, "x8D00_roadmap.manifest.json"),
      canonicalManifest(allSources) + "\n",
    );
    console.log(
      `[write] x8D00_roadmap.myc.md (substrate-wide; ${horizons.length} horizons, ${chords.length} chords)`,
    );
    console.log(
      `[write] x8D00_roadmap.manifest.json (${allSources.length} source entries)`,
    );
    written += 2;
  }

  // Per-voice roadmaps
  const voicesToProcess = args.voice
    ? voices.filter((v) => v.key === args.voice)
    : voices;
  for (const voice of voicesToProcess) {
    const vChords = chordsByVoice.get(voice.key) ?? [];
    const voiceSources: SourceFile[] = [
      voiceSource(voice),
      ...vChords.map(chordSource),
      ...horizons.map(organSource), // include horizons since comfort-fit references them
    ];
    const voiceHash = await manifestHash(voiceSources);
    const voiceReceipts: Receipts = {
      generated_at,
      manifest_hash: voiceHash,
      source_files: voiceSources.length,
    };
    const path = join(OUT, `x8D00_${voice.key}_roadmap.myc.md`);
    await Deno.writeTextFile(
      path,
      renderVoiceRoadmap(voice, vChords, horizons, voiceReceipts) + "\n",
    );
    await Deno.writeTextFile(
      join(OUT, `x8D00_${voice.key}_roadmap.manifest.json`),
      canonicalManifest(voiceSources) + "\n",
    );
    console.log(
      `[write] x8D00_${voice.key}_roadmap.myc.md (${vChords.length} chords from this voice)`,
    );
    written += 2;
  }

  console.log(
    `done. ${written} files. global_manifest_hash=${globalHash}${
      args.stable ? " (stable)" : ""
    }`,
  );
}

if (import.meta.main) {
  await main(Deno.args);
}
