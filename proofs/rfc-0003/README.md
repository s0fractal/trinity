# RFC-0003 Part 03 — bounded Lean kernel

A mechanization of the **algebraic core** of
[RFC-0003 Part 03: Translation, Loss, Suitability and Debt](../../docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md):
the transformation-kind order and pipeline join (§7.0), the loss monoid and its
canonical carrier (§7.1.0, §7.1.1), the suitability order and its meet (§7.2),
and the debt accumulation laws that §7.3.1 states.

## What this is not

- It is **not** a proof that HSP is correct.
- It is **not** a conformance statement about any implementation, and no
  implementation is checked against it.
- It is **not** a ratification of Tranche C or of anything else. It has no
  standing in the governance sense; it is one artifact a reviewer can run.
- It does **not** cover CNP/JCS, federation, admission, governance, canonical
  encoding, or identity. Those parts of RFC-0003 are untouched here.

What it is: a check on whether the _algebra_ Part 03 asserts is the algebra its
words define. Three places it is not, and one place its own picture disagrees
with its own text, are recorded below as **C1–C6**, each with a machine-checked
witness and a proposed erratum. **The RFC has not been edited.** An erratum is a
proposal for the RFC's authors, not a change made here.

## Specification pinned

|            |                                                                                     |
| ---------- | ----------------------------------------------------------------------------------- |
| Repository | `s0fractal/trinity`                                                                 |
| Commit     | `e7f63f1ad9efa75ffb157f73bafc07a6336c31ff`                                          |
| File       | `docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md` |
| sha256     | `9462e6bfbbf3c6d24d41a80df6dffa30b42c41bf705cf657fb0874d25f098616`                  |

`proof_guard.py` re-hashes that file on every run and fails if it has changed,
so a spec edit cannot silently invalidate a theorem here.

## How to verify

```sh
./verify.sh
```

or by hand, from this directory:

```sh
lean HSP/TransformKind.lean -o .build/HSP/TransformKind.olean
lean HSP/LossProfile.lean   -o .build/HSP/LossProfile.olean
lean HSP/Suitability.lean   -o .build/HSP/Suitability.olean
LEAN_PATH=.build lean HSP/Counterexamples.lean
python3 proof_guard.py
```

The first three files are import-free, so `lean HSP/<file>.lean` typechecks each
on its own; only `Counterexamples.lean` imports the others and therefore needs
their `.olean`s on `LEAN_PATH`. That is the one deviation from the acceptance
command list in the task brief, and it is a property of `lean` rather than a
choice: cross-file imports do not resolve without compiled modules.

`proof_guard.py` checks four things (see its module docstring): no escape
hatches, axiom cones matching `theorems.lock.json`, statement-text hashes
matching the lock, and the spec digest. `--update` regenerates the lock; the
diff is meant to be reviewed, not rubber-stamped.

Toolchain: Lean **4.31.0**, core only. No Mathlib, no `lake`, no dependencies.

## What is proved

130 theorems, all pinned in `theorems.lock.json` with their axiom cones.

### `HSP/TransformKind.lean` — §7.0 (27 theorems)

- The classification carrier is the lattice of **dependency markers** —
  `citesSources`, `usesRules`, `hasCounterparty`, `selfJudged` — one per kind,
  which is §7.0.2's "recorded as the set rather than collapsed into a ranking".
- The join is idempotent, commutative, associative, has `translation` as its
  identity (`join_bot_*`) and a top that absorbs.
- The induced order is a partial order (`le_refl`, `le_trans`, `le_antisymm`),
  bounded (`bot_le`, `le_top`), and the join is its **least** upper bound
  (`le_join_left`, `le_join_right`, `join_le`) — which is what §7.0.2
  consequence 4 needs for "a pipeline's declared kind MUST be its computed join"
  to be checkable.
- `classify_append`: classification is compositional, so §7.4's composed
  translator can be classified from its parts.
