#!/usr/bin/env -S deno run -A
// src/x6F00_check.ts — author-time preflight: "is my change ready to push?"
// position: 6/F → harmony(6) × frontier-pair(F) = the harmony-check at the edge,
//   before the frontier (the push)
// maturity: active
// skill_safe: yes-with-care
//   regenerates the tracked projections in place (a benign, idempotent
//   maintenance write — the same the daemon does); --fix also applies deno fmt.
// hex_dipole: "00 00 26 00 00 33 5F 40"
//   harmony_emergence+0.74 (PRIMARY: harmonizes every pre-push gate; bucket 6 MATCH)
//   completion_frontier+0.40 (the final check before the frontier/push)
//   action_decision+0.30 (runs the gates), mirror_apex+0.30 (reflects readiness)
// placement_policy: axis
// horizon: none (v0 composes the canonical CI gate sequence locally)
// skill_tag: check
//
// intent: collapse the scattered, CI-time-enforced pre-push checks into ONE
//   author-time command, so an AI voice / digital organism learns its mistakes
//   at the keyboard, not from a red CI surprise. Closes review x6d00_954112 A1
//   (preflight) + A2 (one-command regen). Read of gates + a regen of the tracked
//   projections (catching the most common footgun: forgot to regenerate).
//
// Usage:
//   t check          run the gates + regenerate projections; report readiness
//   t check --fix    also `deno fmt` (apply) before checking
//   t check --json   machine-readable receipt

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const DISPATCH = join(HERE, "x0100_dispatch.ts");

// The tracked generated projections the CI regen-idempotence gate diffs.
const TRACKED_PROJECTIONS = [
  "src/x88F0_agents_bootstrap.myc.md",
  "src/x8CF0_skills_bootstrap.myc.md",
  "src/x2B88_decisions.myc.md",
  "src/x7B88_evidence_report.myc.md",
  "src/x8F88_external_surfaces.myc.md",
];
// The full regen sweep (order as the CI job runs it).
const GENS = [
  "agents",
  "skill",
  "memory",
  "roadmap",
  "probes",
  "decisions",
  "evidence",
  "external-surfaces",
];

interface GateResult {
  gate: string;
  ok: boolean;
  detail: string;
}

async function sh(
  cmd: string,
  args: string[],
): Promise<{ code: number; out: string; err: string }> {
  const p = new Deno.Command(cmd, {
    args,
    cwd: ROOT,
    stdout: "piped",
    stderr: "piped",
  });
  const o = await p.output();
  return {
    code: o.code,
    out: new TextDecoder().decode(o.stdout),
    err: new TextDecoder().decode(o.stderr),
  };
}

const t = (args: string[]) => sh("deno", ["run", "-A", DISPATCH, ...args]);

export function firstJson(s: string): unknown {
  const lines = s.split("\n");
  const i = lines.findIndex((l) =>
    l.trimStart().startsWith("{") || l.trimStart().startsWith("[")
  );
  if (i === -1) return null;
  try {
    return JSON.parse(lines.slice(i).join("\n"));
  } catch {
    return null;
  }
}

async function gateFmt(fix: boolean): Promise<GateResult> {
  if (fix) await sh("deno", ["fmt"]);
  const r = await sh("deno", ["fmt", "--check"]);
  return {
    gate: "fmt",
    ok: r.code === 0,
    detail: r.code === 0
      ? "formatted"
      : "unformatted files (run `t check --fix`)",
  };
}

async function gateAudit(): Promise<GateResult> {
  const j = firstJson((await t(["audit", "--json"])).out) as {
    summary?: Record<string, number>;
  } | null;
  const s = j?.summary;
  if (!s) return { gate: "audit", ok: false, detail: "no audit output" };
  const ok = s.mismatch === 0 && s.malformed === 0 &&
    s.import_warnings_count === 0 && s.orphans_count === 0 &&
    s.no_dipole_organ_gap === 0;
  return {
    gate: "audit",
    ok,
    detail:
      `match ${s.match}, mismatch ${s.mismatch}, import_warnings ${s.import_warnings_count}, orphans ${s.orphans_count}, dipole_gap ${s.no_dipole_organ_gap}`,
  };
}

