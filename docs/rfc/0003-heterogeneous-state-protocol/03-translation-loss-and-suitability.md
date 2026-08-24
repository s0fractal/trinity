# RFC-0003 / Part 03: Translation, Loss, Suitability and Debt

- **Status:** Draft
- **Draft steward:** s0fractal; stewardship is distinct from prose authorship
  and ratification authority (Part 00 §0.1).
- **Text provenance:** predominantly model-generated and model-revised; exact
  source authentication is preserved where available in relays and signed chords
  (Part 07).
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md`
- **Parent:**
  [Part 00 — Architecture and Ratification
  Map](00-architecture-and-ratification-map.md), which holds the theses,
  non-goals, terminology, dependency graph, failure-mode catalogue, and open
  problems this document depends on.
- **Ratifies:** Tranche C (C1–C6)
- **Depends on:** Parts 01, 02
- **Created:** 2026-08-03 (extracted from the original single-file draft after
  four rounds of external critique; see [Part 07](07-revision-history.md))

> **Section numbers are inherited and stable.** This document keeps the section
> numbers it carried inside RFC-0003. They are not renumbered from 1, because
> ledger chords and prior receipts cite them, and a cross-reference that
> silently changes meaning is the failure this protocol exists to prevent. A
> reference of the form §N.M is resolvable through Part 00's §22 map.

---

## 7. Translation protocol

Translation is the central primitive of this RFC.

### 7.0 Five kinds of transformation, only one of which is translation

The field algebra of §7.1.1 makes recorded loss monotone for every kind: `lost`
only grows and `preserved` only shrinks. What differs by kind is whether the
**fitness of the output state** may improve relative to the input or an
intermediate state. A closed transformation carries only the information already
present in its input; the other kinds acquire or introduce information whose
origin must remain visible.

A transformer may consult evidence, query the target ontology, run inference,
resolve an ambiguity by asking the environment, or negotiate the meaning with a
counterparty. Any of those can leave the output _more_ fit for an action than
the intermediate state was. Not because lost bits came back, but because a new
source of information entered.

A no-improvement rule and a negotiation protocol cannot both bind the same
input/output fitness relation: under one a step that improves suitability is a
conformance bug, under the other it is the mechanism. Left unseparated, an
implementation either rejects legitimate enrichment or buries it inside
`introducedAssumptions`, where it is indistinguishable from a fabrication
([Part 07: Revision History](07-revision-history.md) §1).

The five kinds are therefore distinguished, and each carries different
obligations:

| Kind             | New information from | Output fitness may improve through that information | May cross irreversible boundary                    |
| ---------------- | -------------------- | --------------------------------------------------- | -------------------------------------------------- |
| `translation`    | nothing              | no                                                  | yes, per suitability                               |
| `enrichment`     | cited evidence       | yes, with attribution                               | yes, if sources are attested                       |
| `inference`      | declared rules       | yes, with attribution                               | only if rules are content-addressed and replayable |
| `reconstruction` | assumption           | yes, but boundary-barred                            | **no** — §7.0.3                                    |
| `negotiation`    | a counterparty       | yes, with attribution                               | only under a scoped contract (§13.2)               |

```ts
type TransformationKind =
  | { kind: "translation" }
  | {
    kind: "enrichment";
    sources: EvidenceRef[];
    attestation: AttestationRef[];
  }
  | { kind: "inference"; rules: ContentAddress; replayable: boolean }
  | { kind: "reconstruction"; assumptions: AssumptionRecord[] }
  | { kind: "negotiation"; counterparty: AgentId; contract: ContractRef };

type TransformationDependency =
  | {
    kind: "source";
    source: EvidenceRef;
    attestations: AttestationRef[];
  }
  | { kind: "rule"; rule: ContentAddress; replayable: boolean }
  | {
    kind: "assumption";
    assumption: ClaimRef;
    record: ContentAddress;
  }
  | { kind: "counterparty"; agent: AgentId; contract: ContractRef };

