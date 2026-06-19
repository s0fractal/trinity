#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x7B00_evidence.ts — evidence / ci-status / claims-evidence
// position: 7/B → completion(7) × build(B) = evidence spine matching
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "00 00 00 00 00 00 00 76"
//   completion_frontier+0.92 (PRIMARY: evidence bounds the claims)
//   bucket 7/B: primary axis completion (7), bucket 7 ← MATCH
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 0
// placement_policy: axis
//
// evidence — verify external-integration status (CI, deployment, anchors)
//
// Usage:
//   t evidence
//   t evidence --json
//   t evidence ci [--live] [--json]   federation CI freshness per admitted commit
//
// Glossary words: evidence, ci-status, claims-evidence, докази, ci-статус

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { listContracts } from "./x4F00_contracts.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

interface ClaimEvidence {
  claim: string;
  claim_status:
    | "implemented"
    | "partially_implemented"
    | "prototype"
    | "aspirational"
    | "disproven";
  contract_status:
    | "implemented"
    | "partially_implemented"
    | "prototype"
    | "aspirational"
    | "obsolete"
    | null;
  contract: string | null;
  command: string | null;
  test: string | null;
  evidence: string | null;
  evidence_source: "live" | "cached" | "declared" | "hardcoded_v0" | "missing";
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function countDaemonInvocations(): Promise<number> {
  try {
    const text = await Deno.readTextFile(
      join(ROOT, "src", "x7F01_daemon_invocations.ndjson"),
    );
    return text.trim().split("\n").filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}

async function callTStatus(): Promise<any> {
  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-all",
      join(ROOT, "src", "x2E00_status.ts"),
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  try {
    const out = await proc.output();
    if (out.code !== 0) return null;
    return JSON.parse(new TextDecoder().decode(out.stdout).trim());
  } catch {
    return null;
  }
}

async function callTExternalSurfaces(): Promise<any> {
  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-all",
      join(ROOT, "src", "x8F00_external_surfaces_gen.ts"),
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  try {
    const out = await proc.output();
    if (out.code !== 0) return null;
    return JSON.parse(new TextDecoder().decode(out.stdout).trim());
  } catch {
    return null;
  }
}

async function callTDecisions(): Promise<any> {
  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-all",
      join(ROOT, "src", "x8B00_decisions_gen.ts"),
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  try {
    const out = await proc.output();
    if (out.code !== 0) return null;
    return JSON.parse(new TextDecoder().decode(out.stdout).trim());
  } catch {
    return null;
  }
}

async function callTContractAudit(): Promise<any> {
  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-all",
      join(ROOT, "src", "x4F01_contract_audit.ts"),
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  try {
    const out = await proc.output();
    if (out.code !== 0) return null;
    return JSON.parse(new TextDecoder().decode(out.stdout).trim());
  } catch {
    return null;
  }
}

async function callTSelfPortrait(): Promise<any> {
  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-all",
      join(ROOT, "src", "x2300_self_portrait.ts"),
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  try {
    const out = await proc.output();
    if (out.code !== 0) return null;
    return JSON.parse(new TextDecoder().decode(out.stdout).trim());
  } catch {
    return null;
  }
}

async function callTApplyDryRun(): Promise<any> {
  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-all",
      join(ROOT, "src", "x5F00_apply.ts"),
      "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      "0000",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  try {
    const out = await proc.output();
    if (out.code !== 0) return null;
    return JSON.parse(new TextDecoder().decode(out.stdout).trim());
  } catch {
    return null;
  }
}

async function callTMycStatusShadow(): Promise<any> {
  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-all",
      join(ROOT, "src", "x92E0_myc_status.ts"),
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  try {
    const out = await proc.output();
    if (out.code !== 0) return null;
    return JSON.parse(new TextDecoder().decode(out.stdout).trim());
  } catch {
    return null;
  }
}

async function callTMycCapabilitiesShadow(): Promise<any> {
  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-all",
      join(ROOT, "src", "x94A0_myc_capabilities.ts"),
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  try {
    const out = await proc.output();
    if (out.code !== 0) return null;
    return JSON.parse(new TextDecoder().decode(out.stdout).trim());
  } catch {
    return null;
  }
}

async function callTMycProtocolAuditShadow(): Promise<any> {
  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-all",
      join(ROOT, "src", "x96C0_myc_protocol_audit.ts"),
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  try {
    const out = await proc.output();
    if (out.code !== 0) return null;
    return JSON.parse(new TextDecoder().decode(out.stdout).trim());
  } catch {
    return null;
  }
}

function parseAspirationalAgeArg(args: string[]): number | null {
  // --warn-aspirational-age           → default 30 days
  // --warn-aspirational-age=N         → N days
  for (const a of args) {
    if (a === "--warn-aspirational-age") return 30;
    const m = a.match(/^--warn-aspirational-age=(\d+)$/);
    if (m) return Number(m[1]);
  }
  return null;
}

// ── federation CI freshness (`t evidence ci [--live]`) ──────────────────────
// codex x6d00_954095 §2: answer "is each substrate's ADMITTED commit green on
// remote CI?" without trusting a stale local baseline. Read-only; `--live`
// fetches via gh and rewrites the cache, default reads the cache sidecar. This
// is a SEPARATE surface from substrate_health.external_ci (a signed contract the
// court depends on) — purely additive observability, no contract change.
const CI_CACHE = join(ROOT, "src", "x7B10_ci_freshness.latest.myc.json");
const CI_SUBMODULES = ["liquid", "myc", "omega"];

export type CiState = "green" | "red" | "stale" | "pending" | "unknown";
export interface CiRun {
  id: number | null;
  conclusion: string | null;
  status: string;
  head_sha: string;
  created_at: string | null;
  url: string;
}
export interface SubstrateCi {
  substrate: string;
  repo: string | null;
  admitted_commit: string | null;
  run: CiRun | null;
  age_seconds: number | null;
  state: CiState;
}

/** Pure state rule: a substrate is green ONLY when its admitted commit is the
 *  exact commit a successful run executed. A run on a different commit is stale
 *  (the admitted commit is unverified), not green. */
export function ciState(
  admitted: string | null,
  run: { conclusion: string | null; status: string; head_sha: string } | null,
): CiState {
  if (!admitted || !run) return "unknown";
  if (run.head_sha !== admitted) return "stale";
  if (run.conclusion === "success") return "green";
  if (run.conclusion === null || run.status !== "completed") return "pending";
  return "red";
}

/** owner/name from a git remote url (ssh or https form). */
export function repoFromRemote(url: string): string | null {
  const m = url.trim().match(/[:/]([^/:]+\/[^/]+?)(?:\.git)?$/);
  return m ? m[1] : null;
}

async function sh(
  cmd: string,
  args: string[],
): Promise<{ ok: boolean; out: string }> {
  try {
    const p = new Deno.Command(cmd, {
      args,
      stdout: "piped",
      stderr: "null",
    });
    const o = await p.output();
    return { ok: o.code === 0, out: new TextDecoder().decode(o.stdout).trim() };
  } catch {
    return { ok: false, out: "" };
  }
}

async function fetchSubstrateCi(
  substrate: string,
  path: string,
  admitted: string | null,
): Promise<SubstrateCi> {
  const remote = await sh("git", ["-C", path, "remote", "get-url", "origin"]);
  const repo = remote.ok ? repoFromRemote(remote.out) : null;
  const base: SubstrateCi = {
    substrate,
    repo,
    admitted_commit: admitted,
    run: null,
    age_seconds: null,
    state: "unknown",
  };
  if (!repo || !admitted) return base;
  const r = await sh("gh", [
    "run",
    "list",
    "--repo",
    repo,
    "--branch",
    "main",
    "--limit",
    "1",
    "--json",
    "databaseId,headSha,conclusion,status,createdAt,url",
  ]);
  if (!r.ok || !r.out) return base;
  let arr: Array<Record<string, unknown>>;
  try {
    arr = JSON.parse(r.out);
  } catch {
    return base;
  }
  if (!arr.length) return base;
  const raw = arr[0];
  const head_sha = String(raw.headSha ?? "");
  const created_at = (raw.createdAt as string) ?? null;
  const run: CiRun = {
    id: (raw.databaseId as number) ?? null,
    conclusion: (raw.conclusion as string) || null,
    status: String(raw.status ?? ""),
    head_sha,
    created_at,
    url: String(raw.url ?? ""),
  };
  const age_seconds = created_at
    ? Math.floor((Date.now() - new Date(created_at).getTime()) / 1000)
    : null;
  return { ...base, run, age_seconds, state: ciState(admitted, run) };
}

/** The commit trinity's HEAD records for a submodule (the ADMITTED pointer). */
async function admittedSubmoduleCommit(sub: string): Promise<string | null> {
  const r = await sh("git", ["-C", ROOT, "ls-tree", "HEAD", sub]);
  const m = r.out.match(/^\d+ commit ([0-9a-f]{40})\t/);
  return m ? m[1] : null;
}

function summarizeCi(subs: SubstrateCi[]) {
  const by_state: Record<CiState, number> = {
    green: 0,
    red: 0,
    stale: 0,
    pending: 0,
    unknown: 0,
  };
  for (const s of subs) by_state[s.state]++;
  const overall: CiState = by_state.red > 0
    ? "red"
    : (by_state.unknown > 0 || by_state.stale > 0)
    ? (by_state.stale > 0 ? "stale" : "unknown")
    : by_state.pending > 0
    ? "pending"
    : "green";
  return { total: subs.length, by_state, overall };
}

export function renderCi(result: {
  source: string;
  generated_at: string | null;
  substrates: SubstrateCi[];
  summary: ReturnType<typeof summarizeCi>;
}): string[] {
  const glyph: Record<CiState, string> = {
    green: "✅",
    red: "❌",
    stale: "⏳",
    pending: "…",
    unknown: "❔",
  };
  const lines = [
    `# federation CI freshness — overall ${
      glyph[result.summary.overall]
    } ${result.summary.overall}  (source: ${result.source}${
      result.generated_at ? `, ${result.generated_at.slice(0, 19)}Z` : ""
    })`,
  ];
  for (const s of result.substrates) {
    const age = s.age_seconds === null
      ? "—"
      : s.age_seconds < 3600
      ? `${Math.floor(s.age_seconds / 60)}m`
      : `${Math.floor(s.age_seconds / 3600)}h`;
    const sha = s.admitted_commit ? s.admitted_commit.slice(0, 7) : "???????";
    const runSha = s.run ? s.run.head_sha.slice(0, 7) : "—";
    const concl = s.run?.conclusion ?? s.run?.status ?? "—";
    const note = s.state === "stale" && s.run
      ? `  (CI ran ${runSha}, not admitted ${sha})`
      : "";
    lines.push(
      `#   ${glyph[s.state]} ${s.substrate.padEnd(8)} ${
        s.state.padEnd(7)
      } admitted ${sha}  run ${concl} ${age}${note}`,
    );
  }
  if (result.substrates.length === 0) {
    lines.push("#   (no data — run `t evidence ci --live`)");
  }
  return lines;
}

interface CiResult {
  type: "evidence_ci";
  source: "live" | "cache";
  generated_at: string | null;
  substrates: SubstrateCi[];
  summary: ReturnType<typeof summarizeCi>;
}

async function runCiMode(wantJson: boolean, wantLive: boolean): Promise<void> {
  let result: CiResult;
  if (wantLive) {
    const trinityHead =
      (await sh("git", ["-C", ROOT, "rev-parse", "HEAD"])).out;
    const subs = await Promise.all([
      fetchSubstrateCi("trinity", ROOT, trinityHead || null),
      ...CI_SUBMODULES.map(async (s) =>
        fetchSubstrateCi(s, join(ROOT, s), await admittedSubmoduleCommit(s))
      ),
    ]);
    result = {
      type: "evidence_ci",
      source: "live",
      generated_at: new Date().toISOString(),
      substrates: subs,
      summary: summarizeCi(subs),
    };
    await Deno.writeTextFile(CI_CACHE, JSON.stringify(result, null, 2) + "\n")
      .catch(() => {});
  } else {
    try {
      const cached = JSON.parse(await Deno.readTextFile(CI_CACHE));
      result = { ...cached, source: "cache" };
    } catch {
      result = {
        type: "evidence_ci",
        source: "cache",
        generated_at: null,
        substrates: [],
        summary: summarizeCi([]),
      };
    }
  }
  if (wantJson) console.log(JSON.stringify(result, null, 2));
  else console.log(renderCi(result).join("\n"));
}

async function main() {
  // `t evidence ci [--live] [--json]` — federation CI freshness (codex §2).
  if (Deno.args[0] === "ci") {
    await runCiMode(Deno.args.includes("--json"), Deno.args.includes("--live"));
    return;
  }
  const wantJson = Deno.args.includes("--json");
  const wantStrict = Deno.args.includes("--strict");
  const aspirationalAgeThreshold = parseAspirationalAgeArg(Deno.args);

  const ci_present = await exists(
    join(ROOT, ".github", "workflows", "ci.yml"),
  );
  const invocations = await countDaemonInvocations();

  // Query statuses in parallel to prevent bottlenecks
  const [
    contractsList,
    statusData,
    surfacesData,
    decisionsData,
    contractAuditData,
    portraitData,
    applyData,
    mycShadowData,
    mycCapabilitiesShadowData,
    mycProtocolAuditShadowData,
  ] = await Promise.all([
    listContracts().catch(() => []),
    callTStatus(),
    callTExternalSurfaces(),
    callTDecisions(),
    callTContractAudit(),
    callTSelfPortrait(),
    callTApplyDryRun(),
    callTMycStatusShadow(),
    callTMycCapabilitiesShadow(),
    callTMycProtocolAuditShadow(),
  ]);

  const executable_contracts = contractsList.filter(
    (c) => c.implementation_status === "implemented",
  ).length;
  const aspirational_contracts = contractsList.filter(
    (c) => c.implementation_status === "aspirational",
  ).length;

  // Extract divergence metrics for antigravity
  const antigravityVoice = portraitData?.voices?.find(
    (v: any) => v.voice === "antigravity",
  );
  const divAngle = antigravityVoice?.divergence_angle_degrees;
  const divAngleStr = divAngle !== undefined && divAngle !== null
    ? `${divAngle.toFixed(1)}°`
    : "unknown";
  const divClass = antigravityVoice?.divergence_classification ?? "unknown";

  // Build the claims-to-evidence matrix
  const claims_matrix: ClaimEvidence[] = [
    {
      // a settled proven FACT (not a live invariant): the typed human-model
      // constitution reached finality by a genuine cross-class quorum. Static +
      // deterministic; the command reproduces it independently.
      claim: "Human-Model Constitution Ratified",
      claim_status: "implemented",
      contract_status: null,
      contract: "myc/public/proposals/h.d2f13b52b10c.proposal.myc.md",
      command: "./t myc lifecycle",
      test: "./t myc lifecycle",
      evidence:
        "h.d2f13b52b10c final: class quorum human:1/1, model:1/1 (claude, s0fractal)",
      evidence_source: "declared",
    },
    {
      // a settled proven FACT: a v1 temporal signature was emitted and submitted to
      // OpenTimestamps. `fully_anchored` still requires a Bitcoin node — the honesty
      // line the temporal epoch holds; the command reports it exactly.
      claim: "Temporal Signature Bitcoin-Anchored",
      claim_status: "implemented",
      contract_status: null,
      contract: "myc/public/temporal/codex-x2d00-954422.envelope.json.ots",
      command:
        "./t myc temporal-verify myc/public/temporal/codex-x2d00-954422.envelope.json --anchor myc/public/temporal/codex-x2d00-954422.envelope.json.ots [--bitcoin-node <url>]",
      test:
        "./t myc temporal-verify myc/public/temporal/codex-x2d00-954422.envelope.json",
      evidence:
        "codex v1 envelope signed (valid) + OTS proof embeds BitcoinBlockHeaderAttestation; fully_anchored needs a Bitcoin node",
      evidence_source: "declared",
    },
    {
      claim: "Substrate Health Check",
      claim_status: "implemented",
      contract_status: null,
      contract: "contracts/SUBSTRATE_HEALTH.v0.1.md",
      command: "./t status",
      test: "deno fmt --check && ./t status",
      evidence: `trinity status: ${
        statusData?.substrate_health?.overall ?? "unknown"
      }`,
      evidence_source: statusData ? "live" : "missing",
    },
    {
      claim: "External Surfaces Tracking",
      claim_status: "implemented",
      contract_status: null,
      contract: "contracts/IN_LEDGER_SRC_PROJECTION.v0.2.md",
      command: "./t external-surfaces",
      test: "./t external-surfaces --json",
      evidence: `tracked: ${surfacesData?.entries?.length ?? 0} items (${
        surfacesData?.entries?.filter((s: any) =>
          s.category === "compatibility_abi"
        ).length ?? 0
      } ABI, ${
        surfacesData?.entries?.filter((s: any) =>
          s.category === "compatibility"
        )
          .length ?? 0
      } docs, ${
        surfacesData?.entries?.filter((s: any) => s.category === "experimental")
          .length ?? 0
      } probes, ${
        surfacesData?.entries?.filter((s: any) => s.category === "live_chord")
          .length ?? 0
      } chords)`,
      evidence_source: surfacesData ? "live" : "missing",
    },
    {
      claim: "Chord Decision Ledger",
      claim_status: "implemented",
      contract_status: null,
      contract: "contracts/PROCESS_OBJECTS.v0.1.md",
      command: "./t decisions",
      test: "./t decisions --json",
      evidence: `${decisionsData?.summary?.total_chords ?? 0} chords parsed: ${
        decisionsData?.summary?.proposals ?? 0
      } proposals, ${decisionsData?.summary?.decisions ?? 0} decisions, ${
        decisionsData?.summary?.receipts ?? 0
      } receipts, ${decisionsData?.summary?.critiques ?? 0} critiques`,
      evidence_source: decisionsData ? "live" : "missing",
    },
    {
      claim: "Contract Ref-Graph Audit",
      claim_status: "prototype",
      contract_status: null,
      contract: "contracts/PROCESS_OBJECTS.v0.1.md",
      command: "./t contract-audit",
      test: "./t contract-audit --json",
      evidence: `${
        contractAuditData?.summary?.total ?? 0
      } contracts classified; ${
        contractAuditData?.summary?.needs_review ?? "?"
      } need review; ${
        contractAuditData?.summary?.safe_to_compost ?? "?"
      } safe-to-compost`,
      evidence_source: contractAuditData ? "live" : "missing",
    },
    {
      claim: "Ecosystem Submodule Federation",
      claim_status: "partially_implemented",
      contract_status: null,
      // TRINITY_CAPABILITIES.v0.1 (superseded 2026-05-14) was the old anchor.
      // SUBSTRATE_SELF_ABI lists all three substrate projection files in its
      // `hears:` block and is the current federation contract.
      contract: "contracts/SUBSTRATE_SELF_ABI.v0.1.md",
      command: "git submodule status",
      test: "deno task submodules:status",
      evidence: `liquid: ${
        statusData?.submodules?.liquid?.summary?.overall ?? "missing"
      }, omega: ${
        statusData?.submodules?.omega?.summary?.overall ?? "missing"
      }, myc: ${statusData?.submodules?.myc?.summary?.overall ?? "missing"}`,
      evidence_source: statusData?.submodules ? "live" : "missing",
    },
    {
      claim: "SPORE Runtime Execution",
      claim_status: "prototype",
      contract_status: null,
      contract: "contracts/SPORE.v0.draft.md",
      command: "./t apply",
      test:
        "./t apply bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi 0000",
      evidence: `SPORE execution active (backend: ${
        applyData?.backend_kind ?? "unknown"
      }, simulation: ${applyData?.simulation ?? false})`,
      evidence_source: applyData ? "live" : "missing",
    },
    {
      claim: "MYC x9 Shadow Parity",
      claim_status: "prototype",
      contract_status: null,
      contract: "contracts/X9_SUBSTRATE_NAMESPACE.v0.draft.md",
      command:
        "./t myc-status-shadow && ./t myc-capabilities-shadow && ./t myc-protocol-audit-shadow",
      test:
        "deno check src/x9*.ts && ./t myc-status-shadow --json && ./t myc-capabilities-shadow --json && ./t myc-protocol-audit-shadow --json",
      evidence: `status: ${
        mycShadowData?.summary?.native_overall ?? "unknown"
      }; capabilities: ${
        mycCapabilitiesShadowData?.summary?.native_overall ?? "unknown"
      }/${mycCapabilitiesShadowData?.summary?.total ?? "?"}; protocol_audit: ${
        mycProtocolAuditShadowData?.summary?.overall ?? "unknown"
      } (${mycShadowData?.summary?.parity ?? "no-parity"})`,
      evidence_source:
        mycShadowData && mycCapabilitiesShadowData && mycProtocolAuditShadowData
          ? "live"
          : "missing",
    },
    {
      claim: "AI Voice Citizenship & Daemon",
      claim_status: "prototype",
      contract_status: null,
      contract: "contracts/VOICE_DAEMON.v0.draft.md",
      command: "./t daemon",
      test: "none",
      evidence:
        `${invocations} daemon invocation records, autonomous voice triggers: 0 (manual loop)`,
      evidence_source: "live",
    },
    {
      claim: "Bitcoin History Anchoring",
      claim_status: "aspirational",
      contract_status: null,
      contract: "contracts/SPORE_BOOTSTRAP_PIN.v0.md",
      command: "./t anchor-prep",
      test: "none",
      evidence: `bitcoin_block: ${
        statusData?.substrate_health?.clock?.bitcoin_block ?? "null"
      } (no active transaction RPC)`,
      evidence_source: statusData ? "live" : "missing",
    },
    {
      claim: "Free Energy Principle (FEP) Minimization",
      claim_status: "aspirational",
      contract_status: null,
      contract: "contracts/FREE_ENERGY_PRINCIPLE.v0.1.md",
      command: "none",
      test: "none",
      evidence:
        "F_total calculation: null (no active variational entropy phase coherence)",
      evidence_source: "hardcoded_v0",
    },
    {
      claim: "Kuramoto Phase Coherence",
      claim_status: "aspirational",
      contract_status: null,
      contract: "contracts/HEX_DIPOLE_SEED.v0.draft.md",
      command: "none",
      test: "none",
      evidence: "phase_coherence: null",
      evidence_source: "hardcoded_v0",
    },
    {
      claim: "Voice comfort-field divergence",
      claim_status: "prototype",
      contract_status: null,
      contract: "contracts/VOICES.v0.1.md",
      command: "./t self-portrait",
      test: "./t self-portrait antigravity --json",
      evidence: `divergence angle: ${divAngleStr} (antigravity: ${divClass})`,
      evidence_source: portraitData ? "live" : "missing",
    },
    {
      claim: "Substrate Self-Description ABI (x2E/x8D/x8E)",
      claim_status: "partially_implemented",
      contract_status: null,
      contract: "contracts/SUBSTRATE_SELF_ABI.v0.1.md",
      command: "./t status && ./t roadmap && ./t probes",
      test: "./t status --json && ./t roadmap && ./t probes",
      evidence: `status:${
        statusData?.substrate_health?.overall ?? "?"
      }, decisions:${
        decisionsData?.summary?.total_chords ?? 0
      } chords, 3 self-description axes generating`,
      evidence_source: statusData && decisionsData ? "live" : "missing",
    },
    {
      claim: "Governance Flow (propose/cowitness/verdict/codeicide)",
      claim_status: "partially_implemented",
      contract_status: null,
      contract: "contracts/GOVERNANCE_FLOW.v0.md",
      command:
        "./t propose / ./t cowitness / ./t verdict / ./t apply-codeicide",
      test: "./t decisions --json",
      evidence: `${decisionsData?.summary?.proposals ?? 0} proposals, ${
        decisionsData?.summary?.decisions ?? 0
      } decisions, ${decisionsData?.summary?.receipts ?? 0} receipts, ${
        decisionsData?.summary?.critiques ?? 0
      } critiques (governance chord activity)`,
      evidence_source: decisionsData ? "live" : "missing",
    },
  ];

  // Dynamically resolve contract status
  for (const c of claims_matrix) {
    if (c.contract) {
      const filename = c.contract.split("/").pop();
      const match = contractsList.find((x) => x.filename === filename);
      if (match) {
        c.contract_status = match.implementation_status;
      }
    }
  }

  // Strict mode validation
  const strict_failures: string[] = [];
  for (const c of claims_matrix) {
    if (c.claim_status === "implemented") {
      if (!c.test || c.test === "none") {
        strict_failures.push(
          `Claim "${c.claim}" is implemented but has no valid test command (test: "${c.test}")`,
        );
      }
      if (!c.command || c.command === "none") {
        strict_failures.push(
          `Claim "${c.claim}" is implemented but has no valid command (command: "${c.command}")`,
        );
      }
      if (c.evidence_source !== "live" && c.evidence_source !== "cached") {
        strict_failures.push(
          `Claim "${c.claim}" is implemented but has non-verifiable source (source: "${c.evidence_source}")`,
        );
      }
    }
  }
  const strict_ok = strict_failures.length === 0;

  // Soft warnings for contracts that have sat ASPIRATIONAL longer than the
  // architect-set threshold. Surface as advice, never fail strict mode.
  const aspirational_age_warnings: { filename: string; age_days: number }[] =
    [];
  if (aspirationalAgeThreshold !== null) {
    for (const c of contractsList) {
      if (
        c.implementation_status === "aspirational" &&
        typeof c.age_days === "number" &&
        c.age_days > aspirationalAgeThreshold
      ) {
        aspirational_age_warnings.push({
          filename: c.filename,
          age_days: c.age_days,
        });
      }
    }
    aspirational_age_warnings.sort((a, b) => b.age_days - a.age_days);
  }

  const payload = {
    type: "evidence",
    position: "7/B",
    action: "evidence",
    ci_present,
    last_green_ci: null,
    deployed_url: null,
    external_consumers: [] as string[],
    published_packages: [] as string[],
    bitcoin_anchor_txid: null,
    daemon_invocation_records: invocations,
    autonomous_voice_invocations: 0,
    executable_contracts,
    aspirational_contracts,
    strict_mode: wantStrict,
    strict_ok,
    strict_failures,
    aspirational_age_threshold: aspirationalAgeThreshold,
    aspirational_age_warnings,
    contracts_by_status: {
      implemented: contractsList.filter((c) =>
        c.implementation_status === "implemented"
      ).map((c) => c.filename),
      partially_implemented: contractsList.filter((c) =>
        c.implementation_status === "partially_implemented"
      ).map((c) => c.filename),
      prototype: contractsList.filter((c) =>
        c.implementation_status === "prototype"
      ).map((c) => c.filename),
      aspirational: contractsList.filter((c) =>
        c.implementation_status === "aspirational"
      ).map((c) => c.filename),
      obsolete: contractsList.filter((c) =>
        c.implementation_status === "obsolete"
      ).map((c) => c.filename),
    },
    claims_matrix,
  };

  const wantStable = Deno.args.includes("--stable");
  if (wantStable) {
    const reportPath = join(ROOT, "src", "x7B88_evidence_report.myc.md");
    const lines: string[] = [];
    lines.push(
      `<!-- AUTO-GENERATED by src/x7B00_evidence.ts — do not edit by hand. -->`,
    );
    lines.push(``);
    lines.push(`# Substrate evidence report`);
    lines.push(``);
    lines.push(
      `*Generated proof-carrying claims-to-evidence matrix verifying current repository invariants.*`,
    );
    lines.push(``);
    lines.push(`## Operational Integrity`);
    lines.push(``);
    lines.push(`| Metric | Value |`);
    lines.push(`| :--- | :--- |`);
    lines.push(`| CI Configured | ${ci_present ? "YES" : "NO"} |`);
    // Daemon invocation count is runtime-volatile (it grows on every `t daemon
    // run`/`tick --act`); a live count here would make this stable report churn
    // — and self-trigger `tick --act` into an infinite refresh loop, since --act
    // logs an invocation. Canonicalized; live count via `t evidence` (non-stable).
    lines.push(`| Daemon Invocation Records | runtime (see \`t evidence\`) |`);
    lines.push(
      `| Autonomous Voice Invocations | ${payload.autonomous_voice_invocations} |`,
    );
    lines.push(`| Executable Contracts | ${executable_contracts} |`);
    lines.push(`| Aspirational Contracts | ${aspirational_contracts} |`);
    lines.push(
      `| Strict Verification Status | ${strict_ok ? "PASS" : "FAIL"} |`,
    );
    lines.push(``);

    lines.push(`## Claims-to-Evidence Matrix`);
    lines.push(``);
    lines.push(
      "| Core Claim | Claim Status | Contract | Contract Status | Command | Source | Live Evidence |",
    );
    lines.push(
      "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
    );
    // Stable mode must be environment-independent so the committed report
    // reproduces in CI. These rows are environment-volatile: cross-substrate
    // rows reflect LIVE submodule state (absent when the private submodules
    // aren't checked out), and the daemon row reflects the runtime invocation
    // count (which `tick --act` itself increments — a live count would self-
    // trigger an infinite refresh loop). Canonicalized here; live values stay
    // available via `t evidence` (non-stable) and the strict JSON gate. All
    // other rows keep drift-detection.
    const VOLATILE_CLAIMS = new Set([
      "Ecosystem Submodule Federation",
      "SPORE Runtime Execution",
      "MYC x9 Shadow Parity",
      "AI Voice Citizenship & Daemon",
      // both of these embed the LIVE overall status (healthy/degraded), which is
      // network-dependent: CI under DNS restriction reports degraded while a
      // connected machine reports healthy. A stable report must not bake that in —
      // codex's point that environment-unavailable ≠ a status value.
      "Substrate Health Check",
      "Substrate Self-Description ABI (x2E/x8D/x8E)",
    ]);
    for (const c of claims_matrix) {
      const contractCell = c.contract
        ? `[${c.contract.split("/").pop()}](${c.contract})`
        : "*none*";
      const cmdCell = c.command && c.command !== "none"
        ? `\`${c.command}\``
        : "*none*";
      const contractStatusCell = c.contract_status
        ? `**${c.contract_status.toUpperCase()}**`
        : "*none*";
      const isXSub = VOLATILE_CLAIMS.has(c.claim);
      const evidenceSource = isXSub ? "live" : c.evidence_source;
      const evidenceCell = isXSub
        ? "environment-dependent (run the command for live evidence)"
        : c.evidence;
      lines.push(
        `| ${c.claim} | **${c.claim_status.toUpperCase()}** | ${contractCell} | ${contractStatusCell} | ${cmdCell} | \`${evidenceSource}\` | ${evidenceCell} |`,
      );
    }
    lines.push(``);

    await Deno.writeTextFile(reportPath, lines.join("\n"));
    const { formatGeneratedFile } = await import("./x0012_generated_format.ts");
    await formatGeneratedFile(reportPath);

    const receipt = {
      type: "evidence_report_gen",
      position: "7/B",
      action: "generate",
      note: "evidence report generated successfully",
      strict_ok,
    };
    console.log(JSON.stringify(receipt, null, 2));
    Deno.exit(0);
  }

  if (wantJson) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log("# evidence → 7/B");
    console.log("─".repeat(80));
    console.log(
      `CI configured (ci_present):         ${ci_present ? "YES" : "NO"}`,
    );
    console.log(
      `Last green CI (last_green_ci):       ${
        payload.last_green_ci ?? "null (not detected)"
      }`,
    );
    console.log(
      `Deployed URL (deployed_url):         ${
        payload.deployed_url ?? "null (not deployed)"
      }`,
    );
    console.log(
      `External consumers:                  ${
        payload.external_consumers.length === 0
          ? "none"
          : payload.external_consumers.join(", ")
      }`,
    );
    console.log(
      `Published packages:                  ${
        payload.published_packages.length === 0
          ? "none"
          : payload.published_packages.join(", ")
      }`,
    );
    console.log(
      `Bitcoin anchor TXID:                 ${
        payload.bitcoin_anchor_txid ?? "null"
      }`,
    );
    console.log(
      `Daemon invocation records:           ${payload.daemon_invocation_records}`,
    );
    console.log(
      `Autonomous voice invocations:        ${payload.autonomous_voice_invocations} (requires cron daemon trigger)`,
    );
    console.log(
      `Executable contracts (implemented):   ${executable_contracts}`,
    );
    console.log(
      `Aspirational contracts:              ${aspirational_contracts}`,
    );
    console.log("─".repeat(80));
    console.log("");
    console.log("## Claims-to-Evidence Matrix");
    console.log("");
    console.log(
      "| Core Claim | Claim Status | Contract | Contract Status | Command | Source | Live Evidence |",
    );
    console.log(
      "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
    );
    for (const c of claims_matrix) {
      const contractCell = c.contract
        ? `[${c.contract.split("/").pop()}](${c.contract})`
        : "*none*";
      const cmdCell = c.command && c.command !== "none"
        ? `\`${c.command}\``
        : "*none*";
      const contractStatusCell = c.contract_status
        ? `**${c.contract_status.toUpperCase()}**`
        : "*none*";
      console.log(
        `| ${c.claim} | **${c.claim_status.toUpperCase()}** | ${contractCell} | ${contractStatusCell} | ${cmdCell} | \`${c.evidence_source}\` | ${c.evidence} |`,
      );
    }
    console.log("─".repeat(80));
  }

  // Soft warnings: aspirational contracts past threshold age. Never fail.
  if (
    aspirationalAgeThreshold !== null && aspirational_age_warnings.length > 0
  ) {
    console.error("");
    console.error(
      `# [ASPIRATIONAL-AGE WARNING] threshold=${aspirationalAgeThreshold} days; ${aspirational_age_warnings.length} contract(s) past threshold:`,
    );
    for (const w of aspirational_age_warnings) {
      console.error(`#   ${w.filename} (${w.age_days}d aspirational)`);
    }
    console.error(
      "# (warning only — not a failure; consider promotion to prototype or demotion to draft+sunset)",
    );
  }

  // Exit with code 1 if strict checks fail
  if (wantStrict && !strict_ok) {
    for (const fail of strict_failures) {
      console.error(`# [STRICT FAIL] ${fail}`);
    }
    console.error("# [STRICT FAILURE] Strict evidence validation failed.");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
