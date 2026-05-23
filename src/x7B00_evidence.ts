#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x7B00_evidence.ts — evidence / ci-status / claims-evidence
// position: 7/B → completion(7) × build(B) = evidence spine matching
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
//
// Glossary words: evidence, ci-status, claims-evidence, докази, ci-статус

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { listContracts } from "./x4F00_contracts.ts";
import { collectExternalSurfaces } from "./x8F10_external_surfaces_core.ts";
import { collectDecisions } from "./x8B00_decisions_gen.ts";

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
      "0000",
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

async function main() {
  const wantJson = Deno.args.includes("--json");
  const wantStrict = Deno.args.includes("--strict");

  const ci_present = await exists(
    join(ROOT, ".github", "workflows", "ci.yml"),
  );
  const invocations = await countDaemonInvocations();

  // Query statuses in parallel to prevent bottlenecks
  const [
    contractsList,
    surfaces,
    decisions,
    statusData,
    surfacesData,
    decisionsData,
    portraitData,
    applyData,
  ] = await Promise.all([
    listContracts().catch(() => []),
    collectExternalSurfaces({ stable: true, includeVolatile: false }).catch(
      () => [],
    ),
    collectDecisions(true).catch(() => ({
      summary: {
        total_chords: 0,
        proposals: 0,
        decisions: 0,
        receipts: 0,
        critiques: 0,
      },
      entries: [],
    })),
    callTStatus(),
    callTExternalSurfaces(),
    callTDecisions(),
    callTSelfPortrait(),
    callTApplyDryRun(),
  ]);

  const executable_contracts = contractsList.filter(
    (c) => c.implementation_status === "implemented",
  ).length;
  const aspirational_contracts = contractsList.filter(
    (c) => c.implementation_status === "aspirational",
  ).length;

  // Count surfaces by category
  const compCount =
    surfaces.filter((s) => s.category === "compatibility_abi").length;
  const docsCount =
    surfaces.filter((s) => s.category === "compatibility").length;
  const probeCount =
    surfaces.filter((s) => s.category === "experimental").length;
  const chordCount = surfaces.filter((s) => s.category === "live_chord").length;

  const decSummary = decisions.summary;

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
      claim: "Ecosystem Submodule Federation",
      claim_status: "partially_implemented",
      contract_status: null,
      contract: "contracts/TRINITY_CAPABILITIES.v0.1.md",
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
      test: "./t apply 0000 0000",
      evidence: `SPORE simulation active (backend: ${
        applyData?.backend_kind ?? "unknown"
      }, simulation: ${applyData?.simulation ?? false})`,
      evidence_source: applyData ? "live" : "missing",
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
    lines.push(
      `| Daemon Invocation Records | ${payload.daemon_invocation_records} |`,
    );
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
      lines.push(
        `| ${c.claim} | **${c.claim_status.toUpperCase()}** | ${contractCell} | ${contractStatusCell} | ${cmdCell} | \`${c.evidence_source}\` | ${c.evidence} |`,
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
