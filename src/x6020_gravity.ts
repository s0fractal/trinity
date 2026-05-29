#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x6020_gravity.ts — gravity / edge tension report / drift meter
// position: 6/02 → harmony(6) × void-singular(02) = audit primitive mirroring own topology
// hex_dipole: "00 00 33 00 00 00 6C 00"
//   harmony_emergence+0.85 (PRIMARY: measures dissonance via filename coordinates)
//   mirror_apex+0.40 (reflects substrate's own structure back as report)
//   bucket 6/02: primary axis harmony (6), bucket 6 ← MATCH
//                secondary '02' → axis 2 mirror, dipole +0.40 (composes with primary)
// placement_policy: axis
// intent: analyze import gravity and report tension between filename coordinates
// maturity: active
// horizon: none (AST resolver integrated)
// skill_tag: gravity
// skill_safe: yes
//
// gravity — edge tension report. Reads import statements via Deno info AST and
// derives source→target edges by filename coordinates. Computes
// Hamming distance per coord-digit; reports high-tension edges and a
// 16×16 source-bucket × target-bucket heatmap.
//
// Observation tool, not enforcement:
//   - no exit-1 on high tension
//   - no auto-fix
//   - no opinion about whether long edges are "wrong"
//
// Single long edge is fine (utility helpers everywhere); clusters of
// long edges from one source = drift signal.
//
// Subcommands:
//   t gravity                       human-readable report
//   t gravity --json                machine-readable JSON
//   t gravity --threshold=N         min Δprimary for "high tension" list (default 2)
//   t gravity --top=N               max edges to show in high-tension list (default 30)
//
// Glossary words: gravity, tension, drift, гравітація, натяг

import {
  dirname,
  fromFileUrl,
  join,
  toFileUrl,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const SRC = HERE;

const FILE_RE = /^x([0-9A-Fa-f]{4})_[^.]+\.ts$/;
const IMPORT_RE = /from\s+["']([^"']+)["']/g;
const TARGET_RE = /x([0-9A-Fa-f]{4})_[^"'/]+\.ts$/;

export interface Edge {
  source: string;
  target: string;
  source_file: string;
  target_file: string;
  delta_primary: number;
  delta_hamming: number;
  // True if target file lacks `import.meta.main` — i.e., it's a
  // library/utility imported by other organs, not a dispatchable
  // organ. Long edges to libraries are by design (foundation utilities
  // like x0030_compose are meant to be cross-bucket), not drift signal.
  target_is_library: boolean;
}

export interface Report {
  type: "gravity";
  position: "6/02";
  action: "gravity";
  note: string;
  summary: {
    total_edges: number;
    mean_delta_primary: number;
    max_delta_primary: number;
    library_edges: number;
    non_library_edges: number;
  };
  total_edges: number;
  mean_delta_primary: number;
  max_delta_primary: number;
  edges_by_tension: Edge[];
  heatmap: Record<string, Record<string, number>>;
}

async function scanFiles(): Promise<string[]> {
  const out: string[] = [];
  for await (const entry of Deno.readDir(SRC)) {
    if (!entry.isFile) continue;
    if (entry.name.endsWith(".test.ts")) continue;
    if (!FILE_RE.test(entry.name)) continue;
    out.push(entry.name);
  }
  return out.sort();
}

export function coordOf(filename: string): string | null {
  const m = FILE_RE.exec(filename);
  return m ? m[1].toUpperCase() : null;
}

function digitDelta(a: string, b: string, pos: number): number {
  return Math.abs(parseInt(a[pos], 16) - parseInt(b[pos], 16));
}

function hammingDigits(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) d++;
  }
  return d;
}

