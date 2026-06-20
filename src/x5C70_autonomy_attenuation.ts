#!/usr/bin/env -S deno run --allow-read
// src/x5C70_autonomy_attenuation.ts — A1 write attenuation verifier (codex x5d00_954460).
// position: 5/C7 → action × bridge = narrow the act without lying about the fact.
// hex_dipole: "00 00 00 00 00 59 00 00"
// placement_policy: axis
//
// codex's rule, "preserve the fact, narrow the act": a `writes` capability is NEVER
// relabeled — it stays intrinsic A2 in the evidence record. A SEPARATE, action-relative
// attenuation verdict may select EXECUTION class A1, and only inside one ratified A1
// profile and one confined transaction; outside that the same organ is A2.
//
// ACTIVE after proposal x5d00_954460 / h.1bd456e1f3be reached constitutional
// {human:1, model:1} finality. It remains a pure verifier; `admit` and the executor
// consume only its content-bound verdict. No scheduler is activated.
//
// Fail-closed law: only EXACTLY `writes` is attenuable (git/network/subprocess/unknown/
// privileged/unresolved are categorically barred); the generator must be a registered
// adapter (structured identity, never a shell string); the write-set must be EXACTLY the
// registered singleton output path, repo-relative, normalized, non-escaping; budgets must
// be finite, positive and within the mandate's; gates must be a superset of the profile's.

