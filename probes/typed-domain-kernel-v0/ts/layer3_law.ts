// Layer 3 — law evidence, boundary policy, version DAG. B2 / B7 / B5.
//
// The crux of this package is here, and it is a normative ambiguity rather than
// a missing type: §6.2 rule 2 says "a policy MUST state the minimum status each
// boundary requires", and the RFC never defines an order on `LawStatus`.
// "Minimum" over an unordered set is not a requirement anyone can implement the
// same way twice. Part 03 repeats the phrase three times (§7.1 :397, :540, :678)
// and never repairs it.
//
// This is the same defect the Lean kernel already proved for suitability —
// `Suitability.lean`'s `no_meet` — where the document said "the lower of two
// levels" over an order that has no meet. That precedent is why this package
// does not simply invent a total order and move on: an invented order is a
// normative decision wearing an implementation's clothes.

import type { ContentAddress, EvidenceRef, FixtureRef, PredicateRef } from "./layer1_domain.ts";

export type AgentId = string;
export type GeneratorRef = ContentAddress;
export type OperationRef = ContentAddress;
export type OrderRef = ContentAddress;

/** §6.2, verbatim in shape. The four variants are a CLOSED set. */
export type LawStatus =
  | { kind: "proved"; proof: EvidenceRef; checker: ContentAddress }
  | {
    kind: "tested";
    generator: GeneratorRef;
    domain: PredicateRef; // what the generator actually covers
    cases: number;
    seed: string;
    ref: EvidenceRef;
  }
  | { kind: "asserted"; author: AgentId }
  | { kind: "falsified"; counterexample: FixtureRef };

export const LAW_STATUS_KINDS = [
  "proved",
  "tested",
  "asserted",
  "falsified",
] as const;
export type LawStatusKind = (typeof LAW_STATUS_KINDS)[number];

export type LawClaim = {
  status: LawStatus;
  scope: "total" | "partial";
  precondition?: PredicateRef;
};

// ---------------------------------------------------------------------------
// The order that does not exist, and the one this package proposes instead.
// ---------------------------------------------------------------------------

/** The RFC's stated floor, and NOTHING else, expressed as a partial order.
 *
 *  §6.2 rule 2 gives exactly two constraints and no more:
 *
 *    * `falsified` authorizes nothing, anywhere;
 *    * `asserted` does not authorize composition across a translation or
 *      irreversible boundary.
 *
 *  From those, `falsified` is below everything and `asserted` is below the two
 *  evidenced kinds AT SUCH BOUNDARIES. The text never relates `proved` and
 *  `tested` to one another, and this package does NOT invent that relation —
 *  see `PROVED_TESTED_INCOMPARABLE` and the countermodel that motivates it.
 *
 *  Returns `null` for "the RFC does not order these", which is different from
 *  `false` and is the distinction a policy has to act on. */
export function statedBelow(a: LawStatusKind, b: LawStatusKind): boolean | null {
  if (a === b) return false;
  if (a === "falsified") return true; // below everything
  if (b === "falsified") return false;
  if (a === "asserted" && (b === "proved" || b === "tested")) return true;
  if (b === "asserted" && (a === "proved" || a === "tested")) return false;
  return null; // proved vs tested: unordered in the text
}

/** Why `proved` and `tested` are left incomparable rather than ranked.
 *
 *  Ranking them looks obvious and is not sound. A `LawClaim` carries `scope`
 *  and an optional `precondition`, and a `tested` status carries the DOMAIN its
 *  generator covered. So:
 *
 *    * a `proved` claim with `scope: "partial"` and a narrow `precondition`
 *      establishes the law only inside that precondition;
 *    * a `tested` claim whose generation domain strictly contains that
 *      precondition has been checked over inputs the proof says nothing about.
 *
 *  Neither dominates. Calling `proved` uniformly stronger would let a boundary
 *  accept a proof about a region it does not operate in, over evidence about the
 *  region it does. `fixtures/countermodels/proved-narrower-than-tested.json` is
 *  that pair, executable.
 *
 *  This is a normative gap, not an implementation choice, and it is reported as
 *  one rather than closed by fiat. */
export const PROVED_TESTED_INCOMPARABLE =
  "§6.2 states no relation between `proved` and `tested`; a LawClaim's scope, " +
  "precondition, and (for `tested`) generation domain can make either the " +
  "stronger evidence for a given boundary. See PROOF_OBLIGATION_LAWSTATUS_ORDER.";

export type BoundaryKind =
  | "local"
  | "translation"
  | "irreversible"
  | "composition";

export const BOUNDARY_KINDS: readonly BoundaryKind[] = [
  "local",
  "translation",
  "irreversible",
  "composition",
] as const;

