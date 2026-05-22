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
// horizon: detect graduation drift (probe marked active but target organ exists); link probe receipts via chord references
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
//   1. README.md `> **Status: graduated 2026-... → src/xNNNN_*`     — explicit banner
//   2. README.md `> **Status: deferred|partial|meta-graduated ...`  — non-graduated banner
//   3. SPEC.md `## Status\n\n<content>` first non-blank line         — older format
//   4. Filename inference — if src/x<NNNN>_<base>*.ts exists (where
//      <base> is probe handle minus -vN suffix), mark "likely graduated"
//   5. Default — "unknown" (probe dir exists, no signal detected)
//
// Reads:
//   probes/<probe>/README.md  (status banner)
//   probes/<probe>/SPEC.md    (status section, fallback)
//   src/x*.ts                 (filename inference)
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

const HERE = dirname(fromFileUrl(import.meta.url));
const TRINITY_ROOT = dirname(HERE);
const SRC = HERE;
const PROBES_DIR = join(TRINITY_ROOT, "probes");
const OUT = HERE;

const README_STATUS_RE =
  /^>\s*\*\*Status:\s*([^*]+?)\*\*\s*(.*?)$/m;
const SPEC_STATUS_SECTION_RE = /^##\s+Status\s*$/m;
const ORGAN_FILE_RE = /^x([0-9A-Fa-f])([0-9A-Fa-f]{3})_([^.]+)\.ts$/;
const GRADUATED_TARGET_RE = /(?:→|->)\s*`?(src\/x[0-9A-Fa-f]{4}_[^`\s]+\.ts)`?/;
const GRADUATED_CONTRACT_RE = /(?:→|->)\s*([A-Z_]+\.v\d+(?:\.\d+)?)\s*contract/i;

type StatusKind =
  | "graduated"
  | "graduated_contract"
  | "meta_graduated"
  | "partial"
  | "deferred"
  | "active"
  | "unknown";

interface ProbeRecord {
  name: string;
  rel_path: string;
  status: StatusKind;
  status_detail: string;
  status_source: "readme_banner" | "spec_section" | "filename_match" | "default";
  target: string | null;
  graduation_date: string | null;
  source_hash: string;
  source_size: number;
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

async function readProbe(
  probeName: string,
  trackedOrgans: Set<string>,
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
  const bannerM = README_STATUS_RE.exec(readme);
  if (bannerM) {
    const label = bannerM[1].trim();
    const rest = bannerM[2].trim();
    const fullBanner = label + " " + rest;
    status = classifyBannerStatus(label);
    status_detail = label;
    status_source = "readme_banner";
    target = extractTarget(fullBanner);
    graduation_date = extractGraduationDate(label);
  } else if (spec) {
    // Layer 2: SPEC.md `## Status` section
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

  // Hash basis: README + SPEC concatenated (or empty bytes if neither)
  const basis = new TextEncoder().encode(readme + "\n---\n" + spec);
  const hash = await sha256Hex(basis);

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
  "partial",
  "deferred",
  "active",
  "unknown",
];

const STATUS_LABEL: Record<StatusKind, string> = {
  graduated: "Graduated",
  graduated_contract: "Graduated (contract)",
  meta_graduated: "Meta-graduated",
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
    `*Status detected from (highest first): README banner → SPEC \`## Status\` section → filename inference (probe handle matches existing organ) → default unknown.*`,
  );
  lines.push(``);

  // Summary table
  lines.push(`## Summary`);
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
        p.status_source !== "default"
      ) {
        lines.push(`  - ${p.status_detail}`);
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

async function main(argv: string[]) {
  const args = parseArgs(argv);
  const trackedOrgans = await gitTrackedSet("src");

  const probes: ProbeRecord[] = [];
  for await (const entry of Deno.readDir(PROBES_DIR)) {
    if (!entry.isDirectory) continue;
    const rec = await readProbe(entry.name, trackedOrgans);
    if (rec) probes.push(rec);
  }
  probes.sort((a, b) => a.name.localeCompare(b.name));

  const allSources: SourceFile[] = probes.map(probeSource);
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
  await Deno.writeTextFile(
    join(OUT, "x8E00_probes.manifest.json"),
    canonicalManifest(allSources) + "\n",
  );

  console.log(
    `[write] x8E00_probes.myc.md (${probes.length} probes)`,
  );
  console.log(
    `[write] x8E00_probes.manifest.json (${probes.length} entries)`,
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
