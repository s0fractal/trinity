#!/usr/bin/env -S deno run --allow-read
// src/x4F00_contracts.ts — contracts / agreements / stabilized-schemas
// position: 4/F → foundation(4) × frontier-pair(F) = stable-edge agreements
// hex_dipole: "26 26 40 33 6C 26 4C 59"
//   foundation_container+0.85 (PRIMARY: stable infrastructure)
//   completion_frontier+0.70 (boundary commitments)
//   harmony_emergence+0.60 (order across substrate)
//   mirror_apex+0.50 (reflects shared understanding)
//   triangle_build+0.40 (composes commitments)
//   void+0.30, first_pen+0.30, action+0.30
//   bucket 4/F: axis 4 (foundation) primary ← MATCH
//               'F' = axis 7 negative pole, dipole +0.70 on axis 7 ← PAIR-MATCH
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 0
// placement_policy: axis
//
// contracts — live projection of stabilized schemas (per architect 2026-05-14)
//
// Reads contracts/*.md frontmatter at query time and presents a live
// catalog. Replaces hand/scraper-maintained contracts/index.ndjson.
//
// Architect observation 2026-05-14: "контракт — це стабілізована
// схема з того ж леджера. зовнішня md — це 'не дуже варіант'".
//
// Long-term direction (codex 2026-05-13T211717Z): contract body migrates
// to record-graph form (header record + section records + falsifier
// records, linked). Current step: only metadata becomes live; body
// stays as .md payload referenced by frontmatter.
//
// Exceptions: SPORE_BOOTSTRAP_PIN.v0.md and other Bitcoin-anchored
// or externally-pinned contracts MUST stay frozen as .md (their whole
// purpose is consensus immutability). They appear in the listing but
// marked as `pinned: true`.
//
// Subcommands:
//   t contracts                   → human table of all contracts
//   t contracts --json            → machine-readable JSON
//   t contracts show <name>       → metadata + body path for one contract
//   t contracts --status=active   → filter by status
//   t contracts --status=draft
//
// Glossary words: contracts, agreements, schemas, pacts, контракти,
//                 угоди, схеми, пакти

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { parallel, pipe, tryOr } from "./x0030_compose.ts";
import { loadLifecycleFamily } from "./x4011_contract_status_compiler.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const CONTRACTS_DIR = join(ROOT, "contracts");

interface ContractEntry {
  filename: string;
  path: string;
  type: string;
  version: string;
  status: string;
  title: string;
  pinned: boolean;
  related_count: number;
  body_lines: number;
  // Vector 4 sunset audit (claude+kimi+antigravity tweak):
  // surface draft age + cowitness extension without auto-action.
  age_days: number | null;
  cowitness_count: number;
  cowitness_recent_days: number | null; // newest cowitness, days ago
  load_bearing: boolean;
  sunset_status:
    | "pinned"
    | "load-bearing"
    | "fresh"
    | "extended"
    | "approaching-sunset"
    | "past-sunset"
    | "active" // not a draft; sunset n/a
    | "unknown";
}

// Minimal YAML frontmatter parser — extracts only the flat scalar fields we need.
function parseFrontmatter(text: string): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return out;
  const fm = m[1];
  for (const line of fm.split("\n")) {
    const kv = line.match(/^(\w+):\s*"?([^"#\n]*?)"?\s*(#.*)?$/);
    if (kv) {
      const v = kv[2].trim();
      if (v) out[kv[1]] = v;
    }
  }
  // Count related entries (list items)
  const related = fm.match(/^related:\s*$/m);
  if (related) {
    const after = fm.slice(fm.indexOf("related:") + "related:".length);
    out.related_count = (after.match(/^\s+-/gm) ?? []).length;
  } else {
    out.related_count = 0;
  }
  return out;
}

