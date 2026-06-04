#!/usr/bin/env -S deno run --allow-read --allow-write
// src/x8F20_chord_migrate.ts — chord-migrate (jazz/chords → src topology plan)
// position: 8/F2 → cache(8) × external-surface(F) × mirror(2)
// hex_dipole: "93 00 33 00 00 00 33 59"
//   void_infinity-1.09 (PRIMARY: indexes dynamic chord surface for migration)
//   completion_frontier+0.89 (moves legacy boundary into flat topology)
//   mirror_apex+0.40 (rewrites path references to flat ids)
//   harmony_emergence+0.40 (keeps reversible source→target manifest)
// placement_policy: axis
// intent: plan and optionally apply migration of jazz/chords/*.md into src/xNNNN_<block>_<voice>_<slug>.myc.md flat chord topology
// maturity: active
// horizon: teach all chord readers to prefer src topological chords once apply mode is exercised
// skill_tag: chord-migrate
// skill_safe: yes-with-care

import {
  basename,
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { parseFrontmatter } from "./x0020_scanner_core.ts";
import { listChordSurfaceFiles } from "./x2F21_chord_surface.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const LEGACY_CHORDS_DIR = join(ROOT, "jazz", "chords");
const PLAN_PATH = join(HERE, "x8F20_chord_migration_plan.myc.json");

interface MigrationEntry {
  source: string;
  target: string;
  flat_id: string;
  coordinate: string;
  block_key: string;
  voice: string;
  slug: string;
  inferred: {
    coordinate: boolean;
    block_key: boolean;
    voice: boolean;
  };
  warnings: string[];
}

interface Args {
  apply: boolean;
  writePlan: boolean;
  json: boolean;
  limit: number | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    apply: false,
    writePlan: false,
    json: false,
    limit: null,
  };
  for (const arg of argv) {
    if (arg === "--apply") args.apply = true;
    else if (arg === "--write-plan") args.writePlan = true;
    else if (arg === "--json") args.json = true;
    else if (arg.startsWith("--limit=")) {
      const n = Number(arg.slice("--limit=".length));
      if (Number.isFinite(n) && n >= 0) args.limit = Math.floor(n);
    }
  }
  return args;
}

function slugify(value: unknown, fallback = "untitled"): string {
  const s = String(value ?? fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
  return s || fallback;
}

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const s = firstString(item);
      if (s) return s;
    }
  }
  if (value && typeof value === "object") {
    const primary = (value as Record<string, unknown>).primary;
    if (typeof primary === "string" && primary.trim()) return primary.trim();
  }
  return null;
}

function hexFromPosition(value: unknown): string | null {
  const s = firstString(value);
  if (!s) return null;
  const hex = s.match(/hex:([0-9A-Fa-f])/);
  if (hex) return hex[1].toUpperCase();
  const oct = s.match(/oct:([0-9A-Fa-f])/);
  if (oct) return oct[1].toUpperCase();
  return null;
}

function modeHex(value: unknown): string {
  const explicit = hexFromPosition(value);
  if (explicit) return explicit;
  const s = firstString(value)?.toLowerCase() ?? "";
  if (/proposal|propose/.test(s)) return "D";
  if (/receipt/.test(s)) return "7";
  if (/cowitness|witness|aye|review/.test(s)) return "6";
  if (/audit/.test(s)) return "B";
  if (/critique|nay|reject/.test(s)) return "9";
  if (/observation|riff|synthesis/.test(s)) return "3";
  return "0";
}

function inferCoordinate(
  filename: string,
  fm: Record<string, unknown> | null,
): { coordinate: string; inferred: boolean; warnings: string[] } {
  const prefixed = filename.match(/^(x[0-9A-Fa-f]{4})_/);
  if (prefixed) {
    return {
      coordinate: prefixed[1].toLowerCase(),
      inferred: false,
      warnings: [],
    };
  }

  const primary = firstString(fm?.primary) ?? firstString(fm?.chord);
  const bucket = hexFromPosition(primary) ?? "3";
  const mode = modeHex(fm?.mode_position ?? fm?.mode ?? fm?.stance);
  const claim = hexFromPosition(fm?.claim_kind_position ?? fm?.claim_kind) ??
    "0";
  const warnings = primary
    ? []
    : ["coordinate bucket inferred with fallback 3"];
  return {
    coordinate: `x${bucket}${mode}${claim}0`.toLowerCase(),
    inferred: true,
    warnings,
  };
}

