#!/usr/bin/env -S deno run --allow-read
// src/x5C70_autonomy_attenuation.ts — A1 write attenuation verifier (codex x5d00_954460).
// position: 5/C7 → action × bridge = narrow the act without lying about the fact.
// maturity: active
// skill_safe: yes-readonly  (classified 2026-06-26 from AST behaviour — codex x5d00 P0)
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

// ─────────────────────────────────────────────────────────────────────────────
// Delegation Epoch Protocol — the pure ceiling/lease verifier (codex x5000_954550, P1).
//
// codex's forward architecture splits durable authority from its momentary use:
//   • a CEILING is a durable, constitutionally-ratified MAXIMUM (capability classes,
//     committed catalog IDs, target families, budgets, quorum policy, expiry);
//   • a LEASE is a short-lived attenuation that SELECTS, never INTRODUCES — every
//     field must be equal-or-narrower than its ceiling and may only pick a committed
//     catalog entry. It can never add argv, paths, capabilities, principals or budgets.
//
// `verifyDelegation` is the pure verifier that proves a lease is a sound attenuation
// of its ceiling against live facts (anchor window, revocation, fork, catalog hash,
// quorum). It outputs a content-bound verdict; every decision fact is hashed in, so
// changing any ceiling/lease/catalog/anchor byte invalidates the downstream verdict.
// There is no administrator override and no I/O — facts arrive as data, never as
// caller authority. epoch-1's `evaluateA1Attenuation` is wired through it below with
// byte-for-byte equivalence: the new verifier replaces the hardcoded C1–C6 ladder
// without changing any granted authority.
//
// This is the type groundwork for epoch-neutral runtime (P2). It does NOT yet make
// the runtime discover ceilings; epoch-1 remains the golden fixture.
export const DELEGATION_SCHEMA_VERSION = "trinity.delegation.v0.1";

/** An audited catalog entry — a generator bound by ID plus its argv/organ/output.
 *  `impl_hash` is the forward binding (P-later) once the executor recomputes it; it
 *  is optional here and, when absent, simply omitted from the catalog commitment. */
export interface CatalogEntry {
  id: string; // stable adapter ID (== target in epoch-1)
  organ: string;
  argv: string[];
  output_path: string;
  impl_hash?: string;
}

/** The durable, constitutionally-ratified authority ceiling. */
export interface Ceiling {
  schema: typeof DELEGATION_SCHEMA_VERSION;
  ceiling_id: string;
  capability_classes: string[]; // the only attenuable capabilities
  effect_ceiling: string[]; // the maximal effect tags a lease may carry
  verbs: string[]; // the only verbs a lease may select
  target_families: string[]; // allowed targets — exact tokens or "*"
  catalog_ids: string[]; // committed audited adapter IDs
  catalog_commitment: string; // sha256 over the committed catalog entries
  budgets: { max_bytes: number; max_seconds: number };
  required_gates: string[]; // a lease must require a superset of these
  quorum: { human: number; model: number }; // ratification quorum policy
  expiry: { from_height: number; until_height: number };
}

/** A short-lived attenuation of ONE ceiling — it selects, it never introduces. */
export interface Lease {
  schema: typeof DELEGATION_SCHEMA_VERSION;
  ceiling_id: string; // the ceiling this lease attenuates
  ceiling_commitment: string; // exact parent content, not a reusable label
  catalog_id: string; // the committed adapter it selects
  generator_organ: string; // the freshly-recomputed organ (must match the entry)
  capability: string; // recomputed capability (must be in the ceiling)
  effects: string[]; // intent effects (⊆ the ceiling's effect ceiling)
  verb: string;
  target: string;
  write_set: string[]; // must equal the selected entry's singleton output path
  budgets: { max_bytes: number; max_seconds: number }; // ≤ the ceiling
  required_gates: string[]; // ⊇ the ceiling's required gates
  expiry_height: number; // ≤ the ceiling's until-height
  confinement_commitment: string; // binds the confined transaction
}

/** Live, self-verifying facts resolved at decision time — never caller authority. */
export interface LiveFacts {
  at_height: number; // current Bitcoin height
  catalog_commitment: string; // the catalog commitment observed live
  ceiling_commitment: string; // the parent commitment observed in lifecycle
  revoked: boolean; // ceiling/lease revocation state
  forked: boolean; // lifecycle fork state
  quorum_satisfied: boolean; // ratification quorum met in the live lifecycle
}

