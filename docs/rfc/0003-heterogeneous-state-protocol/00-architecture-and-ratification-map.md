# RFC-0003 / Part 00: Architecture and Ratification Map

- **Status:** Draft — **umbrella**. This document carries the theses, the
  non-goals, the terminology, the dependency graph, the failure-mode catalogue,
  the open problems, and the demos. It deliberately carries almost no `MUST`.
  The normative weight lives in Parts 01 through 06, which are small enough to
  ratify one at a time.
- **Draft steward:** s0fractal. Stewardship names who currently accepts or
  rejects changes to this candidate; it is not a claim of primary prose
  authorship, legal liability, independent review, or tranche ratification.
- **Text provenance:** predominantly model-generated and model-revised, with
  human direction and disposition. Exact source authentication is preserved
  where available in Git history, relays, and signed chords; see §0.1 and Part
  07. A contribution does not become principal authority by appearing here.
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0003-heterogeneous-state-protocol/`. This directory is the complete
  artifact. Every path this document cites without a repository is relative to
  the Trinity repository; everything outside it is listed with its repository in
  §17.1.
- **Target:** Trinity federation (`trinity`, `myc`, `omega`, `liquid`)
- **Scope:** Semantic Schema V2 extension
- **Created:** 2026-08-03
- **Revised:** 2026-08-24 — packaged as one ordered RFC-0003 artifact and added
  the CNP-0-JCS draft selection after external proposal review. The reasoning
  behind each substantive correction is in
  [Part 07: Revision History](07-revision-history.md); the relayed reviews are
  chords `x2300_960790`, `x2300_960792`, `x2300_960796`, `x2300_960798`.
- **Supersedes:** nothing
- **Extends:** the federation's existing state, warrant, evidence, receipt, and
  lineage primitives

## The document set

| Part                                         | Document                                         | Ratifies         | Depends on                    |
| -------------------------------------------- | ------------------------------------------------ | ---------------- | ----------------------------- |
| **00** (this)                                | Architecture and Ratification Map                | nothing          | —                             |
| [01](01-canonical-identity-and-encoding.md)  | Canonical Identity and Encoding                  | Tranche A, J1–J3 | nothing                       |
| [02](02-typed-state-domains.md)              | Typed State Domains and Invariants               | Tranche B        | Part 01                       |
| [03](03-translation-loss-and-suitability.md) | Translation, Loss, Suitability and Debt          | Tranche C        | Parts 01, 02                  |
| [04](04-conflict-and-admission.md)           | Conflict, Bottleneck and Admission               | Tranches D, E    | Parts 01, 02                  |
| [05](05-federated-handshake.md)              | Federated Handshake and Compatibility Boundaries | Tranche G        | Parts 01, 03, execution floor |
| [06](06-identity-and-runtime-paths.md)       | Governed Identity and Runtime Paths              | Tranches F, H    | Parts 01, 02                  |
| [07](07-revision-history.md)                 | Revision History                                 | non-normative    | —                             |

**Section numbers are global and stable across the set.** Nothing was renumbered
when the document was split: §7.2.2 means the same passage it meant before, and
now lives in Part 03. This is deliberate — ledger chords and prior receipts cite
these numbers, and a citation that silently changes referent is the failure the
protocol exists to prevent. §22 maps every section range to its document.

**Part 01 is the blocker.** The draft now selects CNP-0-JCS, but selection text
is not interoperability evidence or federation ratification. Until the separate
contract, CNP-0 corpus, two independent encoders, verifier-only rejection path,
and substrate adoption exist, anything depending on cross-substrate reference
equality is specified and not yet conformingly implementable.

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

### 0.1 Contribution, stewardship, and authority are different claims

The origin of text does not establish or defeat its truth. Human prose, model
output, generated fixtures, and machine-produced proofs all require evidence
appropriate to the claim. What provenance must prevent is a different error:
turning “produced these candidate bytes” into “accepted these bytes,” or turning
either statement into “may bind other principals.”

RFC-0003 therefore keeps three claims separate:

1. **Contribution provenance** says who or what produced, relayed, criticized,
   implemented, or verified exact candidate material, and how strongly that
   source identity is authenticated.
2. **Draft disposition** says which steward accepted, modified, rejected, or
   superseded that material inside a candidate draft. It does not establish
   correctness or adoption.
3. **Ratification authority** is the §22.1 event in which counted principals
   vote over exact normative bytes under a pinned rule. Neither authorship nor a
   merge to a repository branch substitutes for it.

This draft names s0fractal as its current steward while stating plainly that the
prose is predominantly model-generated and model-revised. Model voices may sign
contribution or disposition records when they control registered keys; unsigned
outputs may be preserved through attributed relays. In either case, a signature
establishes control of that contribution key, not the model runtime behind it,
independent custody, legal responsibility, or a ratification vote. A persistent
agent process and a transient model session can use the same record shape;
principal status depends on positive authority and custody evidence, not on
whether the producer is biological or computational.

The header above is a draft declaration backed by repository history, not an
`ArtifactContributionReceipt` or an s0fractal-signed adoption receipt.

Historical prompt, model-version, or session metadata is recorded when available
and otherwise remains `unknown`. It MUST NOT be reconstructed from style or
filled with a plausible vendor label. One signed disposition over an exact
candidate digest is stronger provenance than unverifiable per-paragraph
`generated_by` fields. The protocol records project authority; it does not
allocate legal liability.

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

**Evidence boundary.** Running both substrates from this repository can prove
that the schemas express the boundary, the transcript replays, and the two
ontology adapters can produce both agreement and divergence. It cannot prove
independent implementation, authority, custody, or resistance to operator
collusion. Separate folders, process names, sessions, or keys are not separate
parties by themselves.

To count as independent Level 4 interoperability evidence, the two ontology
interpreters MUST be maintained independently and MUST NOT share translation,
mapping, handshake-state, or policy-interpretation code. They MAY share the
content-pinned execution floor and canonical primitives being tested as the
declared protocol floor. Their authority and key-custody relation MUST be
disclosed; shared or unknown custody cannot substantiate a multi-principal
claim.

**The action.** `liquid` reports that a resource is exhausted. `myc` must decide
whether that constitutes grounds to withdraw a proposal that has already
collected witnesses — an action with external effect, therefore an irreversible
boundary under §13.3.

#### 16.7.1 This is not a translation

`exhausted` is an observation about a resource state. `grounds_for_withdrawal`
is a normative conclusion inside a proposal policy. Nothing about the first
_means_ the second; the second follows only through a rule someone with
authority adopted, and could be adopted differently without either ontology
changing.

Carrying that as a translation would let **policy masquerade as semantic
correspondence** — inheriting properties a normative rule does not have
(bidirectionality, a loss profile, validation by fixture agreement) and
laundering authorship, when the whole point is to be able to ask who decided.

The structure is three-part, not two:

```text
evidence  →  policy rule  →  warranted decision
```

The normative definition of `EvidenceBridge` is **§7.5, in Part 03** — it is a
translation-layer primitive, not a property of this demo. This section only
records why the demo needs one.

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

An in-repository demo passing these criteria falsifies defects in expression and
replay only. A claim of independent federation additionally fails if the two
ontology interpreters share code outside the allowed floor, if one operator can
author both sides without disclosure, or if divergence is impossible because
both sides call the same interpretation function.

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

| Primitive             | Existing source                                                   | Extend / create | Owner substrate                               | First executable test                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------- | --------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ContentAddress`      | `contracts/CANONICAL_HASH.v0.1.md`, `fixtures/canon-vectors.json` | extend          | trinity                                       | full-digest vectors alongside the existing 12-hex handles (§5.1 rule 4)                                                                                                               |
| `CanonicalEncoding`   | `warrant` SPEC §4 + `examples/canon-vectors.json`                 | adopt + extend  | federation contract; implementers independent | Warrant vectors pass unchanged; CNP-0 adds profile IDs, ratio/fixed, constants, quantization, two encoders, and a rejecting third verifier (§5.1.2–§5.1.3)                            |
| `StateDomain`         | none                                                              | create          | omega                                         | a domain that declares `Metric` without implementing it is rejected at registration (§6.3.1)                                                                                          |
| `AlgebraicLaws`       | none                                                              | create          | omega                                         | a law with `status: falsified` blocks composition; a `tested` law with no generator is rejected (§6.2)                                                                                |
| `InvariantDefinition` | scattered invariant checks across substrates                      | create          | omega                                         | a `transition`-scope invariant evaluated from one state fails rather than reporting held (§6.1.1)                                                                                     |
| `InvariantEvaluation` | none                                                              | create          | omega                                         | same predicate + same snapshots ⇒ same report on two substrates; a stale snapshot yields `not assessed` (§6.1.2)                                                                      |
| `TypedState`          | substrate-local state shapes                                      | create          | trinity                                       | a `minimal`-profile state is refused at a boundary requiring `full`, not backfilled (§5.2)                                                                                            |
| `CompositeState`      | none                                                              | create          | liquid                                        | a composite with an undeclared coupling fails validation while every component validates (§6.5.2)                                                                                     |
| `LossProfile`         | none                                                              | create          | trinity                                       | canonical-byte equality survives alternate bracketings and set-array permutations; associativity, identity, non-commutativity, and translation-only monotonicity hold (§7.1.0–§7.1.1) |
| `TransformKind`       | none                                                              | create          | trinity                                       | an undeclared kind is treated as `reconstruction`; a reconstructed value is refused at an irreversible boundary (§7.0.3)                                                              |
| `SuitabilityProfile`  | none                                                              | create          | trinity                                       | a self-reported `forIrreversibleAction` is recorded as `undetermined` regardless of the claim (§7.2.2)                                                                                |
| `ConflictOccurrence`  | `src/x2B88_decisions.myc.md` chord ledger                         | extend          | myc, liquid                                   | two occurrences sharing a fingerprint are not merged without a receipted lineage claim (§19.16)                                                                                       |
| `AdmissionStage`      | `myc` proposal lifecycle, `contracts/GOVERNANCE_FLOW.v0.md`       | extend          | myc                                           | eligibility replays bit-for-bit from the receipt; authorization is attributed and not recomputed (§10.1.3)                                                                            |
| `ExecutionFloor`      | `ski@v1` / Σ-GLYPH Book I v0.5                                    | adopt (pinned)  | omega                                         | the same fixture yields identical output bytes under two substrates' evaluators (§13.4.1.1)                                                                                           |
| `HandshakeMessage`    | none                                                              | create          | trinity                                       | wrong-turn input is rejected; progress-budget exhaustion declines; ordering mode cannot switch inside one transcript (§13.4.3.1–§13.4.3.1.1)                                          |
| `EvidenceBridge`      | `warrant` decision records                                        | extend          | myc, trinity                                  | a bridge presented as a translation — carrying a loss profile — is rejected (§7.5)                                                                                                    |

