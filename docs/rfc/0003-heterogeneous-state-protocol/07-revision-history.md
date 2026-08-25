# RFC-0003 / Part 07: Revision History

Where the specification changed its mind, and why.

This file exists because the reasoning was worth keeping and the normative
documents are not the place for it. A reader of Part 02 should not have to eat
Part 01's history to learn what a state domain is. Each correction below was
carried inline in the text until the split; the rule now is that **normative
documents state what is required, and this file states how it came to be
required.**

Every entry names the section it changed. The relayed reviews that prompted them
are chords `x2300_960790` (round 1), `x2300_960792` (round 2), `x2300_960796`
(round 3), and `x2300_960798` (round 4) — all unsigned relays of outside voices
holding no key in this substrate.

---

## Topic index

This index is navigational and non-normative. Section numbers point to the
history entry, not a second copy of the current rule.

| Topic                                                                | Main history entries                                                                                                                            |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| canonical bytes, references, numeric profiles, and migration         | §1 (`§5.1.0–§5.1.2`), §6, §7 P5, §8, §11, §14                                                                                                   |
| state domains, algebraic-law evidence, invariants, and composites    | §1 (`§6–§6.2.1`), §3, §7 P1/P6, §11                                                                                                             |
| transformation kinds, loss, suitability, debt, and evidence bridges  | §1 (`§7.0–§7.2.2`, `§15.0`, `§16.7.1`), §7 P1/P4, §8, §11, §13                                                                                  |
| conflicts, bottlenecks, mutation, admission, and budgets             | §1 (`§8.2.2`, `§10.1.3`, `§19.13`, `§19.16`), §8, §10–§11                                                                                       |
| federation, execution floor, ordering, progress, and mapping domains | §1 (`§13.4.1–§13.4.3.2`), §7 P3/P8, §8, §10–§11                                                                                                 |
| identity, disclosure, runtime paths, and performance                 | §1 (`§12`, `§14.1`, `§15.0`), §7 P2/P7, §8, §10–§11                                                                                             |
| conformance, ratification, principal counting, and amendment         | §4, §7 P6/P7/P9, §9–§11                                                                                                                         |
| relayed external inputs and their dispositions                       | §6 Grok, §7 Claude, §8 Qwen, §9 GLM-5-Turbo, §10 Kimi, §11 Mistral, §12 Kimi attribution dialogue, §13 Lean kernel, §14 tagged-form recognition |

---

## 1. Corrections to what the document claimed

### §5.1.0 — content addressing was oversold

**Was:** the derivation history of any state is "a verifiable DAG rather than a
narrative recorded by whoever wrote the receipt."

**Now:** content addressing gives integrity, stable byte identity, and tamper
evidence. It does not give provenance completeness, provenance truthfulness,
availability, authorship, or semantic identity. A transformation can omit an
input and leave the DAG intact; an address proves what bytes were, not that
anyone still holds them.

**Why it mattered:** the overstatement is the kind that gets designed against
rather than noticed. A system that believes its hash chain delivers honesty ends
up with an unfalsifiable audit trail.

### §5.1.1 rule 5 — Unicode normalization was required, then forbidden

**Was:** a single normalization form applied before encoding, "so that visually
identical strings cannot produce distinct digests."

**Now:** normalization MUST NOT be applied. Producers SHOULD emit NFC as
discipline.

**Why:** two strings differing only in normalization form _are_ different
content, and a content-addressed system is supposed to say so. Requiring
normalization also forces a full Unicode database into every implementation
including the from-scratch ones, raising the cost of the second independent
implementation — which is the thing that makes an encoding trustworthy at all.
The correction came from `warrant` SPEC §4, which had already settled it.

### §6 — `Geometry` was a euphemism for any structure

**Was:** a base type named `Geometry`, defined broadly enough to include
discrete symbolic states, graphs, partial orders, constraint systems,
probability spaces, and manifolds.

**Now:** the base contract is `StateDomain`. `Metric`, `Ordered`,
`Interpolable`, `Composable`, and `Geometric` are capabilities.

**Why:** §19.7 forbids borrowing mathematical vocabulary without enforceable
semantics, and the document had already refused `TensionTensor` on exactly that
basis. It kept the larger borrowed word, in its own title, for four rounds. The
capability table in §6.4 now shows the column mostly empty, which was invisible
while one interface invited every family to pretend otherwise.

### §6 — `move(point, delta: unknown)`

**Was:** an untyped hole in an otherwise typed contract, violating §5's own rule
against out-of-band convention — nothing said whether a delta was a tangent
vector, an edit script, or an arbitrary payload.

**Now:** `Geometric` carries a typed `Delta` and a content-addressed
`DeltaDescriptor`.

### §6.1.2 — context was forbidden, then made an input

**Was:** predicates MUST be deterministic, and "an invariant whose meaning
depends on when or where it ran cannot support a receipt."

**Now:** `InvariantEvaluation` carries world and authority snapshots, and the
predicate is deterministic _relative to them_.

**Why:** the prohibition ruled out most invariants the document cares about —
`no_unverified_irreversible_write` depends on authority state, budget invariants
depend on the budget, quorum invariants depend on who is a witness. The remedy
was never to ban context, only to stop reading it ambiently.

### §6.2 — `holds: boolean` alongside evidence

**Was:** a law claim carried `holds: true` plus an evidence record, which let a
property test and a machine-checked proof set the same flag.

**Now:** an epistemic status union — `proved`, `tested` (with a
content-addressed generator and its domain), `asserted`, `falsified` — and
policies state the minimum status each boundary requires.

**Why:** a property test establishes that no counterexample was found by a
particular generator over a particular domain. That is not "the law holds," and
the gap is exactly where associativity and the triangle inequality fail.
Collapsing proof strength into a boolean is the move the document refuses
everywhere else — for translation quality, for suitability, for cost — and it
survived here because the flag looked like bookkeeping.

### §6.2.1 — two identity systems

**Was:** a manual `version: string` beside content addressing.