async function gateCapabilities(): Promise<GateResult> {
  const j = firstJson((await t(["capabilities", "validate", "--json"])).out) as
    | {
      summary?: {
        valid?: boolean;
        unclassified_schema_types?: number;
        duplicate_schema_types?: number;
        errors?: number;
      };
    }
    | null;
  const s = j?.summary;
  if (!s) return { gate: "capabilities", ok: false, detail: "no output" };
  const ok = s.valid === true && s.unclassified_schema_types === 0 &&
    s.duplicate_schema_types === 0 && (s.errors ?? 0) === 0;
  return {
    gate: "capabilities",
    ok,
    detail:
      `valid=${s.valid}, unclassified ${s.unclassified_schema_types}, errors ${s.errors}`,
  };
}

async function gateTests(): Promise<GateResult> {
  const r = await sh("deno", ["task", "test:unit"]);
  const m = (r.out + r.err).match(/(\d+) passed[^\n]*?(\d+) failed/);
  return {
    gate: "test:unit",
    ok: r.code === 0,
    detail: m
      ? `${m[1]} passed, ${m[2]} failed`
      : (r.code === 0 ? "ok" : "FAILED"),
  };
}

/** Regenerate the tracked projections and report which ones drifted. This is the
 *  footgun-catcher: after a source/chord change, projections must be regenerated
 *  or the CI diff gate reddens. We regenerate (idempotent if already current) and
 *  surface the drift so the author stages it. */
async function gateRegen(): Promise<GateResult> {
  for (const g of GENS) await t([g, "--stable"]);
  const diff = await sh("git", [
    "diff",
    "--name-only",
    "--",
    ...TRACKED_PROJECTIONS,
  ]);
  const drifted = diff.out.split("\n").map((l) => l.trim()).filter(Boolean);
  return {
    gate: "projections",
    ok: drifted.length === 0,
    detail: drifted.length === 0
      ? "current"
      : `regenerated ${drifted.length} stale projection(s) — stage them: ${
        drifted.map((d) => d.replace("src/", "")).join(", ")
      }`,
  };
}

async function worktree(): Promise<string> {
  const r = await sh("git", ["status", "--porcelain"]);
  const n = r.out.split("\n").filter((l) => l.trim()).length;
  return n === 0 ? "clean" : `${n} changed file(s)`;
}

if (import.meta.main) {
  const fix = Deno.args.includes("--fix");
  const wantJson = Deno.args.includes("--json");

  const gates: GateResult[] = [];
  gates.push(await gateFmt(fix));
  gates.push(await gateAudit());
  gates.push(await gateCapabilities());
  gates.push(await gateTests());
  gates.push(await gateRegen());
  const tree = await worktree();

  const ready = gates.every((g) => g.ok);
  const receipt = {
    type: "check",
    position: "6/F",
    action: "check",
    ready,
    fix_applied: fix,
    worktree: tree,
    gates,
    note:
      "author-time preflight: the canonical pre-push gate sequence run locally. ready=true means CI should pass; stage any regenerated projections before commit.",
  };

  if (wantJson) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    console.log(
      `# check @ 6/F — preflight ${ready ? "✅ READY" : "⛔ NOT READY"}${
        fix ? " (--fix applied)" : ""
      }`,
    );
    for (const g of gates) {
      console.log(`#   ${g.ok ? "✅" : "⛔"} ${g.gate.padEnd(13)} ${g.detail}`);
    }
    console.log(`# worktree: ${tree}`);
    if (!ready) {
      console.log("# → fix the ⛔ gates (try `t check --fix`) before pushing.");
    }
  }
  Deno.exit(ready ? 0 : 1);
}