/** A boundary policy. §6.2 rule 2 requires the MINIMUM to be stated per
 *  boundary; since the text supplies no order, a policy here states an explicit
 *  ACCEPT SET rather than a threshold. A set is expressible without an order,
 *  and it makes the policy's actual reach readable instead of inferred. */
export type BoundaryPolicy = {
  boundary: BoundaryKind;
  accepts: readonly LawStatusKind[];
  /** Required when `tested` is accepted: the generation domain a boundary will
   *  take. Without it, §6.2 rule 3's "a test whose generation domain is unstated
   *  is `asserted` with extra steps" is unenforceable on the CONSUMING side. */
  requiresGenerationDomain?: PredicateRef;
};

export type LawDecision =
  | { admitted: true; status: LawStatusKind }
  | { admitted: false; reason: string; code: LawRefusal };

export const LAW_REFUSALS = [
  "falsified",
  "status-not-accepted",
  "asserted-across-boundary",
  "generation-domain-unstated",
  "generation-domain-not-accepted",
  "law-absent",
  "policy-accepts-nothing",
] as const;
export type LawRefusal = (typeof LAW_REFUSALS)[number];

/** Decide one law at one boundary. Fail closed: every path that is not an
 *  explicit accept is a refusal with a code. */
export function decideLaw(
  claim: LawClaim | undefined,
  policy: BoundaryPolicy,
): LawDecision {
  const no = (code: LawRefusal, reason: string): LawDecision => ({
    admitted: false,
    code,
    reason,
  });

  if (!policy.accepts.length) {
    return no(
      "policy-accepts-nothing",
      `the ${policy.boundary} policy accepts no status; a policy that admits ` +
        "nothing is a configuration error, not a strict policy",
    );
  }
  if (!claim) {
    return no(
      "law-absent",
      "the law is not declared; an absent law is not a weak law, it is no claim",
    );
  }

  const kind = claim.status.kind;

  // §6.2 rule 2 floor, checked before the policy: `falsified` authorizes
  // nothing, so a policy cannot opt into it.
  if (kind === "falsified") {
    return no(
      "falsified",
      "the law is falsified; it authorizes nothing and fails closed wherever " +
        "it is relied on (§6.2 rule 2)",
    );
  }

  // The other half of the floor, also above policy: `asserted` never crosses a
  // translation or irreversible boundary, whatever a policy says.
  if (
    kind === "asserted" &&
    (policy.boundary === "translation" || policy.boundary === "irreversible")
  ) {
    return no(
      "asserted-across-boundary",
      `an asserted law must not authorize composition across a ` +
        `${policy.boundary} boundary (§6.2 rule 2)`,
    );
  }

  if (!policy.accepts.includes(kind)) {
    return no(
      "status-not-accepted",
      `the ${policy.boundary} policy accepts ${policy.accepts.join("|")}; this ` +
        `law is ${kind}`,
    );
  }

  if (kind === "tested") {
    // §6.2 rule 3, enforced at the consumer. The producing side declaring a
    // generator is not enough: a boundary must be able to say which generation
    // domains it will take, or "tested" is a word.
    if (!claim.status.generator || !claim.status.domain) {
      return no(
        "generation-domain-unstated",
        "a tested law must record its generator and the domain it covers; " +
          "without both it is asserted with extra steps (§6.2 rule 3)",
      );
    }
    if (
      policy.requiresGenerationDomain &&
      policy.requiresGenerationDomain !== claim.status.domain
    ) {
      return no(
        "generation-domain-not-accepted",
        `this boundary requires generation domain ` +
          `${policy.requiresGenerationDomain}; the claim covers ` +
          `${claim.status.domain}`,
      );
    }
  }

  return { admitted: true, status: kind };
}

/** §6.2 rule 5: a composition is refused when either side declares the law
 *  `falsified`, or when the two sides declare INCOMPATIBLE laws for the
 *  operation in use.
 *
 *  "Incompatible" is not defined by the RFC either. This package takes the
 *  narrow reading it can defend — one side declaring a law the other declares
 *  falsified, or the two declaring different `scope` for the same law — and
 *  reports the wider reading as an open obligation rather than guessing. */
export function decideComposition(
  left: LawClaim | undefined,
  right: LawClaim | undefined,
  policy: BoundaryPolicy,
): LawDecision {
  const l = decideLaw(left, policy);
  if (!l.admitted) return l;
  const r = decideLaw(right, policy);
  if (!r.admitted) return r;
  if (left!.scope !== right!.scope) {
    return {
      admitted: false,
      code: "status-not-accepted",
      reason:
        `the two domains declare the same law at different scopes ` +
        `(${left!.scope} vs ${right!.scope}); §6.2 rule 5 refuses a ` +
        "composition over incompatible law declarations",
    };
  }
  // Both admitted and scopes agree. The composite's status is NOT computed:
  // that would require the order §6.2 does not state. A caller that needs one
  // must consult both, which is what returning the pair-checked decision means.
  return { admitted: true, status: l.status };
}

