#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
// src/x8E00_probes_gen.ts — probes / experimental frontier generator
// position: 8/E → cache(8) × harmony-pair(E) = experimental state cached for self-reflection
// hex_dipole: "93 00 33 00 00 00 33 33"
//   void_infinity-0.85 (PRIMARY: cache pole; bucket 8 PAIR-MATCH)
//   mirror_apex+0.40 (probe state mirrored against live organs)
//   harmony_emergence+0.40 (probes synthesize experimental harmony)
//   completion_frontier+0.40 (graduation = completion event)
// placement_policy: axis
// intent: scan probes/ subdirs, classify each probe's status (graduated / partial / deferred / active / unknown), render x8E00_probes.myc.md
// maturity: active
// horizon: declarative graduation_target field in SPEC frontmatter for semantic links beyond lexical matching (graduation drift landed 2026-05-28 via strict-handle exact-match — drift_target field + render section)
// skill_tag: probes
// skill_safe: yes-with-care
//
// probes_gen — fifth self-description axis ("що я експериментую?")
//
// Pairs with:
//   x8800_agents_gen — agents ("що я бачу")
//   x8A00_voice_memory_gen — memory ("що я лишив")
//   x8C00_skill_gen — skill ("як рухатись")
//   x8D00_roadmap_gen — roadmap ("куди йти")
//
// Substrate-pointed by:
//   - probes/INDEX.md's own self-declaration ("should become generated")
//   - survey chord x2200_950295 finding #3 (graduation-tracking gap)
//   - architect's "generate from state, not author docs" principle
//
// Status detection (highest signal first):
//   1. README.md `> **Status: graduated 2026-... → src/xNNNN_*`     — explicit banner (new format)
//   2. SPEC.md   `> **Status: graduated 2026-... → src/xNNNN_*`     — same banner pattern, older file
//   3. SPEC.md `## Status\n\n<content>` first non-blank line         — pre-banner format
//   4. Filename inference — if src/x<NNNN>_<base>*.ts exists (where
//      <base> is probe handle minus -vN suffix), mark "likely graduated"
//   5. Default — "unknown" (probe dir exists, no signal detected)
//
// Reads:
//   probes/<probe>/README.md  (status banner)
//   probes/<probe>/SPEC.md    (status section, fallback)
//   src/x*.ts                 (filename inference)
//   jazz/chords/*.md          (chord references — finds chords mentioning
//                              probes/<probe>/; surfaces activity per probe)
//
// Renders (gitignored):
//   src/x8E00_probes.myc.md          substrate-wide probe index
//   src/x8E00_probes.manifest.json   source manifest sidecar
//
// Subcommands:
//   t probes              regenerate index
//   t probes --stable     deterministic (no generated_at)
//
// Glossary words: probes, experiments, trials, probe-index, експерименти

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { formatGeneratedFile } from "./x0012_generated_format.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const TRINITY_ROOT = dirname(HERE);
const SRC = HERE;
const PROBES_DIR = join(TRINITY_ROOT, "probes");
const OUT = HERE;

