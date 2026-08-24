/-!
# HSP.Suitability — RFC-0003 Part 03 §7.2

Mechanization of §7.2.1 ("Suitability is ordered, and composes by meet") and the
fail-closed rules of §7.2.2.

Specification pinned: trinity `main@e7f63f1`,
`docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md`,
sha256 `9462e6bfbbf3c6d24d41a80df6dffa30b42c41bf705cf657fb0874d25f098616`.

**This file does not prove that §7.2.1 holds. It proves that §7.2.1, as
written, does not determine an order.** The RFC states three relations —
`unsuitable < bounded`, `bounded < suitable`, and `undetermined` below
`bounded` — and says the carrier "MUST be a **bounded partial order**" whose
composition is the meet. It never relates `unsuitable` to `undetermined`. The
`Stated` section below shows those relations admit no lower bound for that pair,
hence no bottom and no meet; the `CompletionA`/`CompletionB` sections give the
two minimal completions and show what does and does not turn on the choice.

Scope note. Payloads (`ReasonRef`, `ConstraintRef[]`, `EvidenceRef[]`,
`EvidenceRequirement[]`) are abstracted away in the four-element carrier; the
`BoundedPayload` section returns to the `bounded` payload specifically, because
it is a second place the order is underdetermined.
-/

namespace HSP.Suitability

/-- RFC §7.2.1: the four suitability values, with payloads abstracted. -/
inductive S where
  | unsuitable
  | undetermined
  | bounded
  | suitable
  deriving DecidableEq, Repr

open S

/-! ## The relations the RFC actually states -/

/-- RFC §7.2.1, exactly the stated relations and nothing more:
    `unsuitable < bounded < suitable`, and `undetermined` below `bounded`
    (hence, by transitivity, below `suitable`). The relation between
    `unsuitable` and `undetermined` is *not* stated, and is left absent here
    rather than guessed. -/
def statedLe : S → S → Bool
  | unsuitable, unsuitable => true
  | unsuitable, bounded => true
  | unsuitable, suitable => true
  | undetermined, undetermined => true
  | undetermined, bounded => true
  | undetermined, suitable => true
  | bounded, bounded => true
  | bounded, suitable => true
  | suitable, suitable => true
  | _, _ => false

theorem statedLe_refl (a : S) : statedLe a a = true := by cases a <;> rfl

theorem statedLe_trans {a b c : S}
    (h₁ : statedLe a b = true) (h₂ : statedLe b c = true) : statedLe a c = true := by
  cases a <;> cases b <;> cases c <;> simp_all [statedLe]

theorem statedLe_antisymm {a b : S}
    (h₁ : statedLe a b = true) (h₂ : statedLe b a = true) : a = b := by
  cases a <;> cases b <;> simp_all [statedLe]

/-- RFC §7.2.1 as stated: `unsuitable` and `undetermined` are incomparable. -/
theorem unsuitable_undetermined_incomparable :
    statedLe unsuitable undetermined = false ∧ statedLe undetermined unsuitable = false :=
  ⟨rfl, rfl⟩

/-! ### The consequence: no bottom, and no meet

§7.2.1 requires a *bounded* partial order and defines pipeline composition as
the meet. Both requirements fail on the stated relations, for the same reason:
the pair `{unsuitable, undetermined}` has no lower bound at all.
-/

/-- No value of the order is below both `unsuitable` and `undetermined`. -/
theorem no_lower_bound (m : S) :
    ¬ (statedLe m unsuitable = true ∧ statedLe m undetermined = true) := by
  cases m <;> simp [statedLe]

/-- RFC §7.2.1 requires a **bounded** partial order. Under the stated relations
    there is no bottom element, so the requirement is unsatisfiable as written. -/
theorem no_bottom : ¬ ∃ b : S, ∀ s : S, statedLe b s = true := by
  rintro ⟨b, hb⟩
  exact no_lower_bound b ⟨hb unsuitable, hb undetermined⟩

/-- A greatest lower bound of `a` and `b`. -/
def IsGlbOf (a b m : S) : Prop :=
  statedLe m a = true ∧ statedLe m b = true ∧
    ∀ x : S, statedLe x a = true → statedLe x b = true → statedLe x m = true

/-- RFC §7.2.1 defines pipeline composition as the meet. Under the stated
    relations the meet of `unsuitable` and `undetermined` does not exist, so
    "suitability(A → B → C) = suitability(A → B) ∧ suitability(B → C)" is
    undefined for a pipeline with one measured-unsuitable step and one
    unmeasured step — which is the ordinary bootstrap case of §7.2.2. -/