export type DelegationReason =
  | "delegated"
  | "schema_mismatch"
  | "ceiling_mismatch"
  | "ceiling_commitment_drift"
  | "capability_not_in_ceiling"
  | "effect_exceeds_ceiling"
  | "target_not_in_family"
  | "verb_not_in_ceiling"
  | "quorum_unsatisfied"
  | "anchor_outside_window"
  | "revoked"
  | "forked"
  | "generator_not_in_catalog"
  | "catalog_ambiguous"
  | "catalog_commitment_drift"
  | "write_set_not_entry_singleton"
  | "path_not_contained"
  | "budget_exceeds_ceiling"
  | "expiry_widens_ceiling"
  | "lease_expired"
  | "gates_not_superset";

export interface DelegationVerdict {
  schema: typeof DELEGATION_SCHEMA_VERSION;
  delegated: boolean;
  reason_code: DelegationReason;
  reason: string;
  verdict_hash?: string; // content-bound over ceiling, lease, catalog and anchor
}

/** Content commitment over a catalog — committed entries only, ID-sorted, stable. */
export async function catalogCommitment(
  entries: CatalogEntry[],
): Promise<string> {
  const sorted = [...entries].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  );
  return `sha256:${await sha256(
    stable(
      sorted.map((e) => ({
        argv: e.argv,
        id: e.id,
        ...(e.impl_hash !== undefined ? { impl_hash: e.impl_hash } : {}),
        organ: e.organ,
        output_path: e.output_path,
      })) as unknown as Json,
    ),
  )}`;
}

/** Semantic content commitment of the exact authority parent a lease names. */
export async function ceilingCommitment(ceiling: Ceiling): Promise<string> {
  return `sha256:${await sha256(stable({
    budgets: ceiling.budgets,
    capability_classes: [...ceiling.capability_classes].sort(),
    catalog_commitment: ceiling.catalog_commitment,
    catalog_ids: [...ceiling.catalog_ids].sort(),
    ceiling_id: ceiling.ceiling_id,
    effect_ceiling: [...ceiling.effect_ceiling].sort(),
    expiry: ceiling.expiry,
    quorum: ceiling.quorum,
    required_gates: [...ceiling.required_gates].sort(),
    schema: ceiling.schema,
    target_families: [...ceiling.target_families].sort(),
    verbs: [...ceiling.verbs].sort(),
  } as unknown as Json))}`;
}

const finitePos = (n: number) => Number.isFinite(n) && n > 0;

/** Prove a lease is a sound attenuation of its ceiling against live facts.
 *  Pure and fail-closed: any field broader than the ceiling, any uncommitted
 *  catalog selection, any stale/revoked/forked/ambiguous authority denies. */