const BANNER_STATUS_RE = /^>\s*\*\*Status:\s*([^*]+?)\*\*\s*(.*?)$/m;
const SPEC_STATUS_SECTION_RE = /^##\s+Status\s*$/m;
const ORGAN_FILE_RE = /^x([0-9A-Fa-f])([0-9A-Fa-f]{3})_([^.]+)\.ts$/;
const GRADUATED_TARGET_RE = /(?:→|->)\s*`?(src\/x[0-9A-Fa-f]{4}_[^`\s]+\.ts)`?/;
const GRADUATED_CONTRACT_RE =
  /(?:→|->)\s*([A-Z_]+\.v\d+(?:\.\d+)?)\s*contract/i;

// Types exported for cross-axis consumers (x8D00_roadmap_gen, x2F00_self).
export type StatusKind =
  | "graduated"
  | "graduated_contract"
  | "meta_graduated"
  | "meta"
  | "partial"
  | "deferred"
  | "active"
  | "unknown";

// Lifecycle stage — per codex audit 2026-05-23 R2: probe lifecycle
// projection. 4-state model orthogonal to fine-grained StatusKind:
//   promoted — probe pattern has landed as live organ/contract/convention
//   active   — probe still being worked or perpetual watchdog
//   compost  — probe explicitly retired (currently none; needs explicit marking)
//   archived — probe is historical artifact (currently none; explicit marking)
//
// Codex required this so `t probes` displays promoted/compost state
// BEFORE files move/disappear in subsequent cleanup work.
export type LifecycleStage = "promoted" | "active" | "compost" | "archived";

function lifecycleOf(status: StatusKind): LifecycleStage {
  switch (status) {
    case "graduated":
    case "graduated_contract":
    case "meta_graduated":
      return "promoted";
    case "meta":
    case "active":
    case "partial":
    case "deferred":
    case "unknown":
      return "active";
  }
}

export interface ProbeRecord {
  name: string;
  rel_path: string;
  status: StatusKind;
  status_detail: string;
  status_source:
    | "readme_banner"
    | "spec_banner"
    | "spec_section"
    | "filename_match"
    | "default";
  target: string | null;
  graduation_date: string | null;
  source_hash: string;
  source_size: number;
  chord_refs: ChordRef[];
  // Lifecycle stage — codex audit 2026-05-23 R2.
  // Derived from status by lifecycleOf(). Compost/archived states
  // require explicit marking (not yet implemented; no probe currently
  // has explicit compost/archive declaration).
  lifecycle: LifecycleStage;
  // Graduation drift — orthogonal signal per x8E00 horizon.
  // Why: probe doc still says active/partial/deferred but a tracked organ
  // matches its handle. That means docs lag behind substrate — the probe
  // pattern already landed but its README/SPEC banner was not updated.
  // How to apply: render in a separate "Graduation drift" section so
  // closure work can update the probe banner instead of repeating it.
  drift_target: string | null;
}

export interface ChordRef {
  filename: string;
  block_height: number;
  is_receipt: boolean;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(buf)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
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

function classifyBannerStatus(label: string): StatusKind {
  const l = label.toLowerCase().trim();
  if (l.startsWith("meta-graduated")) return "meta_graduated";
  if (l.startsWith("meta")) return "meta";
  if (l.startsWith("graduated (contract")) return "graduated_contract";
  if (l.startsWith("graduated")) return "graduated";
  if (l.startsWith("partial")) return "partial";
  if (l.startsWith("deferred")) return "deferred";
  if (l.startsWith("active")) return "active";
  return "unknown";
}

function extractGraduationDate(label: string): string | null {
  const m = /\b(\d{4}-\d{2}-\d{2})\b/.exec(label);
  return m ? m[1] : null;
}

function extractTarget(banner: string): string | null {
  const organM = GRADUATED_TARGET_RE.exec(banner);
  if (organM) return organM[1];
  const contractM = GRADUATED_CONTRACT_RE.exec(banner);
  if (contractM) return `${contractM[1]} contract`;
  return null;
}

async function findOrganForProbe(
  probeName: string,
  trackedOrgans: Set<string>,
): Promise<string | null> {
  // Strip -v\d+ suffix and -v0 / -v1 etc. handles
  const base = probeName.replace(/-v\d+$/, "");
  // Try substring match against any tracked organ in src/
  for (const path of trackedOrgans) {
    if (!path.startsWith("src/")) continue;
    const m = ORGAN_FILE_RE.exec(path.slice(4));
    if (!m) continue;
    const organHandle = m[3];
    // Loose match: organ handle contains probe base (or vice versa)
    if (organHandle.includes(base) || base.includes(organHandle)) {
      return path;
    }
  }
  return null;
}

// Strict-handle match — drift detection only.
// Why: substring match yields false positives like
// "voices-routing-falsifier" matching "voices" organ. The probe's claim
// "I'm still active" is explicit, so the override needs an exact signal,
// not a loose substring. This is the lexical fallback while the horizon's
// declarative `graduation_target` frontmatter field is still pending.
function normalizeHandle(s: string): string {
  return s.replace(/[-_]/g, "").toLowerCase();
}
async function findExactOrganForProbe(
  probeName: string,
  trackedOrgans: Set<string>,
): Promise<string | null> {
  const base = normalizeHandle(probeName.replace(/-v\d+$/, ""));
  for (const path of trackedOrgans) {
    if (!path.startsWith("src/")) continue;
    const m = ORGAN_FILE_RE.exec(path.slice(4));
    if (!m) continue;
    if (normalizeHandle(m[3]) === base) return path;
  }
  return null;
}

// Chord-reference scanning: cross-axis composition with chord pressure.
// For each probe, find tracked chord files whose body or filename mentions
// `probes/<probe-name>/`. Returns deduplicated list sorted by block height ascending.
interface ChordSource {
  filename: string;
  body: string;
  hash: string;
  size: number;
}

const CHORD_NEW_FORM = /^x[0-9A-Fa-f]{4}_(\d+)_/;
const CHORD_OLD_FORM = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})Z/;
// Proto-form: pre-T-Z bootstrap timestamps from May 9-10 2026.
const CHORD_PROTO_FORM = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/;
const CHORD_BLOCK_REF = 950000;
const CHORD_EPOCH_REF = 1779148800; // 2026-05-19T00:00:00Z

function chordBlockHeight(filename: string): number {
  const n = CHORD_NEW_FORM.exec(filename);
  if (n) return parseInt(n[1], 10);
  const o = CHORD_OLD_FORM.exec(filename) ?? CHORD_PROTO_FORM.exec(filename);
  if (!o) return 0;
  const [, y, mo, d, h, mi, s] = o;
  const epoch = Math.floor(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) / 1000);
  return CHORD_BLOCK_REF + Math.floor((epoch - CHORD_EPOCH_REF) / 600);
}

function isReceiptFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return /receipt|aye|verdict/.test(lower);
}

async function loadChordSources(): Promise<ChordSource[]> {
  const tracked = await gitTrackedSet("jazz/chords");
  const out: ChordSource[] = [];
  const chordsDir = join(TRINITY_ROOT, "jazz", "chords");
  for await (const entry of Deno.readDir(chordsDir)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    if (!tracked.has(`jazz/chords/${entry.name}`)) continue;
    const bytes = await Deno.readFile(join(chordsDir, entry.name));
    const text = new TextDecoder().decode(bytes);
    out.push({
      filename: entry.name,
      body: text,
      hash: await sha256Hex(bytes),
      size: bytes.length,
    });
  }
  return out;
}

function findChordRefs(
  probeName: string,
  chords: ChordSource[],
): { refs: ChordRef[]; matchedFilenames: string[] } {
  const needle = `probes/${probeName}/`;
  const refs: ChordRef[] = [];
  const matchedFilenames: string[] = [];
  for (const c of chords) {
    if (!c.body.includes(needle)) continue;
    refs.push({
      filename: c.filename,
      block_height: chordBlockHeight(c.filename),
      is_receipt: isReceiptFilename(c.filename),
    });
    matchedFilenames.push(c.filename);
  }
  refs.sort((a, b) => a.block_height - b.block_height);
  return { refs, matchedFilenames };
}

async function readProbe(
  probeName: string,
  trackedOrgans: Set<string>,
  chords: ChordSource[],
): Promise<ProbeRecord | null> {
  const dir = join(PROBES_DIR, probeName);
  let stat: Deno.FileInfo;
  try {
    stat = await Deno.stat(dir);
  } catch {
    return null;
  }
  if (!stat.isDirectory) return null;

  const readmePath = join(dir, "README.md");
  const specPath = join(dir, "SPEC.md");

  let readme = "", spec = "";
  try {
    readme = await Deno.readTextFile(readmePath);
  } catch { /* no README */ }
  try {
    spec = await Deno.readTextFile(specPath);
  } catch { /* no SPEC */ }

  let status: StatusKind = "unknown";
  let status_detail = "";
  let status_source: ProbeRecord["status_source"] = "default";
  let target: string | null = null;
  let graduation_date: string | null = null;

  // Layer 1: README banner
  const readmeBannerM = readme ? BANNER_STATUS_RE.exec(readme) : null;
  // Layer 2: SPEC.md top banner (same pattern, older file)
  const specBannerM = spec ? BANNER_STATUS_RE.exec(spec) : null;
  const bannerM = readmeBannerM ?? specBannerM;

  if (bannerM) {
    const label = bannerM[1].trim();
    const rest = bannerM[2].trim();
    const fullBanner = label + " " + rest;
    status = classifyBannerStatus(label);
    status_detail = label;
    status_source = readmeBannerM ? "readme_banner" : "spec_banner";
    target = extractTarget(fullBanner);
    graduation_date = extractGraduationDate(label);
  } else if (spec) {
    // Layer 3: SPEC.md `## Status` section (pre-banner format)
    const sectM = SPEC_STATUS_SECTION_RE.exec(spec);
    if (sectM) {
      const after = spec.slice(sectM.index + sectM[0].length);
      const firstPara = after.split(/\n\s*\n/)[0].trim();
      const firstLine = firstPara.split("\n")[0].trim();
      if (firstLine) {
        status_detail = firstLine.slice(0, 200);
        status_source = "spec_section";
        // Best-effort classification
        const l = firstLine.toLowerCase();
        if (/graduat/.test(l)) status = "graduated";
        else if (/defer/.test(l)) status = "deferred";
        else if (/partial/.test(l)) status = "partial";
        else if (/active|trial|under construction|in progress/.test(l)) {
          status = "active";
        } else status = "active";
        target = extractTarget(firstPara);
        graduation_date = extractGraduationDate(firstLine);
      }
    }
  }

  // Layer 3: filename inference (only if still unknown)
  if (status === "unknown") {
    const guessed = await findOrganForProbe(probeName, trackedOrgans);
    if (guessed) {
      status = "graduated";
      status_detail = "likely graduated (filename inference)";
      status_source = "filename_match";
      target = guessed;
    }
  }

  // Graduation drift: probe declares active/partial/deferred but a tracked
  // organ exactly matches its handle. Surfaces "doc lag" so closure work
  // can update the probe banner. Uses strict equality (not the loose
  // substring used for unknown→graduated promotion) to avoid false
  // positives like "voices-routing-falsifier" hitting "voices" organ.
  let drift_target: string | null = null;
  if (lifecycleOf(status) === "active") {
    const drift = await findExactOrganForProbe(probeName, trackedOrgans);
    if (drift && drift !== target) drift_target = drift;
  }

  // Hash basis: README + SPEC concatenated (or empty bytes if neither)
  const basis = new TextEncoder().encode(readme + "\n---\n" + spec);
  const hash = await sha256Hex(basis);

  const { refs: chord_refs } = findChordRefs(probeName, chords);

  return {
    name: probeName,
    rel_path: `probes/${probeName}/`,
    status,
    status_detail,
    status_source,
    target,
    graduation_date,
    source_hash: hash,
    source_size: basis.length,
    chord_refs,
    lifecycle: lifecycleOf(status),
    drift_target,
  };
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
function probeSource(p: ProbeRecord): SourceFile {
  return {
    path: p.rel_path,
    hash: `sha256:${p.source_hash}`,
    size: p.source_size,
  };
}