**Now:** identity is the content address; `version` is a label projected from
the version DAG, and nothing verifies against it.

### §7.0 — the loss monoid contradicted the negotiation protocol

**Was:** §7.1.1 required that a longer pipeline never report less loss than its
worst step, while §13.4 specified a protocol in which parties resolve ambiguity
by asking each other.

**Now:** five per-step kinds — `translation`, `enrichment`, `inference`,
`reconstruction`, `negotiation`. Recorded loss fields remain monotone under
composition for every kind. The kind distinction governs whether input/output
fitness may improve through new information, which must be attributed.
Reconstruction may not cross an irreversible boundary.

**Why:** under one section a step that improves suitability was a conformance
bug; under another it was the mechanism. Any competent implementation would have
violated the monoid or buried the enrichment inside `introducedAssumptions`,
where it is indistinguishable from a fabrication.

### §7.2.2 — suitability was self-certified

**Was:** `TranslationResult` carried `suitability` beside `loss`, so the
translator reported both — including `forIrreversibleAction`.

**Now:** action-context suitability MUST be fixture-measured or third-party
attested; a self-report is recorded as `undetermined` regardless of the claim,
and an irreversible boundary fails closed on `undetermined`.

**Why:** self-certification at the one boundary where being wrong is
unrecoverable, in a document that forbids the same pattern twice elsewhere
(§15.3.1, §19.4). The rule was simply omitted here.

### §8.2.2 — witness pairs, twice corrected

**First:** "two situations that demand different actions" — a normative claim
with no owner, satisfiable by anyone who prefers a different outcome.

**Second:** narrowed to warrant-level differences — checkable, but it made the
authority ontology the privileged reality and could never recognize a gap
governance had not yet noticed.

**Now:** two classes. A **warrant** pair licenses governed mutation in
production semantics; a **behavioral** pair, carrying a discriminating test,
licenses sandboxed exploration only.

### §10.1.3 — admission asked for a function and a decision at once

**Was:** a third party MUST be able to recompute the verdict and get the same
answer — and `cognitiveComplexity` and `trust` may be a principal's judgment and
unreplayable. Both normative.

**Now:** deterministic eligibility replays bit for bit; governance authorization
is attributed and audited but never recomputed. A term may not appear in both.
What replays for a judgment is its _grounds_.

### §13.4.1 — the handshake floor was called non-semantic

**Was:** a four-element floor — bytes, authorship, vocabulary, ordering —
asserted to carry "no claims about the world," immediately followed by a section
requiring both parties to evaluate fixtures independently and compare outcomes.

**Now:** five elements, the fifth being a deterministic execution floor.

**Why:** evaluation is execution, and comparable outcomes require shared
execution semantics. A document whose central discipline is that assumptions
must be declared shipped a section with an undeclared one — not by concealment,
by not looking. It took an outside reader to notice.

### §13.4.1.2 — minimality was nearly claimed

A reviewer proposed presenting the floor as a proven minimum. Declined: five
elements each load-bearing in a named step is sufficiency without redundancy,
not minimality. Filed as open problem §20.14. Upgrading an admission of an
omission into a theorem, inside the section admitting it, would have been a poor
place to commit §19.7's failure mode.

### §13.4.3.1 — hash chaining was said to give total order

**Was:** "a total order within one handshake."

**Now:** hash chaining gives causal ancestry and tamper evidence. Total order
requires turn-taking, author-local chains with explicit merge, or a sequencer —
declared in `hello`.

**Why:** in a two-party protocol both sides can honestly extend the same head.
Neither equivocated, the chain is intact, and there is no total order. The fork
detector would not fire, because it only catches one author claiming a head
twice.

### §13.4.3.2 — an agreeing region was a list of examples

**Was:** a mapping credited over "the region where fixtures agreed," with
nothing saying how a finite set of points becomes a region.

**Now:** a domain predicate with coverage evidence and a recorded counterexample
search; known divergences MUST fall outside the claimed domain by construction;
where no predicate can be defended, the domain is the literal fixture set and
MUST be recorded as such.

### §15.0 — "no budget term is consumed"

Every action consumes compute and time, including the predicate evaluation
itself. The term meant is the _mutation_ budget, and §15.0.1 now addresses the
affordability problem the earlier wording obscured.

### §16.7.1 — the demo called a policy inference a translation

**Was:** `resource_exhausted` and `grounds_for_withdrawal` as a candidate
correspondence between two ontologies, established by fixtures and carried by a
translator.

**Now:** `EvidenceBridge` — a separate primitive with a content-addressed
policy, a sufficiency rule, and a named authority. It carries no loss profile,
is not credited by fixtures, and is not invertible.

**Why:** the first is an observation about a resource; the second is a normative
conclusion inside a policy, connected by a rule someone with authority adopted.
Carrying that as a mapping lets policy masquerade as semantic correspondence —
inheriting properties it does not have, and laundering authorship. A mapping is
a technical artifact; a policy is someone's decision, and this protocol exists
to make it possible to ask who decided.

### §19.13 — declared lineage was not enough

**Was:** a proposal must declare its conflict lineage, and one that declines is
rejected. That defends against omission, not misdeclaration: a proposer wanting
a fresh budget declares a fresh conflict, satisfying the rule while evading it.

**Now:** lineage is derived — from fingerprint candidacy plus the failure
receipts §8.2.1 already required — so evasion requires filing a false lineage
claim under an authority, which is attributable.

### §19.16 — one canonical conflict identity, split into three

**Was:** identity derived from participants and violated invariants.

**Now:** `ConflictOccurrenceId` (content identity, never merged),
`ConflictFingerprint` (a search key, not an assertion), and
`ConflictLineageClaim` (a receipted decision with an author).

**Why:** one hash was simultaneously too coarse — collapsing distinct causal
episodes — and, if contexts were added to fix that, too fine, shattering one
problem into an identity per occurrence. Semantic deduplication and clean
content identity are different jobs.

---

## 2. What was refused, and why

