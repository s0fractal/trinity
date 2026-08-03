# RFC-0003: Heterogeneous State Protocol — Architecture and Ratification Map

- **Status:** Draft — **umbrella**. This document carries the theses, the
  non-goals, the terminology, the dependency graph, the failure-mode catalogue,
  the open problems, and the demos. It deliberately carries almost no `MUST`.
  The normative weight lives in RFC-0004 through RFC-0009, which are small
  enough to ratify one at a time.
- **Authors:** s0fractal + model collaborators
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0003-heterogeneous-state-geometries.md`. Every path this document
  cites without a repository is relative to that repository; everything outside
  it is listed with its repository in §17.1.
- **Filename note:** the path still says `geometries`. The title stopped saying
  it in round 4, for the reason given in §4.2 — partial orders and constraint
  systems are not geometries, and the document was carrying its own decorative
  metaphor in its name. The path is stable because committed ledger records
  reference it.
- **Target:** Trinity federation (`trinity`, `myc`, `omega`, `liquid`)
- **Scope:** Semantic Schema V2 extension
- **Created:** 2026-08-03
- **Revised:** 2026-08-03 — four rounds of external critique, then split. The
  reasoning behind each correction is in
  [REVISION HISTORY](0003-REVISION-HISTORY.md); the relayed reviews are chords
  `x2300_960790`, `x2300_960792`, `x2300_960796`, `x2300_960798`.
- **Supersedes:** nothing
- **Extends:** the federation's existing state, warrant, evidence, receipt, and
  lineage primitives

## The document set

| Document                                                                                       | Ratifies         | Depends on                          |
| ---------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------- |
| **RFC-0003** (this) — Architecture and Ratification Map                                        | nothing          | —                                   |
| [RFC-0004](0004-canonical-identity-and-encoding.md) — Canonical Identity and Encoding          | Tranche A, J1–J3 | nothing                             |
| [RFC-0005](0005-typed-state-domains.md) — Typed State Domains and Invariants                   | Tranche B        | RFC-0004                            |
| [RFC-0006](0006-translation-loss-and-suitability.md) — Translation, Loss, Suitability and Debt | Tranche C        | RFC-0004, RFC-0005                  |
| [RFC-0007](0007-conflict-and-admission.md) — Conflict, Bottleneck and Admission                | Tranches D, E    | RFC-0004, RFC-0005                  |
| [RFC-0008](0008-federated-handshake.md) — Federated Handshake and Compatibility Boundaries     | Tranche G        | RFC-0004, RFC-0006, execution floor |
| [RFC-0009](0009-identity-and-runtime-paths.md) — Governed Identity and Runtime Paths           | Tranches F, H    | RFC-0004, RFC-0005                  |

**Section numbers are global and stable across the set.** Nothing was renumbered
when the document was split: §7.2.2 means the same passage it meant before, and
now lives in RFC-0006. This is deliberate — ledger chords and prior receipts
cite these numbers, and a citation that silently changes referent is the failure
the protocol exists to prevent. §22 maps every section range to its document.

**RFC-0004 is the blocker.** Its encoding is unselected, so no later document
can currently be implemented as a conforming federation protocol. Anything
depending on cross-substrate reference equality is specified and not yet
implementable, and this set says so rather than letting a reader discover it.

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

  **Corrected 2026-08-03 by measurement.** This entry originally read as a
  choice between `warrant`'s profile and the federation's existing
  `CANONICAL_HASH`. An inventory of what actually exists
  (`probes/canonical-forms-inventory-v0`) found ten canonical forms, not two,
  and showed that those particular two are **layers rather than rivals** —
  `CANONICAL_HASH` digests a text body without parsing it, so a structural
  canonicalizer feeds it rather than replacing it. It also found a second live
  structural canonicalizer this RFC did not know about
  (`packages/canonical-receipt`, RFC 8949 canonical CBOR, published on jsr) and
  a live contract that leaves its own encoding unfixed
  (`RECEIPT_ENVELOPE.v1.0`). See RFC-0004 §5.1.4.
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

Decisions are grouped into **tranches**. Each tranche is independently
ratifiable, states what it depends on, and can be rejected without voiding the
others. Nothing outside a ratified tranche may be cited as agreed.

A flat list of fifteen decisions was tried first and could not be acted on; the
reasoning is in [REVISION HISTORY](0003-REVISION-HISTORY.md) §4.

### Section-to-document map

Every section number in this set is global and stable (see the header). This is
where a reference resolves:

| Sections                        | Document                 |
| ------------------------------- | ------------------------ |
| §0–§4, §16–§23                  | RFC-0003 (this document) |
| §5.1, §5.1.0–§5.1.3, §14, §14.1 | RFC-0004                 |
| §5 (core model), §6             | RFC-0005                 |
| §7                              | RFC-0006                 |
| §8, §9, §10, §11                | RFC-0007                 |
| §13                             | RFC-0008                 |
| §5.2, §12, §15                  | RFC-0009                 |

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

### On the split

Three reviewers, independently, proposed decomposing this RFC. The split was
carried out; this document is the umbrella that remains. The reasoning, and why
it was deferred twice before being accepted, is in
[REVISION HISTORY](0003-REVISION-HISTORY.md) §5.

What matters going forward rather than backward:

1. **Ratification is per tranche, per document.** A ratified tranche constrains
   something. An unratified complete specification constrains nothing while
   looking as though it does, which is the more dangerous of the two states.
2. **RFC-0004 unblocks everything.** Until its encoding is selected, every later
   document is specified and not implementable across substrate boundaries.
3. **The next artifact should be code, not a fifth revision.** §17.2 gives the
   first implementation slice as a table whose last column is a test that fails
   today. Marginal value has moved from the text to the demos of §16.

---

## 23. Final principle

The federation does not need one perfect domain of thought.

It needs a disciplined way for different forms of state to coexist, translate,
conflict, evolve, and act together without erasing what makes them different.

The purpose of this RFC is not to make every reality commensurable. It is to
make the boundaries, losses, costs, and commitments of commensuration visible
and verifiable.