const STATUS_ORDER: StatusKind[] = [
  "graduated",
  "graduated_contract",
  "meta_graduated",
  "meta",
  "partial",
  "deferred",
  "active",
  "unknown",
];

const STATUS_LABEL: Record<StatusKind, string> = {
  graduated: "Graduated",
  graduated_contract: "Graduated (contract)",
  meta_graduated: "Meta-graduated",
  meta: "Meta (no graduation expected)",
  partial: "Partial",
  deferred: "Deferred",
  active: "Active",
  unknown: "Unknown",
};

function renderProbesIndex(
  probes: ProbeRecord[],
  receipts: {
    generated_at: string | null;
    manifest_hash: string;
    source_files: number;
  },
): string {
  const byStatus = new Map<StatusKind, ProbeRecord[]>();
  for (const k of STATUS_ORDER) byStatus.set(k, []);
  for (const p of probes) byStatus.get(p.status)!.push(p);
  for (const list of byStatus.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8E00_probes_gen.ts — do not edit by hand. -->`,
  );
  if (receipts.generated_at) {
    lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  }
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(`<!-- probes: ${probes.length} -->`);
  lines.push(``);
  lines.push(`# Substrate probes — experimental frontier`);
  lines.push(``);
  lines.push(
    `*Generated. Fifth axis: "що я експериментую?". Pairs with x8888_agents.myc.md (state), x8888_skills.myc.md (skill), x8888_<voice>_memory.myc.md (memory), x8D00_roadmap.myc.md (roadmap).*`,
  );
  lines.push(``);
  lines.push(
    `*Status detected from (highest first): README banner → SPEC top banner → SPEC \`## Status\` section → filename inference → default unknown. Each probe also surfaces chord activity (count, latest, latest receipt) from cross-axis scan of \`jazz/chords/\`.*`,
  );
  lines.push(``);

  // Summary table — by status (fine-grained)
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`### By status (fine-grained)`);
  lines.push(``);
  lines.push(`| status | count |`);
  lines.push(`|--------|-------|`);
  for (const k of STATUS_ORDER) {
    const n = byStatus.get(k)!.length;
    if (n === 0) continue;
    lines.push(`| ${STATUS_LABEL[k]} | ${n} |`);
  }
  lines.push(`| **total** | **${probes.length}** |`);
  lines.push(``);

  // Summary by lifecycle stage (4-state model per codex audit 2026-05-23 R2)
  const byLifecycle = new Map<LifecycleStage, number>();
  for (const p of probes) {
    byLifecycle.set(p.lifecycle, (byLifecycle.get(p.lifecycle) ?? 0) + 1);
  }
  lines.push(
    `### By lifecycle stage (codex R2: promoted/active/compost/archived)`,
  );
  lines.push(``);
  lines.push(`| lifecycle | count |`);
  lines.push(`|-----------|-------|`);
  for (const stage of ["promoted", "active", "compost", "archived"] as const) {
    const n = byLifecycle.get(stage) ?? 0;
    lines.push(`| ${stage} | ${n} |`);
  }
  lines.push(`| **total** | **${probes.length}** |`);
  lines.push(``);
  lines.push(
    `Lifecycle derived from status via lifecycleOf(): graduated*/meta-graduated → promoted; meta/active/partial/deferred/unknown → active. Compost and archived states require explicit marking (none yet declared). Per codex R2: \`t probes\` MUST display promoted/compost state before any probe file moves or disappears.`,
  );
  lines.push(``);

  // Graduation drift — probes whose docs say active but a tracked organ
  // matches the handle. Signals doc-lag closure work.
  const drifting = probes.filter((p) => p.drift_target !== null);
  if (drifting.length > 0) {
    lines.push(`## Graduation drift (${drifting.length})`);
    lines.push(``);
    lines.push(
      `Probes whose declared status is still active/partial/deferred but a tracked organ matches the probe handle. The probe pattern has likely landed; the README/SPEC banner just lags behind. Close by updating the probe banner with \`> **Status: graduated YYYY-MM-DD → src/x...**\`.`,
    );
    lines.push(``);
    lines.push(`| probe | declared | drift target |`);
    lines.push(`|-------|----------|--------------|`);
    for (const p of drifting) {
      lines.push(
        `| \`${p.name}\` | ${STATUS_LABEL[p.status]} | \`${p.drift_target}\` |`,
      );
    }
    lines.push(``);
  }

  // By status
  for (const k of STATUS_ORDER) {
    const list = byStatus.get(k)!;
    if (list.length === 0) continue;
    lines.push(`## ${STATUS_LABEL[k]} (${list.length})`);
    lines.push(``);
    for (const p of list) {
      const target = p.target ? ` → \`${p.target}\`` : "";
      const date = p.graduation_date ? ` [${p.graduation_date}]` : "";
      const src = ` _(via ${p.status_source.replace("_", " ")})_`;
      lines.push(`- \`${p.name}\`${target}${date}${src}`);
      if (
        p.status_detail && p.status_source !== "readme_banner" &&
        p.status_source !== "spec_banner" && p.status_source !== "default"
      ) {
        lines.push(`  - ${p.status_detail}`);
      }
      if (p.chord_refs.length > 0) {
        const latest = p.chord_refs[p.chord_refs.length - 1];
        const receipts = p.chord_refs.filter((c) => c.is_receipt);
        const latestReceipt = receipts.length > 0
          ? receipts[receipts.length - 1]
          : null;
        const parts = [
          `${p.chord_refs.length} chord ref${
            p.chord_refs.length === 1 ? "" : "s"
          }`,
          `latest: \`${latest.filename}\` (block ${latest.block_height})`,
        ];
        if (latestReceipt && latestReceipt.filename !== latest.filename) {
          parts.push(
            `latest receipt: \`${latestReceipt.filename}\` (block ${latestReceipt.block_height})`,
          );
        }
        lines.push(`  - ${parts.join("; ")}`);
      }
    }
    lines.push(``);
  }

  return lines.join("\n");
}

