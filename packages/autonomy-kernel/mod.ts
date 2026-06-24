/**
 * `@s0fractal/autonomy-kernel` — bounded, auditable, revocable authority for AI agents.
 *
 * A pure policy compiler. Classify an agent's intended action into A0–A4
 * (A0 observe · A1 reversible-local · A2 repo-evolution · A3 external-adapter ·
 * A4 sovereign), then `admit` it against a mandate — fail-closed: an UNKNOWN
 * effect is sovereign by default, A4 is never auto-admitted, and capability
 * evidence must be content-bound to the exact verb+target. Zero dependencies,
 * zero IO, zero framework. Drop it in front of any agent harness's action stream.
 *
 * Extracted verbatim from the trinity substrate's autonomy kernel (organ x5C20),
 * whose transplant test proves this core carries no host-ontology imports. A
 * parity test in this package guards the copy against drift from the original.
 *
 * @example Gate an agent action
 * ```ts
 * import { classifyIntent } from "@s0fractal/autonomy-kernel";
 * classifyIntent({ verb: "fs.write", target: "README.md", effects: ["source_change"] }).cls; // "A2"
 * classifyIntent({ verb: "shell", target: "rm -rf /", effects: ["destructive"] }).cls;        // "A4" (sovereign)
 * classifyIntent({ verb: "x", target: "y", effects: ["wormhole"] }).cls;                      // "A4" (unknown ⇒ fail-closed)
 * ```
 * @module
 */
export type ActionClass = "A0" | "A1" | "A2" | "A3" | "A4";

/** An anchor — a block height (the only comparable kind here). */
export interface Anchor {
  kind: "bitcoin_block";
  height: number;
}

export interface Budgets {
  max_bytes?: number;
  max_seconds?: number;
  max_actions?: number;
}

export interface ActionProfile {
  id: string;
  class: "A0" | "A1" | "A2" | "A3"; // A4 is never profiled — it is always human+model
  verbs: string[];
  targets: string[]; // exact tokens or "*" for any within the class
  effect_ceiling: string[]; // the maximal effect tags this profile permits
  destinations?: string[]; // required allowlist for A3 external adapters
  rate_limit?: { count: number; per_blocks: number };
  required_gates?: string[];
  rollback?: string;
}

export interface AutonomyMandate {
  mandate_id: string;
  constitution_commitment: string;
  issued_by: string[];
  valid_from: Anchor;
  valid_until: Anchor;
  action_profiles: ActionProfile[];
  global_budgets?: Budgets;
}

/** A normalized intent the kernel reasons about. */
export interface AutonomyIntent {
  verb: string;
  target: string;
  effects: string[]; // effect tags (below)
  destination?: string; // external destination for A3
}

/** Content-bound effect evidence produced by the capability court. The policy
 * compiler consumes this fact; an eventual executor MUST independently verify
 * the receipt before treating a positive verdict as authority. */
export interface CapabilityEvidence {
  type: "capability_receipt";
  subject_verb: string;
  subject_target: string;
  capability:
    | "readonly"
    | "network"
    | "subprocess"
    | "git"
    | "writes"
    | "unknown";
  verdict_hash: string;
  organ_hash: string;
  semantic_effects: string[];
}

/** Finality fact supplied by the court/reconciliation boundary. Keeping this
 * separate from the mandate body prevents a self-authored JSON grant from
 * proving its own standing. */
export interface MandateStanding {
  verified: boolean;
  mandate_id: string;
  mandate_commitment: string;
  constitution_commitment: string;
  final_state: "implemented";
}

/** A ratified A1 write-attenuation verdict (codex x5d00_954460, FINAL human+model).
 * "Preserve the fact, narrow the act": the capability stays `writes`/A2 in the
 * evidence; this SEPARATE verdict — computed by the dormant-no-more verifier x5C70 —
 * lets ONE confined transaction EXECUTE as A1. admit CONSUMES it (it does not compute
 * it) and independently re-checks the floor before honoring it. */
export interface AttenuationFact {
  eligible: boolean;
  execution_class: "A1";
  attenuation_hash: string;
}

export interface AdmissionContext {
  anchor_verified: boolean;
  capability_evidence?: CapabilityEvidence;
  mandate_standing?: MandateStanding;
  attenuation?: AttenuationFact;
}

// The effect taxonomy → the class each effect demands. The most-privileged effect
// in an intent sets its class. An effect ABSENT here is treated as A4 (sovereign):
// the kernel never guesses a privilege down.
const EFFECT_CLASS: Record<string, ActionClass> = {
  // A0 — observe & derive (read-only)
  read: "A0",
  observe: "A0",
  derive: "A0",
  reconcile: "A0",
  // A1 — reversible local maintenance
  projection: "A1",
  format: "A1",
  cache_refresh: "A1",
  fixture: "A1",
  worktree_probe: "A1",
  // A2 — bounded repository evolution
  source_change: "A2",
  test: "A2",
  branch_commit: "A2",
  draft_pr: "A2",
  // A3 — external adapters WITHOUT custody or spend
  ci_dispatch: "A3",
  fetch_public: "A3",
  ots_submit: "A3",
  branch_push: "A3",
  // A4 — sovereign (custody, spend, core law, irreversible, deploy)
  key: "A4",
  rotate_key: "A4",
  deploy: "A4",
  spend: "A4",
  chain_tx: "A4",
  inscribe: "A4",
  destructive: "A4",
  core_law: "A4",
  mandate_edit: "A4",
  quorum_rule_change: "A4",
};

