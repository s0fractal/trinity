#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x4F01_contract_audit.ts — contract classification audit (refs-graph)
// position: 4/F1 → foundation(4) × frontier(F) sub-1 = classification probe
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "26 26 40 33 6C 26 4C 33"
//   foundation_container+0.80 (PRIMARY: reads stabilized schemas)
//   completion_frontier+0.60 (sits at audit boundary)
//   mirror_apex+0.50 (reflects ref-graph reality)
//   harmony_emergence+0.40 (cross-substrate ref check)
//   bucket 4/F sub-1 — adjacent to x4F00 contracts; non-destructive read.
//   measured by claude-opus-4-7-1m, anchor block ~950700
// lifecycle_phase: 1
// placement_policy: axis
//
// intent: classify every contracts/*.md by ref-graph + lifecycle into
//   pinned_or_binding / active_reference / safe_to_compost / needs_review.
//   Non-destructive — produces a projection only. Compost decisions remain
//   manual or via x5910_compost_watchdog (which already gates on sunset).
//
// motivation: codex paired-critique routing block §4 — "Do contract compost
//   audit, not compost". Surface inbound refs from src/*.ts (organ_refs)
//   alongside the existing cowitness/contract_refs from x4F00, so the
//   architect can compost-or-promote per-file with full evidence.
//
// Subcommands:
//   t contract-audit              → human table
//   t contract-audit --json       → machine-readable JSON projection
//
// Glossary words: contract-audit, контракт-аудит, contracts-audit,
//                 ref-graph, refs-audit

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { type ContractEntry, listContracts } from "./x4F00_contracts.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const SRC_DIR = HERE;
const SUBMODULE_DIRS = ["myc", "omega", "liquid"] as const;

export type AuditClassification =
  | "pinned_or_binding"
  | "active_reference"
  | "needs_split"
  | "safe_to_compost"
  | "safe_to_keep_or_promote"
  | "needs_review";

export interface AuditEntry {
  filename: string;
  status: string;
  implementation_status: ContractEntry["implementation_status"];
  pinned: boolean;
  load_bearing: boolean;
  age_days: number | null;
  sunset_status: ContractEntry["sunset_status"];
  organ_refs_count: number;
  chord_refs_count: number;
  contract_refs_count: number;
  submodule_refs_count: number;
  submodule_refs_by_dir: Record<string, number>;
  classification: AuditClassification;
  rationale: string;
}

async function buildOrganRefsMap(
  contracts: ContractEntry[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const c of contracts) counts.set(c.filename, 0);

  for await (const entry of Deno.readDir(SRC_DIR)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(".ts")) continue;
    // Skip self — this organ's docs/scope notes reference contract names
    // as examples; counting them would be a false positive.
    if (entry.name === "x4F01_contract_audit.ts") continue;
    let text: string;
    try {
      text = await Deno.readTextFile(join(SRC_DIR, entry.name));
    } catch {
      continue;
    }
    for (const c of contracts) {
      if (text.includes(c.filename)) {
        counts.set(c.filename, (counts.get(c.filename) ?? 0) + 1);
      }
    }
  }
  return counts;
}

