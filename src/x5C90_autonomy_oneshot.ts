#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net=blockstream.info
// src/x5C90_autonomy_oneshot.ts — the A1 one-shot join (codex x7700_954558 P3).
// position: 5/C9 → action × bridge = compose proven demand with bounded execution, ONCE.
// hex_dipole: "00 00 00 00 00 59 00 00"
// placement_policy: axis
//
// codex's P3 boundary (x7700_954558): NOT a clock-driven daemon — a pure orchestration
// edge over already-ratified components:
//
//   live authority → demand snapshot → deterministic single target → fresh revalidation
//   → execute once → stdout receipt → stop.
//
// Demand must be PROVEN staleness, never elapsed time. Select at most one target by
// stable ordering; any `unknown` denies. Authority and demand are reconstructed AGAIN
// immediately before execution, and the receipt binds both the demand-snapshot and the
// authority-verdict hashes. No loop, no background daemon, no commit/push, no source or
// core-law write, no receipt publication (`execute` already guarantees the last three).
// A second invocation is a NEW decision with new live facts — never a lease continuation.

import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.4";
import type { AutonomyIntent, AutonomyMandate } from "./x5C20_autonomy.ts";
import {
  type ExecResult,
  execute,
  type ExecutionAuthority,
  verifyExecutionAuthority,
} from "./x5C60_autonomy_executor.ts";
import {
  type Adapter,
  EPOCH1_ADAPTERS,
  type EpochRegistryDoc,
} from "./x5C70_autonomy_attenuation.ts";
import { demand, type DemandReport } from "./x5C80_autonomy_demand.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const EPOCH_REGISTRY_PATH = "contracts/mandates/epochs.registry.json";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
function stable(v: Json): string {
  if (v === null) return "null";
  if (
    typeof v === "boolean" || typeof v === "number" || typeof v === "string"
  ) {
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  return `{${
    Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`)
      .join(",")
  }}`;
}
async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

/** Injected edges — every authority/demand/execution component is already ratified;
 *  this organ only composes them. `loadMandates` yields the registry's candidate
 *  mandates (bytes); only the one matching the live discovered epoch will verify. */
export interface OneShotDeps {
  /** Autonomous promotion is defined only on a clean checkout. A dirty target
   * could otherwise be mistaken for HEAD-relative staleness and overwritten. */
  workspaceClean: () => Promise<boolean>;
  authority: (m: AutonomyMandate) => Promise<ExecutionAuthority>;
  demand: (adapters: Adapter[]) => Promise<DemandReport>;
  runExecute: (
    input: { intent: AutonomyIntent; mandate: AutonomyMandate },
  ) => Promise<ExecResult>;
  loadMandates: () => Promise<AutonomyMandate[]>;
  adapters: Adapter[];
}

async function realLoadMandates(): Promise<AutonomyMandate[]> {
  try {
    const reg = JSON.parse(
      await Deno.readTextFile(join(ROOT, EPOCH_REGISTRY_PATH)),
    ) as EpochRegistryDoc;
    const out: AutonomyMandate[] = [];
    for (const e of reg.epochs ?? []) {
      try {
        out.push(
          JSON.parse(
            await Deno.readTextFile(join(ROOT, e.mandate_path)),
          ) as AutonomyMandate,
        );
      } catch {
        // a missing/unreadable candidate simply does not verify.
      }
    }
    return out;
  } catch {
    return [];
  }
}

const realDeps: OneShotDeps = {
  workspaceClean: async () => {
    try {
      const p = new Deno.Command("git", {
        args: ["status", "--porcelain", "--untracked-files=all"],
        cwd: ROOT,
        stdout: "piped",
        stderr: "piped",
      });
      const r = await p.output();
      return r.code === 0 && new TextDecoder().decode(r.stdout).trim() === "";
    } catch {
      return false;
    }
  },
  authority: verifyExecutionAuthority,
  demand,
  runExecute: (input) => execute(input),
  loadMandates: realLoadMandates,
  adapters: EPOCH1_ADAPTERS,
};

export interface OneShotResult {
  type: "a1_oneshot";
  position: "5/C9";
  acted: boolean;
  reason: string;
  picked?: string;
  demand_snapshot_hash?: string;
  authority_verdict_hash?: string;
  exec?: ExecResult;
  receipt_commitment?: string;
}

/** Compose proven demand with one bounded execution, ONCE, then stop. Fail-closed at
 *  every joint; demand must be proven staleness; authority + demand are revalidated
 *  immediately before the single execution; the receipt binds both live facts. */
export async function oneShot(
  deps: OneShotDeps = realDeps,
): Promise<OneShotResult> {
  const stop = (
    reason: string,
    over: Partial<OneShotResult> = {},
  ): OneShotResult => ({
    type: "a1_oneshot",
    position: "5/C9",
    acted: false,
    reason,
    ...over,
  });

  // HEAD-relative regeneration is safe only when HEAD is the complete input state.
  // This also protects uncommitted projection edits from being interpreted as demand.
  if (!(await deps.workspaceClean())) {
    return stop(
      "working tree is dirty or unreadable — autonomous action denied",
    );
  }

  // 1. live authority — only the mandate of the single live discovered epoch verifies.
  let authority: ExecutionAuthority | null = null;
  let mandate: AutonomyMandate | null = null;
  for (const m of await deps.loadMandates()) {
    const a = await deps.authority(m);
    if (a.verified) {
      if (authority) {
        return stop("ambiguous live authority — multiple mandates verify");
      }
      authority = a;
      mandate = m;
    }
  }
  if (!authority || !mandate) return stop("no live ratified authority");

  // 2. demand snapshot — PROVEN staleness only; any unknown probe fails closed.
  const snap = await deps.demand(deps.adapters);
  if (snap.unknown > 0) {
    return stop(`demand unknown for ${snap.unknown} target(s) — fail closed`);
  }
  if (!snap.demand) return stop("no proven demand — nothing stale, no action");

  // 3. select ONE target deterministically by stable ordering.
  const stale = snap.projections
    .filter((p) => p.state === "stale")
    .sort((a, b) => (a.target < b.target ? -1 : a.target > b.target ? 1 : 0));
  if (stale.length === 0) {
    return stop("demand true but no stale projection — inconsistent, deny");
  }
  const picked = stale[0];
  const adapter = deps.adapters.find((x) => x.target === picked.target);
  if (!adapter) {
    return stop(`no ratified adapter for picked target ${picked.target}`);
  }

  // 4. REVALIDATE immediately before execution — fresh authority + fresh demand on the
  //    single picked target. Either lapsing denies.
  const authority2 = await deps.authority(mandate);
  if (!authority2.verified) {
    return stop(`authority lapsed before execution: ${authority2.reason}`);
  }
  const recheck = await deps.demand([adapter]);
  if (recheck.unknown > 0) {
    return stop("revalidation demand unknown — fail closed");
  }
  const stillStale = recheck.projections.find(
    (p) => p.target === picked.target && p.state === "stale",
  );
  if (!stillStale) {
    return stop("picked target no longer proven stale at revalidation");
  }

  // Recheck the reversibility boundary after the probes and immediately before the
  // actuator. A concurrent/user edit during authority or demand reconstruction denies.
  if (!(await deps.workspaceClean())) {
    return stop(
      "working tree changed before execution — autonomous action denied",
    );
  }

  // bind the receipt to the fresh demand snapshot + authority verdict.
  const demand_snapshot_hash = `sha256:${await sha256(
    stable(recheck as unknown as Json),
  )}`;
  const authority_verdict_hash = `sha256:${await sha256(
    stable(authority2 as unknown as Json),
  )}`;

  // 5. execute ONCE. `execute` independently re-reconstructs authority + confinement and
  //    promotes at most one verified projection to the working tree (never commits).
  const intent: AutonomyIntent = {
    verb: "regen-projection",
    target: picked.target,
    effects: ["projection"],
  };
  const exec = await deps.runExecute({ intent, mandate });

  // 6. receipt → stdout, bound to both live facts. Then STOP (no loop, no continuation).
  const receipt = {
    acted: exec.promoted,
    authority_verdict_hash,
    demand_snapshot_hash,
    exec_receipt_commitment: exec.receipt_commitment ?? null,
    picked: picked.target,
  };
  return {
    type: "a1_oneshot",
    position: "5/C9",
    acted: exec.promoted,
    reason: exec.promoted
      ? `one-shot: regenerated ${picked.target} to the working tree (uncommitted)`
      : `one-shot did not promote: ${exec.reason}`,
    picked: picked.target,
    demand_snapshot_hash,
    authority_verdict_hash,
    exec,
    receipt_commitment: `sha256:${await sha256(
      stable(receipt as unknown as Json),
    )}`,
  };
}

export async function runCli(_args: string[] = Deno.args): Promise<void> {
  const r = await oneShot();
  console.log(JSON.stringify(r, null, 2));
  // a denial (no demand / no authority) is a valid fail-closed outcome, not an error.
}

if (import.meta.main) await runCli();
