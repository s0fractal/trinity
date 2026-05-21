#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
// src/x8D00_roadmap_gen.ts — roadmap / frontier tension generator
// position: 8/D → cache(8) × decision(D) = decision-pressure buffer
// hex_dipole: "93 00 00 00 00 E6 00 33"
//   void_infinity-0.85 (PRIMARY: cache pole; bucket 8 PAIR-MATCH)
//   action_decision-0.20 (sub-archetype D: decision direction)
//   completion_frontier+0.40 (projection terminus)
// placement_policy: axis
// intent: scan organ horizons + tracked chords + voices; render frontier tension per substrate and per voice
// maturity: active
// horizon: consume generated state/skill/memory outputs (currently reads sources directly); cross-bucket tension synthesis
//
// roadmap generator — fourth axis "куди іти"
//
// Pair with:
//   x8800_agents_gen — state ("що я бачу")
//   x8A00_voice_memory_gen — memory ("що я лишив")
//   x8C00_skill_gen — skill ("як рухатись")
//
// V0 explicit scope (per Codex review): reads SOURCES directly (organ
// headers + tracked chords + tracked voice profiles). Does NOT yet
// consume generated state/skill/memory output files. Cross-axis
// downstream consumption deferred to v1 after memory graduates.
//
// Reads (READ-ONLY, tracked-only via git ls-files):
//   src/x*.ts          organ horizons
//   jazz/chords/*.md   chord pressure
//   state/voices/*.json voice profiles
//
// Renders (gitignored):
//   src/x8D00_roadmap.myc.md            substrate-wide frontier
//   src/x8D00_<voice>_roadmap.myc.md    per-voice frontier
//   plus per-output manifest sidecars
//
// Subcommands:
//   t roadmap                  regenerate substrate + all voices
//   t roadmap --voice=codex    one voice only
//   t roadmap --stable         deterministic (no generated_at)
//
// Glossary words: roadmap, frontier, фронтир, куди-іти