// Parse `git log --diff-filter=A --name-only --format="COMMIT %aI"`
// output into filename → first-commit Date map. Git walks newest→oldest;
// last write wins per file = the addition (oldest commit).
function parseGitAdditions(text: string): Map<string, Date> {
  const out = new Map<string, Date>();
  let currentDate: Date | null = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("COMMIT ")) {
      currentDate = new Date(line.slice("COMMIT ".length).trim());
    } else if (line.startsWith("contracts/") && currentDate) {
      out.set(line.slice("contracts/".length), currentDate);
    }
  }
  return out;
}

// Cache: first-commit timestamps for all contracts (one git call vs per-file).
let _addedAtCache: Map<string, Date> | null = null;
async function loadAddedAtCache(): Promise<Map<string, Date>> {
  if (_addedAtCache) return _addedAtCache;
  _addedAtCache = await tryOr(async () => {
    const proc = new Deno.Command("git", {
      args: [
        "-C",
        ROOT,
        "log",
        "--diff-filter=A",
        "--name-only",
        "--format=COMMIT %aI",
        "--",
        "contracts/",
      ],
      stdout: "piped",
      stderr: "piped",
    });
    const { stdout } = await proc.output();
    return parseGitAdditions(new TextDecoder().decode(stdout));
  }, new Map<string, Date>());
  return _addedAtCache;
}

// Extract chord's date from its filename (newer x<coord>_<block>_ or
// older YYYY-MM-DDTHHMMSSZ form). Null if neither matches.
function chordDateFromFilename(filename: string): Date | null {
  const newM = /^x[0-9A-Fa-f]{4}_(\d+)_/.exec(filename);
  if (newM) {
    // Block height → approx epoch: ref 950000 = 2026-05-19T00:00Z
    const block = parseInt(newM[1], 10);
    const epoch = 1779148800 + (block - 950000) * 600;
    return new Date(epoch * 1000);
  }
  const oldM = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})Z/.exec(filename);
  if (oldM) {
    const [, y, mo, d, h, mi, s] = oldM;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  }
  return null;
}

// Extract distinct contract filenames mentioned in chord body.
function contractRefsInChord(body: string): Set<string> {
  const out = new Set<string>();
  const matches = body.matchAll(
    /contracts\/([A-Za-z0-9_]+\.v[0-9.]+(?:\.draft)?\.md)/g,
  );
  for (const m of matches) out.add(m[1]);
  return out;
}

// Update cowitness entry for a contract with a new chord reference.
// Clamp days-ago at 0 (block-height→epoch can over-estimate for
// same-session chords).
function recordCowitness(
  map: Map<string, { count: number; latestDaysAgo: number | null }>,
  contractFile: string,
  chordDate: Date | null,
  now: number,
): void {
  const prev = map.get(contractFile) ?? { count: 0, latestDaysAgo: null };
  prev.count++;
  if (chordDate) {
    const daysAgo = Math.max(
      0,
      Math.floor((now - chordDate.getTime()) / 86400000),
    );
    if (prev.latestDaysAgo === null || daysAgo < prev.latestDaysAgo) {
      prev.latestDaysAgo = daysAgo;
    }
  }
  map.set(contractFile, prev);
}

// Cache: chord-reference counts per contract.
let _cowitnessCache:
  | Map<string, { count: number; latestDaysAgo: number | null }>
  | null = null;
async function loadCowitnessCache(): Promise<
  Map<string, { count: number; latestDaysAgo: number | null }>
> {
  if (_cowitnessCache) return _cowitnessCache;
  _cowitnessCache = await tryOr(async () => {
    const out = new Map<
      string,
      { count: number; latestDaysAgo: number | null }
    >();
    const chordsDir = join(ROOT, "jazz", "chords");
    const now = Date.now();
    for await (const entry of Deno.readDir(chordsDir)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      const text = await Deno.readTextFile(join(chordsDir, entry.name));
      const chordDate = chordDateFromFilename(entry.name);
      for (const contractFile of contractRefsInChord(text)) {
        recordCowitness(out, contractFile, chordDate, now);
      }
    }
    return out;
  }, new Map<string, { count: number; latestDaysAgo: number | null }>());
  return _cowitnessCache;
}

