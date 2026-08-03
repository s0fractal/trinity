# RFC-0006: Translation, Loss, Suitability and Debt

- **Status:** Draft
- **Authors:** s0fractal + model collaborators
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0006-translation-loss-and-suitability.md`
- **Parent:**
  [RFC-0003 — Heterogeneous State Protocol: Architecture and
  Ratification Map](0003-heterogeneous-state-geometries.md), which holds the
  theses, non-goals, terminology, dependency graph, failure-mode catalogue, and
  open problems this document depends on.
- **Ratifies:** Tranche C (C1–C6)
- **Depends on:** RFC-0004, RFC-0005
- **Created:** 2026-08-03 (split from RFC-0003 after four rounds of external
  critique; see [REVISION HISTORY](0003-REVISION-HISTORY.md))

> **Section numbers are inherited and stable.** This document keeps the section
> numbers it carried inside RFC-0003. They are not renumbered from 1, because
> ledger chords and prior receipts cite them, and a cross-reference that
> silently changes meaning is the failure this protocol exists to prevent. A
> reference of the form §N.M is resolvable through RFC-0003's §22 map.

---

## 7. Translation protocol

Translation is the central primitive of this RFC.

### 7.0 Five kinds of transformation, only one of which is translation

The loss algebra of §7.1.1 requires that a longer pipeline never report less
loss than its worst step. That is true of a **closed** transformation — one that
carries only the information already present in its input — and false of
anything that acquires new information.

A transformer may consult evidence, query the target ontology, run inference,
resolve an ambiguity by asking the environment, or negotiate the meaning with a
counterparty. Any of those can leave the output _more_ fit for an action than
the intermediate state was. Not because lost bits came back, but because a new
source of information entered.

A monotonicity rule and a negotiation protocol cannot both bind the same object:
under one a step that improves suitability is a conformance bug, under the other
it is the mechanism. Left unseparated, an implementation either violates the
monoid or buries the enrichment inside `introducedAssumptions`, where it is
indistinguishable from a fabrication
([REVISION HISTORY](0003-REVISION-HISTORY.md) §1).

The five kinds are therefore distinguished, and each carries different
obligations:

| Kind             | New information from | Monotone loss | May cross irreversible boundary                    |
| ---------------- | -------------------- | ------------- | -------------------------------------------------- |
| `translation`    | nothing              | **required**  | yes, per suitability                               |
| `enrichment`     | cited evidence       | not required  | yes, if sources are attested                       |
| `inference`      | declared rules       | not required  | only if rules are content-addressed and replayable |
| `reconstruction` | assumption           | not required  | **no** — §7.0.3                                    |
| `negotiation`    | a counterparty       | not required  | only under a scoped contract (§13.2)               |

```ts
type TransformKind =
  | { kind: "translation" }
  | {
    kind: "enrichment";
    sources: EvidenceRef[];
    attestation: AttestationRef[];
  }
  | { kind: "inference"; rules: ContentAddress; replayable: boolean }
  | { kind: "reconstruction"; assumptions: AssumptionRecord[] }
  | { kind: "negotiation"; counterparty: AgentId; contract: ContractRef };
