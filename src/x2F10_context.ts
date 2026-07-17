#!/usr/bin/env -S deno run --allow-read
// src/x2F10_context.ts — bounded task context for humans and model agents
// position: 2/F1 → mirror(2) × frontier/singular = a small task-facing mirror
// maturity: active
// horizon: none (v0.1 bounded lexical context firewall implemented)
// skill_tag: context
// skill_safe: yes-readonly
// placement_policy: axis
// hex_dipole: "26 00 6C 26 26 33 26 59"
//   mirror_apex+0.85 (PRIMARY: selects a task-shaped reflection; bucket 2 MATCH)
//   completion_frontier+0.70 (bounded handoff), action_decision+0.40
// intent: keep ledger history and generated projections cold by default; give a
//   fresh model the smallest useful set of instructions, files, and checks for
//   one stated task without reading the whole substrate.

import { basename, extname, join } from "@std/path";

const HERE = new URL(".", import.meta.url).pathname;
const DEFAULT_ROOT = join(HERE, "..");
const DEFAULT_MAX_FILES = 10;
const MAX_MAX_FILES = 20;
const MAX_SCAN_FILES = 2_000;
const SAMPLE_BYTES = 6_000;

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "з",
  "і",
  "й",
  "на",
  "по",
  "про",
  "та",
  "у",
  "в",
]);

const SELECTION_NOISE = new Set([
  "code",
  "improve",
  "improvement",
  "load",
  "myc",
  "refactor",
  "refactoring",
  "repo",
  "repository",
  "trinity",
  "код",
  "міц",
  "навантаження",
  "покращення",
  "рефакторинг",
  "репозиторій",
]);

const SKIP_DIRS = new Set([
  ".git",
  ".deno",
  ".venv",
  "coverage",
  "dist",
  "node_modules",
  "target",
  "vendor",
]);

const TEXT_EXTENSIONS = new Set([
  "",
  ".json",
  ".jsonc",
  ".md",
  ".py",
  ".rs",
  ".sh",
  ".toml",
  ".ts",
  ".yaml",
  ".yml",
]);

export type ContextScope = "trinity" | "myc" | "mixed";

export interface ContextFile {
  path: string;
  score: number;
  reason: string;
}

export interface ContextBrief {
  type: "context";
  schema: "trinity.context-brief.v0.1";
  position: "2/F1";
  action: "select";
  query: string;
  scope: ContextScope;
  budget: {
    max_files: number;
    selected_files: number;
    scanned_files: number;
    sample_bytes_per_file: number;
  };
  instruction_files: string[];
  relevant_files: ContextFile[];
  verification: string[];
  exclusions: string[];
}

export interface ContextOptions {
  root?: string;
  scope?: ContextScope;
  maxFiles?: number;
  includeLedger?: boolean;
}

