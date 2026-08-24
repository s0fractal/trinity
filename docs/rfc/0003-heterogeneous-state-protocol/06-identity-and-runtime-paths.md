# RFC-0003 / Part 06: Governed Identity and Runtime Paths

- **Status:** Draft
- **Authors:** s0fractal + model collaborators
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0003-heterogeneous-state-protocol/06-identity-and-runtime-paths.md`
- **Parent:**
  [Part 00 — Architecture and Ratification
  Map](00-architecture-and-ratification-map.md), which holds the theses,
  non-goals, terminology, dependency graph, failure-mode catalogue, and open
  problems this document depends on.
- **Ratifies:** Tranche F (F1–F3), Tranche H (H1)
- **Depends on:** Parts 01, 02
- **Created:** 2026-08-03 (extracted from the original single-file draft after
  four rounds of external critique; see [Part 07](07-revision-history.md))

> **Section numbers are inherited and stable.** This document keeps the section
> numbers it carried inside RFC-0003. They are not renumbered from 1, because
> ledger chords and prior receipts cite them, and a cross-reference that
> silently changes meaning is the failure this protocol exists to prevent. A
> reference of the form §N.M is resolvable through Part 00's §22 map.

---

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
                       including the predicate evaluation itself
not coupled          — the operation touches no component of a coupled composite
                       state (§6.5.1)
no relevant debt     — no outstanding translation-debt term has global scope or
                       intersects the operation scope defined below
invariants unchanged — the operation touches no invariant in the identity policy
```

The runtime, never the caller, MUST derive an `OperationScope` from the actual
read/write set and its semantic closure:

```ts
type OperationScope = {
  refs: ScopeRef[]; // §7.3.1 typed full-digest references
  debtIndexSnapshot: ContentAddress;
};
```

The closure contains every state-lineage, domain, ontology, component, and
invariant reference touched by the operation, plus any component or invariant
pulled in by a declared coupling or dependency. `refs` is a non-empty canonical
set. The debt index snapshot commits to the complete outstanding debt set
against which the decision was evaluated.

A debt term is relevant when its scope is `global` or when one typed reference
in its bounded scope exactly matches one in the operation closure. A resolved
term does not appear in the outstanding snapshot. An unrelated bounded term MUST
NOT block the fast path. A missing snapshot, incomplete operation closure, empty
bounded scope, unknown scope kind, malformed reference, or legacy term without
scope MUST block it. This makes locality fail closed without turning one debt in
ontology A into a permanent governed-path tax on an independent operation in
ontology B.

The path-selection receipt MUST bind the operation-scope digest, debt-index
snapshot, and either the matching debt-term digests or a verifiable empty-match
result. A runtime MAY use a content-addressed scope index or membership proof to
avoid scanning every term, but the index is an optimization of the same result,
not a weaker predicate.

The predicate MUST fail closed: if any term is unknown, unavailable, or
expensive to evaluate, the operation takes the governed path. Evaluating the
predicate MUST be cheaper than the ceremony it skips, or it has no purpose.

#### 15.0.1 The predicate and the receipt must both be affordable

That last sentence is a requirement easy to state and hard to satisfy. Eight
terms evaluated per operation, plus a reconstructible receipt written per
operation, can easily exceed the cost of incrementing a counter — and if it
does, the two-path design has not made the protocol affordable, it has added a
second expensive path.

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
   federation message arriving, a relevant/global/unknown-scope debt being
   recorded, an identity amendment, or a coupling being added. A bounded debt
   proven disjoint from the held operation scope does not end the segment, but
   the proof and new debt-index snapshot MUST be attached to its receipt;
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
