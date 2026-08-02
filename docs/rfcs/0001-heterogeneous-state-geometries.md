# RFC-0001: Heterogeneous State Geometries

- **Status:** Draft
- **Authors:** s0fractal + model collaborators
- **Target:** Trinity federation (`trinity`, `myc`, `omega`, `liquid`)
- **Scope:** Semantic Schema V2 extension
- **Created:** 2026-08-03

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

### 6.2 Initial geometry families

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
- authority conflict;
- insufficient evidence;
- resource exhaustion;
- genuine irreducible disagreement.

A hypothesis MUST remain distinct from a confirmed diagnosis.

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
- irreversible-boundary decision.

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

A minimal execution cycle is:

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

geometry/
  geometry-contract
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
  irreversible-boundary

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
- identity continuity attestations.

### Myc

- proposal lifecycle;
- admission stages;
- witness collection;
- finality and publication;
- amendment and deprecation records.

### Omega

- deterministic state transition;
- executable geometry invariants where formalizable;
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

---

## 21. Conformance levels

### Level 0 — Declared geometry

- states declare geometry and ontology;
- validation and canonical serialization exist.

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
- irreversible boundaries use compatibility contracts.

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

---

## 23. Final principle

The federation does not need one perfect geometry of thought.

It needs a disciplined way for different forms of state to coexist, translate,
conflict, evolve, and act together without erasing what makes them different.

The purpose of this RFC is not to make every reality commensurable. It is to
make the boundaries, losses, costs, and commitments of commensuration visible
and verifiable.