export function queryTokens(query: string): string[] {
  return [...new Set(query.toLowerCase().match(/[\p{L}\p{N}_-]+/gu) ?? [])]
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

export function inferContextScope(query: string): ContextScope {
  const q = query.toLowerCase();
  const mentionsMyc = /(?:^|[^\p{L}\p{N}_])(?:myc|міц|mycel)/u.test(q);
  const mentionsTrinity = /(?:^|[^\p{L}\p{N}_])trinity/u.test(q);
  return mentionsMyc ? (mentionsTrinity ? "mixed" : "myc") : "trinity";
}

export function selectionTokens(query: string): string[] {
  const selected = queryTokens(query).filter((token) =>
    !SELECTION_NOISE.has(token)
  );
  if (/(?:cogniti|context|навантаж|контекст)/iu.test(query)) {
    selected.push(
      "x0100",
      "dispatch",
      "agents",
      "projection",
      "resolve",
      "resolver",
      "context",
    );
  }
  return [...new Set(selected)];
}

function isColdSurface(rel: string): boolean {
  const file = basename(rel);
  return file.endsWith(".myc.md") || file.endsWith(".myc.json") ||
    file.endsWith(".manifest.json") ||
    /(?:^|_)(?:graph|index|projection)\.ndjson$/.test(file);
}

function isCandidate(rel: string, includeLedger: boolean): boolean {
  if (!TEXT_EXTENSIONS.has(extname(rel))) return false;
  if (!includeLedger && isColdSurface(rel)) return false;
  return true;
}

async function collectFiles(
  root: string,
  start: string,
  includeLedger: boolean,
  out: string[],
  depth = 0,
): Promise<void> {
  if (depth > 6 || out.length >= MAX_SCAN_FILES) return;
  const absolute = join(root, start);
  try {
    for await (const entry of Deno.readDir(absolute)) {
      if (out.length >= MAX_SCAN_FILES) return;
      const rel = join(start, entry.name);
      if (entry.isDirectory) {
        if (!SKIP_DIRS.has(entry.name)) {
          await collectFiles(root, rel, includeLedger, out, depth + 1);
        }
      } else if (entry.isFile && isCandidate(rel, includeLedger)) {
        out.push(rel);
      }
    }
  } catch {
    // Optional roots (notably an uninitialized submodule) contribute nothing.
  }
}

async function readSample(path: string): Promise<string> {
  let file: Deno.FsFile | undefined;
  try {
    file = await Deno.open(path, { read: true });
    const bytes = new Uint8Array(SAMPLE_BYTES);
    const read = await file.read(bytes);
    return new TextDecoder().decode(bytes.subarray(0, read ?? 0));
  } catch {
    return "";
  } finally {
    file?.close();
  }
}

function scoreCandidate(
  rel: string,
  sample: string,
  tokens: string[],
): ContextFile | null {
  const path = rel.toLowerCase();
  const text = sample.toLowerCase();
  const matched: string[] = [];
  let score = 0;
  for (const token of tokens) {
    let tokenScore = 0;
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tokenPattern = new RegExp(
      `(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`,
      "iu",
    );
    if (tokenPattern.test(path)) tokenScore += 12;
    if (tokenPattern.test(text)) tokenScore += 3;
    if (tokenScore > 0) {
      score += tokenScore;
      matched.push(token);
    }
  }
  if (score === 0) return null;
  if (/_(?:test|spec)\.[^.]+$/.test(path)) score -= 1;
  return {
    path: rel.replaceAll("\\", "/"),
    score,
    reason: `matched: ${matched.slice(0, 5).join(", ")}`,
  };
}

function scanRoots(scope: ContextScope): string[] {
  const root = ["src", "packages", "contracts", ".github/workflows"];
  const myc = ["myc/src", "myc/contracts", "myc/public"];
  if (scope === "myc") return myc;
  return scope === "mixed" ? [...root, ...myc] : root;
}

function defaultCoreFiles(scope: ContextScope): string[] {
  const trinity = [
    "src/x0100_dispatch.ts",
    "src/x2F00_self.ts",
    "src/x2F10_context.ts",
  ];
  const myc = [
    "myc/src/x0100_myc.ts",
    "myc/src/x0200_resolve.ts",
    "myc/src/x6C00_protocol_audit.ts",
  ];
  if (scope === "trinity") return trinity;
  return scope === "myc" ? myc : [...trinity, ...myc];
}

function verificationFor(scope: ContextScope, files: ContextFile[]): string[] {
  const commands = ["git status --short"];
  if (scope !== "myc") commands.push("./t audit", "./t check");
  if (scope !== "trinity") commands.push("cd myc && deno task check");
  const packages = new Set(
    files.map((file) => file.path.match(/^packages\/([^/]+)\//)?.[1]).filter(
      (name): name is string => !!name,
    ),
  );
  for (const name of [...packages].sort()) {
    commands.push(`cd packages/${name} && deno test -A`);
  }
  return commands;
}

export async function buildContextBrief(
  query: string,
  options: ContextOptions = {},
): Promise<ContextBrief> {
  const root = options.root ?? DEFAULT_ROOT;
  const scope = options.scope ?? inferContextScope(query);
  const maxFiles = Math.max(
    4,
    Math.min(MAX_MAX_FILES, options.maxFiles ?? DEFAULT_MAX_FILES),
  );
  const tokens = selectionTokens(query);
  const paths: string[] = [];
  for (const start of scanRoots(scope)) {
    await collectFiles(root, start, options.includeLedger ?? false, paths);
  }

  const scored: ContextFile[] = [];
  for (const rel of paths) {
    const candidate = scoreCandidate(
      rel,
      await readSample(join(root, rel)),
      tokens,
    );
    if (candidate) scored.push(candidate);
  }
  scored.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  if (scored.length === 0) {
    for (const path of defaultCoreFiles(scope)) {
      try {
        if ((await Deno.stat(join(root, path))).isFile) {
          scored.push({ path, score: 1, reason: "scope default" });
        }
      } catch {
        // Optional substrate/core file is absent in this checkout.
      }
    }
  }

  const instructionFiles = ["AGENTS.md"];
  if (scope !== "trinity") instructionFiles.push("myc/AGENTS.md");
  const relevantFiles = scored.slice(0, maxFiles);
  return {
    type: "context",
    schema: "trinity.context-brief.v0.1",
    position: "2/F1",
    action: "select",
    query,
    scope,
    budget: {
      max_files: maxFiles,
      selected_files: relevantFiles.length,
      scanned_files: paths.length,
      sample_bytes_per_file: SAMPLE_BYTES,
    },
    instruction_files: instructionFiles,
    relevant_files: relevantFiles,
    verification: verificationFor(scope, relevantFiles),
    exclusions: options.includeLedger
      ? ["binary files", "dependency/build/cache directories"]
      : [
        "historical *.myc.md/*.myc.json ledger surfaces",
        "generated manifests and ndjson projections",
        "binary files and dependency/build/cache directories",
      ],
  };
}

export function renderContextBrief(brief: ContextBrief): string {
  const lines = [
    `# context @ 2/F1 — ${brief.scope}; ${brief.budget.selected_files}/${brief.budget.max_files} files`,
    `# task: ${brief.query || "(no task supplied)"}`,
    `# scanned: ${brief.budget.scanned_files} candidates; ${brief.budget.sample_bytes_per_file} bytes/file max`,
    "# instructions:",
    ...brief.instruction_files.map((path) => `#   - ${path}`),
    "# relevant:",
    ...brief.relevant_files.map((file) =>
      `#   - ${file.path}  [${file.score}; ${file.reason}]`
    ),
    "# verify:",
    ...brief.verification.map((command) => `#   - ${command}`),
    "# cold by default:",
    ...brief.exclusions.map((item) => `#   - ${item}`),
  ];
  if (brief.relevant_files.length === 0) {
    lines.push(
      "# no lexical match: make the task more specific or pass --include-ledger",
    );
  }
  return lines.join("\n");
}

function parseArgs(args: string[]): {
  query: string;
  json: boolean;
  options: ContextOptions;
} {
  let scope: ContextScope | undefined;
  let maxFiles: number | undefined;
  const query: string[] = [];
  for (const arg of args) {
    if (arg === "--json") continue;
    if (arg === "--include-ledger") continue;
    if (arg.startsWith("--scope=")) {
      const value = arg.slice("--scope=".length);
      if (value === "trinity" || value === "myc" || value === "mixed") {
        scope = value;
      }
      continue;
    }
    if (arg.startsWith("--max-files=")) {
      maxFiles = Number(arg.slice("--max-files=".length));
      continue;
    }
    query.push(arg);
  }
  return {
    query: query.join(" ").trim(),
    json: args.includes("--json"),
    options: {
      scope,
      maxFiles: Number.isFinite(maxFiles) ? maxFiles : undefined,
      includeLedger: args.includes("--include-ledger"),
    },
  };
}

if (import.meta.main) {
  const parsed = parseArgs(Deno.args);
  const brief = await buildContextBrief(parsed.query, parsed.options);
  console.log(parsed.json ? JSON.stringify(brief) : renderContextBrief(brief));
}