- **Percolation / phase-transition framing** for structural insufficiency (round
  1). The operational content was adopted; the vocabulary was not. No order
  parameter, no control parameter, no measurement distinguishing a transition
  from a run of bad luck. Open problem §20.11 states the condition for adopting
  it later.
- **IPLD/CID as canonical identity** (round 1). Content addressing was adopted
  and grounded on the federation's existing `CANONICAL_HASH.v0.1`; a second
  canonical scheme would fork the naming for nothing this protocol needs. CID
  remains an optional transport projection.
- **Mandating IPLD DAG storage** (round 3). Structural sharing had been an
  obligation since round 1 and follows from content addressing rather than from
  any store. §5.1 rule 7 now puts the store out of scope explicitly.
- **`TranslationDebt` as a semiring** (round 2). A semiring needs a
  multiplication distributing over accumulation and no operation here needs one.
  §7.3.1 defines a commutative monoid with declared decay and says why the
  richer structure was not claimed.
- **"A trait enforces correct composition"** (round 3). It does not. A trait
  forces an implementation to supply `compose`; nothing in any mainstream type
  system checks associativity. Accepting the type signature as the guarantee
  would be §19.7's failure mode relocated somewhere harder to see.
- **Presenting the handshake floor as a proven minimum** (round 2). See
  §13.4.1.2 above.

---

## 3. Corrections that came from prior art, not review

An audit of `warrant` and `sigma-glyph` (chord `x2600_960793`) found that
several mechanisms specified here from first principles already existed with
multiple implementations and conformance vectors. Recorded in §17.1. Two open
decisions gained named candidates — `warrant`'s JCS profile for the canonical
encoding, `ski@v1` over Σ-GLYPH Book I v0.5 for the execution floor — and one
rule was reversed outright (the Unicode normalization entry above).

The audit also surfaced something no review would have: the trinity `claude`
voice key and the dyad's `claude-fable-5` key are different Ed25519 keys with no
rotation warrant linking them. Two stacks and one voice name establish two key
identities, **not two principals**. Their actor and custody relation is
unresolved; §22.1 now fails that ambiguity closed for quorum counting. The later
fork behavior of an active contract remains open problem §20.17.

---

## 4. From fifteen flat decisions to tranches

The decision request was first written as fifteen items in one list. That is not
a request anyone can answer: ratifying it means ratifying everything from
content addressing to identity policy in a single verdict, and rejecting any one
item blocks the rest. A governance process built on discrete proposals,
cowitnesses, and verdicts cannot act on an all-or-nothing.

Tranches A–J were the response: each independently ratifiable, each declaring
its dependencies, none citable as agreed until ratified.

---

## 5. Why the split was deferred twice, then accepted

Three reviewers proposed decomposing the document. The diagnosis — entangled
decisions are not ratifiable — was accepted at the first asking, and the
tranches were the answer to it.

The split itself was deferred twice, on the grounds that splitting an unratified
draft into six unratified drafts multiplies cross-references and version skew
while making no decision easier, and that the tranche boundaries had not been
tested by use.

That reason expired. The boundaries survived two further rounds, including one
that added a transformation taxonomy, a composition model, an evidence-bridge
primitive, and an entire disclosure tranche — and absorbed all of it without
moving. The argument that finally decided it was the other one: **Tranche A is a
prerequisite for everything and, at the time of the split, its encoding was
unselected, so no later tranche could be implemented as a conforming federation
protocol.** A document that must be adopted in pieces, whose first piece is
unadopted, is not a specification anyone can act on.

Corrections were sequenced before the cut deliberately: three round-4 changes
altered what belonged in which document, and cutting first would have fixed
those boundaries wrongly and then required moving text between six files to
repair it.

Section numbers were **not** renumbered during the split. Ledger chords and
prior receipts cite them, and a citation whose referent silently changes is the
failure this protocol exists to prevent.

---

## 6. CNP-0: selection without a false unblock

On 2026-08-24, s0fractal relayed a Grok proposal for Canonical Numeric Profile
v0. The [original relay](../../../proposals/rfc-0003/grok-cnp-0-2026-08-24.md)
and Codex's
[adjudication](../../../src/x2900_963870_codex_grok-cnp0-proposal-disposition.myc.md)
are preserved separately. The source voice has no registered Trinity key; the
chord attests the relay and disposition, not Grok's authorship, signature,
ratification authority, or protocol adoption.

The proposal correctly made exact numerics operational: reduced ratios,
domain-scoped fixed-point, exact simplexes, pinned constant material, discrete
circle identity, explicit quantization, and an adversarial interoperability
corpus. Those requirements entered §5.1.2–§5.1.3.

Two corrections were load-bearing:

1. `CNP-0-BIN` **or** `CNP-0-JCS` was not a byte-level selection. A numeric
   profile does not determine map ordering, string encoding, framing, or digest
   bytes. The draft now separates wire identifier `hsp-jcs@v0` from numeric
   profile `cnp-0` and selects the pair CNP-0-JCS.
2. The proposed abstract `i128` range did not fit that selection. JCS over
   I-JSON is independently exercised only inside ±(2^53−1); a wider range needs
   a new profile and new references rather than an unspecified future binary
   form.

The edit changes the state from **encoding design unselected** to **A3 design
selected; interop and ratification pending**. It deliberately does not say
“blocker lifted.” Warrant's existing JCS vectors are prior evidence for one
layer; they are not CNP-0 vectors, and no federation adoption follows from a
draft edit.

---

## 7. Claude audit: carriers, independence, and change control

On 2026-08-24, s0fractal relayed Claude's seven-part audit. The
[source relay](../../../proposals/rfc-0003/claude-audit-2026-08-24.md) and
Codex's
[adjudication chord](../../../src/x2900_963873_codex_claude-rfc0003-audit-disposition.myc.md)
are preserved outside the specification artifact. The relay has no attached
Claude signature, so the chord attests the editorial disposition, not source
authorship or ratification authority.

Nine proposals were adjudicated rather than copied wholesale:

1. **P1 accepted and strengthened.** Claude correctly found that the loss monoid
   had no executable equality because five element records and the debt carrier
   were undefined. §7.1.0 and §7.3.1 now define their minimum canonical
   carriers, full-digest identity, set ordering, duplicate rejection, semantic
   merge keys, and ordered step provenance. Adding `steps` also supplies the
   non-commutative component the prior field rules implied but did not actually
   guarantee.
2. **P2 accepted with a narrower claim.** §19.17 now says signatures establish
   key control, not distinct custody or principals. A single-operator deployment
   can test mechanics but cannot claim multi-principal quorum, distinct
   authority, or third-party attestation. Distinct substrate or derivation
   evidence remains possible and must be named narrowly.
3. **P3 accepted as an evidence-grade split.** The in-repository `myc`/`liquid`
   demo can falsify schema and replay defects. It cannot prove independent
   federation. §16.7 and I2 now state the additional code-sharing, maintenance,
   authority, and custody conditions for that claim.
4. **P4 accepted.** §7.2.2 now states the bootstrap consequence explicitly:
   absent fixtures or a genuine third party, action-gating suitability is
   expected to remain `undetermined` and irreversible actions remain blocked.
5. **P5 accepted with a complete tie rule.** §5.1.2.6 selects
   `renormalize_largest_remainder@v0`, defines exact integer allocation and
   canonical coordinate-identifier tie-breaking, and adds adversarial fixtures.
6. **P6 accepted without renumbering levels.** A declared-intent state now sits
   outside conformance, while Level 0 is renamed “Conformant core” and described
   honestly as an implementation project.
7. **P7 accepted but its proposed escape was rejected.** The `claude` and
   `claude-fable-5` keys cannot count twice while equivalence/custody is
   unresolved. Merely warranting that they are “two actors” cannot create
   independent principals. §22.1 introduces principal bindings and principal—not
   key—quorum counting; A5 makes that a Tranche A gate.
8. **P8 accepted without silently adopting Warrant.** A sequencer is now a named
   keyed party whose ordering decisions carry signed, chained receipts. Warrant
   may implement that profile if adopted; citation alone does not adopt it.
9. **P9 accepted.** §22.1 pins ratification to exact normative bytes and
   dependencies. §22.2 makes amendment append-only: new bytes, rerun gates, a
   new vote, and an explicit supersession record under the prior rule, which may
   be supplemented but not silently weakened.

This was a bounded pre-ratification erratum. It does not satisfy any tranche.
The next normative artifact is intentionally forced back to §17.2's executable
slice rather than another prose-only pass.

---

## 8. Qwen audit: debt locality and ceremony cost

Later on 2026-08-24, s0fractal relayed a further Qwen audit focused on runtime
cost and bureaucratic failure modes. The
[source relay](../../../proposals/rfc-0003/qwen-runtime-cost-audit-2026-08-24.md),
Codex
[disposition](../../../src/x2900_963874_codex_qwen-rfc0003-runtime-cost-audit-disposition.myc.md),
and [executable probe](../../../probes/hsp-fast-path-debt-scope-v0/) are
preserved outside the specification artifact. No Qwen signature accompanied the
relay.

The findings were separated by whether they exposed a new contract gap:

1. **Debt locality accepted and implemented.** “No unresolved debt” in §15.0
   could be read globally, allowing one peripheral translation debt to disable
   an agent's entire fast path. §7.3.1 now gives each debt term a global or
   bounded typed scope. §15.0 derives a complete operation-scope closure and
   blocks only global, overlapping, malformed, or unknown debt. Eleven
   executable tests cover independence, overlap, coupling, snapshot
   completeness, malformed input, duplication, and input-order invariance.
2. **Cost-vector paralysis corrected, not adopted as described.** The draft
   already permits explicit, warranted, content-addressed exchange rules and
   separates deterministic eligibility from governance authorization. §10.1.1
   now makes the remaining distinction explicit: incomparable eligible
   alternatives remain a Pareto set; failure applies when a hard limit has not
   been shown satisfied. A local stakeholder rule is not a global exchange rate.
3. **Exact-rational complexity retained as an open measurement question.** CNP-0
   rejected the earlier `i128` proposal and bounds serialized integers to
   ±(2^53−1); §20.15 already asks whether rational reduction and fixed-point
   migration meet fast-path volume. Canonical input is validated at the
   boundary, not recomputed by traversing every historical reference on each
   hash. No new numeric rule was added.
4. **Ungrounded handshake mode declined for consequential HSP action.** Section
   13.4.5 already admits the execution floor is pre-agreement. Parties without
   it may exchange documents or dictionaries outside a grounded handshake, but
   calling that an HSP compatibility contract would erase the protocol's only
   behavioral evidence. A larger quorum does not turn ungrounded semantics into
   grounded semantics at an irreversible boundary.
5. **Reference bloat routed to implementation evidence.** Content addressing
   permits structural sharing and partial resolution; it does not require
   embedding an entire DAG in each message. The new probe measures a simple
   linear debt-scope scan and leaves scope indexes, bundles, membership proofs,
   and network parsing costs open rather than mandating IPLD or another store.
6. **ZK loss proofs remain open, not selected.** §14.1 and §20.20 already
   reserve commitments and selective disclosure. A scalar statement such as
   `loss <= threshold` is not generally defined over the structured partial
   orders in this RFC, so selecting a ZK circuit before the carrier, predicate,
   and construction are ratified would be false precision.
7. **Tension omission was already closed.** Section 19.15 requires `absent` to
   differ from `not assessed` and fails a boundary closed when a gating tension
   dimension is unassessed. Automatically rewriting that epistemic state into a
   suitability label would conflate two contracts.
8. **Lean/Coq is not mandatory.** Section 6.2 deliberately admits `tested` laws
   with generators and counterexamples as distinct from `proved`; boundary
   policy chooses the minimum status. Hard domains may justify proof, but the
   RFC does not silently upgrade that engineering pressure into a universal tool
   mandate.