export async function verifyDelegation(
  ceiling: Ceiling,
  lease: Lease,
  catalog: CatalogEntry[],
  live: LiveFacts,
): Promise<DelegationVerdict> {
  const deny = (
    reason_code: DelegationReason,
    reason: string,
  ): DelegationVerdict => ({
    schema: DELEGATION_SCHEMA_VERSION,
    delegated: false,
    reason_code,
    reason,
  });

  // 0 — both documents speak this schema version (an unknown schema is never trusted).
  if (
    ceiling.schema !== DELEGATION_SCHEMA_VERSION ||
    lease.schema !== DELEGATION_SCHEMA_VERSION
  ) {
    return deny("schema_mismatch", "ceiling or lease is not the known schema");
  }
  // 1 — the lease attenuates THIS ceiling (no cross-ceiling / wrong-parent leases).
  if (lease.ceiling_id !== ceiling.ceiling_id) {
    return deny(
      "ceiling_mismatch",
      `lease names ceiling ${lease.ceiling_id}, not ${ceiling.ceiling_id}`,
    );
  }
  const parentCommitment = await ceilingCommitment(ceiling);
  if (
    lease.ceiling_commitment !== parentCommitment ||
    live.ceiling_commitment !== parentCommitment
  ) {
    return deny(
      "ceiling_commitment_drift",
      "lease or live lifecycle does not commit to the exact ceiling content",
    );
  }
  // 2 — capability is within the ceiling's attenuable classes (set inclusion).
  if (!ceiling.capability_classes.includes(lease.capability)) {
    return deny(
      "capability_not_in_ceiling",
      NON_ATTENUABLE.has(lease.capability)
        ? `${lease.capability} crosses boundaries and can never be attenuated`
        : `capability '${lease.capability}' is not in the ceiling`,
    );
  }
  // 3 — every effect is within the ceiling's effect ceiling (set inclusion).
  if (!(lease.effects ?? []).every((e) => ceiling.effect_ceiling.includes(e))) {
    return deny(
      "effect_exceeds_ceiling",
      "lease carries an effect outside the ceiling's effect ceiling",
    );
  }
  // 3b — the target is within the ceiling's target families (exact token or "*").
  if (
    !ceiling.target_families.includes(lease.target) &&
    !ceiling.target_families.includes("*")
  ) {
    return deny(
      "target_not_in_family",
      `target ${lease.target} is not in a ceiling target family`,
    );
  }
  if (
    !ceiling.verbs.includes(lease.verb) && !ceiling.verbs.includes("*")
  ) {
    return deny(
      "verb_not_in_ceiling",
      `verb ${lease.verb} is not in the ceiling`,
    );
  }
  // 4 — ratification quorum is met in the live lifecycle (quorum validity).
  if (!live.quorum_satisfied) {
    return deny(
      "quorum_unsatisfied",
      "ceiling is not final in the live lifecycle",
    );
  }
  // 5 — the anchor is inside the ceiling's window (expiry).
  if (
    live.at_height < ceiling.expiry.from_height ||
    live.at_height >= ceiling.expiry.until_height
  ) {
    return deny(
      "anchor_outside_window",
      "anchor is outside the ceiling window",
    );
  }
  // 6 — neither parent nor lease is revoked, and the lifecycle is not forked.
  if (live.revoked) return deny("revoked", "ceiling or lease is revoked");
  if (live.forked) return deny("forked", "live lifecycle is forked");
  // 7 — the lease selects a COMMITTED catalog entry whose organ it actually matches.
  const matchingEntries = catalog.filter((e) => e.id === lease.catalog_id);
  if (matchingEntries.length !== 1) {
    return deny(
      "catalog_ambiguous",
      `catalog id ${lease.catalog_id} resolves to ${matchingEntries.length} entries`,
    );
  }
  const entry = matchingEntries[0];
  const norm = lease.generator_organ.replace(/^.*\/(src\/)/, "src/");
  if (
    !ceiling.catalog_ids.includes(lease.catalog_id) || !entry ||
    entry.organ !== norm || entry.id !== lease.target
  ) {
    return deny(
      "generator_not_in_catalog",
      `no committed catalog entry binds ${lease.target} to organ ${lease.generator_organ}`,
    );
  }
  // 8 — the live catalog has not drifted from what the ceiling committed.
  const liveCommitment = await catalogCommitment(catalog);
  if (
    liveCommitment !== ceiling.catalog_commitment ||
    live.catalog_commitment !== ceiling.catalog_commitment
  ) {
    return deny(
      "catalog_commitment_drift",
      "live catalog commitment does not match the ceiling's",
    );
  }
  // 9 — the write-set is EXACTLY the selected entry's singleton output path, contained.
  const ws = lease.write_set;
  if (ws.length !== 1 || ws[0] !== entry.output_path) {
    return deny(
      "write_set_not_entry_singleton",
      `write-set must be exactly [${entry.output_path}]`,
    );
  }
  if (!pathContained(ws[0])) {
    return deny(
      "path_not_contained",
      `${ws[0]} is not a contained repo-relative path`,
    );
  }
  // 10 — budgets are finite, positive and no broader than the ceiling (monotonicity).
  const b = lease.budgets;
  if (
    !finitePos(b.max_bytes) || !finitePos(b.max_seconds) ||
    b.max_bytes > ceiling.budgets.max_bytes ||
    b.max_seconds > ceiling.budgets.max_seconds
  ) {
    return deny(
      "budget_exceeds_ceiling",
      "lease budget is invalid or exceeds the ceiling",
    );
  }
  // 11 — the lease's expiry does not widen the ceiling's (expiry narrowing).
  if (lease.expiry_height > ceiling.expiry.until_height) {
    return deny(
      "expiry_widens_ceiling",
      "lease expiry is later than the ceiling's",
    );
  }
  if (live.at_height >= lease.expiry_height) {
    return deny("lease_expired", "lease is expired at the live anchor");
  }
  // 12 — the lease requires a superset of the ceiling's gates.
  if (!ceiling.required_gates.every((g) => lease.required_gates.includes(g))) {
    return deny(
      "gates_not_superset",
      "lease gates do not cover the ceiling's required gates",
    );
  }

  // delegated — bind the verdict to every fact it relied on.
  const verdict_hash = `sha256:${await sha256(stable({
    catalog,
    ceiling,
    lease: {
      budgets: lease.budgets,
      capability: lease.capability,
      catalog_id: lease.catalog_id,
      ceiling_commitment: lease.ceiling_commitment,
      confinement_commitment: lease.confinement_commitment,
      effects: [...lease.effects].sort(),
      expiry_height: lease.expiry_height,
      generator_organ: norm,
      required_gates: [...lease.required_gates].sort(),
      target: lease.target,
      verb: lease.verb,
      write_set: lease.write_set,
    },
    live,
  } as unknown as Json))}`;
  return {
    schema: DELEGATION_SCHEMA_VERSION,
    delegated: true,
    reason_code: "delegated",
    reason: `lease is a sound attenuation of ceiling ${ceiling.ceiling_id}`,
    verdict_hash,
  };
}

