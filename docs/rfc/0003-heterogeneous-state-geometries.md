# RFC-0003: Heterogeneous State Geometries

- **Status:** Draft
- **Authors:** s0fractal + model collaborators
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0003-heterogeneous-state-geometries.md`. Every path this document
  cites without a repository is relative to that repository; everything outside
  it is listed with its repository in §17.1.
- **Target:** Trinity federation (`trinity`, `myc`, `omega`, `liquid`)
- **Scope:** Semantic Schema V2 extension
- **Created:** 2026-08-03
- **Revised:** 2026-08-03 (external critique rounds 1–3 — see
  `src/x2300_960790_claude_qwen-critique-rfc-0003-heterogeneous-state-geometries.myc.md`
  and
  `src/x2300_960792_claude_kimi-critique-rfc-0003-encoding-floor-and-self-certification.myc.md`,
  `src/x2300_960796_claude_qwen-round3-simplex-encoding-and-derived-lineage.myc.md`)
- **Supersedes:** nothing
- **Extends:** the federation's existing state, warrant, evidence, receipt, and
  lineage primitives

## 0. Abstract

This RFC specifies a federation-wide protocol for representing, translating,
comparing, and evolving heterogeneous state spaces without silently reducing all
states to one universal vector geometry.

The protocol introduces:

- geometry-typed states over content-addressed references and one canonical
  encoding;
- explicit translation contracts with structural loss tracking, composed by
  declared algebras;
- first-class conflicts and representational bottlenecks;
- mutation budgets for ontology and geometry changes;
- an admission protocol for experimental geometries;
- identity policies for governed self-change;
- federated ontology negotiation between agents and substrates;
- consensus only at consequential or irreversible action boundaries.

The proposal does **not** claim that cognition has one correct topology, that a
new geometry guarantees novelty, or that an LLM can reliably invent valid
ontologies. Its narrower claim is operational:

> Every state representation makes geometric assumptions. Those assumptions,
> translation losses, and representation changes must be explicit, typed,
> warranted, testable, reversible where possible, and preserved in the ledger.

This RFC is intended as a semantic extension of the existing federation, not as
an independent repository or replacement architecture.

---

## 1. Motivation

Most agent systems flatten heterogeneous phenomena into a small set of generic
containers:

- text;
- JSON objects;
- embedding vectors;
- scalar confidence scores;
- weighted objectives;
- directed graph edges.

This flattening is convenient but often semantically destructive. A probability
distribution, temporal ordering, causal dependency, social commitment,
hierarchical concept, identity invariant, and irreversible action do not obey
the same laws of distance, interpolation, composition, or update.

When all states are forced into one representation, failures are hidden:

- semantic proximity is mistaken for causal relation;
- uncertainty becomes a scalar detached from the claim and action context;
- conflicting intents are averaged instead of diagnosed;
- lossy translations appear exact;
- ontology changes occur without migration cost or provenance;
- agents appear to agree because disagreement was erased by representation.

The federation already contains complementary substrates:

- **trinity** coordinates authority, receipts, proof-bearing action, and
  reconciliation;
- **myc** handles proposal lifecycle, witnesses, finality, and publication;
- **omega** provides deterministic state transition and physics;
- **liquid** hosts semantic, metabolic, and autopoietic structures.

These substrates should not be forced into a shared internal ontology. They need
a protocol for preserving local authority while making cross-substrate
translation, loss, conflict, and action boundaries explicit.

---

## 2. Design thesis

The protocol is built on six theses.

### 2.1 There is no required universal geometry

The system MUST NOT assume that every state can be faithfully represented in a
single Euclidean latent space, knowledge graph, reward function, or universal
schema.

### 2.2 Geometry is part of the state type

A state is not only a value. It includes the laws under which the value can be
validated, compared, transformed, and transported.

### 2.3 Translation is never silently lossless

Every cross-geometry or cross-ontology translation MUST report preserved
invariants, lost structure, introduced assumptions, unresolved ambiguity, and
action-context suitability.

### 2.4 Persistent conflict is evidence

Repeated inability to satisfy constraints MAY indicate a missing variable,
invalid abstraction, incompatible timescale, translation loss, or genuinely
irreducible disagreement.

### 2.5 Representation changes consume resources

Ontology and geometry mutations incur compute, migration, verification,
coordination, maintenance, and trust costs. They MUST be budgeted.

### 2.6 Shared action does not require shared ontology

Agents MAY retain incompatible models while agreeing on the warrants required to
cross a consequential or irreversible boundary.

---

## 3. Non-goals

This RFC is not:

- a universal embedding format;
- a claim about the true mathematical topology of human thought;
- a consciousness model;
- a replacement for existing state, intent, warrant, evidence, receipt, or
  lineage primitives;
- an Active Inference implementation;
- an automatic novelty or truth engine;
- permission for an LLM to mutate schemas without deterministic checks;
- a catalogue of fashionable manifolds;
- a requirement that all substrates implement all geometry families;
- a guarantee that every conflict has a representational resolution.

A conforming implementation MAY support only a small geometry registry. The
essential requirements are explicit typing, explicit translation, explicit loss,
bounded mutation, and ledgered acceptance.

---

## 4. Terminology

### 4.1 State

A value interpreted under a geometry and ontology, with provenance, uncertainty,
invariants, and lineage.

### 4.2 Geometry

A contract defining valid points and relevant operations for a state family. The
term is used broadly and MAY include discrete, symbolic, graph, order,
constraint, probabilistic, and manifold-like structures.

### 4.3 Ontology

The named concepts, relations, constraints, and interpretation rules under which
states have meaning.

### 4.4 Translation

A declared mapping from a source state space and ontology into a target state
space and ontology.

### 4.5 Loss profile

A structured account of what a translation preserves, distorts, removes, or
introduces.

### 4.6 Conflict

A first-class record that two or more claims, states, intents, warrants,
translations, or action requirements cannot currently be jointly satisfied.

### 4.7 Representational bottleneck

Evidence that the current state model cannot express a relevant distinction or
jointly preserve required invariants.

### 4.8 Mutation

A change to a geometry, ontology, translation, invariant set, or identity
policy.

### 4.9 Admission

The governed lifecycle by which an experimental representation becomes locally
or federatively accepted.

### 4.10 Irreversible boundary

A point after which an action cannot be reliably reverted within declared cost,
time, authority, or evidence limits.

---

## 5. Core data model

The examples use TypeScript-like notation. They define semantic requirements,
not a mandatory implementation language.

```ts
type StateId = string;
type GeometryId = string;
type OntologyId = string;
type InvariantId = string;
type EvidenceRef = string;
type AgentId = string;
type SubstrateId = "trinity" | "myc" | "omega" | "liquid" | string;

