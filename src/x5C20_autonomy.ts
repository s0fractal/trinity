#!/usr/bin/env -S deno run --allow-read
// src/x5C20_autonomy.ts — the Delegated Autonomy Kernel policy compiler (codex P0).
// position: 5/C2 → action × bridge = the policy that bridges an intent to an
//   authorized action (or a typed refusal). Pure, read-only, fail-closed.
// hex_dipole: "00 00 00 00 00 59 00 00"
// placement_policy: axis
//
// codex x5d00_954447: minimize human intervention by AMORTIZING approval into a
// narrow, machine-enforced mandate — never by removing sovereignty or granting
// blanket write. A ratified AUTONOMY_MANDATE.v1 declares action profiles, budgets,
// expiry and quorum per class; this compiler decides, for one intent, which class
// it is and whether a mandate authorizes it. It DECIDES policy; it never acts.
//
// Fail-closed law (codex falsifiers): an unknown effect is sovereign by default;
// the class of an intent is the MOST-PRIVILEGED of its effects (so A0–A3 cannot be
// composed to launder an A4); A4 is NEVER auto-admitted; a mandate can never
// authorize a verb/target/destination absent from a profile, an effect above the
// ceiling, an action after expiry, or an edit of the mandate itself.

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

// ── CLI (read-only) ──────────────────────────────────────────────────────────────
async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await Deno.readTextFile(path)) as T;
  } catch {
    return null;
  }
}
function flag(args: string[], n: string): string | undefined {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
}

export async function runCli(args: string[] = Deno.args): Promise<void> {
  const sub = args[0];
  const intentPath = args[1] && !args[1].startsWith("--") ? args[1] : undefined;
  const intent = intentPath ? await readJson<AutonomyIntent>(intentPath) : null;
  const mandate = flag(args, "mandate")
    ? await readJson<AutonomyMandate>(flag(args, "mandate")!)
    : null;
  const context = flag(args, "context")
    ? await readJson<AdmissionContext>(flag(args, "context")!)
    : null;
  const at: Anchor = {
    kind: "bitcoin_block",
    height: Number(flag(args, "at") ?? Number.NaN),
  };

  if (sub === "classify" && intent) {
    console.log(JSON.stringify(
      {
        type: "autonomy_classify",
        position: "5/C2",
        ...classifyIntent(intent),
      },
      null,
      2,
    ));
    return;
  }
  if ((sub === "explain" || sub === "admit") && intent) {
    const v = Number.isSafeInteger(at.height)
      ? admit(intent, mandate, at, context ?? { anchor_verified: false })
      : {
        admitted: false,
        cls: classifyIntent(intent, context?.capability_evidence).cls,
        profile_id: null,
        reason_code: "anchor_unverified" as const,
        reason:
          "--at <bitcoin-block> is required; mandate.valid_from is not current time",
        mandate_commitment: null,
        effect_verdict_hash: context?.capability_evidence?.verdict_hash ?? null,
      };
    console.log(
      JSON.stringify(
        { type: "autonomy_admit", position: "5/C2", ...v },
        null,
        2,
      ),
    );
    if (!v.admitted) Deno.exitCode = 1;
    return;
  }
  if (sub === "budget" && mandate) {
    console.log(JSON.stringify(
      {
        type: "autonomy_budget",
        position: "5/C2",
        mandate_id: mandate.mandate_id,
        valid: [mandate.valid_from.height, mandate.valid_until.height],
        profiles: mandate.action_profiles.map((p) => ({
          id: p.id,
          class: p.class,
          verbs: p.verbs,
          rate_limit: p.rate_limit,
        })),
        global_budgets: mandate.global_budgets ?? null,
      },
      null,
      2,
    ));
    return;
  }
  console.log(JSON.stringify(
    {
      type: "autonomy",
      position: "5/C2",
      usage: [
        "autonomy classify <intent.json>",
        "autonomy explain <intent.json> --mandate <mandate.json> --context <verified-context.json> --at <block>",
        "autonomy budget --mandate <mandate.json>",
      ],
      note:
        "the Delegated Autonomy Kernel policy compiler (codex x5d00_954447) — pure, read-only, fail-closed. Decides policy; never acts.",
    },
    null,
    2,
  ));
}

if (import.meta.main) await runCli();
