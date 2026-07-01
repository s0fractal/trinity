#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net=blockstream.info
// src/x5C60_autonomy_executor.ts — the A1 executor (codex x5d00_954460 #4).
// position: 5/C6 → action × bridge = the first persistent autonomous write, maximally boxed.
// maturity: active
// horizon: designed, dormant — built + tested, but the constitutional actuator has never fired (demand=false, P4 trigger-blocked per x7300_955712); it promotes to active use only on organic acted-receipt evidence, never by elapsed time (A13).
// skill_safe: yes-with-care  (classified 2026-06-26 from AST behaviour — codex x5d00 P0)
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
  ceilingCommitment,
  durableCeiling,
  EPOCH1_ADAPTERS,
  type EpochBindingFact,
  type EpochRegistryDoc,
  evaluateA1Attenuation,
  type LifecycleFacts,
  parseLifecycleFacts,
  pathContained,
  registryCommitment,
  selectRatifiedEpoch,
} from "./x5C70_autonomy_attenuation.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const EPOCH_REGISTRY_PATH = "contracts/mandates/epochs.registry.json";

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

/** Bind the canonical-verifier result to the exact descriptor subsequently
 * consumed by the executor. `myc verify` and `myc resolve` are separate process
 * calls, so the proposal could otherwise change between them while the second
 * body inherited the first call's `ok`. */
export async function bindingFactFromDescriptor(
  key: string,
  canonicalVerified: boolean,
  descriptor: Record<string, unknown>,
): Promise<EpochBindingFact> {
  const deny: EpochBindingFact = {
    body_commitment_ok: false,
    epoch_registry_entry_commitment: null,
  };
  if (!canonicalVerified || !/^[0-9a-f]{64}$/.test(key)) return deny;
  const commitment = descriptor.commitment as
    | Record<string, unknown>
    | undefined;
  const body = descriptor.body as Record<string, unknown> | undefined;
  if (
    descriptor.type !== "ProposedMutationDescriptor" ||
    commitment?.algorithm !== "sha256" ||
    commitment?.covers !== "descriptor.body" ||
    commitment?.value !== key ||
    !body || Array.isArray(body)
  ) return deny;
  if (await sha256(stable(body as unknown as Json)) !== key) return deny;
  return {
    body_commitment_ok: true,
    epoch_registry_entry_commitment:
      typeof body.epoch_registry_entry_commitment === "string"
        ? body.epoch_registry_entry_commitment
        : null,
  };
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
  /** execution-time authority reconstruction; injected only by transaction tests */
  authorize: (mandate: AutonomyMandate) => Promise<ExecutionAuthority>;
  /** lexical checks are insufficient: promotion must not follow a symlink escape */
  mainPathContained: (rel: string) => Promise<boolean>;
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
  authorize: verifyExecutionAuthority,
  mainPathContained: async (rel) => {
    try {
      const abs = join(ROOT, rel);
      const info = await Deno.lstat(abs);
      if (info.isSymlink) return false;
      const [realRoot, real] = await Promise.all([
        Deno.realPath(ROOT),
        Deno.realPath(abs),
      ]);
      return real === join(realRoot, rel) && real.startsWith(`${realRoot}/`);
    } catch {
      return false;
    }
  },
};

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

export interface ExecutionAuthority {
  verified: boolean;
  reason: string;
  at_height?: number;
  mandate_body_commitment?: string;
  mandate_finality_commitment?: string;
  attenuation_finality_commitment?: string;
}

interface AuthorityDeps {
  lifecycle: () => Promise<Record<string, unknown>>;
  currentBlock: () => Promise<number | null>;
  /** the ratified-epoch registry DOC — DATA candidates, never standing authority */
  registry?: () => Promise<EpochRegistryDoc>;
  /** verified registry-binding facts for the given non-legacy finality keys */
  bindings?: (keys: string[]) => Promise<Record<string, EpochBindingFact>>;
}

async function readRegistry(): Promise<EpochRegistryDoc> {
  try {
    const j = JSON.parse(
      await Deno.readTextFile(join(ROOT, EPOCH_REGISTRY_PATH)),
    );
    return { schema: j.schema, epochs: j.epochs ?? [] } as EpochRegistryDoc;
  } catch {
    return { schema: "", epochs: [] };
  }
}

/** Verify each non-legacy registry binding by reusing myc's OWN canonical descriptor
 * verifier (codex x6900_954557 #1): `t myc verify` proves the proposal file matches
 * its commitment (tamper-proof), and `t myc resolve` yields the structured body. A
 * binding is authentic only when the proposal's commitment equals the named key; the
 * structured `epoch_registry_entry_commitment` field is surfaced for the pure selector
 * to compare against the row. Reusing an unrelated key (e.g. epoch-1's mandate
 * finality) yields a null field → the selector denies. Fail-closed on any error. */