- `monotoneLossRequired_iff`: the monotone-loss obligation binds a pipeline
  **exactly** when every step is a `translation` (§7.0.2 consequence 2).
- `reconstruction_propagates`: "One reconstruction step makes the pipeline a
  reconstruction" (§7.0.1(3)).
- `obligations_join`: the obligations of a join are exactly the union of the
  members' obligations — §7.0.2 consequence 1, "the requirements accumulate;
  they do not merge into a weaker single rule".
- The literal five-element diagram of §7.0.2 is also formalized (`Class5`), with
  its join laws, so that C2 below can be stated rather than argued.

### `HSP/LossProfile.lean` — §7.1, §7.1.0, §7.1.1, §7.3.1 (43 theorems)

The carrier is §7.1.0 taken literally: every set-valued and keyed field is a
list of `(digest, value)` pairs in **strictly increasing** digest order —
sorted, and duplicate-free, because §7.1.0 requires both.

- `CMap.ext` — **the load-bearing theorem.** Two canonical carriers that denote
  the same partial map are the same list. This is what makes §7.1.0's "two
  `LossProfile` values are equal exactly when their canonical bytes are equal"
  usable: on canonical carriers, extensional equality and byte equality are the
  same relation, so the monoid laws are simultaneously claims about sets and
  claims about bytes. Without it, §7.1.1's associativity is a claim about an
  equality nobody defined.
- `sorted_mergeWith`, `sorted_interWith`, `compose_canonical` — canonicity is
  preserved at every point of a pipeline, not only at its ends.
- `lookup_mergeWith`, `lookup_interWith` — the field rules of §7.1.1 read off
  one key at a time; every law below is a corollary of these plus `ext`.
- `compose_empty_left`, `compose_empty_right` — §7.1.1 property 2, identity.
- `compose_assoc` — §7.1.1 property 1, associativity, under the two hypotheses
  named in "What is assumed" below.
- `debt_compose_comm` — §7.3.1's commutative monoid, under a commutative pinned
  addition rule.
- `lost_monotone_left/right`, `preserved_antitone` — §7.1.1's monotonicity:
  `lost` unions, `preserved` intersects, so a pipeline never reports less loss
  than a step. (See **C1**: this holds for every kind, not only `translation`.)
- `debt_monotone` — §7.3.1's "`addDebt(a, b) >= a` … Debt is never reduced by
  incurring more of it", relative to an assumed debt order (see below).
- `Preservation.inter_eq_all_iff` — the `{kind:"all"}` sentinel, "legal only in
  `emptyLoss`", cannot be manufactured by composition: a composed profile claims
  universal preservation only if both parts did.
- `lost_compose_comm`, `assumptions_compose_comm`, `preserved_compose_comm`,
  `steps_compose` — where §7.1.1's non-commutativity actually lives.

### `HSP/Suitability.lean` — §7.2 (41 theorems)

- `statedLe` is the relation §7.2.1 actually states, and nothing more. It is a
  partial order (`statedLe_refl/trans/antisymm`).
- `no_lower_bound`, `no_bottom`, `no_meet` — **the stated relations admit no
  meet for `{unsuitable, undetermined}`**, hence no bottom either. See **C3**.
- `CompletionA` and `CompletionB` — the two minimal repairs. Each is a bounded
  partial order whose meet is a greatest lower bound (`meet_le_left`,
  `meet_le_right`, `le_meet`), each `extends_stated`.
- `gate_agrees` — both completions gate an irreversible boundary identically for
  every composed pair. The gap is an erratum, not an emergency.
- `completions_disagree` — and they report different values on exactly the pair
  the RFC leaves open, which is why it must be closed.
- `self_report_cannot_cross` — §7.2.2(3,4): an unattested claim, whatever it
  claims, cannot cross an irreversible boundary.
- `bootstrap_stays_blocked` — §7.2.2's bootstrap consequence: a pipeline of
  `undetermined` steps stays blocked however long it is.