function inferBlockKey(
  filename: string,
  fm: Record<string, unknown> | null,
): { blockKey: string; inferred: boolean; warnings: string[] } {
  const prefixed = filename.match(/^x[0-9A-Fa-f]{4}_(\d+)_/);
  if (prefixed) {
    return { blockKey: prefixed[1], inferred: false, warnings: [] };
  }

  const rawBlock = fm?.bitcoin_block_height ?? fm?.anchor_block ??
    fm?.anchor_block_height;
  const blockNumber = Number(rawBlock);
  if (Number.isFinite(blockNumber) && blockNumber > 0) {
    return {
      blockKey: String(Math.floor(blockNumber)),
      inferred: false,
      warnings: [],
    };
  }

  const iso = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
  );
  if (iso) {
    const [, y, mo, d, h, mi, s] = iso;
    return {
      blockKey: `t${y}${mo}${d}${h}${mi}${s}`,
      inferred: true,
      warnings: ["block key inferred from timestamp filename"],
    };
  }

  const compact = filename.match(
    /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/,
  );
  if (compact) {
    const [, y, mo, d, h, mi, s] = compact;
    return {
      blockKey: `t${y}${mo}${d}${h}${mi}${s}`,
      inferred: true,
      warnings: ["block key inferred from compact timestamp filename"],
    };
  }

  return {
    blockKey: "unknown",
    inferred: true,
    warnings: ["block key unknown"],
  };
}

function inferVoice(
  filename: string,
  fm: Record<string, unknown> | null,
): { voice: string; inferred: boolean; warnings: string[] } {
  const prefixed = filename.match(/^x[0-9A-Fa-f]{4}_[^_]+_([^_]+)_/);
  if (prefixed) {
    return {
      voice: slugify(prefixed[1], "unknown"),
      inferred: false,
      warnings: [],
    };
  }

  const raw = fm?.voice ?? fm?.speaker ?? fm?.author ?? fm?.actor ??
    fm?.author_identity;
  if (!raw) {
    const stamped = filename.match(
      /^(?:\d{4}-\d{2}-\d{2}T\d{6}Z|\d{8}-\d{6}Z?)-([^-]+)-/,
    );
    if (stamped) {
      return {
        voice: slugify(stamped[1], "unknown"),
        inferred: true,
        warnings: ["voice inferred from filename"],
      };
    }
  }
  const voice = slugify(raw, "unknown");
  return {
    voice,
    inferred: !raw,
    warnings: raw ? [] : ["voice unknown"],
  };
}

function stripLegacyPrefixSlug(filename: string): string {
  return filename
    .replace(/\.md$/, "")
    .replace(/^x[0-9A-Fa-f]{4}_[^_]+_[^_]+_/, "")
    .replace(/^\d{4}-\d{2}-\d{2}T\d{6}Z-/, "")
    .replace(/^\d{8}-\d{6}Z?-/, "");
}

async function readLegacyChords(): Promise<
  Array<{ name: string; text: string }>
