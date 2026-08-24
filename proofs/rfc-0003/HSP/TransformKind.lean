/-!
# HSP.TransformKind — RFC-0003 Part 03 §7.0

Mechanization of the transformation-kind taxonomy (§7.0), the order on kinds
(§7.0.2), the pipeline join, and the obligations that a join must carry.

Specification pinned: trinity `main@e7f63f1`,
`docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md`,
sha256 `9462e6bfbbf3c6d24d41a80df6dffa30b42c41bf705cf657fb0874d25f098616`.

Scope note. This file models the *classification* of a transformation, not the
transformation. Payloads (`sources`, `attestation`, `rules`, `assumptions`,
`counterparty`, `contract`) are abstracted away: what is proved is the algebra
of kinds and the propagation of obligations, not that any payload is
well-formed. Nothing here is a claim of correctness, conformance, or
ratification.
-/

namespace HSP.TransformKind

/-! ## The five kinds -/

/-- RFC §7.0: the five kinds of transformation. -/
inductive Kind where
  | translation
  | enrichment
  | inference
  | negotiation
  | reconstruction
  deriving DecidableEq, Repr

/-- RFC §7.0.1(1): "An undeclared kind is treated as `reconstruction`."
    Fail-closed defaulting is a total function, so it is stated as one. -/
def declaredKind : Option Kind → Kind
  | none => .reconstruction
  | some k => k

/-! ## The classification carrier

RFC §7.0.2 states two things about the join of a mixed pipeline that a single
five-element poset cannot satisfy at once:

* the Hasse diagram draws `reconstruction` as a *top element*, and
* "its join is recorded as the set rather than collapsed into a ranking", with
  consequence 1: "the requirements accumulate; they do not merge into a weaker
  single rule".

`Marks` is the set-reading: one independent marker per external dependency a
pipeline has taken on. `Class5` below is the literal five-element diagram. They
are not isomorphic, and `Counterexamples.lean` exhibits where they disagree.
-/

/-- RFC §7.0.2 (set reading): the dependencies a pipeline has taken on.
    `translation` is the absence of all four. -/
structure Marks where
  citesSources : Bool     -- an `enrichment` step is present
  usesRules : Bool        -- an `inference` step is present
  hasCounterparty : Bool  -- a `negotiation` step is present
  selfJudged : Bool       -- a `reconstruction` step is present
  deriving DecidableEq, Repr

namespace Marks

/-- RFC §7.0.2: "`translation` is the bottom: it introduces no external
    dependency." -/
def bot : Marks := ⟨false, false, false, false⟩

/-- The top of the marker lattice: every external dependency taken on. -/
def top : Marks := ⟨true, true, true, true⟩

/-- RFC §7.0: each kind contributes exactly one marker. -/
def ofKind : Kind → Marks
  | .translation => ⟨false, false, false, false⟩
  | .enrichment => ⟨true, false, false, false⟩
  | .inference => ⟨false, true, false, false⟩
  | .negotiation => ⟨false, false, true, false⟩
  | .reconstruction => ⟨false, false, false, true⟩

/-- RFC §7.0.1(3), §7.0.2: a pipeline is classified by the join of its members. -/
def join (a b : Marks) : Marks :=
  ⟨a.citesSources || b.citesSources,
   a.usesRules || b.usesRules,
   a.hasCounterparty || b.hasCounterparty,
   a.selfJudged || b.selfJudged⟩

/-- The order induced by the join: `a ≤ b` exactly when `b` already carries
    every dependency `a` carries. Defining the order *by* the join is what makes
    antisymmetry and transitivity consequences of the join laws rather than
    separate assertions. -/
def Le (a b : Marks) : Prop := join a b = b

instance : DecidableEq Marks := by infer_instance
instance (a b : Marks) : Decidable (Le a b) := by unfold Le; infer_instance

end Marks

/-! ## The join laws (RFC §7.0.2) -/

/-- RFC §7.0.2: the join is idempotent — a pipeline of one kind repeated is that
    kind. -/
theorem join_idem (a : Marks) : Marks.join a a = a := by
  cases a; simp [Marks.join]

/-- RFC §7.0.2: the join is commutative — classification does not depend on the
    order in which steps are inspected. (Pipeline *order* is carried by
    `LossProfile.steps`, §7.1.1, not by the classification.) -/
theorem join_comm (a b : Marks) : Marks.join a b = Marks.join b a := by
  cases a; cases b; simp [Marks.join, Bool.or_comm]