type TransformationProfile = {
  dependencies: TransformationDependency[];
};
```

`TransformationKind` classifies one step. `TransformationProfile` classifies a
pipeline without discarding any dependency introduced by its steps. A
`translation` contributes no dependency marker; the other four kinds contribute
the corresponding `source`, `rule`, `assumption`, or `counterparty` markers.

#### 7.0.1 Rules

1. Every transformation MUST declare its kind. An undeclared kind is treated as
   `reconstruction` — the most restricted — because a transformer that will not
   say where its information came from has not established that it came from
   anywhere. Its profile MUST contain an `assumption` marker pointing to the
   receipt that records this fail-closed classification.
2. **Loss-field monotonicity binds every kind.** The union/intersection rules of
   §7.1.1 never delete recorded loss. What binds `translation` alone is the
   expectation that output fitness cannot improve through newly acquired
   information, because a translation acquires none. For the other kinds, each
   improvement MUST trace to a cited source, rule, assumption, or counterparty
   exchange.
3. A pipeline mixing kinds is classified by the **join** of its
   `TransformationProfile` values under §7.0.2. The join is canonical set union,
   so obligations accumulate rather than collapse into one winning kind.
4. `enrichment` sources MUST be content-addressed and independently resolvable.
   "The model knew this" is not a source.
5. `inference` MUST record the rules by content address. An inference whose
   rules are a model's weights is not replayable and MUST be declared
   `replayable: false`, which bars it from irreversible boundaries under rule 6.
6. An inference marked `replayable: false` MUST NOT cross an irreversible
   boundary. A negotiation may cross one only under its cited scoped contract,
   and any assumption marker invokes §7.0.3 regardless of the other markers in
   the profile.

#### 7.0.2 The order on transformation profiles

The five `TransformationKind` variants are not a five-element lattice. They are
mutually exclusive classifications of one step. A pipeline is ordered by the
dependencies it asks a consumer to trust:

```text
P <= Q       iff dependencies(P) is a subset of dependencies(Q)
P join Q     = canonicalUnion(dependencies(P), dependencies(Q))
bottom       = { dependencies: [] }
```

Every dependency record MUST use the selected canonical encoding and a full
content address. `dependencies` is a canonical set sorted by member digest;
duplicate digests MUST be rejected. Profile equality is equality of canonical
bytes. The join MUST flatten and union dependency records rather than preserve a
bracket-shaped tree, and therefore is associative, commutative, and idempotent
with the empty translation profile as identity.

The resulting structure is the finite-set join-semilattice, not the earlier
five-element diagram. A `source`, `rule`, `assumption`, and `counterparty`
marker are incomparable unless one profile contains the other. An `assumption`
marker is boundary-barred under §7.0.3, but it does not absorb or erase source,
rule, or counterparty markers. There is no synthetic `reconstruction` top that
can make another obligation disappear.

Consequences for a mixed pipeline:

1. Every marker in the join activates its own obligation. A pipeline containing
   `source` and `rule` markers MUST satisfy both rule 4 and rule 5.
2. A profile is closed exactly when its dependency set is empty, which requires
   every member step to be `translation`.
3. If the profile contains any `assumption` marker, §7.0.3's boundary
   prohibition applies to the whole pipeline. Other markers and their
   obligations remain present.
4. A pipeline MUST declare its computed `TransformationProfile`. Omitting a
   marker or declaring a strict subset is a conformance failure, detectable by
   recomputing the canonical union from the content-addressed steps.

The “improvement” discussed in §7.0 is an input/output relation under one fixed
claim and action context: an enriched output may be more suitable than the
intermediate state from which that step began. It is **not** a relation between
a pipeline aggregate and its member aggregates; §7.2.1 deliberately computes a
conservative meet for that purpose. This RFC defines no second algebra that
turns attributed information into an automatic suitability upgrade. The
operative conformance requirement is attribution plus independently grounded
suitability under §7.2.2; provenance alone never grants the upgrade.

#### 7.0.3 Reconstruction is the dangerous one

Reconstruction fills a gap with an assumption. It is legitimate — a display
needs a value, a planner needs a default — and it is exactly what an unmarked
enrichment degrades into.

A reconstructed component MUST be marked in the output state, not only in the
loss profile, so that a consumer reading the state sees it without reading the
receipt. Reconstructed values MUST NOT cross an irreversible boundary. Where a
boundary requires a value that only exists by reconstruction, the correct
outcome is refusal, and §8.3's `blocked by warrant` is the outcome to record.

The reason for the asymmetry: every other kind can point at something outside
itself. Reconstruction points at the transformer's own judgment, and the whole
document is built on not letting a component certify itself (§7.2.2, §15.3.1).

```ts
type TranslationRequest<A, B> = {
  source: TypedState<A, unknown>;
  targetDomain: DomainRef<B>;
  targetOntology: OntologyRef;
  claimContext: ClaimContext;
  actionContext?: ActionContext;
  requiredInvariants: InvariantRef[];
};