type TypedState<G, V> = {
  id: StateId;
  geometry: GeometryRef<G>;
  ontology: OntologyRef;
  value: V;
  uncertainty: UncertaintyProfile;
  invariants: InvariantRef[];
  provenance: EvidenceRef[];
  lineage: TransformationRef[];
  owner: AgentId | SubstrateId;
  status: "observed" | "inferred" | "assumed" | "hypothetical";
};
```

A conforming state MUST identify its geometry and ontology. It MUST NOT rely on
out-of-band convention to determine whether a numeric array is an embedding,
probability vector, coordinate, ordered tuple, or arbitrary payload.

### 5.1 Reference identity is content-addressed

Every `Ref` in this document (`GeometryRef`, `OntologyRef`, `InvariantRef`,
`EvidenceRef`, `TransformationRef`, `TranslatorRef`) is a **reference to an
immutable object**, not a mutable name. The protocol's audit guarantees depend
on it: a receipt that records "translated under translator T" is worthless if
`T` can be edited afterwards.

References MUST therefore be content-addressed:

1. Every referenced object MUST have a canonical byte encoding. For geometry
   points this is the `serialize` method of §6; for descriptors, ontologies,
   translators, and invariant definitions it is the object's canonical
   serialization.
2. The reference MUST be derived from a cryptographic digest of those canonical
   bytes.
3. The federation's existing identity primitive is
   `contracts/CANONICAL_HASH.v0.1.md` (`h.` || first 12 hex of SHA-256). New
   references SHOULD reuse it so that this RFC does not fork the substrate's
   naming.
4. **The 12-hex form is a handle, not a security binding.** Forty-eight bits is
   adequate for human-readable addressing and accidental-collision avoidance,
   and inadequate against an adversary who can grind for a collision. Any
   reference that gates an irreversible boundary, an admission decision, an
   identity amendment, or a trust computation MUST carry the full digest
   alongside the short handle.
5. Structural sharing is a requirement, not an optimization: two states under
   the same geometry and ontology MUST resolve to the same reference bytes, so
   the shared descriptor is stored once and the per-state cost is the reference,
   not the descriptor. A descriptor that is itself large — an ontology, a
   complex invariant set — MAY be composed of content-addressed parts, so that a
   consumer needing one invariant resolves that part rather than the whole
   object. Sharing then operates within descriptors as well as between states.
6. External content-addressing systems (IPLD/CID, and similar) MAY be used as a
   transport or storage projection. Doing so MUST NOT redefine the canonical
   digest — the CID is then a second encoding of the same identity, and receipts
   MUST record which encoding they used.
7. **The store is out of scope.** Files, git objects, an object store, or an
   IPLD graph are all conforming backends, and this RFC names none of them. The
   properties it depends on — immutability, resolution by digest, structural
   sharing — follow from content addressing itself, not from any one store.
   Mandating a store would re-open the identity decision §5.1 settled, for a
   benefit already obtained.

Lineage and provenance follow from this. Because `lineage` is a list of
content-addressed transformation references, and each transformation references
its input states, the derivation history of any state is a verifiable DAG rather
than a narrative recorded by whoever wrote the receipt.

#### 5.1.1 Canonical encoding is normative, not an implementation detail

Everything in §5.1 rests on an unstated assumption: that `trinity` and `omega`,
handed the same object, compute the same digest. Nothing so far requires it. Two
substrates that serialize the same probability vector differently produce
different references for the same state, so their receipts never reconcile — and
they fail silently, at exactly the federation boundary the content addressing
existed to protect.

A conforming federation MUST therefore fix **one** canonical encoding. Multiple
encodings MAY exist for transport or display; exactly one is admissible as
digest input.

The encoding MUST satisfy:

1. **Determinism.** One object has exactly one canonical byte sequence. The
   encoder is a function, not a policy.
2. **Injectivity.** Two objects that differ observably MUST NOT encode to the
   same bytes. Encodings that permit indistinguishable framing of distinct
   values are inadmissible.
3. **No optional forms.** No alternative integer widths, no optional length
   prefixes, no permitted-but-discouraged variants. Where a format offers a
   choice, the profile MUST remove it.
4. **Total ordering of map keys**, with duplicate keys rejected rather than
   last-wins.
5. **No Unicode normalization (MUST NOT).** Strings are hashed as their exact
   sequence of code points. A verifier MUST NOT apply NFC, NFD, or any other
   normalization, and MUST NOT reject a string for not being normalized.
   Producers SHOULD emit NFC so that content mangled by an external editor,
   database, or filesystem still resolves — but that is producer discipline, not
   a verifier rule.
6. **A self-describing encoding identifier**, included in the digest input. A
   digest binds an object _under an encoding_; changing the encoding MUST change
   the reference rather than silently rehoming it.

Rule 5 was inverted in an earlier draft, which required a normalization form so
that "visually identical strings cannot produce distinct digests". That is wrong
twice over. Two strings differing only in normalization form _are_ different
content, and a content-addressed system is supposed to say so. And requiring
normalization forces a full Unicode normalization database into every
implementation, including from-scratch ones — raising the cost of the second
independent implementation, which is the thing that makes an encoding
trustworthy at all. The correction comes from `warrant` SPEC §4, which had
already settled this (§17.1).

#### 5.1.2 Floating point

Floating point is where content-addressed systems usually die, and this RFC
proposes a probability simplex as a first-class geometry (§6.4), so it walks
directly into the problem.

In canonical form:

1. `NaN` and the infinities MUST be rejected. They are not values a state may
   hold; a computation producing one has failed and MUST surface as a validation
   error, not as bytes.
2. Negative zero MUST be normalized to positive zero before encoding. `-0.0` and
   `+0.0` compare equal and MUST NOT produce different references.
3. Byte order and width MUST be fixed by the profile, not inherited from the
   host.
4. **Where equality of a value is load-bearing — simplex points, thresholds,
   budget terms, invariant boundaries — IEEE binary floating point MUST NOT be
   the canonical representation.** Such values MUST use exact rationals or
   fixed-point with a declared precision. A probability vector whose components
   were produced by different summation orders on different substrates is not
   the same vector under any digest, and rounding mode is not part of any wire
   format.
5. A geometry MAY use floating point internally. The obligation is at the
   canonical-encoding boundary, not inside the computation.

##### Non-integer values inside an integers-only domain

Rule 4 says what MUST NOT be used and leaves open how a non-integer value is
actually written when the canonical encoding admits only integers — which is the
case for the leading Tranche A3 candidate (§17.1.1) and the one place §6.4's
probability simplex collides with it.

Two patterns are admissible. Both keep every number in the integer domain and
both are exact:

```json
{ "kind": "ratio", "num": <int>, "den": <int> }
{ "kind": "fixed", "value": <int>, "scale": <int> }
```

For `ratio`, the canonical form MUST satisfy:

1. `den > 0` — sign lives in `num` only, so `-1/3` has exactly one encoding;
2. `gcd(|num|, den) == 1` — reduced to lowest terms, so `2/6` is not a second
   encoding of `1/3`;
3. zero is `{ num: 0, den: 1 }` and nothing else;
4. both components lie inside the encoding's integer domain.

For `fixed`, `scale` MUST be declared by the geometry rather than per value, and
all values in one geometry MUST share it — otherwise comparing two points means
rescaling, and rescaling reintroduces the rounding the rule exists to remove.

**Reduction rules are not optional decoration.** Without them the encoding is
deterministic but not injective in the direction that matters: two byte
sequences would denote one value, so two states that are equal would carry
different references, and every equality check downstream would silently be
comparing encodings rather than values.

**The simplex additionally constrains the sum.** A probability vector MUST sum
to exactly one under exact arithmetic — `Σ num_i / den_i == 1` for ratios, or
`Σ value_i == scale` for fixed-point with a shared scale. This is a validation
rule (§6), not an encoding rule, and it is the reason the simplex cannot use
floats: "sums to one after rounding" is not a property two independent
implementations will agree on.

A string form such as `"1/3"` is a third option, and RFC 7493 §2.2 does
recommend strings for numeric values outside the safe integer range. It is not
recommended here: it moves the reduction rules into a string grammar that every
implementation must parse identically, which is more surface for the second
independent implementation to diverge on, and divergence there is exactly what
canonical encoding exists to prevent.

Selecting between these remains Tranche A3's decision. This section states what
any selection must satisfy.

#### 5.1.3 Parity is proven, not assumed

Every substrate implementing the encoding MUST verify against a shared fixture
set, in the manner `fixtures/canon-vectors.json` already establishes for the
canonical hash. The fixtures MUST include the adversarial cases — `-0.0`,
denormals, non-normalized equivalent strings, key-order permutations, nested
empty containers, and the largest and smallest representable values.

Cross-substrate parity that has not been measured is a hope, and this document
does not accept hopes as evidence anywhere else.

**Encoding selection is deferred.** This RFC states the requirements above but
does **not** select the encoding. That selection is a federation-wide commitment
affecting substrates that are not parties to this RFC, and it deserves its own
contract with its own test vectors rather than a clause inside a geometry
proposal. It is filed as decision request §22 Tranche A3 and open problem
§20.15.

Until that contract exists, §5.1 is specified but not yet implementable across
substrate boundaries, and this document does not pretend otherwise.

### 5.2 Metadata weight and state profiles

The `TypedState` shape above is heavy. Carrying geometry, ontology, uncertainty,
invariants, provenance, and lineage on every high-frequency internal value would
cost more than the values themselves, and a protocol whose ceremony is
unaffordable is a protocol that gets bypassed at the point it matters.

The weight is therefore mitigated by structure, not by dropping fields:

1. **Shared descriptors are referenced, not embedded.** By §5.1, a million
   states in one geometry carry one geometry descriptor and a million pointers.
2. **A state MAY declare a profile** that fixes which fields are materialized:

```ts
type StateProfile = "minimal" | "tracked" | "full";
```

- `minimal` — geometry and ontology references plus value. Permitted only for
  states that are local, reversible, and never cross a translation, federation,
  or irreversible boundary.
- `tracked` — adds uncertainty and provenance. Required for any state that
  informs a decision.
- `full` — adds invariants and lineage. Required for any state that crosses a
  translation boundary, enters a federated exchange, or reaches an irreversible
  boundary.

3. **Promotion is the runtime's obligation, not the caller's.** A `minimal`
   state that reaches a boundary requiring `full` MUST be rejected at that
   boundary. It MUST NOT be silently upgraded with backfilled metadata, because
   backfilled provenance is fabricated provenance.
4. Profiles are a storage and materialization concession. They MUST NOT be used
   to weaken what a receipt records once a boundary is actually crossed.

The honest cost of this design is that the decision "which profile does this
state need?" moves to authoring time, and a wrong guess surfaces as a refusal at
a boundary rather than as a silent degradation. That is the intended trade.

---

## 6. Geometry contract

```ts
interface Geometry<P, Delta, D, R> {
  id: GeometryId;
  address: ContentAddress; // identity; see §6.2.1
  version: VersionLabel; // derived projection, not an assertion

  validate(point: P): ValidationReport;
  compare(a: P, b: P, context: ComparisonContext): R;
  distance?(a: P, b: P, context: DistanceContext): D;
  move?(point: P, delta: Delta, context: MoveContext): MoveResult<P>;
  interpolate?(a: P, b: P, t: UnitInterval): P;
  compose?(a: P, b: P): CompositionResult<P>;

  deltaDescriptor?(): DeltaDescriptor; // required iff `move` is present
  laws(): AlgebraicLaws;
  invariants(): InvariantDefinition[];
  supportedOperations(): OperationDescriptor[];
  forbiddenOperations(): ForbiddenOperation[];

  serialize(point: P): CanonicalBytes;
  deserialize(bytes: CanonicalBytes): ValidationResult<P>;
}
```

The `Delta` parameter is not decoration. In an earlier draft this was
`delta: unknown`, which made `move` an untyped hole in an otherwise typed
contract and violated §5's own rule against out-of-band convention: nothing said
whether a delta was a tangent vector, an edit script, a permutation, or an
arbitrary payload. A geometry exposing `move` MUST declare a `DeltaDescriptor`
with its own content address, giving the delta space the same canonical encoding
and validation obligations as the point space.

### 6.1 Contract rules

A geometry implementation MUST:

1. provide canonical serialization;
2. define validation rules;
3. declare supported and forbidden operations;
4. declare the invariants relevant to those operations, each with an execution
   scope and cost class (§6.1.1);
5. declare its algebraic laws with evidence (§6.2);
6. declare a typed delta space if it exposes `move`;
7. provide deterministic test fixtures for canonical operations;
8. fail closed on unsupported operations.

#### 6.1.1 Invariants need an execution model

`InvariantDefinition` is referenced throughout this document as the thing that
translation preserves, admission checks, and identity policy protects. Without
an execution model, "preserve invariant X" is not checkable and every substrate
will check something slightly different.

```ts
type InvariantDefinition = {
  id: InvariantId;
  address: ContentAddress;
  scope: "state" | "transition" | "trace";
  predicate: PredicateRef; // content-addressed, deterministic
  costClass: "constant" | "linear" | "superlinear" | "unbounded";
  distortionMeasure?: MeasureRef; // required if the invariant can be partially held
  falsifier: FixtureRef[];
};
```

- **`state`** — a predicate over a single state. Checkable at any point.
- **`transition`** — a predicate over an ordered pair of states. Requires the
  predecessor, so it MUST NOT be checked from a state in isolation.
- **`trace`** — a predicate over a sequence. Cannot be established at a boundary
  by inspecting the state that arrived there, and any gate claiming to enforce a
  trace invariant from a single state is not enforcing it.

Rules:

1. Every invariant MUST declare its scope. Consumers MUST NOT check an invariant
   at a scope narrower than declared and report it as held.
2. `costClass` MUST be declared so that a boundary can budget its checks. An
   `unbounded` invariant MUST NOT gate a fast-path decision (§15.0) and MUST NOT
   be required at a boundary with a bounded time budget.
3. An invariant that can be _partially_ held MUST supply a `distortionMeasure`,
   because §7.1.1 composes distortion by that measure's own rule.
4. A predicate MUST be deterministic and content-addressed. An invariant whose
   meaning depends on when or where it ran cannot support a receipt.

A geometry MUST NOT expose `distance`, `interpolate`, or `average` merely to
satisfy a generic interface. If the operation has no coherent meaning, it MUST
be absent or explicitly forbidden.

### 6.2 Declared algebraic laws

Listing operations is not enough. Two geometries can expose the same `compose`
signature and still disagree about whether composition may be reordered,
repeated, or undone. A caller that assumes the wrong answer corrupts state
without any type error.

A geometry MUST therefore declare the laws its operations obey:

```ts
type AlgebraicLaws = {
  associative?: LawClaim;
  commutative?: LawClaim;
  idempotent?: LawClaim;
  identityElement?: LawClaim & { element: CanonicalBytes };
  invertible?: LawClaim & { inverse: OperationRef };
  distributiveOver?: (LawClaim & { operation: OperationRef })[];
  monotoneUnder?: (LawClaim & { order: OrderRef })[];
  metricAxioms?: {
    identityOfIndiscernibles?: LawClaim;
    symmetry?: LawClaim;
    triangleInequality?: LawClaim;
  };
};