theorem no_meet : ¬ ∃ m : S, IsGlbOf unsuitable undetermined m := by
  rintro ⟨m, hm₁, hm₂, _⟩
  exact no_lower_bound m ⟨hm₁, hm₂⟩

/-! ## Completion A — `undetermined` is the bottom

"An unmeasured translation is not better than a measured one", extended to
`unsuitable`: absence of evidence sits below an evidenced refusal.
Chain: `undetermined < unsuitable < bounded < suitable`.
-/

namespace CompletionA

/-- Rank on the chain `undetermined < unsuitable < bounded < suitable`. -/
def rank : S → Nat
  | undetermined => 0
  | unsuitable => 1
  | bounded => 2
  | suitable => 3

def le (a b : S) : Bool := decide (rank a ≤ rank b)

def meet (a b : S) : S := if rank a ≤ rank b then a else b

theorem rank_inj {a b : S} (h : rank a = rank b) : a = b := by
  cases a <;> cases b <;> simp_all [rank]

theorem le_refl (a : S) : le a a = true := by simp [le]

theorem le_trans {a b c : S} (h₁ : le a b = true) (h₂ : le b c = true) :
    le a c = true := by
  simp only [le, decide_eq_true_eq] at *; omega

theorem le_antisymm {a b : S} (h₁ : le a b = true) (h₂ : le b a = true) : a = b := by
  simp only [le, decide_eq_true_eq] at *
  exact rank_inj (by omega)

/-- Completion A extends the relations the RFC does state. -/
theorem extends_stated {a b : S} (h : statedLe a b = true) : le a b = true := by
  cases a <;> cases b <;> simp_all [statedLe, le, rank]

theorem meet_comm (a b : S) : meet a b = meet b a := by
  cases a <;> cases b <;> rfl

theorem meet_assoc (a b c : S) : meet (meet a b) c = meet a (meet b c) := by
  cases a <;> cases b <;> cases c <;> rfl

theorem meet_idem (a : S) : meet a a = a := by cases a <;> rfl

/-- RFC §7.2.1: "A pipeline is no more suitable than its weakest step." -/
theorem meet_le_left (a b : S) : le (meet a b) a = true := by
  cases a <;> cases b <;> rfl

theorem meet_le_right (a b : S) : le (meet a b) b = true := by
  cases a <;> cases b <;> rfl

theorem le_meet {a b c : S} (h₁ : le c a = true) (h₂ : le c b = true) :
    le c (meet a b) = true := by
  cases a <;> cases b <;> cases c <;> simp_all [le, meet, rank]

/-- Bounded: `undetermined` is the bottom, `suitable` the top. -/
theorem bot_le (a : S) : le undetermined a = true := by cases a <;> rfl

theorem le_top (a : S) : le a suitable = true := by cases a <;> rfl

end CompletionA

/-! ## Completion B — `unsuitable` is the bottom

An evidenced refusal is not weakened by composition with an unmeasured step.
Chain: `unsuitable < undetermined < bounded < suitable`.
-/

namespace CompletionB

/-- Rank on the chain `unsuitable < undetermined < bounded < suitable`. -/
def rank : S → Nat
  | unsuitable => 0
  | undetermined => 1
  | bounded => 2
  | suitable => 3

def le (a b : S) : Bool := decide (rank a ≤ rank b)

def meet (a b : S) : S := if rank a ≤ rank b then a else b

theorem rank_inj {a b : S} (h : rank a = rank b) : a = b := by
  cases a <;> cases b <;> simp_all [rank]

theorem le_refl (a : S) : le a a = true := by simp [le]

theorem le_trans {a b c : S} (h₁ : le a b = true) (h₂ : le b c = true) :
    le a c = true := by
  simp only [le, decide_eq_true_eq] at *; omega

theorem le_antisymm {a b : S} (h₁ : le a b = true) (h₂ : le b a = true) : a = b := by
  simp only [le, decide_eq_true_eq] at *
  exact rank_inj (by omega)

/-- Completion B extends the relations the RFC does state. -/
theorem extends_stated {a b : S} (h : statedLe a b = true) : le a b = true := by
  cases a <;> cases b <;> simp_all [statedLe, le, rank]

theorem meet_comm (a b : S) : meet a b = meet b a := by
  cases a <;> cases b <;> rfl

theorem meet_assoc (a b c : S) : meet (meet a b) c = meet a (meet b c) := by
  cases a <;> cases b <;> cases c <;> rfl

theorem meet_idem (a : S) : meet a a = a := by cases a <;> rfl

theorem meet_le_left (a b : S) : le (meet a b) a = true := by
  cases a <;> cases b <;> rfl

theorem meet_le_right (a b : S) : le (meet a b) b = true := by
  cases a <;> cases b <;> rfl