type TranslationResult<B> = {
  output?: TypedState<B, unknown>;
  status: "accepted" | "partial" | "rejected" | "ambiguous";
  loss: LossProfile;
  suitability: SuitabilityProfile;
  evidence: EvidenceRef[];
  translator: TranslatorRef;
  reversible: ReversibilityReport;
};
```

### 7.1 Loss profile

```ts
type LossProfile = {
  steps: TranslationStepRef[];
  preserved: PreservationSet;
  distorted: InvariantDistortion[];
  lost: InformationLoss[];
  introducedAssumptions: AssumptionRecord[];
  unresolvedAmbiguities: AmbiguityRecord[];
  rejectedClaims: ClaimRef[];
  translationDebt: TranslationDebt;
};
```

The protocol MUST NOT represent translation quality with a single scalar.

#### 7.1.0 Canonical carrier and equality

The algebra below requires an equality relation. It is not enough to name array
members and leave their records, ordering, and duplicate handling to prose.
Every `TranslationStepRef` is the full content address of a receipt that pins
the transformation kind, translator, source and target domain, and input and
output state references. A withheld state MAY use the commitment/availability
layer of §14.1; it does not make the step anonymous.

The loss records have the following minimum canonical shapes:

```ts
type LossSubject =
  | { kind: "invariant"; ref: InvariantRef }
  | { kind: "claim"; ref: ClaimRef }
  | { kind: "descriptor"; ref: ContentAddress };

type InvariantAssessment = {
  invariant: InvariantRef;
  assessedAt: TranslationStepRef[];
  evidence: EvidenceRef[];
};

type PreservationSet =
  | { kind: "all" } // algebraic top; legal only for emptyLoss
  | { kind: "finite"; items: InvariantAssessment[] };

type InvariantDistortion = {
  invariant: InvariantRef;
  measure: ContentAddress;
  compositionRule: ContentAddress;
  value: ContentAddress;
  assessedAt: TranslationStepRef[];
  evidence: EvidenceRef[];
};

type InformationLoss = {
  subject: LossSubject;
  observedAt: TranslationStepRef[];
  evidence: EvidenceRef[];
};

type AssumptionIntroduction = {
  at: TranslationStepRef;
  by: KeyRef;
  evidence: EvidenceRef[];
};

type AssumptionRecord = {
  assumption: ClaimRef;
  introductions: AssumptionIntroduction[];
};

type AmbiguityRecord = {
  question: ContentAddress;
  alternatives: ClaimRef[];
  observedAt: TranslationStepRef[];
  evidence: EvidenceRef[];
};
```

All references in these records MUST be full digests where §5.1 makes them
load-bearing. Each record, including a nested `AssumptionIntroduction`, MUST
itself be encoded under the selected canonical encoding and identified by its
full digest. `LossProfile.steps` is the one ordered pipeline sequence and MUST
NOT be sorted. Every other array in these carriers represents a set — including
`assessedAt`, `observedAt`, `introductions`, `evidence`, `alternatives`,
`preserved.items`, and the other set-valued fields of `LossProfile` — and MUST
be sorted by the canonical bytes of the member's full digest. Duplicate digests
MUST be rejected rather than silently collapsed. Pipeline order is recovered by
locating an attribution ref in `LossProfile.steps`, not by maintaining a second
potentially contradictory order inside an atom.

Field composition operates on semantic keys, not host-language object identity:
`preserved` and `distorted` key on `(invariant, measure where present)`, `lost`
keys on `subject`, assumptions key on `assumption`, ambiguities key on
`(question, alternatives)`, and rejected claims key on their full digest. When
composition merges two records under one key, it MUST flatten their pipeline
sequence, union every set-valued attribution and evidence array, and re-encode
one canonical record; it MUST NOT retain a bracket-shaped tree. The `steps`
field of the profile is the ordered concatenation of step references.

Two `LossProfile` values are equal exactly when their canonical bytes are equal.
This makes associativity and identity executable properties rather than an
appeal to whatever equality a host language gives arrays. A profile whose
records are free text, lack canonical identifiers, or depend on insertion order
is non-conforming and cannot satisfy Tranche C2. `translationDebt` follows the
canonical carrier and equality rules of §7.3.1; an undefined debt value would
otherwise reopen the same hole inside the profile.

#### 7.1.1 Loss composes as a monoid, and not a commutative one

`LossProfile` is used above as a record of what one translation did. Real
pipelines are `A -> B -> C`, so the type is load-bearing under composition and
needs an algebra, or every implementation will invent its own and their debts
will not be comparable.

`LossProfile` MUST form a **monoid** under sequential composition:

```ts
declare function composeLoss(
  first: LossProfile,
  then: LossProfile,
): LossProfile;

