# RFC-0003: Heterogeneous State Domains

- **Status:** Draft
- **Authors:** s0fractal + model collaborators
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0003-heterogeneous-state-geometries.md`. Every path this document
  cites without a repository is relative to that repository; everything outside
  it is listed with its repository in §17.1.
- **Filename note:** the path still says `geometries`. The title no longer does,
  for the reason given in §4.2 — partial orders and constraint systems are not
  geometries, and the document was carrying its own decorative metaphor in its
  name. The path is stable because committed ledger records reference it.
- **Target:** Trinity federation (`trinity`, `myc`, `omega`, `liquid`)
- **Scope:** Semantic Schema V2 extension
- **Created:** 2026-08-03
- **Revised:** 2026-08-03 (external critique rounds 1–4 — see
  `src/x2300_960790_claude_qwen-critique-rfc-0003-heterogeneous-state-geometries.myc.md`,
  `src/x2300_960792_claude_kimi-critique-rfc-0003-encoding-floor-and-self-certification.myc.md`,
  `src/x2300_960796_claude_qwen-round3-simplex-encoding-and-derived-lineage.myc.md`,
  `src/x2300_960798_claude_chatgpt-critique-state-domains-and-evidence-bridge.myc.md`)
- **Supersedes:** nothing
- **Extends:** the federation's existing state, warrant, evidence, receipt, and
  lineage primitives

## 0. Abstract

This RFC specifies a federation-wide protocol for representing, translating,
comparing, and evolving heterogeneous state spaces without silently reducing all
states to one universal vector space.

The protocol introduces:

- domain-typed states over content-addressed references and one canonical
  encoding, with geometric structure as one capability rather than the frame;
- composite states, so that a probability distribution, a causal graph, a
  temporal order, and an identity invariant can form one agent state with
  declared couplings;
- explicit translation contracts with structural loss tracking, composed by
  declared algebras — and translation separated from enrichment, inference,
  reconstruction, and negotiation, which acquire information rather than
  carrying it;
- evidence bridges, so that a normative policy cannot masquerade as a semantic
  correspondence;
- first-class conflicts and representational bottlenecks;
- mutation budgets for ontology and domain changes, with admission split into
  eligibility that replays and authorization that is attributed;
- an admission protocol for experimental state domains;
- identity policies for governed self-change;
- a disclosure layer, so that auditability and confidentiality are not a choice
  of one;
- federated ontology negotiation between agents and substrates;
- consensus only at consequential or irreversible action boundaries.

The proposal does **not** claim that cognition has one correct topology, that a
a new domain guarantees novelty, or that an LLM can reliably invent valid
ontologies. Its narrower claim is operational:

> Every state representation makes structural assumptions. Those assumptions,
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

### 2.1 There is no required universal domain

The system MUST NOT assume that every state can be faithfully represented in a
single Euclidean latent space, knowledge graph, reward function, or universal
schema.

### 2.2 The domain is part of the state type

A state is not only a value. It includes the laws under which the value can be
validated, compared, transformed, and transported.

### 2.3 Translation is never silently lossless

Every cross-domain or cross-ontology translation MUST report preserved
invariants, lost structure, introduced assumptions, unresolved ambiguity, and
action-context suitability.

### 2.4 Persistent conflict is evidence

Repeated inability to satisfy constraints MAY indicate a missing variable,
invalid abstraction, incompatible timescale, translation loss, or genuinely
irreducible disagreement.

### 2.5 Representation changes consume resources

Ontology and domain mutations incur compute, migration, verification,
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
- a requirement that all substrates implement all domain families;
- a guarantee that every conflict has a representational resolution.

A conforming implementation MAY support only a small domain registry. The
essential requirements are explicit typing, explicit translation, explicit loss,
bounded mutation, and ledgered acceptance.

---

## 4. Terminology

### 4.1 State

A value interpreted under a domain and ontology, with provenance, uncertainty,
invariants, and lineage.

### 4.2 State domain

A contract defining valid points and admissible operations for a state family.
Discrete symbolic states, graphs, partial orders, constraint systems,
probability spaces, and manifolds are all state domains.

**On the word "geometry".** Earlier drafts called this a _geometry_ and then
defined the term broadly enough to include partial orders and constraint
systems, which are not geometries by any usage that constrains anything. That
made the document's foundational type a decorative metaphor — while §19.7
forbade exactly that, and while the document was busy refusing `TensionTensor`
for the same reason. The smaller borrowed word was killed and the larger one
kept, because it was in the title.

`Geometric` is now one **capability** a state domain may have (§6.3): a domain
with a notion of movement along a delta and transport between points. A domain
may be metric without being geometric, ordered without being metric, and none of
those without ceasing to be a state domain.

The document retains its filename for the reason `docs/COORDINATES.md` gives for
coordinates generally — identity is by role, and committed ledger records
reference this path. The title is corrected; the path is stable.

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

A change to a state domain, ontology, translation, invariant set, or identity
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
type DomainId = string;
type OntologyId = string;
type InvariantId = string;
type EvidenceRef = string;
type AgentId = string;
type SubstrateId = "trinity" | "myc" | "omega" | "liquid" | string;

type TypedState<G, V> = {
  id: StateId;
  domain: DomainRef<G>;
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

A conforming state MUST identify its domain and ontology. It MUST NOT rely on
out-of-band convention to determine whether a numeric array is an embedding,
probability vector, coordinate, ordered tuple, or arbitrary payload.

### 5.1 Reference identity is content-addressed

Every `Ref` in this document (`DomainRef`, `OntologyRef`, `InvariantRef`,
`EvidenceRef`, `TransformationRef`, `TranslatorRef`) is a **reference to an
immutable object**, not a mutable name. The protocol's audit guarantees depend
on it: a receipt that records "translated under translator T" is worthless if
`T` can be edited afterwards.

References MUST therefore be content-addressed:

1. Every referenced object MUST have a canonical byte encoding. For domain
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
   the same domain and ontology MUST resolve to the same reference bytes, so the
   shared descriptor is stored once and the per-state cost is the reference, not
   the descriptor. A descriptor that is itself large — an ontology, a complex
   invariant set — MAY be composed of content-addressed parts, so that a
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

Because `lineage` is a list of content-addressed transformation references, and
each transformation references its input states, the derivation history of any
state forms a DAG whose **integrity** is verifiable.

#### 5.1.0 What content addressing does and does not give

An earlier draft went further and said the derivation history is "a verifiable
DAG rather than a narrative recorded by whoever wrote the receipt". That
overstates it, and the overstatement is the kind that gets designed against
rather than noticed: a hash DAG can be cryptographically perfect and still be a
narrative.

These properties are distinct and MUST NOT be conflated:

| Property                    | Given by content addressing? | What actually establishes it                                                                       |
| --------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| **Content integrity**       | yes                          | the digest                                                                                         |
| **Stable byte identity**    | yes                          | canonical encoding (§5.1.1)                                                                        |
| **Tamper evidence**         | yes                          | any edit changes the address                                                                       |
| **Deduplication**           | opportunity only             | a store that chooses to share                                                                      |
| **Authorship**              | no                           | signatures over the reference (§19.10)                                                             |
| **Provenance completeness** | **no**                       | attestation that the input set is total                                                            |
| **Provenance truthfulness** | **no**                       | independent re-derivation, witnesses                                                               |
| **Availability**            | **no**                       | a store commitment, and someone to hold it                                                         |
| **Semantic identity**       | **no**                       | the encoding rules; different bytes may mean the same thing and this is deliberate (§5.1.1 rule 5) |

The consequential gaps:

1. **A transformation can omit an input.** Nothing in the digest reveals that a
   fourth evidence blob was consulted and left out of `evidence[]`. The DAG is
   intact and the account is incomplete. Only an attestation that the declared
   input set is exhaustive — or an independent re-derivation reaching the same
   output — establishes completeness, and both are outside the hash.
2. **A reference can be unresolvable.** An address proves what the bytes _were_
   if you find them; it does not produce them. A lineage of addresses nobody
   retains is a chain of names. Availability MUST be a declared commitment where
   receipts depend on it, and §14's verifier questions are unanswerable without
   one.
3. **Equal meaning is not equal bytes.** Two encodings may denote the same value
   — this is why §5.1.1 rule 5 refuses normalization — so equal addresses imply
   equal content, and unequal addresses imply nothing about meaning.

Content addressing is load-bearing here and it is load-bearing for exactly one
thing: it makes tampering detectable and identity stable, so that everything
built on top — signatures, attestations, re-derivation — has something fixed to
be about. Treating it as also delivering honesty or completeness is how a system
ends up with an unfalsifiable audit trail.

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
proposes a probability simplex as a first-class domain (§6.4), so it walks
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
5. A state domain MAY use floating point internally. The obligation is at the
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

For `fixed`, `scale` MUST be declared by the state domain rather than per value,
and all values in one domain MUST share it — otherwise comparing two points
means rescaling, and rescaling reintroduces the rounding the rule exists to
remove.

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
contract with its own test vectors rather than a clause inside a state domain
proposal. It is filed as decision request §22 Tranche A3 and open problem
§20.15.

Until that contract exists, §5.1 is specified but not yet implementable across
substrate boundaries, and this document does not pretend otherwise.

### 5.2 Metadata weight and state profiles

The `TypedState` shape above is heavy. Carrying domain, ontology, uncertainty,
invariants, provenance, and lineage on every high-frequency internal value would
cost more than the values themselves, and a protocol whose ceremony is
unaffordable is a protocol that gets bypassed at the point it matters.

The weight is therefore mitigated by structure, not by dropping fields:

1. **Shared descriptors are referenced, not embedded.** By §5.1, a million
   states in one domain carry one domain descriptor and a million pointers.
2. **A state MAY declare a profile** that fixes which fields are materialized:

```ts
type StateProfile = "minimal" | "tracked" | "full";
```

- `minimal` — domain and ontology references plus value. Permitted only for
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

## 6. State domain contract

The base contract is deliberately small. It carries only what every state family
needs regardless of its structure: identity, validation, canonical bytes,
declared invariants, and declared laws.

```ts
interface StateDomain<P> {
  id: DomainId;
  address: ContentAddress; // identity; see §6.2.1
  version: VersionLabel; // derived projection, not an assertion

