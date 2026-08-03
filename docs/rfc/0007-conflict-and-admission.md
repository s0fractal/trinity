# RFC-0007: Conflict, Bottleneck and Admission

- **Status:** Draft
- **Authors:** s0fractal + model collaborators
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0007-conflict-and-admission.md`
- **Parent:**
  [RFC-0003 — Heterogeneous State Protocol: Architecture and
  Ratification Map](0003-heterogeneous-state-geometries.md), which holds the
  theses, non-goals, terminology, dependency graph, failure-mode catalogue, and
  open problems this document depends on.
- **Ratifies:** Tranche D (D1–D3), Tranche E (E1–E5)
- **Depends on:** RFC-0004, RFC-0005
- **Created:** 2026-08-03 (split from RFC-0003 after four rounds of external
  critique; see [REVISION HISTORY](0003-REVISION-HISTORY.md))

> **Section numbers are inherited and stable.** This document keeps the section
> numbers it carried inside RFC-0003. They are not renumbered from 1, because
> ledger chords and prior receipts cite them, and a cross-reference that
> silently changes meaning is the failure this protocol exists to prevent. A
> reference of the form §N.M is resolvable through RFC-0003's §22 map.

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

A witness pair must not be satisfiable by preference — "these demand different
actions" is a normative claim whose owner is whoever wants the mutation. Nor may
it be narrowed to warrant-level difference alone, which would make the authority
ontology the privileged reality and could never recognize a gap governance has
not yet noticed ([REVISION HISTORY](0003-REVISION-HISTORY.md) §1).

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

A percolation / phase-transition framing has been proposed for this hypothesis
and is declined at the normative level. The analogy is suggestive —
representational bottlenecks do appear suddenly after long stretches of
adequacy, which is the shape a critical transition would have. But §19.7 forbids
borrowing mathematical vocabulary without enforceable semantics, and using the
term normatively would require an order parameter, a control parameter, and an
observable distinguishing a genuine transition from a run of ordinary failures.
None exist.

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
// A budget and a cost are a bound and a quantity in the SAME space. Earlier
// drafts spelled them as two independent records with different coordinate
// names — `migration` against `stateMigration`, `trust` and `time` present in
// one and absent from the other, `irreversibilityRisk` present only in the
// other. Two records that cannot be compared dimension-by-dimension cannot
// support §10.1.1's rule that a budget check fails if ANY dimension is
// exceeded, because there is no shared set of dimensions to iterate.
//
// One vector, one dimension set, two uses.
type CostDimension =
  | "compute"
  | "time"
  | "stateMigration"
  | "translatorCreation"
  | "verification"
  | "federationCoordination"
  | "cognitiveComplexity"
  | "longTermMaintenance"
  | "trust"
  | "irreversibilityRisk";

type CostVector = {
  // Sparse by construction: an absent dimension is UNASSESSED, not zero.
  // Conflating the two is §19.15's failure mode in the budget layer.
  [D in CostDimension]?: Quantity;
};

type MutationCost = CostVector; // what a mutation is estimated or measured to cost
type MutationBudget = CostVector; // the bound it must stay within
```

Because both are the same shape, a budget check is a dimension-wise comparison
over the union of their declared dimensions. A dimension present in the cost and
absent from the budget is **unbudgeted**, and MUST fail closed rather than pass
by omission — a mutation cannot buy itself room by inventing a cost nobody
bounded. A dimension present in the budget and absent from the cost is
**unassessed**, and MUST likewise fail closed at any boundary requiring that
dimension.

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
has a consequence: a verifier handed an admission report cannot re-evaluate the
decision unless it also has the rule that was applied. Without it,
`DomainAdmissionReport` is a narrative asserting that a comparison came out
favorably, and §14's requirement that a future verifier can ask "why was it
considered sufficient" cannot be met.

Therefore:

1. The **cost model** — the dimensions, units, estimators, comparison rule, and
   any exchange rules — MUST be a content-addressed object.
2. Every admission decision MUST record the cost model's address alongside the
   inputs it was evaluated on.
3. Changing the cost model changes its address and therefore does not silently
   revise past decisions. Prior admissions remain evaluable under the model that
   actually admitted them.

#### 10.1.3 Eligibility replays; authorization does not

Requiring a third party to recompute an admission verdict, and admitting that
terms like `cognitiveComplexity` and `trust` are a principal's judgment, cannot
both be normative — that is asking for a mathematical function and a human
decision from one object ([REVISION HISTORY](0003-REVISION-HISTORY.md) §1).

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