declare const emptyLoss: LossProfile; // steps=[], preserved={kind:"all"},
// every other set/debt field empty
```

with the following required properties:

1. **Associativity.** `compose(compose(a, b), c) = compose(a, compose(b, c))`.
   The order in which a pipeline is bracketed MUST NOT change its recorded loss.
2. **Identity.** `compose(emptyLoss, a) = compose(a, emptyLoss) = a`.
3. **Non-commutativity.** `compose(a, b)` and `compose(b, a)` are **not**
   required to be equal and generally are not. Losing precision and then
   discretizing differs from discretizing and then losing precision. An
   implementation that treats loss composition as commutative is non-conforming.

Field-level composition rules:

- `steps` — ordered concatenation. This is the pipeline order and is the
  load-bearing non-commutative component; sorting it would falsify provenance.
- `preserved` — intersection, with `{ kind: "all" }` as the identity element. An
  invariant is preserved by the pipeline only if preserved at every step.
  Preservation MUST NOT be inferred from the endpoints. The `all` sentinel is
  legal only in `emptyLoss`; a non-empty observed translation MUST carry a
  finite, evidenced set rather than claim universal preservation.
- `distorted` — accumulation, with per-invariant distortion combined by the
  distortion measure's own declared composition rule. `compositionRule` MUST
  resolve to an `OperationAlgebraDescriptor` below whose associative law has
  sufficient evidence for the boundary using the result.
- `lost` — union. Information lost at any step is lost by the pipeline; a later
  step cannot restore it, and a later step that appears to restore it is
  fabricating, which is `introducedAssumptions`, not recovery.
- `introducedAssumptions`, `unresolvedAmbiguities`, `rejectedClaims` — union,
  each retaining the step that produced it. Provenance within a pipeline MUST
  survive composition.
- `translationDebt` — accumulation under §7.3.1.

The component operations cannot inherit laws merely because the composite names
them. Every content-addressed operation used by this section MUST resolve to a
descriptor of this minimum shape:

```ts
type OperationAlgebraDescriptor = {
  carrier: ContentAddress;
  equality: ContentAddress; // equality of canonical bytes for this carrier
  operation: ContentAddress;
  laws: AlgebraicLaws; // §6.2 LawClaim values, not booleans
  address: ContentAddress;
};

type PartialOrderDescriptor = {
  carrier: ContentAddress;
  relation: ContentAddress;
  reflexive: LawClaim;
  antisymmetric: LawClaim;
  transitive: LawClaim;
  address: ContentAddress;
};
```

The descriptor, its law claims, generators, domains, proofs, and counterexamples
are part of its canonical bytes. A rule used to establish an associative
composite MUST declare associativity; a rule used in a commutative or idempotent
composite MUST additionally declare those laws. The policy at the consuming
boundary sets the minimum acceptable `LawStatus` under §6.2. An absent, merely
asserted where the policy requires stronger evidence, or falsified required law
fails closed. Property tests MUST compare canonical bytes and cite their
content-addressed generator and generation domain.

Because `lost` is a union and `preserved` an intersection, those recorded loss
fields are **monotone under sequential composition for every transformation
kind**: adding a step cannot delete an earlier loss or manufacture an earlier
preservation. This is a cheap invariant for the field rules; it is not a test of
whether a step correctly declared its `TransformationKind`.

The kind distinction instead governs the input/output fitness claim. A closed
`translation` cannot justify improved suitability by newly acquired information.
The other four kinds may produce a more suitable output, while the loss fields
continue to accumulate, only when the new information is attributed and the
resulting action suitability is independently grounded. Section 7.0.2 states why
this improvement is not represented by the pipeline meet itself.

##### What a type system can and cannot carry here

In a language with traits, the shape is worth stating so that composition cannot
be open-coded differently at each call site:

```rust
pub trait Monoid {
    fn empty() -> Self;
    fn compose(self, then: Self) -> Self;
}

impl Monoid for LossProfile { /* §7.1.1 field rules */ }
impl Monoid for TranslationDebt { /* §7.3.1, additionally commutative */ }

