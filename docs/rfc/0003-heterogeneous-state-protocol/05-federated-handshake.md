# RFC-0003 / Part 05: Federated Handshake and Compatibility Boundaries

- **Status:** Draft
- **Authors:** s0fractal + model collaborators
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0003-heterogeneous-state-protocol/05-federated-handshake.md`
- **Parent:**
  [Part 00 — Architecture and Ratification
  Map](00-architecture-and-ratification-map.md), which holds the theses,
  non-goals, terminology, dependency graph, failure-mode catalogue, and open
  problems this document depends on.
- **Ratifies:** Tranche G (G1–G6)
- **Depends on:** Parts 01, 03, and a selected execution floor
- **Created:** 2026-08-03 (extracted from the original single-file draft after
  four rounds of external critique; see [Part 07](07-revision-history.md))

> **Section numbers are inherited and stable.** This document keeps the section
> numbers it carried inside RFC-0003. They are not renumbered from 1, because
> ledger chords and prior receipts cite them, and a cross-reference that
> silently changes meaning is the failure this protocol exists to prevent. A
> reference of the form §N.M is resolvable through Part 00's §22 map.

---

## 13. Federated Ontology Protocol

The most important case is not multiple state domains inside one agent, but
multiple agents or substrates with different ontologies.

```ts
type AgentOntology = {
  owner: AgentId | SubstrateId;
  ontology: OntologyRef;
  domains: DomainRef<unknown>[];
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

It is tempting to state the floor as **non-semantic** — bytes and authorship
only, no claims about the world. That would be false, and §13.4.2 falsifies it:
evaluating fixtures and comparing outcomes is execution, and two parties whose
outcomes are to be meaningfully compared must execute under the same semantics.
A shared deterministic execution semantics is not a claim about bytes; it is the
largest thing in the floor ([Part 07: Revision History](07-revision-history.md)
§1).

The floor is therefore stated with five elements, the fifth admitted:

1. **Byte identity** — the canonical encoding and digest of §5.1. This lets both
   parties agree on _which object_ is under discussion without agreeing on what
   it means.
2. **Authorship** — signature verification and a key identity, so a statement
   can be attributed and later held against its author.
3. **Handshake vocabulary** — the small set of message kinds below, whose
   meanings are fixed by this RFC and are about the protocol, not the domain.
4. **Ordering discipline** — a hash-chained envelope plus an agreed discipline
   for resolving concurrent extension (§13.4.3.1), declared in `hello`, so
   negotiation state is well-defined without a shared clock. The chain alone
   gives ancestry, not order.
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
before proving it would be §19.7's failure mode committed in the section that
exists to disclaim it.

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
// Every message travels in an envelope. Authorship, ordering, and the chain
// link belong to the envelope, not to each variant — an earlier shape put
// `prev` inside the `hello` variant only, which meant the rule requiring it on
// every message had no type to live in.
type HandshakeEnvelope = {
  author: KeyRef;
  prev: MessageRef | null; // null only for `hello`
  body: HandshakeMessage;
};

type HandshakeMessage =
  | {
    kind: "hello";
    // What this party will run, by content address rather than by name.
    // A version string is weaker than everything else in this protocol:
    // §5.1 identifies objects by digest, and an evaluator named by string can
    // be changed under a handshake without the reference moving.
    executionFloor: ExecutionFloorRef;
    // Which ordering discipline this party proposes (§13.4.3.1). Both sides
    // MUST agree; a mismatch is a `decline`, not a negotiation, because two
    // parties running different disciplines disagree about whether a message
    // was legal without either being at fault.
    ordering:
      | { kind: "turn-taking" }
      | { kind: "author-chains-with-merge" }
      | {
        kind: "sequencer";
        sequencer: KeyRef;
        receiptProfile: ContentAddress;
      };
    // Shared deterministic progress bounds; full content digest (§13.4.3.1.1).
    progressPolicy: ProgressPolicyRef;
    floorVersion: string; // human-readable label only; nothing verifies it
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

type HandshakeProgressPolicy = {
  // Canonical non-negative CNP-0 integers.
  maxEnvelopes: number;
  maxFixtureEvaluations: number;
  // A budget in the declared execution floor's own content-addressed cost model.
  evaluatorBudget: ContentAddress;
  onExhaustion: "decline";
  onSequencerFailure: "decline-and-restart";
};

type ProgressPolicyRef = ContentAddress; // full digest of HandshakeProgressPolicy
```

Every message after `hello` MUST carry a non-null `prev` in its envelope — the
content address of the message it follows (§13.4.3.1). Putting `author` and
`prev` in the envelope rather than in each variant is what makes that rule
enforceable by a type rather than by prose: there is one place to check, and a
variant cannot forget the field by not declaring it.

`hello` carries `executionFloor` as a **content address**, not a name. A version
string would be the one identifier in this protocol that nothing verifies, and
§5.1's whole argument is that a mutable name cannot anchor an audit.
`floorVersion` survives as a human-readable label for ledger legibility, with
the same standing as §6.2.1's version label: nothing verifies against it.

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

"A way to say that one message preceded another" was left unspecified in the "A
way to say that one message preceded another" cannot be left unspecified: in a
distributed setting that means it is decided by whoever implements it first.
There is no global clock, timestamps are assertions by their author, and
negotiation state depending on either is not well-defined.

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

**Hash chaining alone does not give a total order.** In a two-party protocol
both sides can honestly reply to the same head at the same time:

```text
   M0
  /  \
A1    B1
```

Neither party equivocated — the authors differ, each extended the head it had.
The chain is intact, the ancestry is correct, and there is no total order. A
fork detector scoped to one author does not fire here, and the negotiation state
— "the chain head" — is now two things.

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
  reintroduces a privileged party and MUST NOT be the default, per §13.4.4. The
  `hello` MUST name the sequencer by verifiable key and pin the ordering-receipt
  profile by content address. Every accepted ordering decision MUST carry a
  signed receipt binding the handshake reference, message reference, assigned
  position, prior ordering receipt, and sequencer key. A transcript with a
  missing, invalid, equivocal, or discontinuous ordering receipt MUST NOT
  authorize an irreversible boundary. If the adopted receipt profile is Warrant,
  these are warrant receipts; this RFC does not silently adopt Warrant merely by
  requiring the shape.

Whichever is chosen MUST be declared in `hello`, because two parties running
different ordering disciplines will disagree about whether a message was legal
without either being at fault.

This orders messages _within_ a handshake. It does not order events across
handshakes or across the federation, and MUST NOT be presented as doing so.

##### 13.4.3.1.1 Progress, timeout, and sequencer failure

Safety without a progress bound permits an untrusted party to turn fixture
exchange into unbounded work. Conversely, a wall-clock timeout cannot become an
objective protocol fact when §13.4.3.1 deliberately assumes no shared clock. The
handshake therefore separates deterministic transcript bounds from local
availability observations.

1. Both `hello` messages MUST bind the same full-digest `progressPolicy`; a
   mismatch is a `decline`. Counts MUST be CNP-0 non-negative integers and the
   evaluator budget MUST use the execution floor's pinned cost model.
2. Every accepted envelope and fixture evaluation MUST consume the applicable
   bound. Exhaustion terminates the transcript as `decline`; a party unable to
   emit the final envelope records a local terminal receipt. An exhausted or
   stalled transcript MUST NOT authorize an irreversible boundary.
3. A deployment MAY apply a local idle timeout or availability policy. Its
   expiry authorizes that party to stop waiting; it is not evidence that the
   counterparty censored, failed, or violated a shared deadline unless a
   separately adopted time/availability oracle supplies that evidence.
4. A missing, invalid, equivocal, or discontinuous sequencer receipt is
   `sequencerFailure`. The parties MUST decline and start a new handshake to
   select turn-taking, explicit merge, or another sequencer. They MUST NOT
   switch ordering discipline inside the old transcript: doing so would make
   earlier legality depend on a later fallback rule.

This gives a bounded failure path, not a liveness theorem. A peer or sequencer
can still refuse service; HSP prevents that refusal from being converted into a
successful compatibility or action claim.

#### 13.4.3.2 A fixture set is not a domain

§13.4.3 rule 1 says a mapping MUST NOT be credited beyond the region where
fixtures agreed, and calls that the mapping's declared domain. That sentence
does more work than it can carry: fixtures are a finite set of points, and a
domain is a region. Without a rule turning one into the other, "the agreeing
region" is a decorative name for a list of examples — the same defect this
protocol objects to elsewhere.

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

Open: whether the floor can be reduced further (§20.14); whether behavioral
grounding can distinguish genuine agreement from coincidental agreement on an
unrepresentative fixture set (§20.12); and how mappings survive a party forking
mid-contract (§20.17).

---