interface Args {
  stable: boolean;
}
function parseArgs(argv: string[]): Args {
  const out: Args = { stable: false };
  for (const a of argv) {
    if (a === "--stable") out.stable = true;
  }
  return out;
}

function chordSource(c: ChordSource): SourceFile {
  return {
    path: `jazz/chords/${c.filename}`,
    hash: `sha256:${c.hash}`,
    size: c.size,
  };
}

// Public loader — used by main() AND cross-axis consumers (x8D00 roadmap
// surfaces non-graduated probes with chord pressure as "experimental
// horizons"). Returns probes sorted alphabetically, plus the set of
// chord filenames they referenced (for source-manifest building).
export async function loadAllProbes(): Promise<
  { probes: ProbeRecord[]; referencedChordFilenames: Set<string> }
> {
  const trackedOrgans = await gitTrackedSet("src");
  const chords = await loadChordSources();
  const probes: ProbeRecord[] = [];
  const referencedChordFilenames = new Set<string>();
  for await (const entry of Deno.readDir(PROBES_DIR)) {
    if (!entry.isDirectory) continue;
    const rec = await readProbe(entry.name, trackedOrgans, chords);
    if (rec) {
      probes.push(rec);
      for (const r of rec.chord_refs) referencedChordFilenames.add(r.filename);
    }
  }
  probes.sort((a, b) => a.name.localeCompare(b.name));
  return { probes, referencedChordFilenames };
}