/** Map a delegation reason code onto the legacy epoch-1 attenuation reason code,
 *  preserving the exact refusal vocabulary the kernel and its tests expect. */
const DELEGATION_TO_ATTENUATION: Record<DelegationReason, AttenuationReason> = {
  delegated: "eligible",
  schema_mismatch: "generator_not_registered",
  ceiling_mismatch: "generator_not_registered",
  ceiling_commitment_drift: "generator_not_registered",
  capability_not_in_ceiling: "non_attenuable_capability",
  effect_exceeds_ceiling: "not_semantic_a1",
  target_not_in_family: "no_matching_a1_profile",
  verb_not_in_ceiling: "no_matching_a1_profile",
  quorum_unsatisfied: "mandate_not_final_or_expired",
  anchor_outside_window: "mandate_not_final_or_expired",
  revoked: "mandate_not_final_or_expired",
  forked: "mandate_not_final_or_expired",
  generator_not_in_catalog: "generator_not_registered",
  catalog_ambiguous: "generator_not_registered",
  catalog_commitment_drift: "generator_not_registered",
  write_set_not_entry_singleton: "write_set_not_registry_singleton",
  path_not_contained: "path_not_contained",
  budget_exceeds_ceiling: "budget_invalid_or_exceeds_mandate",
  expiry_widens_ceiling: "mandate_not_final_or_expired",
  lease_expired: "mandate_not_final_or_expired",
  gates_not_superset: "gates_not_superset",
};

/** Build the epoch-1 ceiling from the live mandate, its matched A1 profile and the
 *  ratified adapter registry. Returns null when the mandate is structurally ambiguous
 *  (≠ exactly one matching A1 profile) — the caller denies `no_matching_a1_profile`. */
export async function epoch1Ceiling(
  mandate: AutonomyMandate,
  intent: AutonomyIntent,
  adapters: Adapter[],
): Promise<{ ceiling: Ceiling; catalog: CatalogEntry[] } | null> {
  const profiles = mandate.action_profiles.filter((p) =>
    p.class === "A1" &&
    (p.verbs.includes(intent.verb) || p.verbs.includes("*")) &&
    (p.targets.includes(intent.target) || p.targets.includes("*"))
  );
  if (profiles.length !== 1) return null;
  const profile = profiles[0];
  const catalog: CatalogEntry[] = adapters.map((a) => ({
    id: a.target,
    organ: a.organ,
    argv: a.argv,
    output_path: a.output_path,
  }));
  const commitment = await catalogCommitment(catalog);
  const mb = mandate.global_budgets ?? {};
  const ceiling: Ceiling = {
    schema: DELEGATION_SCHEMA_VERSION,
    ceiling_id: mandate.mandate_id,
    capability_classes: [ATTENUABLE],
    // the semantic A1 effect set — the same ceiling the legacy C2 ladder enforced.
    effect_ceiling: [...A1_EFFECTS],
    verbs: profile.verbs,
    target_families: profile.targets,
    catalog_ids: catalog.map((e) => e.id),
    catalog_commitment: commitment,
    budgets: {
      max_bytes: mb.max_bytes ?? Number.POSITIVE_INFINITY,
      max_seconds: mb.max_seconds ?? Number.POSITIVE_INFINITY,
    },
    required_gates: profile.required_gates ?? [],
    quorum: { human: 1, model: 1 },
    expiry: {
      from_height: mandate.valid_from.height,
      until_height: mandate.valid_until.height,
    },
  };
  return { ceiling, catalog };
}