type LawClaim = {
  holds: boolean;
  scope: "total" | "partial";
  precondition?: PredicateRef;
  evidence: LawEvidence;
};

type LawEvidence =
  | { kind: "proof"; ref: EvidenceRef }
  | { kind: "property-test"; ref: EvidenceRef; cases: number; seed: string }
  | { kind: "asserted"; ref?: EvidenceRef };
```

Rules:

1. A declared law is a **claim**, not a permission to trust. Every law with
   `holds: true` MUST carry `LawEvidence`.
2. `kind: "asserted"` laws MUST NOT be used to authorize composition across a
   translation boundary or an irreversible boundary.
3. `metricAxioms` MUST be declared by any geometry exposing `distance`. A
   similarity score that violates the triangle inequality is not a metric and
   MUST NOT be presented as one.
4. A composition of two states MUST NOT be admitted when the composed geometries
   declare incompatible laws for the operation being used.
5. Law declarations are part of the geometry's canonical bytes (§5.1.1).
   Weakening a law therefore changes the geometry's content address by
   construction — see §6.2.1.

This makes the loss profile of an operation checkable before it runs, and gives
the registry something deterministic to reject.

#### 6.2.1 Version is derived, not declared

The `version: string` field in §6 and the content addressing of §5.1 are two
identity systems for one object, and two sources of truth drift. A geometry
whose laws were weakened without its author remembering to bump the string is
exactly the case the versioning existed to catch, and it is the case a manual
field will miss.

Therefore:

1. A geometry's **identity is its content address**. Two geometries with
   different canonical bytes are different geometries, whatever their version
   strings say.
2. `version` MUST be a **projection of the version DAG**, not an independent
   assertion. Each release records its predecessor's content address, and the
   version string is a human-readable label computed from that history.
3. A registry MUST reject a geometry whose declared version conflicts with its
   position in the DAG — for example, a label claiming a patch increment across
   a change that weakened a law.
4. Receipts MUST record the content address. They MAY additionally record the
   label for legibility. A receipt carrying only a version string does not
   identify what ran.

The version string is thus a convenience for humans reading a ledger. Nothing
verifies against it.

### 6.3 Capability splitting

The interface in §6 uses optional methods. Optional methods are a weak defense:
an implementer under schedule pressure can satisfy them with a stub that returns
a plausible number, and nothing in the type system objects. This is the
`geometry cosplay` failure mode (§19.7) arriving through the front door.

Implementations SHOULD therefore split the contract into separate capability
interfaces rather than one interface with optional members, so that a geometry
which cannot interpolate is **unable to be passed** where interpolation is
required, rather than merely expected to decline at runtime.

In a language with traits or typeclasses this is structural. A Rust projection
would look roughly like:

```rust
pub trait Geometry {
    type Point;
    fn id(&self) -> GeometryId;
    fn version(&self) -> Version;
    fn validate(&self, p: &Self::Point) -> ValidationReport;
    fn laws(&self) -> AlgebraicLaws;
    fn serialize(&self, p: &Self::Point) -> CanonicalBytes;
    fn deserialize(&self, b: &CanonicalBytes) -> Result<Self::Point, DecodeError>;
}

pub trait Metric: Geometry {
    fn distance(&self, a: &Self::Point, b: &Self::Point, cx: &DistanceContext) -> Scalar;
}

pub trait Interpolable: Geometry {
    fn interpolate(&self, a: &Self::Point, b: &Self::Point, t: UnitInterval) -> Self::Point;
}

pub trait Composable: Geometry {
    fn compose(&self, a: &Self::Point, b: &Self::Point) -> CompositionResult<Self::Point>;
}

// A planner that averages states cannot accept a temporal partial order:
// the bound is checked at compile time, not apologized for at runtime.
fn midpoint<G: Interpolable>(g: &G, a: &G::Point, b: &G::Point) -> G::Point {
    g.interpolate(a, b, UnitInterval::HALF)
}
```

A temporal partial order implements `Geometry` and never `Interpolable`, so
`midpoint` cannot be instantiated for it. The cosplay risk is removed by
construction instead of by review.

Where the host language cannot express this (dynamic registries, cross-language
adapters, opaque external geometries), the registry MUST enforce the same rule
at admission: a geometry that declares an operation it does not implement, or
implements an operation it did not declare, MUST be rejected.

### 6.4 Initial geometry families

The federation MAY begin with:

- Euclidean vector space;
- probability simplex;
- temporal partial order;
- causal directed graph;
- symbolic discrete state;
- constraint region;
- hierarchy or hyperbolic embedding;
- spherical orientation;
- product geometry;
- opaque external geometry with verifier adapter.

These families are examples, not a normative completeness claim.

---

## 7. Translation protocol

Translation is the central primitive of this RFC.

```ts
type TranslationRequest<A, B> = {
  source: TypedState<A, unknown>;
  targetGeometry: GeometryRef<B>;
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
**monotone**: a longer pipeline can never report less loss than its worst step.
Any implementation where adding a translation step improves the loss profile has
a bug, and this is a cheap invariant to test.

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

This is the same gap §6.2 addresses for geometries, and it gets the same answer:
the laws are claims and MUST carry evidence. For these types the evidence is
property-based tests over generated profiles — associativity, identity, the
non-commutativity of loss, the commutativity of debt, and the monotonicity
above. Treating the trait as the guarantee would be §19.7's failure mode
relocated from mathematical vocabulary to type signatures, where it is harder to
see.

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
2. Composition is permitted only where the intermediate geometry and ontology of
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
  divergence: DivergenceMeasure; // in the SOURCE geometry, against canonical bytes
  invariantsSurvived: InvariantRef[];
  invariantsLost: InvariantRef[];
};
```

Rules:

1. Divergence MUST be measured in the **source** geometry against the source's
   canonical encoding (§5.1.1), not in the target geometry and not by comparing
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

## 8. Conflict model

```ts
type Conflict = {
  id: string;
  participants: ConflictParticipant[];
  violatedInvariants: InvariantRef[];
  incompatibleClaims: ClaimRef[];
  attemptedResolutions: ResolutionAttempt[];
  persistence: PersistenceRecord;
  tension: TensionProfile;
  hypotheses: ConflictHypothesis[];
  status: ConflictStatus;
};
```

### 8.1 Tension profile

The protocol deliberately uses `TensionProfile`, not `TensionTensor`.

```ts
type TensionProfile = {
  semantic?: ConflictSignal;
  causal?: ConflictSignal;
  temporal?: ConflictSignal;
  normative?: ConflictSignal;
  geometric?: ConflictSignal;
  epistemic?: ConflictSignal;
  resource?: ConflictSignal;
  authority?: ConflictSignal;
};
```

No tensor semantics are implied unless a future extension formally defines
indices, transformation rules, and invariants.

### 8.2 Conflict hypotheses

A conflict diagnosis MAY classify one or more hypotheses:

- objective-weight conflict;
- missing variable;
- invalid abstraction;
- incompatible timescales;
- causal contradiction;
- translation loss;
- geometry mismatch;
- structural insufficiency;
- authority conflict;
- insufficient evidence;
- resource exhaustion;
- genuine irreducible disagreement.

A hypothesis MUST remain distinct from a confirmed diagnosis.

#### 8.2.1 Geometry mismatch versus structural insufficiency

These two are deliberately separated because they license different responses.

- **Geometry mismatch** — the participants hold states in different geometries
  and the conflict is an artifact of comparing them. A translation, a shared
  target geometry, or a corrected suitability judgment resolves it. No new
  representation is needed; one already exists in the registry.
- **Structural insufficiency** — no geometry available in the registry can hold
  the distinction the conflict requires. More evidence, more search, and better
  translation will not resolve it, because the required distinction is not
  expressible. This is the only conflict hypothesis that directly licenses a
  mutation proposal under §9 and §10.

A diagnosis of structural insufficiency MUST show that the distinction is
inexpressible, not merely inconvenient. The minimum showing is:

1. an explicit statement of the distinction the current registry cannot make;
2. a witness pair — two situations that the current representation maps to the
   same state but that **require different warrants** (§8.2.2);
3. evidence that at least two **independent** policies failed on that pair
   (§8.2.3);
4. an argument that a cheaper remedy (search, evidence, translation, local
   policy) does not apply.

#### 8.2.2 What makes a witness pair

An earlier draft said the two situations must "demand different actions". That
is a normative claim with no owner: whoever wants the mutation gets to assert
that the actions ought to differ, and the requirement collapses into a
preference.

The pair MUST instead differ at the level of **warrants**: the two situations
must require different authority, different evidence, or different reversibility
handling in order to proceed. This is checkable against the warrant records
rather than argued from utility, and it cannot be satisfied by an agent that
merely prefers a different outcome.

Two situations that differ only in expected value, ranking, or preferred policy
are **not** a witness pair. A representation that cannot distinguish two states
which the substrate's own authority rules already treat differently is a genuine
gap; a representation that fails to encode someone's preference ordering is not.

#### 8.2.3 What makes policies independent

"Two independent policies failed" is worthless if both policies are the same
model under two seeds. Independence MUST be declared and MUST rest on at least
one of:

1. **distinct substrate** — the policies execute under different substrates with
   different state-transition implementations;
2. **distinct derivation** — the policies do not share the training provenance,
   heuristic, or search procedure that could produce a correlated blind spot;
3. **distinct authority** — the policies answer to different principals, so
   neither can be instructed into agreement.

Two samples from one model, two seeds of one search, or one policy invoked twice
with different temperature are **one** policy for this purpose. The declaration
MUST be recorded in the bottleneck evidence, and a reviewer MUST be able to
reject it.

This RFC does not claim these three criteria are sufficient for genuine
independence — correlated failure across differently-derived policies is
possible and is filed as open problem §20.16. They are the minimum that makes
the requirement more than a formality.

##### On phase-transition framing

An earlier review proposed naming this hypothesis a "phase transition" or
"topological mismatch", by analogy to percolation and critical phenomena. This
RFC declines the analogy at the normative level and keeps the plainer name.

The analogy is suggestive and may well be productive: representational
bottlenecks do appear to arrive suddenly after long stretches of adequacy, which
is the shape a critical transition would have. But "phase transition" is a
claim, and this RFC's own §19.7 forbids borrowing mathematical vocabulary
without enforceable semantics. To use the term normatively, an implementation
would have to define the order parameter, the control parameter, and what
observable distinguishes a genuine transition from a run of ordinary failures —
none of which exist yet.

The framing is therefore recorded as an open problem (§20.11), not adopted as
protocol vocabulary. If someone supplies the order parameter and a
discriminating measurement, `structural insufficiency` can be renamed to
something it has earned.

### 8.3 Conflict outcomes

Valid outcomes include:

- resolved;
- verified;
- stable disagreement;
- Pareto set;
- insufficient evidence;
- blocked by warrant;
- blocked by budget;
- representation mutation proposed;
- irreducible;
- abandoned.

Consensus MUST NOT be the only success state.

---

## 9. Representational bottleneck detection

A mutation MAY be proposed only when there is evidence that search in the
current representation is insufficient or excessively costly.

Evidence MAY include:

- repeated failure across independent policies;
- mutually exclusive invariant satisfaction;
- systematic translation loss;
- inability to express a distinction required by external evidence;
- predictive failure localized to a representational assumption;
- action plans that become valid only by violating warrants;
- recurring conflict across agents with different policies but shared schema;
- excessive complexity caused by encoding a missing relation indirectly.

A bottleneck detector MUST distinguish:

1. insufficient search;
2. insufficient evidence;
3. insufficient resources;
4. representational insufficiency.

The system SHOULD prefer cheaper search, evidence collection, or local policy
change before ontology mutation unless the mutation is itself cheaper and
reversible.

---

## 10. Mutation budget

Representation mutation is not free.

```ts
type MutationBudget = {
  compute: BudgetLimit;
  migration: BudgetLimit;
  verification: BudgetLimit;
  coordination: BudgetLimit;
  complexity: BudgetLimit;
  maintenance: BudgetLimit;
  trust: BudgetLimit;
  time: BudgetLimit;
};

