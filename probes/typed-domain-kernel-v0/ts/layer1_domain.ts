// Layer 1 — StateDomain, capability interfaces, typed delta. B1 / B3.
//
// Interfaces and validators only. No production domain, no translator, no
// runtime integration: this package exists so the boundaries can be reviewed
// before anything is built on them.
//
// Reuses what already exists rather than reinventing it: `ScopeKind`/`ScopeRef`
// come from probes/hsp-fast-path-debt-scope-v0, which already types RFC-0003
// references and already carries the full-digest convention §19.10 requires
// ("short handles MUST NOT be load-bearing").

export type ContentAddress = string; // `sha256:` + 64 lowercase hex
export type DomainId = string;
export type InvariantId = string;
export type EvidenceRef = ContentAddress;
export type FixtureRef = ContentAddress;
export type PredicateRef = ContentAddress;
export type MeasureRef = ContentAddress;

export const FULL_DIGEST = /^sha256:[0-9a-f]{64}$/;

/** §19.10: short handles are not load-bearing. Every reference in this kernel
 *  is a full digest, and this is the one place that is enforced. */
export function isContentAddress(v: unknown): v is ContentAddress {
  return typeof v === "string" && FULL_DIGEST.test(v);
}

// ---------------------------------------------------------------------------
// B3 — capabilities are a CLOSED set, declared and implemented together.
// ---------------------------------------------------------------------------

