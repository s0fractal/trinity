import HSP.TransformKind
import HSP.LossProfile
import HSP.Suitability

/-!
# HSP.Counterexamples — witnesses and countermodels for RFC-0003 Part 03

Specification pinned: trinity `main@b7fb1ce`,
`docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md`.

The dependency is the **normative body** — everything from `## 7. Translation
protocol` to the end of the file — sha256
`148c50d1a560f5b4845a69657caea285caa1def169de725a1be66c06ea9505da`. That is what
`proof_guard.py` gates on. The whole file currently hashes to
`794d9b3591397cd033843890fdee06a09c98103be45324cc7e00b858fa9d6b65`; it differs
from the digest this artifact was first written against (`9462e6bf…`, at
`e7f63f1`) only in the front-matter provenance block, which no theorem here
depends on. A header edit is reported, not failed; a §7 edit fails.

Two kinds of statement live here, and they are labelled:

* **W** — a *witness*: a concrete instance confirming something the RFC asserts
  (§7.1.1's non-commutativity, for example). These support the specification.
* **C** — a *countermodel*: a concrete instance where the specification, read
  literally, does not say what it needs to say. Each one names the clause and
  the proposed erratum. None of these is an edit to the RFC; the RFC is not
  touched by this artifact.
-/

namespace HSP.Counterexamples

open HSP.TransformKind
open HSP.LossProfile

/-! ## W1 — §7.1.1 property 3: composition of loss is not commutative

The RFC: "`compose(a, b)` and `compose(b, a)` are **not** required to be equal
and generally are not … An implementation that treats loss composition as
commutative is non-conforming."

The witness is two one-step profiles whose steps are distinct receipts.
-/

/-- A distortion composition rule: left-biased, hence associative but not
    commutative. §7.1.1 permits this — it delegates the rule to the invariant
    definition and never requires commutativity of it. -/
def leftRule (x _ : Nat) : Nat := x

/-- A debt addition rule: §7.3.1 requires it to be associative and commutative. -/
def addRule (x y : Nat) : Nat := x + y

abbrev P := Profile Nat Nat

def stepA : P := { (Profile.empty : P) with steps := [11] }
def stepB : P := { (Profile.empty : P) with steps := [22] }

theorem stepA_canonical : Profile.Canonical stepA :=
  ⟨trivial, trivial, trivial, trivial, trivial, trivial, trivial⟩

theorem stepB_canonical : Profile.Canonical stepB :=
  ⟨trivial, trivial, trivial, trivial, trivial, trivial, trivial⟩

/-- **W1.** RFC §7.1.1(3). Two profiles whose composition is order-sensitive. -/
theorem compose_not_commutative :
    Profile.compose leftRule addRule stepA stepB
      ≠ Profile.compose leftRule addRule stepB stepA := by
  intro h
  have hs := congrArg Profile.steps h
  simp [Profile.compose, stepA, stepB, Profile.empty] at hs

/-- **W1a.** The non-commutativity is carried by `steps` alone in this witness:
    every other field of the two compositions agrees. An implementation that
    "normalizes" `steps` by sorting them — which §7.1.0 forbids — would make
    these two distinct pipelines equal. -/
theorem noncommutativity_lives_in_steps :
    (Profile.compose leftRule addRule stepA stepB).lost
        = (Profile.compose leftRule addRule stepB stepA).lost
      ∧ (Profile.compose leftRule addRule stepA stepB).preserved
        = (Profile.compose leftRule addRule stepB stepA).preserved
      ∧ (Profile.compose leftRule addRule stepA stepB).debt
        = (Profile.compose leftRule addRule stepB stepA).debt
      ∧ (Profile.compose leftRule addRule stepA stepB).distorted
        = (Profile.compose leftRule addRule stepB stepA).distorted
      ∧ (Profile.compose leftRule addRule stepA stepB).steps
        ≠ (Profile.compose leftRule addRule stepB stepA).steps := by
  refine ⟨rfl, rfl, rfl, rfl, ?_⟩
  simp [Profile.compose, stepA, stepB, Profile.empty]

/-! ## W2 — non-commutativity also enters through the distortion rule

§7.1.1 delegates per-invariant distortion to "the distortion measure's own
declared composition rule". Nothing requires that rule to be commutative, so two
pipelines with the *same* step multiset can still differ. This is the second
place a property test has to look.
-/

def distortA : P :=
  { (Profile.empty : P) with steps := [11], distorted := [(7, 1)] }

def distortB : P :=
  { (Profile.empty : P) with steps := [11], distorted := [(7, 2)] }

theorem distortA_canonical : Profile.Canonical distortA :=
  ⟨trivial, ⟨trivial, trivial⟩, trivial, trivial, trivial, trivial, trivial⟩

theorem distortB_canonical : Profile.Canonical distortB :=
  ⟨trivial, ⟨trivial, trivial⟩, trivial, trivial, trivial, trivial, trivial⟩

/-- **W2.** RFC §7.1.1. Same `steps`, different composed distortion. -/
theorem distortion_rule_breaks_commutativity :
    (Profile.compose leftRule addRule distortA distortB).distorted
      ≠ (Profile.compose leftRule addRule distortB distortA).distorted := by
  simp [Profile.compose, distortA, distortB, Profile.empty, CMap.mergeWith, leftRule]

/-! ## W3 — §7.1.1: monotone loss, and the exact scope of its kind guard

RFC §7.0.2 consequence 2: "Monotone loss is required only if the join is exactly
`translation`." The guarded statement is proved first, because that is what the
RFC asks for.
-/

/-- **W3.** RFC §7.0.2(2) + §7.1.1: for a pipeline whose computed join is
    `translation`, information lost at a step is lost by the pipeline. -/
theorem monotone_loss_for_translation_pipeline
    (steps : List Kind) (_hjoin : monotoneLossRequired (classify steps) = true)
    {a b : P} (ha : Profile.Canonical a) (hb : Profile.Canonical b) (k : Digest)
    (h : CMap.lookup k a.lost = some ()) :
    CMap.lookup k (Profile.compose leftRule addRule a b).lost = some () :=
  Profile.lost_monotone_left leftRule addRule ha hb k h

/-- **C1 — §7.1.1, erratum: the kind guard is inert on the loss fields.**

    The same conclusion holds with the hypothesis deleted, and in particular for
    a pipeline classified `reconstruction`. That is not an accident of the
    model: §7.1.1 makes `lost` a union and `preserved` an intersection *for
    every kind* ("For those, the field rules above still apply"), and union and
    intersection are monotone. So "composed loss is **monotone** for
    `translation` steps … Any implementation where adding a *translation* step
    improves the loss profile has a bug, and this is a cheap invariant to test"
    describes a property that no conforming implementation of the field rules
    can violate for *any* kind, and that every non-conforming one violates
    regardless of kind. The test is a test of the field rules, not of the kind.

    Proposed erratum: keep the field rules as they are, and re-attach the kind
    qualifier to the claim it actually governs — the *fitness* of the output,
    not the loss fields. As written, §7.1.1's qualifier reads as though the
    algebra changes with the kind, and it does not. -/
theorem monotone_loss_needs_no_kind_guard
    {a b : P} (ha : Profile.Canonical a) (hb : Profile.Canonical b) (k : Digest)
    (h : CMap.lookup k a.lost = some ()) :
    CMap.lookup k (Profile.compose leftRule addRule a b).lost = some () :=
  Profile.lost_monotone_left leftRule addRule ha hb k h

/-- **C1a.** The same conclusion for a pipeline whose join is `reconstruction` —
    the case the guard was written to exclude. -/
theorem monotone_loss_holds_for_reconstruction_pipeline
    {a b : P} (ha : Profile.Canonical a) (hb : Profile.Canonical b) (k : Digest)
    (_hjoin : monotoneLossRequired (classify [Kind.reconstruction]) = false)
    (h : CMap.lookup k a.lost = some ()) :
    CMap.lookup k (Profile.compose leftRule addRule a b).lost = some () :=
  Profile.lost_monotone_left leftRule addRule ha hb k h

theorem reconstruction_pipeline_is_not_monotone_bound :
    monotoneLossRequired (classify [Kind.reconstruction]) = false := rfl

/-! ## C2 — §7.0.2: the drawn diagram and the stated set semantics disagree

§7.0.2 draws a five-element Hasse diagram with `reconstruction` as the top, and
in the same section says the join of two incomparable atoms "is recorded as the
set rather than collapsed into a ranking", with consequence 1 that "the
requirements accumulate; they do not merge into a weaker single rule".

Those cannot both hold. Under the drawn diagram the only upper bound of two
distinct atoms is `reconstruction`, which both over-restricts (C2a) and drops
obligations (C2b).
-/

/-- **C2a — §7.0.2/§7.0.3, erratum.** In the drawn five-element order, a
    pipeline that cites a source and applies a declared rule joins to
    `reconstruction`, and therefore inherits §7.0.3's prohibition on crossing an
    irreversible boundary — a prohibition justified by "reconstruction points at
    the transformer's own judgment", which is exactly what this pipeline does
    not do. Under the set reading, it does not.

    Proposed erratum: state the carrier explicitly as the set of dependency
    markers, and redraw the diagram as the lattice of those sets, with
    `reconstruction` a fourth independent marker that is maximal in the trust
    order but does not absorb the other three. -/
theorem drawn_order_over_restricts :
    Class5.join Class5.enrichment Class5.inference = Class5.reconstruction
      ∧ Class5.obligations
          (Class5.join Class5.enrichment Class5.inference)
          Obligation.markedAndBoundaryBarred = true
      ∧ boundaryBarred
          (Marks.join (Marks.ofKind Kind.enrichment) (Marks.ofKind Kind.inference))
        = false :=
  ⟨rfl, rfl, rfl⟩

/-- **C2b — §7.0.2 consequence 1, erratum.** In the drawn five-element order,
    joining an `enrichment` step with a `reconstruction` step yields
    `reconstruction`, from which §7.0.1(4)'s obligation — that the enrichment's
    sources be content-addressed and independently resolvable — can no longer be
    read off. The obligations do not accumulate; one of them is lost at the
    join. Under the set reading they accumulate, which is `obligations_join`. -/
theorem drawn_order_drops_obligations :
    Class5.obligations Class5.enrichment Obligation.citedSourcesResolvable = true
      ∧ Class5.obligations
          (Class5.join Class5.enrichment Class5.reconstruction)
          Obligation.citedSourcesResolvable = false
      ∧ obligations
          (Marks.join (Marks.ofKind Kind.enrichment) (Marks.ofKind Kind.reconstruction))
          Obligation.citedSourcesResolvable = true :=
  ⟨rfl, rfl, rfl⟩

/-! ## C3 — §7.2.1: `unsuitable` versus `undetermined`

The countermodel and the two admissible completions are in `HSP.Suitability`.
What is collected here is the decision the RFC has to make, in the smallest
form: on the one pair it leaves open, the two completions report different
values, while every irreversible-action gate agrees.
-/

open HSP.Suitability

/-- **C3 — §7.2.1, erratum required.** The stated relations admit no meet for
    `{unsuitable, undetermined}`, so §7.2.1's "composes by meet" is undefined on
    that pair and its "MUST be a bounded partial order" is unsatisfiable. Two
    completions repair it; they agree on every gate and disagree on what a
    receipt says.

    Recommended erratum — add `unsuitable` **below** `undetermined`
    (Completion B), with this justification: `unsuitable` carries a
    `ReasonRef`, an evidenced refusal, and `undetermined` carries
    `missing: EvidenceRequirement[]`, a list of what would resolve it. Under
    Completion A a pipeline containing a measured-unsuitable step reports
    `undetermined` and therefore advertises a remedy — supply the missing
    evidence — that cannot lift the pipeline, since the unsuitable step remains.
    Under Completion B the evidenced refusal survives composition, which is the
    behaviour §7.2.2 asks for everywhere else.

    This artifact does not make the choice; it states what each choice costs. -/
theorem suitability_underdetermined :
    (¬ ∃ m : S, IsGlbOf S.unsuitable S.undetermined m)
      ∧ CompletionA.meet S.unsuitable S.undetermined = S.undetermined
      ∧ CompletionB.meet S.unsuitable S.undetermined = S.unsuitable
      ∧ (∀ a b : S, crossesIrreversible (CompletionA.meet a b)
          = crossesIrreversible (CompletionB.meet a b)) :=
  ⟨no_meet, rfl, rfl, gate_agrees⟩

/-! ## C4 — §7.2.1: "MUST NOT be implemented as an average"

The RFC forbids an average, a product of confidences, "or any rule that lets two
mediocre translations compose into a good one". The witness shows what goes
wrong: an averaging rule is not below its arguments, so it is not a meet.
-/

def ofRank : Nat → S
  | 0 => S.unsuitable
  | 1 => S.undetermined
  | 2 => S.bounded
  | _ => S.suitable

/-- An averaging composition, of the kind §7.2.1 forbids. -/
def averageCompose (a b : S) : S :=
  ofRank ((CompletionB.rank a + CompletionB.rank b) / 2)

/-- **W4.** RFC §7.2.1. Averaging composes an unsuitable step with a suitable
    one into something strictly above the unsuitable step, so it violates
    "A pipeline is no more suitable than its weakest step". -/
theorem average_is_not_a_meet :
    averageCompose S.unsuitable S.suitable = S.undetermined
      ∧ CompletionB.le (averageCompose S.unsuitable S.suitable) S.unsuitable = false :=
  ⟨rfl, rfl⟩

/-! ## C5 — §7.2.1: the meet is undefined on every payload, not just `bounded` -/

/-- One admissible reading of "combine the payloads": keep the first. -/
def leftBias (x _ : Bool) : Bool := x

/-- Another: keep the second. -/
def rightBias (_ y : Bool) : Bool := y

/-- **C5 — §7.2.1, erratum.** §7.2.1 fixes an order on the four *tags* and calls
    composition the meet, but every constructor carries a payload and §7.1.0
    compares values by canonical bytes. Composition therefore has to say which
    `ReasonRef` two `unsuitable` steps yield, whether two `undetermined` steps
    union their `missing` requirements, how two `within` sets combine along with
    their evidence, and whether a `suitable` step's evidence survives into a
    `bounded` result. §7.2.1 answers none of the four.

    The witness takes the least forgiving of them: two steps that are each
    measured `unsuitable`, for different reasons. Two implementations that both
    satisfy every stated MUST produce **different composed values** — and the
    divergence is invisible to §7.2.2's gate, which reads only the tag, while
    being fully visible to §7.1.0's byte equality, which is what a receipt is
    compared with. Left-biasing is not even commutative, so it is not a meet at
    all.

    Proposed erratum. Declare all four operations, with the same discipline
    §7.1.1 imposes on a distortion measure and §7.3.1 on a `dimension`
    descriptor: content-addressed, and carrying the algebra-law evidence
    (commutative, associative, idempotent) that §7.2.1's "meet" presupposes. The
    natural candidates — union of `missing`, union of `evidence`, a declared
    refinement meet on `within` — are defensible, but `ReasonRef` has no natural
    candidate at all, which is why it must be specified rather than left to
    implementers. -/
theorem payload_meet_undetermined :
    tagOf (meetFull leftBias leftBias leftBias leftBias
        (SFull.unsuitable true) (SFull.unsuitable false))
      = tagOf (meetFull rightBias rightBias rightBias rightBias
        (SFull.unsuitable true) (SFull.unsuitable false))
    ∧ meetFull leftBias leftBias leftBias leftBias
        (SFull.unsuitable true) (SFull.unsuitable false)
      ≠ meetFull rightBias rightBias rightBias rightBias
        (SFull.unsuitable true) (SFull.unsuitable false)
    ∧ meetFull leftBias leftBias leftBias leftBias
        (SFull.unsuitable true) (SFull.unsuitable false)
      ≠ meetFull leftBias leftBias leftBias leftBias
        (SFull.unsuitable false) (SFull.unsuitable true) := by
  refine ⟨rfl, ?_, ?_⟩ <;> simp [meetFull, leftBias, rightBias]

/-- **C5a.** The same gap on `bounded`, where an implementation reading "keep the
    tighter bound" with no declared refinement order picks the first operand and
    loses commutativity. -/
theorem bounded_payload_rule_can_break_meet :
    meetFull leftBias leftBias leftBias leftBias
        (SFull.bounded true true) (SFull.bounded false false)
      ≠ meetFull leftBias leftBias leftBias leftBias
        (SFull.bounded false false) (SFull.bounded true true) := by
  simp [meetFull, leftBias]

/-! ## C6 — §7.0/§7.2.1: the improvement that motivates the taxonomy is not
representable in the composition rules

§7.0 opens by arguing that enrichment, inference, reconstruction and negotiation
"can leave the output _more_ fit for an action than the intermediate state was",
and the whole five-kind taxonomy is built on that possibility. But §7.2.1 makes
pipeline suitability the meet, unconditionally, and a meet is never above its
arguments. So the improvement §7.0 describes cannot be recorded by the
composition rules of §7.2.1 for any kind.
-/

/-- **C6 — §7.0 vs §7.2.1, erratum.** A `bounded` translation followed by an
    enrichment step that is measured `suitable` composes to `bounded`. The
    enrichment's contribution is invisible to the pipeline's suitability, in
    both completions, and by `meet_le_left` this is forced rather than
    incidental.

    Proposed erratum: say explicitly that the improvement of §7.0 is a relation
    between the *output state* and the *intermediate state*, not between the
    pipeline and its steps, and give it its own carrier if it is meant to be
    checkable. Otherwise §7.0's motivating claim has no representation anywhere
    in Part 03's algebras, and §7.0.1(2)'s "what MUST hold instead is that the
    new information is attributed" is the entire operative content of the
    carve-out. -/
theorem enrichment_improvement_invisible_to_meet :
    CompletionB.meet S.bounded S.suitable = S.bounded
      ∧ CompletionA.meet S.bounded S.suitable = S.bounded
      ∧ (∀ a b : S, CompletionB.le (CompletionB.meet a b) a = true) :=
  ⟨rfl, rfl, CompletionB.meet_le_left⟩

/-! ## W5 — §7.1.1 property 2 and §7.3.1, exercised on concrete profiles -/

theorem empty_is_identity_here :
    Profile.compose leftRule addRule (Profile.empty : P) stepA = stepA
      ∧ Profile.compose leftRule addRule stepA (Profile.empty : P) = stepA :=
  ⟨Profile.compose_empty_left leftRule addRule stepA,
   Profile.compose_empty_right leftRule addRule stepA⟩

/-- **W5.** RFC §7.3.1: debt accumulation is commutative under the pinned
    addition rule, in contrast to loss composition, which is not. The two
    algebras of Part 03 differ exactly here. -/
theorem debt_commutes_while_loss_does_not :
    (Profile.compose leftRule addRule distortA distortB).debt
        = (Profile.compose leftRule addRule distortB distortA).debt
      ∧ Profile.compose leftRule addRule stepA stepB
        ≠ Profile.compose leftRule addRule stepB stepA :=
  ⟨Profile.debt_compose_comm leftRule addRule Nat.add_comm
    distortA_canonical distortB_canonical,
   compose_not_commutative⟩

end HSP.Counterexamples

/-! ## Axiom cone -/

#print axioms HSP.Counterexamples.compose_not_commutative
#print axioms HSP.Counterexamples.noncommutativity_lives_in_steps
#print axioms HSP.Counterexamples.distortion_rule_breaks_commutativity
#print axioms HSP.Counterexamples.monotone_loss_for_translation_pipeline
#print axioms HSP.Counterexamples.monotone_loss_needs_no_kind_guard
#print axioms HSP.Counterexamples.monotone_loss_holds_for_reconstruction_pipeline
#print axioms HSP.Counterexamples.reconstruction_pipeline_is_not_monotone_bound
#print axioms HSP.Counterexamples.drawn_order_over_restricts
#print axioms HSP.Counterexamples.drawn_order_drops_obligations
#print axioms HSP.Counterexamples.suitability_underdetermined
#print axioms HSP.Counterexamples.average_is_not_a_meet
#print axioms HSP.Counterexamples.payload_meet_undetermined
#print axioms HSP.Counterexamples.bounded_payload_rule_can_break_meet
#print axioms HSP.Counterexamples.enrichment_improvement_invisible_to_meet
#print axioms HSP.Counterexamples.empty_is_identity_here
#print axioms HSP.Counterexamples.debt_commutes_while_loss_does_not
#print axioms HSP.Counterexamples.stepA_canonical
#print axioms HSP.Counterexamples.stepB_canonical
#print axioms HSP.Counterexamples.distortA_canonical
#print axioms HSP.Counterexamples.distortB_canonical
