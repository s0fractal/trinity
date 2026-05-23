#!/usr/bin/env -S deno run --allow-read
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

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

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

async function main() {
  const wantJson = Deno.args.includes("--json");

  const ci_present = await exists(
    join(ROOT, ".github", "workflows", "ci.yml"),
  );
  const invocations = await countDaemonInvocations();

  let contractsList: import("./x4F00_contracts.ts").ContractEntry[] = [];
  try {
    contractsList = await listContracts();
  } catch {
    // contracts parser might throw if run mid-refactor
  }

  const executable_contracts = contractsList.filter(
    (c) => c.implementation_status === "implemented",
  ).length;
  const aspirational_contracts = contractsList.filter(
    (c) => c.implementation_status === "aspirational",
  ).length;

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
    // Autonomous voice triggers require execution independent of human loop (e.g., cron daemon).
    // Currently zero as this is a local research notebook invoked manually.
    autonomous_voice_invocations: 0,
    executable_contracts,
    aspirational_contracts,
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
  };

  if (wantJson) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log("# evidence → 7/B");
    console.log("─".repeat(50));
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
    console.log("─".repeat(50));
  }
}

if (import.meta.main) {
  await main();
}