function classifySunset(
  contract: {
    status: string;
    pinned: boolean;
    age_days: number | null;
    cowitness_recent_days: number | null;
    load_bearing: boolean;
  },
): ContractEntry["sunset_status"] {
  if (contract.status !== "draft") return "active";
  if (contract.pinned) return "pinned";
  if (contract.load_bearing) return "load-bearing";
  if (contract.age_days === null) return "unknown";
  // Cowitness within last 14 days extends sunset.
  if (
    contract.cowitness_recent_days !== null &&
    contract.cowitness_recent_days <= 14
  ) return "extended";
  if (contract.age_days < 30) return "fresh";
  if (contract.age_days < 60) return "approaching-sunset";
  return "past-sunset";
}

// Build the base ContractEntry from filename + text + parsed frontmatter.
// Enrichment fields (age, cowitness, load_bearing, sunset_status) filled
// downstream by enricher functions.
function buildBaseEntry(
  filename: string,
  text: string,
  fm: Record<string, string | number>,
): ContractEntry {
  return {
    filename,
    path: `contracts/${filename}`,
    type: String(fm.type ?? "Unknown"),
    version: String(fm.version ?? ""),
    status: String(fm.status ?? "unknown"),
    title: String(fm.title ?? filename),
    // Pinned: SPORE_BOOTSTRAP_PIN or Bitcoin attestation marker in body.
    pinned: filename.includes("BOOTSTRAP_PIN") ||
      /bitcoin\s+attestation|op_return|inscribed/i.test(text),
    related_count: Number(fm.related_count ?? 0),
    body_lines: text.split("\n").length,
    age_days: null,
    cowitness_count: 0,
    cowitness_recent_days: null,
    load_bearing: false,
    sunset_status: "unknown",
  };
}

function enrichWithAge(
  entry: ContractEntry,
  addedAt: Date | undefined,
): ContractEntry {
  return {
    ...entry,
    age_days: addedAt
      ? Math.floor((Date.now() - addedAt.getTime()) / 86400000)
      : null,
  };
}

function enrichWithCowitness(
  entry: ContractEntry,
  cowit: { count: number; latestDaysAgo: number | null } | undefined,
): ContractEntry {
  const c = cowit ?? { count: 0, latestDaysAgo: null };
  return {
    ...entry,
    cowitness_count: c.count,
    cowitness_recent_days: c.latestDaysAgo,
  };
}

// Load-bearing detection: explicit frontmatter flag, ≥3 chord refs
// (sustained substrate dependency), or "load-bearing" body marker.
// Pinned already separately flagged.
function enrichWithLoadBearing(
  entry: ContractEntry,
  text: string,
  fm: Record<string, string | number>,
): ContractEntry {
  return {
    ...entry,
    load_bearing: String(fm.load_bearing ?? "").toLowerCase() === "true" ||
      entry.cowitness_count >= 3 ||
      /load[- ]bearing/i.test(text.split("\n").slice(0, 50).join("\n")),
  };
}

function setSunsetStatus(entry: ContractEntry): ContractEntry {
  return { ...entry, sunset_status: classifySunset(entry) };
}

async function readContract(filename: string): Promise<ContractEntry | null> {
  const text = await tryOr(
    () => Deno.readTextFile(join(CONTRACTS_DIR, filename)),
    null as string | null,
  );
  if (text === null) return null;

  const fm = parseFrontmatter(text);
  const caches = await parallel({
    addedAt: () => loadAddedAtCache(),
    cowit: () => loadCowitnessCache(),
  });

  return pipe(
    buildBaseEntry(filename, text, fm),
    (entry) => enrichWithAge(entry, caches.addedAt.get(filename)),
    (entry) => enrichWithCowitness(entry, caches.cowit.get(filename)),
    (entry) => enrichWithLoadBearing(entry, text, fm),
    setSunsetStatus,
  );
}

