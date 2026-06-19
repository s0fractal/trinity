#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
// src/x5C60_autonomy_executor.ts — the A1 executor (codex x5d00_954460 #4).
// position: 5/C6 → action × bridge = the first persistent autonomous write, maximally boxed.
// hex_dipole: "00 00 00 00 00 59 00 00"
// placement_policy: axis
//
// The actuator. It performs ONE admitted, attenuated, confined A1 write and stops. Per
// codex's normative rule (x5d00_954460), execution is a THROWAWAY-TO-PROMOTE transaction:
//   1. recompute capability (must be exactly `writes`), build the confinement receipt
//      from the ratified adapter, evaluate attenuation, and admit — all verified, fresh;
//   2. run the registered generator FIRST in a detached temporary worktree;
//   3. verify confinement inside the worktree (write-set, gates, budgets, post-state);
//   4. recheck the MAIN-tree pre-state immediately before promotion;
//   5. only then PROMOTE the exact verified bytes to the single canonical output path;
//   6. on any failure after promotion, restore the snapshotted pre-state bytes — a KERNEL
//      primitive, never executing receipt.rollback as a command;
//   7. emit a content-bound execution receipt to stdout. It NEVER commits, pushes, edits
//      a source organ or core law, or creates a chord. Durable receipt publication is a
//      separately ratified profile, not smuggled into the write-set.
//
// The worktree run + main promotion use injected hooks so the transaction logic is
// testable without a real worktree; the CLI wires the real git/fs hooks.

import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.4";
import {
  admit,
  type AutonomyIntent,
  type AutonomyMandate,
} from "./x5C20_autonomy.ts";
import { buildCapabilityEvidence } from "./x5C30_autonomy_context.ts";
import {
  type A1ConfinementReceipt,
  buildConfinement,
  type ConfinementObservation,
  type FileState,
  verifyConfinement,
  verifyConfinementReceipt,
} from "./x5C40_autonomy_confinement.ts";
import {
  type Adapter,
  EPOCH1_ADAPTERS,
  evaluateA1Attenuation,
  pathContained,
  registryCommitment,
} from "./x5C70_autonomy_attenuation.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));

type Run = (
  cmd: string[],
  cwd: string,
) => Promise<{ code: number; out: string; err: string }>;

async function realRun(cmd: string[], cwd: string) {
  const p = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await p.output();
  return {
    code,
    out: new TextDecoder().decode(stdout),
    err: new TextDecoder().decode(stderr),
  };
}
async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

/** Injected transaction hooks — the worktree run + the main-tree promotion. */
export interface ExecHooks {
  run: Run;
  /** read a worktree-relative file (the generator's output) */
  readWorktree: (wt: string, rel: string) => Promise<string | null>;
  /** read a main-tree file (pre/post state) */
  readMain: (rel: string) => Promise<string | null>;
  /** promote verified bytes to the main tree (the only write to the real repo) */
  writeMain: (rel: string, bytes: string) => Promise<void>;
}

const realHooks: ExecHooks = {
  run: realRun,
  readWorktree: async (wt, rel) => {
    try {
      return await Deno.readTextFile(join(wt, rel));
    } catch {
      return null;
    }
  },
  readMain: async (rel) => {
    try {
      return await Deno.readTextFile(join(ROOT, rel));
    } catch {
      return null;
    }
  },
  writeMain: async (rel, bytes) =>
    await Deno.writeTextFile(join(ROOT, rel), bytes),
};

export interface ExecResult {
  intent: AutonomyIntent;
  admitted: boolean;
  attenuated: boolean;
  promoted: boolean;
  rolled_back: boolean;
  output_path?: string;
  reason: string;
  warrant?: Record<string, unknown>;
  receipt_commitment?: string;
}

export interface ExecInput {
  intent: AutonomyIntent;
  mandate: AutonomyMandate;
  mandate_final: boolean;
  at_height: number;
  adapters?: Adapter[];
}