/-- RFC §7.0.2: the join is associative — bracketing a mixed pipeline does not
    change its declared kind. -/
theorem join_assoc (a b c : Marks) :
    Marks.join (Marks.join a b) c = Marks.join a (Marks.join b c) := by
  cases a; cases b; cases c; simp [Marks.join, Bool.or_assoc]

/-- RFC §7.0.2: `translation` is the identity of the join — surrounding
    faithful translations do not change a pipeline's kind. -/
theorem join_bot_left (a : Marks) : Marks.join Marks.bot a = a := by
  cases a; simp [Marks.join, Marks.bot]

theorem join_bot_right (a : Marks) : Marks.join a Marks.bot = a := by
  cases a; simp [Marks.join, Marks.bot]

/-- The top absorbs. -/
theorem join_top_left (a : Marks) : Marks.join Marks.top a = Marks.top := by
  cases a; simp [Marks.join, Marks.top]

theorem join_top_right (a : Marks) : Marks.join a Marks.top = Marks.top := by
  cases a; simp [Marks.join, Marks.top]

/-! ## The order is a bounded partial order with the join as least upper bound -/

theorem le_refl (a : Marks) : Marks.Le a a := join_idem a

theorem le_trans {a b c : Marks} (h₁ : Marks.Le a b) (h₂ : Marks.Le b c) :
    Marks.Le a c := by
  unfold Marks.Le at *
  rw [← h₂, ← join_assoc, h₁]

theorem le_antisymm {a b : Marks} (h₁ : Marks.Le a b) (h₂ : Marks.Le b a) :
    a = b := by
  unfold Marks.Le at *
  rw [← h₁, join_comm, h₂]

/-- RFC §7.0.2: `translation` is the bottom of the order. -/
theorem bot_le (a : Marks) : Marks.Le Marks.bot a := join_bot_left a

/-- The marker top is the top of the order. -/
theorem le_top (a : Marks) : Marks.Le a Marks.top := join_top_right a

/-- The join is an upper bound of its arguments … -/
theorem le_join_left (a b : Marks) : Marks.Le a (Marks.join a b) := by
  unfold Marks.Le
  rw [← join_assoc, join_idem]

theorem le_join_right (a b : Marks) : Marks.Le b (Marks.join a b) := by
  unfold Marks.Le
  rw [join_comm a b, ← join_assoc, join_idem]