// Cross-substrate scan: ripgrep contracts/*.md filenames against
// myc/, omega/, liquid/. Uses git grep when available (fast, respects
// .gitignore) and falls back to rg if not. Per-submodule counts are
// surfaced so the architect can see which substrate consumes a given
// contract.
async function buildSubmoduleRefsMap(
  contracts: ContractEntry[],
): Promise<Map<string, { total: number; by_dir: Record<string, number> }>> {
  const result = new Map<
    string,
    { total: number; by_dir: Record<string, number> }
  >();
  for (const c of contracts) {
    result.set(c.filename, { total: 0, by_dir: {} });
  }

  for (const dir of SUBMODULE_DIRS) {
    const dirPath = join(ROOT, dir);
    try {
      await Deno.stat(dirPath);
    } catch {
      continue;
    }
    // git grep -l from inside each submodule. Fast and respects .gitignore.
    const proc = new Deno.Command("git", {
      args: [
        "-C",
        dirPath,
        "grep",
        "-l",
        "-F",
        "--",
        // We pass one filename at a time below; build a single combined
        // regex would be brittle for special chars in contract names.
        // Instead, do per-contract --any-of via -e flags.
        ...contracts.flatMap((c) => ["-e", c.filename]),
      ],
      stdout: "piped",
      stderr: "null",
    });
    let stdoutText = "";
    try {
      const out = await proc.output();
      stdoutText = new TextDecoder().decode(out.stdout);
    } catch {
      continue;
    }
    // For each matched path, count one ref per contract whose filename
    // appears in the file.
    const matchedPaths = stdoutText.trim().split("\n").filter((s) => s.length);
    for (const relPath of matchedPaths) {
      const fullPath = join(dirPath, relPath);
      let text: string;
      try {
        text = await Deno.readTextFile(fullPath);
      } catch {
        continue;
      }
      for (const c of contracts) {
        if (text.includes(c.filename)) {
          const r = result.get(c.filename)!;
          r.total++;
          r.by_dir[dir] = (r.by_dir[dir] ?? 0) + 1;
        }
      }
    }
  }
  return result;
}

function classify(
  c: ContractEntry,
  organ_refs: number,
  submodule_refs: number,
  submodule_by_dir: Record<string, number>,
): { classification: AuditClassification; rationale: string } {
  if (c.pinned) {
    return {
      classification: "pinned_or_binding",
      rationale: "pinned (Bitcoin-anchored or BOOTSTRAP_PIN); never compost",
    };
  }
  if (c.load_bearing) {
    return {
      classification: "pinned_or_binding",
      rationale: "load_bearing=true; ref-graph treats as binding",
    };
  }
  if (organ_refs > 0) {
    return {
      classification: "active_reference",
      rationale:
        `${organ_refs} organ ref(s) in src/*.ts; falsified-hypothesis ≠ unused contract`,
    };
  }
  if (submodule_refs > 0) {
    const where = Object.entries(submodule_by_dir)
      .filter(([_, n]) => n > 0)
      .map(([dir, n]) => `${dir}:${n}`)
      .join(",");
    return {
      classification: "active_reference",
      rationale:
        `${submodule_refs} submodule ref(s) [${where}]; cross-substrate consumer`,
    };
  }
  if (c.contract_refs_count > 0) {
    return {
      classification: "active_reference",
      rationale:
        `${c.contract_refs_count} contract→contract ref(s); part of vocabulary`,
    };
  }
  if (c.cowitness_count > 0 && c.status === "active") {
    return {
      classification: "active_reference",
      rationale:
        `${c.cowitness_count} chord cowitness(es); active contract has process-trail support`,
    };
  }

  const noRefs = c.cowitness_count === 0 && c.contract_refs_count === 0 &&
    organ_refs === 0 && submodule_refs === 0;

  if (noRefs && c.status === "draft") {
    return {
      classification: "safe_to_compost",
      rationale:
        "draft with 0 organ/chord/contract/submodule refs; compost candidate (manual AYE per file)",
    };
  }
  if (noRefs && c.status === "active") {
    return {
      classification: "needs_review",
      rationale:
        "active status but 0 refs anywhere (incl. submodules); orphan — promote use-site or demote to draft",
    };
  }
  if (c.cowitness_count > 0 && c.status === "draft") {
    return {
      classification: "safe_to_keep_or_promote",
      rationale:
        `${c.cowitness_count} chord cowitness(es), 0 organ refs; well-formed draft — promote or keep`,
    };
  }
  return {
    classification: "needs_review",
    rationale: "does not fit clean rules; manual triage",
  };
}