async function listContracts(): Promise<ContractEntry[]> {
  const out: ContractEntry[] = [];
  for await (const entry of Deno.readDir(CONTRACTS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    if (entry.name === "README.md") continue;
    const c = await readContract(entry.name);
    if (c) out.push(c);
  }
  // Sort: pinned first, then by glossary-derived lifecycle rank, alpha
  // within. Lifecycle family loaded from src/x0001_glossary.ndjson via
  // x4011_contract_status_compiler — replaces previous hardcoded enum
  // (active=1, draft=2, open=3, superseded=4) which was verified
  // byte-identical to the glossary projection (Beta supervector probe
  // 2026-05-23, codex Directive 1 integration).
  // Fallback rank for unknown statuses = max+1 (alphabetical within).
  const family = await loadLifecycleFamily();
  const rankByHandle = new Map<string, number>();
  for (const r of family) rankByHandle.set(r.primary_handle, r.rank);
  const fallbackRank = family.length;
  const statusRank = (s: string, pinned: boolean): number => {
    if (pinned) return 0;
    return rankByHandle.get(s) ?? fallbackRank;
  };
  out.sort((a, b) => {
    const r = statusRank(a.status, a.pinned) - statusRank(b.status, b.pinned);
    if (r !== 0) return r;
    return a.filename.localeCompare(b.filename);
  });
  return out;
}

function renderTable(contracts: ContractEntry[]): void {
  console.log(
    "# contracts @ 4/F — live projection of contracts/*.md frontmatter",
  );
  console.log("# " + "─".repeat(86));
  console.log(`# ${contracts.length} contracts known`);
  console.log("");
  console.log(
    "# status      version    pin  lines  sunset                   file",
  );
  console.log("# " + "─".repeat(86));
  for (const c of contracts) {
    const pinIcon = c.pinned ? "🔒" : "  ";
    const status = c.status.padEnd(11);
    const ver = c.version.padEnd(10);
    const lines = c.body_lines.toString().padStart(4);
    const sunsetCell = formatSunsetCell(c);
    console.log(
      `# ${status} ${ver} ${pinIcon}  ${lines}  ${sunsetCell}  ${c.filename}`,
    );
  }
  console.log("# " + "─".repeat(86));
  const byStatus = new Map<string, number>();
  for (const c of contracts) {
    byStatus.set(c.status, (byStatus.get(c.status) ?? 0) + 1);
  }
  const summary = Array.from(byStatus.entries()).map(([k, v]) => `${k}:${v}`)
    .join("  ");
  const pinned = contracts.filter((c) => c.pinned).length;
  console.log(`# ${summary}  pinned:${pinned}`);
  renderSunsetSummary(contracts);
}

function formatSunsetCell(c: ContractEntry): string {
  if (c.status !== "draft") return "—".padEnd(24);
  switch (c.sunset_status) {
    case "pinned":
      return "pinned".padEnd(24);
    case "load-bearing":
      return "load-bearing".padEnd(24);
    case "extended": {
      const ext = c.cowitness_recent_days !== null
        ? `cowit ${c.cowitness_recent_days}d ago`
        : "cowit";
      return `extended (${ext})`.slice(0, 24).padEnd(24);
    }
    case "fresh":
      return `fresh (${c.age_days}d)`.padEnd(24);
    case "approaching-sunset":
      return `nearing (${c.age_days}d)`.padEnd(24);
    case "past-sunset":
      return `past (${c.age_days}d)`.padEnd(24);
    case "unknown":
      return "age-unknown".padEnd(24);
    default:
      return "—".padEnd(24);
  }
}

function renderSunsetSummary(contracts: ContractEntry[]): void {
  const drafts = contracts.filter((c) => c.status === "draft");
  if (drafts.length === 0) return;
  const byStatus = new Map<string, number>();
  for (const c of drafts) {
    byStatus.set(c.sunset_status, (byStatus.get(c.sunset_status) ?? 0) + 1);
  }
  const parts = [
    "load-bearing",
    "extended",
    "fresh",
    "approaching-sunset",
    "past-sunset",
  ]
    .filter((k) => (byStatus.get(k) ?? 0) > 0)
    .map((k) => `${k}: ${byStatus.get(k)}`);
  if (parts.length > 0) {
    console.log(
      `# draft sunset (${drafts.length} drafts): ${parts.join(", ")}`,
    );
  }
  const pastOrNearing = drafts.filter((c) =>
    c.sunset_status === "approaching-sunset" ||
    c.sunset_status === "past-sunset"
  );
  if (pastOrNearing.length > 0) {
    console.log(`#   ⚠ ${pastOrNearing.length} draft(s) need attention:`);
    for (const c of pastOrNearing) {
      const reason = c.cowitness_count === 0
        ? `no cowitness in ${c.age_days}d`
        : `last cowitness ${c.cowitness_recent_days}d ago`;
      console.log(`#     ${c.filename}: ${c.sunset_status} (${reason})`);
    }
  }
}

function renderDetail(c: ContractEntry): void {
  console.log(`# contract: ${c.title}`);
  console.log("# " + "─".repeat(70));
  console.log(`# file:        ${c.path}`);
  console.log(`# type:        ${c.type}`);
  console.log(`# version:     ${c.version}`);
  console.log(`# status:      ${c.status}`);
  console.log(
    `# pinned:      ${
      c.pinned
        ? "yes (externally anchored — do not modify)"
        : "no (internal — editable per consensus)"
    }`,
  );
  console.log(`# body lines:  ${c.body_lines}`);
  console.log(`# related:     ${c.related_count}`);
  console.log(
    `# age:         ${c.age_days !== null ? `${c.age_days} days` : "unknown"}`,
  );
  console.log(
    `# cowitness:   ${c.cowitness_count} chord refs${
      c.cowitness_recent_days !== null
        ? `, latest ${c.cowitness_recent_days}d ago`
        : ""
    }`,
  );
  console.log(`# load-bearing: ${c.load_bearing ? "yes" : "no"}`);
  console.log(`# sunset:      ${c.sunset_status}`);
  console.log("");
  console.log(`# To read body: cat ${c.path}`);
}

if (import.meta.main) {
  const args = Deno.args;
  const wantJson = args.includes("--json");
  const statusFilter = args.find((a) => a.startsWith("--status="))?.split(
    "=",
  )[1];

  let contracts = await listContracts();
  if (statusFilter) {
    contracts = contracts.filter((c) => c.status === statusFilter);
  }

  if (args[0] === "show" && args[1]) {
    const target = args[1].toLowerCase();
    const cap = contracts.find((c) =>
      c.filename.toLowerCase().includes(target) ||
      c.title.toLowerCase().includes(target)
    );
    if (!cap) {
      console.log(
        JSON.stringify({
          type: "error",
          message: `unknown contract: ${args[1]}`,
        }),
      );
      Deno.exit(1);
    }
    if (wantJson) {
      console.log(JSON.stringify(cap, null, 2));
    } else {
      renderDetail(cap);
    }
    Deno.exit(0);
  }

  const receipt = {
    type: "contracts",
    position: "4/F",
    action: "list",
    note: "foundation+frontier-pair = stabilized schemas (live projection)",
    source_of_truth: "contracts/*.md frontmatter",
    superseded_artifact:
      "contracts/index.ndjson — replaced by this live projection",
    summary: {
      total: contracts.length,
      active: contracts.filter((c) => c.status === "active").length,
      draft: contracts.filter((c) => c.status === "draft").length,
      open: contracts.filter((c) => c.status === "open").length,
      superseded: contracts.filter((c) => c.status === "superseded").length,
      pinned: contracts.filter((c) => c.pinned).length,
    },
    contracts,
    synonyms: [
      "contracts",
      "agreements",
      "schemas",
      "pacts",
      "контракти",
      "угоди",
      "схеми",
      "пакти",
    ],
    topology:
      "live read of contracts/*.md frontmatter; body remains as .md payload pending record-graph migration (codex 2026-05-13T211717Z)",
  };

  if (wantJson) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    renderTable(contracts);
  }
}