type MutationCost = {
  compute: Cost;
  stateMigration: Cost;
  translatorCreation: Cost;
  verification: Cost;
  federationCoordination: Cost;
  cognitiveComplexity: Cost;
  longTermMaintenance: Cost;
  irreversibilityRisk: Cost;
};
```

### 10.1 Admission inequality

A proposal SHOULD be admitted to experiment only when its expected value exceeds
its bounded expected cost under declared uncertainty:

```text
expected representational gain
  > mutation cost
  + migration cost
  + verification cost
  + coordination cost
  + expected translation debt
  + expected maintenance debt
```

This is a policy rule, not a requirement to collapse every term into one scalar.
Implementations MAY use lexicographic constraints, multi-objective comparison,
Pareto analysis, or warrant gates.

#### 10.1.1 Cost is a vector

`Cost` MUST NOT be a scalar. Each term above is a distinct kind of expenditure
paid by a distinct party, and adding them requires exchange rates that nobody in
this protocol has the authority to set. A `Cost` is a vector over declared
dimensions with declared units, compared by partial order; incomparable costs
MUST be reported as incomparable rather than ranked by a hidden weighting.

`BudgetLimit` is a bound in the same space. A budget check is a dimension-wise
comparison, and it fails if **any** dimension is exceeded — a surplus in one
dimension MUST NOT offset an overrun in another unless an explicit, warranted,
content-addressed exchange rule permits it.

#### 10.1.2 The cost model is content-addressed, or admission is a story

§10.1 correctly refuses to collapse the inequality into one number. That refusal
has a consequence the earlier draft did not follow through on: a verifier handed
an admission report cannot re-evaluate the decision unless it also has the rule
that was applied. Without it, `GeometryAdmissionReport` is a narrative asserting
that a comparison came out favorably, and §14's requirement that a future
verifier can ask "why was it considered sufficient" cannot be met.

Therefore:

1. The **cost model** — the dimensions, units, estimators, comparison rule, and
   any exchange rules — MUST be a content-addressed object.
2. Every admission decision MUST record the cost model's address alongside the
   inputs it was evaluated on.
3. Given the receipt, a third party MUST be able to **recompute the decision**
   and get the same verdict. An admission that cannot be replayed MUST NOT reach
   `federatively shared` or `canonical`.
4. Changing the cost model changes its address and therefore does not silently
   revise past decisions. Prior admissions remain evaluable under the model that
   actually admitted them.
5. Where a term is genuinely a judgment rather than a computation —
   `cognitiveComplexity`, `trust` — the estimator MUST say so, name the
   principal who supplied it, and the decision MUST record that it rested on an
   unreplayable term. A judgment that is honestly labeled is usable; one
   disguised as a measurement is not.

### 10.2 Loop prevention

The runtime MUST prevent unbounded mutation loops through at least:

- per-conflict mutation limits;
- cooldown or evidence requirements;
- cumulative mutation debt;
- rollback after failed admission stages;
- explicit terminal states;
- external authority limits.

---

## 11. Geometry Admission Protocol

A proposed geometry or ontology extension passes through the following states:

```text
hypothesis
  -> sandboxed
  -> experimentally validated
  -> locally accepted
  -> federatively shared
  -> canonical
  -> deprecated
  -> retired
```

Skipping stages requires an explicit warrant and receipt.

### 11.1 Proposal

```ts
type GeometryProposal = {
  id: string;
  problem: ConflictRef | BottleneckRef;
  proposedGeometry: GeometryDescriptor;
  proposedOntologyChanges: OntologyPatch[];
  requiredTranslations: TranslationDescriptor[];
  expectedGain: GainProfile;
  estimatedCost: MutationCost;
  falsifiers: Falsifier[];
  rollbackPlan: RollbackPlan;
  proposer: AgentId;
  bond: ProposalBond;
  lineage: LineageClaim; // derived and checked, never taken on trust (§19.13)
  failureReceipts: ReceiptRef[]; // the independent-policy failures of §8.2.1
  evidence: EvidenceRef[];
};
```

`lineage` and `failureReceipts` are what make §19.13's budget accumulation
enforceable. A proposal that cites no failure receipts has not made the §8.2.1
showing; a proposal whose cited receipts already belong to a lineage joins that
lineage regardless of what its `LineageClaim` says.

#### 11.1.1 Proposals are not free to make

§15 permits an LLM to propose candidates, and §11.3 makes verification
expensive. Between those two sits an unmetered gap: the mutation budget is
checked _after_ a proposal exists, so an agent that proposes cheaply and
verifies expensively can exhaust the federation's verification capacity without
ever exceeding a mutation budget. Denial of service against the governance
process is still denial of service.

A conforming implementation MUST bound proposal intake by at least one of:

1. **Bond** — the proposer commits a stake, forfeited if the proposal is
   rejected for a reason that was determinable before submission (missing
   falsifiers, absent rollback plan, a bottleneck showing that fails §8.2.1's
   minimum). A bond MUST NOT be forfeited for a proposal that was well-formed
   and merely wrong, and MUST NOT be forfeited for disagreement.
2. **Per-agent rate limit** on proposals per conflict lineage per window.
3. **Screening admission** — a cheap deterministic well-formedness gate run
   before any expensive verification is scheduled.

Verification capacity MUST be budgeted as a federation resource, not drawn
implicitly from whoever happens to be verifying.

The distinction in (1) is the load-bearing part. A regime that punishes being
wrong suppresses exactly the speculative proposals a representational bottleneck
needs, and this document's §8.3 already treats stable disagreement as a valid
outcome. What is charged for is wasting others' verification on work the
proposer could have checked themselves.

### 11.2 Admission report

```ts
type GeometryAdmissionReport = {
  conflictResolution: ResolutionDelta;
  invariantPreservation: InvariantReport;
  translationLoss: LossProfile[];
  predictiveGain: PredictiveDelta;
  actionabilityGain: ActionabilityDelta;
  complexityChange: ComplexityDelta;
  mutationCost: MutationCost;
  reversibility: ReversibilityReport;
  externalValidation: EvidenceBundle;
  regressions: RegressionRecord[];
  costModel: ContentAddress; // §10.1.2 — without this the report is a narrative
  status: AdmissionDecision;
};
```

### 11.3 Required tests

An experimental geometry MUST be tested for:

- canonical serialization stability;
- canonical encoding parity against the shared fixture set (§5.1.3), including
  the float and normalization cases;
- operation determinism where promised;
- declared algebraic laws, by property test where no proof is supplied (§6.2);
- invariant preservation, at each invariant's declared scope (§6.1.1);
- **round-trip anchors** — forward and inverse translation measured against
  source canonical bytes, with declared divergence bounds (§7.4.2);
- **composition consistency** — the computed profile of a composed translator
  compared against its measured end-to-end behavior (§7.4.1.4);
- migration round-trip behavior;
- translation loss visibility;
- rollback feasibility;
- conflict reduction without conflict concealment;
- effects on neighboring states and translators;
- complexity and resource bounds;
- external falsifiers relevant to the original problem.

A geometry MUST NOT be accepted solely because it reduces an internal conflict
score.

The round-trip and composition tests are the two that catch a translator lying
about its own loss, which is the failure the rest of the protocol has no other
way to detect.

### 11.4 Acceptance authority

Admission authority MUST be scoped. A local agent MAY accept an experimental
geometry for reversible internal use. Federated or canonical acceptance MUST
follow substrate governance and produce proof-bearing receipts.

---

## 12. Identity and governed self-change

Identity is not defined as a fixed state vector.

```ts
type AgentIdentity = {
  currentInvariants: InvariantSet;
  identityPolicy: IdentityMutationPolicy;
  constitutionalHistory: AmendmentRecord[];
  lineage: IdentityLineage;
};
```

### 12.1 Identity mutation policy

```ts
type IdentityMutationPolicy = {
  immutableInvariants: InvariantRef[];
  amendableInvariants: AmendableInvariant[];
  proposalAuthority: AuthorityRule[];
  evidenceRequirements: EvidenceRule[];
  quorumRequirements?: QuorumRule[];
  forkConditions: ForkCondition[];
  continuityTest: ContinuityTest;
  rollbackPolicy: RollbackPolicy;
};
```

The policy MUST answer:

- which invariants may change;
- who may propose change;
- what evidence is required;
- when a change constitutes learning by the same agent;
- when a change creates a fork or successor agent;
- what obligations survive the change;
- whether previous versions can verify continuity.

No agent may silently erase obligations by changing its representation or
identity schema.

---

## 13. Federated Ontology Protocol

The most important case is not multiple geometries inside one agent, but
multiple agents or substrates with different ontologies.

```ts
type AgentOntology = {
  owner: AgentId | SubstrateId;
  ontology: OntologyRef;
  geometries: GeometryRef<unknown>[];
  invariants: InvariantSet;
  translationPolicies: TranslationPolicy[];
  trustModel: TrustModel;
  authority: AuthorityDescriptor;
};
```

### 13.1 Federated translation

```ts
type FederatedTranslation<A, B> = {
  sourceAgent: AgentId | SubstrateId;
  targetAgent: AgentId | SubstrateId;
  sourceOntology: OntologyRef;
  targetOntology: OntologyRef;
  mapping: TranslationDescriptor<A, B>;
  loss: LossProfile;
  trustRequirements: TrustRequirement[];
  warrants: WarrantRef[];
  negotiation: NegotiationState;
  receipts: ReceiptRef[];
};
```

No substrate may silently claim that another substrate's state has an identical
meaning after translation.

### 13.2 Local compatibility instead of global agreement

Agents MAY cooperate without agreeing on their complete ontologies. They MAY
establish a local compatibility contract that defines only:

- the shared claims needed for one interaction;
- the preserved invariants;
- accepted translation losses;
- evidence obligations;
- action limits;
- rollback ownership;
- irreversible-boundary conditions.

### 13.3 Irreversible-boundary consensus

Consensus is required primarily at boundaries where consequences become
irreversible or externally binding.

Example boundary contract:

```yaml
boundary: production_write
requires:
  independent_evidence: 2
  deterministic_replay: true
  rollback_plan: required
  authority_receipt: required
  affected_owner_ack: required
  unresolved_translation_debt: forbidden