/** Decide whether one confined action of a `writes` generator may EXECUTE as A1.
 *  Pure and fail-closed; activated only after constitutional ratification.
 *
 *  As of codex x5000_954550 (P1) this is a thin epoch-1 adapter over the general
 *  `verifyDelegation` verifier: it builds the epoch-1 ceiling + lease, delegates the
 *  field comparison, then emits the SAME content-bound `attenuation_hash` the warrant
 *  binds — byte-for-byte identical to the prior hardcoded ladder. */
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

  const adapters = input.adapters ?? EPOCH1_ADAPTERS;
  const built = await epoch1Ceiling(input.mandate, input.intent, adapters);
  if (!built) {
    return deny(
      "no_matching_a1_profile",
      "expected exactly one matching A1 profile",
    );
  }
  const { ceiling, catalog } = built;
  const parentCommitment = await ceilingCommitment(ceiling);
  const lease: Lease = {
    schema: DELEGATION_SCHEMA_VERSION,
    ceiling_id: ceiling.ceiling_id,
    ceiling_commitment: parentCommitment,
    catalog_id: input.intent.target,
    generator_organ: input.generator_organ,
    capability: input.capability,
    effects: input.intent.effects ?? [],
    verb: input.intent.verb,
    target: input.intent.target,
    write_set: input.confinement.allowed_write_set,
    budgets: input.confinement.output_budget,
    required_gates: input.confinement.required_gates,
    expiry_height: input.mandate.valid_until.height,
    confinement_commitment: input.confinement.commitment,
  };
  const live: LiveFacts = {
    at_height: input.at_height,
    catalog_commitment: ceiling.catalog_commitment,
    ceiling_commitment: parentCommitment,
    revoked: false,
    forked: false,
    quorum_satisfied: input.mandate_final,
  };

  const v = await verifyDelegation(ceiling, lease, catalog, live);
  if (!v.delegated) {
    return deny(DELEGATION_TO_ATTENUATION[v.reason_code], v.reason);
  }

  // eligible — bind the legacy verdict to every fact it relied on (unchanged preimage).
  const adapter = catalog.find((e) => e.id === input.intent.target)!;
  const profileId =
    input.mandate.action_profiles.find((p) =>
      p.class === "A1" &&
      (p.verbs.includes(input.intent.verb) || p.verbs.includes("*")) &&
      (p.targets.includes(input.intent.target) || p.targets.includes("*"))
    )!.id;
  const attenuation_hash = `sha256:${await sha256(stable({
    adapter: {
      argv: adapter.argv,
      organ: adapter.organ,
      output_path: adapter.output_path,
      target: adapter.id,
    },
    capability: input.capability,
    confinement_commitment: input.confinement.commitment,
    mandate_id: input.mandate.mandate_id,
    profile: profileId,
    verb: input.intent.verb,
  } as unknown as Json))}`;
  return {
    execution_class: "A1",
    eligible: true,
    reason_code: "eligible",
    reason:
      `confined A1 execution of a writes generator under profile ${profileId}`,
    attenuation_hash,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Epoch discovery — epoch-neutral runtime authority selection (codex x5000_954550 P2,
// repaired after codex's NAY x6900_954557 — finality-key reuse / authority laundering).
//
// The executor must no longer hardcode WHICH mandate body + finality records are
// ratified. A DATA registry lists candidate epochs — but the registry file is
// editable bytes and confers NOTHING by itself. Authority for a non-legacy row comes
// from a quorum-final proposal whose STRUCTURED body commits to that row's exact
// canonical commitment. Reusing an unrelated implemented key (e.g. epoch-1's mandate
// finality) does not authorize a forged row, because that proposal's body does not
// carry this row's `epoch_registry_entry_commitment`. epoch-1 is grandfathered by a
// SINGLE code pin (not a self-declared `legacy` flag): `legacy:true` is honored only
// for ceiling_id=epoch-1 whose full canonical row matches the immutable pin.
//
// Discovery selects the highest applicable final epoch DETERMINISTICALLY, rejects
// ambiguity rather than choosing by registry order, validates the registry as hostile
// input, and denies (never defaults to safe) on a malformed/unavailable lifecycle.
// The repository only supplies bytes to verify against these commitments.

export const EPOCH_REGISTRY_SCHEMA = "trinity.epoch-registry.v0.1";

/** A candidate epoch row. Authority for a non-legacy row is conferred by a
 *  quorum-final proposal that STRUCTURALLY commits to this exact row, never by the
 *  row existing or by reusing an unrelated implemented key (codex x6900_954557 #1). */
export interface RatifiedEpoch {
  ceiling_id: string;
  mandate_path: string;
  mandate_body_commitment: string; // sha256: of the mandate body (stable serialization)
  constitution_commitment: string;
  mandate_finality_key: string; // lifecycle proposal key ratifying the mandate
  attenuation_finality_key: string; // lifecycle proposal key ratifying the A1 rule
  valid_from_height: number;
  valid_until_height: number;
  ceiling_commitment?: string; // epoch-2+: exact-parent binding (codex ceilingCommitment)
  registry_finality_key?: string; // epoch-2+: the proposal that ratifies THIS row
  registry_entry_commitment?: string; // epoch-2+: the canonical exact-row commitment
  legacy?: boolean; // epoch-1 bootstrap only; must match the code pin
}

export interface EpochRegistryDoc {
  schema: string;
  epochs: RatifiedEpoch[];
}

/** Live lifecycle facts — pure data. `ok` is false when the lifecycle output was
 *  malformed/unavailable; discovery then DENIES rather than defaulting to safe. */
export interface LifecycleFacts {
  ok: boolean;
  implemented: string[]; // finality keys whose state is `implemented` (quorum-final)
  revoked: string[]; // revoked epoch / finality keys
  forked: boolean; // lifecycle fork detected
}

/** A verified registry-binding fact for one `registry_finality_key`, produced by the
 *  I/O wrapper: whether the proposal's recomputed body commitment matched the key,
 *  and the structured `epoch_registry_entry_commitment` its body carries. The pure
 *  selector trusts only these, never the raw registry row. */
export interface EpochBindingFact {
  body_commitment_ok: boolean;
  epoch_registry_entry_commitment: string | null;
}

export type EpochSelectionReason =
  | "selected"
  | "lifecycle_unavailable"
  | "forked"
  | "no_candidates"
  | "registry_schema_mismatch"
  | "malformed_registry"
  | "duplicate_id"
  | "duplicate_binding"
  | "legacy_not_pinned"
  | "binding_absent"
  | "binding_unproven"
  | "none_final"
  | "none_active"
  | "ambiguous";

export interface EpochSelection {
  epoch: RatifiedEpoch | null;
  reason_code: EpochSelectionReason;
  reason: string;
}

// The one bootstrap pin (codex x6900_954557 #2): the exact canonical commitment of
// the epoch-1 registry row. `legacy:true` is honored ONLY for ceiling_id=epoch-1 and
// ONLY when its full canonical row hashes to this immutable value — so `legacy` can
// never be a self-declared escape from the strengthened exact-parent binding.
export const EPOCH1_PINNED_ENTRY_COMMITMENT =
  "sha256:ad33e8f1dda514b15464c225a3fa5dfe83188adfc4d7039e684afc357fde2068";

const SHA256_RE = /^sha256:[0-9a-f]{64}$/;
const KEY_RE = /^[0-9a-f]{64}$/;

/** Canonical commitment of a registry row, EXCLUDING the binding proposal key and the
 *  row-commitment field itself (codex #1, to avoid circular hashing). Every other
 *  authority-bearing field is bound, so flipping any of them invalidates the row. */
export async function epochEntryCommitment(e: RatifiedEpoch): Promise<string> {
  return `sha256:${await sha256(stable({
    attenuation_finality_key: e.attenuation_finality_key,
    ceiling_commitment: e.ceiling_commitment ?? null,
    ceiling_id: e.ceiling_id,
    constitution_commitment: e.constitution_commitment,
    legacy: e.legacy === true,
    mandate_body_commitment: e.mandate_body_commitment,
    mandate_finality_key: e.mandate_finality_key,
    mandate_path: e.mandate_path,
    valid_from_height: e.valid_from_height,
    valid_until_height: e.valid_until_height,
  } as unknown as Json))}`;
}

function malformedEntry(e: RatifiedEpoch): boolean {
  if (typeof e.ceiling_id !== "string" || !e.ceiling_id) return true;
  if (typeof e.mandate_path !== "string" || !e.mandate_path) return true;
  if (!SHA256_RE.test(e.mandate_body_commitment ?? "")) return true;
  if (!SHA256_RE.test(e.constitution_commitment ?? "")) return true;
  if (!KEY_RE.test(e.mandate_finality_key ?? "")) return true;
  if (!KEY_RE.test(e.attenuation_finality_key ?? "")) return true;
  if (!Number.isInteger(e.valid_from_height) || e.valid_from_height <= 0) {
    return true;
  }
  if (!Number.isInteger(e.valid_until_height) || e.valid_until_height <= 0) {
    return true;
  }
  if (e.valid_from_height >= e.valid_until_height) return true;
  if (
    e.ceiling_commitment !== undefined && !SHA256_RE.test(e.ceiling_commitment)
  ) {
    return true;
  }
  if (
    e.registry_entry_commitment !== undefined &&
    !SHA256_RE.test(e.registry_entry_commitment)
  ) {
    return true;
  }
  if (
    e.registry_finality_key !== undefined &&
    !KEY_RE.test(e.registry_finality_key)
  ) {
    return true;
  }
  return false;
}

interface RowAuth {
  ok: boolean;
  reason_code: EpochSelectionReason;
  reason: string;
}

/** Prove ONE row is authorized — legacy via the code pin, non-legacy via a
 *  quorum-final proposal that structurally commits to the row. Fail-closed. */
async function authorizeRow(
  e: RatifiedEpoch,
  facts: LifecycleFacts,
  bindings: Record<string, EpochBindingFact>,
): Promise<RowAuth> {
  const implemented = new Set(facts.implemented);
  const revoked = new Set(facts.revoked);
  const commitment = await epochEntryCommitment(e);
  const fail = (
    reason_code: EpochSelectionReason,
    reason: string,
  ): RowAuth => ({
    ok: false,
    reason_code,
    reason,
  });

  if (e.legacy) {
    if (
      e.ceiling_id !== "epoch-1" ||
      commitment !== EPOCH1_PINNED_ENTRY_COMMITMENT
    ) {
      return fail(
        "legacy_not_pinned",
        "legacy is honored only for the code-pinned epoch-1 row",
      );
    }
  } else {
    if (
      !e.ceiling_commitment || !e.registry_finality_key ||
      !e.registry_entry_commitment
    ) {
      return fail(
        "binding_absent",
        "non-legacy epoch lacks ceiling_commitment / registry binding",
      );
    }
    if (e.registry_entry_commitment !== commitment) {
      return fail("binding_unproven", "row commitment mismatch");
    }
    if (!implemented.has(e.registry_finality_key)) {
      return fail("binding_unproven", "registry binding proposal is not final");
    }
    if (revoked.has(e.registry_finality_key)) {
      return fail("binding_unproven", "registry binding proposal is revoked");
    }
    const b = bindings[e.registry_finality_key];
    if (!b || !b.body_commitment_ok) {
      return fail(
        "binding_unproven",
        "registry binding proposal is unauthentic",
      );
    }
    if (b.epoch_registry_entry_commitment !== commitment) {
      return fail(
        "binding_unproven",
        "binding proposal does not structurally commit to this exact row",
      );
    }
  }
  // both legacy and non-legacy: the mandate + attenuation finalities must be live.
  if (
    !implemented.has(e.mandate_finality_key) ||
    !implemented.has(e.attenuation_finality_key)
  ) {
    return fail(
      "none_final",
      "mandate or attenuation finality is not implemented",
    );
  }
  if (
    revoked.has(e.mandate_finality_key) ||
    revoked.has(e.attenuation_finality_key) ||
    revoked.has(e.ceiling_id)
  ) {
    return fail("none_final", "a relied-on finality or the ceiling is revoked");
  }
  return { ok: true, reason_code: "selected", reason: "row authorized" };
}

/** Select the highest applicable final epoch. Pure, deterministic, fail-closed.
 *  Authority for a non-legacy row requires a quorum-final proposal whose body
 *  STRUCTURALLY commits to the row's exact canonical commitment; legacy is honored
 *  only for the code-pinned epoch-1 row. Hostile registry input is rejected, and a
 *  malformed/unavailable lifecycle denies rather than defaulting to safe. */
export async function selectRatifiedEpoch(
  doc: EpochRegistryDoc,
  facts: LifecycleFacts,
  bindings: Record<string, EpochBindingFact>,
  at_height: number,
): Promise<EpochSelection> {
  const none = (
    reason_code: EpochSelectionReason,
    reason: string,
  ): EpochSelection => ({ epoch: null, reason_code, reason });

  if (!facts.ok) {
    return none(
      "lifecycle_unavailable",
      "live lifecycle is unavailable or malformed",
    );
  }
  if (facts.forked) return none("forked", "live lifecycle is forked");
  if (!doc || doc.schema !== EPOCH_REGISTRY_SCHEMA) {
    return none("registry_schema_mismatch", "unknown epoch-registry schema");
  }
  const registry = doc.epochs ?? [];
  if (registry.length === 0) return none("no_candidates", "registry is empty");

  // hostile-input validation (codex #4) — independent of file order.
  if (registry.some(malformedEntry)) {
    return none("malformed_registry", "a registry row is malformed");
  }
  const ids = registry.map((e) => e.ceiling_id);
  if (new Set(ids).size !== ids.length) {
    return none("duplicate_id", "duplicate ceiling_id");
  }
  const bkeys = registry
    .filter((e) => e.registry_finality_key)
    .map((e) => e.registry_finality_key!);
  if (new Set(bkeys).size !== bkeys.length) {
    return none("duplicate_binding", "duplicate registry_finality_key");
  }

  // per-row authority proof.
  const results = await Promise.all(
    registry.map(async (e) => ({
      e,
      auth: await authorizeRow(e, facts, bindings),
    })),
  );
  const authorized = results.filter((r) => r.auth.ok).map((r) => r.e);
  if (authorized.length === 0) {
    const firstFail = results.find((r) => !r.auth.ok)!;
    return none(firstFail.auth.reason_code, firstFail.auth.reason);
  }

  const active = authorized.filter((e) =>
    at_height >= e.valid_from_height && at_height < e.valid_until_height
  );
  if (active.length === 0) {
    return none(
      "none_active",
      `no authorized epoch is active at height ${at_height}`,
    );
  }
  const highest = Math.max(...active.map((e) => e.valid_from_height));
  const top = active.filter((e) => e.valid_from_height === highest);
  if (top.length !== 1) {
    return none(
      "ambiguous",
      `${top.length} epochs are equally applicable at height ${at_height}`,
    );
  }
  return {
    epoch: top[0],
    reason_code: "selected",
    reason: `epoch ${
      top[0].ceiling_id
    } is the highest applicable final ceiling`,
  };
}

/** The intent-INDEPENDENT durable ceiling of a mandate (codex x6900_954557 #3): a
 *  mandate with exactly one A1 profile has one durable ceiling; ≠1 is ambiguous and
 *  yields null. epoch-2+ commits to `ceilingCommitment(durableCeiling(...))`; the
 *  executor recomputes and compares it, rather than hashing whichever intent runs. */
export async function durableCeiling(
  mandate: AutonomyMandate,
  adapters: Adapter[],
): Promise<Ceiling | null> {
  const a1 = mandate.action_profiles.filter((p) => p.class === "A1");
  if (a1.length !== 1) return null;
  const profile = a1[0];
  const catalog: CatalogEntry[] = adapters.map((a) => ({
    id: a.target,
    organ: a.organ,
    argv: a.argv,
    output_path: a.output_path,
  }));
  const mb = mandate.global_budgets ?? {};
  return {
    schema: DELEGATION_SCHEMA_VERSION,
    ceiling_id: mandate.mandate_id,
    capability_classes: [ATTENUABLE],
    effect_ceiling: [...A1_EFFECTS],
    verbs: profile.verbs,
    target_families: profile.targets,
    catalog_ids: catalog.map((e) => e.id),
    catalog_commitment: await catalogCommitment(catalog),
    budgets: {
      max_bytes: mb.max_bytes ?? Number.POSITIVE_INFINITY,
      max_seconds: mb.max_seconds ?? Number.POSITIVE_INFINITY,
    },
    required_gates: profile.required_gates ?? [],
    quorum: { human: 1, model: 1 },
    expiry: {
      from_height: mandate.valid_from.height,
      until_height: mandate.valid_until.height,
    },
  };
}

/** Parse the `t myc lifecycle` JSON into pure `LifecycleFacts`. A malformed shape
 *  (no `mutations` array) sets `ok=false`, so discovery DENIES rather than treating
 *  an unparseable lifecycle as "nothing implemented but otherwise safe" (codex #4).
 *  Revocation/fork surfacing is the lifecycle compiler's responsibility; absent
 *  markers are read as "none revoked / not forked". */
export function parseLifecycleFacts(
  life: Record<string, unknown>,
): LifecycleFacts {
  if (!life || !Array.isArray(life.mutations)) {
    return { ok: false, implemented: [], revoked: [], forked: false };
  }
  const muts = life.mutations as Array<{ key?: string; state?: string }>;
  const REVOKED = new Set(["revoked", "superseded", "withdrawn"]);
  const implemented = muts
    .filter((m) => m.state === "implemented" && m.key)
    .map((m) => m.key!);
  const revoked = muts
    .filter((m) => m.state && REVOKED.has(m.state) && m.key)
    .map((m) => m.key!);
  return { ok: true, implemented, revoked, forked: life.forked === true };
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