Notes on the table:

1. **The selected candidates are extended, not reinvented.** CNP-0-JCS reuses
   Warrant's tested JCS surface, and the execution floor reuses `ski@v1`
   (§17.1). CNP-0 still needs its own normative vectors and independent gates;
   reuse is prior evidence, not inherited conformance. Adoption requires pins.
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

- **Tranche A3 (canonical encoding).** Part 01 §5.1.2.1 now selects
  **CNP-0-JCS** in the draft: RFC 8785 JCS over strict I-JSON, integers bounded
  to ±(2^53−1), IEEE floats forbidden, and exact ratio or domain-scoped
  fixed-point selected per state domain. It also separates the wire identifier
  `hsp-jcs@v0` from numeric profile `cnp-0`, with both inside digest input.

  This resolves the design choice, not the tranche. Warrant's 47 canonical
  vectors and Python/Go/Rust agreement are prior evidence for the JCS layer;
  they do not exercise CNP-0 identifiers, ratios, fixed scales, constants,
  circles, or quantization. A3 remains pending until `CANONICAL_ENCODING.v0.1`,
  the CNP-0 corpus, two independent encoders, a third verifier-only rejection
  path, and federation adoption exist.

  **Corrected 2026-08-03 by measurement.** This entry originally read as a
  choice between `warrant`'s profile and the federation's existing
  `CANONICAL_HASH`. An inventory of what actually exists
  (`probes/canonical-forms-inventory-v0`) found ten canonical forms, not two,
  and showed that those particular two are **layers rather than rivals** —
  `CANONICAL_HASH` digests a text body without parsing it, so a structural
  canonicalizer feeds it rather than replacing it. It also found a second live
  structural canonicalizer this RFC did not know about
  (`packages/canonical-receipt`, RFC 8949 canonical CBOR, published on jsr). A
  further claim made in that pass — that `RECEIPT_ENVELOPE.v1.0` leaves its own
  encoding unfixed — was itself wrong and is retracted in Part 01 §5.1.4: the
  contract fixes deterministic CBOR explicitly and models the per-family
  declaration §5.1.1 rule 6 asks for. See Part 01 §5.1.4.
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
   trust configuration are different Ed25519 keys. They MUST NOT both count
   toward one quorum while their principal equivalence and custody relation are
   unresolved. A principal-binding record under §22.1 may bind them as one
   actor, rotate one into the other, or support a claim of distinct principals;
   a declaration alone cannot establish independent custody. This is a
   pre-ratification identity gate, distinct from §20.17's still-open question of
   what an already-active compatibility contract does when its party later
   forks.