```

This allows ontological pluralism while preserving accountable joint action.

### 13.4 Genesis handshake

Sections 13.1–13.3 describe translation and compatibility between agents that
already share enough vocabulary to negotiate. They do not explain how two agents
with disjoint ontologies reach that point. Without an answer, the federated
protocol assumes the agreement it was designed to avoid requiring.

#### 13.4.1 There is a floor, and it is not empty

The honest starting position is that first contact cannot bootstrap from
nothing. Two parties that share no encoding, no identity primitive, and no
speech acts cannot distinguish a proposal from noise. Something must be
pre-shared.

An earlier draft of this section claimed the floor was **non-semantic** — bytes
and authorship only, "no claims about the world". That claim was false, and it
was falsified by the section immediately after it. §13.4.2 requires both parties
to _evaluate_ fixtures independently and compare outcomes. Evaluation is
execution, and two parties whose outcomes are to be meaningfully compared must
execute under the same semantics. A shared deterministic execution semantics is
not a claim about bytes. It is the largest thing in the floor, and the previous
draft got it by omission — which is precisely the silent-assumption failure this
document exists to prevent.

The floor is therefore stated with four elements, the fourth admitted:

1. **Byte identity** — the canonical encoding and digest of §5.1. This lets both
   parties agree on _which object_ is under discussion without agreeing on what
   it means.
2. **Authorship** — signature verification and a key identity, so a statement
   can be attributed and later held against its author.
3. **Handshake vocabulary** — the small set of message kinds below, whose
   meanings are fixed by this RFC and are about the protocol, not the domain.
4. **Ordering discipline** — a hash-chained message order (§13.4.3.1), so
   negotiation state is well-defined without a shared clock.
5. **Execution floor** — a deterministic evaluator in which fixtures run, such
   that the same fixture and the same inputs produce the same canonical output
   bytes on both sides, independent of host, architecture, and implementation
   language.

Anything richer — concepts, relations, units, values, goals — is explicitly not
in the floor and MUST be established, not assumed.

#### 13.4.1.1 The execution floor

The execution floor MUST provide: determinism across hosts and architectures;
bounded resource consumption with a declared cost model, so a fixture cannot
exhaust an evaluator; no ambient authority — a fixture evaluates its inputs and
returns bytes, with no access to clock, network, filesystem, or entropy; and
canonical encoding of its output per §5.1.1.

It MUST NOT provide domain vocabulary. The evaluator knows how to run a
computation; it does not know what a "commitment" or a "deadline" is. That
distinction is what keeps the floor from becoming the global ontology §13.4.4
forbids.

`omega` already occupies this role in the federation — deterministic state
transition is its stated responsibility (§18) — which makes the requirement
concrete rather than aspirational. This RFC does not select the evaluator; that
selection is filed as decision request §22 Tranche G4.

#### 13.4.1.2 On minimality

There is a temptation to present the above as a strength — to say the federation
has _identified the minimal sufficient floor_ and _proved that less is
impossible_. That would be a theorem, and no proof is offered here.

What is offered is weaker and true: five elements are **sufficient** for the
handshake as specified, each is load-bearing in an identified step, and removing
any one breaks a named requirement. Sufficiency with no redundancy is not
minimality — a different decomposition might do the same work with less, and
this document has not ruled that out.

The minimality question is filed as open problem §20.14. Claiming the theorem
before proving it would be the failure mode of §19.7 committed in the section
that admits a previous omission, which would be a poor place for it.

#### 13.4.2 Grounding is behavioral, not definitional

Agents MUST NOT establish a mapping by exchanging definitions. Definitions are
circular for parties without shared vocabulary: each side reads the other's
words under its own ontology and concludes, wrongly, that it understood.

Mappings are instead grounded by **agreed behavior on shared fixtures**. One
party proposes a candidate correspondence and a set of deterministic cases; both
parties evaluate the cases **in the shared execution floor** while interpreting
the inputs and outputs under their own ontologies; the mapping is credited only
to the extent that the outcomes agree.

The division of labor is the whole mechanism, and it is worth stating exactly.
The execution floor supplies _agreement about what happened_ — same fixture,
same inputs, same output bytes. Each party's own ontology supplies _what that
outcome means to it_. Agreement on the first with divergence on the second is
the informative case: it localizes the disagreement to interpretation, which is
what a mapping has to bridge. Without a shared evaluator there is no first part,
the comparison degenerates into each side reporting a number computed by rules
the other cannot reproduce, and "behavioral grounding" becomes dictionary
synchronization wearing its name.

```ts
type HandshakeMessage =
  | {
    kind: "hello";
    identity: KeyRef;
    floorVersion: string;
    evaluator: EvaluatorRef;
    prev: null;
  }
  | { kind: "offer-fixture"; fixture: FixtureRef; expects: OutcomeShape }
  | { kind: "fixture-result"; fixture: FixtureRef; outcome: CanonicalBytes }
  | {
    kind: "propose-mapping";
    mapping: TranslationDescriptor<unknown, unknown>;
  }
  | {
    kind: "mapping-evidence";
    mapping: MappingRef;
    agreements: FixtureResult[];
  }
  | { kind: "scope-contract"; contract: CompatibilityContract }
  | { kind: "decline"; reason: DeclineReason };

type FixtureResult = {
  fixture: FixtureRef;
  agreed: boolean;
  divergence?: DivergenceRecord;
};
```

Every message after `hello` MUST carry `prev`, the content address of the
message it follows (§13.4.3.1).

A party that cannot run the declared `evaluator` MUST `decline` at `hello`
rather than proceed with self-reported outcomes. A handshake in which one side
takes the other's word for what a fixture returned has no grounding at all — it
has trust, which is the thing the handshake was supposed to establish.

#### 13.4.3 Stages

```text
hello                  (exchange identity and floor version)
  -> fixture exchange  (deterministic cases, evaluated independently)
  -> divergence report (where outcomes differ, and by how much)
  -> candidate mapping (proposed only over the agreeing region)
  -> scoped contract   (§13.2, limited to that region)
  -> joint action      (§13.3 boundary rules apply unchanged)
```

Rules:

1. A mapping MUST NOT be credited beyond the region where fixtures agreed. The
   agreeing region is the mapping's declared domain; outside it the mapping is
   undefined, not merely uncertain.
2. Divergences MUST be recorded, not discarded. A fixture where two agents
   disagree is the most informative object produced by the handshake, and is
   itself evidence under §9.
3. A handshake MUST NOT authorize an irreversible boundary crossing. Its output
   is a scoped compatibility contract; §13.3 governs what that contract may then
   be used for.
4. Either party MAY `decline` at any stage without penalty. Refusal to establish
   a mapping is a valid terminal state, not a failure.

#### 13.4.3.1 Ordering without a clock

"A way to say that one message preceded another" was left unspecified in the
earlier draft, which in a distributed setting means it was left to whoever
implements it first. There is no global clock, timestamps are assertions by
their author, and negotiation state that depends on either is not well-defined.

Ordering is therefore established by **hash chaining**: every handshake message
after `hello` carries `prev`, the content address of the message it follows. The
chain gives, at no cost beyond a digest already being computed:

1. a total order within one handshake, verifiable by a third party who was not
   present;
2. tamper evidence — a message cannot be inserted, removed, or reordered without
   breaking every subsequent link;
3. a well-defined negotiation state, namely the chain head;
4. a fork detector — two messages claiming the same `prev` from one party is
   equivocation, and MUST terminate the handshake rather than be resolved by
   preferring one branch.

This orders messages _within_ a handshake. It does not order events across
handshakes or across the federation, and MUST NOT be presented as doing so.

#### 13.4.4 Trinity's role, and what it is not

`trinity` MAY act as a witness to a handshake: holding fixture sets, recording
divergences, and issuing receipts that a third party can check. This is useful
because it makes the handshake auditable by someone who was not present.

`trinity` MUST NOT thereby become a privileged global ontology. Specifically it
MUST NOT define what the mapped concepts mean, arbitrate which ontology is
correct, or be required for a handshake between two agents that can reach each
other directly. A witness records what happened; it does not confer meaning.

#### 13.4.5 Honest limit

The floor in §13.4.1 is itself a shared ontology — a small one, and now an
honestly counted one. This RFC does not claim to have eliminated pre-agreement.
It claims to have reduced it to encoding, authorship, ordering, a fixed
handshake vocabulary, and a deterministic evaluator, and to have made that
residue explicit rather than tacit.

The correction in §13.4.1 is worth keeping visible rather than smoothing over:
the execution floor was present in the design from the moment fixtures were
introduced, and absent from the list of what the design assumed. It took an
outside reader to notice. A document whose central discipline is that
assumptions must be declared shipped a draft with an undeclared one, which is
the ordinary way this failure happens — not by concealment, by not looking.

Open: whether the floor can be reduced further (§20.14); whether behavioral
grounding can distinguish genuine agreement from coincidental agreement on an
unrepresentative fixture set (§20.12); and how mappings survive a party forking
mid-contract (§20.17).

---

## 14. Ledger requirements

The ledger MUST preserve more than state changes. It MUST preserve changes to
the space in which state changes were interpreted.

Each relevant receipt SHOULD record:

- source and target geometry versions;
- source and target ontology versions;
- translator identity and version;
- loss profile;
- preserved and violated invariants;
- mutation cost and budget state;
- admission stage;
- warrants and authority;
- falsifiers;
- rollback plan and result;
- identity continuity decision;
- federation participants;
- irreversible-boundary decision;
- runtime path taken and the predicate evaluation that admitted it;
- state profiles at each boundary crossing.

A future verifier must be able to answer:

1. Which representation was used?
2. Why was it considered sufficient?
3. What was lost during translation?
4. Why was a representation change proposed?
5. Who accepted it and under which authority?
6. What evidence survived independently?
7. Could the action have been reversed?

---

## 15. Runtime protocol

### 15.0 Two paths

The governed cycle below is the protocol's full ceremony. Applied to every
operation it would be unaffordable: an agent updating an internal counter does
not need budget checks, sandboxing, or ontology negotiation, and a protocol that
demands them there will be routed around exactly when convenience argues
loudest. A bypassed protocol protects nothing.

The runtime therefore has two paths. The distinction is not "important versus
unimportant" — it is **whether the operation can produce a consequence the
protocol exists to govern**.

An operation MAY take the fast path only when all of the following hold:

```text
same geometry        — source and target geometry references are identical
same ontology        — no cross-ontology interpretation occurs
no federation        — no other agent or substrate is a participant
reversible           — the action's reversibility class is "reversible" and a
                       rollback boundary is already established
