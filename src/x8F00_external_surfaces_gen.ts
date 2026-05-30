#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
// src/x8F00_external_surfaces_gen.ts — external surfaces registry generator
// position: 8/F → void-infinity(8) × completion-edge(F) = final descriptions of all surfaces
// hex_dipole: "93 00 00 00 00 00 33 59"
//   void_infinity-1.09 (PRIMARY: indexes external ABI, src runtime caches, and compost)
//   completion_frontier+0.89 (boundary tracking across folders)
//   harmony_emergence+0.33 (systemic coherence)
// placement_policy: axis
// intent: scan external surfaces (root ABI, tooling ABI, contracts, schemas, docs, fixtures, probes, proposals, chords, src runtime caches, compost) and generate src/x8F88_external_surfaces.myc.md registry
// maturity: active
// horizon: none (external surfaces registry implemented)
// skill_tag: external-surfaces
// skill_safe: yes-with-care

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { formatGeneratedFile } from "./x0012_generated_format.ts";
import {
  collectExternalSurfaces,
  getGitTrackedFiles,
  summarizeExternalSurfaces,
  summarizeRuntimeCaches,
  type SurfaceEntry,
} from "./x8F10_external_surfaces_core.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const OUTPUT_PATH = join(HERE, "x8F88_external_surfaces.myc.md");
const PRUNE_RECEIPT_PATH = join(
  HERE,
  "x8F88_external_surfaces_prune.receipt.myc.json",
);
const PRUNE_RECEIPT_SURFACE =
  "src/x8F88_external_surfaces_prune.receipt.myc.json";

interface PruneCandidate {
  surface: string;
  days_ago: number;
  mtime: string;
  size: number;
}

