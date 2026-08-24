/-!
# HSP.Suitability — RFC-0003 Part 03 §7.2

Mechanization of §7.2.1 ("Suitability is ordered, and composes by meet") and the
fail-closed rules of §7.2.2.

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

**This file does not prove that §7.2.1 holds. It proves that §7.2.1, as
written, does not determine an order.** The RFC states three relations —
`unsuitable < bounded`, `bounded < suitable`, and `undetermined` below
`bounded` — and says the carrier "MUST be a **bounded partial order**" whose
composition is the meet. It never relates `unsuitable` to `undetermined`. The
`Stated` section below shows those relations admit no lower bound for that pair,
hence no bottom and no meet; the `CompletionA`/`CompletionB` sections give the
two minimal completions and show what does and does not turn on the choice.

Scope note. The four-element carrier abstracts away every payload (`ReasonRef`,
`ConstraintRef[]`, `EvidenceRef[]`, `EvidenceRequirement[]`). The `Payloads`
section restores all four and shows what the tag-level results do and do not
cover: the tags settle §7.2.2's gate, and leave the composed *value* — the thing
a receipt carries and §7.1.0 compares byte-wise — undefined in four separate
places.
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

/-! ## The payloads — where the meet is still undefined

The four sections above establish Completion B **on the tags**. §7.2.1's carrier
is not the tags: every constructor carries a payload, and §7.1.0's equality is
equality of canonical bytes, so two values with the same tag and different
payloads are different values. A meet on the tags is therefore not yet a meet on
`Suitability`.

Composing along a pipeline has to answer four questions the RFC never asks:

1. two `unsuitable` steps — which `ReasonRef` does the pipeline carry?
2. two `undetermined` steps — are the `missing` requirements unioned?
3. two `bounded` steps — how do `within` sets combine, and their evidence?
4. `bounded` against `suitable` — does the suitable step's evidence join the
   bounded result, or is it discarded?

Each is a combining operation. This section makes them parameters, proves the
meet laws hold exactly to the extent that those operations do, and proves that
the tag-level results above are precisely the projection of this one — so the
scope of what was established there is legible rather than implied.
-/

section Payloads

/-- §7.2.1's carrier with every payload restored: `R` a `ReasonRef`, `M` an
    `EvidenceRequirement[]`, `C` a `ConstraintRef[]`, `E` an `EvidenceRef[]`. -/
inductive SFull (R M C E : Type) where
  | unsuitable (reason : R)
  | undetermined (missing : M)
  | bounded (within : C) (evidence : E)
  | suitable (evidence : E)

variable {R M C E : Type}

/-- The tag of a full suitability value: the four-element abstraction the
    sections above reason about. -/
def tagOf : SFull R M C E → S
  | .unsuitable _ => S.unsuitable
  | .undetermined _ => S.undetermined
  | .bounded _ _ => S.bounded
  | .suitable _ => S.suitable

/-- The Completion-B meet, with all four payload questions delegated to declared
    operations. §7.2.1 supplies none of them. -/
def meetFull (rmeet : R → R → R) (mmeet : M → M → M)
    (cmeet : C → C → C) (emeet : E → E → E) :
    SFull R M C E → SFull R M C E → SFull R M C E
  | .unsuitable r₁, .unsuitable r₂ => .unsuitable (rmeet r₁ r₂)
  | .unsuitable r, _ => .unsuitable r
  | _, .unsuitable r => .unsuitable r
  | .undetermined m₁, .undetermined m₂ => .undetermined (mmeet m₁ m₂)
  | .undetermined m, _ => .undetermined m
  | _, .undetermined m => .undetermined m
  | .bounded c₁ e₁, .bounded c₂ e₂ => .bounded (cmeet c₁ c₂) (emeet e₁ e₂)
  | .bounded c e₁, .suitable e₂ => .bounded c (emeet e₁ e₂)
  | .suitable e₁, .bounded c e₂ => .bounded c (emeet e₁ e₂)
  | .suitable e₁, .suitable e₂ => .suitable (emeet e₁ e₂)

/-- **The scope of the tag-level results, stated exactly.** The payload meet
    projects onto the tag meet of `CompletionB`: everything proved about the
    four tags is proved about `Suitability` *up to* its payloads, and nothing
    more. Whatever the four operations do, they cannot move a value between
    tags — so §7.2.2's gate, which reads only the tag, is settled by the tag
    results, while the value a receipt carries is not. -/
theorem tagOf_meetFull (rmeet : R → R → R) (mmeet : M → M → M)
    (cmeet : C → C → C) (emeet : E → E → E) (a b : SFull R M C E) :
    tagOf (meetFull rmeet mmeet cmeet emeet a b)
      = CompletionB.meet (tagOf a) (tagOf b) := by
  cases a <;> cases b <;> rfl

/-- §7.2.1's meet is commutative exactly to the extent that all four payload
    operations are. -/
theorem meetFull_comm (rmeet : R → R → R) (mmeet : M → M → M)
    (cmeet : C → C → C) (emeet : E → E → E)
    (hr : ∀ x y, rmeet x y = rmeet y x) (hm : ∀ x y, mmeet x y = mmeet y x)
    (hc : ∀ x y, cmeet x y = cmeet y x) (he : ∀ x y, emeet x y = emeet y x)
    (a b : SFull R M C E) :
    meetFull rmeet mmeet cmeet emeet a b = meetFull rmeet mmeet cmeet emeet b a := by
  cases a <;> cases b <;> simp [meetFull, hr, hm, hc, he]

/-- Likewise for associativity: "a pipeline is no more suitable than its weakest
    step" must not depend on how the pipeline is bracketed, and that is a
    property of the payload operations, not of the tags. -/
theorem meetFull_assoc (rmeet : R → R → R) (mmeet : M → M → M)
    (cmeet : C → C → C) (emeet : E → E → E)
    (hr : ∀ x y z, rmeet (rmeet x y) z = rmeet x (rmeet y z))
    (hm : ∀ x y z, mmeet (mmeet x y) z = mmeet x (mmeet y z))
    (hc : ∀ x y z, cmeet (cmeet x y) z = cmeet x (cmeet y z))
    (he : ∀ x y z, emeet (emeet x y) z = emeet x (emeet y z))
    (a b c : SFull R M C E) :
    meetFull rmeet mmeet cmeet emeet (meetFull rmeet mmeet cmeet emeet a b) c
      = meetFull rmeet mmeet cmeet emeet a (meetFull rmeet mmeet cmeet emeet b c) := by
  cases a <;> cases b <;> cases c <;> simp [meetFull, hr, hm, hc, he]

/-- And for idempotence, which §7.2.1 needs for repeating a step to be a no-op
    on the pipeline's suitability. -/
theorem meetFull_idem (rmeet : R → R → R) (mmeet : M → M → M)
    (cmeet : C → C → C) (emeet : E → E → E)
    (hr : ∀ x, rmeet x x = x) (hm : ∀ x, mmeet x x = x)
    (hc : ∀ x, cmeet x x = x) (he : ∀ x, emeet x x = x)
    (a : SFull R M C E) :
    meetFull rmeet mmeet cmeet emeet a a = a := by
  cases a <;> simp [meetFull, hr, hm, hc, he]

end Payloads

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
#print axioms HSP.Suitability.tagOf_meetFull
#print axioms HSP.Suitability.meetFull_comm
#print axioms HSP.Suitability.meetFull_assoc
#print axioms HSP.Suitability.meetFull_idem
#print axioms HSP.Suitability.CompletionA.rank_inj
#print axioms HSP.Suitability.CompletionB.rank_inj
#print axioms HSP.Suitability.foldl_undetermined