2. **Draft selection is not adoption authority.** Part 01 chooses CNP-0-JCS as
   the text's candidate. That does not make Warrant the owner of federation
   encoding, import its governance, or bind substrates that have not ratified
   and implemented the contract.
3. **Version pinning is mandatory if adopted.** `ski@v1` names Book I v0.5
   specifically, and `GOV-ANCHORS` pins its dependencies by content hash for the
   stated reason that a STANDARD must not rest on a moving target. Any adoption
   here MUST pin the same way; citing a repository URL is not a pin.

### 17.3 External standards reuse boundary

This RFC does not replace the Semantic Web or content-addressed storage. The
following standards are non-normative prior art and candidate implementation
components. Their URLs are discovery aids, not dependency pins; adoption still
requires exact profiles, versions, bytes, and executable gates.

| Standard family                                                                                                                                 | What it already supplies                                                                          | Where it can serve HSP                                                                                              | What HSP adds or keeps separate                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [RDF 1.2](https://www.w3.org/TR/rdf12-concepts/), [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/), [RDFC-1.0](https://www.w3.org/TR/rdf-canon/) | a graph data model, a JSON-based linked-data serialization, and canonical RDF-dataset labelling   | an RDF-backed state domain, import/export projection, or canonical dataset identity under a declared domain profile | non-graph domains; typed operations and invariants; translation loss, action suitability, authority, admission, and receipts          |
| [OWL 2](https://www.w3.org/TR/owl2-overview/) and [SKOS](https://www.w3.org/TR/skos-reference/)                                                 | formalized vocabularies/ontology semantics and a model for sharing knowledge-organization systems | ontology descriptors, taxonomies, mapping inputs, and domain-specific reasoning profiles                            | evidence grades, bounded mapping domains, asymmetric loss, mutation budgets, compatibility contracts, and irreversible-boundary rules |
| [SHACL](https://www.w3.org/TR/shacl/)                                                                                                           | validation of RDF data graphs against shapes graphs                                               | an invariant predicate and evidence engine for an RDF-backed domain                                                 | cross-domain translation, contextual suitability, non-RDF state families, and authorization                                           |
| [IPLD](https://ipld.io/docs/data-model/)                                                                                                        | an abstract data model, codecs, bytes, and content-addressed links                                | a transport/store backend or CID projection under §5.1 rule 6                                                       | one selected HSP identity profile and semantic contracts; IPLD storage is not mandated and a CID does not attest meaning or loss      |

Reuse is evaluated per state domain. An RDF/OWL/SHACL implementation that meets
a domain's contract is preferable to renaming the same machinery, while an
adapter that changes representation or semantics is still a declared HSP
transformation with a loss profile. RDFC-1.0 may identify an RDF dataset; it
does not silently become the identity of a probability simplex, causal model, or
authority decision.

The distinction also answers an apparent contradiction between §2.1 and §5.1.1.
One canonical **byte envelope** is not one universal **semantic domain**. CNP-0
defines how a finite HSP object is identified across substrates; the object's
domain descriptor still determines its valid points, operations, laws, and
invariants. Serializing a graph and a partial order through one envelope does
not make either obey the other's semantics, just as writing both in UTF-8 would
not make them one language.

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

### 19.0 Threat model boundary

This section gathers the security assumptions already distributed through the
normative parts. It is a map, not a claim that the protocol supplies a complete
Byzantine consensus, availability, custody, or confidentiality construction.

**Assets.** The protocol protects the referent of a content address; authorship
and ordering of protocol messages; provenance and declared loss across
translation; invariant and suitability evidence; admission and ratification
inputs; authority at consequential or irreversible boundaries; and the
append-only history needed to audit those decisions.

**Adversary capabilities.** A caller, translator, proposer, federation party,
sequencer, or operator may submit malformed input; omit or fabricate loss;
replay, reorder, fork, or selectively withhold messages; downgrade a metadata
profile; split one conflict or mutation across identities; choose multiple keys;
collude across nominal components; exploit an under-scoped fast path; or submit
fixtures intended to consume unbounded resources. Cryptographic forgery and
digest collision remain bounded by the selected algorithms; principal and
custody independence do not follow from cryptography (§19.17).

**Trust boundaries and assumptions.** A signature establishes control of a key,
not semantic truth, authority, or a distinct principal. A receipt establishes
what was recorded under its pinned evaluator and inputs, not that a policy was
wise. A content address establishes byte identity only after canonical-profile
validation and while the addressed bytes remain resolvable. Fixture agreement
supports only its declared mapping domain (§13.4.3.2). External authority,
availability, key custody, algorithm agility, and confidentiality mechanisms
must be supplied and content-pinned by the adopting deployment.

**Security goal.** At a consequential boundary, missing, malformed,
under-scoped, downgraded, incomparable-to-a-hard-limit, or unauthorised evidence
fails closed. The protocol preserves attribution and disagreement rather than
manufacturing global agreement. It does not promise federation-wide liveness,
termination, or convergence: `decline`, stable disagreement, a Pareto set, and
an unresolved conflict are legitimate terminal or persistent states. A stronger
consensus or liveness claim requires a separate, adopted protocol and its own
proof or executable evidence.

Representative attack paths and their primary controls are indexed here so a
reviewer need not infer the model from section titles:

| Attack path                                                   | Primary control                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| replay, reordering, or transcript fork                        | content-addressed envelopes and the selected ordering discipline (§13.4.3–§13.4.3.1)                      |
| key multiplication presented as independent quorum            | principal bindings and principal counting (§19.17, §22.1)                                                 |
| generated or signed contribution presented as authority       | separate contribution, disposition, and ratification records (§0.1, §19.18, §22.1)                        |
| metadata/profile downgrade                                    | boundary rejection rather than backfill (§5.2, §19.11)                                                    |
| translator hides loss or grades its own action output         | canonical loss carriers and independently grounded suitability (§7.1–§7.2.2, §19.3–§19.4)                 |
| caller launders consequential work through the fast path      | runtime-derived operation scope and aggregate audit (§15.0–§15.3, §19.9)                                  |
| reference substitution or truncated-digest collision grinding | canonical bytes and full load-bearing digests (§5.1, §19.10)                                              |
| resource exhaustion by fixture or repeated mutation           | bounded execution floor, budgets, debt, and terminal outcomes (§10, §13.4.1.1, §19.6)                     |
| peer or sequencer stalls, censors, or disappears              | pinned progress bounds, local abort, decline-and-restart without in-place ordering fallback (§13.4.3.1.1) |
| hidden or unavailable evidence                                | disclosure/availability layering and explicit verification state (§14.1)                                  |

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

### 19.17 Single-operator collusion and correlated custody

Signatures prove control of keys; they do not prove that the keys have distinct
custodians, that policies have independent authority, or that two protocol
parties can resist one operator instructing both. An operator controlling every
side can manufacture an apparently multi-party transcript without breaking any
signature primitive. This protocol can require disclosure and refuse an
independence claim; it cannot cryptographically prevent that operator from
colluding with itself.

A deployment with shared or unknown custody MAY exercise schemas, deterministic
execution, transcript ordering, and replay. It MUST NOT cite separate folders,
voices, sessions, processes, or keys as evidence of distinct principals. It MUST
mark multi-principal quorum, third-party attestation, and the
`distinct authority` basis of §8.2.3 as unestablished unless it carries evidence
of distinct authority and custody. A self-controlled component is not a third
party merely because it has another key.

This is a threat-model boundary, not a waiver. Claims that rely only on
`distinct substrate` or `distinct derivation` remain testable under §8.2.3, but
they MUST be named narrowly and MUST NOT be upgraded into authority or quorum
independence. Ratification applies the stricter vote-counting rule of §22.1.

### 19.18 Contribution laundering

A generated draft, critique, proof, implementation, or signed voice record may
be presented as though its producer also accepted the policy, supplied an
independent review, or possessed authority to bind others. This is the artifact
equivalent of §7.5's authorship laundering.

The defenses are the three distinct claims of §0.1 and the
`ArtifactContributionReceipt` of §22.1. A contribution MAY be valuable and
cryptographically attributable while having no ratification weight. Conversely,
a steward may accept text the steward did not write without claiming to be its
prose author. Repository inclusion proves neither correctness nor governance
adoption. A consumer MUST reject any authority claim that can cite only
generation metadata, a source signature, a Git merge, an advisory delegation, or
multiple outputs under correlated custody.

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
15. Can CNP-0-JCS's safe-integer bound, exact-rational reduction cost, and
    fixed-point domain migrations meet fast-path volumes, and does its eventual
    independent corpus justify federation adoption (§5.1.2–§5.1.3)?
16. Are distinct substrate, distinct derivation, and distinct authority
    sufficient for policy independence, or can correlated failure survive all
    three (§8.2.3)?
17. What happens to a scoped compatibility contract when a party forks or amends
    its identity mid-contract — does the contract bind the predecessor, the
    successor, both, or lapse (§12, §13.2)? `warrant` SPEC §5.1 answers the
    narrower key-rotation case; the contract-binding case is still open.
    Pre-ratification double-counting of unresolved keys is not part of this open
    problem; §22.1 already fails it closed.
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
24. What positive authority and custody evidence may promote a persistent agent
    process from signed contributor to counted principal without treating a new
    key, model version, or session as independence (§0.1, §19.17, §22.1)? Until
    an adopted rule answers this, the distinction fails closed.

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

### Declared intent — pre-conformance

A substrate MAY publish a domain and ontology declaration before it has the
encoding, evidence, typed deltas, and invariant machinery below. That is useful
design material, but it is **not a conformance level** and MUST NOT be
advertised as HSP Level 0. Its expected boundary behavior is refusal wherever a
missing L0 artifact is required.

### Level 0 — Conformant core

Level 0 is deliberately substantial. It is the smallest interoperable core, not
a low-cost declaration badge: implementing it includes canonical identity,
validation, evidence-bearing laws, typed deltas, invariant scope/cost, and
stable key identity. Teams should budget it as an implementation project; the
pre-conformance state above exists so incomplete work can be shown honestly
without weakening the base level.

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
reasoning is in [Part 07: Revision History](07-revision-history.md) §4.

### 22.1 Ratification records and principal counting

Ratification is a content-addressed event over exact bytes, not a label applied
to a moving branch. A deployment MAY preserve the earlier contribution and
draft-disposition layers without confusing either with a vote:

```ts
type ArtifactContributionReceipt = {
  subject: ContentAddress; // exact candidate bytes or content-addressed change set
  role:
    | "generation"
    | "critique"
    | "disposition"
    | "implementation"
    | "verification";
  producerKind:
    | "human"
    | "model-session"
    | "agent-process"
    | "tool"
    | "unknown";
  producer: ContentAddress | null; // identity/runtime descriptor, when evidenced
  sourceAttestation: ReceiptRef | null; // producer signature or platform attestation
  relayedBy: KeyRef | null;
  disposition:
    | "proposed"
    | "accepted-into-draft"
    | "rejected"
    | "superseded";
  dispositionAuthority: AuthorityRef | null;
  dispositionReceipt: ReceiptRef | null;
  evidence: EvidenceRef[];
};
```

The receipt MUST use the selected canonical carrier. `evidence` is a canonical
set under §5.1; duplicate references are rejected. `subject` identifies what was
actually handled rather than a mutable filename or branch. Missing source
authentication MUST remain explicit: a relayer may attest the bytes received and
their claimed attribution, but MUST NOT manufacture a producer signature, model
version, prompt digest, runtime identity, or custody claim.

`accepted-into-draft` requires both a `dispositionAuthority` and a verifying
`dispositionReceipt` over the exact subject and disposition. It means only that
the named authority incorporated candidate material. It is not evidence that the
material is true, independently reviewed, conforming, legally endorsed, or
ratified. A producer signature proves control of its key; it does not by itself
prove which model or process ran behind that key.

No `ArtifactContributionReceipt`, Git author line, merge, voice signature,
delegated advisory scope, or count of generated outputs contributes a vote to a
ratification quorum. A persistent agent MAY be bound as a principal only through
the same `PrincipalBinding`, custody evidence, authority rule, and vote required
of every other principal. A transient session or a set of keys MUST NOT be
promoted by naming it a “delegated principal.” Advisory delegation retains the
delegating principal's count unless positive evidence and an adopted rule
establish a genuinely distinct principal.

A conforming ratification record has at least this shape:

```ts
type PrincipalBinding = {
  principal: ContentAddress; // identity descriptor, not a display name
  keys: KeyRef[];
  custody: "independent" | "shared" | "unknown";
  evidence: EvidenceRef[];
};

type TrancheRatification = {
  schema: "hsp-ratification@v0";
  rfc: "RFC-0003";
  tranche: string;
  normativeParts: { part: string; digest: ContentAddress }[];
  dependencyRatifications: ContentAddress[];
  ratificationRule: ContentAddress;
  principalBindings: ContentAddress[];
  votes: ReceiptRef[];
  supersedes: ContentAddress | null;
};
```

`normativeParts` MUST pin the exact canonical bytes whose requirements are being
accepted, including every part containing the tranche and its dependencies. The
rule, bindings, votes, and dependency records MUST themselves be
content-addressed. A repository tag, URL, branch, filename, or mutable version
label is not a ratification target.

Every counted vote MUST verify under a key in a cited `PrincipalBinding`. Two
keys MUST NOT count as two principals merely because their public bytes differ.
Keys declared as the same actor, sharing custody, or having unresolved actor or
custody equivalence count at most once in one quorum. A claim of distinct
principals needs positive evidence of distinct authority and custody; a warrant
that only asserts “two actors” does not manufacture independence. In particular,
the unresolved `claude` and `claude-fable-5` keys of §17.1.2 cannot both advance
one RFC-0003 quorum.

A tranche is ratified only when its record verifies, its pinned dependency
ratifications are already valid, its declared quorum is satisfied under
principal—not key—counting, and every executable gate named by the tranche is
green against those exact bytes. Passing tests without this record is evidence,
not ratification. `GOV-ANCHORS` is a standing candidate for the ratification
rule; using it requires a content pin and does not import it by citation alone.

### 22.2 Amendment and supersession

Ratified normative bytes are immutable. Any normative edit, including one
described as an erratum, produces a new candidate and does not inherit the old
status silently. To amend a ratified tranche:

1. publish the new normative-part digests and a machine-readable change set;
2. cite the prior ratification record in `supersedes` and retain it;
3. rerun the tranche's executable gates and every dependency gate affected by
   the changed bytes;
4. satisfy the prior record's ratification rule. The new record MAY add
   constraints; it MUST NOT remove an old requirement unless the old rule itself
   authorizes that change;
5. issue a new ratification record whose votes bind the new digests and the
   superseded record.

If the amendment changes the canonical encoding or numeric profile, the new
record MUST additionally bind a `ProfileTransitionPolicy` under §5.1.5. A
successor may choose `reencode` with a pinned equivalence contract or an
explicit `clean-break`; it MUST NOT inherit reference equality by version-name
similarity or rewrite historical receipts.

Unchanged tranches retain their status only when their own pinned normative
bytes and dependency-ratification digests are unchanged. If either moves, the
consumer MUST treat the tranche as pending until a superseding record says how
the dependency change was accepted. Part 07 records editorial history but has no
authority to amend a ratified part by itself. Silent in-place change and
retroactive vote reuse are non-conforming.

### 22.3 Section-to-document map

Every section number in this set is global and stable (see the header). This is
where a reference resolves:

| Sections                        | Part                    |
| ------------------------------- | ----------------------- |
| §0–§4, §16–§23                  | Part 00 (this document) |
| §5.1, §5.1.0–§5.1.5, §14, §14.1 | Part 01                 |
| §5 (core model), §6             | Part 02                 |
| §7                              | Part 03                 |
| §8, §9, §10, §11                | Part 04                 |
| §13                             | Part 05                 |
| §5.2, §12, §15                  | Part 06                 |

### Tranche A — Identity and encoding (no dependencies)

- **A1.** Make every protocol reference content-addressed, reusing
  `CANONICAL_HASH.v0.1`, and require full digests wherever a reference gates an
  irreversible boundary, admission, identity amendment, or trust computation.
- **A2.** Require a single canonical encoding meeting §5.1.1, with the float
  policy of §5.1.2 and cross-substrate parity fixtures per §5.1.3.
- **A3.** Commission and ratify `CANONICAL_ENCODING.v0.1` for the draft-selected
  CNP-0-JCS profile (§5.1.2.1), with its normative corpus (§5.1.3), at least two
  independent encoders, and a third verifier-only path that rejects malformed
  raw input and non-canonical ratios. The text selects the design; this tranche
  is not satisfied until interoperability and adoption are evidenced.
- **A4.** Require stable, verifiable key identity at Level 0.
- **A5.** Ratification counts principals rather than public keys: bind keys to
  content-addressed principal and custody records, and fail unresolved or shared
  custody closed against double-counting (§22.1).

Tranche A is a prerequisite for every other tranche. Until A2 and A3 land,
§5.1's guarantees do not hold across substrate boundaries and nothing that
depends on cross-substrate reference equality should be claimed. A draft choice
reduces design uncertainty; it does not weaken this gate.

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
- **C2.** Adopt the canonically encoded loss carrier and equality relation, loss
  monoid, suitability meet, and debt monoid of §7.1.0–§7.1.1, §7.2.1, and
  §7.3.1. Undefined or prose-only loss atoms cannot satisfy this decision.
- **C3.** Replace scalar translation confidence with contextual suitability
  profiles, and forbid self-reported action-context suitability.
- **C4.** Make composed translators first-class, with round-trip anchors
  measured against source canonical bytes.
- **C5.** Adopt the five-kind transformation taxonomy of §7.0; require monotone
  loss of `translation` only, and attribution of new information for the rest.
- **C6.** Add `EvidenceBridge` (§7.5) as a primitive distinct from translation,
  so a normative policy cannot be carried as a mapping.

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
  receipt-recorded path predicate. Translation debt is scope-local: global,
  overlapping, malformed, or unknown-scope debt blocks; a bounded debt proven
  disjoint from the complete operation scope does not (§15.0).
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
  not give a total order. A sequencer must be a named keyed party and receipt
  every ordering decision. The handshake pins deterministic progress bounds;
  sequencer failure declines the transcript, and changing discipline requires a
  new handshake (§13.4.3.1–§13.4.3.1.1).
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
  claim that Levels 4–5 work. An in-repository run proves expression and replay;
  independent interoperability additionally requires independently maintained
  ontology interpreters and disclosed authority/custody boundaries. Exercises A,
  C, G.

### On the split

Three reviewers, independently, proposed decomposing this RFC. The split was
carried out; this document is the umbrella that remains. The reasoning, and why
it was deferred twice before being accepted, is in
[Part 07: Revision History](07-revision-history.md) §5.

What matters going forward rather than backward:

1. **Ratification is per tranche, per document.** A ratified tranche constrains
   something. An unratified complete specification constrains nothing while
   looking as though it does, which is the more dangerous of the two states.
2. **Part 01 still blocks conformance.** Its draft encoding is selected; the
   missing contract, corpus, independent implementations, rejection path, and
   adoption keep every later part non-conforming across substrate boundaries.
3. **The first post-erratum artifact is code, not another prose-only revision.**
   `probes/hsp-fast-path-debt-scope-v0` makes the debt-locality term of §15.0
   executable with eleven fail-closed tests and a local benchmark. It is a
   Tranche F fragment, not conformance and not a substitute for §17.2's
   dependency order. The first row there — full-digest vectors beside 12-hex
   handles — remains the smallest executable blocker. Marginal value has moved
   from text to those tests and the demos of §16.

---

## 23. Final principle

The federation does not need one perfect domain of thought.

It needs a disciplined way for different forms of state to coexist, translate,
conflict, evolve, and act together without erasing what makes them different.

The purpose of this RFC is not to make every reality commensurable. It is to
make the boundaries, losses, costs, and commitments of commensuration visible
and verifiable.