theorem le_meet {a b c : S} (h₁ : le c a = true) (h₂ : le c b = true) :
    le c (meet a b) = true := by
  cases a <;> cases b <;> cases c <;> simp_all [le, meet, rank]

/-- Bounded: `unsuitable` is the bottom, `suitable` the top. -/
theorem bot_le (a : S) : le unsuitable a = true := by cases a <;> rfl

theorem le_top (a : S) : le a suitable = true := by cases a <;> rfl

end CompletionB

/-! ## What turns on the choice, and what does not -/

/-- RFC §7.2.2(4): "Crossing an irreversible boundary on an `undetermined`
    suitability MUST fail closed." `unsuitable` is refused a fortiori; `bounded`
    is admitted subject to its constraints. -/
def crossesIrreversible : S → Bool
  | suitable => true
  | bounded => true
  | undetermined => false
  | unsuitable => false

/-- **The choice is not a safety hole.** Both completions gate an irreversible
    boundary identically for every pair of composed steps, so the
    underdetermination in §7.2.1 is an erratum, not an emergency: no admissible
    completion admits an action the other refuses. -/
theorem gate_agrees (a b : S) :
    crossesIrreversible (CompletionA.meet a b)
      = crossesIrreversible (CompletionB.meet a b) := by
  cases a <;> cases b <;> rfl

/-- Does the reported value advertise a remedy? `undetermined` carries
    `missing : EvidenceRequirement[]` — a list of what would resolve it.
    `unsuitable` carries a `ReasonRef` — a refusal. -/
def reportsRemedy : S → Bool
  | undetermined => true
  | _ => false

/-- **The choice does change what a receipt says.** On the one pair the RFC
    leaves open, the two completions report different things: A reports a
    resolvable gap, B reports a refusal. A consumer acting on the receipt —
    §7.3's retranslation trigger, §10.1's admission inequality — reads a
    different instruction depending on which completion an implementation chose.
    That is why §7.2.1 must state the relation rather than leave it to
    implementers. -/
theorem completions_disagree :
    CompletionA.meet unsuitable undetermined = undetermined
      ∧ CompletionB.meet unsuitable undetermined = unsuitable
      ∧ reportsRemedy (CompletionA.meet unsuitable undetermined) = true
      ∧ reportsRemedy (CompletionB.meet unsuitable undetermined) = false :=
  ⟨rfl, rfl, rfl, rfl⟩

/-! ## §7.2.2: self-report is not evidence -/

/-- RFC §7.2.2(3): a self-reported action suitability "MUST be recorded as
    `{ kind: "undetermined" }` by any consumer, regardless of what the
    translator claimed". -/
def recordActionSuitability (attested : Bool) (claimed : S) : S :=
  if attested then claimed else undetermined

/-- RFC §7.2.2(3,4) + the bootstrap consequence: an unattested claim, however
    confident, cannot cross an irreversible boundary. Holds for every claimed
    value, which is the mechanized form of "It is not evidence and MUST NOT be
    upgraded by repetition." -/
theorem self_report_cannot_cross (claimed : S) :
    crossesIrreversible (recordActionSuitability false claimed) = false := by
  simp [recordActionSuitability, crossesIrreversible]

/-- The bootstrap fold: composing any number of `undetermined` steps stays
    `undetermined`. -/
theorem foldl_undetermined (n : Nat) :
    (List.replicate n undetermined).foldl CompletionB.meet undetermined = undetermined := by
  induction n with
  | zero => rfl
  | succ j ih =>
    simpa [List.replicate_succ, CompletionB.meet, CompletionB.rank] using ih

/-- RFC §7.2.2, bootstrap consequence: before fixtures or a third-party
    attester exist, every action-gating suitability is `undetermined`, and the
    meet of a pipeline of such steps stays `undetermined` — the bootstrap state
    does not decay into something crossable, however long the pipeline. -/
theorem bootstrap_stays_blocked (n : Nat) :
    crossesIrreversible
      ((List.replicate n undetermined).foldl CompletionB.meet undetermined) = false := by
  rw [foldl_undetermined]
  rfl

/-! ## The `bounded` payload — a second underdetermination

§7.2.1's `bounded` carries `within: ConstraintRef[]`. Two `bounded`
suitabilities with different constraint sets must have a meet, and the RFC
declares no operation on `ConstraintRef[]` and no refinement order on it. This
section shows what such an operation must satisfy for §7.2.1's meet laws to
survive; `Counterexamples.lean` exhibits an implementation that satisfies the
type and breaks the laws.
-/

section BoundedPayload

/-- The carrier with the `bounded` payload restored, over an abstract
    constraint-set type `C`. -/