export async function collectAudit(): Promise<{
  summary: Record<AuditClassification | "total", number>;
  entries: AuditEntry[];
}> {
  const contracts = await listContracts();
  const [organMap, submoduleMap] = await Promise.all([
    buildOrganRefsMap(contracts),
    buildSubmoduleRefsMap(contracts),
  ]);

  const entries: AuditEntry[] = contracts.map((c) => {
    const organ_refs = organMap.get(c.filename) ?? 0;
    const subRefs = submoduleMap.get(c.filename) ?? { total: 0, by_dir: {} };
    const { classification, rationale } = classify(
      c,
      organ_refs,
      subRefs.total,
      subRefs.by_dir,
    );
    return {
      filename: c.filename,
      status: c.status,
      implementation_status: c.implementation_status,
      pinned: c.pinned,
      load_bearing: c.load_bearing,
      age_days: c.age_days,
      sunset_status: c.sunset_status,
      organ_refs_count: organ_refs,
      chord_refs_count: c.cowitness_count,
      contract_refs_count: c.contract_refs_count,
      submodule_refs_count: subRefs.total,
      submodule_refs_by_dir: subRefs.by_dir,
      classification,
      rationale,
    };
  });

  const summary: Record<AuditClassification | "total", number> = {
    total: entries.length,
    pinned_or_binding: 0,
    active_reference: 0,
    needs_split: 0,
    safe_to_compost: 0,
    safe_to_keep_or_promote: 0,
    needs_review: 0,
  };
  for (const e of entries) {
    summary[e.classification]++;
  }
  return { summary, entries };
}

function renderTable(entries: AuditEntry[]): void {
  console.log("# contract-audit @ 4/F1 — ref-graph classification");
  console.log("# " + "─".repeat(110));
  console.log(
    "# classification             status      pin  ld  organ  chord  ctrct  filename",
  );
  console.log("# " + "─".repeat(110));
  const order: AuditClassification[] = [
    "pinned_or_binding",
    "active_reference",
    "safe_to_keep_or_promote",
    "needs_review",
    "safe_to_compost",
  ];
  const sorted = [...entries].sort((a, b) => {
    const r = order.indexOf(a.classification) - order.indexOf(b.classification);
    return r !== 0 ? r : a.filename.localeCompare(b.filename);
  });
  for (const e of sorted) {
    const cls = e.classification.padEnd(25);
    const st = e.status.padEnd(10);
    const pin = e.pinned ? "🔒 " : "   ";
    const ld = e.load_bearing ? "▮ " : "  ";
    const o = String(e.organ_refs_count).padStart(4);
    const ch = String(e.chord_refs_count).padStart(4);
    const cr = String(e.contract_refs_count).padStart(4);
    console.log(
      `# ${cls} ${st}  ${pin} ${ld}${o}  ${ch}   ${cr}    ${e.filename}`,
    );
  }
  console.log("# " + "─".repeat(110));
}

const SCOPE_NOTE =
  "scan scope: trinity src/*.ts + chord surface + contracts/* + submodules myc/omega/liquid (git grep, .gitignore-respecting). Caveat: cross-substrate references typically use concept names rather than full filenames; filename scan will miss those. A contract reported as needs_review may still be semantically referenced under a different identifier.";

if (import.meta.main) {
  const args = Deno.args;
  const wantJson = args.includes("--json");
  const { summary, entries } = await collectAudit();

  if (wantJson) {
    const receipt = {
      type: "contract_audit",
      position: "4/F1",
      action: "classify",
      note: "ref-graph classification of contracts (non-destructive)",
      scope: SCOPE_NOTE,
      summary,
      entries,
    };
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    renderTable(entries);
    console.log(`# total: ${summary.total}`);
    console.log(
      `#   pinned_or_binding=${summary.pinned_or_binding}  active_reference=${summary.active_reference}  safe_to_keep_or_promote=${summary.safe_to_keep_or_promote}`,
    );
    console.log(
      `#   needs_review=${summary.needs_review}  safe_to_compost=${summary.safe_to_compost}`,
    );
    console.log(`# ${SCOPE_NOTE}`);
  }
}