- `meetC_comm/assoc/idem` — the `bounded` payload, over an abstract constraint
  operation. See **C5**.

### `HSP/Counterexamples.lean` — witnesses and countermodels (19 theorems)

Labelled **W** (witness confirming what the RFC asserts) or **C** (countermodel:
the RFC as written does not say what it needs to say). Details under "What
remains underdetermined".

## What is assumed, and where

Every hypothesis is a named argument of the theorem that needs it. Nothing is a
`typeclass` instance, an `axiom`, or a silent default.

| Assumption                                                                           | Appears as                                          | Why it is an assumption                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The declared distortion composition rule is associative                              | `hD` in `compose_assoc`                             | §7.1.1 delegates it: "combined by the distortion measure's own declared composition rule, which the invariant definition MUST supply". The RFC never requires it to be associative — but §7.1.1's own associativity fails without it. |
| The pinned debt addition rule is associative                                         | `hQ` in `compose_assoc`                             | §7.3.1 requires each `dimension` descriptor to pin an addition rule; associativity of that rule is asserted for `TranslationDebt` but not imposed on the descriptor.                                                                  |
| The pinned debt addition rule is commutative                                         | `hQ` in `debt_compose_comm`                         | Same clause; §7.3.1 asserts debt is a _commutative_ monoid.                                                                                                                                                                           |
| A debt order exists with `qle x (qadd x y)`                                          | `qle`, `hmono`, `hrefl` in `debt_monotone`          | §7.3.1 requires "a partial order" but declares none; the order lives in the `dimension` descriptor.                                                                                                                                   |
| The constraint-set operation for `bounded` is commutative / associative / idempotent | `hc` in `meetC_comm` / `meetC_assoc` / `meetC_idem` | §7.2.1 declares no operation on `ConstraintRef[]` at all. See **C5**.                                                                                                                                                                 |
| Profiles are canonical (sorted, duplicate-free)                                      | `Canonical` in most `Profile` theorems              | §7.1.0 requires it of every conforming profile. A non-canonical carrier has no byte equality, so the laws are not even statable for it.                                                                                               |

Note the shape of the first four: **the RFC asserts the laws of the composite
while delegating the operation to a descriptor it does not constrain.** That is
not a defect of the mechanization; it is what the mechanization makes visible.
§7.1.1's own "What a type system can and cannot carry here" says the laws are
claims that MUST carry evidence — these hypotheses are the exact list of
evidence a descriptor has to supply.

## What is only modelled

- **Digests are `Nat`.** What is used is that the canonical byte order is a
  decidable strict total order, not any property of SHA-256 or of §5.1's
  encoding. Nothing here validates the encoding.
- **Record contents below a key are abstract.** A distortion value is an opaque
  `D`, a debt quantity an opaque `Q`. Their internal structure (`measure`,
  `compositionRule`, `value`, `dimension`, `quantity`, `scope`) is not modelled;
  only the keyed-merge behaviour §7.1.0 and §7.3.1 specify is.
- **Transformation payloads are dropped.** `sources`, `attestation`, `rules`,
  `replayable`, `assumptions`, `counterparty`, `contract` are not modelled;
  §7.0.1(4)'s "content-addressed and independently resolvable" is represented as
  an obligation _flag_, not as a checked property.
- **Suitability payloads are dropped** in the four-element carrier (`ReasonRef`,
  `EvidenceRef[]`, `EvidenceRequirement[]`), except `bounded`'s `within`, which
  returns in the `BoundedPayload` section because it is a second source of
  underdetermination.
- **Evidence, attestation, and third-party status are flags, not structures.**
  `self_report_cannot_cross` takes `attested : Bool`; nothing here checks that
  an attester is "neither the translator's author nor the action's beneficiary"
  (§7.2.2(2)). That is a governance property, out of scope for this kernel.
- **`byInvariant` suitability, round-trip anchors (§7.4.2), evidence bridges
  (§7.5), and debt discharge/decay (§7.3.1(2,3)) are not modelled at all.**