const ORDER: Record<ActionClass, number> = {
  A0: 0,
  A1: 1,
  A2: 2,
  A3: 3,
  A4: 4,
};

// Static code capability is a lower bound, never a permission. Generic writes
// cannot be called A1 until an exact-write-set confinement receipt exists;
// generic subprocess is sovereign because it can cross every other boundary.
const CAPABILITY_FLOOR: Record<CapabilityEvidence["capability"], ActionClass> =
  {
    readonly: "A0",
    writes: "A2",
    git: "A2",
    network: "A3",
    subprocess: "A4",
    unknown: "A4",
  };

function maxClass(a: ActionClass, b: ActionClass): ActionClass {
  return ORDER[a] >= ORDER[b] ? a : b;
}

/** The class demanded by the intent's effects ALONE — no capability floor. Used to
 * confirm that an A2 intrinsic class came from the `writes` FLOOR and not from a
 * genuinely A2+ effect (e.g. source_change), which attenuation must never touch. */
function effectsOnlyClass(
  intent: AutonomyIntent,
  evidence?: CapabilityEvidence,
): ActionClass {
  let cls: ActionClass = "A0";
  for (
    const e of [
      ...(intent.effects ?? []),
      ...(evidence?.semantic_effects ?? []),
    ]
  ) {
    const ec = EFFECT_CLASS[e] ?? "A4";
    if (ORDER[ec] > ORDER[cls]) cls = ec;
  }
  return cls;
}

/** The class of an intent — the MOST-PRIVILEGED of its effects; an unknown effect
 *  is A4 (fail-closed: the kernel never guesses a privilege down). An intent with
 *  no effects is A0 (pure observation). */
export function classifyIntent(
  intent: AutonomyIntent,
  evidence?: CapabilityEvidence,
): {
  cls: ActionClass;
  reason: string;
} {
  let cls: ActionClass = "A0";
  const effects = [
    ...(intent.effects ?? []),
    ...(evidence?.semantic_effects ?? []),
  ];
  for (const e of effects) {
    const ec = EFFECT_CLASS[e] ?? "A4"; // unknown effect ⇒ sovereign
    if (ORDER[ec] > ORDER[cls]) cls = ec;
  }
  if (evidence) cls = maxClass(cls, CAPABILITY_FLOOR[evidence.capability]);
  const unknown = effects.filter((e) => !(e in EFFECT_CLASS));
  return {
    cls,
    reason: unknown.length
      ? `unknown effect(s) ${unknown.join(",")} ⇒ sovereign by default`
      : evidence
      ? `most-privileged claimed/observed effect + capability floor ⇒ ${cls}`
      : `claimed effects only (non-authoritative) ⇒ ${cls}`,
  };
}

export type ReasonCode =
  | "admitted"
  | "sovereign_action_required" // A4 — never auto
  | "mandate_missing_or_expired"
  | "no_matching_profile"
  | "verb_not_in_profile"
  | "target_not_in_profile"
  | "destination_not_allowed"
  | "effect_escalation" // an effect above the profile ceiling
  | "recursive_mandate_edit"
  | "effect_evidence_missing"
  | "effect_evidence_mismatch"
  | "anchor_unverified"
  | "mandate_standing_unverified";

export interface AdmitVerdict {
  admitted: boolean;
  cls: ActionClass; // the EXECUTION class (A1 when attenuated)
  intrinsic_class?: ActionClass; // the unattenuated class (A2 for a writes generator)
  attenuated?: boolean; // true iff a ratified attenuation lowered the execution class
  attenuation_hash?: string | null; // bound into the warrant when attenuated
  profile_id: string | null;
  reason_code: ReasonCode;
  reason: string;
  mandate_commitment: string | null;
  effect_verdict_hash: string | null;
}

function withinExpiry(m: AutonomyMandate, at: Anchor): boolean {
  return at.height >= m.valid_from.height && at.height < m.valid_until.height;
}

/** Decide whether `mandate` authorizes `intent` at anchor `at`. Pure, fail-closed.
 *  A4 is never admitted; absence of a matching profile is denial; an effect outside
 *  the profile ceiling is escalation; an edit of the mandate itself is recursive. */