import type { AutonomyIntent, AutonomyMandate } from "./x5C20_autonomy.ts";
import type { A1ConfinementReceipt } from "./x5C40_autonomy_confinement.ts";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
function stable(v: Json): string {
  if (v === null) return "null";
  if (typeof v === "boolean" || typeof v === "number") return JSON.stringify(v);
  if (typeof v === "string") return JSON.stringify(v);
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

/** A ratified adapter binds ONE target to ONE generator organ, argv and output path —
 *  structured identity, never a free shell string (codex C3). */
export interface Adapter {
  target: string;
  organ: string; // the generator organ file (capability recomputed from this)
  argv: string[]; // the exact command argv
  output_path: string; // the singleton canonical write path
}

/** The epoch-1 adapter registry — exactly the four projections the mandate names. */
export const EPOCH1_ADAPTERS: Adapter[] = [
  {
    target: "x7B88_evidence_report",
    organ: "src/x7B00_evidence.ts",
    argv: ["./t", "evidence", "--stable"],
    output_path: "src/x7B88_evidence_report.myc.md",
  },
  {
    target: "x8788_network",
    organ: "src/x8700_network.ts",
    argv: ["./t", "network", "--stable"],
    output_path: "src/x8788_network.myc.md",
  },
  {
    target: "x88F0_agents_bootstrap",
    organ: "src/x8800_agents_gen.ts",
    argv: ["./t", "agents", "--stable"],
    output_path: "src/x88F0_agents_bootstrap.myc.md",
  },
  {
    target: "x8CF0_skills_bootstrap",
    organ: "src/x8C00_skill_gen.ts",
    argv: ["./t", "skill", "--stable"],
    output_path: "src/x8CF0_skills_bootstrap.myc.md",
  },
];

export async function registryCommitment(adapters: Adapter[]): Promise<string> {
  return `sha256:${await sha256(
    stable(
      adapters.map((a) => ({
        argv: a.argv,
        organ: a.organ,
        output_path: a.output_path,
        target: a.target,
      })) as unknown as Json,
    ),
  )}`;
}

/** Repo-relative, normalized, no `..` escape, no absolute, no symlink-looking segment. */
export function pathContained(p: string): boolean {
  if (p.startsWith("/") || p.includes("\0")) return false;
  const parts = p.split("/");
  if (parts.some((s) => s === ".." || s === "" || s === ".")) return false;
  if (p !== p.normalize("NFC")) return false;
  return true;
}

const ATTENUABLE = "writes"; // the ONLY capability that may be attenuated
const NON_ATTENUABLE = new Set(["git", "network", "subprocess", "unknown"]);

export type AttenuationReason =
  | "eligible"
  | "non_attenuable_capability"
  | "not_semantic_a1"
  | "mandate_not_final_or_expired"
  | "no_matching_a1_profile"
  | "generator_not_registered"
  | "write_set_not_registry_singleton"
  | "path_not_contained"
  | "budget_invalid_or_exceeds_mandate"
  | "gates_not_superset";

export interface AttenuationInput {
  capability: string; // freshly recomputed capability of the generator organ
  generator_organ: string; // the organ the capability was recomputed from
  intent: AutonomyIntent;
  mandate: AutonomyMandate;
  mandate_final: boolean;
  at_height: number;
  confinement: A1ConfinementReceipt;
  adapters?: Adapter[];
}

export interface AttenuationVerdict {
  execution_class: "A1" | null; // A1 only when eligible; otherwise the act stays A2
  eligible: boolean;
  reason_code: AttenuationReason;
  reason: string;
  attenuation_hash?: string; // content-bound verdict the warrant binds
}

const A1_EFFECTS = new Set([
  "projection",
  "format",
  "cache_refresh",
  "fixture",
  "worktree_probe",
  "read",
  "observe",
  "derive",
  "reconcile",
]);

/** Decide whether one confined action of a `writes` generator may EXECUTE as A1.
 *  Pure and fail-closed; activated only after constitutional ratification. */
export async function evaluateA1Attenuation(
  input: AttenuationInput,
): Promise<AttenuationVerdict> {
  const deny = (
    reason_code: AttenuationReason,
    reason: string,
  ): AttenuationVerdict => ({
    execution_class: null,
    eligible: false,
    reason_code,
    reason,
  });

  // C1 — capability is EXACTLY `writes`; everything else is categorically non-attenuable.
  if (input.capability !== ATTENUABLE) {
    return deny(
      "non_attenuable_capability",
      NON_ATTENUABLE.has(input.capability)
        ? `${input.capability} crosses boundaries and can never be attenuated`
        : `only 'writes' is attenuable, got '${input.capability}'`,
    );
  }
  // C2 — every claimed/observed effect is an A1 effect (semantic class A1).
  if (!(input.intent.effects ?? []).every((e) => A1_EFFECTS.has(e))) {
    return deny(
      "not_semantic_a1",
      "intent carries an effect outside the A1 set",
    );
  }
  // C2b — the mandate is final and unexpired at the anchor.
  const inWindow = input.at_height >= input.mandate.valid_from.height &&
    input.at_height < input.mandate.valid_until.height;
  if (!input.mandate_final || !inWindow) {
    return deny(
      "mandate_not_final_or_expired",
      input.mandate_final
        ? "anchor outside the mandate window"
        : "mandate is not final",
    );
  }
  // C2c — exactly one A1 profile matches verb + target.
  const profiles = input.mandate.action_profiles.filter((p) =>
    p.class === "A1" &&
    (p.verbs.includes(input.intent.verb) || p.verbs.includes("*")) &&
    (p.targets.includes(input.intent.target) || p.targets.includes("*"))
  );
  if (profiles.length !== 1) {
    return deny(
      "no_matching_a1_profile",
      `expected exactly one matching A1 profile, found ${profiles.length}`,
    );
  }
  const profile = profiles[0];
  // C3 — the generator is a registered adapter; its organ matches the recomputed organ.
  const adapters = input.adapters ?? EPOCH1_ADAPTERS;
  const adapter = adapters.find((a) => a.target === input.intent.target);
  if (
    !adapter ||
    adapter.organ !== input.generator_organ.replace(/^.*\/(src\/)/, "src/")
  ) {
    return deny(
      "generator_not_registered",
      `no adapter binds target ${input.intent.target} to organ ${input.generator_organ}`,
    );
  }
  // C4 — the write-set is EXACTLY the registered singleton output path, and contained.
  const ws = input.confinement.allowed_write_set;
  if (ws.length !== 1 || ws[0] !== adapter.output_path) {
    return deny(
      "write_set_not_registry_singleton",
      `write-set must be exactly [${adapter.output_path}]`,
    );
  }
  if (!pathContained(ws[0])) {
    return deny(
      "path_not_contained",
      `${ws[0]} is not a contained repo-relative path`,
    );
  }
  // C5 — budgets finite, positive, and no broader than the mandate's.
  const b = input.confinement.output_budget;
  const mb = input.mandate.global_budgets ?? {};
  const finite = (n: number) => Number.isFinite(n) && n > 0;
  if (
    !finite(b.max_bytes) || !finite(b.max_seconds) ||
    (mb.max_bytes !== undefined && b.max_bytes > mb.max_bytes) ||
    (mb.max_seconds !== undefined && b.max_seconds > mb.max_seconds)
  ) {
    return deny(
      "budget_invalid_or_exceeds_mandate",
      "confinement budget is invalid or exceeds the mandate",
    );
  }
  // C6 — required gates are a superset of the profile's gates.
  const need = new Set(profile.required_gates ?? []);
  if (![...need].every((g) => input.confinement.required_gates.includes(g))) {
    return deny(
      "gates_not_superset",
      "confinement gates do not cover the profile's required gates",
    );
  }

  // eligible — bind the verdict to every fact it relied on.
  const attenuation_hash = `sha256:${await sha256(stable({
    adapter: {
      argv: adapter.argv,
      organ: adapter.organ,
      output_path: adapter.output_path,
      target: adapter.target,
    },
    capability: input.capability,
    confinement_commitment: input.confinement.commitment,
    mandate_id: input.mandate.mandate_id,
    profile: profile.id,
    verb: input.intent.verb,
  } as unknown as Json))}`;
  return {
    execution_class: "A1",
    eligible: true,
    reason_code: "eligible",
    reason:
      `confined A1 execution of a writes generator under profile ${profile.id}`,
    attenuation_hash,
  };
}

export async function runCli(): Promise<void> {
  console.log(JSON.stringify(
    {
      type: "autonomy_attenuation",
      position: "5/C7",
      status:
        "ACTIVE — pure verifier ratified by h.1bd456e1f3be (human:1, model:1); no scheduler",
      registry_commitment: await registryCommitment(EPOCH1_ADAPTERS),
      epoch1_targets: EPOCH1_ADAPTERS.map((a) => a.target),
    },
    null,
    2,
  ));
}

if (import.meta.main) await runCli();