/-- … and it is the *least* upper bound, which is what "join" in §7.0.2 has to
    mean for consequence 4 ("a pipeline's declared kind MUST be its computed
    join") to be a check rather than a preference. -/
theorem join_le {a b c : Marks} (h₁ : Marks.Le a c) (h₂ : Marks.Le b c) :
    Marks.Le (Marks.join a b) c := by
  unfold Marks.Le at *
  rw [join_assoc, h₂, h₁]

/-! ## Classifying a pipeline -/

/-- RFC §7.0.1(3): the classification of a pipeline of steps. -/
def classify (steps : List Kind) : Marks :=
  steps.foldl (fun acc k => Marks.join acc (Marks.ofKind k)) Marks.bot

/-- RFC §7.0.1(1) + §7.0.1(3): the same, for steps that may have failed to
    declare a kind. Undeclared steps are folded in as `reconstruction`. -/
def classifyDeclared (steps : List (Option Kind)) : Marks :=
  classify (steps.map declaredKind)

theorem foldl_join (acc : Marks) (steps : List Kind) :
    steps.foldl (fun acc k => Marks.join acc (Marks.ofKind k)) acc
      = Marks.join acc (classify steps) := by
  induction steps generalizing acc with
  | nil => simp [classify, join_bot_right]
  | cons k t ih =>
    simp only [List.foldl_cons, classify] at *
    rw [ih (Marks.join acc (Marks.ofKind k)), ih (Marks.join Marks.bot (Marks.ofKind k)),
        join_bot_left, join_assoc]

/-- RFC §7.0.1(3): classification is compositional — a pipeline's kind is the
    join of the kinds of its segments, so a composed translator (§7.4) can be
    classified from its parts without re-inspecting every step. -/
theorem classify_append (s t : List Kind) :
    classify (s ++ t) = Marks.join (classify s) (classify t) := by
  simp only [classify, List.foldl_append]
  exact foldl_join _ t

/-- One step at the head of a pipeline, split off. -/
theorem classify_cons (x : Kind) (t : List Kind) :
    classify (x :: t) = Marks.join (Marks.ofKind x) (classify t) := by
  have h := classify_append [x] t
  simpa [classify, join_bot_left] using h

/-- RFC §7.0.2 consequence 2: monotone loss is required exactly when the join is
    `translation`. -/
def monotoneLossRequired (m : Marks) : Bool := decide (m = Marks.bot)

/-- RFC §7.0.1(3) + §7.0.2 consequence 2: the monotone-loss obligation binds a
    pipeline exactly when *every* step is a `translation`. "However many
    faithful translations surround it", one non-translation step lifts the join
    off the bottom. -/
theorem monotoneLossRequired_iff (steps : List Kind) :
    monotoneLossRequired (classify steps) = true
      ↔ ∀ k ∈ steps, k = Kind.translation := by
  constructor
  · induction steps with
    | nil => intro _ k hk; cases hk
    | cons x t ih =>
      intro h k hk
      simp only [monotoneLossRequired, decide_eq_true_eq, classify_cons] at h
      have hx : Marks.ofKind x = Marks.bot := by
        have h₁ := le_join_left (Marks.ofKind x) (classify t)
        unfold Marks.Le at h₁
        rw [h, join_bot_right] at h₁
        exact h₁
      have ht : classify t = Marks.bot := by
        have h₁ := le_join_right (Marks.ofKind x) (classify t)
        unfold Marks.Le at h₁
        rw [h, join_bot_right] at h₁
        exact h₁
      cases hk with
      | head => cases x <;> simp_all [Marks.ofKind, Marks.bot]
      | tail _ hk' =>
        exact ih (by simp [monotoneLossRequired, ht]) k hk'
  · induction steps with
    | nil => intro _; simp [monotoneLossRequired, classify, Marks.bot]
    | cons x t ih =>
      intro h
      have hx : x = Kind.translation := h x (by simp)
      have ht : monotoneLossRequired (classify t) = true :=
        ih (fun k hk => h k (by simp [hk]))
      simp only [monotoneLossRequired, decide_eq_true_eq] at ht ⊢
      rw [classify_cons, hx, ht]
      simp [Marks.ofKind, Marks.bot, Marks.join]

/-- RFC §7.0.1(3): "One reconstruction step makes the pipeline a
    reconstruction." -/
theorem reconstruction_propagates (steps : List Kind)
    (h : Kind.reconstruction ∈ steps) : (classify steps).selfJudged = true := by
  induction steps with
  | nil => cases h
  | cons x t ih =>
    rw [classify_cons]
    cases h with
    | head => simp [Marks.join, Marks.ofKind]
    | tail _ h' => simp [Marks.join, ih h']

/-! ## Obligations accumulate (RFC §7.0.2 consequence 1) -/

/-- The obligations §7.0.1 and §7.0.3 attach to a classification. -/
inductive Obligation where
  /-- RFC §7.0.1(4): enrichment sources content-addressed and resolvable. -/
  | citedSourcesResolvable
  /-- RFC §7.0.1(5): inference rules recorded by content address. -/
  | rulesContentAddressed
  /-- RFC §7.0: negotiation permitted only under a scoped contract (§13.2). -/
  | scopedContract
  /-- RFC §7.0.3: reconstructed components marked in the state, and barred from
      irreversible boundaries. -/
  | markedAndBoundaryBarred
  deriving DecidableEq, Repr

/-- RFC §7.0.1(4,5), §7.0.3: which obligations a classification carries. -/
def obligations (m : Marks) : Obligation → Bool
  | .citedSourcesResolvable => m.citesSources
  | .rulesContentAddressed => m.usesRules
  | .scopedContract => m.hasCounterparty
  | .markedAndBoundaryBarred => m.selfJudged

/-- RFC §7.0.2 consequence 1: "the requirements accumulate; they do not merge
    into a weaker single rule". Under the set reading this is a theorem: the
    join's obligations are exactly the union of its members' obligations.

    `Counterexamples.lean` shows this *fails* for the five-element diagram of
    §7.0.2, which is the reason `Marks` is the carrier here. -/
theorem obligations_join (a b : Marks) (o : Obligation) :
    obligations (Marks.join a b) o = (obligations a o || obligations b o) := by
  cases o <;> simp [obligations, Marks.join]

/-- RFC §7.0.2 consequence 3 / §7.0.3: the boundary prohibition attaches to the
    `reconstruction` marker alone, and it survives the join. -/