export function admit(
  intent: AutonomyIntent,
  mandate: AutonomyMandate | null,
  at: Anchor,
  context: AdmissionContext = { anchor_verified: false },
): AdmitVerdict {
  const evidence = context.capability_evidence;
  const intrinsicCls = classifyIntent(intent, evidence).cls;

  // Attenuation (codex x5d00_954460, ratified): a `writes`-FLOORED A2 may EXECUTE as
  // A1 inside one confined transaction. admit re-checks the floor independently — the
  // capability must be EXACTLY `writes` and the effects alone must be <= A1 — so a
  // genuinely A2+ effect (source_change) and every network/subprocess/unknown
  // capability are categorically un-attenuable here too, not just in the verifier.
  const att = context.attenuation;
  const attenuable = intrinsicCls === "A2" &&
    evidence?.capability === "writes" &&
    ORDER[effectsOnlyClass(intent, evidence)] <= ORDER["A1"];
  const attenuated = !!(
    attenuable && att?.eligible && att.execution_class === "A1" &&
    att.attenuation_hash
  );
  const cls: ActionClass = attenuated ? "A1" : intrinsicCls;

  const base = {
    cls,
    intrinsic_class: intrinsicCls,
    attenuated,
    attenuation_hash: attenuated ? att!.attenuation_hash : null,
    profile_id: null,
    mandate_commitment: context.mandate_standing?.mandate_commitment ?? null,
    effect_verdict_hash: evidence?.verdict_hash ?? null,
  };

  // a mandate edit can never be authorized BY a mandate (recursive) — checked
  // before the general A4 gate so the refusal carries the specific reason. It is
  // also sovereign (A4): a fresh human+model act is required either way.
  if (intent.effects?.includes("mandate_edit")) {
    return {
      ...base,
      admitted: false,
      reason_code: "recursive_mandate_edit",
      reason:
        "a mandate cannot authorize edits to itself (sovereign + recursive)",
    };
  }
  if (cls === "A4") {
    return {
      ...base,
      admitted: false,
      reason_code: "sovereign_action_required",
      reason: "A4 is sovereign — a fresh human+model act, never auto-admitted",
    };
  }
  if (!evidence) {
    return {
      ...base,
      admitted: false,
      reason_code: "effect_evidence_missing",
      reason: "no independent capability evidence supplied",
    };
  }
  if (
    evidence.subject_verb !== intent.verb ||
    evidence.subject_target !== intent.target ||
    !evidence.verdict_hash ||
    !evidence.organ_hash
  ) {
    return {
      ...base,
      admitted: false,
      reason_code: "effect_evidence_mismatch",
      reason:
        "capability evidence is not content-bound to this verb and target",
    };
  }
  if (!context.anchor_verified) {
    return {
      ...base,
      admitted: false,
      reason_code: "anchor_unverified",
      reason: "the comparison anchor was not verified by the temporal boundary",
    };
  }
  if (!mandate || !withinExpiry(mandate, at)) {
    return {
      ...base,
      admitted: false,
      reason_code: "mandate_missing_or_expired",
      reason: !mandate
        ? "no mandate supplied"
        : `anchor ${at.height} outside [${mandate.valid_from.height}, ${mandate.valid_until.height})`,
    };
  }
  const standing = context.mandate_standing;
  if (
    !standing?.verified ||
    standing.final_state !== "implemented" ||
    standing.mandate_id !== mandate.mandate_id ||
    standing.constitution_commitment !== mandate.constitution_commitment ||
    !standing.mandate_commitment
  ) {
    return {
      ...base,
      admitted: false,
      reason_code: "mandate_standing_unverified",
      reason: "mandate finality/constitution standing is absent or mismatched",
    };
  }
  const candidates = mandate.action_profiles.filter((p) => p.class === cls);
  if (candidates.length === 0) {
    return {
      ...base,
      admitted: false,
      reason_code: "no_matching_profile",
      reason: `mandate has no ${cls} profile`,
    };
  }
  let sawVerb = false;
  let sawTarget = false;
  let sawCeiling = false;
  for (const p of candidates) {
    if (!p.verbs.includes(intent.verb) && !p.verbs.includes("*")) continue;
    sawVerb = true;
    if (!p.targets.includes(intent.target) && !p.targets.includes("*")) {
      continue;
    }
    sawTarget = true;
    const effectiveEffects = [
      ...(intent.effects ?? []),
      ...(evidence.semantic_effects ?? []),
    ];
    const over = effectiveEffects.filter((e) => !p.effect_ceiling.includes(e));
    if (over.length) {
      continue;
    }
    sawCeiling = true;
    if (cls === "A3") {
      const dest = intent.destination;
      if (!dest || !(p.destinations ?? []).includes(dest)) {
        continue;
      }
    }
    return {
      cls,
      intrinsic_class: intrinsicCls,
      attenuated,
      attenuation_hash: attenuated ? att!.attenuation_hash : null,
      profile_id: p.id,
      admitted: true,
      reason_code: "admitted",
      reason: attenuated
        ? `authorized by profile ${p.id} (writes attenuated to A1) under mandate ${mandate.mandate_id}`
        : `authorized by profile ${p.id} under mandate ${mandate.mandate_id}`,
      mandate_commitment: standing.mandate_commitment,
      effect_verdict_hash: evidence.verdict_hash,
    };
  }
  return {
    ...base,
    admitted: false,
    reason_code: !sawVerb
      ? "verb_not_in_profile"
      : !sawTarget
      ? "target_not_in_profile"
      : !sawCeiling
      ? "effect_escalation"
      : "destination_not_allowed",
    reason:
      `no ${cls} profile matches the complete verb/target/effect/destination tuple`,
  };
}