// Detect library status: file has no `import.meta.main` entry point,
// meaning it's imported by other organs (library/utility), not
// dispatch-invoked. Cross-bucket imports of libraries are policy-OK
// (foundation utilities are MEANT to be imported widely).
async function buildLibraryMap(files: string[]): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  // Match `if (import.meta.main)` entry-point pattern rather than the
  // bare token, so library files that MENTION the term in comments
  // ("// no import.meta.main") aren't misclassified as having main.
  const MAIN_RE = /\bif\s*\(\s*import\.meta\.main\b/;
  for (const file of files) {
    try {
      const content = await Deno.readTextFile(join(SRC, file));
      map.set(file, !MAIN_RE.test(content));
    } catch {
      map.set(file, false);
    }
  }
  return map;
}

async function getDependenciesOfFile(filePath: string): Promise<string[]> {
  const process = new Deno.Command(Deno.execPath(), {
    args: ["info", "--json", filePath],
    stdout: "piped",
    stderr: "null",
  });
  const { code, stdout } = await process.output();
  if (code !== 0) return [];
  try {
    const data = JSON.parse(new TextDecoder().decode(stdout));
    const root = data.roots[0];
    const mod = data.modules.find((m: any) => m.specifier === root);
    if (!mod || !mod.dependencies) return [];
    const deps = new Set<string>();
    for (const d of mod.dependencies) {
      if (d.code?.specifier) deps.add(d.code.specifier);
      if (d.type?.specifier) deps.add(d.type.specifier);
    }
    return Array.from(deps);
  } catch {
    return [];
  }
}

async function pool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    worker,
  );
  await Promise.all(workers);
  return results;
}

export async function buildEdges(): Promise<Edge[]> {
  const files = await scanFiles();
  const libraryMap = await buildLibraryMap(files);
  const edges: Edge[] = [];
  const srcUrlPrefix = toFileUrl(SRC).href.endsWith("/")
    ? toFileUrl(SRC).href
    : toFileUrl(SRC).href + "/";

  const fileDeps = await pool(files, 12, async (file) => {
    const absPath = join(SRC, file);
    const deps = await getDependenciesOfFile(absPath);
    return { file, deps };
  });

  for (const { file: sourceFile, deps } of fileDeps) {
    const sourceCoord = coordOf(sourceFile);
    if (!sourceCoord) continue;

    for (const depSpecifier of deps) {
      if (!depSpecifier.startsWith(srcUrlPrefix)) continue;

      const targetFileName = depSpecifier.split("/").pop() ?? "";
      if (!FILE_RE.test(targetFileName)) continue;

      const targetCoord = coordOf(targetFileName);
      if (!targetCoord) continue;
      if (targetCoord === sourceCoord) continue; // self-reference

      const importPath = `./${targetFileName}`;

      edges.push({
        source: sourceCoord,
        target: targetCoord,
        source_file: sourceFile,
        target_file: importPath,
        delta_primary: digitDelta(sourceCoord, targetCoord, 0),
        delta_hamming: hammingDigits(sourceCoord, targetCoord),
        target_is_library: libraryMap.get(targetFileName) ?? false,
      });
    }
  }
  return edges;
}

function buildHeatmap(edges: Edge[]): Record<string, Record<string, number>> {
  const counts: Record<string, Record<string, number>> = {};
  for (const e of edges) {
    const src = e.source[0];
    const tgt = e.target[0];
    if (!counts[src]) counts[src] = {};
    counts[src][tgt] = (counts[src][tgt] ?? 0) + 1;
  }
  return counts;
}

function renderHeatmap(counts: Record<string, Record<string, number>>): string {
  const digits = "0123456789ABCDEF".split("");
  const usedRows = digits.filter((d) => counts[d]);
  const usedCols = new Set<string>();
  for (const d of usedRows) {
    for (const t of Object.keys(counts[d])) usedCols.add(t);
  }
  const cols = digits.filter((d) => usedCols.has(d));

  const lines: string[] = [];
  lines.push("src\\tgt  " + cols.map((c) => c.padStart(3)).join(" "));
  for (const r of usedRows) {
    const cells = cols.map((c) => {
      const v = counts[r][c] ?? 0;
      return v === 0 ? "  ." : v.toString().padStart(3);
    }).join(" ");
    lines.push(`   ${r}     ${cells}`);
  }
  return lines.join("\n");
}