export const CAPABILITIES = [
  "comparable",
  "ordered",
  "metric",
  "interpolable",
  "composable",
  "geometric",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

/** §6.3.1 requires the registry to reject BOTH directions: a declared
 *  capability that is absent, and an implemented one that was not declared.
 *  The second is the one that is easy to skip — an undeclared capability is a
 *  surface consumers cannot reason about, and it is still there. */
export const CAPABILITY_METHODS: Record<Capability, readonly string[]> = {
  comparable: ["compare"],
  ordered: ["order"],
  metric: ["distance"],
  interpolable: ["interpolate"],
  composable: ["compose"],
  geometric: ["move", "transport", "deltaDescriptor"],
};

/** §6 :127-131 requires a domain exposing `move` to declare a DeltaDescriptor
 *  with its own content address, "otherwise `move` is an untyped hole in an
 *  otherwise typed contract".
 *
 *  THE RFC NEVER GIVES ITS SHAPE. `DeltaDescriptor` appears at :111, :128 and in
 *  the revision history, and nowhere is defined. This is the minimum that makes
 *  the stated obligation checkable: the delta space needs the same canonical
 *  encoding and validation obligations as the point space, which means an
 *  address, a validator, and its own laws — a delta space with no laws cannot
 *  support any claim about composing moves.
 *
 *  Proposed, not quoted. Marked as such in the README's ambiguity table. */
export type DeltaDescriptor = {
  address: ContentAddress;
  /** The predicate a candidate delta must satisfy. Content-addressed for the
   *  same reason invariant predicates are: a validator nobody can name is a
   *  validator nobody can replay. */
  validate: PredicateRef;
  /** Canonical encoding identifier for the delta space. Separate from the point
   *  space's: §5.1.1 rule 6 puts the encoding identifier inside the digest, and
   *  a delta that borrowed the point space's identifier would claim an encoding
   *  it does not use. */
  encoding: string;
  /** Laws of delta composition, if the domain composes deltas at all.
   *  DELIBERATELY OPTIONAL and deliberately not defaulted to associative:
   *  typedness does not confer associativity, and assuming it is exactly the
   *  move §6.2 exists to prevent. Absent means "no claim", not "no law". */
  composition?: ContentAddress;
};

export type OperationDescriptor = {
  name: string;
  address: ContentAddress;
};

export type ForbiddenOperation = {
  name: string;
  /** §5 :232-234 — an operation without coherent meaning MUST be absent or
   *  explicitly forbidden. A reason is required so "forbidden" is a statement
   *  rather than a shrug. */
  reason: string;
};

/** §6.1.2 rule 5 requires an outcome distinct from held and from failed:
 *  a stale snapshot is `not assessed`. `ValidationReport` is never typed in the
 *  RFC, so this is the minimum shape that can express what rule 5 demands. */
export type ValidationReport =
  | { verdict: "held" }
  | { verdict: "failed"; detail: string }
  | { verdict: "not-assessed"; reason: NotAssessedReason };

export const NOT_ASSESSED_REASONS = [
  "snapshot-stale",
  "snapshot-missing",
  "scope-not-available",
  "cost-class-exceeds-budget",
  "undeclared-surface-read",
] as const;
export type NotAssessedReason = (typeof NOT_ASSESSED_REASONS)[number];

/** The declared surface of a state domain — everything §6.1 requires it to
 *  provide, as data rather than as methods, so a registry can check a
 *  declaration without instantiating anything. */
export type DomainDeclaration = {
  id: DomainId;
  address: ContentAddress;
  /** §6.2.1 rule 2: a projection of the version DAG, never an assertion. */
  version: string;
  capabilities: readonly Capability[];
  /** Method names the implementation actually exposes. §6.3.1 compares this
   *  against `capabilities` in BOTH directions. */
  implements: readonly string[];
  supportedOperations: readonly OperationDescriptor[];
  forbiddenOperations: readonly ForbiddenOperation[];
  invariants: readonly ContentAddress[];
  /** Required if and only if `geometric` is declared (§6 :127-131). */
  deltaDescriptor?: DeltaDescriptor;
  /** §6.2 rule 4: any domain exposing `distance` MUST declare metric axioms.
   *  Carried as addresses here; the claims themselves live in layer 3. */
  laws: Record<string, ContentAddress>;
};

export const DOMAIN_REFUSALS = [
  "capability-declared-not-implemented",
  "capability-implemented-not-declared",
  "geometric-without-delta-descriptor",
  "delta-descriptor-without-geometric",
  "metric-without-axioms",
  "operation-both-supported-and-forbidden",
  "forbidden-without-reason",
  "non-content-addressed-reference",
  "unknown-capability",
] as const;
export type DomainRefusal = (typeof DOMAIN_REFUSALS)[number];

export type DomainVerdict =
  | { ok: true }
  | { ok: false; code: DomainRefusal; reason: string };

/** Registry admission, §6.3.1. Fail closed in both directions. */
export function validateDomain(d: DomainDeclaration): DomainVerdict {
  const no = (code: DomainRefusal, reason: string): DomainVerdict => ({
    ok: false,
    code,
    reason,
  });

  for (const c of d.capabilities) {
    if (!(CAPABILITIES as readonly string[]).includes(c)) {
      return no("unknown-capability", `${c} is not a capability of this kernel`);
    }
  }

  const implemented = new Set(d.implements);
  const declaredMethods = new Set<string>();
  for (const c of d.capabilities) {
    for (const m of CAPABILITY_METHODS[c]) {
      declaredMethods.add(m);
      if (!implemented.has(m)) {
        return no(
          "capability-declared-not-implemented",
          `${c} is declared but ${m}() is absent — a promise that fails at the ` +
            "worst moment (§6.3.1)",
        );
      }
    }
  }
  for (const m of implemented) {
    if (!declaredMethods.has(m)) {
      return no(
        "capability-implemented-not-declared",
        `${m}() is implemented but no declared capability covers it — an ` +
          "undeclared surface consumers cannot reason about (§6.3.1)",
      );
    }
  }

  const geometric = d.capabilities.includes("geometric");
  if (geometric && !d.deltaDescriptor) {
    return no(
      "geometric-without-delta-descriptor",
      "a domain exposing move() must declare a typed delta space, or move() is " +
        "an untyped hole in a typed contract (§6 :127-131)",
    );
  }
  if (!geometric && d.deltaDescriptor) {
    return no(
      "delta-descriptor-without-geometric",
      "a delta descriptor without the geometric capability describes a space " +
        "nothing moves through",
    );
  }

  if (d.capabilities.includes("metric") && !d.laws["metricAxioms"]) {
    return no(
      "metric-without-axioms",
      "a domain exposing distance() must declare metricAxioms; a similarity " +
        "score that violates the triangle inequality is not a metric (§6.2 rule 4)",
    );
  }

  const supported = new Set(d.supportedOperations.map((o) => o.name));
  for (const f of d.forbiddenOperations) {
    if (supported.has(f.name)) {
      return no(
        "operation-both-supported-and-forbidden",
        `${f.name} is both supported and forbidden`,
      );
    }
    if (!f.reason.trim()) {
      return no(
        "forbidden-without-reason",
        `${f.name} is forbidden without a reason; "forbidden" must be a ` +
          "statement rather than a shrug (§5 :232-234)",
      );
    }
  }

  const refs: [string, string][] = [
    ["address", d.address],
    ...d.supportedOperations.map((o): [string, string] => [
      `operation ${o.name}`,
      o.address,
    ]),
    ...d.invariants.map((r, i): [string, string] => [`invariant[${i}]`, r]),
    ...Object.entries(d.laws).map(([k, v]): [string, string] => [`law ${k}`, v]),
    ...(d.deltaDescriptor
      ? [
        ["deltaDescriptor.address", d.deltaDescriptor.address] as [
          string,
          string,
        ],
        ["deltaDescriptor.validate", d.deltaDescriptor.validate] as [
          string,
          string,
        ],
      ]
      : []),
  ];
  for (const [where, ref] of refs) {
    if (!isContentAddress(ref)) {
      return no(
        "non-content-addressed-reference",
        `${where} is ${JSON.stringify(ref)}, not a full sha256: digest (§19.10)`,
      );
    }
  }

  return { ok: true };
}