// SuitabilityLevel is ordered; SuitabilityAggregate composes by meet (§7.2.1).
pub trait MeetSemilattice {
    fn meet(self, other: Self) -> Self;
}
```

**A trait forces an implementation to supply `compose`. It does not force that
`compose` to be associative.** Nothing in a Rust, Haskell, or Scala type system
checks the monoid laws;
`impl Monoid for LossProfile { fn compose(self, _: Self)
-> Self { self } }`
compiles and discards half the pipeline's loss.

This is the same gap §6.2 addresses for state domains, and it gets the same
answer: the laws are claims and MUST carry evidence. For these types the
evidence is property-based tests over generated profiles — associativity,
identity, the non-commutativity of loss, the commutativity of debt, and the
monotonicity above. Those tests MUST compare canonical bytes, exercise alternate
bracketings, and permute every set-valued input array. Treating the trait as the
guarantee would be §19.7's failure mode relocated from mathematical vocabulary
to type signatures, where it is harder to see.

The trait is still worth having. It concentrates composition in one place so
there is a single implementation for the property tests to target, rather than
one per call site.

### 7.2 Suitability is contextual

```ts
type SuitabilityProfile = {
  forSearch: SuitabilityAggregate;
  forHypothesisGeneration: SuitabilityAggregate;
  forPlanning: SuitabilityAggregate;
  forReversibleAction: SuitabilityAggregate;
  forIrreversibleAction: SuitabilityAggregate;
  byInvariant: Record<InvariantId, SuitabilityAggregate>;
};
```

A translation MAY be sufficient for search and insufficient for action.
Suitability MUST be evaluated relative to the claim and action context.

#### 7.2.1 Suitability is ordered, and composes by meet

The action-gating level MUST be a **bounded total order** — not a number and not
an unordered label. Completion B is normative:

```ts
type SuitabilityLevel =
  | "unsuitable"
  | "undetermined"
  | "bounded"
  | "suitable";

type SuitabilityAggregate = {
  level: SuitabilityLevel;
  reasons: ReasonRef[];
  missing: EvidenceRequirement[];
  within: ConstraintRef[];
  evidence: EvidenceRef[];
  withinAlgebra: ContentAddress;
};