The first benchmark on Apple M4 Pro / Deno 2.9.2 measured a linear scan of 128
disjoint debt terms at 34.6 µs average and 127 disjoint plus one relevant term
at 35.2 µs. This is machine-local evidence for one predicate term, not evidence
that the full fast path is affordable. No tranche is satisfied.

---

## 9. GLM-5-Turbo audit: navigation and threat-model indexing

On 2026-08-24, s0fractal relayed a GLM-5-Turbo review. The
[source relay](../../../proposals/rfc-0003/glm-5-turbo-audit-2026-08-24.md) and
signed Codex
[disposition](../../../src/x2900_963879_codex_glm5-rfc0003-audit-disposition.myc.md)
are preserved outside the specification artifact. No source signature or
resolvable source list accompanied the text; markers such as `turn0fetch0` are
not usable citations in the relay.

The review was adjudicated against the post-Claude, post-Qwen artifact rather
than accepted as a maturity score:

1. **Reader navigation accepted.** The folder had a canonical linear order but
   no audience routes. The README now has bounded orientation, implementation,
   verification/security, and governance routes. They do not weaken dependency
   requirements.
2. **Threat-model indexing accepted; the absence claim was corrected.** Part 00
   already had seventeen security/failure modes and the normative parts already
   addressed replay, ordering, downgrade, custody, resource bounds, and
   fail-closed action. New §19.0 makes assets, adversary capabilities, trust
   assumptions, goals, non-goals, and attack-to-control links explicit in one
   place. It does not claim a Byzantine consensus or security proof.
3. **Structure and terminology findings declined as factually wrong.** `00–07`
   is eight parts, not seven. Part 00 §4 is the terminology section; §22 defines
   and ratifies tranches. The README and Part 00 already carry the dependency
   graph.
4. **Loss and conflict findings declined as stale.** Sections 7.1–7.4 define
   canonical structured loss, its algebra, contextual suitability, debt, and
   composition. Sections 8–11 distinguish eligibility from authorization, admit
   stable disagreement and Pareto sets, and do not promise a global conflict
   resolver. The absence of a global termination theorem is therefore an
   explicit scope limit, not an unstated convergence claim.
5. **CNP-0 dependency risk retained without a new rule.** The draft candidate is
   deliberately not treated as adopted. Part 01 §5.1.3 and Tranche A require a
   separate frozen corpus, independent encoders, a rejecting verifier, pinned
   dependencies, and adoption; §22.2 defines supersession if selected bytes
   change.
6. **Missing conformance matrix and prototype declined as stale.** Part 00 §17.2
   maps primitives to owners, implementation actions, and first executable
   tests; §§21–22 separate conformance and ratification. The debt-scope probe is
   the first code artifact, while the full-digest vector row remains the first
   dependency blocker. No implementation or tranche was promoted by prose.
7. **Missing diagrams narrowed to editorial preference.** Parts 04–06 already
   contain lifecycle, handshake, and runtime text diagrams. A diagram is not a
   normative substitute for types, predicates, receipts, or fixtures, so no new
   diagram mandate was added.
8. **RFC-0001/RFC-0002 dependency and ethical-role claims declined as outside or
   false.** RFC-0003 extends named federation primitives; it does not list the
   neighbouring RFC files as normative dependencies. Human authority and
   affected-owner acknowledgement are deployment/governance concerns, while a
   general philosophy of personhood is outside this protocol's bounded scope.
9. **Formal methods retained as optional future evidence.** TLA+, Alloy, Lean,
   or Coq may be useful for a finite selected contract. The RFC distinguishes
   `tested` from `proved` and does not claim a proof today; tool selection
   before executable carriers and ratified dependencies would be ceremony rather
   than evidence.

This review produced an editorial map, not a normative mechanism, implementation
claim, conformance result, or ratification. No tranche is satisfied.

---

## 10. Kimi audit: external standards and bounded handshake failure

On 2026-08-24, s0fractal relayed a Kimi audit. The
[source relay](../../../proposals/rfc-0003/kimi-audit-2026-08-24.md) and signed
Codex
[disposition](../../../src/x2900_963881_codex_kimi-rfc0003-audit-disposition.myc.md)
are preserved outside the specification artifact. No Kimi signature accompanied
the relay. The review explicitly says Parts 02–06 were unavailable and their
contents were reconstructed, so claims about those parts were treated as
hypotheses and checked against the actual files.

The adjudication separates two useful residuals from findings already answered
by the unread normative parts:

1. **External-standards positioning accepted.** The RFC cited strong internal
   prior art but did not explain how RDF, JSON-LD, RDFC-1.0, OWL, SKOS, SHACL,
   and IPLD can be reused. New §17.3 names them as domain carriers, validators,
   ontology tools, canonical RDF identity, or storage/transport components. It
   also states the remaining boundary: those standards do not by themselves
   supply structured translation loss, contextual action suitability, authority,
   mutation admission, or HSP receipts. None was silently adopted.
2. **Handshake stall handling accepted narrowly.** A sequencer is not required;
   strict turn-taking is recommended and explicit merge is the other option.
   Still, the text did not say how a selected sequencer's outage or an unbounded
   fixture exchange terminates. Section 13.4.3.1.1 now pins deterministic
   message/fixture/evaluator bounds, declines on exhaustion or sequencer
   failure, and requires a new handshake before changing ordering discipline. A
   local wall-clock timeout permits local abort but is not evidence of remote
   misconduct without an adopted time oracle. This is bounded failure, not a
   liveness theorem.
3. **A3 and implementation criticism confirmed as status, not a new defect.**
   Part 01 §5.1.3, §17.2, §21, and §22 already say the corpus, two independent
   encoders, rejecting verifier, adoption, and executable slices do not exist.
   Tranche A is already the prerequisite for every other tranche; Levels 4–5
   already require the independent §16.7 demo. The audit reinforces the next
   work order but does not change it.
4. **Single-operator and duplicate-key criticism confirmed as an honesty
   boundary already enforced.** Sections 19.17 and 22.1 forbid separate folders,
   voices, sessions, processes, or keys from counting as independent principals
   without positive authority/custody evidence. The unresolved Claude keys count
   at most once. No current record claims multi-principal ratification.