within budget        — no mutation is proposed and no budget term is consumed
no unresolved debt   — the states involved carry no outstanding translation debt
invariants unchanged — the operation touches no invariant in the identity policy
```

The predicate MUST fail closed: if any term is unknown, unavailable, or
expensive to evaluate, the operation takes the governed path. Evaluating the
predicate MUST be cheaper than the ceremony it skips, or it has no purpose.

### 15.1 Fast path

```text
observe
  -> type state
  -> validate geometry
  -> update local state
  -> record compact receipt
```

Rules:

1. The fast path MUST still produce a receipt. The receipt MAY be compact —
   state reference, geometry version, operation, outcome — but the operation
   MUST remain reconstructible.
2. The fast path MUST NOT cross a translation, federation, or irreversible
   boundary; MUST NOT propose or apply a mutation; and MUST NOT amend identity
   invariants. These are precisely the terms of the §15.0 predicate, restated as
   prohibitions so that a violation is detectable after the fact.
3. Any fast-path operation that turns out to require one of those crossings MUST
   be aborted and re-attempted on the governed path. It MUST NOT be completed
   and retroactively justified.
4. Fast-path receipts MUST be attributable to the predicate evaluation that
   admitted them, so that a wrong predicate is auditable as a class rather than
   one operation at a time.

### 15.2 Governed path

A minimal governed execution cycle is:

```text
observe
  -> type state
  -> validate geometry and ontology
  -> update local state
  -> evaluate intents and warrants
  -> detect conflict
  -> classify likely cause
  -> attempt bounded resolution in current representation
  -> collect evidence if uncertainty dominates
  -> propose mutation if a bottleneck is evidenced
  -> check mutation budget
  -> sandbox representation
  -> run admission tests
  -> negotiate translations where federated
  -> act within reversibility boundary
  -> verify externally
  -> commit receipts and loss profiles
```

The runtime MUST distinguish hypothesis generation from authority to mutate or
act. An LLM MAY propose candidates but MUST NOT be the sole verifier of geometry
adequacy, invariant preservation, or admission.

### 15.3 Path selection is a security boundary

Introducing a fast path introduces the attack it implies: anything that can
convince the predicate an operation is local, reversible, and unfederated has
bought itself an ungoverned execution.

Consequently:

1. The predicate MUST be evaluated by the runtime, never supplied by the caller.
   An operation MAY declare intent; it MUST NOT declare its own eligibility.
2. An LLM MUST NOT decide path selection. Every term in §15.0 is a deterministic
   check against typed state, and MUST be implemented as one.
3. Path selection MUST be recorded in the receipt. A verifier must be able to
   ask why a given operation skipped the governed cycle and check the answer.
4. Systematic drift toward the fast path is a signal, not an efficiency win. If
   the share of fast-path operations rises without a corresponding change in
   workload, the predicate SHOULD be treated as miscalibrated and audited.
5. The fast path is an optimization of ceremony, never of accountability. It
   reduces what is checked before an operation; it does not reduce what is
   recorded about it.

---

## 16. Reference demo

### 16.1 Problem

An agent must satisfy both:

1. maximize operational autonomy;
2. prevent unverified irreversible change.

A scalar tradeoff produces only weaker autonomy or weaker safety.

### 16.2 Initial conflict

```yaml
conflict:
  intents:
    - autonomous_action
    - verified_irreversibility
  violated_invariants:
    - no_unverified_irreversible_write
  attempted_resolutions:
    - reduce autonomy scope
    - require approval for every action
  result: persistent_conflict
```

### 16.3 Bottleneck hypothesis

The current model lacks an explicit `reversibility` dimension and treats all
actions as equally final.

### 16.4 Proposed extension

Introduce action commitment stages:

```text
simulate
  -> shadow execute
  -> reversible apply
  -> externally verify
  -> commit
```

Add concepts:

- reversibility class;
- rollback boundary;
- staged commitment;
- proof-carrying action;
- delayed materialization;
- irreversible-boundary warrant.

### 16.5 Acceptance criteria

The extension is accepted locally only if it:

- permits more autonomous reversible actions;
- does not weaken the original irreversible-write invariant;
- provides deterministic rollback tests;
- exposes translation loss from the old binary action model;
- stays within mutation budget;
- produces receipts that another substrate can independently verify.

This demo is intentionally small. It tests whether the schema can express a new
representational distinction without claiming automated ontology invention.

### 16.6 Why one demo is not enough

Demo 16.1–16.5 runs inside one agent, in one ontology, with no counterparty. It
exercises conformance Levels 2 and 3 — conflict-aware runtime and governed
mutation.

The RFC's weight is not there. Levels 4 and 5 carry the federated ontology
protocol, the genesis handshake, the execution floor, and the compatibility
contracts, and those are the parts with no prior art in this federation and the
most ways to be quietly wrong. Validating L2–L3 and declaring the protocol
demonstrated would be selection bias built into the acceptance plan.

### 16.7 Second demo: federated boundary crossing (Level 4)

Two substrates, disjoint ontologies, one consequential action.

**Setup.** `myc` holds a proposal lifecycle ontology: proposals, witnesses,
finality. `liquid` holds a metabolic ontology: pressure, decay, resource
availability. Neither models the other's concepts, and neither is asked to.

**The action.** `liquid` reports that a resource is exhausted. `myc` must decide
whether that constitutes grounds to withdraw a proposal that has already
collected witnesses — an action with external effect, therefore an irreversible
boundary under §13.3.

**What the demo must produce**, in receipts a third party can replay:

1. a `hello` exchange declaring both parties' evaluator and floor version,
   hash-chained per §13.4.3.1;
2. a fixture set exercising the candidate correspondence between `exhausted` and
   `grounds_for_withdrawal`, evaluated in the shared floor by both parties
   independently;
3. **at least one fixture on which they diverge**, recorded with its divergence
   rather than discarded — a demo where everything agrees has not tested the
   mechanism that matters;
4. a mapping credited only over the agreeing region, with the divergent region
   explicitly outside its declared domain;
5. a loss profile and a round-trip anchor report for the mapping (§7.4.2);
6. an action-context suitability for `forIrreversibleAction` that is
   **fixture-measured or third-party attested**, never self-reported by the
   translator (§7.2.2);
7. a scoped compatibility contract naming preserved invariants, accepted losses,
   rollback ownership, and the boundary condition;
8. the boundary decision itself — crossed with warrants, or refused — with the
   refusal being an equally valid demo outcome;
9. a replay by a third substrate (`omega` or `trinity`) reaching the same
   verdict from the receipts alone.

**What it falsifies.** If the two substrates cannot produce a fixture set whose
agreeing region is non-empty and whose divergent region is non-empty, then
behavioral grounding either proves nothing or proves too much, and §13.4 needs
rework before implementation. If step 9 cannot be performed from receipts alone,
the ledger requirements of §14 are insufficient.

This demo SHOULD be built before any claim that the federated protocol works,
and its absence SHOULD block Levels 4 and 5 from being asserted.

---

## 17. Proposed repository integration

This RFC SHOULD be implemented as extensions to existing semantic primitives,
not as a new standalone product.

Suggested module boundaries:

```text
core/
  state
  intent
  warrant
  evidence
  lineage
  addressing          # canonical bytes, digests, reference resolution (§5.1)
  state-profile       # profile declaration and boundary enforcement (§5.2)

geometry/
  geometry-contract
  algebraic-laws      # law declarations and their evidence (§6.2)
  capabilities        # metric / interpolable / composable split (§6.3)
  typed-state
  geometry-registry
  product-geometry

translation/
  translation
  loss-profile
  invariant-preservation
  translation-debt

conflict/
  conflict
  tension-profile
  representational-bottleneck

mutation/
  geometry-proposal
  mutation-budget
  admission-protocol
  rollback

federation/
  ontology
  federated-translation
  trust
  negotiation
  handshake           # genesis handshake and fixture grounding (§13.4)
  irreversible-boundary

runtime/
  path-predicate      # fast/governed selection, fail-closed (§15.0)
  receipts

identity/
  invariant-bundle
  identity-policy
  constitutional-amendment
