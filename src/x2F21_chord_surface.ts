// src/x2F21_chord_surface.ts — shared chord surface enumeration
// position: 2/F21 → mirror(2) × external-surface(F) × mirror(2) × first(1)
// hex_dipole: "33 00 93 00 00 00 33 59"
//   mirror_apex-1.09 (PRIMARY: indexes chord surface mirror)
//   completion_frontier+0.89 (normalizes legacy/topological boundary)
//   mirror_apex+0.40 (flat-id resolution across surfaces)
//   harmony_emergence+0.40 (shared reader coherence)
// placement_policy: axis
// intent: enumerate legacy and topological chord files through one flat surface API
// maturity: active
// skill_safe: yes-readonly
// Library-only: no import.meta.main, no dispatcher entry.

import {
  basename,
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
export const ROOT = dirname(HERE);
const LEGACY_CHORDS_DIR = join(ROOT, "jazz", "chords");
const SRC_DIR = join(ROOT, "src");

export interface ChordSurfaceFile {
  relPath: string;
  fullPath: string;
  name: string;
  flatId: string;
  surface: "legacy" | "topological";
}

const CHORD_BLOCK_REF = 950000;
const CHORD_EPOCH_REF = 1779148800; // 2026-05-19T00:00:00Z

export async function gitTrackedSet(pathspec?: string): Promise<Set<string>> {
  const args = ["-C", ROOT, "ls-files"];
  if (pathspec) args.push(pathspec);
  const proc = new Deno.Command("git", {
    args,
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  if (out.code !== 0) return new Set();
  return new Set(
    new TextDecoder().decode(out.stdout).split("\n").map((s) => s.trim())
      .filter(Boolean),
  );
}

function isTopologicalChordName(name: string): boolean {
  return /^x[0-9A-Fa-f]{4}_(?:\d+|t\d{14})_[a-z0-9-]+_.+\.myc\.md$/.test(
    name,
  );
}

async function collectLegacy(out: ChordSurfaceFile[]): Promise<void> {
  try {
    for await (const entry of Deno.readDir(LEGACY_CHORDS_DIR)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      const relPath = `jazz/chords/${entry.name}`;
      out.push({
        relPath,
        fullPath: join(LEGACY_CHORDS_DIR, entry.name),
        name: entry.name,
        flatId: entry.name.replace(/\.md$/, ""),
        surface: "legacy",
      });
    }
  } catch { /* legacy chord dir may disappear after migration */ }
}

async function collectTopological(out: ChordSurfaceFile[]): Promise<void> {
  try {
    for await (const entry of Deno.readDir(SRC_DIR)) {
      if (!entry.isFile || !isTopologicalChordName(entry.name)) continue;
      const relPath = `src/${entry.name}`;
      out.push({
        relPath,
        fullPath: join(SRC_DIR, entry.name),
        name: entry.name,
        flatId: basename(entry.name).replace(/\.myc\.md$/, ""),
        surface: "topological",
      });
    }
  } catch { /* src always exists, but keep helper total */ }
}

export async function listChordSurfaceFiles(options: {
  stable?: boolean;
  tracked?: Set<string>;
} = {}): Promise<ChordSurfaceFile[]> {
  const out: ChordSurfaceFile[] = [];
  await collectLegacy(out);
  await collectTopological(out);

  const tracked = options.stable
    ? options.tracked ?? await gitTrackedSet()
    : null;
  const filtered = tracked ? out.filter((f) => tracked.has(f.relPath)) : out;

  filtered.sort((a, b) => {
    if (a.flatId !== b.flatId) return a.flatId.localeCompare(b.flatId);
    return a.relPath.localeCompare(b.relPath);
  });
  return filtered;
}

export function normalizeChordRef(ref: string): string {
  return ref
    .replace(/^(\.\.\/)?jazz\/chords\//, "")
    .replace(/^src\//, "")
    .replace(/\.myc\.md$/, "")
    .replace(/\.md$/, "");
}

export function chordDateFromName(name: string): Date | null {
  const topoTimeM =
    /^x[0-9A-Fa-f]{4}_t(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})_/.exec(
      name,
    );
  if (topoTimeM) {
    const [, y, mo, d, h, mi, s] = topoTimeM;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  }

  const blockM = /^x[0-9A-Fa-f]{4}_(\d+)_/.exec(name);
  if (blockM) {
    const block = parseInt(blockM[1], 10);
    const epoch = CHORD_EPOCH_REF + (block - CHORD_BLOCK_REF) * 600;
    return new Date(epoch * 1000);
  }

  const oldM = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})Z/.exec(name);
  if (oldM) {
    const [, y, mo, d, h, mi, s] = oldM;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  }

  const protoM = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})Z?/.exec(name);
  if (protoM) {
    const [, y, mo, d, h, mi, s] = protoM;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  }

  return null;
}

export function chordBlockHeightFromName(name: string): number {
  const blockM = /^x[0-9A-Fa-f]{4}_(\d+)_/.exec(name);
  if (blockM) return parseInt(blockM[1], 10);
  const date = chordDateFromName(name);
  if (!date) return 0;
  return CHORD_BLOCK_REF +
    Math.floor((Math.floor(date.getTime() / 1000) - CHORD_EPOCH_REF) / 600);
}