## What remains underdetermined in the RFC

Six findings. Each has a machine-checked witness in `HSP/Counterexamples.lean`.
None of them is a claim that HSP is wrong; each is a place where two conforming
implementations can differ, or where the document contradicts itself.

### C1 — §7.1.1: the kind guard is inert on the loss fields

§7.1.1: "composed loss is **monotone** for `translation` steps … Any
implementation where adding a _translation_ step improves the loss profile has a
bug, and this is a cheap invariant to test."

`monotone_loss_needs_no_kind_guard` and
`monotone_loss_holds_for_reconstruction_pipeline` prove the same conclusion with
the guard deleted and for a `reconstruction` pipeline respectively. This is
forced: §7.1.1 makes `lost` a union and `preserved` an intersection _for every
kind_ ("For those, the field rules above still apply"), and union and
intersection are monotone. The proposed test therefore tests the field rules,
not the kind.

**Proposed erratum.** Keep the field rules. Re-attach the qualifier to the claim
it governs — the _fitness_ of the output, not the loss fields — so that a reader
does not conclude the algebra changes with the kind. It does not.

### C2 — §7.0.2: the drawn diagram contradicts the stated set semantics

§7.0.2 draws a five-element Hasse diagram with `reconstruction` as top, and in
the same section says the join of two atoms "is recorded as the set rather than
collapsed into a ranking", with consequence 1 that "the requirements
accumulate".

`drawn_order_over_restricts`: under the drawn order, a pipeline that cites a
source _and_ applies a declared rule joins to `reconstruction`, and so inherits
§7.0.3's prohibition on crossing an irreversible boundary — a prohibition
justified by "reconstruction points at the transformer's own judgment", which
this pipeline does not do.

`drawn_order_drops_obligations`: under the drawn order, joining `enrichment`
with `reconstruction` yields `reconstruction`, from which §7.0.1(4)'s obligation
on the enrichment's sources can no longer be read off. The obligations do not
accumulate; one is lost at the join.

**Proposed erratum.** State the carrier explicitly as the set of dependency
markers, and redraw the diagram as the lattice of those sets — with
`reconstruction` a fourth independent marker that is maximal in the trust order
but does **not** absorb the other three. `obligations_join` is then a theorem
rather than a hope.

### C3 — §7.2.1: the relation between `unsuitable` and `undetermined` is missing

§7.2.1 states `unsuitable < bounded < suitable` and `undetermined` below
`bounded`, requires a **bounded** partial order, and defines composition as the
meet. It never relates `unsuitable` to `undetermined`.

`no_lower_bound` / `no_bottom` / `no_meet`: on the stated relations that pair
has no lower bound at all, so there is no bottom and no meet — and the missing
meet is exactly the ordinary bootstrap case of §7.2.2 (one measured-unsuitable
step, one unmeasured step).

`gate_agrees`: both completions gate irreversible boundaries identically, so
this is an erratum, not a safety hole. `completions_disagree`: they report
different values on that pair.

**Proposed erratum — and this artifact does not make the choice.** The
recommendation is Completion B: add `unsuitable` **below** `undetermined`, with
this justification — `unsuitable` carries a `ReasonRef` (an evidenced refusal),
`undetermined` carries `missing: EvidenceRequirement[]` (a list of what would
resolve it). Under Completion A a pipeline containing a measured-unsuitable step
reports `undetermined`, advertising a remedy that cannot lift the pipeline.
Under Completion B the evidenced refusal survives composition, which is what
§7.2.2 asks for everywhere else. Suggested wording for §7.2.1:

> with `unsuitable < undetermined < bounded < suitable`. `undetermined` is above
> `unsuitable` because `unsuitable` is an evidenced refusal and `undetermined`
> is the absence of evidence: composing a refusal with an unmeasured step must
> report the refusal, not a resolvable gap.

### C4 — §7.2.1: an averaging rule is not a meet

