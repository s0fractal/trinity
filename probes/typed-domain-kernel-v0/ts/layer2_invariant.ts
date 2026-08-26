// Layer 2 — invariants: scope, cost class, and content-addressed context.
// B4 / B8.
//
// This layer closes a seam the RFC leaves open between its own two sections:
// §6.1.2 rule 1 says "An `InvariantDefinition` MUST declare which context
// surfaces its predicate reads", and the `InvariantDefinition` type at §6.1.1
// has no field for them. The obligation exists and its carrier does not. The
// field is added here and marked as PROPOSED, not quoted.

import {
  type ContentAddress,
  type InvariantId,
  isContentAddress,
  type MeasureRef,
  type NotAssessedReason,
  type PredicateRef,
  type ValidationReport,
} from "./layer1_domain.ts";

export type FixtureRef = ContentAddress;
export type StateRef = ContentAddress;
export type TransitionRef = ContentAddress;
export type TraceRef = ContentAddress;
export type SnapshotRef = ContentAddress;
export type AuthorityRef = ContentAddress;
export type SequenceRef = string;

export const SCOPES = ["state", "transition", "trace"] as const;
export type Scope = (typeof SCOPES)[number];

export const COST_CLASSES = [
  "constant",
  "linear",
  "superlinear",
  "unbounded",
] as const;
export type CostClass = (typeof COST_CLASSES)[number];

/** The context surfaces a predicate may read. CLOSED set: §6.1.2 rule 1 makes
 *  an undeclared read non-conforming, and "checkable by evaluating it against a
 *  snapshot that omits the undeclared surface" is only checkable if the surfaces
 *  are enumerable.
 *
 *  The RFC names `worldSnapshot`, `authoritySnapshot` and
 *  `evaluatedAtLogicalStep` in `InvariantEvaluation`; this list is those three
 *  plus the scope-carried inputs, so that a `state`-scope predicate reading a
 *  predecessor is caught as an undeclared read rather than as a scope error. */
export const CONTEXT_SURFACES = [
  "state",
  "transition",
  "trace",
  "world",
  "authority",
  "logical-step",
] as const;
export type ContextSurface = (typeof CONTEXT_SURFACES)[number];

/** §6.1.1's type, plus the `reads` field §6.1.2 rule 1 requires and §6.1.1 does
 *  not carry. PROPOSED — see the README ambiguity table. */
export type InvariantDefinition = {
  id: InvariantId;
  address: ContentAddress;
  scope: Scope;
  predicate: PredicateRef;
  costClass: CostClass;
  /** Required if the invariant can be partially held (§6.1.1 rule 3), because
   *  §7.1.1 composes distortion by this measure's own rule. */
  distortionMeasure?: MeasureRef;
  falsifier: readonly FixtureRef[];
  /** PROPOSED (§6.1.2 rule 1 obligation, §6.1.1 carrier absent). */
  reads: readonly ContextSurface[];
};

export type InvariantEvaluation = {
  predicate: PredicateRef;
  state: StateRef;
  transition?: TransitionRef;
  trace?: TraceRef;
  worldSnapshot: SnapshotRef;
  authoritySnapshot: AuthorityRef;
  evaluatedAtLogicalStep: SequenceRef;
  result: ValidationReport;
};

/** A boundary's freshness requirement. §6.1.2 rule 5 requires boundaries to
 *  declare one and gives it no type, unit or comparison. Expressed here in
 *  LOGICAL STEPS rather than time, because rule 4 forbids a predicate from
 *  reading the clock and a freshness rule denominated in wall-clock would
 *  reintroduce the thing rule 4 removes. PROPOSED. */
export type Freshness = { maxLogicalStepsBehind: number };

export const INVARIANT_REFUSALS = [
  "scope-narrower-than-declared",
  "missing-predecessor-for-transition",
  "missing-trace-for-trace-scope",
  "unbounded-gates-fast-path",
  "cost-class-exceeds-budget",
  "partial-without-distortion-measure",
  "undeclared-surface-read",
  "surface-declared-not-available",
  "unknown-surface",
  "non-content-addressed-reference",
  "no-falsifier",
] as const;
export type InvariantRefusal = (typeof INVARIANT_REFUSALS)[number];

export type InvariantVerdict =
  | { ok: true }
  | { ok: false; code: InvariantRefusal; reason: string };

const no = (code: InvariantRefusal, reason: string): InvariantVerdict => ({
  ok: false,
  code,
  reason,
});

/** Static checks on a definition, before any evaluation. */
export function validateInvariantDefinition(
  d: InvariantDefinition,
  opts: { canBePartiallyHeld?: boolean } = {},
): InvariantVerdict {
  for (const s of d.reads) {
    if (!(CONTEXT_SURFACES as readonly string[]).includes(s)) {
      return no("unknown-surface", `${s} is not a context surface`);
    }
  }
  if (opts.canBePartiallyHeld && !d.distortionMeasure) {
    return no(
      "partial-without-distortion-measure",
      "an invariant that can be partially held must supply a distortionMeasure, " +
        "because §7.1.1 composes distortion by that measure's own rule (§6.1.1 rule 3)",
    );
  }
  if (!d.falsifier.length) {
    return no(
      "no-falsifier",
      "an invariant with no falsifier fixture cannot be shown to fail, and a " +
        "check that cannot fail is not a check",
    );
  }
  for (
    const [where, ref] of [
      ["address", d.address],
      ["predicate", d.predicate],
      ...(d.distortionMeasure
        ? [["distortionMeasure", d.distortionMeasure] as [string, string]]
        : []),
      ...d.falsifier.map((f, i): [string, string] => [`falsifier[${i}]`, f]),
    ] as [string, string][]
  ) {
    if (!isContentAddress(ref)) {
      return no(
        "non-content-addressed-reference",
        `${where} is not a full sha256: digest (§19.10)`,
      );
    }
  }
  return { ok: true };
}