async function main(argv: string[]) {
  const args = parseArgs(argv);
  const chords = await loadChordSources();
  const { probes, referencedChordFilenames } = await loadAllProbes();

  // Source manifest includes probe sources + ONLY chord files that actually
  // reference a probe (otherwise every chord change would invalidate x8E00,
  // which would be noise — only chord activity that touches probes matters).
  const referencedChordSources = chords
    .filter((c) => referencedChordFilenames.has(c.filename))
    .map(chordSource);
  const allSources: SourceFile[] = [
    ...probes.map(probeSource),
    ...referencedChordSources,
  ];
  const manifest_hash = await manifestHash(allSources);
  const generated_at = args.stable ? null : new Date().toISOString();

  const indexPath = join(OUT, "x8E00_probes.myc.md");
  await Deno.writeTextFile(
    indexPath,
    renderProbesIndex(probes, {
      generated_at,
      manifest_hash,
      source_files: allSources.length,
    }) + "\n",
  );
  await formatGeneratedFile(indexPath);
  const sidecarPath = join(OUT, "x8E00_probes.manifest.json");
  await Deno.writeTextFile(
    sidecarPath,
    canonicalManifest(allSources) + "\n",
  );
  await formatGeneratedFile(sidecarPath);

  console.log(
    `[write] x8E00_probes.myc.md (${probes.length} probes, ${referencedChordSources.length} chord refs)`,
  );
  console.log(
    `[write] x8E00_probes.manifest.json (${allSources.length} entries: ${probes.length} probes + ${referencedChordSources.length} chord refs)`,
  );
  console.log(
    `done. 2 files. manifest_hash=${manifest_hash}${
      args.stable ? " (stable)" : ""
    }`,
  );
}

if (import.meta.main) {
  await main(Deno.args);
}