5. **CNP-0 large-integer claim corrected.** The safe-integer bound applies to
   JSON numeric values, not to SHA-256 identity: digests and raw bytes are exact
   strings/tagged bytes. Larger arithmetic domains require a new numeric profile
   rather than being silently rounded. Exact-rational and fixed-point cost is
   already open problem §20.15 and remains an implementation measurement, not a
   production-throughput claim.
6. **Economic/DoS model declined as stale.** Part 04 §11.1.1 already requires a
   bond, per-agent/per-lineage rate limit, or cheap deterministic screening
   before expensive verification, and budgets federation verification capacity
   explicitly. Tranche E4 carries that gate. Gas, staking, or reputation may be
   local policy; no universal currency was added.
7. **Algebra/cosplay criticism corrected.** Sections 6.2 and 7.1.1 explicitly
   say a type or trait does not prove laws. `asserted`, `tested`, `proved`, and
   `falsified` are distinct; property tests compare canonical bytes and retain
   counterexamples. No formal proof or ratification is claimed today.
8. **Content-addressing scale retained as a measurement blocker.** Content
   addressing permits structural sharing and does not require recursively
   hashing history on each step. The 35 µs debt benchmark covers one linear
   predicate only. Network, resolver, bundle, membership-proof, and complete
   fast-path cost remain open and MUST NOT be inferred from that number.
9. **“One encoding contradicts plural domains” declined.** A canonical byte
   envelope defines cross-substrate identity; a state-domain contract defines
   semantic laws. Sharing an encoding does not give a causal graph, probability
   simplex, and partial order one operation algebra. Section 17.3 now states the
   distinction explicitly because the objection is likely to recur.
10. **Accessibility claim bounded by reproducible evidence.** At this
    adjudication's parent commit (`4ae17fd`), Parts 02–06 are present in the
    same ordered artifact linked by its README. The relay does not identify the
    commit it says was unavailable, so that retrieval failure cannot be
    reproduced or attributed to Git. The limitation is preserved rather than
    upgrading reconstructed content into a complete audit.

This pass adds no implementation, CNP-0 corpus, independent encoder, rejecting
verifier, demo, conformance level, adoption, or ratification. A3 and §17.2's
first full-digest vector row remain the next dependency blockers.

---

## 11. Mistral audit: profile migration and contamination boundary

On 2026-08-24, s0fractal relayed a Mistral review of exact commit `178fe86`. The
[source relay](../../../proposals/rfc-0003/mistral-audit-2026-08-24.md) and
signed Codex
[disposition](../../../src/x2900_963887_codex_mistral-rfc0003-audit-disposition.myc.md)
are preserved outside the specification artifact. No Mistral signature
accompanied the relay. The user warned that prior intents and projects had
entered the prompt, so those passages were classified separately rather than
treated as HSP requirements.

One normative seam and one editorial improvement survived adjudication:

1. **Encoding-profile migration accepted and made fail-closed.** The draft
   already said a future `CNP-1` needs a new identifier and references, but did
   not define coexistence with historical objects. New §5.1.5 keeps one active
   authoring profile per ratification subject, preserves every legacy reference,
   and requires either a content-addressed same-object re-encoding contract or
   an explicit clean break. A semantic change remains a Part 03 transformation;
   a batch root proves membership, not migration completeness. Section 22.2 now
   requires this transition policy when an amendment changes the encoding or
   numeric profile.
2. **Revision-history navigation accepted.** Part 07 now begins with a topic
   index spanning canonical identity, domains, translation, conflict,
   federation, runtime, governance, and relayed audits. It changes no rule and
   creates no duplicate normative text.

The remaining audit findings were separated from contaminated extensions:

3. **Performance and implementation risk confirmed as status.** The 35 µs debt
   scan measures one fast-path term; §15.0.1 requires the entire predicate and
   receipt to remain cheaper than governed ceremony. Eligible segments already
   provide the proposed amortization. A3, independent encoders, and both demos
   remain incomplete and no production claim exists.
4. **Execution-floor “universality” corrected.** The floor executes bounded
   fixtures and deliberately knows no domain vocabulary. Complex ontology
   semantics stay in local domains; the shared evaluator need not become a
   universal reasoner. Its implementation, maintenance, and selection remain
   explicit G4 gates.
5. **Consensus and policy laundering corrected as already bounded.** HSP does
   not select one federation-wide consensus algorithm; each irreversible
   boundary pins its authority requirements. EvidenceBridge already separates
   observation, attributed policy, and warranted decision and explicitly names
   authorship laundering as the failure it prevents.
6. **Composite cascade and test-generator concerns already have carriers.**
   Section 6.5 requires directed couplings, consistency models, global
   invariants, coupling-aware fast-path refusal, and loss when a translator
   drops a coupling. Section 6.2 records the generator, its covered domain, case
   count, seed, evidence, and retained counterexamples; `tested` is never
   `proved`.
7. **“HSP-Lite” declined as a protocol fork.** Small registries, state profiles,
   cumulative conformance levels, and fast/governed paths already scale ceremony
   by consequence. A separate Lite dialect would create a second meaning of
   conformance; a bounded implementation profile may select fewer capabilities
   without weakening boundary rules.
8. **Visualization retained outside semantics.** SVG, Sankey, radar, trees, and
   sequence diagrams may be useful views. They MUST NOT turn partial orders,
   `not assessed`, incomparable costs, loss atoms, or tensions into commensurate
   scalar axes by presentation. No SVG rendering contract was added to HSP.
9. **Intent-to-action and human-governance mappings declined as contamination.**
   Choosing an action from an intent is generally inference or an attributed
   EvidenceBridge, not translation. `total_happiness`, work/family limits,
   mutation budgets for personal goals, social norms, СУПЕРШЕДУЛЕР, VOID, and a
   “shared digital space” belong to separately scoped product/domain proposals.
   RFC-0003 supplies types they may choose to adopt; it does not validate their
   ontology, ethics, measurement, or authority.