// ---------------------------------------------------------------------------
// B5 — version is a projection of the DAG, never an assertion.
// ---------------------------------------------------------------------------

export type Release = {
  address: ContentAddress;
  predecessor: ContentAddress | null; // null only for the root release
  label: string;
};

export const VERSION_REFUSALS = [
  "label-is-not-a-projection",
  "predecessor-unknown",
  "cycle",
  "multiple-roots",
  "patch-across-law-weakening",
] as const;
export type VersionRefusal = (typeof VERSION_REFUSALS)[number];

/** §6.2.1 rule 3: a registry MUST reject a domain whose label conflicts with
 *  its position in the DAG. The RFC gives ONE example of a conflict — "a label
 *  claiming a patch increment across a change that weakened a law" — and never
 *  defines the projection function or the general notion of conflict.
 *
 *  So this validator checks what the text actually determines: the DAG is
 *  well-formed (single root, no cycle, every predecessor known), and the one
 *  named conflict is refused when law-weakening is supplied by the caller.
 *  Everything else about the projection is an open obligation, stated as one. */
export function validateVersionDag(
  releases: readonly Release[],
  weakenedLaws: ReadonlySet<ContentAddress> = new Set(),
): { ok: true } | { ok: false; code: VersionRefusal; reason: string } {
  const byAddress = new Map(releases.map((r) => [r.address, r]));
  const roots = releases.filter((r) => r.predecessor === null);
  if (roots.length !== 1) {
    return {
      ok: false,
      code: "multiple-roots",
      reason: `a version DAG has exactly one root; found ${roots.length}`,
    };
  }
  for (const r of releases) {
    if (r.predecessor !== null && !byAddress.has(r.predecessor)) {
      return {
        ok: false,
        code: "predecessor-unknown",
        reason: `${r.address} names predecessor ${r.predecessor}, which is absent`,
      };
    }
  }
  // Walk to the root from every node; a cycle is a walk that revisits.
  for (const start of releases) {
    const seen = new Set<string>();
    let cur: Release | undefined = start;
    while (cur) {
      if (seen.has(cur.address)) {
        return {
          ok: false,
          code: "cycle",
          reason: `the version DAG cycles at ${cur.address}`,
        };
      }
      seen.add(cur.address);
      cur = cur.predecessor === null
        ? undefined
        : byAddress.get(cur.predecessor);
    }
  }
  // The one conflict §6.2.1 rule 3 names by example.
  for (const r of releases) {
    if (r.predecessor === null) continue;
    if (!weakenedLaws.has(r.address)) continue;
    const prev = byAddress.get(r.predecessor)!;
    if (isPatchIncrement(prev.label, r.label)) {
      return {
        ok: false,
        code: "patch-across-law-weakening",
        reason:
          `${r.address} claims a patch increment (${prev.label} → ${r.label}) ` +
          "across a change that weakened a law (§6.2.1 rule 3)",
      };
    }
  }
  return { ok: true };
}

/** Semver-shaped patch detection, used ONLY for the conflict §6.2.1 names.
 *  This is not a claim that labels are semver — the RFC does not say so, and
 *  nothing here verifies against a label (§6.2.1: "Nothing verifies against
 *  it"). It is a heuristic in service of one stated refusal. */
function isPatchIncrement(before: string, after: string): boolean {
  const p = /^(\d+)\.(\d+)\.(\d+)$/;
  const a = p.exec(before), b = p.exec(after);
  if (!a || !b) return false;
  return a[1] === b[1] && a[2] === b[2] && Number(b[3]) === Number(a[3]) + 1;
}

/** The proof obligation this package refuses to discharge by fiat. */
export const PROOF_OBLIGATION_LAWSTATUS_ORDER = `
§6.2 rule 2 requires a policy to state "the minimum status each boundary
requires". §6.2 defines no order on LawStatus, and a minimum over an unordered
set is not a requirement two implementers can satisfy identically.

The two constraints the text DOES give — falsified below everything, asserted
below the evidenced kinds at translation and irreversible boundaries — leave
proved and tested unrelated, and LawClaim.scope, LawClaim.precondition and
tested.domain make that gap load-bearing rather than cosmetic.

Obligation: either (a) state a partial order on LawStatus and prove that every
pair a policy must compare has a greatest lower bound in it, or (b) replace
"minimum status" in §6.2 rule 2 and Part 03 §7.1 with an accept-set formulation,
which needs no order. This package implements (b) as BoundaryPolicy.accepts and
does not amend the RFC.

Prior art: proofs/rfc-0003/HSP/Suitability.lean proved the same shape for
SuitabilityLevel (no_meet, finding C3) — a document saying "the lower of two"
over an order that has no meet.
`.trim();