async function loadBindings(
  keys: string[],
): Promise<Record<string, EpochBindingFact>> {
  const out: Record<string, EpochBindingFact> = {};
  for (const key of keys) {
    const fqdn = `h.${key.slice(0, 12)}.proposal.myc.md`;
    let body_commitment_ok = false;
    let entry: string | null = null;
    try {
      const v = JSON.parse(
        (await realRun(["./t", "myc", "verify", fqdn], ROOT)).out,
      );
      if (v.ok === true) {
        const r = JSON.parse(
          (await realRun(["./t", "myc", "resolve", fqdn], ROOT)).out,
        );
        if (r.ok && r.descriptor) {
          const fact = await bindingFactFromDescriptor(key, true, r.descriptor);
          body_commitment_ok = fact.body_commitment_ok;
          entry = fact.epoch_registry_entry_commitment;
        }
      }
    } catch {
      // fail closed — an unloadable/unparseable binding proves nothing.
    }
    out[key] = { body_commitment_ok, epoch_registry_entry_commitment: entry };
  }
  return out;
}

const realAuthorityDeps: AuthorityDeps = {
  lifecycle: async () => {
    const r = await realRun(["./t", "myc", "lifecycle"], ROOT);
    if (r.code !== 0) return {};
    try {
      return JSON.parse(r.out) as Record<string, unknown>;
    } catch {
      return {};
    }
  },
  currentBlock: async () => {
    try {
      const r = await fetch("https://blockstream.info/api/blocks/tip/height");
      if (!r.ok) return null;
      const n = Number((await r.text()).trim());
      return Number.isSafeInteger(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  },
  registry: readRegistry,
  bindings: loadBindings,
};

/** Reconstruct authority from live, self-verifying sources, EPOCH-NEUTRALLY (codex
 * x5000_954550 P2; repaired per NAY x6900_954557). No epoch is hardcoded: the
 * registry supplies candidate bytes, the live lifecycle confers finality (quorum),
 * a non-legacy row is authorized ONLY by a quorum-final proposal structurally
 * committing to its exact canonical row, and epoch-1 runs via a single code pin.
 * Discovery selects the highest applicable final epoch deterministically; the passed
 * mandate is then verified to BE that epoch (exact body + constitution + window), and
 * for a non-legacy epoch its exact-parent ceiling commitment is recomputed and
 * compared. Caller booleans are never standing. */
export async function verifyExecutionAuthority(
  mandate: AutonomyMandate,
  deps: AuthorityDeps = realAuthorityDeps,
): Promise<ExecutionAuthority> {
  const doc = await (deps.registry ?? readRegistry)();
  const life = await deps.lifecycle();
  const facts: LifecycleFacts = parseLifecycleFacts(life);
  const at = await deps.currentBlock();
  if (at === null) {
    return { verified: false, reason: "Bitcoin comparison anchor unavailable" };
  }

  // load binding facts for non-legacy rows (legacy epoch-1 needs none).
  const bindKeys = (doc.epochs ?? [])
    .filter((e) => !e.legacy && e.registry_finality_key)
    .map((e) => e.registry_finality_key!);
  const bindings = bindKeys.length
    ? await (deps.bindings ?? loadBindings)(bindKeys)
    : {};

  // discover WHICH epoch is live — never assume epoch-1.
  const sel = await selectRatifiedEpoch(doc, facts, bindings, at);
  if (!sel.epoch) {
    return { verified: false, reason: `no live ratified epoch: ${sel.reason}` };
  }
  const epoch = sel.epoch;

  // verify the passed mandate IS the discovered epoch — exact body, not a label.
  const bodyCommitment = `sha256:${await sha256(
    stable(mandate as unknown as Json),
  )}`;
  if (bodyCommitment !== epoch.mandate_body_commitment) {
    return {
      verified: false,
      reason: `mandate body is not the ratified body of ${epoch.ceiling_id}`,
    };
  }
  if (mandate.constitution_commitment !== epoch.constitution_commitment) {
    return {
      verified: false,
      reason: "mandate constitution commitment mismatch",
    };
  }
  // the mandate's own window must agree with the discovered epoch's, and contain the anchor.
  if (
    mandate.valid_from.height !== epoch.valid_from_height ||
    mandate.valid_until.height !== epoch.valid_until_height
  ) {
    return {
      verified: false,
      reason: "mandate window disagrees with the ratified epoch window",
    };
  }
  if (at < mandate.valid_from.height || at >= mandate.valid_until.height) {
    return {
      verified: false,
      reason: `${epoch.ceiling_id} is not active at the live anchor`,
    };
  }

  // consume the exact-parent commitment for a non-legacy epoch (codex #3): recompute
  // the intent-INDEPENDENT durable ceiling and require it to equal the committed one.
  if (!epoch.legacy) {
    const dc = await durableCeiling(mandate, EPOCH1_ADAPTERS);
    if (!dc) {
      return {
        verified: false,
        reason: `${epoch.ceiling_id} has no unambiguous durable ceiling`,
      };
    }
    if ((await ceilingCommitment(dc)) !== epoch.ceiling_commitment) {
      return {
        verified: false,
        reason:
          `${epoch.ceiling_id} ceiling commitment does not match the derived ceiling`,
      };
    }
  }

  return {
    verified: true,
    reason:
      `discovered ${epoch.ceiling_id}: body, constitutional finality and live anchor verified`,
    at_height: at,
    mandate_body_commitment: bodyCommitment,
    mandate_finality_commitment: epoch.mandate_finality_key,
    attenuation_finality_commitment: epoch.attenuation_finality_key,
  };
}

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

  const authority = await hooks.authorize(input.mandate);
  if (!authority.verified || authority.at_height === undefined) {
    return fail(`authority denied: ${authority.reason}`);
  }
  const adapters = EPOCH1_ADAPTERS;
  const adapter = adapters.find((a) => a.target === input.intent.target);
  if (!adapter) {
    return fail(`no ratified adapter for target ${input.intent.target}`);
  }
  if (!pathContained(adapter.output_path)) {
    return fail(`adapter output path is not contained`);
  }
  if (!(await hooks.mainPathContained(adapter.output_path))) {
    return fail("adapter output path failed main-tree realpath containment");
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
  if (preMain === null) {
    return fail(
      "epoch-1 projection target must already exist; creates are not authorized",
    );
  }
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
    mandate_final: true,
    at_height: authority.at_height,
    confinement,
    adapters,
  });
  if (!att.eligible || att.execution_class !== "A1") {
    return fail(`attenuation denied: ${att.reason_code}`);
  }

  // 1d. admit, consuming the verified evidence + standing + attenuation verdict.
  const verdict = admit(input.intent, input.mandate, {
    kind: "bitcoin_block",
    height: authority.at_height,
  }, {
    anchor_verified: true,
    capability_evidence: {
      ...evidence,
      semantic_effects: input.intent.effects,
    },
    mandate_standing: {
      verified: true,
      mandate_id: input.mandate.mandate_id,
      mandate_commitment: authority.mandate_body_commitment!,
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
    const started = performance.now();
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
    const wtOut = await hooks.readWorktree(wt, adapter.output_path);
    const postHash = wtOut === null ? null : `sha256:${await sha256(wtOut)}`;
    const fmt = await hooks.run(
      ["deno", "fmt", "--check", adapter.output_path],
      wt,
    );
    const generationDiff = await generationDiffClean(hooks, wt, adapter, wtOut);
    // Observe AFTER every generator invocation: the determinism gate must not be
    // able to hide a second-run write outside the singleton set.
    const status = await hooks.run(["git", "status", "--porcelain"], wt);
    if (status.code !== 0) {
      return fail("git status failed in worktree", {
        admitted: true,
        attenuated: true,
      });
    }
    const written = status.out.split("\n").map((l) => l.slice(3).trim()).filter(
      Boolean,
    );
    const obs: ConfinementObservation = {
      written_paths: written,
      post_state: [{ path: adapter.output_path, hash: postHash }],
      gate_results: {
        fmt: fmt.code === 0 ? "pass" : "fail",
        "generation-diff": generationDiff,
      },
      bytes_written: wtOut ? new TextEncoder().encode(wtOut).length : 0,
      seconds: (performance.now() - started) / 1000,
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
  if (!(await hooks.mainPathContained(adapter.output_path))) {
    return fail("main-tree path containment changed before promotion", {
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
    mandate_body_commitment: authority.mandate_body_commitment,
    mandate_finality_commitment: authority.mandate_finality_commitment,
    attenuation_finality_commitment: authority.attenuation_finality_commitment,
    constitution_commitment: input.mandate.constitution_commitment,
    capability_verdict_hash: evidence.verdict_hash,
    attenuation_hash: att.attenuation_hash,
    confinement_commitment: confinement.commitment,
    adapter_registry_commitment: await registryCommitment(adapters),
    pre_state_hash: preHash,
    promoted_hash: promotedHash,
    anchor: { kind: "bitcoin_block", height: authority.at_height },
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
    receipt_commitment: `sha256:${await sha256(
      stable(warrant as unknown as Json),
    )}`,
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