type ConstraintMeetDescriptor = {
  carrier: ContentAddress; // canonical ConstraintRef[]
  equality: ContentAddress;
  meet: ContentAddress;
  top: ConstraintRef[];
  order: PartialOrderDescriptor;
  greatestLowerBound: LawClaim;
  laws: AlgebraicLaws; // associative, commutative, idempotent, top identity
  address: ContentAddress;
};
```

The level order is:

```text
unsuitable < undetermined < bounded < suitable
```

`unsuitable` is below `undetermined` because it is an evidenced refusal, while
`undetermined` names evidence that is still missing. Composing a measured
refusal with an unmeasured step MUST report `unsuitable`; it MUST NOT advertise
the pipeline as a resolvable evidence gap. `undetermined` remains below
`bounded` because an unmeasured translation is not better than a measured and
constrained one.

The aggregate separates the gate from its provenance. `reasons`, `missing`,
`within`, and `evidence` are canonical sets sorted by member full digest, with
duplicate digests rejected. They remain present even when another level
dominates: an `unsuitable` aggregate may still carry the missing requirements of
a different step, and an `undetermined` aggregate retains evidence already
collected. Equality is equality of canonical bytes.

Composition along a pipeline is the **meet** (greatest lower bound):

```text
suitability(A -> B -> C) = suitability(A -> B)  ∧  suitability(B -> C)
```

For two aggregates with the same `withinAlgebra`, the meet is defined exactly:

1. `level` — the minimum under the chain above;
2. `reasons`, `missing`, and `evidence` — canonical set union;
3. `within` — the operation pinned by the referenced `ConstraintMeetDescriptor`.

The descriptor MUST use the same canonical carrier and equality as the
aggregate, and MUST carry law evidence for associativity, commutativity,
idempotence, identity at `top`, and the greatest-lower-bound property under its
declared refinement order. The boundary policy determines the minimum accepted
`LawStatus` under §6.2. Aggregates naming different `withinAlgebra` addresses
MUST NOT be composed; the translator junction is incompatible and fails rather
than choosing one rule.

Under the product order, levels use the chain above; the three provenance sets
use reverse inclusion, so union is their greatest lower bound; and `within` uses
the descriptor's refinement order. Therefore the aggregate operation is a meet
when — and only when — the descriptor's cited laws satisfy the consuming policy.
A pipeline is no more suitable than its weakest step, while reasons, missing
requirements, constraints, and evidence are never discarded. This MUST NOT be
implemented as an average, a product of confidences, a left- or right-biased
payload choice, or any rule that lets two mediocre translations compose into a
good one.

Minimum well-formedness rules:

- an observed `unsuitable` value MUST have at least one `ReasonRef`;
- an observed `undetermined` value MUST have at least one `EvidenceRequirement`
  naming what would determine it;
- an observed `bounded` value MUST be strictly below the descriptor's `top` in
  its declared refinement order;
- an observed `suitable` value MUST cite the evidence grounding that judgment;
- an aggregate produced by composition MAY carry payloads associated with other
  levels, because discarding them would falsify pipeline provenance.

#### 7.2.2 Suitability MUST NOT be self-reported

`TranslationResult` places `suitability` beside `loss`, which reads as though
the translator reports both. For loss that is correct — the translator knows
what it discarded. For suitability it is not, and the difference matters.

Suitability is a judgment about whether a translation is **good enough to act
on**. Letting the translator issue that judgment about its own output is
self-certification, and this document forbids exactly that pattern elsewhere:
§15.3.1 requires the runtime rather than the caller to evaluate path
eligibility, and §19.4 names confidence laundering as a failure mode. The same
rule was omitted here.

Therefore:

1. A translator MAY report `loss`, and MAY report suitability **for search and
   hypothesis generation only**.
2. `forPlanning`, `forReversibleAction`, `forIrreversibleAction`, and any
   `byInvariant` entry gating an action MUST be attested by one of:
   - **fixture measurement** — the translation is run against anchor fixtures
     (§7.4.2) and suitability is derived from measured divergence by a declared,
     content-addressed rule; or
   - **third-party attestation** — an agent that is neither the translator's
     author nor the action's beneficiary, with its own receipt.
3. A self-reported action suitability MUST be recorded as
   `{ level: "undetermined", missing: [independentMeasurementRequirement],
   reasons: [], within: top, evidence: [], withinAlgebra }`
   by any consumer, regardless of what the translator claimed. It is not
   evidence and MUST NOT be upgraded by repetition.
4. Crossing an irreversible boundary on an `undetermined` suitability MUST fail
   closed.

**Bootstrap consequence.** Before a deployment has action-context fixtures or a
genuinely third-party attester, `undetermined` is the expected result for every
action-gating suitability, including `forIrreversibleAction`. This is not a
degraded mode to bypass: irreversible actions remain blocked. The bootstrap path
is to build and content-address fixtures with a declared scoring rule, not to
rename a self-attestation or route it through a second component controlled by
the same beneficiary.

This is deliberately expensive. Its alternative is a translator that grades its
own homework at precisely the boundary where being wrong is unrecoverable.

### 7.3 Translation debt

Translation debt records the cost of continuing to use a known lossy mapping. It
MAY accumulate when:

- downstream decisions depend on introduced assumptions;
- repeated round trips increase distortion;
- target states are treated as authoritative beyond their suitability;
- unresolved ambiguity is deferred;
- mappings diverge across agents or versions.

Translation debt MUST be ledger-visible and MAY trigger retranslation,
negotiation, or refusal to cross an irreversible boundary.

#### 7.3.1 Debt algebra

Debt that cannot be added, compared, or discharged is a word, not a mechanism.
§10.1's admission inequality has an `expected translation debt` term with
nothing behind it until this is fixed.

The carrier is canonical rather than implementation-defined:

```ts
type DebtTerm = {
  dimension: ContentAddress;
  quantity: ContentAddress;
  scope: DebtScope;
  incurredAt: TranslationStepRef[];
  grounds: EvidenceRef[];
};

type ScopeRef = {
  kind: "state-lineage" | "domain" | "ontology" | "component" | "invariant";
  ref: ContentAddress;
};

type DebtScope =
  | { kind: "global" }
  | { kind: "bounded"; refs: ScopeRef[] };

type TranslationDebt = {
  terms: DebtTerm[];
};

type DebtDischarge = {
  prior: ContentAddress;
  resulting: ContentAddress;
  operation: "retranslation" | "claim-withdrawal" | "warranted-write-off";
  authority: KeyRef;
  evidence: EvidenceRef[];
  receipt: ReceiptRef;
};

