# RFC-0003: Heterogeneous State Geometries

- **Status:** Draft
- **Authors:** s0fractal + model collaborators
- **Target:** Trinity federation (`trinity`, `myc`, `omega`, `liquid`)
- **Scope:** Semantic Schema V2 extension
- **Created:** 2026-08-03
- **Revised:** 2026-08-03 (external critique round 1 — see
  `src/x2300_960790_claude_qwen-critique-rfc-0003-heterogeneous-state-geometries.myc.md`)
- **Supersedes:** nothing
- **Extends:** the federation's existing state, warrant, evidence, receipt, and
  lineage primitives

## 0. Abstract

This RFC specifies a federation-wide protocol for representing, translating,
comparing, and evolving heterogeneous state spaces without silently reducing all
states to one universal vector geometry.

The protocol introduces:

- geometry-typed states;
- explicit translation contracts with structural loss tracking;
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
   not the descriptor.
6. External content-addressing systems (IPLD/CID, and similar) MAY be used as a
   transport or storage projection. Doing so MUST NOT redefine the canonical
   digest — the CID is then a second encoding of the same identity, and receipts
   MUST record which encoding they used.

Lineage and provenance follow from this. Because `lineage` is a list of
content-addressed transformation references, and each transformation references
its input states, the derivation history of any state is a verifiable DAG rather
than a narrative recorded by whoever wrote the receipt.

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
interface Geometry<P, D, R> {
  id: GeometryId;
  version: string;

  validate(point: P): ValidationReport;
  compare(a: P, b: P, context: ComparisonContext): R;
  distance?(a: P, b: P, context: DistanceContext): D;
  move?(point: P, delta: unknown, context: MoveContext): MoveResult<P>;
  interpolate?(a: P, b: P, t: number): P;
  compose?(a: P, b: P): CompositionResult<P>;

  invariants(): InvariantDefinition[];
  supportedOperations(): OperationDescriptor[];
  forbiddenOperations(): ForbiddenOperation[];

  serialize(point: P): CanonicalBytes;
  deserialize(bytes: CanonicalBytes): ValidationResult<P>;
}
```

### 6.1 Contract rules

A geometry implementation MUST:

1. provide canonical serialization;
2. define validation rules;
3. declare supported and forbidden operations;
4. declare the invariants relevant to those operations;
5. version behavioral changes;
6. provide deterministic test fixtures for canonical operations;
7. fail closed on unsupported operations.

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
5. Law declarations are versioned with the geometry. Weakening a law is a
   behavioral change and MUST bump the version.

This makes the loss profile of an operation checkable before it runs, and gives
the registry something deterministic to reject.

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
   same state but that demand different actions;
3. evidence that at least two independent policies failed on that pair;
4. an argument that a cheaper remedy (search, evidence, translation, local
   policy) does not apply.

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
  evidence: EvidenceRef[];
};
```

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
  status: AdmissionDecision;
};
```

### 11.3 Required tests

An experimental geometry MUST be tested for:

- canonical serialization stability;
- operation determinism where promised;
- invariant preservation;
- migration round-trip behavior;
- translation loss visibility;
- rollback feasibility;
- conflict reduction without conflict concealment;
- effects on neighboring states and translators;
- complexity and resource bounds;
- external falsifiers relevant to the original problem.

A geometry MUST NOT be accepted solely because it reduces an internal conflict
score.

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

This RFC fixes that floor deliberately small and requires it to be
**non-semantic** — it carries no claims about the world, only about bytes and
authorship:

1. **Byte identity** — the canonical encoding and digest of §5.1. This lets both
   parties agree on _which object_ is under discussion without agreeing on what
   it means.
2. **Authorship** — signature verification and a key identity, so a statement
   can be attributed and later held against its author.
3. **Handshake vocabulary** — the small set of message kinds below, whose
   meanings are fixed by this RFC and are about the protocol, not the domain.
4. **Ordering discipline** — a way to say that one message preceded another, so
   negotiation state is well-defined.

Anything richer — concepts, relations, units, values, goals — is explicitly not
in the floor and MUST be established, not assumed.

#### 13.4.2 Grounding is behavioral, not definitional

Agents MUST NOT establish a mapping by exchanging definitions. Definitions are
circular for parties without shared vocabulary: each side reads the other's
words under its own ontology and concludes, wrongly, that it understood.

Mappings are instead grounded by **agreed behavior on shared fixtures**. One
party proposes a candidate correspondence and a set of deterministic cases; both
parties evaluate the cases independently under their own ontologies; the mapping
is credited only to the extent that the outcomes agree.

```ts
type HandshakeMessage =
  | { kind: "hello"; identity: KeyRef; floorVersion: string }
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