inductive SC (C : Type) where
  | unsuitable
  | undetermined
  | bounded (within : C)
  | suitable

variable {C : Type}

/-- Meet on the Completion-B chain, with `bounded ∧ bounded` delegated to a
    combining operation on constraint sets, which §7.2.1 does not supply. -/
def meetC (cmeet : C → C → C) : SC C → SC C → SC C
  | .unsuitable, _ => .unsuitable
  | _, .unsuitable => .unsuitable
  | .undetermined, _ => .undetermined
  | _, .undetermined => .undetermined
  | .bounded c₁, .bounded c₂ => .bounded (cmeet c₁ c₂)
  | .bounded c, .suitable => .bounded c
  | .suitable, .bounded c => .bounded c
  | .suitable, .suitable => .suitable

/-- The meet on suitability is commutative exactly to the extent that the
    constraint-set operation is. §7.2.1 asserts the former and never states the
    latter, so the assertion is conditional on an obligation the RFC does not
    impose. -/
theorem meetC_comm (cmeet : C → C → C)
    (hc : ∀ x y, cmeet x y = cmeet y x) (a b : SC C) :
    meetC cmeet a b = meetC cmeet b a := by
  cases a <;> cases b <;> simp [meetC, hc]

/-- Likewise for associativity. -/
theorem meetC_assoc (cmeet : C → C → C)
    (hc : ∀ x y z, cmeet (cmeet x y) z = cmeet x (cmeet y z)) (a b c : SC C) :
    meetC cmeet (meetC cmeet a b) c = meetC cmeet a (meetC cmeet b c) := by
  cases a <;> cases b <;> cases c <;> simp [meetC, hc]

/-- And for idempotence, which §7.2.1 needs for "a pipeline is no more suitable
    than its weakest step" to be stable under repeating a step. -/
theorem meetC_idem (cmeet : C → C → C)
    (hc : ∀ x, cmeet x x = x) (a : SC C) : meetC cmeet a a = a := by
  cases a <;> simp [meetC, hc]

end BoundedPayload

end HSP.Suitability

/-! ## Axiom cone -/

#print axioms HSP.Suitability.statedLe_refl
#print axioms HSP.Suitability.statedLe_trans
#print axioms HSP.Suitability.statedLe_antisymm
#print axioms HSP.Suitability.unsuitable_undetermined_incomparable
#print axioms HSP.Suitability.no_lower_bound
#print axioms HSP.Suitability.no_bottom
#print axioms HSP.Suitability.no_meet
#print axioms HSP.Suitability.CompletionA.le_refl
#print axioms HSP.Suitability.CompletionA.le_trans
#print axioms HSP.Suitability.CompletionA.le_antisymm
#print axioms HSP.Suitability.CompletionA.extends_stated
#print axioms HSP.Suitability.CompletionA.meet_comm
#print axioms HSP.Suitability.CompletionA.meet_assoc
#print axioms HSP.Suitability.CompletionA.meet_idem
#print axioms HSP.Suitability.CompletionA.meet_le_left
#print axioms HSP.Suitability.CompletionA.meet_le_right
#print axioms HSP.Suitability.CompletionA.le_meet
#print axioms HSP.Suitability.CompletionA.bot_le
#print axioms HSP.Suitability.CompletionA.le_top
#print axioms HSP.Suitability.CompletionB.le_refl
#print axioms HSP.Suitability.CompletionB.le_trans
#print axioms HSP.Suitability.CompletionB.le_antisymm
#print axioms HSP.Suitability.CompletionB.extends_stated
#print axioms HSP.Suitability.CompletionB.meet_comm
#print axioms HSP.Suitability.CompletionB.meet_assoc
#print axioms HSP.Suitability.CompletionB.meet_idem
#print axioms HSP.Suitability.CompletionB.meet_le_left
#print axioms HSP.Suitability.CompletionB.meet_le_right
#print axioms HSP.Suitability.CompletionB.le_meet
#print axioms HSP.Suitability.CompletionB.bot_le
#print axioms HSP.Suitability.CompletionB.le_top
#print axioms HSP.Suitability.gate_agrees
#print axioms HSP.Suitability.completions_disagree
#print axioms HSP.Suitability.self_report_cannot_cross
#print axioms HSP.Suitability.bootstrap_stays_blocked
#print axioms HSP.Suitability.meetC_comm
#print axioms HSP.Suitability.meetC_assoc
#print axioms HSP.Suitability.meetC_idem
#print axioms HSP.Suitability.CompletionA.rank_inj
#print axioms HSP.Suitability.CompletionB.rank_inj
#print axioms HSP.Suitability.foldl_undetermined
