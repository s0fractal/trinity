#!/usr/bin/env -S deno run --allow-read --allow-run
// 0x2/E.ts — status / state / "how-are-you" / composite self-reflection
// position: 2/E → mirror(2) × harmony-pair(E) = state-aware self-reflection
// hex_dipole: "00 00 6C 40 33 26 4C 33"
//   mirror_apex+0.85 (PRIMARY: reflects substrate state to caller)
//   harmony_emergence+0.60 (synthesizes order assessment from organs)
//   triangle_build+0.50 (composes audit + health into one report)
//   foundation_container+0.40 (queries container state via organs)
//   completion_frontier+0.40 (produces unified verdict)
//   action_decision+0.30 (probes via subprocesses)
//   bucket 2/E: primary axis mirror (2), bucket 2 ← MATCH
//               secondary 'E' → hex E = axis 6 negative pole, dipole +0.60
//               on axis 6 ← PAIR-MATCH (sign-opposed; offer on need-bucket)
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 0
//
// status — first composite introspection word
//
// Spawns `t audit --json` and `t health`, parses both outputs, returns
// unified self-reflection receipt. Demonstrates aggregation pattern
// without lib/ imports: subprocess + JSON-parse, three lines inline.
//
// Future direction: recursive collection across submodules once they
// expose hex-coordinate-shaped audit/status entries. Then `t status`
// becomes "ти як" — a query that propagates into all organs and
// gathers their self-reports by dipole resonance, not keyword match.
//
// Glossary words: status, state, як, ти-як, статус, стан, how-are-you

import { dirname, fromFileUrl } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const DISPATCHER = `${ROOT}/0x0/01.ts`;

async function call_t(word: string, args: string[] = []): Promise<unknown> {
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", DISPATCHER, word, ...args],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  const raw = new TextDecoder().decode(out.stdout).trim();
  try {
    return JSON.parse(raw);
  } catch {
    return { type: "raw", text: raw, exit_code: out.code };
  }
}

if (import.meta.main) {
  // Gather from organs in parallel
  const [audit, health] = await Promise.all([
    call_t("audit", ["--json"]),
    call_t("health"),
  ]);

  const auditAny = audit as Record<string, unknown> & { summary?: Record<string, number>; total?: number };
  const healthAny = health as Record<string, unknown> & { summary?: Record<string, string | number> };

  const auditSummary = auditAny?.summary ?? {};
  const healthSummary = healthAny?.summary ?? {};

  const auditMatch = auditSummary.match ?? null;
  const auditMismatch = auditSummary.mismatch ?? null;
  const auditTotal = auditAny?.total ?? null;
  const healthOverall = healthSummary.overall ?? null;
  const healthOk = healthSummary.ok ?? null;
  const healthFail = healthSummary.fail ?? null;
  const healthTotal = healthSummary.total ?? null;

  // Synthesize overall state: harmony if health is healthy AND audit majority match;
  // otherwise reflect the worst signal honestly.
  let overall: string;
  if (healthOverall === "healthy" && typeof auditMatch === "number" && typeof auditTotal === "number" && auditMatch >= auditTotal * 0.5) {
    overall = "well";
  } else if (healthOverall === "healthy") {
    overall = "drifting"; // body ok but placement dissonant
  } else if (healthOverall === "degraded") {
    overall = "degraded";
  } else {
    overall = "unwell";
  }

  const receipt = {
    type: "status",
    position: "2/E",
    action: "status",
    note: "mirror(2) × harmony-pair(E) — composite self-reflection across organs",
    summary: {
      overall,
      health: {
        overall: healthOverall,
        ok: healthOk,
        fail: healthFail,
        total: healthTotal,
      },
      audit: {
        match: auditMatch,
        mismatch: auditMismatch,
        total: auditTotal,
      },
    },
    organs: {
      // full nested receipts preserved for caller inspection
      health: healthAny,
      audit: auditAny,
    },
    synonyms: ["status", "state", "як", "ти-як", "статус", "стан", "how-are-you"],
    topology: "composes audit + health → unified self-reflection; future: recursive into submodules",
  };

  console.log(JSON.stringify(receipt, null, 2));
}