`average_is_not_a_meet` is the witness §7.2.1 asks for when it forbids "an
average, a product of confidences, or any rule that lets two mediocre
translations compose into a good one": averaging `unsuitable` with `suitable`
lands strictly _above_ `unsuitable`, so the composite is more suitable than its
weakest step. This one confirms the RFC rather than contradicting it; it is here
because the prohibition is worth a runnable counterexample.

### C5 — §7.2.1: the `bounded` payload has no declared combining rule

`bounded` carries `within: ConstraintRef[]`, and §7.2.1 declares neither a
refinement order on constraint sets nor an operation to combine them.
`bounded_payload_rule_can_break_meet` exhibits an implementation that satisfies
the type and yields a non-commutative "meet" — so §7.2.1's own semilattice
requirement fails without anyone violating a stated MUST.

**Proposed erratum.** Require the `ConstraintRef` vocabulary to declare a
content-addressed refinement order with meets — the same discipline §7.1.1
already imposes on a distortion measure and §7.3.1 on a `dimension` descriptor.

### C6 — §7.0 vs §7.2.1: the improvement that motivates the taxonomy is not representable

§7.0's argument for the five kinds is that enrichment, inference, reconstruction
and negotiation "can leave the output _more_ fit for an action than the
intermediate state was". But §7.2.1 makes pipeline suitability the meet,
unconditionally, and a meet is never above its arguments
(`enrichment_improvement_invisible_to_meet`, with `meet_le_left` showing this is
forced). So the improvement §7.0 describes is recorded nowhere in Part 03's
algebras, for any kind.

**Proposed erratum.** Say explicitly that §7.0's improvement is a relation
between the _output state_ and the _intermediate state_, not between a pipeline
and its steps, and give it a carrier if it is meant to be checkable. Otherwise
§7.0.1(2)'s "what MUST hold instead is that the new information is attributed"
is the entire operative content of the carve-out — which is a defensible
position, but the document should say so rather than imply an algebraic claim.

## Trusted computing base

- Lean 4.31.0's kernel and its three standard axioms. Actual cones, from
  `theorems.lock.json`: 29 theorems depend on **no axioms**, 44 on `propext`, 57
  on `propext` and `Quot.sound`.
- **`Classical.choice` appears nowhere.** `sorryAx` appears nowhere.
  `proof_guard.py` refuses both outright, in the lock or out of it.
- **`native_decide` is not used.** It is not needed anywhere here: every
  decidable check in this kernel is small enough for the kernel itself, so the
  TCB does not include the Lean compiler, the C toolchain, or a runtime.
- No `sorry`, `admit`, `axiom`, `unsafe`, `partial`, `opaque`, `@[extern]`,
  `@[implemented_by]`, `#exit`, no disabled kernel typechecking, no unbounded
  heartbeats, and no import outside `HSP.*` — mechanically enforced.

## Related in-repo work

[`probes/hsp-fast-path-debt-scope-v0/`](../../probes/hsp-fast-path-debt-scope-v0/)
makes one term of §15.0's fast-path predicate executable — debt-scope locality.
It and this kernel meet at `TranslationDebt`: the probe decides whether a debt
value blocks an operation, while `debt_monotone` here proves that accumulation
never decreases a debt in whatever order the `dimension` descriptor pins.
Neither artifact establishes the other's premises, and neither claims
conformance.

## Provenance and status

Authored by Claude (Anthropic) at s0fractal's direction, against `main@e7f63f1`.
Non-normative. Not signed. It carries no authority to amend RFC-0003, and the
RFC is unchanged by it. The task brief this artifact answers is
[`proposals/rfc-0003/claude-lean-kernel-task.md`](../../proposals/rfc-0003/claude-lean-kernel-task.md).

Sigma-Glyph is deliberately not involved: `sigma-glyph/proofs/` owns proofs
about the Σ-GLYPH machine, and HSP semantics belong to trinity. A later
Sigma-Glyph adapter proving that a specific domain conforms to HSP would be a
separate artifact with a separate home.
