// report.ts — apply morphology classifiers to a directory and emit markdown report
//
// Read-only. Default scans ./sample. Pointing at real trinity src:
//
//   deno run --config=probe.jsonc -A report.ts --root=../../src
//
// Output: markdown report of per-file classification + lane/lifecycle
// distribution + import-policy scan (regex over import statements).

import {
  dirname,
  fromFileUrl,
  join,
  resolve,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { parseFilename } from "./parse.ts";
import { classify, type Lane, type Lifecycle } from "./classify.ts";
import { canImport } from "./policy.ts";
import { checkShortPrefix } from "./verify.ts";

const HERE = dirname(fromFileUrl(import.meta.url));

interface FileReport {
  filename: string;
  coordinate: string;
  archetype: string;
  lane: Lane;
  lifecycle: Lifecycle;
  prefix_check: string; // "ok" | "drift" | "n/a"
  rationale: string;
}

interface PolicyViolation {
  source_file: string;
  source_archetype: string;
  target_archetype: string;
  imported_filename: string;
  result: "deny" | "warn";
  rationale: string;
}

interface Report {
  root: string;
  scanned: number;
  files: FileReport[];
  violations: PolicyViolation[];
  lane_counts: Record<Lane, number>;
  lifecycle_counts: Record<Lifecycle, number>;
  archetype_counts: Record<string, number>;
}

const IMPORT_RE = /from\s+["']([^"']+)["']/g;
const COORD_TARGET_RE = /x([0-9A-Fa-f])[0-9A-Fa-f]{3}_[^"'/]+\.ts$/;

function parseArgs(argv: string[]): { root: string; out: string | null } {
  let root = join(HERE, "sample");
  let out: string | null = null;
  for (const a of argv) {
    if (a.startsWith("--root=")) root = resolve(a.split("=")[1]);
    else if (a.startsWith("--out=")) out = resolve(a.split("=")[1]);
  }
  return { root, out };
}

async function scanFile(
  rootPath: string,
  name: string,
): Promise<{ report: FileReport; violations: PolicyViolation[] } | null> {
  const parsed = parseFilename(name);
  if (!parsed.is_morphology) return null;

  const path = join(rootPath, name);
  let content: string;
  try {
    content = await Deno.readTextFile(path);
  } catch {
    return null;
  }

  const cls = classify(parsed, false);

  // Short-prefix verify (only meaningful for .myc.md with hex anchor or
  // any name with 3-hex at filename position [2:5]).
  let prefixCheck = "n/a";
  if (parsed.coordinate.length === 4) {
    const check = await checkShortPrefix(name, content);
    if (check.filename_prefix) {
      // For organs (.ts), prefix-as-archetype-refinement is semantic, not
      // hash-bound. Only mined .myc.md files claim hash-prefix. So only
      // report drift if filename has hex anchor — but probe-level proxy is
      // "filename ends in .myc.md with hex_prefix anchor"
      if (parsed.lane === "myc" && parsed.anchor_kind === "hex_prefix") {
        prefixCheck = check.match ? "ok" : "drift";
      }
    }
  }

  // Import policy scan
  const violations: PolicyViolation[] = [];
  IMPORT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = IMPORT_RE.exec(content)) !== null) {
    const importPath = m[1];
    // Skip URL imports
    if (/^[a-z]+:/.test(importPath)) continue;
    const tm = COORD_TARGET_RE.exec(importPath);
    if (!tm) continue;
    const targetArchetype = tm[1].toUpperCase();
    const decision = canImport(parsed.archetype, targetArchetype);
    if (decision.result !== "allow") {
      violations.push({
        source_file: name,
        source_archetype: parsed.archetype,
        target_archetype: targetArchetype,
        imported_filename: importPath,
        result: decision.result,
        rationale: decision.rationale,
      });
    }
  }

  return {
    report: {
      filename: name,
      coordinate: parsed.coordinate,
      archetype: parsed.archetype,
      lane: cls.lane,
      lifecycle: cls.lifecycle,
      prefix_check: prefixCheck,
      rationale: cls.rationale,
    },
    violations,
  };
}