#### 13.4.4 Trinity's role, and what it is not

`trinity` MAY act as a witness to a handshake: holding fixture sets, recording
divergences, and issuing receipts that a third party can check. This is useful
because it makes the handshake auditable by someone who was not present.

`trinity` MUST NOT thereby become a privileged global ontology. Specifically it
MUST NOT define what the mapped concepts mean, arbitrate which ontology is
correct, or be required for a handshake between two agents that can reach each
other directly. A witness records what happened; it does not confer meaning.

#### 13.4.5 Honest limit

The floor in §13.4.1 is itself a minimal shared ontology. This RFC does not
claim to have eliminated pre-agreement — only to have reduced it to encoding,
authorship, ordering, and a fixed handshake vocabulary, and to have made that
residue explicit rather than tacit. Whether the floor can be reduced further, or
whether behavioral grounding alone can distinguish genuine agreement from
coincidental agreement on an unrepresentative fixture set, remains open (§20.6,
§20.12).

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
14. What audit signal reliably detects a miscalibrated fast-path predicate
    before it is exploited rather than after (§15.3)?

---

## 21. Conformance levels

### Level 0 — Declared geometry

- states declare geometry and ontology;
- validation and canonical serialization exist;
- references are content-addressed, with full digests where load-bearing;
- geometries declare their algebraic laws with evidence.

### Level 1 — Loss-aware translation

- translations produce structured loss profiles;
- suitability is action-context dependent;
- translation debt is ledgered.

### Level 2 — Conflict-aware runtime

- conflicts are first-class;
- bottleneck hypotheses are explicit;
- stable disagreement is supported.

### Level 3 — Governed mutation

- mutation budgets exist;
- experimental geometries use admission stages;
- rollback and falsifiers are mandatory.

### Level 4 — Federated ontology protocol

- agents preserve separate ontology authority;
- translations are negotiated and receipted;
- irreversible boundaries use compatibility contracts;
- first contact uses the genesis handshake, and mappings are credited only over
  the fixture-agreeing region.

### Level 5 — Governed self-representation

- identity mutation policies are implemented;
- continuity and fork decisions are verifiable;
- representation evolution is reconstructible from public receipts.

---

## 22. Decision request

This RFC requests agreement on the following initial decisions:

1. Treat geometry as a first-class state type.
2. Make structured translation loss mandatory.
3. Replace scalar translation confidence with contextual suitability profiles.
4. Model conflict as a first-class ledger object.
5. Require mutation budgets before representation changes.
6. Introduce a staged Geometry Admission Protocol.
7. Add identity mutation policy as a constitutional primitive.
8. Add federated ontology translation without requiring global ontology
   agreement.
9. Require explicit compatibility contracts at irreversible boundaries.
10. Implement the autonomy-versus-irreversibility demo before broader claims.
11. Make every protocol reference content-addressed, reusing
    `CANONICAL_HASH.v0.1` and requiring full digests where load-bearing.
12. Require geometries to declare algebraic laws with evidence, and split the
    geometry contract into capability interfaces rather than optional methods.
13. Adopt state profiles so that protocol ceremony scales with consequence
    rather than with volume.
14. Adopt the two-path runtime with a runtime-evaluated, fail-closed, and
    receipt-recorded path predicate.
15. Adopt the genesis handshake, with behavioral grounding on shared fixtures
    and an explicitly stated non-semantic floor.

---

## 23. Final principle

The federation does not need one perfect geometry of thought.

It needs a disciplined way for different forms of state to coexist, translate,
conflict, evolve, and act together without erasing what makes them different.

The purpose of this RFC is not to make every reality commensurable. It is to
make the boundaries, losses, costs, and commitments of commensuration visible
and verifiable.