  validate(point: P): ValidationReport;
  laws(): AlgebraicLaws;
  invariants(): InvariantDefinition[];
  supportedOperations(): OperationDescriptor[];
  forbiddenOperations(): ForbiddenOperation[];

  serialize(point: P): CanonicalBytes;
  deserialize(bytes: CanonicalBytes): ValidationResult<P>;
}
```

Everything else is a capability, declared separately and checkable separately:

```ts
interface Comparable<P, R> extends StateDomain<P> {
  compare(a: P, b: P, context: ComparisonContext): R;
}

interface Ordered<P> extends StateDomain<P> {
  order(a: P, b: P): PartialOrder; // MAY return `incomparable`
}

interface Metric<P, D> extends StateDomain<P> {
  distance(a: P, b: P, context: DistanceContext): D;
  // metricAxioms MUST be declared in laws() — §6.2 rule 3
}

interface Interpolable<P> extends StateDomain<P> {
  interpolate(a: P, b: P, t: UnitInterval): P;
}

interface Composable<P> extends StateDomain<P> {
  compose(a: P, b: P): CompositionResult<P>;
}

interface Geometric<P, Delta> extends StateDomain<P> {
  move(point: P, delta: Delta, context: MoveContext): MoveResult<P>;
  transport(delta: Delta, from: P, to: P): TransportResult<Delta>;
  deltaDescriptor(): DeltaDescriptor;
}
```

`Geometric` is the capability that earned the old name: a domain in which points
can be moved along a delta and a delta can be carried from one point to another.
A temporal partial order is `Ordered` and not `Geometric`. A probability simplex
is `Metric` and `Interpolable` and, under an information geometry, `Geometric` —
but only if it implements and tests transport, not because the phrase exists.

This also removes an accident of the earlier single-interface form:
`Geometry<P,
Delta, D, R>` forced every domain to name a delta type, a distance
type, and a comparison type whether or not it had any of them, which is how
`delta: unknown` got there in the first place.

The `Delta` parameter is not decoration. In an earlier draft this was
`delta: unknown`, which made `move` an untyped hole in an otherwise typed
contract and violated §5's own rule against out-of-band convention: nothing said
whether a delta was a tangent vector, an edit script, a permutation, or an
arbitrary payload. A state domain exposing `move` MUST declare a
`DeltaDescriptor` with its own content address, giving the delta space the same
canonical encoding and validation obligations as the point space.

### 6.1 Contract rules

A state domain implementation MUST:

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
4. A predicate MUST be content-addressed, and deterministic **relative to its
   declared inputs** — see §6.1.2.

#### 6.1.2 Context is an input, not a contaminant

An earlier draft required predicates to be deterministic and added that an
invariant whose meaning depends on when or where it ran cannot support a
receipt. The second half is false as stated, and it forbids most of the
invariants this document actually cares about.

`no_unverified_irreversible_write` depends on authority state. A budget
invariant depends on the budget. A compatibility-contract invariant depends on
which contract is active. An invariant over witness quorum depends on who is
currently a witness. None of these are expressible over a state in isolation,
and all of them are the ones a boundary most needs to check.

The remedy is not to ban context. It is to **make context an explicit,
content-addressed input**, so the predicate is a function again:

```ts
type InvariantEvaluation = {
  predicate: PredicateRef;
  state: StateRef;
  transition?: TransitionRef; // required at `transition` scope
  trace?: TraceRef; // required at `trace` scope
  worldSnapshot: SnapshotRef; // environment the predicate may read
  authoritySnapshot: AuthorityRef; // who held what authority
  evaluatedAtLogicalStep: SequenceRef; // ordering, not wall-clock
  result: ValidationReport;
};
```

Rules:

1. An `InvariantDefinition` MUST declare which context surfaces its predicate
   reads. A predicate that reads a surface it did not declare is non-conforming,
   which is checkable by evaluating it against a snapshot that omits the
   undeclared surface.
2. Evaluation MUST be reproducible: the same predicate over the same state and
   the same snapshots MUST produce the same report, on any substrate.
3. Receipts MUST record the snapshot addresses, not just the verdict. "The
   invariant held" is unverifiable; "the invariant held against these bytes" is
   replayable.
4. `evaluatedAtLogicalStep` is a sequence reference, not a timestamp. Wall-clock
   time MAY appear _inside_ a world snapshot as data; it MUST NOT be read
   ambiently by a predicate, because a predicate that reads the clock produces a
   different answer on replay and the receipt becomes unfalsifiable.
5. A stale snapshot is a real failure mode: an invariant that held against a
   snapshot no longer current has not been shown to hold now. Boundaries MUST
   declare a freshness requirement, and a snapshot failing it MUST be treated as
   `not assessed` rather than as `held`.

A state domain MUST NOT expose `distance`, `interpolate`, or `average` merely to
satisfy a generic interface. If the operation has no coherent meaning, it MUST
be absent or explicitly forbidden.

### 6.2 Declared algebraic laws

Listing operations is not enough. Two state domains can expose the same
`compose` signature and still disagree about whether composition may be
reordered, repeated, or undone. A caller that assumes the wrong answer corrupts
state without any type error.

A state domain MUST therefore declare the laws its operations obey:

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
  status: LawStatus;
  scope: "total" | "partial";
  precondition?: PredicateRef;
};

type LawStatus =
  | { kind: "proved"; proof: EvidenceRef; checker: ContentAddress }
  | {
    kind: "tested";
    generator: GeneratorRef; // content-addressed, so the domain of generation is inspectable
    domain: PredicateRef; // what the generator actually covers
    cases: number;
    seed: string;
    ref: EvidenceRef;
  }
  | { kind: "asserted"; author: AgentId }
  | { kind: "falsified"; counterexample: FixtureRef };
```

**There is no `holds: boolean`, deliberately.** An earlier draft had one, with
evidence attached beside it — which let a property test and a machine-checked
proof both set the same flag to `true`. A property test does not establish that
a law holds. It establishes that _no counterexample was found by a particular
generator over a particular domain in a particular number of cases_, which is a
different statement and a weaker one, and the difference is exactly what matters
for associativity, the triangle inequality, invertibility, and monotonicity —
where the counterexamples live in the corners a naive generator does not reach.