type DebtDimensionDescriptor = {
  quantityCarrier: ContentAddress;
  unit: ContentAddress;
  zero: ContentAddress;
  addition: OperationAlgebraDescriptor;
  order: PartialOrderDescriptor;
  accumulationMonotone: LawClaim; // a <= add(a, b)
  address: ContentAddress;
};
```

Each `dimension` MUST resolve to a `DebtDimensionDescriptor` that pins the exact
quantity encoding, unit, zero, addition rule, partial-order rule, and the law
evidence those rules need. `addition.laws` MUST declare associativity,
commutativity, and identity at the descriptor's exact `zero` value;
`accumulationMonotone` MUST establish `a <= add(a, b)` under `order`. The order
descriptor MUST carry reflexivity, antisymmetry, and transitivity claims. These
claims are governed by §6.2: missing or insufficient evidence fails wherever a
consumer relies on the corresponding composite law.

A bounded scope MUST contain at least one typed full-digest reference and MUST
NOT mix a bare display name or truncated handle into `refs`; a debt whose effect
cannot be bounded uses `global` rather than omitting scope. Terms key on
`(dimension, scope)`; addition applies the pinned rule only within that key,
unions `incurredAt` and `grounds`, and emits one canonical term per key. `refs`,
`terms`, `incurredAt`, `grounds`, and discharge evidence are canonical sets
sorted by member full digest with duplicates rejected. Debt and discharge
records use the selected canonical encoding and full content addresses. Two debt
values are equal exactly when their canonical bytes are equal. A prose quantity,
host-native number, unpinned addition/order rule, missing required law claim,
empty bounded scope, or missing scope is non-conforming.

Scope is an accountability boundary, not a deletion mechanism. Splitting one
global debt into invented narrow scopes to regain the fast path is
debt-laundering and MUST retain a receipted derivation showing why each bounded
scope is complete. Section 15.0 defines how a runtime compares these scopes with
an operation; unknown, malformed, or legacy unscoped debt fails closed there.

`TranslationDebt` MUST form a **commutative monoid** under accumulation:

```ts
declare function addDebt(
  a: TranslationDebt,
  b: TranslationDebt,
): TranslationDebt;
declare const noDebt: TranslationDebt; // { terms: [] }, the identity
```

- associative and commutative — debt from two independent lossy mappings does
  not depend on the order they were incurred;
- `noDebt` is the identity;
- accumulation is **monotone**: `addDebt(a, b) >= a` in the debt order. Debt is
  never reduced by incurring more of it.

Debt MUST additionally declare:

1. **A partial order**, so budgets and thresholds can be stated. It need not be
   total; incomparable debts are permitted and MUST be reported as incomparable
   rather than forced into a ranking.
2. **A discharge operation**, and the only admissible discharges are:
   retranslation under a mapping with strictly better measured loss; withdrawal
   of the downstream claims that depended on the assumption; or an explicit,
   warranted, receipted write-off. Debt MUST NOT be discharged by the passage of
   time alone. Every discharge MUST produce the `DebtDischarge` transition above
   and MUST NOT rewrite or delete the prior debt value.
3. **A decay function, if any, that is declared and content-addressed.** Silent
   decay is how a system forgets what it owes. If an implementation declares no
   decay, debt is permanent until discharged, which is the safe default.

This RFC deliberately does **not** claim `TranslationDebt` is a semiring. A
semiring would require a multiplication with a distributive law over
accumulation, and no operation in this protocol needs one. Declaring the richer
structure would be unearned vocabulary of exactly the kind §19.7 forbids.

### 7.4 Translator composition

Sections 7.1.1, 7.2.1, and 7.3.1 give the algebras. This section states when
composition is permitted at all.

```ts
type ComposedTranslator = {
  steps: TranslatorRef[]; // ordered
  transformation: TransformationProfile; // canonical union over steps
  loss: LossProfile; // composeLoss over steps
  suitability: SuitabilityProfile; // aggregate meet over steps
  debt: TranslationDebt; // addDebt over steps
  anchors: RoundTripReport[];
  composed: TranslatorRef; // content address of this composition
};
```

#### 7.4.1 Composition rules

1. A composed translator is itself a translator and MUST have its own content
   address. Pipelines are first-class objects, not ad-hoc call sequences,
   because a receipt naming three translators does not say in which order they
   ran.
2. Composition is permitted only where the intermediate domain and ontology of
   each junction match exactly. A junction requiring its own translation is
   another step, not an implicit coercion.
3. The composed profile MUST be computed by the declared algebras, never
   re-estimated end-to-end. Measuring `A -> C` directly and reporting it as the
   pipeline's loss conceals what happened at `B`, which is where the
   irrecoverable structure was dropped.
4. A composition whose measured end-to-end behavior disagrees with its computed
   profile MUST be rejected, and the disagreement MUST be recorded. This is a
   detector for a step lying about its own loss.
5. `transformation` MUST equal the canonical union of every step's dependency
   profile under §7.0.2. An omitted marker is a conformance failure even when
   the loss, suitability, and debt values otherwise compose.
6. Suitability aggregates at a junction MUST name the same `withinAlgebra`.
   Different descriptor addresses make the composition undefined; no caller or
   translator may choose one by preference.

#### 7.4.2 Round-trip anchors

Loss is only measurable against something. The anchor is the canonical bytes of
the source state.

```ts
type RoundTripReport = {
  fixture: FixtureRef;
  forward: TranslatorRef;
  back: TranslatorRef;
  divergence: DivergenceMeasure; // in the SOURCE domain, against canonical bytes
  invariantsSurvived: InvariantRef[];
  invariantsLost: InvariantRef[];
};
```

Rules:

1. Divergence MUST be measured in the **source** domain against the source's
   canonical encoding (§5.1.1), not in the target domain and not by comparing
   summaries. A round trip that returns a state which merely looks similar has
   not been measured.
2. A round trip that is not expected to be exact MUST declare its expected
   divergence bound in advance. An unbounded expectation is not a test.
3. Round-trip exactness MUST NOT be assumed from `status: "accepted"`.
   Acceptance is a claim about the forward direction only.
4. Where no inverse translator exists, this MUST be stated as `reversible: none`
   rather than left unmeasured, and any suitability derived from round-trip
   measurement is then `undetermined` (§7.2.1).

---

### 7.5 Evidence bridges

Translation moves a value from one representation to another. It does **not**
turn an observation into a decision, and the two are routinely confused because
both look like "getting from A to B".

`liquid` reporting that a resource is exhausted, and `myc` concluding that this
constitutes grounds to withdraw a proposal, is not a correspondence between two
ontologies. The first is an observation about a resource state; the second is a
normative conclusion inside a policy. Nothing about the first _means_ the second
— it follows only through a rule someone with authority adopted, and that rule
could be adopted differently without either ontology changing.

Carrying that as a translation is the most consequential confusion available in
this protocol. A policy carried as a mapping inherits properties it does not
have: it looks bidirectional, it looks like it has a loss profile, it looks like
fixture agreement validates it. Worse, it **launders authorship** — a mapping is
a technical artifact, a policy is someone's decision, and the ability to ask who
decided is what the rest of this document exists to protect.

The structure is three-part, not two:

```text
evidence  →  policy rule  →  warranted decision
```

```ts
type EvidenceBridge = {
  sourceClaim: ClaimRef; // what the evidence asserts, in the source ontology
  targetDecisionPredicate: PredicateRef; // what the decision turns on, in the target
  policy: PolicyRef; // the rule connecting them — content-addressed
  sufficiencyRule: EvidenceRule; // how much evidence is enough
  authority: AuthorityRef; // who adopted this rule, and under what mandate
  address: ContentAddress;
};
```

Rules:

1. A bridge MUST NOT be represented as a translation, MUST NOT carry a
   `LossProfile`, and MUST NOT be credited by fixture agreement. Fixtures can
   establish that both parties compute the same _evidence_; they cannot
   establish that a normative rule is correct.
2. The `policy` MUST be content-addressed and attributed to an `authority`.
   Changing the policy changes the bridge's address, so a decision made under an
   older rule remains evaluable under the rule that actually applied.
3. A bridge is **directional and non-invertible.** There is no round trip from a
   decision back to the evidence that warranted it, and §7.4.2's round-trip
   anchors therefore do not apply to bridges.
4. Where a mapping and a bridge are both needed — the evidence must first be
   translated into terms the policy reads — they MUST be separate objects with
   separate receipts. The translation carries loss; the bridge carries
   authority.
5. Disagreement about a bridge is a **governance dispute**, not a translation
   defect, and MUST be routed as one. A counter-warrant is the response; a
   better mapping is not.
6. A bridge is not a transformation kind under §7.0 and MUST NOT be declared as
   one. The kinds classify how a _value_ was produced; a bridge classifies how a
   _decision_ was authorized, and joining them would put an authority into the
   loss algebra.

§16.7 (Part 00) exercises this: the federated demo must produce a bridge
separately from its mapping, so that a reader of the receipts can ask who
decided that exhaustion justifies withdrawal and get a name rather than a
mapping.
