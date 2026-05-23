#!/usr/bin/env -S deno run --allow-read
// src/x4011_contract_status_compiler.ts — Glossary Compiler v0.1 (PROBE)
// position: 4/01 (foundation, sub-position 11 = 0x011) — library-style organ,
// adjacent to x4010_hash (other foundation lib at 4/01)
// hex_dipole: "00 00 00 00 6C 00 33 00"
//   foundation_container+0.85 (PRIMARY: derives canonical lifecycle family)
//   harmony_emergence+0.20 (orders lifecycle states by rank)
// placement_policy: tier
// intent: derive contract lifecycle status family from glossary records (kind:9, family:contract.lifecycle); compare to current hardcoded statusRank as oracle
// maturity: active
// horizon: replace hardcoded statusRank in x4F00_contracts.ts after byte-identical verification stable; extend to other enum families (mode, claim_kind, stance)
// skill_tag: contract-status-compiler
// skill_safe: yes
//
// Beta Supervector — Glossary Compiler v0.1 PROBE
//
// Implements Kimi's supervector Beta (codex+antigravity AYE'd 2026-05-23,
// chord x2600_950655_antigravity_supervector-triad-response). Probe-first
// per codex's plan: standalone utility validates pattern, byte-identical
// to current behavior; wiring into x4F00_contracts deferred.
//
// Reads: src/x0001_glossary.ndjson (kind:9 records with family field)
// Emits: JSON list of {primary_handle, rank, position, handles, note}
//        sorted ascending by rank
//
// --verify mode: compares derived family to hardcoded oracle (the
// current statusRank function in x4F00_contracts.ts). Reports
// byte-identical: yes/no.
//
// Per GLOSSARY_DERIVED_SEMANTICS.v0.draft principle:
//   glossary = semantic source
//   schemas = generated affordance
//   English = compatibility projection
//   coordinate = identity

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const GLOSSARY_PATH = join(HERE, "x0001_glossary.ndjson");

interface LifecycleRecord {
  primary_handle: string;
  rank: number;
  position: string;
  handles: string[];
  note: string;
}

// Oracle: the hardcoded family in x4F00_contracts.ts statusRank.
// If this compiler's derived output ever diverges, EITHER the
// glossary records are stale, OR statusRank was changed without
// updating the glossary. Both are surfaceable bugs.
const ORACLE: { primary_handle: string; rank: number }[] = [
  { primary_handle: "pinned", rank: 0 },
  { primary_handle: "active", rank: 1 },
  { primary_handle: "draft", rank: 2 },
  { primary_handle: "open", rank: 3 },
  { primary_handle: "superseded", rank: 4 },
];

async function loadLifecycleFamily(): Promise<LifecycleRecord[]> {
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const out: LifecycleRecord[] = [];
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      if (r["00"] !== "9") continue;
      const meta = r["12"];
      if (!meta || meta.family !== "contract.lifecycle") continue;
      const handles = Array.isArray(r["02"]) ? r["02"] : [];
      out.push({
        primary_handle: handles[0] ?? "",
        rank: typeof meta.rank === "number" ? meta.rank : 999,
        position: r["04"] ?? "",
        handles,
        note: r["09"] ?? "",
      });
    } catch { /* skip malformed line */ }
  }
  out.sort((a, b) => a.rank - b.rank);
  return out;
}

function verifyAgainstOracle(
  derived: LifecycleRecord[],
): { ok: boolean; diffs: string[] } {
  const diffs: string[] = [];
  if (derived.length !== ORACLE.length) {
    diffs.push(
      `length: oracle=${ORACLE.length}, derived=${derived.length}`,
    );
  }
  for (let i = 0; i < Math.max(derived.length, ORACLE.length); i++) {
    const d = derived[i];
    const o = ORACLE[i];
    if (!d) {
      diffs.push(`index ${i}: derived missing (oracle: ${o.primary_handle})`);
      continue;
    }
    if (!o) {
      diffs.push(
        `index ${i}: oracle missing (derived: ${d.primary_handle}@${d.rank})`,
      );
      continue;
    }
    if (d.primary_handle !== o.primary_handle) {
      diffs.push(
        `index ${i}: handle differs (oracle: "${o.primary_handle}", derived: "${d.primary_handle}")`,
      );
    }
    if (d.rank !== o.rank) {
      diffs.push(
        `index ${i}: rank differs (oracle: ${o.rank}, derived: ${d.rank})`,
      );
    }
  }
  return { ok: diffs.length === 0, diffs };
}

if (import.meta.main) {
  const wantJson = Deno.args.includes("--json");
  const wantVerify = Deno.args.includes("--verify");

  const derived = await loadLifecycleFamily();

  if (wantVerify) {
    const { ok, diffs } = verifyAgainstOracle(derived);
    if (wantJson) {
      console.log(JSON.stringify(
        {
          type: "contract.lifecycle.verification",
          position: "4/01",
          action: "verify",
          oracle_source: "src/x4F00_contracts.ts statusRank",
          glossary_source:
            "src/x0001_glossary.ndjson kind:9 family:contract.lifecycle",
          ok,
          diffs,
          derived,
          oracle: ORACLE,
        },
        null,
        2,
      ));
    } else {
      console.log(`# contract.lifecycle compiler — verification`);
      console.log(`# ${"─".repeat(70)}`);
      console.log(`# oracle:   src/x4F00_contracts.ts statusRank()`);
      console.log(
        `# derived:  src/x0001_glossary.ndjson kind:9 family:contract.lifecycle`,
      );
      console.log(`# ${"─".repeat(70)}`);
      if (ok) {
        console.log(
          `# ✓ BYTE-IDENTICAL — derived lifecycle matches hardcoded oracle`,
        );
        console.log(`# ${"─".repeat(70)}`);
        for (const r of derived) {
          console.log(
            `#   rank ${r.rank}  ${r.primary_handle.padEnd(12)}  ${r.position}`,
          );
        }
      } else {
        console.log(`# ✗ DIVERGENCE — ${diffs.length} difference(s):`);
        for (const d of diffs) console.log(`#   ${d}`);
      }
    }
    Deno.exit(ok ? 0 : 1);
  }

  // Default: emit derived family
  if (wantJson) {
    console.log(JSON.stringify(
      {
        type: "contract.lifecycle.family",
        position: "4/01",
        action: "compile",
        source: "src/x0001_glossary.ndjson kind:9 family:contract.lifecycle",
        records: derived,
      },
      null,
      2,
    ));
  } else {
    console.log(`# contract.lifecycle family (derived from glossary)`);
    console.log(`# ${"─".repeat(70)}`);
    for (const r of derived) {
      console.log(
        `#   rank ${r.rank}  ${r.primary_handle.padEnd(12)}  ${r.position}`,
      );
      console.log(`#     handles: ${r.handles.join(", ")}`);
    }
    console.log(`# ${"─".repeat(70)}`);
    console.log(`# Run with --verify to compare against hardcoded oracle.`);
  }
}
