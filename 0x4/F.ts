#!/usr/bin/env -S deno run --allow-read
// 0x4/F.ts — contracts / agreements / stabilized-schemas
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

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

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

async function readContract(filename: string): Promise<ContractEntry | null> {
  const path = join(CONTRACTS_DIR, filename);
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch {
    return null;
  }
  const fm = parseFrontmatter(text);
  const bodyLines = text.split("\n").length;
  // Pinned: SPORE_BOOTSTRAP_PIN or anything with status=active and Bitcoin
  // attestation marker in body
  const pinned = filename.includes("BOOTSTRAP_PIN") ||
    /bitcoin\s+attestation|op_return|inscribed/i.test(text);

  return {
    filename,
    path: `contracts/${filename}`,
    type: String(fm.type ?? "Unknown"),
    version: String(fm.version ?? ""),
    status: String(fm.status ?? "unknown"),
    title: String(fm.title ?? filename),
    pinned,
    related_count: Number(fm.related_count ?? 0),
    body_lines: bodyLines,
  };
}

async function listContracts(): Promise<ContractEntry[]> {
  const out: ContractEntry[] = [];
  for await (const entry of Deno.readDir(CONTRACTS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    if (entry.name === "README.md") continue;
    const c = await readContract(entry.name);
    if (c) out.push(c);
  }
  // Sort: pinned first, then active, then draft, then others, alpha within
  const statusRank = (s: string, pinned: boolean): number => {
    if (pinned) return 0;
    if (s === "active") return 1;
    if (s === "draft") return 2;
    if (s === "open") return 3;
    if (s === "superseded") return 4;
    return 5;
  };
  out.sort((a, b) => {
    const r = statusRank(a.status, a.pinned) - statusRank(b.status, b.pinned);
    if (r !== 0) return r;
    return a.filename.localeCompare(b.filename);
  });
  return out;
}

function renderTable(contracts: ContractEntry[]): void {
  console.log("# contracts @ 4/F — live projection of contracts/*.md frontmatter");
  console.log("# " + "─".repeat(86));
  console.log(`# ${contracts.length} contracts known`);
  console.log("");
  console.log("# status      version    pin  lines  file");
  console.log("# " + "─".repeat(86));
  for (const c of contracts) {
    const pinIcon = c.pinned ? "🔒" : "  ";
    const status = c.status.padEnd(11);
    const ver = c.version.padEnd(10);
    const lines = c.body_lines.toString().padStart(4);
    console.log(`# ${status} ${ver} ${pinIcon}  ${lines}  ${c.filename}`);
  }
  console.log("# " + "─".repeat(86));
  const byStatus = new Map<string, number>();
  for (const c of contracts) {
    byStatus.set(c.status, (byStatus.get(c.status) ?? 0) + 1);
  }
  const summary = Array.from(byStatus.entries()).map(([k, v]) => `${k}:${v}`).join("  ");
  const pinned = contracts.filter((c) => c.pinned).length;
  console.log(`# ${summary}  pinned:${pinned}`);
}

function renderDetail(c: ContractEntry): void {
  console.log(`# contract: ${c.title}`);
  console.log("# " + "─".repeat(70));
  console.log(`# file:        ${c.path}`);
  console.log(`# type:        ${c.type}`);
  console.log(`# version:     ${c.version}`);
  console.log(`# status:      ${c.status}`);
  console.log(`# pinned:      ${c.pinned ? "yes (externally anchored — do not modify)" : "no (internal — editable per consensus)"}`);
  console.log(`# body lines:  ${c.body_lines}`);
  console.log(`# related:     ${c.related_count}`);
  console.log("");
  console.log(`# To read body: cat ${c.path}`);
}

if (import.meta.main) {
  const args = Deno.args;
  const wantJson = args.includes("--json");
  const statusFilter = args.find((a) => a.startsWith("--status="))?.split("=")[1];

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
      console.log(JSON.stringify({ type: "error", message: `unknown contract: ${args[1]}` }));
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
    superseded_artifact: "contracts/index.ndjson — replaced by this live projection",
    summary: {
      total: contracts.length,
      active: contracts.filter((c) => c.status === "active").length,
      draft: contracts.filter((c) => c.status === "draft").length,
      open: contracts.filter((c) => c.status === "open").length,
      superseded: contracts.filter((c) => c.status === "superseded").length,
      pinned: contracts.filter((c) => c.pinned).length,
    },
    contracts,
    synonyms: ["contracts", "agreements", "schemas", "pacts", "контракти", "угоди", "схеми", "пакти"],
    topology: "live read of contracts/*.md frontmatter; body remains as .md payload pending record-graph migration (codex 2026-05-13T211717Z)",
  };

  if (wantJson) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    renderTable(contracts);
  }
}