Collapsing proof strength into a boolean is the move this document forbids
everywhere else: §7.1's refusal of scalar translation quality, §7.2.1's refusal
of scalar suitability, §10.1.1's refusal of scalar cost. It survived here
because the flag looked like bookkeeping rather than like a claim.

Rules:

1. A declared law is a **claim**, not a permission to trust. `status` carries
   the epistemic strength; there is no separate assertion of truth to disagree
   with it.
2. **A policy MUST state the minimum status each boundary requires**, rather
   than this document fixing one bar for all of them. The floor: `asserted` laws
   MUST NOT authorize composition across a translation boundary or an
   irreversible boundary; `falsified` laws MUST NOT authorize anything and MUST
   fail closed wherever the law is relied on.
3. `tested` MUST record the generator and the domain it covers, both
   content-addressed. A test whose generation domain is unstated cannot be
   assessed by a reader and is `asserted` with extra steps.
4. `metricAxioms` MUST be declared by any domain exposing `distance`. A
   similarity score that violates the triangle inequality is not a metric and
   MUST NOT be presented as one.
5. A composition of two states MUST NOT be admitted when the composed state
   domains declare incompatible laws for the operation being used, or when
   either declares the relevant law `falsified`.
6. Law declarations are part of the state domain's canonical bytes (§5.1.1).
   Weakening a law — including downgrading its status — therefore changes the
   state domain's content address by construction, see §6.2.1.
7. A law moving to `falsified` is not an error to suppress. It is the most
   informative event in this section, and the counterexample MUST be retained as
   a fixture.

This makes the loss profile of an operation checkable before it runs, and gives
the registry something deterministic to reject.

#### 6.2.1 Version is derived, not declared

The `version: string` field in §6 and the content addressing of §5.1 are two
identity systems for one object, and two sources of truth drift. A state domain
whose laws were weakened without its author remembering to bump the string is
exactly the case the versioning existed to catch, and it is the case a manual
field will miss.

Therefore:

1. A state domain's **identity is its content address**. Two state domains with
   different canonical bytes are different state domains, whatever their version
   strings say.
2. `version` MUST be a **projection of the version DAG**, not an independent
   assertion. Each release records its predecessor's content address, and the
   version string is a human-readable label computed from that history.
3. A registry MUST reject a state domain whose declared version conflicts with
   its position in the DAG — for example, a label claiming a patch increment
   across a change that weakened a law.
4. Receipts MUST record the content address. They MAY additionally record the
   label for legibility. A receipt carrying only a version string does not
   identify what ran.

The version string is thus a convenience for humans reading a ledger. Nothing
verifies against it.

### 6.3 Capability splitting

§6 states the contract as a small base plus separate capabilities. This section
says why the alternative — one interface with optional members — is inadequate,
since that is what earlier drafts had.

Optional methods are a weak defense: an implementer under schedule pressure can
satisfy them with a stub that returns a plausible number, and nothing in the
type system objects. This is the `vocabulary cosplay` failure mode (§19.7)
arriving through the front door.

A capability-split contract makes a state domain that cannot interpolate
**unable to be passed** where interpolation is required, rather than merely
expected to decline at runtime. A domain declares the capabilities it
implements; the registry rejects a declared capability that is absent and an
implemented capability that is undeclared (§6.3.1).

In a language with traits or typeclasses this is structural. A Rust projection
would look roughly like:

```rust
pub trait StateDomain {
    type Point;
    fn id(&self) -> DomainId;
    fn version(&self) -> Version;
    fn validate(&self, p: &Self::Point) -> ValidationReport;
    fn laws(&self) -> AlgebraicLaws;
    fn serialize(&self, p: &Self::Point) -> CanonicalBytes;
    fn deserialize(&self, b: &CanonicalBytes) -> Result<Self::Point, DecodeError>;
}

pub trait Metric: StateDomain {
    fn distance(&self, a: &Self::Point, b: &Self::Point, cx: &DistanceContext) -> Scalar;
}

pub trait Interpolable: StateDomain {
    fn interpolate(&self, a: &Self::Point, b: &Self::Point, t: UnitInterval) -> Self::Point;
}

pub trait Composable: StateDomain {
    fn compose(&self, a: &Self::Point, b: &Self::Point) -> CompositionResult<Self::Point>;
}

// A planner that averages states cannot accept a temporal partial order:
// the bound is checked at compile time, not apologized for at runtime.
fn midpoint<G: Interpolable>(g: &G, a: &G::Point, b: &G::Point) -> G::Point {
    g.interpolate(a, b, UnitInterval::HALF)
}
```

A temporal partial order implements `StateDomain` and never `Interpolable`, so
`midpoint` cannot be instantiated for it. The cosplay risk is removed by
construction instead of by review.

A temporal partial order implements `StateDomain` and `Ordered`, never
`Interpolable`, so `midpoint` cannot be instantiated for it. The cosplay risk is
removed by construction instead of by review.

#### 6.3.1 Declared capabilities are checked

Where the host language cannot express this (dynamic registries, cross-language
adapters, opaque external state domains), the registry MUST enforce the same
rule at admission: a state domain that declares a capability it does not
implement, or implements one it did not declare, MUST be rejected. Both
directions matter — an undeclared capability is a surface consumers cannot
reason about, and a declared-but-absent one is a promise that fails at the worst
moment.

### 6.4 Initial domain families

The federation MAY begin with the following, listed with the capabilities each
would actually carry:

| Family                  | Capabilities beyond the base            |
| ----------------------- | --------------------------------------- |
| Euclidean vector space  | `Metric`, `Interpolable`, `Geometric`   |
| Probability simplex     | `Metric`, `Interpolable`, `Geometric`†  |
| Temporal partial order  | `Ordered`                               |
| Causal directed graph   | `Ordered`, `Composable`                 |
| Symbolic discrete state | `Comparable`                            |
| Constraint region       | `Ordered` (by refinement), `Composable` |
| Hierarchy / hyperbolic  | `Metric`, `Ordered`, `Interpolable`     |
| Spherical orientation   | `Metric`, `Interpolable`, `Geometric`   |
| Product domain          | derived from components (§6.5)          |
| Opaque external domain  | none, plus a verifier adapter           |

† only under a declared information geometry with transport implemented and
tested — not by naming one.

The point of the table is that the column is mostly empty. Half these families
have no metric and no notion of movement, and the old single interface invited
every one of them to pretend otherwise.

These families are examples, not a normative completeness claim.

### 6.5 Composite state

`TypedState` (§5) holds one value, in one domain, under one ontology. That is
the right shape for a single quantity and the wrong shape for the thing this RFC
was written about.

The founding observation in §1 is that an agent simultaneously holds a
probability distribution, a causal graph, a temporal order, an identity
invariant, an intent, and a resource state — and that flattening them into one
representation is what destroys meaning. A registry of well-typed single states
does not by itself say how those states form **one** agent state. Product domain
was listed as a family (§6.4) and given no contract, which left the central case
described and unspecified.

```ts
type CompositeState = {
  id: StateId;
  components: Record<RoleId, TypedStateRef>;
  couplings: CouplingRef[];
  globalInvariants: InvariantRef[];
  consistencyModel: ConsistencyModelRef;
  address: ContentAddress;
};
```

A `RoleId` names what a component _is for_ in the composite — `belief`,
`causal-model`, `schedule`, `budget` — not what domain it lives in. Two
composites with the same roles filled by different domains are comparable at the
role level, which is what makes substitution discussable.

#### 6.5.1 Three compositions

**Product.** Components coexist independently. Validity of the composite is
exactly the conjunction of component validities; an update to one cannot
invalidate another. This is the cheap case and MUST NOT be assumed — it is a
claim that there are no couplings, and it is checkable.

**Dependent.** The admissibility of one component depends on the value of
another: a schedule is valid only under a given resource state, a plan only
under a given causal model. Dependency is directed and MUST be declared, because
the direction determines evaluation order and what a partial update invalidates.

```ts
type Coupling =
  | { kind: "dependent"; from: RoleId; to: RoleId; admissibility: PredicateRef }
  | { kind: "coupled"; roles: RoleId[]; transition: TransitionRef }
  | { kind: "shared-invariant"; roles: RoleId[]; invariant: InvariantRef };
```