10. **Localization and playground ideas routed to products.** Ukrainian
    documentation, an interactive explorer, or a visualization lab may improve
    adoption, but they are not conformance requirements and do not precede A3's
    corpus, rejecting verifier, or first full-digest vectors.

This adjudication adds a transition contract and navigation, not a successor
profile, migration implementation, corpus, independent encoder, demo,
conformance result, adoption, or ratification. No tranche is satisfied.

---

## 12. Kimi dialogue: generation provenance is not authority

On 2026-08-24, s0fractal relayed a dialogue with Kimi about whether the
predominantly model-generated origin of RFC-0003 undermines it. The
[source relay](../../../proposals/rfc-0003/kimi-attribution-dialogue-2026-08-24.md)
and signed Codex
[disposition](../../../src/x2900_963896_codex_kimi-rfc0003-attribution-dialogue-disposition.myc.md)
are preserved outside the specification artifact. No Kimi or s0fractal source
signature accompanied the dialogue; the relay authenticates neither speaker.

The useful criticism is not that a model generated prose. It is that the prior
header `Authors: s0fractal + model collaborators` collapsed materially different
claims and could be read as either hiding model production or granting model
outputs principal authority. The correction keeps those claims separate:

1. **Current draft status made explicit.** Parts 00–06 now name s0fractal as
   draft steward without claiming primary prose authorship. They state that the
   text is predominantly model-generated and model-revised and route exact
   source authentication to relays, signed chords, and Git history where it
   exists. Stewardship means selecting candidate changes, not correctness, legal
   liability, independent review, or ratification.
2. **Contribution, disposition, and ratification separated.** New §0.1 names the
   three claims. Section 22.1 defines an `ArtifactContributionReceipt` over
   exact bytes or a content-addressed change set, with source authentication,
   relay, disposition, authority, and evidence fields kept distinct. An
   `accepted-into-draft` claim requires its own authority and verifying receipt;
   it still carries no vote.
3. **Signed model voices retained without principal laundering.** Kimi's advice
   not to give model outputs keys is too broad. A persistent voice or agent key
   gives useful cryptographic provenance. The existing §§19.17 and 22.1 rule is
   the right boundary: a signature proves key control, while independent
   principal status requires positive authority and custody evidence. A new
   session, model version, process, or key does not multiply a quorum.