async function scan(rootPath: string): Promise<Report> {
  const files: FileReport[] = [];
  const violations: PolicyViolation[] = [];

  for await (const entry of Deno.readDir(rootPath)) {
    if (!entry.isFile) continue;
    const r = await scanFile(rootPath, entry.name);
    if (!r) continue;
    files.push(r.report);
    violations.push(...r.violations);
  }
  files.sort((a, b) => a.coordinate.localeCompare(b.coordinate));

  const lane_counts: Record<Lane, number> = {
    organ: 0,
    chord: 0,
    state: 0,
    receipt: 0,
    proof: 0,
    unknown: 0,
  };
  const lifecycle_counts: Record<Lifecycle, number> = {
    authored: 0,
    generated: 0,
    checkpoint: 0,
    sealed: 0,
    archived: 0,
  };
  const archetype_counts: Record<string, number> = {};
  for (const f of files) {
    lane_counts[f.lane]++;
    lifecycle_counts[f.lifecycle]++;
    archetype_counts[f.archetype] = (archetype_counts[f.archetype] ?? 0) + 1;
  }

  return {
    root: rootPath,
    scanned: files.length,
    files,
    violations,
    lane_counts,
    lifecycle_counts,
    archetype_counts,
  };
}

function render(report: Report): string {
  const lines: string[] = [];
  lines.push(`# morphology report`);
  lines.push(``);
  lines.push(`Root: ${report.root}`);
  lines.push(
    `Scanned: ${report.scanned} files (filtered to morphology-shaped names only).`,
  );
  lines.push(``);

  // Distribution tables
  lines.push(`## archetype distribution`);
  lines.push(``);
  lines.push(`| archetype | files |`);
  lines.push(`|-----------|-------|`);
  for (const [a, c] of Object.entries(report.archetype_counts).sort()) {
    lines.push(`| ${a} | ${c} |`);
  }
  lines.push(``);

  lines.push(`## lane distribution`);
  lines.push(``);
  lines.push(`| lane | count |`);
  lines.push(`|------|-------|`);
  for (const [l, c] of Object.entries(report.lane_counts)) {
    if (c === 0) continue;
    lines.push(`| ${l} | ${c} |`);
  }
  lines.push(``);

  lines.push(`## lifecycle distribution`);
  lines.push(``);
  lines.push(`| lifecycle | count |`);
  lines.push(`|-----------|-------|`);
  for (const [l, c] of Object.entries(report.lifecycle_counts)) {
    if (c === 0) continue;
    lines.push(`| ${l} | ${c} |`);
  }
  lines.push(``);

  // Per-file
  lines.push(`## per-file classification`);
  lines.push(``);
  lines.push(
    `| coordinate | archetype | lane | lifecycle | filename | prefix |`,
  );
  lines.push(
    `|------------|-----------|------|-----------|----------|--------|`,
  );
  for (const f of report.files) {
    lines.push(
      `| ${f.coordinate} | ${f.archetype} | ${f.lane} | ${f.lifecycle} | ${f.filename} | ${f.prefix_check} |`,
    );
  }
  lines.push(``);

  // Policy violations — scanner caveat
  lines.push(`## import-policy violations`);
  lines.push(``);
  lines.push(
    `> ⚠️ Scanner is probe-v0 regex-only: catches \`from "./xNNNN_*.ts"\` static imports only.`,
  );
  lines.push(
    `> Misses: side-effect imports (\`import "./x..."\`), dynamic imports (\`await import(...)\`),`,
  );
  lines.push(
    `> re-export forms (\`export * from\`), aliases via import map, non-\`.ts\` lanes,`,
  );
  lines.push(
    `> and submodule imports. Treat the count as "detected by static-from scanner", not as`,
  );
  lines.push(
    `> "complete policy coverage". A real \`t audit --policy\` mode would need full AST or`,
  );
  lines.push(`> Deno module graph parsing.`);
  lines.push(``);
  if (report.violations.length > 0) {
    lines.push(`Detected (${report.violations.length}):`);
    lines.push(``);
    lines.push(`| source | target | result | imported | rationale |`);
    lines.push(`|--------|--------|--------|----------|-----------|`);
    for (const v of report.violations) {
      lines.push(
        `| ${v.source_file} (x${v.source_archetype}) | x${v.target_archetype} | ${v.result} | ${v.imported_filename} | ${v.rationale} |`,
      );
    }
    lines.push(``);
  } else {
    lines.push(
      `None detected by static-from scanner. (See caveat above — broader scan needed for confidence.)`,
    );
    lines.push(``);
  }

  return lines.join("\n");
}

async function main(argv: string[]) {
  const args = parseArgs(argv);
  const report = await scan(args.root);
  const md = render(report);
  if (args.out) {
    await Deno.writeTextFile(args.out, md + "\n");
    console.log(`report written to ${args.out}`);
    console.log(
      `summary: scanned=${report.scanned} violations=${report.violations.length}`,
    );
  } else {
    console.log(md);
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