**Coupled.** A change in one component _induces_ transitions in others — a
revised causal model forces a revised plan. Coupled composition is the only kind
that can fail to converge, so it MUST declare a consistency model:

```ts
type ConsistencyModel =
  | { kind: "atomic" } // all components move together or none do
  | { kind: "eventual"; convergence: PredicateRef; bound: BudgetLimit }
  | {
    kind: "bounded-divergence";
    measure: MeasureRef;
    tolerance: ThresholdRef;
  };
```

#### 6.5.2 Rules

1. A composite MUST declare its couplings. An undeclared coupling is the
   composite-level form of an undeclared assumption, and produces states that
   appear valid component-wise while violating a relation nobody wrote down.
2. **Global invariants are not the conjunction of component invariants.** A
   composite MAY hold invariants that no component can express alone — that a
   plan's schedule respects the causal order, that a belief's support is a
   subset of the resource state's reachable set. These MUST be declared at the
   composite and evaluated at `trace` or `transition` scope where required
   (§6.1.1).
3. A component MUST NOT be updated through a path that bypasses the composite's
   coupling evaluation. Where the fast path (§15.0) touches a component of a
   coupled composite, the operation is not fast-path eligible.
4. Translation of a composite (§7) is translation of components **plus** the
   couplings. A translator that maps every component faithfully and drops the
   couplings has produced a set of correct states that is not the same state,
   and MUST report the couplings it could not carry as `lost`.
5. A composite has its own content address, derived from its components'
   addresses and its couplings — so that two composites with identical parts and
   different couplings are different objects.

#### 6.5.3 What is not specified

Whether composition is associative — whether a composite of composites flattens
— is left open (§20.19). The obvious answer is yes for product and no for
coupled, but "obvious" is not the standard this document holds elsewhere, and
nothing here yet needs the answer.

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

The earlier draft had a monotonicity rule and, in §13.4, a negotiation protocol,
and did not notice they contradict. Under one document a step that improves
suitability is a bug; under another it is the mechanism. Left as-is, every
competent implementation would either violate the monoid or bury the enrichment
inside `introducedAssumptions`, where it would be indistinguishable from a
fabrication.

The five kinds are therefore distinguished, and each carries different
obligations:

| Kind             | New information from | Monotone loss | May cross irreversible boundary                    |
| ---------------- | -------------------- | ------------- | -------------------------------------------------- |
| `translation`    | nothing              | **required**  | yes, per suitability                               |
| `enrichment`     | cited evidence       | not required  | yes, if sources are attested                       |
| `inference`      | declared rules       | not required  | only if rules are content-addressed and replayable |
| `reconstruction` | assumption           | not required  | **no** — §7.0.2                                    |
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
3. A pipeline mixing kinds is classified by its **weakest** member, in the order
   above. One reconstruction step makes the pipeline a reconstruction, however
   many faithful translations surround it.
4. `enrichment` sources MUST be content-addressed and independently resolvable.
   "The model knew this" is not a source.
5. `inference` MUST record the rules by content address. An inference whose
   rules are a model's weights is not replayable and MUST be declared
   `replayable: false`, which bars it from irreversible boundaries under rule 6.

#### 7.0.2 Reconstruction is the dangerous one

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
- domain mismatch;
- structural insufficiency;
- authority conflict;
- insufficient evidence;
- resource exhaustion;
- genuine irreducible disagreement.

A hypothesis MUST remain distinct from a confirmed diagnosis.

#### 8.2.1 Domain mismatch versus structural insufficiency

These two are deliberately separated because they license different responses.

- **Domain mismatch** — the participants hold states in different state domains
  and the conflict is an artifact of comparing them. A translation, a shared
  target domain, or a corrected suitability judgment resolves it. No new
  representation is needed; one already exists in the registry.
- **Structural insufficiency** — no state domain available in the registry can
  hold the distinction the conflict requires. More evidence, more search, and
  better translation will not resolve it, because the required distinction is
  not expressible. This is the only conflict hypothesis that directly licenses a
  mutation proposal under §9 and §10.

A diagnosis of structural insufficiency MUST show that the distinction is
inexpressible, not merely inconvenient. The minimum showing is:

1. an explicit statement of the distinction the current registry cannot make;
2. a witness pair — two situations the current representation maps to the same
   state, which either **require different warrants** or **behave measurably
   differently** (§8.2.2); the class of pair bounds how far the resulting
   mutation may be promoted;
3. evidence that at least two **independent** policies failed on that pair
   (§8.2.3);
4. an argument that a cheaper remedy (search, evidence, translation, local
   policy) does not apply.

#### 8.2.2 What makes a witness pair

An earlier draft said the two situations must "demand different actions". That
is a normative claim with no owner: whoever wants the mutation gets to assert
that the actions ought to differ, and the requirement collapses into a
preference.

The correction went one step too far. Requiring the pair to differ at the level
of **warrants** — different authority, different evidence, different
reversibility handling — is checkable rather than argued, and it cannot be
satisfied by an agent that merely prefers a different outcome. But it quietly
makes the authority ontology the privileged reality: a distinction is only real
if governance already treats it as real, which is a rule that can never
recognize a gap governance has not yet noticed.

That is wrong for exactly the case §9 exists to catch. Two states can differ in
what they predict, what they cause, what experiment distinguishes them, or how
they behave in the environment, and require no different warrant today. A
representation that conflates them is deficient whether or not the authority
rules have caught up.

There are therefore **two classes of witness pair, licensing different things**:

```ts
type WitnessPair =
  | {
    kind: "warrant";
    a: SituationRef;
    b: SituationRef;
    divergentWarrants: WarrantRef[]; // differ in authority, evidence, or reversibility
  }
  | {
    kind: "behavioral";
    a: SituationRef;
    b: SituationRef;
    divergence: BehavioralDivergence; // prediction, causal consequence, or measured outcome
    discriminatingTest: FixtureRef; // the experiment that separates them
  };
```

- A **warrant witness pair** licenses governed mutation in production semantics.
  The substrate's own authority rules already distinguish the situations, so a
  representation that cannot is failing at something the federation is already
  committed to.
- A **behavioral witness pair** licenses **sandboxed exploration only** (§11's
  `sandboxed` and `experimentally validated` stages). It MUST NOT by itself
  authorize local acceptance, federated sharing, or canonical status. Promotion
  past the sandbox requires either that the behavioral divergence has since
  produced a warrant-level consequence, or an explicit governance decision to
  adopt on behavioral grounds — recorded as such, with its own receipt.

A behavioral pair MUST supply a `discriminatingTest`: a fixture that separates
the two situations by measurement. Without one, "these behave differently" is
the preference claim the warrant rule was written to exclude, wearing empirical
clothing.

Two situations that differ only in expected value, ranking, or preferred policy
are **not** a witness pair of either kind. A representation that fails to encode
someone's preference ordering is not deficient.

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
that was applied. Without it, `DomainAdmissionReport` is a narrative asserting
that a comparison came out favorably, and §14's requirement that a future
verifier can ask "why was it considered sufficient" cannot be met.

Therefore:

1. The **cost model** — the dimensions, units, estimators, comparison rule, and
   any exchange rules — MUST be a content-addressed object.
2. Every admission decision MUST record the cost model's address alongside the
   inputs it was evaluated on.
3. Changing the cost model changes its address and therefore does not silently
   revise past decisions. Prior admissions remain evaluable under the model that
   actually admitted them.

#### 10.1.3 Eligibility replays; authorization does not

The earlier draft required both that a third party MUST be able to recompute the
decision and get the same verdict, **and** that terms like `cognitiveComplexity`
and `trust` may be a principal's judgment and unreplayable. Both cannot be
normative at once, and the pair was the document asking for a mathematical
function and a human decision from the same object.

Admission is therefore two decisions with different epistemic types, recorded
separately.

**Deterministic eligibility — replayable, and MUST be:**

```text
the proposal is well-formed;
hard budget limits are satisfied in every dimension;
required fixtures pass;
declared invariants are preserved at their declared scopes;
a rollback plan exists and its test passes;
lineage is derived and consistent (§19.13).
```

Every term is a computation over content-addressed inputs. A third party given
the receipt MUST recompute this and get the same verdict, bit for bit. A
proposal that fails eligibility is rejected without any judgment being sought —
which is also what makes §11.1.1's cheap screening gate possible.