```

The actual mapping into `trinity`, `myc`, `omega`, and `liquid` remains an
implementation task and MUST preserve each substrate's authority boundary.

### 17.1 Prior art in the adjacent dyad

This RFC was drafted against the four-substrate federation and, through two
critique rounds, specified several mechanisms from first principles. Two
adjacent repositories in the same ecosystem — `warrant` (signed decision DAG)
and `sigma-glyph` (deterministic compute core) — had already built some of them,
with multiple independent implementations and machine-checkable vectors.

#### Where the cited documents live

This RFC is a single file and may be read as one. Everything it cites outside
the `trinity` repository is therefore resolvable from here:

| Cited                           | Repository                               | Path                                  |
| ------------------------------- | ---------------------------------------- | ------------------------------------- |
| Warrant SPEC (§4, §5, §5.1, §7) | https://github.com/s0fractal/warrant     | `SPEC.md`                             |
| JCS parity vectors              | https://github.com/s0fractal/warrant     | `examples/canon-vectors.json`         |
| Signature vectors               | https://github.com/s0fractal/warrant     | `examples/signature-vectors.json`     |
| `ski@v1` runtime                | https://github.com/s0fractal/warrant     | `SPEC.md` §3.1                        |
| Σ-GLYPH Book I (TRUTH)          | https://github.com/s0fractal/sigma-glyph | `spec/book-1-truth.md` (en: `.en.md`) |
| Σ-GLYPH Book III (FEDERATION)   | https://github.com/s0fractal/sigma-glyph | `spec/book-3-federation.md`           |
| GOV-ANCHORS                     | https://github.com/s0fractal/sigma-glyph | `spec/GOV-anchors.md`                 |
| Anchored spec set               | https://github.com/s0fractal/sigma-glyph | `spec/ANCHORS.txt`                    |
| Lean proofs                     | https://github.com/s0fractal/sigma-glyph | `proofs/`                             |
| Canonical hash contract         | this repository                          | `contracts/CANONICAL_HASH.v0.1.md`    |
| Voice public keys               | this repository                          | `src/x2F38_voice_pubkeys.json`        |

Both repositories maintain a generated `MAP.md` answering the narrower question
of which **ref** holds a cited document, since a branch is not the trunk and
"present on a branch" is not "in force".

**A URL is a convenience, not a trust anchor.** This is `warrant` SPEC §3.1's
own rule and it binds anything adopted here: an implementation MUST pin the
ruleset it evaluates against by version and content — a vendored oracle or a
pinned document hash — so that semantics cannot be changed under it by an edit
or a force-push. Read the links to find the documents; do not treat them as
identifying which bytes are in force.

Recording this is not a courtesy. Where a mechanism exists with two or three
agreeing implementations and a conformance vector set, specifying a second one
here would fork the ecosystem's identity primitives to gain nothing, and this
document's §5.1 argument against a second canonical addressing scheme applies to
itself.

| This RFC                                      | Existing artifact                                                                               | Status observed                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| §5.1.1–5.1.2 canonical encoding, float policy | `warrant` SPEC §4 — RFC 8785 JCS over I-JSON, integers only                                     | 47/47 vectors agree across Python, Go, Rust      |
| §5.1.3 parity fixtures                        | `warrant` `examples/canon-vectors.json`                                                         | normative artifact, harness-run                  |
| §5.1 content-addressed references             | `WarrantID = SHA-256(JCS(body))`, blobs by SHA-256                                              | in use                                           |
| §13.4.1.1 execution floor                     | `ski@v1` over Σ-GLYPH Book I v0.5 (hash-thunk machine)                                          | Lean proofs, multiple impls, conformance vectors |
| §13.4.3.1 hash-chained ordering               | warrant `prior` DAG                                                                             | in use                                           |
| §11.1.1 re-execution budget                   | `ski@v1` ATP bound + verifier-local budget, refusal ≠ verdict                                   | specified with vectors                           |
| §19.10 reference forgery                      | `warrant-sig-v1:` domain separation; small-order key rejection                                  | 18/18 domain-separation tests pass               |
| §12, §20.17 identity fork / rotation          | warrant SPEC §5.1 key state — rotation and revocation are warrants                              | specified (v0.3)                                 |
| §7.2.2 third-party attestation                | Σ-GLYPH Book III — "an annotation is an assertion, not a fact"; jurisdiction selection          | 40/40 federation differential agree              |
| §22 tranche ratification                      | `GOV-ANCHORS` v1.0.2 STANDARD — frozen schemas, content-pinned dependencies, multi-family gates | in force                                         |
| §6.2 laws with proof-grade evidence           | `sigma-glyph/proofs/` (EvalMachine, SizeBound, Sha256)                                          | Lean                                             |

The status column reports what was observed by running the repositories' own
harnesses on 2026-08-03, not what their documents claim. Reproducible from a
clean clone:

```sh
git clone https://github.com/s0fractal/warrant && cd warrant
python3 tests/differential.py        # DIFFERENTIAL: ALL AGREE (47/47 vectors)
python3 tests/domain_separation.py   # DOMAIN-SEPARATION: ALL PASS (18/18)