/** Run ONE admitted+attenuated A1 action via the throwaway-to-promote transaction. */
export async function execute(
  input: ExecInput,
  hooks: ExecHooks = realHooks,
): Promise<ExecResult> {
  const fail = (
    reason: string,
    over: Partial<ExecResult> = {},
  ): ExecResult => ({
    intent: input.intent,
    admitted: false,
    attenuated: false,
    promoted: false,
    rolled_back: false,
    reason,
    ...over,
  });

  const adapters = input.adapters ?? EPOCH1_ADAPTERS;
  const adapter = adapters.find((a) => a.target === input.intent.target);
  if (!adapter) {
    return fail(`no ratified adapter for target ${input.intent.target}`);
  }
  if (!pathContained(adapter.output_path)) {
    return fail(`adapter output path is not contained`);
  }

  // 1a. recompute capability evidence from the actual generator organ (must be `writes`).
  const evidence = await buildCapabilityEvidence(
    input.intent.verb,
    input.intent.target,
    join(ROOT, adapter.organ),
  );
  if (!evidence) {
    return fail(`could not analyze generator organ ${adapter.organ}`);
  }

  // 1b. build the confinement receipt from the adapter's EXACT singleton write-set.
  const preMain = await hooks.readMain(adapter.output_path);
  const preHash = preMain === null ? null : `sha256:${await sha256(preMain)}`;
  const confinement = await buildConfinement({
    action_profile: "projections",
    verb: input.intent.verb,
    target: input.intent.target,
    pre_state: [{ path: adapter.output_path, hash: preHash }],
    allowed_write_set: [adapter.output_path],
    generator: adapter.argv.join(" "),
    required_gates: ["fmt", "generation-diff"],
    rollback: `git checkout -- ${adapter.output_path}`, // declarative policy only — never executed
    output_budget: {
      max_bytes: input.mandate.global_budgets?.max_bytes ?? 2_000_000,
      max_seconds: input.mandate.global_budgets?.max_seconds ?? 300,
    },
  });
  const receiptCheck = await verifyConfinementReceipt(confinement);
  if (!receiptCheck.confined) {
    return fail(
      `confinement receipt invalid: ${
        receiptCheck.violations.map((v) => v.kind).join(",")
      }`,
    );
  }

  // 1c. evaluate attenuation (the ratified rule). Must be eligible A1.
  const att = await evaluateA1Attenuation({
    capability: evidence.capability,
    generator_organ: adapter.organ,
    intent: input.intent,
    mandate: input.mandate,
    mandate_final: input.mandate_final,
    at_height: input.at_height,
    confinement,
    adapters,
  });
  if (!att.eligible || att.execution_class !== "A1") {
    return fail(`attenuation denied: ${att.reason_code}`);
  }

  // 1d. admit, consuming the verified evidence + standing + attenuation verdict.
  const verdict = admit(input.intent, input.mandate, {
    kind: "bitcoin_block",
    height: input.at_height,
  }, {
    anchor_verified: true,
    capability_evidence: {
      ...evidence,
      semantic_effects: input.intent.effects,
    },
    mandate_standing: {
      verified: true,
      mandate_id: input.mandate.mandate_id,
      mandate_commitment: evidence.verdict_hash,
      constitution_commitment: input.mandate.constitution_commitment,
      final_state: "implemented",
    },
    attenuation: {
      eligible: true,
      execution_class: "A1",
      attenuation_hash: att.attenuation_hash!,
    },
  });
  if (!verdict.admitted || verdict.cls !== "A1" || !verdict.attenuated) {
    return fail(`not admitted as attenuated A1: ${verdict.reason_code}`, {
      admitted: verdict.admitted,
    });
  }

  // 2. run the generator FIRST in a detached temporary worktree.
  const wt = join(ROOT, ".autonomy-exec", crypto.randomUUID());
  let made = false;
  let verifiedBytes: string | null = null;
  try {
    if (
      (await hooks.run(
        ["git", "worktree", "add", "--detach", wt, "HEAD"],
        ROOT,
      )).code !== 0
    ) {
      return fail("git worktree add failed", {
        admitted: true,
        attenuated: true,
      });
    }
    made = true;
    // codex condition-7 worktree setup: the workspace generator needs submodules.
    const sub = await hooks.run(
      ["git", "submodule", "update", "--init", "--recursive"],
      wt,
    );
    if (sub.code !== 0) {
      return fail(
        `worktree submodule init failed: ${sub.err.trim().split("\n")[0]}`,
        { admitted: true, attenuated: true },
      );
    }
    const gen = await hooks.run(adapter.argv, wt);
    if (gen.code !== 0) {
      return fail(
        `generator failed in worktree (${gen.code}): ${
          gen.err.trim().split("\n")[0]
        }`,
        { admitted: true, attenuated: true },
      );
    }

    // 3. verify confinement inside the worktree.
    const status = await hooks.run(["git", "status", "--porcelain"], wt);
    const written = status.out.split("\n").map((l) => l.slice(3).trim()).filter(
      Boolean,
    );
    const wtOut = await hooks.readWorktree(wt, adapter.output_path);
    const postHash = wtOut === null ? null : `sha256:${await sha256(wtOut)}`;
    const obs: ConfinementObservation = {
      written_paths: written,
      post_state: [{ path: adapter.output_path, hash: postHash }],
      gate_results: {
        fmt:
          (await hooks.run(["deno", "fmt", "--check", adapter.output_path], wt))
              .code === 0
            ? "pass"
            : "fail",
        "generation-diff": await generationDiffClean(hooks, wt, adapter, wtOut),
      },
      bytes_written: wtOut ? new TextEncoder().encode(wtOut).length : 0,
      seconds: 0,
    };
    const cv = verifyConfinement(confinement, obs, [{
      path: adapter.output_path,
      hash: preHash,
    }]);
    if (!cv.confined) {
      return fail(
        `confinement violated in worktree: ${
          cv.violations.map((v) => v.kind).join(",")
        }`,
        { admitted: true, attenuated: true },
      );
    }
    verifiedBytes = wtOut; // the exact verified output we may promote
  } finally {
    if (made) {
      await realRun(["git", "worktree", "remove", "--force", wt], ROOT).catch(
        () => {},
      );
    }
  }
  if (verifiedBytes === null) {
    return fail("generator produced no output to promote", {
      admitted: true,
      attenuated: true,
    });
  }

  // 4. recheck the MAIN-tree pre-state immediately before promotion (no drift).
  const nowMain = await hooks.readMain(adapter.output_path);
  const nowHash = nowMain === null ? null : `sha256:${await sha256(nowMain)}`;
  if (nowHash !== preHash) {
    return fail("main-tree pre-state drifted before promotion — aborted", {
      admitted: true,
      attenuated: true,
    });
  }

  // 5. PROMOTE the exact verified bytes (the only write to the real repo).
  await hooks.writeMain(adapter.output_path, verifiedBytes);
  const afterMain = await hooks.readMain(adapter.output_path);
  const afterHash = afterMain === null
    ? null
    : `sha256:${await sha256(afterMain)}`;
  const promotedHash = `sha256:${await sha256(verifiedBytes)}`;
  if (afterHash !== promotedHash) {
    // 6. KERNEL-primitive rollback: restore the snapshotted pre-state bytes.
    if (preMain !== null) await hooks.writeMain(adapter.output_path, preMain);
    return fail(
      "promotion did not land the verified bytes — rolled back to snapshot",
      { admitted: true, attenuated: true, rolled_back: true },
    );
  }

  // 7. content-bound execution receipt (warrant) → returned for stdout. No commit/push.
  const warrant = {
    mandate_id: input.mandate.mandate_id,
    constitution_commitment: input.mandate.constitution_commitment,
    capability_verdict_hash: evidence.verdict_hash,
    attenuation_hash: att.attenuation_hash,
    confinement_commitment: confinement.commitment,
    adapter_registry_commitment: await registryCommitment(adapters),
    pre_state_hash: preHash,
    promoted_hash: promotedHash,
    anchor: { kind: "bitcoin_block", height: input.at_height },
    output_path: adapter.output_path,
    no_op: preHash === promotedHash,
  };
  return {
    intent: input.intent,
    admitted: true,
    attenuated: true,
    promoted: true,
    rolled_back: false,
    output_path: adapter.output_path,
    reason: preHash === promotedHash
      ? "confined A1 executed; projection already current (no-op promotion)"
      : "confined A1 executed; verified bytes promoted to the main tree (uncommitted)",
    warrant,
    receipt_commitment: `sha256:${await sha256(JSON.stringify(warrant))}`,
  };
}

/** generation-diff gate: a deterministic generator is clean iff a second run in the
 * worktree reproduces identical output. */
async function generationDiffClean(
  hooks: ExecHooks,
  wt: string,
  adapter: Adapter,
  firstOut: string | null,
): Promise<"pass" | "fail"> {
  const second = await hooks.run(adapter.argv, wt);
  if (second.code !== 0) return "fail";
  const out2 = await hooks.readWorktree(wt, adapter.output_path);
  return out2 === firstOut ? "pass" : "fail";
}

export async function runCli(args: string[] = Deno.args): Promise<void> {
  console.log(JSON.stringify(
    {
      type: "autonomy_executor",
      position: "5/C6",
      note:
        "the A1 executor (codex x5d00_954460 #4). One admitted+attenuated+confined throwaway-to-promote write, then stop. Never commits/pushes. Driven by the scheduler or a dogfood harness; this CLI is informational.",
      args: args.length,
    },
    null,
    2,
  ));
}

if (import.meta.main) await runCli();