def boundaryBarred (m : Marks) : Bool := m.selfJudged

theorem boundaryBarred_join (a b : Marks) :
    boundaryBarred (Marks.join a b) = (boundaryBarred a || boundaryBarred b) := by
  simp [boundaryBarred, Marks.join]

/-! ## Conformance of a declaration (RFC §7.0.2 consequence 4) -/

/-- RFC §7.0.2 consequence 4: "A pipeline's declared kind MUST be its computed
    join. Declaring a lower kind than the join is a conformance failure." -/
def declarationConforms (declared : Marks) (steps : List Kind) : Bool :=
  decide (declared = classify steps)

/-- Understating a declaration is detectable: any declaration strictly below the
    computed join fails the check. This is the mechanized form of "and it is
    detectable, because the steps are content-addressed and each declares its
    own kind" — detectability here is decidability of the check, given the
    steps. -/
theorem declarationConforms_iff (declared : Marks) (steps : List Kind) :
    declarationConforms declared steps = true ↔ declared = classify steps := by
  simp [declarationConforms]

theorem understated_declaration_rejected
    (declared : Marks) (steps : List Kind)
    (_hle : Marks.Le declared (classify steps)) (hne : declared ≠ classify steps) :
    declarationConforms declared steps = false := by
  simp [declarationConforms, hne]

/-! ## The literal five-element diagram of §7.0.2

Kept as a separate carrier so that the divergence between the drawn picture and
the stated set semantics is exhibited rather than silently resolved.
-/

/-- RFC §7.0.2, the Hasse diagram as drawn: bottom `translation`, three
    incomparable atoms, top `reconstruction`. -/
inductive Class5 where
  | translation
  | enrichment
  | inference
  | negotiation
  | reconstruction
  deriving DecidableEq, Repr

namespace Class5

/-- The join forced by the drawn diagram: two distinct atoms have
    `reconstruction` as their only upper bound. -/
def join (a b : Class5) : Class5 :=
  if a = b then a
  else if a = translation then b
  else if b = translation then a
  else reconstruction

/-- The obligations that can be read off a five-element classification. -/
def obligations (c : Class5) : Obligation → Bool
  | .citedSourcesResolvable => decide (c = enrichment)
  | .rulesContentAddressed => decide (c = inference)
  | .scopedContract => decide (c = negotiation)
  | .markedAndBoundaryBarred => decide (c = reconstruction)

theorem join_comm (a b : Class5) : join a b = join b a := by
  cases a <;> cases b <;> rfl

theorem join_idem (a : Class5) : join a a = a := by
  cases a <;> rfl

theorem join_assoc (a b c : Class5) : join (join a b) c = join a (join b c) := by
  cases a <;> cases b <;> cases c <;> rfl

end Class5

end HSP.TransformKind

/-! ## Axiom cone

Every pinned theorem in this file is checked for its axiom dependencies. The
expected output for each is "does not depend on any axioms"; `proof_guard.py`
enforces it.
-/

#print axioms HSP.TransformKind.join_idem
#print axioms HSP.TransformKind.join_comm
#print axioms HSP.TransformKind.join_assoc
#print axioms HSP.TransformKind.join_bot_left
#print axioms HSP.TransformKind.join_bot_right
#print axioms HSP.TransformKind.join_top_left
#print axioms HSP.TransformKind.join_top_right
#print axioms HSP.TransformKind.le_refl
#print axioms HSP.TransformKind.le_trans
#print axioms HSP.TransformKind.le_antisymm
#print axioms HSP.TransformKind.bot_le
#print axioms HSP.TransformKind.le_top
#print axioms HSP.TransformKind.le_join_left
#print axioms HSP.TransformKind.le_join_right
#print axioms HSP.TransformKind.join_le
#print axioms HSP.TransformKind.classify_append
#print axioms HSP.TransformKind.monotoneLossRequired_iff
#print axioms HSP.TransformKind.reconstruction_propagates
#print axioms HSP.TransformKind.obligations_join
#print axioms HSP.TransformKind.boundaryBarred_join
#print axioms HSP.TransformKind.declarationConforms_iff
#print axioms HSP.TransformKind.understated_declaration_rejected
#print axioms HSP.TransformKind.Class5.join_comm
#print axioms HSP.TransformKind.Class5.join_idem
#print axioms HSP.TransformKind.Class5.join_assoc
#print axioms HSP.TransformKind.foldl_join
#print axioms HSP.TransformKind.classify_cons