**Governance authorization — auditable, attributable, NOT recomputable:**

```text
the principal accepts the trust cost;
the quorum accepts the complexity;
affected owners accept the externalities.
```

These are decisions, not measurements. Requiring them to replay would either
force a fake number onto a judgment or bar the federation from ever weighing
anything a formula cannot.

Rules:

1. A receipt MUST record which terms were eligibility and which were
   authorization. A term MUST NOT appear in both.
2. Authorization MUST be **attributed**: who decided, under what mandate, on
   what record. What replays is not the judgment but the **grounds** — the same
   inputs, the same stated reasons, the same identified principal, so a reader
   can reach their own conclusion and see exactly where it diverges.
3. A judgment term MUST NOT be presented as a computed cost. An honestly labeled
   judgment is usable; one disguised as a measurement corrupts every aggregate
   it enters.
4. Eligibility failure is terminal for that proposal. Authorization refusal is
   not — it MAY be revisited under a different mandate, quorum, or set of
   affected owners, and the revisit MUST cite the prior refusal.
5. `federatively shared` and `canonical` status require **both**: deterministic
   eligibility that replays, and authorization that is attributed.

### 10.2 Loop prevention

The runtime MUST prevent unbounded mutation loops through at least:

- per-conflict mutation limits;
- cooldown or evidence requirements;
- cumulative mutation debt;
- rollback after failed admission stages;
- explicit terminal states;
- external authority limits.

---

## 11. Domain Admission Protocol