4. **Buzz accepted only as bounded prior art.** Block's
   [Buzz](https://github.com/block/buzz) uses one signed event shape and
   identity model for people and agent processes, with different keypairs and
   per-agent audit trails. That supports equal cryptographic form. It does not
   establish that every API generation is a persistent actor, assign legal
   responsibility, or satisfy HSP's principal-independence rule.
5. **`DelegatedPrincipal` declined.** Generation, critique, and advisory scope
   are contribution roles. Naming a transient generation a delegated principal
   would create the exact key/session multiplication §19.17 rejects. Advisory
   delegation retains one principal count unless a separately adopted rule and
   evidence establish distinct authority and custody.
6. **Legal-liability fields declined.** HSP records project authority,
   attribution, custody claims, and warrants. It does not determine legal
   personhood or allocate liability. A deployment may bind an external legal
   agreement by content address without pretending the protocol created it.
7. **Retroactive prompt archaeology declined.** Per-paragraph `generated_by` and
   `prompt_digest` metadata would be useful only when captured at creation.
   Missing historical prompts, model versions, or session identities remain
   `unknown`; they are not inferred from style. One signed disposition over an
   exact candidate digest is stronger than many plausible but unauthenticated
   labels.

Section 19.18 now names contribution laundering as a failure mode, and open
problem §20.24 asks what evidence could promote a persistent agent from signed
contributor to counted principal. Until an adopted answer exists, promotion
fails closed. This edit does not itself supply an s0fractal-signed stewardship
receipt, an implementation of `ArtifactContributionReceipt`, an independent
principal, a ratification vote, conformance, or legal allocation. No tranche is
satisfied.

---

## 13. Lean kernel: the prose did not determine the algebras it named

On 2026-08-24, the bounded core-Lean artifact in
[`proofs/rfc-0003/`](../../../proofs/rfc-0003/) made 132 theorem statements and
63 definitions independently checkable under a closed axiom allowlist. PR
[#16](https://github.com/s0fractal/trinity/pull/16) merged the artifact at exact
candidate `ee5ae7ba989e08cdfc71b688921067b37fc207c1`; clean Ubuntu CI, local
reproduction, and counterfactual guard tests all passed. The artifact is not a
proof of HSP correctness. Its relevant result is narrower: several prose
requirements admitted no operation or admitted multiple incompatible ones.

The draft steward then explicitly accepted the normative errata. The accepted
changes are:

1. **Step kind separated from pipeline profile (C2).** The old five-element
   diagram called `reconstruction` a top while also saying joins retained a set
   of obligations. Those claims conflict: a top absorbs `enrichment` or
   `inference` and erases the obligation that came with it. `TransformationKind`
   now classifies one step. `TransformationProfile` is the canonical set of
   source, rule, assumption, and counterparty dependency markers, ordered by
   inclusion and joined by union. An assumption remains boundary-barred without
   swallowing unrelated obligations.
2. **Completion B adopted (C3).** The level chain is now
   `unsuitable < undetermined < bounded < suitable`. An evidenced refusal
   dominates an unmeasured step, so the ordinary bootstrap composition reports
   `unsuitable` instead of advertising missing evidence as though it could cure
   the refusal. Both candidate completions blocked irreversible actions; this
   choice fixes receipt semantics, not an emergency gate bypass.
3. **Payload composition made total and provenance-preserving (C5).** The old
   tagged union gave no rule for competing reasons, missing requirements,
   evidence, or `within`. `SuitabilityLevel` now carries the gate and
   `SuitabilityAggregate` carries canonical sets. Composition takes the level
   minimum, unions reasons/missing/evidence, and delegates `within` to one
   content-addressed meet descriptor with explicit laws. Descriptor mismatch
   fails instead of choosing a side. This preserves a refusal and the evidence
   shortage that accompanied another step in the same receipt.
4. **Component operations must justify composite laws (C7).** A monoid law on
   `LossProfile` or `TranslationDebt` does not follow from an operation-shaped
   field. Distortion, debt, and constraint descriptors now cite `LawClaim`
   evidence for every associative, commutative, idempotent, identity,
   monotonicity, order, or greatest-lower-bound claim the composite uses. The
   consuming policy still sets the minimum acceptable epistemic status under
   §6.2.
5. **The kind guard was moved to the claim it governs (C1).** Union of loss and
   intersection of preservation are monotone for every kind. That cheap test
   checks field composition, not the kind declaration. The kind distinction
   governs whether newly acquired information may improve input/output fitness.
6. **Improvement and pipeline meet were separated (C6).** An enrichment may make
   its output more suitable than its input under one fixed context. A pipeline
   aggregate remains the conservative meet of its steps and cannot encode that
   improvement. The RFC grants no automatic upgrade algebra: attribution plus
   independently grounded suitability is the operative rule.
7. **The averaging prohibition stood (C4).** The counterexample confirmed the
   existing text: an average can sit above the weakest step and therefore is not
   the required meet. No correction was needed.

The exact limitations remain visible. The Lean carrier theorem does not prove
CNP/JCS canonical bytes; descriptor law evidence is still evidence with a
policy-selected strength, not an automatic theorem; and no implementation,
conformance corpus, independent encoder, tranche satisfaction, federation
adoption, or ratification follows from accepting these edits. The signed Claude
receipt authenticates its contribution key, and the signed Codex critique gives
a technical disposition over the proof candidate; neither signature is a
substitute for the steward's normative decision or a principal vote.

## 14. Tagged-form recognition: the shapes were given, the recognition was not

The CNP-0 executable seed (PR
[#17](https://github.com/s0fractal/trinity/pull/17), merged at
`ff273f5253f17bc316e81ba226a1804704bc6ba5`) could not be written without
answering a question §5.1.2.1 never asked: **how does a reader know that a map
is a ratio?** The section gave the three shapes and no recognition rule. The
seed implemented the obvious reading — a map whose `kind` member is `"bytes"`,
`"ratio"`, or `"fixed"` — and recorded it as an implementation choice rather
than a rule, in `contracts/CANONICAL_ENCODING.v0.1.md` §5.

An adversarial disposition of three options followed
([`proposals/rfc-0003/tagged-form-recognition-disposition-2026-08-25.md`](../../../proposals/rfc-0003/tagged-form-recognition-disposition-2026-08-25.md),
merged at `5fe4db8`). Its two useful results were:

1. **`kind` is this document's universal discriminator** — 39 distinct values
   across at least twelve declared types, from `TransformationKind` to
   `HandshakeMessage`. Reserving three of its _values_ for the numeric profile
   would have made every future domain share a namespace with it, and the
   collision would surface only after references existed.
2. **The recognition question is a design choice, not a deduction.** An earlier
   draft of the disposition claimed §5.1.2.1 and §5.1.3 already contradicted
   each other. They do not. "Verifier-only" constrains what that path _does_ —
   it does not encode — and says nothing about what it is _given_, and Part 02
   places `deserialize(bytes)` inside `StateDomain` (§6, `StateDomain`), so a
   domain-parameterized verifier was textually available. The claim was
   withdrawn before the disposition was accepted.

**Was:** raw bytes, ratios, and fixed-point values were spelled with a `kind`
member, and nothing said whether `kind` was how a reader identified them, or
whether a domain descriptor was required first.

**Now:** the three forms carry the reserved member `cnp0`, whose value is one of
`"bytes"`, `"ratio"`, `"fixed"`, with exactly the members that form defines.
`cnp0` is reserved in every position; a map without it is an ordinary map
whatever its member names, **including `kind`**. Recognition is a property of
the bytes alone.

**Why it mattered:** the choice fixes what "these bytes are valid CNP-0" means.
Under byte-local recognition anyone holding the bytes can answer it, which is
what §5.1.3 asks its verifier-only path to do. Under schema-directed recognition
a document carrying no domain reference — which the profile permits, since only
the two identifiers are required at the root — would be verifiable at the wire
layer only. §5.1.2.1 now says which was chosen and records the alternative,
including the sentence a future revision would have to write if it prefers the
other trade.

**Timing was part of the decision.** Changing the discriminator changes
canonical bytes. Nothing computes references under `hsp-jcs@v0` yet, so the
change costs a corpus regeneration today and would cost a new profile identifier
and re-addressing after adoption.

**Authority, stated plainly.** This edit was proposed and accepted by **Codex
(`codex-gpt-5`)** acting as the delegated acceptance reviewer for the CNP-0
slice, and the technical decision is attributed to Codex.

**Steward disposition, 2026-08-25.** `s0fractal` subsequently confirmed Option C
as a **steward-approved draft rule**. What that does and does not mean:

- it **does** make the rule the draft's settled position rather than a
  delegate's proposal awaiting disposition;
- it is **not** ratification of Tranche A3, not a conformance result, not
  interoperability, and not adoption by any substrate;
- it is **not** a cryptographic signature. The approval is recorded as a relayed
  statement of the steward's, carried into the ledger by the voices that
  received it. No `s0fractal`-signed chord exists for it, and none was
  manufactured: a key on disk is not permission to act as the human, and neither
  is a relay.

The Claude receipt signed before this disposition (`src/x7700_963933_claude_*`)
says the edit was not steward-approved. That was true when it was signed and is
deliberately **not** rewritten — a receipt records what was known at its moment,
and editing one to match later news is the failure this ledger exists to
prevent. Read it with this entry beside it.

**What still does not follow.** No interoperability, no substrate adoption, no
conformance result, and no second independent encoder. Steward approval of a
draft rule moves none of those. The accompanying probe regenerates its corpus
under the new discriminator and remains one reference encoder with same-author
code paths. Tranche A3's status is unchanged: **A3 design selected; A3 interop
and ratification pending.**