function renderHighTension(
  edges: Edge[],
  threshold: number,
  top: number,
): string {
  const filtered = edges
    .filter((e) => e.delta_primary >= threshold)
    .sort((a, b) =>
      b.delta_primary - a.delta_primary || b.delta_hamming - a.delta_hamming
    );

  if (filtered.length === 0) return `(no edges with Δprimary ≥ ${threshold})`;

  const lines: string[] = [];
  let libCount = 0;
  for (const e of filtered.slice(0, top)) {
    const src = e.source_file.padEnd(42);
    const tgt = `x${e.target}_*`.padEnd(18);
    // [lib] tag = target has no import.meta.main; cross-bucket import
    // of a library is policy-OK (foundation utilities ARE meant to be
    // imported widely). Tension display kept for transparency.
    const libTag = e.target_is_library ? " [lib]" : "";
    if (e.target_is_library) libCount++;
    lines.push(
      `  ${src}→ ${tgt} Δp=${e.delta_primary} Δh=${e.delta_hamming}${libTag}`,
    );
  }
  if (filtered.length > top) {
    lines.push(`  ... and ${filtered.length - top} more`);
  }
  if (libCount > 0) {
    lines.push(
      `\n  [lib] = target is library (no import.meta.main); cross-bucket import is policy-OK`,
    );
    lines.push(
      `  ${libCount}/${
        Math.min(top, filtered.length)
      } flagged edges target libraries (not drift)`,
    );
  }
  return lines.join("\n");
}

export function buildReport(edges: Edge[]): Report {
  const meanDp = edges.length === 0
    ? 0
    : edges.reduce((s, e) => s + e.delta_primary, 0) / edges.length;
  const maxDp = edges.reduce((m, e) => Math.max(m, e.delta_primary), 0);

  return {
    type: "gravity",
    position: "6/02",
    action: "gravity",
    note:
      "edge tension report by filename coordinates (Deno AST). Observation only, not enforcement.",
    summary: {
      total_edges: edges.length,
      mean_delta_primary: Number(meanDp.toFixed(3)),
      max_delta_primary: maxDp,
      library_edges: edges.filter((e) => e.target_is_library).length,
      non_library_edges: edges.filter((e) => !e.target_is_library).length,
    },
    total_edges: edges.length,
    mean_delta_primary: Number(meanDp.toFixed(3)),
    max_delta_primary: maxDp,
    edges_by_tension: [...edges].sort(
      (a, b) =>
        b.delta_primary - a.delta_primary || b.delta_hamming - a.delta_hamming,
    ),
    heatmap: buildHeatmap(edges),
  };
}

if (import.meta.main) {
  const args = Deno.args;
  const isJson = args.includes("--json");
  let threshold = 2;
  let top = 30;
  for (const a of args) {
    if (a.startsWith("--threshold=")) threshold = parseInt(a.split("=")[1], 10);
    if (a.startsWith("--top=")) top = parseInt(a.split("=")[1], 10);
  }

  const edges = await buildEdges();
  const report = buildReport(edges);

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      "# gravity @ 6/02 — edge tension report (filename coordinates, Deno AST)",
    );
    console.log(
      "# ───────────────────────────────────────────────────────────────",
    );
    console.log("");
    console.log(
      `total edges: ${report.total_edges}   mean Δprimary: ${report.mean_delta_primary}   max Δprimary: ${report.max_delta_primary}`,
    );
    console.log("");
    console.log(`## high tension edges (Δprimary ≥ ${threshold})`);
    console.log(renderHighTension(edges, threshold, top));
    console.log("");
    console.log("## heatmap (source bucket × target bucket, edge count)");
    console.log(renderHeatmap(report.heatmap));
  }
}