A proposed domain or ontology extension passes through the following states:

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
type DomainProposal = {
  id: string;
  problem: ConflictRef | BottleneckRef;
  proposedDomain: DomainDescriptor;
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
type DomainAdmissionReport = {
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

An experimental domain MUST be tested for:

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

A state domain MUST NOT be accepted solely because it reduces an internal
conflict score.

The round-trip and composition tests are the two that catch a translator lying
about its own loss, which is the failure the rest of the protocol has no other
way to detect.

### 11.4 Acceptance authority

Admission authority MUST be scoped. A local agent MAY accept an experimental
domain for reversible internal use. Federated or canonical acceptance MUST
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

The most important case is not multiple state domains inside one agent, but
multiple agents or substrates with different ontologies.

```ts
type AgentOntology = {
  owner: AgentId | SubstrateId;
  ontology: OntologyRef;
  state domains: DomainRef<unknown>[];
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

Ordering starts from **hash chaining**: every handshake message after `hello`
carries `prev`, the content address of the message it follows. The chain gives,
at no cost beyond a digest already being computed:

1. verifiable causal ancestry — which messages a given message was written
   after;
2. tamper evidence — a message cannot be inserted, removed, or reordered without
   breaking every subsequent link;
3. a fork detector for one author — two messages claiming the same `prev` from
   the **same party** is equivocation, and MUST terminate the handshake rather
   than be resolved by preferring one branch.

**Hash chaining alone does not give a total order, and an earlier draft claimed
it did.** In a two-party protocol both sides can honestly reply to the same head
at the same time:

```text
   M0
  /  \
A1    B1
```

Neither party equivocated — the authors differ, each extended the head it had.
The chain is intact, the ancestry is correct, and there is no total order. The
draft's fork detector would not fire, because it only catches one author
claiming a head twice, and the negotiation state — "the chain head" — is now two
things.

A conforming handshake MUST therefore adopt one of:

- **Strict turn-taking (RECOMMENDED for two parties).** The protocol assigns
  whose move it is; a message from the party whose turn it is not is rejected
  rather than merged. Turn order is fixed at `hello` — the initiator moves first
  — so it needs no negotiation and no clock. This is the cheapest option and the
  two-party handshake of §13.4 does not need more.
- **Author-local chains plus explicit merge.** Each party chains its own
  messages; concurrency is legal and is resolved by a `merge` message naming
  both heads, after which the merged head is the state. The DAG is then the
  record and the total order is only ever asserted where a merge exists.
- **A sequencer**, if the handshake has a witness willing to be one — which
  reintroduces a privileged party and MUST NOT be the default, per §13.4.4.

Whichever is chosen MUST be declared in `hello`, because two parties running
different ordering disciplines will disagree about whether a message was legal
without either being at fault.

This orders messages _within_ a handshake. It does not order events across
handshakes or across the federation, and MUST NOT be presented as doing so.

#### 13.4.3.2 A fixture set is not a domain

§13.4.3 rule 1 says a mapping MUST NOT be credited beyond the region where
fixtures agreed, and calls that the mapping's declared domain. That sentence
does more work than it can carry: fixtures are a finite set of points, and a
domain is a region. Nothing in the earlier draft said how one becomes the other,
which leaves "the agreeing region" as a decorative name for a list of examples —
the same defect this document objects to elsewhere.

A credited mapping MUST therefore carry:

```ts
type MappingDomain = {
  domain: PredicateRef; // the claimed region, as a checkable predicate
  coverageEvidence: CoverageReport; // how the fixtures relate to that region
  counterexampleSearch: EvidenceRef; // what was tried against it, and failed to break it
  agreementFixtures: FixtureRef[];
  divergenceFixtures: FixtureRef[]; // outside the domain by construction
};
```

Rules:

1. The `domain` predicate is a **claim of generalization** and carries the
   epistemic status machinery of §6.2: it is `tested` at best unless something
   proves it. It MUST NOT be reported as established because the fixtures
   passed.
2. `coverageEvidence` MUST state what the fixture set covers of the claimed
   region and, more importantly, what it does not — boundary cases, degenerate
   inputs, the neighbourhood of the known divergences.
3. `counterexampleSearch` MUST record an active attempt to find a point inside
   the claimed domain where the parties disagree. A domain nobody tried to break
   has not been tested; it has been asserted with examples attached.
4. Every known divergence MUST be **outside** the claimed domain by
   construction. A domain predicate that admits a point the parties are known to
   disagree on is falsified, and §6.2 rule 7 applies — the counterexample is
   retained.
5. Where no defensible predicate can be stated, the domain is the literal
   fixture set and the mapping is credited **only** on those exact inputs. That
   is a legitimate and very weak outcome, and it MUST be recorded as such rather
   than generalized by silence.

How large and how adversarial a fixture set must be before agreement is evidence
of shared meaning remains open (§20.12). This section makes the question
answerable by requiring the artifacts an answer would be computed from.

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

- source and target domain versions;
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

### 14.1 Disclosure

Everything above is written as though the ledger is public and the parties have
nothing to withhold. For a federation of agents acting on behalf of principals
that is false, and the omission forces a choice the document never states:
**auditability or confidentiality, pick one.**

That framing is wrong, and treating disclosure as a later concern would bake it
in. What a receipt must prove and what it must reveal are different questions,
and the machinery this RFC already relies on — content addressing, canonical
encoding, attestation — separates them if it is asked to.

#### 14.1.1 The layering

```text
public receipt envelope     — structure, addresses, verdicts, authority
private referenced payload  — the state, evidence, or policy body itself
selective disclosure        — proofs about the payload, without the payload
availability commitment     — who holds it, and what they owe
```

A receipt is an envelope of **references and verdicts**. Whether the referenced
bytes are public is a separate decision from whether the receipt is verifiable.
A verifier can already check that the structure is well-formed, the signatures
bind, the lineage connects, and the authority was held, without reading a single
payload.

#### 14.1.2 Requirements

1. **A confidential payload MUST still be committed to.** Withholding bytes is
   legitimate; not committing to them is not. A reference whose target was never
   fixed cannot be shown later to be the thing that was used.
2. **Dictionary attacks on content addresses are real and MUST be considered.**
   A digest over a low-entropy payload — a boolean verdict, a small enum, a name
   from a known set — reveals the payload to anyone who can enumerate the space.
   Commitments to low-entropy values MUST be salted or otherwise blinded, and
   the salt is part of the payload, not of the receipt.
3. **Redaction MUST be visible.** A redacted field MUST be distinguishable from
   an absent one and from an unassessed one. §19.15's rule against confusing
   `absent` with `not assessed` extends here: a third state, `withheld`, with a
   commitment attached.
4. **Selective disclosure MUST NOT be simulated by trust.** "The verifier was
   told the invariant held" is not a proof that it held. Where a party must
   establish a property of a payload without revealing it, that MUST be an
   attestation by an identified party or a cryptographic proof — and which one
   MUST be recorded, because they have very different strength.
5. **Availability is a commitment, not a hope** (§5.1.0). A receipt depending on
   a payload someone must retain MUST name who owes it and for how long. An
   unavailable payload makes the receipt unverifiable, and a system that cannot
   distinguish "withheld" from "lost" cannot be audited.
6. **Disclosure decisions are themselves ledgered.** Who was granted resolution
   of what, under which authority, is exactly the kind of thing that must not be
   reconstructible only from someone's memory.

#### 14.1.3 What this section does not do

It does not select a scheme. Commitment construction, blinding, proof systems,
and capability-controlled resolution are cryptographic engineering with failure
modes this document is not equipped to adjudicate, and naming a scheme here
would be §19.7's failure mode in the one area where getting it wrong is silent.

What it does is refuse the framing that privacy is optional decoration for a
federation of agents, and state the properties any scheme must deliver. The
scheme selection is open problem §20.20; whether an irreversible boundary can be
crossed on a withheld payload at all — as against merely being decided on one —
is §20.21, and the conservative default until then is that it cannot.

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
same domain          — source and target domain references are identical
same ontology        — no cross-ontology interpretation occurs
no federation        — no other agent or substrate is a participant
reversible           — the action's reversibility class is "reversible" and a
                       rollback boundary is already established
no mutation cost     — no mutation is proposed and no *mutation-budget* term is
                       consumed; compute and time are consumed by every action,
                       including this one, and were wrongly implied otherwise in
                       an earlier draft
not coupled          — the operation touches no component of a coupled composite
                       state (§6.5.1)
no unresolved debt   — the states involved carry no outstanding translation debt
invariants unchanged — the operation touches no invariant in the identity policy
```

The predicate MUST fail closed: if any term is unknown, unavailable, or
expensive to evaluate, the operation takes the governed path. Evaluating the
predicate MUST be cheaper than the ceremony it skips, or it has no purpose.

#### 15.0.1 The predicate and the receipt must both be affordable

That last sentence is a requirement the earlier draft stated and then made hard
to satisfy. Eight terms evaluated per operation, plus a reconstructible receipt
written per operation, can easily exceed the cost of incrementing a counter —
and if it does, the two-path design has not made the protocol affordable, it has
added a second expensive path.

Two mitigations are REQUIRED where fast-path volume is high enough for this to
bite.

**Amortize the predicate.** Most terms are properties of a _context_, not of an
operation: which domain, which ontology, whether a federation participant is
involved, whether the composite is coupled. A runtime MAY establish an
**eligible segment** — a bounded region of execution in which those terms are
evaluated once and held — provided that:

1. the segment declares its bounds up front (operation count, wall-clock, or
   state-reachability), and MUST end when any bound is reached;
2. any event that could falsify a held term ends the segment immediately — a
   federation message arriving, a debt being recorded, an identity amendment, a
   coupling being added;
3. the segment is itself receipted, so the amortization is auditable as a unit;
4. the segment fails closed: on any uncertainty it ends and the next operation
   re-evaluates in full.

**Amortize the receipt.** The obligation is that an operation remain
reconstructible, not that it carry its own document. Conforming alternatives:

- **Batch receipts** — one receipt per segment, carrying the ordered operation
  log by content address rather than one receipt per operation.
- **Accumulation** — operations accumulate into a hash tree; the receipt records
  the root, and any single operation is provable against it on demand.
- **Deterministic replay seeds** — the receipt records the starting state and
  the input sequence, from which the operations are recomputed rather than
  stored, valid only where the transition function is deterministic (which for
  an intra-domain fast-path update it MUST be).
- **Boundary-exit receipting** — full receipts are written when state leaves the
  local boundary. State that never leaves may be summarized, provided the
  summary is enough to reconstruct what left.

Rules:

1. Whichever is used MUST be declared, so a verifier knows what kind of evidence
   to expect and can tell "summarized" from "absent".
2. **Reconstructibility is not negotiable.** These reduce the cost of recording,
   never the ability to answer §14's questions afterwards.
3. Taint propagates: if any operation in a segment turns out to have needed the
   governed path, the whole segment is suspect and MUST be reported as such, not
   just the offending operation. This is the price of amortizing, and it is why
   segments should be small.
4. A summarization scheme that cannot produce a per-operation proof on demand
   MUST NOT be used for state that will cross a boundary.

### 15.1 Fast path

```text
observe
  -> type state
  -> validate domain
  -> update local state
  -> record compact receipt
```

Rules:

1. The fast path MUST still produce a receipt. The receipt MAY be compact —
   state reference, domain version, operation, outcome — but the operation MUST
   remain reconstructible.
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
  -> validate domain and ontology
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
act. An LLM MAY propose candidates but MUST NOT be the sole verifier of domain
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

#### 16.7.1 This is not a translation, and calling it one is the error

An earlier draft described the demo as a candidate _correspondence_ between
`exhausted` and `grounds_for_withdrawal`, to be established by fixtures and
carried by a translator mapping.

Those are not two names for one concept in two ontologies. `exhausted` is an
observation about a resource state. `grounds_for_withdrawal` is a normative
conclusion inside a proposal policy. Nothing about the first _means_ the second;
the second follows from the first only through a rule that someone with
authority adopted, and that could be adopted differently without either ontology
changing.

Treating that as translation would be the most consequential mistake available
here: it lets **policy masquerade as semantic correspondence**. A policy carried
as a mapping inherits the mapping's properties — it looks bidirectional, it
looks like it has a loss profile, it looks like fixture agreement validates it —
and none of that is true of a normative rule. Worse, it launders authorship: a
mapping is a technical artifact, a policy is someone's decision, and the whole
document is built on being able to ask who decided.

The structure is three-part, not two:

```text
evidence  →  policy rule  →  warranted decision
```

and it needs its own primitive:

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
   decision back to the evidence that warranted it.
4. Where a mapping and a bridge are both needed — the evidence must first be
   translated into terms the policy reads — they MUST be separate objects with
   separate receipts. The translation carries loss; the bridge carries
   authority.
5. Disagreement about a bridge is a governance dispute, not a translation
   defect, and MUST be routed as one.

**What the demo must produce**, in receipts a third party can replay:

1. a `hello` exchange declaring both parties' evaluator and floor version,
   ordered per §13.4.3.1;
2. a fixture set exercising the **translation** — `liquid`'s resource-state
   claim rendered into terms `myc`'s policy can read — evaluated in the shared
   floor by both parties independently;
3. **at least one fixture on which they diverge**, recorded with its divergence
   rather than discarded — a demo where everything agrees has not tested the
   mechanism that matters;
4. a mapping credited only over the agreeing region, with a declared domain
   predicate and coverage evidence rather than a list of passing cases
   (§13.4.3.2);
5. a loss profile and a round-trip anchor report for that mapping (§7.4.2);
6. an `EvidenceBridge` — separately — carrying `myc`'s policy that an exhausted
   resource is grounds for withdrawal, attributed to the authority that adopted
   it;
7. an action-context suitability for `forIrreversibleAction` that is
   **fixture-measured or third-party attested**, never self-reported by the
   translator (§7.2.2);
8. a scoped compatibility contract naming preserved invariants, accepted losses,
   rollback ownership, and the boundary condition;
9. the boundary decision itself — crossed with warrants, or refused — with the
   refusal being an equally valid demo outcome;
10. a replay by a third substrate (`omega` or `trinity`) reaching the same
    verdict from the receipts alone.

Step 6 is the one that makes the demo worth building. A reader of the receipts
must be able to ask "who decided that exhaustion justifies withdrawal?" and get
a name, not a mapping.

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

domain/
  domain-contract
  algebraic-laws      # law declarations and their evidence (§6.2)
  capabilities        # metric / interpolable / composable split (§6.3)
  typed-state
  domain-registry
  product-domain

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
  domain-proposal
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

The actual mapping into `trinity`, `myc`, `omega`, and `liquid` MUST preserve
each substrate's authority boundary. §17.2 states it concretely.

### 17.2 First implementation slice

Folder names are not a plan. This table names, for each primitive that Tranche A
or B would require, what exists today, whether it is extended or created, which
substrate would own it, and the first test that would fail if it were wrong.

Rows are ordered by dependency: nothing below is startable before the rows above
it land.

| Primitive             | Existing source                                                   | Extend / create | Owner substrate                       | First executable test                                                                                                    |
| --------------------- | ----------------------------------------------------------------- | --------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ContentAddress`      | `contracts/CANONICAL_HASH.v0.1.md`, `fixtures/canon-vectors.json` | extend          | trinity                               | full-digest vectors alongside the existing 12-hex handles (§5.1 rule 4)                                                  |
| `CanonicalEncoding`   | `warrant` SPEC §4 + `examples/canon-vectors.json`                 | adopt + extend  | trinity, as `CANONICAL_ENCODING.v0.1` | the existing 47 vectors pass unchanged, plus new ratio/fixed-point cases (§5.1.2)                                        |
| `StateDomain`         | none                                                              | create          | omega                                 | a domain that declares `Metric` without implementing it is rejected at registration (§6.3.1)                             |
| `AlgebraicLaws`       | none                                                              | create          | omega                                 | a law with `status: falsified` blocks composition; a `tested` law with no generator is rejected (§6.2)                   |
| `InvariantDefinition` | scattered invariant checks across substrates                      | create          | omega                                 | a `transition`-scope invariant evaluated from one state fails rather than reporting held (§6.1.1)                        |
| `InvariantEvaluation` | none                                                              | create          | omega                                 | same predicate + same snapshots ⇒ same report on two substrates; a stale snapshot yields `not assessed` (§6.1.2)         |
| `TypedState`          | substrate-local state shapes                                      | create          | trinity                               | a `minimal`-profile state is refused at a boundary requiring `full`, not backfilled (§5.2)                               |
| `CompositeState`      | none                                                              | create          | liquid                                | a composite with an undeclared coupling fails validation while every component validates (§6.5.2)                        |
| `LossProfile`         | none                                                              | create          | trinity                               | property tests: associativity, identity, non-commutativity, monotonicity for `translation` only (§7.1.1)                 |
| `TransformKind`       | none                                                              | create          | trinity                               | an undeclared kind is treated as `reconstruction`; a reconstructed value is refused at an irreversible boundary (§7.0.2) |
| `SuitabilityProfile`  | none                                                              | create          | trinity                               | a self-reported `forIrreversibleAction` is recorded as `undetermined` regardless of the claim (§7.2.2)                   |
| `ConflictOccurrence`  | `src/x2B88_decisions.myc.md` chord ledger                         | extend          | myc, liquid                           | two occurrences sharing a fingerprint are not merged without a receipted lineage claim (§19.16)                          |
| `AdmissionStage`      | `myc` proposal lifecycle, `contracts/GOVERNANCE_FLOW.v0.md`       | extend          | myc                                   | eligibility replays bit-for-bit from the receipt; authorization is attributed and not recomputed (§10.1.3)               |
| `ExecutionFloor`      | `ski@v1` / Σ-GLYPH Book I v0.5                                    | adopt (pinned)  | omega                                 | the same fixture yields identical output bytes under two substrates' evaluators (§13.4.1.1)                              |
| `HandshakeMessage`    | none                                                              | create          | trinity                               | a message from the party whose turn it is not is rejected, not merged (§13.4.3.1)                                        |
| `EvidenceBridge`      | `warrant` decision records                                        | extend          | myc, trinity                          | a bridge presented as a translation — carrying a loss profile — is rejected (§16.7.1)                                    |

Notes on the table:

1. **Three rows are `adopt`, not `create`.** Canonical encoding and the
   execution floor exist and are tested (§17.1); building parallel ones would be
   the ecosystem fork §5.1 argues against. Adoption still requires the pin.
2. **`omega` carries the deterministic rows** because determinism is its stated
   responsibility (§18), and every one of those tests is a determinism test.
3. **The `first executable test` column is the point of the table.** Each is a
   test that fails today because the thing does not exist, and would pass when
   it does — which makes each row a unit of work with a completion condition,
   rather than an item on a diagram.
4. Nothing here is a commitment by those substrates. It is what the mapping
   would be, stated concretely enough to be argued with, which the folder tree
   above is not.

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
- executable domain invariants where formalizable;
- algebraic-law property tests and their evidence;
- deterministic evaluation of the runtime path predicate (§15.0);
- mutation budget enforcement;
- replay, rollback, and falsifier execution;
- canonical transition receipts.

### Liquid

- semantic ontology structures;
- local domain experiments;
- conflict and tension profiles;
- representational bottleneck hypotheses;
- evolving translation candidates.

These responsibilities are not exclusive. Cross-substrate checks are preferred
where independent verification is possible.

---

## 19. Security and failure modes

### 19.1 Conflict laundering

A new domain may hide rather than resolve conflict. Admission MUST compare
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
to attest a different translator, domain, or evidence bundle than the one that
ran. Short handles MUST NOT be load-bearing at admission, identity, trust, or
irreversible boundaries; full digests MUST accompany them (§5.1).

### 19.11 Profile downgrade

A state may be authored at `minimal` to avoid the cost of provenance and then
presented at a boundary requiring `full`. Boundaries MUST reject under-profiled
states rather than backfilling their metadata (§5.2).

### 19.12 Law assertion without evidence

A state domain may declare favorable algebraic laws it does not satisfy,
inviting callers to compose states in ways that silently corrupt them. Declared
laws MUST carry evidence, and asserted-only laws MUST NOT authorize composition
across translation or irreversible boundaries (§6.2).

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

1. **Restating does not reset (§19.16).** A "new" conflict sharing participants
   and violated invariants with an existing one shares its `ConflictFingerprint`
   and surfaces as a candidate for the same lineage. Whether the two are one
   underlying problem is a receipted decision with an author, not a hash
   collision — so evading a budget requires filing a false lineage claim under
   an authority, which is attributable, rather than choosing different words,
   which is not.
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

Retiring a state domain (§11) can strand obligations expressed in it —
compatibility contracts, outstanding translation debt, invariants referenced by
an identity policy. Deprecation MUST enumerate its dependents and MUST NOT
proceed to `retired` while an unresolved obligation references it. A state
domain may be deprecated for new use while remaining resolvable for old
receipts; the two are different states and MUST NOT be conflated.

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
the mutation.

An earlier draft answered this with a single canonical identity derived from
participants and violated invariants. That is too coarse in one direction and
too fine in the other, and one hash cannot be both.

- **Too coarse:** two genuinely different conflicts can share participants and
  violated invariants while arising from different causal episodes, under
  different ontology snapshots, at different times, from different evidence
  roots. Collapsing them loses the fact that there were two.
- **Too fine:** add those contexts to the digest and one underlying problem
  shatters into a new identity per occurrence, which is precisely the
  salami-slicing §19.13 defends against, now available by accident.

Semantic deduplication and clean content identity are different jobs and need
three objects:

```ts
type ConflictOccurrenceId = ContentAddress; // the exact event: participants,
// invariants, ontology snapshot,
// evidence roots, logical step

type ConflictFingerprint = {
  key: FingerprintKey; // participants + violated invariants — heuristic
  occurrences: ConflictOccurrenceId[]; // candidates, not a claim of sameness
};

type ConflictLineageClaim = {
  occurrences: ConflictOccurrenceId[];
  verdict: "same-underlying-problem" | "distinct";
  grounds: EvidenceRef[];
  decidedBy: AgentId;
  authority: AuthorityRef;
  address: ContentAddress;
};
```

Rules:

1. `ConflictOccurrenceId` is content identity and is never merged. Occurrences
   are immutable events; two of them are two of them.
2. `ConflictFingerprint` is a **search key**, not an assertion. It gathers
   candidates for a human or governed process to look at. Nothing may be
   accumulated, limited, or budgeted on a fingerprint alone.
3. Merging is a **decision** — a receipted `ConflictLineageClaim` with grounds
   and an author — not a hash collision. §19.13's lineage accumulates over
   claimed lineages, so evading a budget requires filing a false claim under an
   authority, which is attributable, rather than choosing different words, which
   is not.
4. A `distinct` verdict is as informative as a `same` verdict and MUST be
   recorded. Otherwise every unmerged pair is indistinguishable from an
   unexamined one.
5. A lineage claim MAY be superseded by a later one with better grounds. The
   supersession MUST cite the claim it replaces, and neither is deleted.

---

## 20. Open problems

The following are explicitly unresolved and MUST NOT be presented as completed
features:

1. How should representational gain be measured without reducing it to one
   scalar?
2. Which bottleneck signals reliably distinguish insufficient search from
   insufficient representation?
3. How can learned state domains expose stable, human- and machine-auditable
   invariants?
4. How should translation debt decay, compound, or trigger mandatory review?
5. What continuity test determines whether an identity amendment creates a
   successor agent?
6. How can independent agents negotiate mappings without a privileged global
   ontology?
7. Which mutation-budget terms can be made deterministic in Omega?
8. How should conflicting admission reports be reconciled across substrates?
9. Can a state domain be locally valid but federatively unacceptable?
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
19. Is composition associative — does a composite of composites flatten? The
    likely answer is yes for product and no for coupled, but nothing here yet
    needs it and "likely" is not the standard this document holds (§6.5.3).
20. Which commitment, blinding, and selective-disclosure constructions should
    the federation adopt, and can they be verified by the same from-scratch
    second implementation the encoding requires (§14.1)?
21. May an irreversible boundary be crossed on a payload that remains withheld,
    or only decided on one? The conservative default until answered is that it
    may not (§14.1.3).
22. What promotes a behavioral witness pair past the sandbox — must the
    divergence have produced a warrant-level consequence, or is a governance
    decision on behavioral grounds alone sufficient (§8.2.2)?
23. How is an eligible segment (§15.0.1) bounded in practice so that
    amortization is worth its taint radius — and is there a segment size at
    which the two-path design stops paying for itself?

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

### Level 0 — Declared domain

- states declare domain and ontology;
- validation and canonical serialization exist;
- **stable key identity exists and is verifiable**;
- references are content-addressed, with full digests where load-bearing;
- state domains declare their algebraic laws with evidence;
- state domains exposing `move` declare a typed delta space;
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
- experimental state domains use admission stages;
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

### Tranche B — State-domain typing (depends on A)

- **B1.** Treat the state domain as a first-class part of the state type, with
  geometric structure as one capability among several.
- **B2.** Require declared algebraic laws with evidence; asserted-only laws
  cannot authorize composition across a boundary.
- **B3.** Split the state domain contract into capability interfaces rather than
  optional methods, and require a typed delta space for `move`.
- **B4.** Require invariants to declare execution scope and cost class.
- **B5.** Derive `version` from the content-address DAG rather than declaring it
  independently.
- **B6.** Adopt composite state with declared couplings and a consistency model
  (§6.5), so that a multi-domain agent state is a first-class object.
- **B7.** Replace `holds: boolean` on law claims with the epistemic status union
  of §6.2, and require policies to state the minimum status each boundary needs.
- **B8.** Make invariant context an explicit content-addressed input (§6.1.2)
  rather than forbidding context-dependent invariants.

### Tranche C — Translation and loss (depends on A, B)

- **C1.** Make structured translation loss mandatory; no scalar quality.
- **C2.** Adopt the loss monoid, suitability meet, and debt monoid of §7.1.1,
  §7.2.1, and §7.3.1.
- **C3.** Replace scalar translation confidence with contextual suitability
  profiles, and forbid self-reported action-context suitability.
- **C4.** Make composed translators first-class, with round-trip anchors
  measured against source canonical bytes.
- **C5.** Adopt the five-kind transformation taxonomy of §7.0; require monotone
  loss of `translation` only, and attribution of new information for the rest.
- **C6.** Add `EvidenceBridge` (§16.7.1) as a primitive distinct from
  translation, so a normative policy cannot be carried as a mapping.

### Tranche D — Conflict and bottleneck (depends on A)

- **D1.** Model conflict as a first-class ledger object with canonical identity.
- **D2.** Separate structural insufficiency from domain mismatch, with the two
  witness-pair classes and declared policy independence of §8.2.2–8.2.3.
- **D3.** Split conflict identity into occurrence, fingerprint, and receipted
  lineage claim (§19.16).

### Tranche E — Mutation and admission (depends on A, B, D)

- **E1.** Require mutation budgets, with `Cost` as a vector.
- **E2.** Require a content-addressed cost model so admission decisions replay.
- **E3.** Introduce the staged Domain Admission Protocol.
- **E4.** Bound proposal intake against verification-budget exhaustion.
- **E5.** Split admission into deterministic eligibility that replays and
  governance authorization that is attributed but not recomputed (§10.1.3).

### Tranche F — Runtime (depends on A, B)

- **F1.** Adopt state profiles so ceremony scales with consequence.
- **F2.** Adopt the two-path runtime with a runtime-evaluated, fail-closed,
  receipt-recorded path predicate.
- **F3.** Permit amortized predicate evaluation and receipting under §15.0.1,
  with declared segment bounds and taint propagation.

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
- **G5.** Select a handshake ordering discipline — turn-taking, author-local
  chains with explicit merge, or a sequencer — since hash chaining alone does
  not give a total order (§13.4.3.1).
- **G6.** Require a mapping domain predicate with coverage evidence and
  counterexample search, rather than crediting a fixture list (§13.4.3.2).

### Tranche H — Identity (depends on A, and G for the fork case)

- **H1.** Add identity mutation policy as a constitutional primitive.

### Tranche J — Disclosure (depends on A)

- **J1.** Adopt the receipt-envelope / private-payload layering of §14.1, so
  that verifiability does not require publication.
- **J2.** Require commitments to low-entropy payloads to be blinded, and
  redaction to be visible as a third state distinct from absent and from not
  assessed.
- **J3.** Require availability commitments wherever a receipt depends on a
  payload someone must retain.
- **J4.** Select the cryptographic constructions. This RFC deliberately does not
  (§14.1.3).

### Tranche I — Demonstration (depends on the tranches each demo exercises)

- **I1.** Implement the autonomy-versus-irreversibility demo (§16.1–16.5) before
  broader claims. Exercises D, E, F.
- **I2.** Implement the federated boundary-crossing demo (§16.7) before any
  claim that Levels 4–5 work. Exercises A, C, G.

### On splitting this document

Two reviewers, independently, proposed decomposing this RFC into separate
documents along roughly these tranche boundaries. The diagnosis was accepted at
the first asking — entangled decisions are not ratifiable — and the tranches
above were the response.

**The split is now accepted, and this document is the last revision before it.**

The earlier reason for deferring — that the boundaries had not been tested — has
expired. They have now survived two rounds of use, including a round that added
`EvidenceBridge`, composite state, the transformation taxonomy, and a disclosure
tranche, and the boundaries absorbed all of it without moving. The second
argument was stronger and is what finally decided it: Tranche A is a
prerequisite for everything and its encoding is still unselected, so **no later
tranche can currently be implemented as a conforming federation protocol at
all**. A document that cannot be adopted in pieces, whose first piece is not
adopted, is not a specification anyone can act on; it is a very careful
description of one.

The split follows in a separate change, as:

```text
RFC-A  Canonical Identity and Encoding          (Tranche A, J1–J3)
RFC-B  Typed State Domains and Invariants       (Tranche B)
RFC-C  Translation, Loss, Suitability and Debt  (Tranche C)
RFC-D  Conflict, Bottleneck and Admission       (Tranches D, E)
RFC-E  Federated Handshake and Boundaries       (Tranche G)
RFC-F  Governed Identity and Runtime Paths      (Tranches F, H)
```

with this document surviving as an umbrella — **Heterogeneous State Protocol:
Architecture and Ratification Map** — carrying the theses, the non-goals, the
dependency graph, the open problems, the failure-mode catalogue, and almost no
`MUST`. The normative weight moves to the documents small enough to ratify.

Sequencing corrections before the cut was deliberate: three of this round's
changes altered what belongs in which document, and splitting first would have
fixed those boundaries wrongly and then required moving text between six files
to repair it.

---

## 23. Final principle

The federation does not need one perfect domain of thought.

It needs a disciplined way for different forms of state to coexist, translate,
conflict, evolve, and act together without erasing what makes them different.

The purpose of this RFC is not to make every reality commensurable. It is to
make the boundaries, losses, costs, and commitments of commensuration visible
and verifiable.