```

#### 7.0.1 Rules

1. Every transformation MUST declare its kind. An undeclared kind is treated as
   `reconstruction` — the most restricted — because a transformer that will not
   say where its information came from has not established that it came from
   anywhere.
2. **Monotone loss binds `translation` only.** For the other kinds, the loss
   profile still composes by §7.1.1's field rules, but the monotonicity check is
   not a conformance failure; what MUST hold instead is that the new information
   is attributed: each improvement traces to a cited source, rule, assumption,
   or counterparty exchange.
3. A pipeline mixing kinds is classified by the **join** of its members under
   the order in §7.0.2 — not by "the order above", which is a table's row order
   and defines nothing. One reconstruction step makes the pipeline a
   reconstruction, however many faithful translations surround it.
4. `enrichment` sources MUST be content-addressed and independently resolvable.
   "The model knew this" is not a source.
5. `inference` MUST record the rules by content address. An inference whose
   rules are a model's weights is not replayable and MUST be declared
   `replayable: false`, which bars it from irreversible boundaries under rule 6.

#### 7.0.2 The order on transformation kinds

Rule 3 needs an actual order, and the table in §7.0 does not supply one — its
rows are in reading order, which would put `negotiation` after `reconstruction`
and so imply that negotiating is worse than assuming. It is not.

The kinds form a **partial order by what a consumer must trust**, and a pipeline
takes the **join** (least upper bound) of its steps:

```text
              reconstruction
              (trust the transformer's own judgment)
                   │
      ┌────────────┼────────────┐
      │            │            │
 inference    negotiation   enrichment
(trust the   (trust a      (trust a cited
 rules)       counterparty) source)
      └────────────┼────────────┘
                   │
              translation
              (trust nothing beyond the input)
```

- `translation` is the bottom: it introduces no external dependency.
- `enrichment`, `inference`, and `negotiation` are **mutually incomparable**.
  Each adds exactly one kind of external dependency, and they are not
  substitutable — a cited source is not a counterparty, and neither is a rule. A
  pipeline containing two of them is at least as demanding as either, and its
  join is recorded as the set rather than collapsed into a ranking.
- `reconstruction` is the top, and it is the top for a stated reason: every
  other kind can point at something outside the transformer. Reconstruction
  points at the transformer's own judgment, which is the pattern this protocol
  forbids everywhere it can (§7.2.2, §15.3.1).

Consequences for a mixed pipeline:

1. The join determines which obligations apply. A pipeline joining `enrichment`
   and `inference` MUST satisfy both rule 4 and rule 5 — the requirements
   accumulate; they do not merge into a weaker single rule.
2. Monotone loss is required only if the join is exactly `translation`.
3. If the join is `reconstruction`, §7.0.3's boundary prohibition applies to the
   whole pipeline.
4. A pipeline's declared kind MUST be its computed join. Declaring a lower kind
   than the join is a conformance failure, and it is detectable, because the
   steps are content-addressed and each declares its own kind.

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
  preserved: InvariantAssessment[];
  distorted: InvariantDistortion[];
  lost: InformationLoss[];
  introducedAssumptions: AssumptionRecord[];
  unresolvedAmbiguities: AmbiguityRecord[];
  rejectedClaims: ClaimRef[];
  translationDebt: TranslationDebt;
};
```

The protocol MUST NOT represent translation quality with a single scalar.

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

declare const emptyLoss: LossProfile; // identity: the loss of an identity translation
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

- `preserved` — intersection. An invariant is preserved by the pipeline only if
  preserved at every step. Preservation MUST NOT be inferred from the endpoints.
- `distorted` — accumulation, with per-invariant distortion combined by the
  distortion measure's own declared composition rule, which the invariant
  definition MUST supply.
- `lost` — union. Information lost at any step is lost by the pipeline; a later
  step cannot restore it, and a later step that appears to restore it is
  fabricating, which is `introducedAssumptions`, not recovery.
- `introducedAssumptions`, `unresolvedAmbiguities`, `rejectedClaims` — union,
  each retaining the step that produced it. Provenance within a pipeline MUST
  survive composition.
- `translationDebt` — accumulation under §7.3.1.

Because `lost` is a union and `preserved` an intersection, composed loss is
**monotone** for `translation` steps: a longer pipeline of closed
transformations can never report less loss than its worst step. Any
implementation where adding a _translation_ step improves the loss profile has a
bug, and this is a cheap invariant to test.

The qualifier is load-bearing. Monotonicity is a property of transformations
that acquire no new information, and §7.0 separates out the four kinds that do.
For those, the field rules above still apply — `lost` still unions, `preserved`
still intersects — but a suitability improvement is expected rather than
anomalous, and what MUST be checkable is the attribution of the new information,
not its absence.

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

// Suitability is an order, not a monoid: composition is the meet (§7.2.1).
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
monotonicity above. Treating the trait as the guarantee would be §19.7's failure
mode relocated from mathematical vocabulary to type signatures, where it is
harder to see.

The trait is still worth having. It concentrates composition in one place so
there is a single implementation for the property tests to target, rather than
one per call site.

### 7.2 Suitability is contextual

```ts
type SuitabilityProfile = {
  forSearch: Suitability;
  forHypothesisGeneration: Suitability;
  forPlanning: Suitability;
  forReversibleAction: Suitability;
  forIrreversibleAction: Suitability;
  byInvariant: Record<InvariantId, Suitability>;
};
```

A translation MAY be sufficient for search and insufficient for action.
Suitability MUST be evaluated relative to the claim and action context.

#### 7.2.1 Suitability is ordered, and composes by meet

`Suitability` MUST be a **bounded partial order** — not a number, and not an
unordered label. Two suitabilities MUST be comparable or explicitly
incomparable; "we cannot tell" is a value in the order, not a missing answer.

```ts
type Suitability =
  | { kind: "unsuitable"; reason: ReasonRef }
  | { kind: "bounded"; within: ConstraintRef[]; evidence: EvidenceRef[] }
  | { kind: "suitable"; evidence: EvidenceRef[] }
  | { kind: "undetermined"; missing: EvidenceRequirement[] };
```

with `unsuitable < bounded < suitable`, and `undetermined` **below** `bounded`:
an unmeasured translation is not better than a measured and constrained one.

Composition along a pipeline is the **meet** (greatest lower bound):

```text
suitability(A -> B -> C) = suitability(A -> B)  ∧  suitability(B -> C)
```

A pipeline is no more suitable than its weakest step, per action context, per
invariant. This MUST NOT be implemented as an average, a product of confidences,
or any rule that lets two mediocre translations compose into a good one.

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
   `{ kind: "undetermined" }` by any consumer, regardless of what the translator
   claimed. It is not evidence and MUST NOT be upgraded by repetition.
4. Crossing an irreversible boundary on an `undetermined` suitability MUST fail
   closed.

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

`TranslationDebt` MUST form a **commutative monoid** under accumulation:

```ts
declare function addDebt(
  a: TranslationDebt,
  b: TranslationDebt,
): TranslationDebt;
declare const noDebt: TranslationDebt; // identity
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
   time alone.
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
  loss: LossProfile; // composeLoss over steps
  suitability: SuitabilityProfile; // meet over steps
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

§16.7 (RFC-0003) exercises this: the federated demo must produce a bridge
separately from its mapping, so that a reader of the receipts can ask who
decided that exhaustion justifies withdrawal and get a name rather than a
mapping.