git clone https://github.com/s0fractal/sigma-glyph && cd sigma-glyph
python3 tests/federation_differential.py   # FEDERATION-DIFFERENTIAL: ALL AGREE (40/40)
```

The Lean proofs were not rebuilt. The `sigma-glyph/proofs/` row says "Lean"
rather than "proved" for that reason.

#### 17.1.1 Two decisions now have named candidates

- **Tranche A3 (canonical encoding).** `warrant`'s JCS profile is a concrete
  candidate rather than an open search. It resolves the float question by
  removing floats entirely, and bounds integers to ±(2^53−1) because RFC 8785
  serializes numbers through an IEEE-754 double and is lossy above that — the
  same failure §5.1.2 describes, found there by external review and fixed with
  vectors. Adopting it requires deciding how §6.4's probability simplex lives
  inside an integers-only domain; §5.1.2 now specifies the two admissible
  patterns and their canonical-form rules, so this tranche selects between them
  rather than facing an open question.
- **Tranche G4 (execution floor evaluator).** `ski@v1` (warrant SPEC §3.1, over
  Σ-GLYPH Book I v0.5) satisfies every requirement §13.4.1.1 states:
  deterministic across hosts, bit-exact across implementations, terminating by
  construction, work and peak memory bounded by a declared cost model, no
  ambient authority, canonical output identity. It additionally supplies the
  re-execution budget rule §11.1.1 needed and did not have. Its own spec makes
  the point this RFC makes about verification without trust: re-verifying a
  stranger's `ski@v1` reason is safe in a way re-running a stranger's shell
  script is not.

#### 17.1.2 What this does not settle

Naming candidates is not ratifying them. Specifically:

1. **The two stacks have separate key identities.** The `claude` voice key in
   `src/x2F38_voice_pubkeys.json` and the `claude-fable-5` key in the dyad's
   trust configuration are different Ed25519 keys. Whether the federation treats
   these as one actor with two keys, two actors, or an actor requiring a
   key-state rotation warrant to unify, is undecided and is an instance of
   §20.17 rather than an answer to it.
2. **Adoption direction is not implied.** That `warrant` solved the encoding
   question does not make it the federation's encoding; that is Tranche A3's
   decision, and the substrates that would have to implement it are not parties
   to this RFC.
3. **Version pinning is mandatory if adopted.** `ski@v1` names Book I v0.5
   specifically, and `GOV-ANCHORS` pins its dependencies by content hash for the
   stated reason that a STANDARD must not rest on a moving target. Any adoption
   here MUST pin the same way; citing a repository URL is not a pin.

---

## 18. Initial substrate responsibilities

This section is provisional.

### Trinity

- cross-substrate ontology negotiation;
- authority and warrant receipts;
- irreversible-boundary contracts;
- federated translation provenance;
- identity continuity attestations;
- genesis-handshake witnessing, without conferring meaning (§13.4.4).

### Myc

- proposal lifecycle;
- admission stages;
- witness collection;
- finality and publication;
- amendment and deprecation records.

### Omega

- deterministic state transition;
- executable geometry invariants where formalizable;
- algebraic-law property tests and their evidence;
- deterministic evaluation of the runtime path predicate (§15.0);
- mutation budget enforcement;
- replay, rollback, and falsifier execution;
- canonical transition receipts.

### Liquid

- semantic ontology structures;
- local geometry experiments;
- conflict and tension profiles;
- representational bottleneck hypotheses;
- evolving translation candidates.

These responsibilities are not exclusive. Cross-substrate checks are preferred
where independent verification is possible.

---

## 19. Security and failure modes

### 19.1 Conflict laundering

A new geometry may hide rather than resolve conflict. Admission MUST compare
original invariants and external outcomes.

### 19.2 Ontology inflation

The system may create unnecessary concepts and translators. Mutation budgets,
complexity limits, and deprecation are required.

### 19.3 Translator capture

A translator may systematically favor one agent's ontology. Federated mappings
SHOULD support independent translators, adversarial tests, and asymmetric loss
reports.

### 19.4 Confidence laundering

A weak translation may be treated as strong in a high-stakes action context.
Suitability MUST be action-specific.

### 19.5 Identity escape

An agent may change invariants to evade obligations. Identity mutation MUST
preserve constitutional history and continuity receipts.

### 19.6 Mutation loop

Repeated representation changes may consume unbounded resources. Mutation debt
and terminal outcomes are mandatory.

### 19.7 Geometry cosplay

Mathematical terms may be used without enforceable semantics. Contracts MUST
only claim operations actually implemented and tested.

### 19.8 False federation consensus

Agreement after lossy translation may be mistaken for shared meaning. Receipts
MUST retain ontology identities and loss profiles.

### 19.9 Fast-path laundering

An operation may be shaped to satisfy the §15.0 predicate so that a
consequential change executes without governance. Path selection MUST be
runtime-evaluated, receipt-recorded, and auditable in aggregate (§15.3).

### 19.10 Reference forgery

A truncated content address may be ground to collide, letting a receipt appear
to attest a different translator, geometry, or evidence bundle than the one that
ran. Short handles MUST NOT be load-bearing at admission, identity, trust, or
irreversible boundaries; full digests MUST accompany them (§5.1).

### 19.11 Profile downgrade

A state may be authored at `minimal` to avoid the cost of provenance and then
presented at a boundary requiring `full`. Boundaries MUST reject under-profiled
states rather than backfilling their metadata (§5.2).

### 19.12 Law assertion without evidence

A geometry may declare favorable algebraic laws it does not satisfy, inviting
callers to compose states in ways that silently corrupt them. Declared laws MUST
carry evidence, and asserted-only laws MUST NOT authorize composition across
translation or irreversible boundaries (§6.2).

### 19.13 Salami-slicing the budget

A mutation too large to admit may be split into N sub-budget mutations that each
pass individually. Cumulative mutation debt (§10.2) only defends against this if
the accumulator is scoped correctly, so **conflict lineage** MUST be defined:
mutations descend from the same lineage when they cite the same conflict, the
same bottleneck, or any mutation already in that lineage. Budgets accumulate
over the lineage, not over the individual proposal, and a proposal that declines
to declare its lineage MUST be rejected rather than treated as a fresh root.

Requiring the lineage to be _declared_ is not enough on its own: a proposer who
wants a fresh budget declares a fresh conflict, and the rule is satisfied while
being evaded. **Lineage MUST therefore be derived, not accepted as asserted.**

1. **Conflict identity is canonical (§19.16).** A conflict's identity is
   computed from its participants and violated invariants, so a "new" conflict
   with the same participants and the same violated invariants resolves to the
   **same identity** and joins the existing lineage whether or not the proposer
   wanted it to. Restating a conflict does not reset it.
2. **The bottleneck showing carries receipts.** §8.2.1 already requires evidence
   that two independent policies failed on the witness pair. Those failures have
   receipts, and the proposal MUST cite them by content address. A proposal
   claiming a fresh root while citing failure receipts already attached to an
   existing lineage is self-refuting, and the registry can see it.
3. **A new-root claim is a claim.** It MUST be checkable and MUST fail closed:
   where the registry can derive an existing lineage for the cited conflict
   identity, a contrary declaration is rejected rather than preferred.
4. **Rejected proposals stay in the lineage.** A lineage that forgot its
   rejections would let N attempts cost the same as one. Rejections are the part
   of the history the accumulator most needs.

What this does not achieve: it cannot detect a genuinely re-described conflict —
different participants, different invariants, same underlying problem stated in
new terms. That case is only reachable by review, and the honest position is
that the mechanism raises the cost of evasion rather than closing it.

### 19.14 Deprecation orphaning

Retiring a geometry (§11) can strand obligations expressed in it — compatibility
contracts, outstanding translation debt, invariants referenced by an identity
policy. Deprecation MUST enumerate its dependents and MUST NOT proceed to
`retired` while an unresolved obligation references it. A geometry may be
deprecated for new use while remaining resolvable for old receipts; the two are
different states and MUST NOT be conflated.

### 19.15 Tension laundering

`TensionProfile` fields are optional (§8.1), so omitting the one signal that
would block a decision is indistinguishable from that dimension being
irrelevant. A conflict record MUST distinguish `absent` from `not assessed`, and
a decision gated on a tension dimension MUST fail closed when that dimension is
`not assessed`.

### 19.16 Conflict duplication

Two substrates may register the same underlying conflict as two objects, so that
persistence counters, mutation limits, and lineage accounting each see half the
evidence — and a mutation limit is evaded by splitting the conflict rather than
the mutation. Conflicts MUST have a canonical identity derived from their
participants and violated invariants, and merging two records MUST produce a
merge receipt that preserves both histories rather than discarding one.

---

## 20. Open problems

The following are explicitly unresolved and MUST NOT be presented as completed
features:

1. How should representational gain be measured without reducing it to one
   scalar?
2. Which bottleneck signals reliably distinguish insufficient search from
   insufficient representation?
3. How can learned geometries expose stable, human- and machine-auditable
   invariants?
4. How should translation debt decay, compound, or trigger mandatory review?
5. What continuity test determines whether an identity amendment creates a
   successor agent?
6. How can independent agents negotiate mappings without a privileged global
   ontology?
7. Which mutation-budget terms can be made deterministic in Omega?
8. How should conflicting admission reports be reconciled across substrates?
9. Can a geometry be locally valid but federatively unacceptable?
10. Which irreversible boundaries require quorum, owner consent, or external
    witnesses?
11. Is there an order parameter that distinguishes a genuine representational
    transition from a run of ordinary failures, and does the percolation /
    phase-transition analogy survive being made measurable (§8.2.1)?
12. How large and how adversarial must a handshake fixture set be before
    behavioral agreement is evidence of shared meaning rather than coincidence
    (§13.4)?
13. Can a state's required profile (§5.2) be inferred from its declared
    downstream use, or must it remain an authoring-time decision that surfaces
    as a boundary refusal?
14. Is the five-element floor of §13.4.1 minimal, or does a different
    decomposition do the same work with less? Sufficiency is argued; minimality
    is not proven (§13.4.1.2).
15. Which canonical encoding should the federation adopt, and can exact-rational
    or fixed-point simplex representations be made efficient enough for the
    volumes the fast path assumes (§5.1.1)?
16. Are distinct substrate, distinct derivation, and distinct authority
    sufficient for policy independence, or can correlated failure survive all
    three (§8.2.3)?
17. What happens to a scoped compatibility contract when a party forks or amends
    its identity mid-contract — does the contract bind the predecessor, the
    successor, both, or lapse (§12, §13.2)? `warrant` SPEC §5.1 answers the
    narrower key-rotation case; the contract-binding case is still open, and the
    federation's two stacks currently hold separate keys for the same voice
    (§17.1.2).
18. How should a proposal bond be sized so that it deters verification-budget
    exhaustion without suppressing speculative but well-formed proposals
    (§11.1.1)?

---

## 21. Conformance levels

The levels are cumulative, and one dependency runs backwards if left unstated.
Level 4 compatibility contracts bind to a party identified by a key, but Level 5
is where identity may change — so a naive reading has agents contracting at L4
under an identity whose mutation rules only arrive at L5. **Stable key identity
is therefore an L0 requirement**, and §12's governed _change_ to identity is
what waits for L5. A compatibility contract binds to a snapshot of the
counterparty's invariant set, so a later amendment cannot silently rewrite what
was agreed; what happens to the contract when that party forks is open problem
§20.17.

### Level 0 — Declared geometry

- states declare geometry and ontology;
- validation and canonical serialization exist;
- **stable key identity exists and is verifiable**;
- references are content-addressed, with full digests where load-bearing;
- geometries declare their algebraic laws with evidence;
- geometries exposing `move` declare a typed delta space;
- invariants declare execution scope and cost class.

### Level 1 — Loss-aware translation

- translations produce structured loss profiles that compose by the declared
  algebras (§7.1.1, §7.2.1, §7.3.1);
- suitability is action-context dependent, and action-context suitability is
  fixture-measured or third-party attested, never self-reported;
- composed translators are first-class and carry round-trip anchor reports;
- translation debt is ledgered.

### Level 2 — Conflict-aware runtime

- conflicts are first-class;
- bottleneck hypotheses are explicit;
- stable disagreement is supported.

### Level 3 — Governed mutation

- mutation budgets exist, with `Cost` as a vector and a content-addressed cost
  model that makes admission replayable;
- experimental geometries use admission stages;
- proposal intake is bounded against verification-budget exhaustion;
- rollback and falsifiers are mandatory.

### Level 4 — Federated ontology protocol

- agents preserve separate ontology authority;
- translations are negotiated and receipted;
- irreversible boundaries use compatibility contracts bound to a snapshot
  invariant set;
- first contact uses the genesis handshake over a declared shared execution
  floor, with hash-chained message ordering, and mappings are credited only over
  the fixture-agreeing region;
- the §16.7 federated demo has been built and replays from receipts.

### Level 5 — Governed self-representation

- identity mutation policies are implemented;
- continuity and fork decisions are verifiable;
- representation evolution is reconstructible from public receipts.

---

## 22. Decision request

An earlier draft listed fifteen decisions as one flat request. That is not a
request anyone can answer: ratifying it means ratifying everything from content
addressing to identity policy in a single verdict, and rejecting any one item
blocks the rest. A governance process built on discrete proposals, cowitnesses,
and verdicts cannot act on a document that offers only an all-or- nothing.

The decisions are therefore grouped into **tranches**. Each tranche is
independently ratifiable, states what it depends on, and can be rejected without
voiding the others. Nothing outside a ratified tranche may be cited as agreed.

### Tranche A — Identity and encoding (no dependencies)

- **A1.** Make every protocol reference content-addressed, reusing
  `CANONICAL_HASH.v0.1`, and require full digests wherever a reference gates an
  irreversible boundary, admission, identity amendment, or trust computation.
- **A2.** Require a single canonical encoding meeting §5.1.1, with the float
  policy of §5.1.2 and cross-substrate parity fixtures per §5.1.3.
- **A3.** Commission `CANONICAL_ENCODING.v0.1` as a separate federation
  contract, selecting the encoding. This RFC states requirements and
  deliberately does not choose. A concrete candidate exists — `warrant` SPEC
  §4's JCS-over-I-JSON profile, with three agreeing implementations (§17.1.1) —
  whose open question is how the probability simplex lives inside an
  integers-only domain.
- **A4.** Require stable, verifiable key identity at Level 0.

Tranche A is a prerequisite for every other tranche. Until A2 and A3 land,
§5.1's guarantees do not hold across substrate boundaries and nothing that
depends on cross-substrate reference equality should be claimed.

### Tranche B — Geometry typing (depends on A)

- **B1.** Treat geometry as a first-class state type.
- **B2.** Require declared algebraic laws with evidence; asserted-only laws
  cannot authorize composition across a boundary.
- **B3.** Split the geometry contract into capability interfaces rather than
  optional methods, and require a typed delta space for `move`.
- **B4.** Require invariants to declare execution scope and cost class.
- **B5.** Derive `version` from the content-address DAG rather than declaring it
  independently.

### Tranche C — Translation and loss (depends on A, B)

- **C1.** Make structured translation loss mandatory; no scalar quality.
- **C2.** Adopt the loss monoid, suitability meet, and debt monoid of §7.1.1,
  §7.2.1, and §7.3.1.
- **C3.** Replace scalar translation confidence with contextual suitability
  profiles, and forbid self-reported action-context suitability.
- **C4.** Make composed translators first-class, with round-trip anchors
  measured against source canonical bytes.

### Tranche D — Conflict and bottleneck (depends on A)

- **D1.** Model conflict as a first-class ledger object with canonical identity.
- **D2.** Separate structural insufficiency from geometry mismatch, with the
  warrant-level witness pair and declared policy independence of §8.2.2–8.2.3.

### Tranche E — Mutation and admission (depends on A, B, D)

- **E1.** Require mutation budgets, with `Cost` as a vector.
- **E2.** Require a content-addressed cost model so admission decisions replay.
- **E3.** Introduce the staged Geometry Admission Protocol.
- **E4.** Bound proposal intake against verification-budget exhaustion.

### Tranche F — Runtime (depends on A, B)

- **F1.** Adopt state profiles so ceremony scales with consequence.
- **F2.** Adopt the two-path runtime with a runtime-evaluated, fail-closed,
  receipt-recorded path predicate.

### Tranche G — Federation (depends on A, C, and the execution floor)

- **G1.** Add federated ontology translation without requiring global ontology
  agreement.
- **G2.** Require explicit compatibility contracts at irreversible boundaries,
  bound to a snapshot invariant set.
- **G3.** Adopt the genesis handshake with the five-element floor of §13.4.1,
  behavioral grounding in a shared execution floor, and hash-chained ordering.
- **G4.** Select the execution floor's deterministic evaluator. `ski@v1` over
  Σ-GLYPH Book I v0.5 meets every requirement of §13.4.1.1 and is the standing
  candidate (§17.1.1); adoption MUST pin it by version and content.

### Tranche H — Identity (depends on A, and G for the fork case)

- **H1.** Add identity mutation policy as a constitutional primitive.

### Tranche I — Demonstration (depends on the tranches each demo exercises)

- **I1.** Implement the autonomy-versus-irreversibility demo (§16.1–16.5) before
  broader claims. Exercises D, E, F.
- **I2.** Implement the federated boundary-crossing demo (§16.7) before any
  claim that Levels 4–5 work. Exercises A, C, G.

### On splitting this document

A reviewer proposed decomposing this RFC into five documents along roughly these
tranche boundaries. The diagnosis behind that proposal is accepted — fifteen
entangled decisions are not ratifiable — and the tranches above are the
response.

The split itself is **deferred, not refused**. Splitting an unratified draft
into five unratified drafts multiplies the cross-references and the version skew
without making any decision easier, and the tranche boundaries have not yet been
tested against a real ratification attempt. The natural time to split is when a
tranche is ratified: a ratified tranche has a stable boundary and earns its own
document. Splitting first would fix the boundaries before anything has tested
them.

---

## 23. Final principle

The federation does not need one perfect geometry of thought.

It needs a disciplined way for different forms of state to coexist, translate,
conflict, evolve, and act together without erasing what makes them different.

The purpose of this RFC is not to make every reality commensurable. It is to
make the boundaries, losses, costs, and commitments of commensuration visible
and verifiable.