> {
  const out: Array<{ name: string; text: string }> = [];
  for await (const entry of Deno.readDir(LEGACY_CHORDS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const text = await Deno.readTextFile(join(LEGACY_CHORDS_DIR, entry.name));
    out.push({ name: entry.name, text });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/**
 * Compose the canonical flat-src chord filename from a name + frontmatter.
 * Single source of truth for chord coordinate/block/voice/slug derivation —
 * shared with `t chord receipt` (x4001) so newly-authored chords are byte-for-byte
 * what `t chord-migrate` would assign (idempotent: migration sees them as
 * already-migrated, no inference, no warnings). `name` may be empty for a
 * fresh chord — derivation then falls through to frontmatter fields.
 */
export function composeFlatSrcName(
  name: string,
  fm: Record<string, unknown> | null,
): {
  targetName: string;
  coordinate: string;
  blockKey: string;
  voice: string;
  slug: string;
  inferred: { coordinate: boolean; block_key: boolean; voice: boolean };
  warnings: string[];
} {
  const coordinate = inferCoordinate(name, fm);
  const block = inferBlockKey(name, fm);
  const voice = inferVoice(name, fm);
  const topic = fm?.topic ?? fm?.id ?? stripLegacyPrefixSlug(name);
  const slug = slugify(topic, stripLegacyPrefixSlug(name));
  const targetName =
    `${coordinate.coordinate}_${block.blockKey}_${voice.voice}_${slug}.myc.md`;
  return {
    targetName,
    coordinate: coordinate.coordinate,
    blockKey: block.blockKey,
    voice: voice.voice,
    slug,
    inferred: {
      coordinate: coordinate.inferred,
      block_key: block.inferred,
      voice: voice.inferred,
    },
    warnings: [
      ...coordinate.warnings,
      ...block.warnings,
      ...voice.warnings,
    ],
  };
}

function planEntry(name: string, text: string): MigrationEntry {
  const fm = parseFrontmatter(text) as Record<string, unknown> | null;
  const c = composeFlatSrcName(name, fm);
  return {
    source: `jazz/chords/${name}`,
    target: `src/${c.targetName}`,
    flat_id: c.targetName.replace(/\.myc\.md$/, ""),
    coordinate: c.coordinate,
    block_key: c.blockKey,
    voice: c.voice,
    slug: c.slug,
    inferred: c.inferred,
    warnings: c.warnings,
  };
}

function rewriteReferences(
  text: string,
  migrationBySourceName: Map<string, MigrationEntry>,
): string {
  let out = text;
  for (const [sourceName, migration] of migrationBySourceName) {
    const escaped = sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(
      new RegExp(`(?:\\.\\./)?jazz/chords/${escaped}`, "g"),
      migration.flat_id,
    );
    out = out.replace(new RegExp(`\\b${escaped}\\b`, "g"), migration.flat_id);
  }
  return out;
}

async function buildPlan(limit: number | null): Promise<MigrationEntry[]> {
  const legacy = await readLegacyChords();
  const seenTargets = new Map<string, number>();
  const entries = legacy.slice(0, limit ?? legacy.length).map((
    { name, text },
  ) => planEntry(name, text));

  for (const entry of entries) {
    const count = seenTargets.get(entry.target) ?? 0;
    seenTargets.set(entry.target, count + 1);
    if (count > 0) {
      const suffix = `-${count + 1}`;
      entry.target = entry.target.replace(/\.myc\.md$/, `${suffix}.myc.md`);
      entry.flat_id = basename(entry.target).replace(/\.myc\.md$/, "");
      entry.warnings.push("target collision disambiguated");
    }
  }

  return entries;
}

async function applyPlan(entries: MigrationEntry[]): Promise<string[]> {
  const bySourceName = new Map<string, MigrationEntry>();
  for (const entry of entries) bySourceName.set(basename(entry.source), entry);

  const moved: string[] = [];
  for (const entry of entries) {
    const sourcePath = join(ROOT, entry.source);
    const targetPath = join(ROOT, entry.target);
    const text = await Deno.readTextFile(sourcePath);
    const rewritten = rewriteReferences(text, bySourceName);
    await Deno.writeTextFile(targetPath, rewritten);
    await Deno.remove(sourcePath);
    moved.push(entry.target);
  }
  return moved;
}

async function main() {
  const args = parseArgs(Deno.args);
  const entries = await buildPlan(args.limit);
  const alreadyMigrated =
    (await listChordSurfaceFiles()).filter((entry) =>
      entry.surface === "topological"
    ).length;
  const warnings = entries.reduce((sum, e) => sum + e.warnings.length, 0);
  const payload = {
    type: "chord_migration_plan",
    position: "8/F2",
    action: args.apply ? "apply" : "plan",
    dry_run: !args.apply,
    summary: {
      source: "jazz/chords",
      target: "src",
      chords: entries.length,
      already_migrated: alreadyMigrated,
      inferred_coordinates: entries.filter((e) => e.inferred.coordinate)
        .length,
      inferred_block_keys: entries.filter((e) => e.inferred.block_key)
        .length,
      inferred_voices: entries.filter((e) => e.inferred.voice).length,
      warnings,
    },
    plan_path: args.writePlan || args.apply
      ? "src/x8F20_chord_migration_plan.myc.json"
      : null,
    moved: args.apply ? await applyPlan(entries) : [],
    entries,
  };

  if (args.writePlan || args.apply) {
    await Deno.writeTextFile(
      PLAN_PATH,
      JSON.stringify(payload, null, 2) + "\n",
    );
  }

  console.log(JSON.stringify(payload, null, args.json ? 2 : 0));
}

if (import.meta.main) await main();