function numericArg(args: string[], name: string, fallback: number): number {
  const i = args.indexOf(name);
  if (i === -1 || i + 1 >= args.length) return fallback;
  const n = Number(args[i + 1]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function ageDays(mtime: string | undefined, nowMs: number): number | null {
  if (!mtime || mtime === "unknown") return null;
  const parsed = new Date(mtime).getTime();
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.floor((nowMs - parsed) / 86_400_000));
}

function isRuntimeCachePruneCandidate(
  entry: SurfaceEntry,
  tracked: Set<string>,
  minAgeDays: number,
  nowMs: number,
): PruneCandidate | null {
  const days = ageDays(entry.mtime, nowMs);
  if (days === null || days < minAgeDays) return null;
  if (tracked.has(entry.surface)) return null;
  if (!entry.surface.startsWith("src/") || entry.surface.includes("..")) {
    return null;
  }
  if (
    entry.category !== "local_cache" ||
    entry.canonical_status !== "runtime_cache" ||
    entry.next_action !== "ignore_runtime"
  ) {
    return null;
  }
  return {
    surface: entry.surface,
    days_ago: days,
    mtime: entry.mtime ?? "unknown",
    size: entry.size ?? 0,
  };
}

async function pruneStaleRuntimeCaches(args: string[]) {
  const wantJson = args.includes("--json");
  const apply = args.includes("--apply") && !args.includes("--dry-run");
  const minAgeDays = numericArg(args, "--min-age-days", 7);
  const nowMs = Date.now();
  const entries = await collectExternalSurfaces({
    stable: false,
    includeVolatile: true,
  });
  const tracked = await getGitTrackedFiles();
  const candidates = entries
    .map((e) => isRuntimeCachePruneCandidate(e, tracked, minAgeDays, nowMs))
    .filter((e): e is PruneCandidate => e !== null)
    .sort((a, b) => {
      if (b.days_ago !== a.days_ago) return b.days_ago - a.days_ago;
      return a.surface.localeCompare(b.surface);
    });

  const deleted: string[] = [];
  if (apply) {
    for (const candidate of candidates) {
      await Deno.remove(join(ROOT, candidate.surface));
      deleted.push(candidate.surface);
    }
  }

  const payload = {
    type: "external_surfaces_prune",
    position: "8/F",
    action: "prune_stale_runtime",
    dry_run: !apply,
    min_age_days: minAgeDays,
    summary: {
      candidates: candidates.length,
      deleted: deleted.length,
      bytes: candidates.reduce((sum, e) => sum + e.size, 0),
    },
    receipt_path: apply ? PRUNE_RECEIPT_SURFACE : null,
    candidates,
    deleted,
  };

  if (apply) {
    await Deno.writeTextFile(
      PRUNE_RECEIPT_PATH,
      JSON.stringify(payload, null, 2) + "\n",
    );
  }

  if (wantJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(JSON.stringify(payload, null, 2));
}

async function walkDir(
  dir: string,
  relPrefix: string,
  entries: Array<{ path: string; size: number; hash: string }>,
): Promise<void> {
  try {
    for await (const entry of Deno.readDir(dir)) {
      const entryPath = join(dir, entry.name);
      const relPath = `${relPrefix}/${entry.name}`;
      if (entry.isDirectory) {
        if (entry.name !== ".git" && entry.name !== "node_modules") {
          await walkDir(entryPath, relPath, entries);
        }
      } else if (entry.isFile) {
        if (entry.name.startsWith(".")) continue;
        const data = await Deno.readFile(entryPath);
        const digest = new Uint8Array(
          await crypto.subtle.digest("SHA-256", data),
        );
        const hex = Array.from(digest, (b) => b.toString(16).padStart(2, "0"))
          .join("");
        entries.push({
          path: relPath,
          size: data.length,
          hash: `sha256:${hex}`,
        });
      }
    }
  } catch { /* ignore */ }
}

async function generateMycManifest(): Promise<void> {
  const manifestPath = join(ROOT, "x9000", "MANIFEST.myc.ndjson");
  const scanDirs = [
    "public",
    "protocols",
    "releases",
    "sealed",
    "docs",
    "sites",
    "substrates",
  ];
  const entries: Array<{ path: string; size: number; hash: string }> = [];

  for (const subDir of scanDirs) {
    const fullPath = join(ROOT, "myc", subDir);
    try {
      const stat = await Deno.stat(fullPath);
      if (!stat.isDirectory) continue;
      await walkDir(fullPath, subDir, entries);
    } catch { /* skip */ }
  }

  entries.sort((a, b) => a.path.localeCompare(b.path));

  const ndjson = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  await Deno.writeTextFile(manifestPath, ndjson);
}

async function main() {
  const args = Deno.args;
  const wantJson = args.includes("--json");
  const wantPrune = args.includes("--prune-stale-runtime") ||
    args.includes("--prune-stale");
  if (wantPrune) {
    await pruneStaleRuntimeCaches(args);
    return;
  }
  await generateMycManifest();
  const wantVolatile = args.includes("--volatile");
  const stable = args.includes("--stable") || !wantVolatile;

  const entries = await collectExternalSurfaces({
    stable,
    includeVolatile: !stable,
  });

  const summary = summarizeExternalSurfaces(entries);
  const runtime_cache_summary = summarizeRuntimeCaches(entries);

  if (wantJson) {
    const payload = {
      type: "external_surfaces",
      position: "8/F",
      summary,
      runtime_cache_summary,
      entries,
    };
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8F00_external_surfaces_gen.ts — do not edit by hand. -->`,
  );
  if (!stable) {
    lines.push(`<!-- generated_at: ${new Date().toISOString()} -->`);
  }
  lines.push(``);
  lines.push(`# Substrate external surfaces registry`);
  lines.push(``);
  lines.push(
    `*Generated migration dashboard and index of all file-based interfaces, documents, and local caches outside the core Deno flat-src code base.*`,
  );
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`| Category | File Count |`);
  lines.push(`| :--- | :---: |`);
  for (const [cat, count] of Object.entries(summary).sort()) {
    lines.push(`| ${cat.replace(/_/g, " ")} | ${count} |`);
  }
  lines.push(`| **Total** | **${entries.length}** |`);
  lines.push(``);
  lines.push(`## Registered Surfaces`);
  lines.push(``);

  if (!stable) {
    lines.push(
      `| Category | Surface | Canonical Status | Canonical Target | Next Action | Blocked By | Size (bytes) | Last Modified |`,
    );
    lines.push(
      `| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |`,
    );
    for (const e of entries) {
      lines.push(
        `| ${
          e.category.replace(/_/g, " ")
        } | [${e.surface}](../${e.surface}) | ${e.canonical_status} | ${e.canonical_target} | ${e.next_action} | ${e.blocked_by} | ${
          e.size ?? 0
        } | ${e.mtime ?? "unknown"} |`,
      );
    }
  } else {
    lines.push(
      `| Category | Surface | Canonical Status | Canonical Target | Next Action | Blocked By |`,
    );
    lines.push(
      `| :--- | :--- | :--- | :--- | :--- | :--- |`,
    );
    for (const e of entries) {
      lines.push(
        `| ${
          e.category.replace(/_/g, " ")
        } | [${e.surface}](../${e.surface}) | ${e.canonical_status} | ${e.canonical_target} | ${e.next_action} | ${e.blocked_by} |`,
      );
    }
  }
  lines.push(``);

  await Deno.writeTextFile(OUTPUT_PATH, lines.join("\n"));
  await formatGeneratedFile(OUTPUT_PATH);

  const receipt = {
    type: "external_surfaces_gen",
    position: "8/F",
    action: "generate",
    note: "external surfaces registry generated successfully",
    summary,
    total_surfaces: entries.length,
  };

  console.log(JSON.stringify(receipt, null, 2));
}

if (import.meta.main) {
  await main();
}