import {
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const TRINITY_ROOT = dirname(HERE);
const SRC = HERE;
const CHORDS_DIR = join(TRINITY_ROOT, "jazz", "chords");
const VOICES_DIR = join(TRINITY_ROOT, "state", "voices");
const OUT = HERE;

const ORGAN_FILE_RE = /^x([0-9A-Fa-f])([0-9A-Fa-f]{3})_([^.]+)\.ts$/;
const HEADER_RE = /^\/\/\s*(\w+):\s*(.+?)\s*$/;
const OLD_FORM = /^(\d{4}-\d{2}-\d{2}T\d{6}Z)-([a-z]+)-(.+)\.md$/;
const NEW_FORM = /^x([0-9A-Fa-f]{4})_(\d+)_([a-z0-9-]+)_(.+)\.md$/;
const VOICE_RE = /^voice:\s*([a-z0-9-]+)/m;
const MODE_RE = /^mode:\s*([a-z0-9_-]+)/m;
const STANCE_RE = /^stance:\s*([A-Z_]+)/m;
const TOPIC_RE = /^topic:\s*(.+?)\s*$/m;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
const DIRECT_CLOSES_HASH_RE =
  /^closes_hash:\s*["']?(?:sha256:)?([a-fA-F0-9]{64})["']?\s*$/gm;
const CLOSES_BLOCK_RE = /^closes:\s*\r?\n((?:[ \t]+.+\r?\n?)*)/m;
const CLOSES_BODY_HASH_RE =
  /^[ \t]+body_hash:\s*["']?(?:sha256:)?([a-fA-F0-9]{64})["']?\s*$/gm;

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
  closes?: { body_hash?: string; path_hint?: string; relation?: string } | null;
  closes_hash?: string | null;
}
interface VoiceProfile {
  filename: string;
  identity: string;
  key: string;
  comfort_field_axes?: Record<string, number>;
  natural_styles?: string[];
  telos_filters?: string[];
  source_hash: string;
  source_size: number;
}

function parseFrontmatter(fmText: string): {
  voice?: string;
  mode?: string;
  stance?: string;
  topic?: string;
  closes?: { body_hash?: string; path_hint?: string; relation?: string };
  closes_hash?: string;
} {
  const lines = fmText.split("\n");
  const result: any = {};
  let insideCloses = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if we are exiting the closes block
    if (insideCloses && !line.startsWith(" ") && !line.startsWith("\t")) {
      insideCloses = false;
    }

    if (trimmed.startsWith("closes:")) {
      insideCloses = true;
      result.closes = {};
      continue;
    }

    if (insideCloses) {
      const parts = trimmed.split(":");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(":").trim().replace(
          /^['"]|['"]$/g,
          "",
        );
        if (key === "body_hash") result.closes.body_hash = value;
        else if (key === "path_hint") result.closes.path_hint = value;
        else if (key === "relation") result.closes.relation = value;
      }
      continue;
    }

    const parts = trimmed.split(":");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(":").trim().replace(/^['"]|['"]$/g, "");
      if (key === "voice") result.voice = value;
      else if (key === "mode") result.mode = value;
      else if (key === "stance") result.stance = value;
      else if (key === "topic") result.topic = value;
      else if (key === "closes_hash") result.closes_hash = value;
    }
  }
  return result;
}

function normalizedSha256Ref(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  const hash = trimmed.startsWith("sha256:")
    ? trimmed.slice("sha256:".length)
    : trimmed;
  if (!/^[a-fA-F0-9]{64}$/.test(hash)) return null;
  return `sha256:${hash.toLowerCase()}`;
}

async function loadOrganHorizons(): Promise<OrganHorizon[]> {
  const tracked = await gitTrackedSet("src");
  const out: OrganHorizon[] = [];
  for await (const entry of Deno.readDir(SRC)) {
    if (!entry.isFile) continue;
    if (entry.name === "x8D00_roadmap_gen.ts") continue; // skip self
    const m = ORGAN_FILE_RE.exec(entry.name);
    if (!m) continue;
    const relPath = `src/${entry.name}`;
    if (!tracked.has(relPath)) continue;
    const [, bucket, sub, handle] = m;
    const bytes = await Deno.readFile(join(SRC, entry.name));
    const text = new TextDecoder().decode(bytes);
    let horizon = "", maturity: string | undefined;
    const lines = text.split("\n").slice(0, 40);
    for (const line of lines) {
      const hm = HEADER_RE.exec(line);
      if (!hm) continue;
      if (hm[1] === "horizon") horizon = hm[2];
      else if (hm[1] === "maturity") maturity = hm[2];
    }
    if (!horizon) continue;
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

async function loadChords(): Promise<
  { chords: ChordRef[]; bodies: Map<string, string> }
> {
  const tracked = await gitTrackedSet("jazz/chords");
  const out: ChordRef[] = [];
  const bodies = new Map<string, string>();
  for await (const entry of Deno.readDir(CHORDS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const relPath = `jazz/chords/${entry.name}`;
    if (!tracked.has(relPath)) continue;
    const bytes = await Deno.readFile(join(CHORDS_DIR, entry.name));
    const text = new TextDecoder().decode(bytes);

    let voice = "", topic = "";
    let mode: string | null = null, stance: string | null = null;
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
    let closesObj: any = null;
    let closesHash: string | null = null;
    if (fm) {
      const parsed = parseFrontmatter(fm[1]);
      if (parsed.voice) voice = parsed.voice.toLowerCase().split("-")[0];
      if (parsed.mode) mode = parsed.mode;
      if (parsed.stance) stance = parsed.stance;
      if (parsed.topic) topic = parsed.topic;
      if (parsed.closes) closesObj = parsed.closes;
      if (parsed.closes_hash) {
        closesHash = normalizedSha256Ref(parsed.closes_hash);
      }
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
      closes: closesObj,
      closes_hash: closesHash,
    });
    bodies.set(entry.name, text);
  }
  out.sort((a, b) => a.sort_key - b.sort_key);
  return { chords: out, bodies };
}

interface Closure {
  closed: boolean;
  closedBy: ChordRef[];
  type: "explicit" | "heuristic" | null;
}

// Closure detection v1.5 — hybrid content-addressed and heuristic.
// A proposal P is closed if there exists a receipt-like chord C such that:
//   • C is receipt-like (mode=receipt OR stance in {RECEIPT, AYE})
//   • C.sort_key > P.sort_key
// Matches first explicitly on C's `closes_hash` or `closes.body_hash`
// matching `sha256:${P.source_hash}`.
// Falls back to string-matching heuristic (matching filenames or topics) and marks as heuristic.
function detectClosures(
  proposals: ChordRef[],
  allChords: ChordRef[],
  bodies: Map<string, string>,
): Map<string, Closure> {
  const result = new Map<string, Closure>();
  for (const p of proposals) {
    const stem = p.filename.replace(/\.md$/, "");
    const topic = p.topic;
    const closedBy: ChordRef[] = [];
    let closureType: "explicit" | "heuristic" | null = null;

    // First attempt: explicit content-addressed matching
    for (const c of allChords) {
      if (c.filename === p.filename) continue;
      if (c.sort_key <= p.sort_key) continue;
      const isReceiptLike = c.mode === "receipt" || c.stance === "RECEIPT" ||
        c.stance === "AYE";
      if (!isReceiptLike) continue;

      const target = `sha256:${p.source_hash}`;
      const closesBodyHash = normalizedSha256Ref(c.closes?.body_hash);
      const directClosesHash = normalizedSha256Ref(c.closes_hash);
      if (closesBodyHash === target || directClosesHash === target) {
        closedBy.push(c);
        closureType = "explicit";
      }
    }

    // Second attempt: fallback to heuristic matching
    if (closedBy.length === 0) {
      for (const c of allChords) {
        if (c.filename === p.filename) continue;
        if (c.sort_key <= p.sort_key) continue;
        const isReceiptLike = c.mode === "receipt" || c.stance === "RECEIPT" ||
          c.stance === "AYE";
        if (!isReceiptLike) continue;

        const body = bodies.get(c.filename) ?? "";
        if (
          body.includes(p.filename) || body.includes(stem) ||
          (topic && topic.length >= 8 && body.includes(topic))
        ) {
          closedBy.push(c);
          closureType = "heuristic";
        }
      }
    }

    result.set(p.filename, {
      closed: closedBy.length > 0,
      closedBy,
      type: closureType,
    });
  }
  return result;
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
    } catch { /* skip */ }
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
  closures: Map<string, Closure>,
  receipts: Receipts,
): string {
  const byBucket = new Map<string, OrganHorizon[]>();
  for (const h of horizons) {
    const list = byBucket.get(h.bucket) ?? [];
    list.push(h);
    byBucket.set(h.bucket, list);
  }

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

  const allProposals = chords.filter((c) =>
    c.mode === "proposal" || c.stance === "PROPOSE" ||
    /PROPOSE/.test(c.stance ?? "")
  );
  const openProposals = allProposals.filter((p) =>
    !(closures.get(p.filename)?.closed)
  );
  const closedProposals = allProposals.filter((p) =>
    closures.get(p.filename)?.closed
  );

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8D00_roadmap_gen.ts — do not edit by hand. -->`,
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
    `*Generated. Fourth axis: "куди іти?". Pairs with x8888_agents.myc.md (state), x8888_skills.myc.md (skill), x8888_<voice>_memory.myc.md (memory).*`,
  );
  lines.push(``);
  lines.push(
    `*v0 scope: reads SOURCES directly (organ horizons + tracked chords + voice profiles). Does NOT yet consume generated state/skill/memory output files; cross-axis downstream consumption is deferred.*`,
  );
  lines.push(``);
  lines.push(
    `*v2 closure detection: explicit \`closes_hash\` / \`closes.body_hash\` matches proposal source hashes first; legacy receipt-like filename/stem/topic references remain as heuristic fallback.*`,
  );
  lines.push(``);

  lines.push(`## Pulling forward — horizons declared by organs`);
  lines.push(``);
  if (horizons.length === 0) {
    lines.push(
      `(no organs have declared horizons yet — sparse roadmap; substrate not yet pulling in any direction)`,
    );
    lines.push(``);
  } else {
    lines.push(
      `Aggregated from \`horizon:\` header fields. Each line is what THAT organ thinks should come next.`,
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
  }

  lines.push(`## In motion — recent chord activity (last 14 days)`);
  lines.push(``);
  lines.push(`| activity | count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| recent proposals | ${recentProposals.length} |`);
  lines.push(`| recent cowitness rounds | ${recentCowitness.length} |`);
  lines.push(`| recent receipts (closures) | ${recentReceipts.length} |`);
  lines.push(``);
  lines.push(`## Open commitments (all-time, after v1 closure detection)`);
  lines.push(``);
  lines.push(`| proposals total | likely closed | still open |`);
  lines.push(`|-----------------|---------------|------------|`);
  lines.push(
    `| ${allProposals.length} | ${closedProposals.length} | ${openProposals.length} |`,
  );
  lines.push(``);

  if (openProposals.length > 0) {
    lines.push(`### Still open (no receipt-like reference detected)`);
    lines.push(``);
    for (const p of openProposals.slice(-15).reverse()) {
      lines.push(`- \`${p.filename}\` (by ${p.voice}) — ${p.topic}`);
    }
    lines.push(``);
  }

  if (closedProposals.length > 0) {
    lines.push(`### Likely closed`);
    lines.push(``);
    lines.push(
      `<details><summary>${closedProposals.length} proposals with receipt-like references</summary>`,
    );
    lines.push(``);
    for (const p of closedProposals.slice(-15).reverse()) {
      const cls = closures.get(p.filename)!;
      const cb = cls.closedBy;
      const typeStr = cls.type ? ` [${cls.type}]` : "";
      const refs = cb.slice(0, 2).map((c) => `\`${c.filename}\``).join(", ") +
        (cb.length > 2 ? ` (+${cb.length - 2} more)` : "");
      lines.push(`- \`${p.filename}\` (by ${p.voice})${typeStr} — ${p.topic}`);
      lines.push(`  - referenced by: ${refs}`);
    }
    lines.push(``);
    lines.push(`</details>`);
    lines.push(``);
  }

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

  lines.push(`## Per-voice roadmaps`);
  lines.push(``);
  lines.push(`| voice | drill |`);
  lines.push(`|-------|-------|`);
  for (const v of voices) {
    lines.push(
      `| ${v.identity} | [x8D00_${v.key}_roadmap.myc.md](./x8D00_${v.key}_roadmap.myc.md) |`,
    );
  }
  lines.push(``);

  return lines.join("\n");
}

function renderVoiceRoadmap(
  voice: VoiceProfile,
  voiceChords: ChordRef[],
  substrateHorizons: OrganHorizon[],
  closures: Map<string, Closure>,
  receipts: Receipts,
): string {
  const recent = voiceChords.slice(-10).reverse();
  const myProposals = voiceChords.filter((c) =>
    c.mode === "proposal" || c.stance === "PROPOSE" ||
    /PROPOSE/.test(c.stance ?? "")
  );
  const myOpenProposals = myProposals.filter((p) =>
    !(closures.get(p.filename)?.closed)
  );
  const myClosedProposals = myProposals.filter((p) =>
    closures.get(p.filename)?.closed
  );

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
    `<!-- AUTO-GENERATED by src/x8D00_roadmap_gen.ts — do not edit by hand. -->`,
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
  lines.push(`# ${voice.identity} — roadmap (frontier tension)`);
  lines.push(``);
  lines.push(
    `*Where this voice is being pulled next. Derived from voice profile + voice's chord trail + substrate's declared horizons.*`,
  );
  lines.push(``);

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

  if (myProposals.length > 0) {
    lines.push(`## Open commitments — proposals I authored`);
    lines.push(``);
    lines.push(
      `> v2 closure detection: explicit \`closes_hash\` / \`closes.body_hash\` first; legacy receipt-like filename/stem/topic references remain heuristic fallback.`,
    );
    lines.push(``);
    lines.push(
      `Authored: ${myProposals.length} · likely closed: ${myClosedProposals.length} · still open: ${myOpenProposals.length}`,
    );
    lines.push(``);
    if (myOpenProposals.length > 0) {
      lines.push(`### Still open`);
      lines.push(``);
      for (const c of myOpenProposals.slice(-10).reverse()) {
        lines.push(`- \`${c.filename}\` — ${c.topic}`);
      }
      lines.push(``);
    }
    if (myClosedProposals.length > 0) {
      lines.push(`### Likely closed`);
      lines.push(``);
      for (const c of myClosedProposals.slice(-10).reverse()) {
        const cls = closures.get(c.filename)!;
        const cb = cls.closedBy;
        const typeStr = cls.type ? ` [${cls.type}]` : "";
        const refs = cb.slice(0, 2).map((r) => `\`${r.filename}\``).join(", ") +
          (cb.length > 2 ? ` (+${cb.length - 2})` : "");
        lines.push(`- \`${c.filename}\`${typeStr} — ${c.topic}`);
        lines.push(`  - by: ${refs}`);
      }
      lines.push(``);
    }
  }

  if (comfortFit.length > 0) {
    lines.push(
      `## Comfort-fit work — substrate horizons in my high-comfort buckets`,
    );
    lines.push(``);
    lines.push(
      `Substrate has declared horizons in buckets matching this voice's top 2 comfort axes. Natural moves for this voice.`,
    );
    lines.push(``);
    for (const line of comfortFit) lines.push(line);
    lines.push(``);
  }

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
  const horizons = await loadOrganHorizons();
  const { chords, bodies } = await loadChords();
  const voices = await loadVoices();
  const generated_at = args.stable ? null : new Date().toISOString();

  const chordsByVoice = new Map<string, ChordRef[]>();
  for (const c of chords) {
    const list = chordsByVoice.get(c.voice) ?? [];
    list.push(c);
    chordsByVoice.set(c.voice, list);
  }

  const allProposals = chords.filter((c) =>
    c.mode === "proposal" || c.stance === "PROPOSE" ||
    /PROPOSE/.test(c.stance ?? "")
  );
  const closures = detectClosures(allProposals, chords, bodies);

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

  if (!args.voice) {
    const path = join(OUT, "x8D00_roadmap.myc.md");
    await Deno.writeTextFile(
      path,
      renderSubstrateRoadmap(
        horizons,
        chords,
        voices,
        closures,
        globalReceipts,
      ) + "\n",
    );
    await Deno.writeTextFile(
      join(OUT, "x8D00_roadmap.manifest.json"),
      canonicalManifest(allSources) + "\n",
    );
    console.log(
      `[write] x8D00_roadmap.myc.md (substrate; ${horizons.length} horizons, ${chords.length} chords)`,
    );
    written += 2;
  }

  const voicesToProcess = args.voice
    ? voices.filter((v) => v.key === args.voice)
    : voices;
  for (const voice of voicesToProcess) {
    const vChords = chordsByVoice.get(voice.key) ?? [];
    const voiceSources: SourceFile[] = [
      voiceSource(voice),
      ...vChords.map(chordSource),
      ...horizons.map(organSource),
    ];
    const vHash = await manifestHash(voiceSources);
    const receipts: Receipts = {
      generated_at,
      manifest_hash: vHash,
      source_files: voiceSources.length,
    };
    const path = join(OUT, `x8D00_${voice.key}_roadmap.myc.md`);
    await Deno.writeTextFile(
      path,
      renderVoiceRoadmap(voice, vChords, horizons, closures, receipts) + "\n",
    );
    await Deno.writeTextFile(
      join(OUT, `x8D00_${voice.key}_roadmap.manifest.json`),
      canonicalManifest(voiceSources) + "\n",
    );
    console.log(
      `[write] x8D00_${voice.key}_roadmap.myc.md (${vChords.length} chords)`,
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
