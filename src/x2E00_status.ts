#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x2E00_status.ts — status / state / "how-are-you" / composite self-reflection
// position: 2/E → mirror(2) × harmony-pair(E) = state-aware self-reflection
// maturity: active
// skill_safe: yes-readonly
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

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { wrap } from "../probes/receipt-envelope-encoder-v0/ts/envelope.ts";
import { CborValue } from "../probes/receipt-envelope-encoder-v0/ts/canonical_cbor.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const DISPATCHER = `${ROOT}/src/x0100_dispatch.ts`;

// SUBSTRATE_HEALTH.v0.1 staleness defaults (per contract suggestion table).
const TRINITY_MAX_AGE_SECONDS = 600;

type ExternalCi = {
  green: boolean | null;
  strict: boolean | null;
  red_signals: string[];
  checked_at: string | null;
  max_age_seconds: number;
  age_seconds: number | null;
  is_stale: boolean;
  source: "cache" | "live" | "unknown";
};

type WorktreeSummary = {
  dirty: boolean;
  staged: number;
  unstaged: number;
  untracked: number;
  changed_files: number;
  sample: string[];
};

async function loadWorktreeSummary(): Promise<WorktreeSummary> {
  const proc = new Deno.Command("git", {
    args: ["status", "--porcelain=v1"],
    cwd: ROOT,
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  if (out.code !== 0) {
    return {
      dirty: true,
      staged: 0,
      unstaged: 0,
      untracked: 0,
      changed_files: 0,
      sample: ["git status unavailable"],
    };
  }

  const lines = new TextDecoder().decode(out.stdout).split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);
  let staged = 0;
  let unstaged = 0;
  let untracked = 0;
  const files: string[] = [];

  for (const line of lines) {
    const x = line[0] ?? " ";
    const y = line[1] ?? " ";
    const path = line.slice(3).trim();
    if (x === "?" && y === "?") {
      untracked++;
    } else {
      if (x !== " ") staged++;
      if (y !== " ") unstaged++;
    }
    if (path) files.push(path);
  }

  return {
    dirty: lines.length > 0,
    staged,
    unstaged,
    untracked,
    changed_files: files.length,
    sample: files.slice(0, 12),
  };
}

// Load cached CI state. Tries the JSON sidecar first (machine-readable form,
// schema: trinity.audit-baseline.v0.1) and falls back to parsing the legacy
// markdown report. JSON is preferred per Codex tertiary tweak — markdown table
// regex is brittle to format changes.
//
// This is the CHEAP path. `t status --live` shells out to the green audit
// baseline and rewrites the cache. Per SUBSTRATE_HEALTH.v0.1: `t status`
// MUST NOT block on multi-minute CI by default.
async function loadCachedCi(): Promise<ExternalCi> {
  // (1) JSON sidecar preferred
  try {
    const jsonText = await Deno.readTextFile(
      join(ROOT, "src", "x6500_latest-green-audit.myc.json"),
    );
    const sidecar = JSON.parse(jsonText) as {
      schema: string;
      generated_at: string;
      gates: {
        name: string;
        status: "PASS" | "FAIL" | "SKIP";
        exit_code: number;
      }[];
    };
    if (sidecar.schema !== "trinity.audit-baseline.v0.1") {
      // unknown schema — fall through to markdown
      throw new Error("unknown sidecar schema");
    }
    const redSignals = sidecar.gates.filter((g) => g.status === "FAIL").map((
      g,
    ) => g.name);
    const anyPass = sidecar.gates.some((g) => g.status === "PASS");
    const anyFail = redSignals.length > 0;
    const checked_at = sidecar.generated_at;
    const now = Date.now();
    const checkedAtMs = new Date(checked_at).getTime();
    const age_seconds = Number.isNaN(checkedAtMs)
      ? null
      : Math.floor((now - checkedAtMs) / 1000);
    const is_stale = age_seconds === null ||
      age_seconds > TRINITY_MAX_AGE_SECONDS;
    return {
      green: anyPass || anyFail ? !anyFail : null,
      strict: null,
      red_signals: redSignals,
      checked_at,
      max_age_seconds: TRINITY_MAX_AGE_SECONDS,
      age_seconds,
      is_stale,
      source: "cache",
    };
  } catch {
    // fall through to markdown
  }

  // (2) Markdown fallback — kept for backward compat with old reports.
  try {
    const text = await Deno.readTextFile(
      join(ROOT, "src", "x6500_latest-green-audit.myc.md"),
    );
    const generatedMatch = text.match(/Generated:\s*(\S+)/);
    const checked_at = generatedMatch?.[1] ?? null;

    const redSignals: string[] = [];
    let anyFail = false;
    let anyPass = false;
    const rowRegex = /^\|\s*([^|]+?)\s*\|\s*(PASS|FAIL|SKIP)\s*\|/gm;
    let m: RegExpExecArray | null;
    while ((m = rowRegex.exec(text)) !== null) {
      const gate = m[1].trim();
      const status = m[2].trim();
      if (status === "FAIL") {
        redSignals.push(gate);
        anyFail = true;
      } else if (status === "PASS") anyPass = true;
    }

    const now = Date.now();
    const checkedAtMs = checked_at ? new Date(checked_at).getTime() : null;
    const age_seconds = checkedAtMs !== null && !Number.isNaN(checkedAtMs)
      ? Math.floor((now - checkedAtMs) / 1000)
      : null;
    const is_stale = age_seconds === null ||
      age_seconds > TRINITY_MAX_AGE_SECONDS;

    return {
      green: anyPass || anyFail ? !anyFail : null,
      strict: null,
      red_signals: redSignals,
      checked_at,
      max_age_seconds: TRINITY_MAX_AGE_SECONDS,
      age_seconds,
      is_stale,
      source: "cache",
    };
  } catch {
    return {
      green: null,
      strict: null,
      red_signals: [],
      checked_at: null,
      max_age_seconds: TRINITY_MAX_AGE_SECONDS,
      age_seconds: null,
      is_stale: true,
      source: "unknown",
    };
  }
}

async function loadLiveCi(): Promise<ExternalCi> {
  const proc = new Deno.Command("deno", {
    args: ["run", "-A", join(ROOT, "src", "x6500_run_baseline.ts"), "--green"],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  const cached = await loadCachedCi();

  // x6500 writes the sidecar even when one gate fails. If that fresh sidecar is
  // available, use it as the live result; otherwise surface the launcher failure
  // explicitly so callers do not trust an old cache after requesting --live.
  if (
    cached.age_seconds !== null && cached.age_seconds <= TRINITY_MAX_AGE_SECONDS
  ) {
    return { ...cached, source: "live" };
  }

  if (out.code !== 0) {
    const stderr = new TextDecoder().decode(out.stderr).trim();
    const stdout = new TextDecoder().decode(out.stdout).trim();
    const detail = stderr || stdout || "no output";
    return {
      green: false,
      strict: null,
      red_signals: [
        `audit:green refresh failed (exit ${out.code}): ${
          detail.split("\n")[0]
        }`,
      ],
      checked_at: new Date().toISOString(),
      max_age_seconds: TRINITY_MAX_AGE_SECONDS,
      age_seconds: 0,
      is_stale: false,
      source: "live",
    };
  }

  return { ...cached, source: "live" };
}

// SUBSTRATE_HEALTH.v0.1 overall derivation:
//   red (critical) = own fail > 0 OR (red_signals non-empty AND NOT is_stale)
//   warn (degraded) = own warn > 0 OR (red_signals non-empty AND is_stale)
//   else (healthy)
function deriveSubstrateOverall(
  ownOrgans: { ok: number; warn: number; fail: number; total: number },
  ci: ExternalCi,
): "healthy" | "degraded" | "critical" {
  const hasRed = ci.red_signals.length > 0;
  if (ownOrgans.fail > 0) return "critical";
  if (hasRed && !ci.is_stale) return "critical";
  if (ownOrgans.warn > 0) return "degraded";
  if (hasRed && ci.is_stale) return "degraded";
  return "healthy";
}

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

async function call_submodule_organ(
  submodule: string,
  hexPath: string,
): Promise<unknown> {
  const organPath = join(ROOT, submodule, hexPath);
  try {
    const stat = await Deno.stat(organPath);
    if (!stat.isFile) return null;
  } catch {
    return null;
  }

  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", organPath],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  if (out.code !== 0) return null;
  const raw = new TextDecoder().decode(out.stdout).trim();
  try {
    return JSON.parse(raw);
  } catch {
    return { type: "raw", text: raw, exit_code: out.code };
  }
}

if (import.meta.main) {
  // --envelope flag wraps substrate_health body as a ReceiptEnvelope.v0.1.
  // This is the first production envelope consumer (beyond synthetic probe
  // fixtures). When set, payload gains a `substrate_health_envelope` field.
  const wantEnvelope = Deno.args.includes("--envelope");
  const wantLive = Deno.args.includes("--live");

  // Gather from organs in parallel
  const [
    audit,
    health,
    liquidStatus,
    omegaStatus,
    mycStatus,
    externalCi,
    worktree,
  ] = await Promise.all([
    call_t("audit", ["--json"]),
    call_t("health"),
    // All 3 substrates adopted SUBSTRATE_SELF_ABI.v0.1 slot 2/E
    // by 2026-05-23: myc 2026-05-22, liquid + omega 2026-05-23.
    call_submodule_organ("liquid", "src/x2E00_status.ts"),
    call_submodule_organ("omega", "src/x2E00_status.ts"),
    call_submodule_organ("myc", "src/x2E00_status.ts"),
    wantLive ? loadLiveCi() : loadCachedCi(),
    loadWorktreeSummary(),
  ]);

  const auditAny = audit as Record<string, unknown> & {
    summary?: Record<string, number>;
    total?: number;
  };
  const healthAny = health as Record<string, unknown> & {
    summary?: Record<string, string | number>;
  };
  const liquidAny = liquidStatus as
    | Record<string, unknown> & { summary?: Record<string, string | number> }
    | null;
  const omegaAny = omegaStatus as
    | Record<string, unknown> & { summary?: Record<string, string | number> }
    | null;
  const mycAny = mycStatus as
    | Record<string, unknown> & { summary?: Record<string, string | number> }
    | null;

  const auditSummary = auditAny?.summary ?? {};
  const healthSummary = healthAny?.summary ?? {};

  const auditMatch = auditSummary.match ?? null;
  const auditMismatch = auditSummary.mismatch ?? null;
  const auditTotal = auditAny?.total ?? null;
  const healthOverall = healthSummary.overall ?? null;
  const healthOk = healthSummary.ok ?? null;
  const healthWarn = healthSummary.warn ?? null;
  const healthFail = healthSummary.fail ?? null;
  const healthTotal = healthSummary.total ?? null;

  // Synthesize overall state: reflects internal substrate health only.
  // External CI freshness is reported separately via summary.ci_freshness
  // so a stale-but-healthy substrate is not labelled "well_stale" — that
  // gating made every `t status` look degraded whenever CI hadn't pinged
  // recently, masking the actually-healthy internal state.
  let overall: string;
  if (
    healthOverall === "healthy" && typeof auditMatch === "number" &&
    typeof auditTotal === "number" && auditMatch >= auditTotal * 0.5
  ) {
    overall = "well";
  } else if (healthOverall === "healthy") {
    overall = "drifting"; // body ok but placement dissonant
  } else if (healthOverall === "degraded") {
    overall = "degraded";
  } else {
    overall = "unwell";
  }

  // If any submodule reports not healthy, downgrade the composite status.
  const subs = [liquidAny, omegaAny, mycAny];
  for (const sub of subs) {
    if (
      sub && sub.summary?.overall !== "healthy" &&
      overall === "well"
    ) {
      overall = "degraded";
    }
  }

  // External signal freshness — orthogonal to internal health. A consumer
  // who needs to know whether status is recent should read this field, not
  // re-derive it from overall.
  const ci_freshness: "fresh" | "stale" | "unknown" =
    externalCi.age_seconds === null
      ? "unknown"
      : externalCi.is_stale
      ? "stale"
      : "fresh";

  // SUBSTRATE_HEALTH.v0.1-shaped projection of trinity's own self-report.
  // This is the F-pilot adoption: contract is paper until at least one
  // substrate adheres. Trinity adheres here without forcing submodule changes.
  const ownOrgans = {
    ok: typeof healthOk === "number" ? healthOk : 0,
    warn: typeof healthWarn === "number" ? healthWarn : 0,
    fail: typeof healthFail === "number" ? healthFail : 0,
    total: typeof healthTotal === "number" ? healthTotal : 0,
  };

  const trinityOverall = deriveSubstrateOverall(ownOrgans, externalCi);

  const substrate_health = {
    type: "SubstrateHealth",
    schema: "trinity.substrate-health.v0.1",
    substrate: "trinity" as const,
    substrate_version: null, // future: git rev-parse short
    overall: trinityOverall,
    own_organs: ownOrgans,
    external_ci: externalCi,
    law_hash: null, // omega-side; trinity does not compute its own
    clock: {
      causal_ticks: null,
      era: null,
      bitcoin_block: null,
      wall_time_utc: new Date().toISOString(),
    },
    extras: {
      "trinity.audit": {
        schema: "trinity.audit.v0.1",
        body: {
          match: auditMatch,
          mismatch: auditMismatch,
          total: auditTotal,
        },
      },
      "trinity.worktree": {
        schema: "trinity.worktree.v0.1",
        body: worktree,
      },
    },
  };

  // RECEIPT_ENVELOPE wrap (opt-in via --envelope). Contract v1.0 active per
  // gemini AYE 2026-05-14T182641Z; wire schema id remains "trinity.receipt-
  // envelope.v0.1" (wire format and contract maturity version separate).
  // Demonstrates that trinity's self-report can be a verifiable cross-
  // substrate witness. Any other substrate can wrap the same SUBSTRATE_
  // HEALTH body with its own substrate_tag; `t court` then verifies
  // body_hash agreement.
  let substrate_health_envelope: unknown = undefined;
  if (wantEnvelope) {
    const envelope = await wrap(
      substrate_health as unknown as CborValue,
      "substrate_health",
      "trinity",
      { created_at_logical: { wall_time_utc: new Date().toISOString() } },
    );
    substrate_health_envelope = envelope;
  }

  const receipt = {
    type: "status",
    position: "2/E",
    action: "status",
    note:
      "mirror(2) × harmony-pair(E) — composite self-reflection across organs and submodules",
    summary: {
      overall,
      ci_freshness,
      health: {
        overall: healthOverall,
        ok: healthOk,
        warn: healthWarn,
        fail: healthFail,
        total: healthTotal,
      },
      audit: {
        match: auditMatch,
        mismatch: auditMismatch,
        total: auditTotal,
      },
      worktree,
    },
    // SUBSTRATE_HEALTH.v0.1 (Item F pilot adoption — trinity integration surface).
    // Legacy `summary` field above remains for backward-compat with existing
    // consumers; new consumers should prefer this canonical shape.
    substrate_health,
    ...(substrate_health_envelope !== undefined
      ? { substrate_health_envelope }
      : {}),
    organs: {
      health: healthAny,
      audit: auditAny,
    },
    submodules: {
      liquid: liquidAny,
      omega: omegaAny,
      myc: mycAny,
    },
    synonyms: [
      "status",
      "state",
      "як",
      "ти-як",
      "статус",
      "стан",
      "how-are-you",
    ],
    topology:
      "composes audit + health + git worktree state → unified self-reflection; recursive into submodules; emits SUBSTRATE_HEALTH.v0.1 projection; --live refreshes green audit evidence before reading CI cache; --envelope wraps body as ReceiptEnvelope.v0.1",
  };

  console.log(JSON.stringify(receipt, null, 2));
}