/** Which surfaces an evaluation actually makes available. A surface that is
 *  declared but absent from the evaluation is refused BEFORE the predicate
 *  runs, which is what makes §6.1.2 rule 1 checkable "by evaluating it against a
 *  snapshot that omits the undeclared surface". */
export function availableSurfaces(e: InvariantEvaluation): Set<ContextSurface> {
  const s = new Set<ContextSurface>(["state"]);
  if (e.transition) s.add("transition");
  if (e.trace) s.add("trace");
  if (e.worldSnapshot) s.add("world");
  if (e.authoritySnapshot) s.add("authority");
  if (e.evaluatedAtLogicalStep) s.add("logical-step");
  return s;
}

/** Admit or refuse ONE evaluation at a boundary.
 *
 *  Fail closed everywhere, and distinguish `not-assessed` from `failed`: §6.1.2
 *  rule 5 requires a stale snapshot to be "treated as `not assessed` rather than
 *  as `held`", which is a three-valued outcome the RFC never types. Collapsing
 *  it to a boolean is how a boundary comes to believe an invariant held when
 *  nobody checked it. */
export function admitEvaluation(
  d: InvariantDefinition,
  e: InvariantEvaluation,
  boundary: {
    budget?: CostClass;
    fastPath?: boolean;
    freshness?: Freshness;
    snapshotLogicalStepsBehind?: number;
  } = {},
): InvariantVerdict | { ok: false; notAssessed: NotAssessedReason; reason: string } {
  // Scope first: an invariant checked at a narrower scope than declared and
  // reported as held is the failure §6.1.1 rule 1 names.
  if (d.scope === "transition" && !e.transition) {
    return no(
      "missing-predecessor-for-transition",
      "a transition-scope invariant requires the predecessor and must not be " +
        "checked from a state in isolation (§6.1.1 :168-169)",
    );
  }
  if (d.scope === "trace" && !e.trace) {
    return no(
      "missing-trace-for-trace-scope",
      "a trace-scope invariant cannot be established by inspecting the state " +
        "that arrived at a boundary; a gate claiming to enforce it from one " +
        "state is not enforcing it (§6.1.1 :170-171)",
    );
  }

  // §6.1.1 rule 2: unbounded never gates a fast path, and never sits at a
  // boundary with a bounded budget.
  if (d.costClass === "unbounded" && boundary.fastPath) {
    return no(
      "unbounded-gates-fast-path",
      "an unbounded invariant must not gate a fast-path decision (§6.1.1 rule 2)",
    );
  }
  if (boundary.budget) {
    const rank = (c: CostClass) => COST_CLASSES.indexOf(c);
    if (rank(d.costClass) > rank(boundary.budget)) {
      return {
        ok: false,
        notAssessed: "cost-class-exceeds-budget",
        reason:
          `the invariant is ${d.costClass}; this boundary budgets ` +
          `${boundary.budget}. Not assessed — reporting it as held would be a ` +
          "claim nobody paid for",
      };
    }
  }

  // §6.1.2 rule 1, in the direction that catches an undeclared read: every
  // surface the definition declares must be present, and any surface present
  // beyond what was declared is available to a predicate that never said it
  // would read it. The second half is the one a permissive check skips.
  const available = availableSurfaces(e);
  for (const s of d.reads) {
    if (!available.has(s)) {
      return no(
        "surface-declared-not-available",
        `the definition declares it reads ${s}, which this evaluation does not ` +
          "supply",
      );
    }
  }
  for (const s of available) {
    if (s === "state") continue; // always required
    if (!d.reads.includes(s)) {
      return no(
        "undeclared-surface-read",
        `the evaluation supplies ${s}, which the definition did not declare it ` +
          "reads; a predicate that reads an undeclared surface is " +
          "non-conforming (§6.1.2 rule 1)",
      );
    }
  }

  // §6.1.2 rule 5: staleness is not-assessed, never held.
  if (
    boundary.freshness &&
    boundary.snapshotLogicalStepsBehind !== undefined &&
    boundary.snapshotLogicalStepsBehind > boundary.freshness.maxLogicalStepsBehind
  ) {
    return {
      ok: false,
      notAssessed: "snapshot-stale",
      reason:
        `the snapshot is ${boundary.snapshotLogicalStepsBehind} logical steps ` +
        `behind; this boundary requires at most ` +
        `${boundary.freshness.maxLogicalStepsBehind}. An invariant that held ` +
        "against a snapshot no longer current has not been shown to hold now",
    };
  }

  return { ok: true };
}

/** The proof obligation this layer does not discharge. */
export const PROOF_OBLIGATION_SCOPE_MONOTONICITY = `
This kernel refuses an invariant checked at a scope NARROWER than declared
(§6.1.1 rule 1). It does not establish the converse — that checking at a WIDER
scope is always sound — and the RFC does not state it either.

It is not obviously true. A trace-scope evaluation supplies a trace; a
state-scope predicate that declared it reads only \`state\` will not see it, so
the wider evaluation is sound for THAT predicate. But a predicate declaring
\`reads: ["state","world"]\` evaluated inside a trace context may observe a world
snapshot taken at a different logical step than the state it is judging, and
§6.1.2 rule 2 (reproducibility) is then a claim about a pairing nobody pinned.

Obligation: state whether scope widening preserves evaluation reports, and if so
under what constraint on the logical step of each supplied surface. Until it is
stated, this kernel neither permits nor forbids widening — it validates what was
supplied against what was declared, and nothing more.
`.trim();
