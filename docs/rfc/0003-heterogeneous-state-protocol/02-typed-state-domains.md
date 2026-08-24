# RFC-0003 / Part 02: Typed State Domains and Invariants

- **Status:** Draft
- **Authors:** s0fractal + model collaborators
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0003-heterogeneous-state-protocol/02-typed-state-domains.md`
- **Parent:**
  [Part 00 — Architecture and Ratification
  Map](00-architecture-and-ratification-map.md), which holds the theses,
  non-goals, terminology, dependency graph, failure-mode catalogue, and open
  problems this document depends on.
- **Ratifies:** Tranche B (B1–B8)
- **Depends on:** Part 01
- **Created:** 2026-08-03 (extracted from the original single-file draft after
  four rounds of external critique; see [Part 07](07-revision-history.md))

> **Section numbers are inherited and stable.** This document keeps the section
> numbers it carried inside RFC-0003. They are not renumbered from 1, because
> ledger chords and prior receipts cite them, and a cross-reference that
> silently changes meaning is the failure this protocol exists to prevent. A
> reference of the form §N.M is resolvable through Part 00's §22 map.

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

The `Delta` parameter is not decoration. A domain exposing `move` MUST declare a
`DeltaDescriptor` with its own content address, giving the delta space the same
canonical encoding and validation obligations as the point space — otherwise
`move` is an untyped hole in an otherwise typed contract, and §5's rule against
out-of-band convention is violated by the contract that states it.

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

Requiring a predicate to be deterministic is right. Requiring it to read no
context is not, and would rule out most invariants this protocol cares about.

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

**There is deliberately no `holds: boolean`.** A property test does not
establish that a law holds; it establishes that no counterexample was found by a
particular generator over a particular domain in a particular number of cases.
That is a weaker statement, and the difference is exactly what matters for
associativity, the triangle inequality, invertibility, and monotonicity — where
the counterexamples live in the corners a naive generator does not reach.
Collapsing proof strength into a flag is the move this protocol refuses for
translation quality (§7.1), suitability (§7.2.1), and cost (§10.1.1); see
[Part 07: Revision History](07-revision-history.md) §1.

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
says why the alternative — one interface with optional members — is inadequate.

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
