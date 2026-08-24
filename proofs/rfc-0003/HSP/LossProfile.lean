/-!
# HSP.LossProfile — RFC-0003 Part 03 §7.1, §7.1.0, §7.1.1, §7.3.1

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

§7.1.0 says the algebra "requires an equality relation", that every set-valued
array "MUST be sorted by the canonical bytes of the member's full digest", that
"duplicate digests MUST be rejected rather than silently collapsed", and that
"two `LossProfile` values are equal exactly when their canonical bytes are
equal". This file takes that literally: the carrier for every set-valued and
keyed field is a list of `(digest, value)` pairs in strictly increasing digest
order, and profile equality is Lean's structural equality on that carrier —
which, by `CMap.ext` below, coincides with equality of the sets they denote.
That coincidence is the reason the monoid laws are provable at all; without it
§7.1.1's associativity would be a claim about an equality nobody had defined.

Scope note. Digests are modelled as `Nat` with `<`: what is used is that the
canonical byte order is a decidable strict total order, not any property of
SHA-256. Record *contents* below the key are abstract (`D` for a distortion
value, `Q` for a debt quantity), because §7.1.1 delegates their composition to
"the distortion measure's own declared composition rule, which the invariant
definition MUST supply", and §7.3.1 delegates debt addition to the `dimension`
descriptor's "pinned rule". Those rules are therefore hypotheses here, named
explicitly at every theorem that needs them.
-/

namespace HSP.LossProfile

/-- A full content address (§5.1), modelled by its position in the canonical
    byte order. -/
abbrev Digest := Nat

/-! ## §7.1.0 The canonical carrier

One carrier serves every field: a set of digests is a `CMap Unit`, the
`distorted` field is a `CMap D`, the debt terms are a `CMap Q` keyed on
`(dimension, scope)`.
-/

namespace CMap

variable {V : Type}

/-- Every key of the list is strictly above `lo`. -/
def keysGt (lo : Digest) : List (Digest × V) → Prop
  | [] => True
  | (k, _) :: t => lo < k ∧ keysGt lo t

/-- §7.1.0: "MUST be sorted by the canonical bytes of the member's full digest.
    Duplicate digests MUST be rejected rather than silently collapsed." Strict
    increase is exactly those two requirements at once. -/
def Sorted : List (Digest × V) → Prop
  | [] => True
  | (k, _) :: t => keysGt k t ∧ Sorted t

def lookup (k : Digest) : List (Digest × V) → Option V
  | [] => none
  | (k', v) :: t => if k = k' then some v else lookup k t

/-- §7.1.1: union of set-valued fields; keyed accumulation for `distorted` and
    for debt terms, where records sharing a key are combined by the declared
    rule `f` and re-emitted as one canonical record. -/
def mergeWith (f : V → V → V) : List (Digest × V) → List (Digest × V) → List (Digest × V)
  | [], b => b
  | (k₁, v₁) :: t₁, [] => (k₁, v₁) :: t₁
  | (k₁, v₁) :: t₁, (k₂, v₂) :: t₂ =>
      if k₁ < k₂ then (k₁, v₁) :: mergeWith f t₁ ((k₂, v₂) :: t₂)
      else if k₂ < k₁ then (k₂, v₂) :: mergeWith f ((k₁, v₁) :: t₁) t₂
      else (k₁, f v₁ v₂) :: mergeWith f t₁ t₂
termination_by a b => a.length + b.length

/-- §7.1.1: intersection, used for `preserved` ("An invariant is preserved by
    the pipeline only if preserved at every step"). -/
def interWith (f : V → V → V) : List (Digest × V) → List (Digest × V) → List (Digest × V)
  | [], _ => []
  | (_, _) :: _, [] => []
  | (k₁, v₁) :: t₁, (k₂, v₂) :: t₂ =>
      if k₁ < k₂ then interWith f t₁ ((k₂, v₂) :: t₂)
      else if k₂ < k₁ then interWith f ((k₁, v₁) :: t₁) t₂
      else (k₁, f v₁ v₂) :: interWith f t₁ t₂
termination_by a b => a.length + b.length

/-- The effect of `mergeWith` on a single key. -/
def joinOpt (f : V → V → V) : Option V → Option V → Option V
  | none, y => y
  | some x, none => some x
  | some x, some y => some (f x y)

/-- The effect of `interWith` on a single key. -/
def meetOpt (f : V → V → V) : Option V → Option V → Option V
  | some x, some y => some (f x y)
  | _, _ => none

/-! ### Basic lemmas -/

theorem keysGt_mono {lo lo' : Digest} {l : List (Digest × V)}
    (h : keysGt lo l) (hle : lo' ≤ lo) : keysGt lo' l := by
  induction l with
  | nil => trivial
  | cons p t ih =>
    obtain ⟨k, v⟩ := p
    simp only [keysGt] at h ⊢
    exact ⟨Nat.lt_of_le_of_lt hle h.1, ih h.2⟩

/-- Below the least key, `lookup` finds nothing: the sortedness invariant is
    what makes the carrier a faithful representation of a set. -/
theorem lookup_eq_none_of_keysGt {lo k : Digest} {l : List (Digest × V)}
    (h : keysGt lo l) (hk : k ≤ lo) : lookup k l = none := by
  induction l with
  | nil => rfl
  | cons p t ih =>
    obtain ⟨k', v⟩ := p
    simp only [keysGt] at h
    have hne : k ≠ k' := Nat.ne_of_lt (Nat.lt_of_le_of_lt hk h.1)
    simp [lookup, hne, ih h.2]

theorem lookup_cons_self (k : Digest) (v : V) (t : List (Digest × V)) :
    lookup k ((k, v) :: t) = some v := by simp [lookup]

theorem lookup_cons_ne {k k' : Digest} (v : V) (t : List (Digest × V)) (h : k ≠ k') :
    lookup k ((k', v) :: t) = lookup k t := by simp [lookup, h]

/-! ### Pointwise laws for the option-level combinators -/

theorem joinOpt_comm (f : V → V → V) (hf : ∀ x y, f x y = f y x) (x y : Option V) :
    joinOpt f x y = joinOpt f y x := by
  cases x <;> cases y <;> simp [joinOpt, hf]

theorem joinOpt_assoc (f : V → V → V) (hf : ∀ x y z, f (f x y) z = f x (f y z))
    (x y z : Option V) :
    joinOpt f (joinOpt f x y) z = joinOpt f x (joinOpt f y z) := by
  cases x <;> cases y <;> cases z <;> simp [joinOpt, hf]

theorem meetOpt_comm (f : V → V → V) (hf : ∀ x y, f x y = f y x) (x y : Option V) :
    meetOpt f x y = meetOpt f y x := by
  cases x <;> cases y <;> simp [meetOpt, hf]

theorem meetOpt_assoc (f : V → V → V) (hf : ∀ x y z, f (f x y) z = f x (f y z))
    (x y z : Option V) :
    meetOpt f (meetOpt f x y) z = meetOpt f x (meetOpt f y z) := by
  cases x <;> cases y <;> cases z <;> simp [meetOpt, hf]

/-! ### `mergeWith` respects the carrier invariant -/

theorem keysGt_mergeWith (f : V → V → V) (lo : Digest) (a b : List (Digest × V)) :
    keysGt lo a → keysGt lo b → keysGt lo (mergeWith f a b) := by
  induction a, b using mergeWith.induct with
  | case1 b => intro _ hb; simpa [mergeWith] using hb
  | case2 k₁ v₁ t₁ => intro ha _; simpa [mergeWith] using ha
  | case3 k₁ v₁ t₁ k₂ v₂ t₂ h ih =>
    intro ha hb
    simp only [keysGt] at ha ⊢
    simp only [mergeWith, if_pos h]
    exact ⟨ha.1, ih ha.2 hb⟩
  | case4 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb
    simp only [keysGt] at hb ⊢
    simp only [mergeWith, if_neg h₁, if_pos h₂]
    exact ⟨hb.1, ih ha hb.2⟩
  | case5 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb
    simp only [keysGt] at ha hb ⊢
    simp only [mergeWith, if_neg h₁, if_neg h₂]
    exact ⟨ha.1, ih ha.2 hb.2⟩

theorem sorted_mergeWith (f : V → V → V) (a b : List (Digest × V)) :
    Sorted a → Sorted b → Sorted (mergeWith f a b) := by
  induction a, b using mergeWith.induct with
  | case1 b => intro _ hb; simpa [mergeWith] using hb
  | case2 k₁ v₁ t₁ => intro ha _; simpa [mergeWith] using ha
  | case3 k₁ v₁ t₁ k₂ v₂ t₂ h ih =>
    intro ha hb
    simp only [Sorted] at ha hb ⊢
    simp only [mergeWith, if_pos h]
    refine ⟨keysGt_mergeWith f k₁ t₁ ((k₂, v₂) :: t₂) ha.1 ?_, ih ha.2 hb⟩
    simp only [keysGt]
    exact ⟨h, keysGt_mono hb.1 (Nat.le_of_lt h)⟩
  | case4 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb
    simp only [Sorted] at ha hb ⊢
    simp only [mergeWith, if_neg h₁, if_pos h₂]
    refine ⟨keysGt_mergeWith f k₂ ((k₁, v₁) :: t₁) t₂ ?_ hb.1, ih ha hb.2⟩
    simp only [keysGt]
    exact ⟨h₂, keysGt_mono ha.1 (Nat.le_of_lt h₂)⟩
  | case5 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb
    have hk : k₁ = k₂ := Nat.le_antisymm (Nat.not_lt.mp h₂) (Nat.not_lt.mp h₁)
    subst hk
    simp only [Sorted] at ha hb ⊢
    simp only [mergeWith, if_neg h₁]
    exact ⟨keysGt_mergeWith f k₁ t₁ t₂ ha.1 hb.1, ih ha.2 hb.2⟩

/-- §7.1.1: the union/accumulation rule, read off one key at a time. This is the
    lemma that turns the field rules into an algebra: everything below is a
    corollary of it plus `ext`. -/
theorem lookup_mergeWith (f : V → V → V) (a b : List (Digest × V)) :
    Sorted a → Sorted b →
      ∀ k, lookup k (mergeWith f a b) = joinOpt f (lookup k a) (lookup k b) := by
  induction a, b using mergeWith.induct with
  | case1 b => intro _ _ k; simp [mergeWith, lookup, joinOpt]
  | case2 k₁ v₁ t₁ =>
    intro _ _ k
    cases h : lookup k ((k₁, v₁) :: t₁) <;> simp [mergeWith, lookup, h, joinOpt]
  | case3 k₁ v₁ t₁ k₂ v₂ t₂ h ih =>
    intro ha hb k
    simp only [Sorted] at ha hb
    simp only [mergeWith, if_pos h]
    by_cases hk : k = k₁
    · subst hk
      have hnone : lookup k ((k₂, v₂) :: t₂) = none := by
        have hne : k ≠ k₂ := Nat.ne_of_lt h
        rw [lookup_cons_ne v₂ t₂ hne]
        exact lookup_eq_none_of_keysGt hb.1 (Nat.le_of_lt h)
      rw [lookup_cons_self, lookup_cons_self, hnone]
      rfl
    · rw [lookup_cons_ne v₁ _ hk, lookup_cons_ne v₁ t₁ hk, ih ha.2 hb k]
  | case4 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb k
    simp only [Sorted] at ha hb
    simp only [mergeWith, if_neg h₁, if_pos h₂]
    by_cases hk : k = k₂
    · subst hk
      have hnone : lookup k ((k₁, v₁) :: t₁) = none := by
        have hne : k ≠ k₁ := Nat.ne_of_lt h₂
        rw [lookup_cons_ne v₁ t₁ hne]
        exact lookup_eq_none_of_keysGt ha.1 (Nat.le_of_lt h₂)
      rw [lookup_cons_self, hnone, lookup_cons_self]
      rfl
    · rw [lookup_cons_ne v₂ _ hk, lookup_cons_ne v₂ t₂ hk, ih ha hb.2 k]
  | case5 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb k
    have hk : k₁ = k₂ := Nat.le_antisymm (Nat.not_lt.mp h₂) (Nat.not_lt.mp h₁)
    subst hk
    simp only [Sorted] at ha hb
    simp only [mergeWith, if_neg h₁]
    by_cases hkk : k = k₁
    · subst hkk; simp [lookup, joinOpt]
    · rw [lookup_cons_ne _ _ hkk, lookup_cons_ne v₁ t₁ hkk, lookup_cons_ne v₂ t₂ hkk,
        ih ha.2 hb.2 k]

/-! ### `interWith` respects the carrier invariant -/

theorem keysGt_interWith (f : V → V → V) (lo : Digest) (a b : List (Digest × V)) :
    keysGt lo a → keysGt lo b → keysGt lo (interWith f a b) := by
  induction a, b using interWith.induct with
  | case1 b => intro _ _; simp [interWith, keysGt]
  | case2 k₁ v₁ t₁ => intro _ _; simp [interWith, keysGt]
  | case3 k₁ v₁ t₁ k₂ v₂ t₂ h ih =>
    intro ha hb
    simp only [keysGt] at ha
    simp only [interWith, if_pos h]
    exact ih ha.2 hb
  | case4 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb
    simp only [keysGt] at hb
    simp only [interWith, if_neg h₁, if_pos h₂]
    exact ih ha hb.2
  | case5 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb
    simp only [keysGt] at ha hb ⊢
    simp only [interWith, if_neg h₁, if_neg h₂]
    exact ⟨ha.1, ih ha.2 hb.2⟩

theorem sorted_interWith (f : V → V → V) (a b : List (Digest × V)) :
    Sorted a → Sorted b → Sorted (interWith f a b) := by
  induction a, b using interWith.induct with
  | case1 b => intro _ _; simp [interWith, Sorted]
  | case2 k₁ v₁ t₁ => intro _ _; simp [interWith, Sorted]
  | case3 k₁ v₁ t₁ k₂ v₂ t₂ h ih =>
    intro ha hb
    simp only [Sorted] at ha
    simp only [interWith, if_pos h]
    exact ih ha.2 hb
  | case4 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb
    simp only [Sorted] at hb
    simp only [interWith, if_neg h₁, if_pos h₂]
    exact ih ha hb.2
  | case5 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb
    have hk : k₁ = k₂ := Nat.le_antisymm (Nat.not_lt.mp h₂) (Nat.not_lt.mp h₁)
    subst hk
    simp only [Sorted] at ha hb ⊢
    simp only [interWith, if_neg h₁]
    exact ⟨keysGt_interWith f k₁ t₁ t₂ ha.1 hb.1, ih ha.2 hb.2⟩

/-- §7.1.1: "An invariant is preserved by the pipeline only if preserved at
    every step", read off one key at a time. -/
theorem lookup_interWith (f : V → V → V) (a b : List (Digest × V)) :
    Sorted a → Sorted b →
      ∀ k, lookup k (interWith f a b) = meetOpt f (lookup k a) (lookup k b) := by
  induction a, b using interWith.induct with
  | case1 b => intro _ _ k; simp [interWith, lookup, meetOpt]
  | case2 k₁ v₁ t₁ =>
    intro _ _ k
    cases h : lookup k ((k₁, v₁) :: t₁) <;> simp [interWith, lookup, meetOpt]
  | case3 k₁ v₁ t₁ k₂ v₂ t₂ h ih =>
    intro ha hb k
    simp only [Sorted] at ha hb
    simp only [interWith, if_pos h]
    by_cases hk : k = k₁
    · subst hk
      have hnone : lookup k ((k₂, v₂) :: t₂) = none := by
        have hne : k ≠ k₂ := Nat.ne_of_lt h
        rw [lookup_cons_ne v₂ t₂ hne]
        exact lookup_eq_none_of_keysGt hb.1 (Nat.le_of_lt h)
      rw [ih ha.2 hb k, hnone, lookup_cons_self]
      cases lookup k t₁ <;> rfl
    · rw [ih ha.2 hb k, lookup_cons_ne v₁ t₁ hk]
  | case4 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb k
    simp only [Sorted] at ha hb
    simp only [interWith, if_neg h₁, if_pos h₂]
    by_cases hk : k = k₂
    · subst hk
      have hnone : lookup k ((k₁, v₁) :: t₁) = none := by
        have hne : k ≠ k₁ := Nat.ne_of_lt h₂
        rw [lookup_cons_ne v₁ t₁ hne]
        exact lookup_eq_none_of_keysGt ha.1 (Nat.le_of_lt h₂)
      rw [ih ha hb.2 k, hnone, lookup_cons_self]
      cases lookup k t₂ <;> rfl
    · rw [ih ha hb.2 k, lookup_cons_ne v₂ t₂ hk]
  | case5 k₁ v₁ t₁ k₂ v₂ t₂ h₁ h₂ ih =>
    intro ha hb k
    have hk : k₁ = k₂ := Nat.le_antisymm (Nat.not_lt.mp h₂) (Nat.not_lt.mp h₁)
    subst hk
    simp only [Sorted] at ha hb
    simp only [interWith, if_neg h₁]
    by_cases hkk : k = k₁
    · subst hkk; simp [lookup, meetOpt]
    · rw [lookup_cons_ne _ _ hkk, lookup_cons_ne v₁ t₁ hkk, lookup_cons_ne v₂ t₂ hkk,
        ih ha.2 hb.2 k]

/-! ### Canonical bytes and set equality coincide

§7.1.0: "Two `LossProfile` values are equal exactly when their canonical bytes
are equal. This makes associativity and identity executable properties rather
than an appeal to whatever equality a host language gives arrays."
-/

/-- Two canonical carriers that denote the same partial map **are** the same
    list. This is the theorem that discharges §7.1.0's requirement: on canonical
    carriers, extensional equality and byte equality are the same relation, so
    the monoid laws below are simultaneously claims about sets and claims about
    bytes. -/
theorem ext : ∀ (a b : List (Digest × V)), Sorted a → Sorted b →
    (∀ k, lookup k a = lookup k b) → a = b := by
  intro a
  induction a with
  | nil =>
    intro b _ _ h
    cases b with
    | nil => rfl
    | cons p t =>
      obtain ⟨k, v⟩ := p
      have := h k
      simp [lookup] at this
  | cons p t ih =>
    obtain ⟨k₁, v₁⟩ := p
    intro b ha hb h
    cases b with
    | nil =>
      have := h k₁
      simp [lookup] at this
    | cons q t₂ =>
      obtain ⟨k₂, v₂⟩ := q
      simp only [Sorted] at ha hb
      have hkeq : k₁ = k₂ := by
        rcases Nat.lt_trichotomy k₁ k₂ with hlt | heq | hgt
        · exfalso
          have hne : k₁ ≠ k₂ := Nat.ne_of_lt hlt
          have h₁ := h k₁
          rw [lookup_cons_self, lookup_cons_ne v₂ t₂ hne,
            lookup_eq_none_of_keysGt hb.1 (Nat.le_of_lt hlt)] at h₁
          simp at h₁
        · exact heq
        · exfalso
          have hne : k₂ ≠ k₁ := Nat.ne_of_lt hgt
          have h₂ := h k₂
          rw [lookup_cons_self, lookup_cons_ne v₁ t hne,
            lookup_eq_none_of_keysGt ha.1 (Nat.le_of_lt hgt)] at h₂
          simp at h₂
      subst hkeq
      have hveq : v₁ = v₂ := by
        have h₁ := h k₁
        rw [lookup_cons_self, lookup_cons_self] at h₁
        exact Option.some.inj h₁
      subst hveq
      have htail : ∀ k, lookup k t = lookup k t₂ := by
        intro k
        by_cases hk : k = k₁
        · subst hk
          rw [lookup_eq_none_of_keysGt ha.1 (Nat.le_refl k),
            lookup_eq_none_of_keysGt hb.1 (Nat.le_refl k)]
        · have := h k
          rwa [lookup_cons_ne v₁ t hk, lookup_cons_ne v₁ t₂ hk] at this
      rw [ih t₂ ha.2 hb.2 htail]

/-! ### The monoid laws on the carrier -/

theorem mergeWith_nil_left (f : V → V → V) (a : List (Digest × V)) :
    mergeWith f [] a = a := by simp only [mergeWith]

theorem mergeWith_nil_right (f : V → V → V) (a : List (Digest × V)) :
    mergeWith f a [] = a := by
  cases a with
  | nil => simp only [mergeWith]
  | cons p t => obtain ⟨k, v⟩ := p; simp only [mergeWith]

theorem mergeWith_comm (f : V → V → V) (hf : ∀ x y, f x y = f y x)
    (a b : List (Digest × V)) (ha : Sorted a) (hb : Sorted b) :
    mergeWith f a b = mergeWith f b a := by
  refine ext _ _ (sorted_mergeWith f a b ha hb) (sorted_mergeWith f b a hb ha) ?_
  intro k
  rw [lookup_mergeWith f a b ha hb k, lookup_mergeWith f b a hb ha k]
  exact joinOpt_comm f hf _ _

theorem mergeWith_assoc (f : V → V → V) (hf : ∀ x y z, f (f x y) z = f x (f y z))
    (a b c : List (Digest × V)) (ha : Sorted a) (hb : Sorted b) (hc : Sorted c) :
    mergeWith f (mergeWith f a b) c = mergeWith f a (mergeWith f b c) := by
  refine ext _ _
    (sorted_mergeWith f _ c (sorted_mergeWith f a b ha hb) hc)
    (sorted_mergeWith f a _ ha (sorted_mergeWith f b c hb hc)) ?_
  intro k
  rw [lookup_mergeWith f _ c (sorted_mergeWith f a b ha hb) hc k,
    lookup_mergeWith f a b ha hb k,
    lookup_mergeWith f a _ ha (sorted_mergeWith f b c hb hc) k,
    lookup_mergeWith f b c hb hc k]
  exact joinOpt_assoc f hf _ _ _

theorem interWith_comm (f : V → V → V) (hf : ∀ x y, f x y = f y x)
    (a b : List (Digest × V)) (ha : Sorted a) (hb : Sorted b) :
    interWith f a b = interWith f b a := by
  refine ext _ _ (sorted_interWith f a b ha hb) (sorted_interWith f b a hb ha) ?_
  intro k
  rw [lookup_interWith f a b ha hb k, lookup_interWith f b a hb ha k]
  exact meetOpt_comm f hf _ _

theorem interWith_assoc (f : V → V → V) (hf : ∀ x y z, f (f x y) z = f x (f y z))
    (a b c : List (Digest × V)) (ha : Sorted a) (hb : Sorted b) (hc : Sorted c) :
    interWith f (interWith f a b) c = interWith f a (interWith f b c) := by
  refine ext _ _
    (sorted_interWith f _ c (sorted_interWith f a b ha hb) hc)
    (sorted_interWith f a _ ha (sorted_interWith f b c hb hc)) ?_
  intro k
  rw [lookup_interWith f _ c (sorted_interWith f a b ha hb) hc k,
    lookup_interWith f a b ha hb k,
    lookup_interWith f a _ ha (sorted_interWith f b c hb hc) k,
    lookup_interWith f b c hb hc k]
  exact meetOpt_assoc f hf _ _ _

theorem mergeWith_idem (f : V → V → V) (hf : ∀ x, f x x = x)
    (a : List (Digest × V)) (ha : Sorted a) : mergeWith f a a = a := by
  refine ext _ _ (sorted_mergeWith f a a ha ha) ha ?_
  intro k
  rw [lookup_mergeWith f a a ha ha k]
  cases lookup k a <;> simp [joinOpt, hf]

theorem interWith_idem (f : V → V → V) (hf : ∀ x, f x x = x)
    (a : List (Digest × V)) (ha : Sorted a) : interWith f a a = a := by
  refine ext _ _ (sorted_interWith f a a ha ha) ha ?_
  intro k
  rw [lookup_interWith f a a ha ha k]
  cases lookup k a <;> simp [meetOpt, hf]

end CMap

/-! ## §7.1 The profile itself

Field-for-field with §7.1's `LossProfile`, with the record *contents* below each
key abstracted (`D` a distortion value, `Q` a debt quantity) and the keys being
the semantic keys §7.1.0 names: `preserved`/`distorted` key on
`(invariant, measure)`, `lost` on `subject`, assumptions on `assumption`,
ambiguities on `(question, alternatives)`, rejected claims on their digest, and
debt terms on `(dimension, scope)` (§7.3.1).
-/

/-- A canonical set of digests: a `CMap` whose values carry no information. -/
abbrev CSet := List (Digest × Unit)

def unionSet (a b : CSet) : CSet := CMap.mergeWith (fun _ _ => ()) a b

def interSet (a b : CSet) : CSet := CMap.interWith (fun _ _ => ()) a b

/-- §7.1.0 `PreservationSet`: `{ kind: "all" }` is "the algebraic top; legal only
    for `emptyLoss`". -/
inductive Preservation where
  | all
  | finite (items : CSet)
  deriving DecidableEq, Repr

namespace Preservation

/-- §7.1.1: `preserved` composes by intersection "with `{ kind: "all" }` as the
    identity element". -/
def inter : Preservation → Preservation → Preservation
  | .all, b => b
  | .finite x, .all => .finite x
  | .finite x, .finite y => .finite (interSet x y)

def Canonical : Preservation → Prop
  | .all => True
  | .finite x => CMap.Sorted x

/-- The finite carrier of a preservation set; `all` denotes the top, which has
    no finite carrier and is legal only for `emptyLoss`. -/
def items? : Preservation → CSet
  | .all => []
  | .finite x => x

theorem inter_all_left (b : Preservation) : inter .all b = b := rfl

theorem inter_all_right (a : Preservation) : inter a .all = a := by
  cases a <;> rfl

theorem inter_canonical {a b : Preservation} (ha : Canonical a) (hb : Canonical b) :
    Canonical (inter a b) := by
  cases a with
  | all => simpa [inter] using hb
  | finite x =>
    cases b with
    | all => simpa [inter] using ha
    | finite y => exact CMap.sorted_interWith _ x y ha hb

theorem inter_comm {a b : Preservation} (ha : Canonical a) (hb : Canonical b) :
    inter a b = inter b a := by
  cases a with
  | all => rw [inter_all_left, inter_all_right]
  | finite x =>
    cases b with
    | all => rw [inter_all_right, inter_all_left]
    | finite y =>
      simp only [inter, interSet]
      rw [CMap.interWith_comm _ (fun _ _ => rfl) x y ha hb]

theorem inter_assoc {a b c : Preservation}
    (ha : Canonical a) (hb : Canonical b) (hc : Canonical c) :
    inter (inter a b) c = inter a (inter b c) := by
  cases a with
  | all => rw [inter_all_left, inter_all_left]
  | finite x =>
    cases b with
    | all => rw [inter_all_right, inter_all_left]
    | finite y =>
      cases c with
      | all => rw [inter_all_right, inter_all_right]
      | finite z =>
        simp only [inter, interSet]
        rw [CMap.interWith_assoc _ (fun _ _ _ => rfl) x y z ha hb hc]

/-- §7.1.1: "The `all` sentinel is legal only in `emptyLoss`; a non-empty
    observed translation MUST carry a finite, evidenced set rather than claim
    universal preservation." The algebra respects that: a composed profile can
    only claim universal preservation if both of its parts did. -/
theorem inter_eq_all_iff (a b : Preservation) :
    inter a b = .all ↔ a = .all ∧ b = .all := by
  cases a <;> cases b <;> simp [inter]

end Preservation

/-- §7.1: `LossProfile`. -/
structure Profile (D Q : Type) where
  /-- §7.1.1: "the pipeline order and is the load-bearing non-commutative
      component; sorting it would falsify provenance". -/
  steps : List Digest
  preserved : Preservation
  distorted : List (Digest × D)
  lost : CSet
  introducedAssumptions : CSet
  unresolvedAmbiguities : CSet
  rejectedClaims : CSet
  /-- §7.3.1 `TranslationDebt.terms`, keyed on `(dimension, scope)`. -/
  debt : List (Digest × Q)

namespace Profile

variable {D Q : Type}

/-- §7.1.1 `emptyLoss`: "steps=[], preserved={kind:"all"}, every other set/debt
    field empty". -/
def empty : Profile D Q :=
  { steps := [], preserved := .all, distorted := [], lost := [],
    introducedAssumptions := [], unresolvedAmbiguities := [], rejectedClaims := [],
    debt := [] }

/-- §7.1.1 `composeLoss`, field by field, exactly as the RFC's field rules read.
    `dcompose` is "the distortion measure's own declared composition rule, which
    the invariant definition MUST supply"; `qadd` is the addition rule that
    §7.3.1 requires each `dimension` descriptor to pin. Neither is invented
    here. -/
def compose (dcompose : D → D → D) (qadd : Q → Q → Q) (a b : Profile D Q) :
    Profile D Q :=
  { steps := a.steps ++ b.steps
    preserved := Preservation.inter a.preserved b.preserved
    distorted := CMap.mergeWith dcompose a.distorted b.distorted
    lost := unionSet a.lost b.lost
    introducedAssumptions := unionSet a.introducedAssumptions b.introducedAssumptions
    unresolvedAmbiguities := unionSet a.unresolvedAmbiguities b.unresolvedAmbiguities
    rejectedClaims := unionSet a.rejectedClaims b.rejectedClaims
    debt := CMap.mergeWith qadd a.debt b.debt }

/-- §7.1.0: a profile is canonical when every set-valued and keyed field is in
    strictly increasing digest order — sorted, and duplicate-free. -/
def Canonical (p : Profile D Q) : Prop :=
  p.preserved.Canonical ∧ CMap.Sorted p.distorted ∧ CMap.Sorted p.lost ∧
    CMap.Sorted p.introducedAssumptions ∧ CMap.Sorted p.unresolvedAmbiguities ∧
    CMap.Sorted p.rejectedClaims ∧ CMap.Sorted p.debt

theorem empty_canonical : Canonical (empty : Profile D Q) := by
  refine ⟨trivial, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;> trivial

/-- Composition preserves the canonical form, so §7.1.0's byte equality is
    available at every point of a pipeline, not only at its ends. -/
theorem compose_canonical (dcompose : D → D → D) (qadd : Q → Q → Q)
    {a b : Profile D Q} (ha : Canonical a) (hb : Canonical b) :
    Canonical (compose dcompose qadd a b) := by
  obtain ⟨ha₁, ha₂, ha₃, ha₄, ha₅, ha₆, ha₇⟩ := ha
  obtain ⟨hb₁, hb₂, hb₃, hb₄, hb₅, hb₆, hb₇⟩ := hb
  exact ⟨Preservation.inter_canonical ha₁ hb₁,
    CMap.sorted_mergeWith _ _ _ ha₂ hb₂,
    CMap.sorted_mergeWith _ _ _ ha₃ hb₃,
    CMap.sorted_mergeWith _ _ _ ha₄ hb₄,
    CMap.sorted_mergeWith _ _ _ ha₅ hb₅,
    CMap.sorted_mergeWith _ _ _ ha₆ hb₆,
    CMap.sorted_mergeWith _ _ _ ha₇ hb₇⟩

/-! ### §7.1.1 property 2: identity -/

theorem compose_empty_left (dcompose : D → D → D) (qadd : Q → Q → Q)
    (a : Profile D Q) : compose dcompose qadd empty a = a := by
  cases a
  simp [compose, empty, unionSet, CMap.mergeWith_nil_left, Preservation.inter_all_left]

theorem compose_empty_right (dcompose : D → D → D) (qadd : Q → Q → Q)
    (a : Profile D Q) : compose dcompose qadd a empty = a := by
  cases a
  simp [compose, empty, unionSet, CMap.mergeWith_nil_right, Preservation.inter_all_right]

/-! ### §7.1.1 property 1: associativity

The RFC requires "the order in which a pipeline is bracketed MUST NOT change its
recorded loss". That is a theorem here only under the two hypotheses the RFC
itself imposes elsewhere and never states as laws: the declared distortion
composition rule and the pinned debt addition rule must each be associative.
Both are named in the statement rather than assumed silently.
-/

theorem compose_assoc (dcompose : D → D → D) (qadd : Q → Q → Q)
    (hD : ∀ x y z, dcompose (dcompose x y) z = dcompose x (dcompose y z))
    (hQ : ∀ x y z, qadd (qadd x y) z = qadd x (qadd y z))
    {a b c : Profile D Q} (ha : Canonical a) (hb : Canonical b) (hc : Canonical c) :
    compose dcompose qadd (compose dcompose qadd a b) c
      = compose dcompose qadd a (compose dcompose qadd b c) := by
  obtain ⟨ha₁, ha₂, ha₃, ha₄, ha₅, ha₆, ha₇⟩ := ha
  obtain ⟨hb₁, hb₂, hb₃, hb₄, hb₅, hb₆, hb₇⟩ := hb
  obtain ⟨hc₁, hc₂, hc₃, hc₄, hc₅, hc₆, hc₇⟩ := hc
  simp only [compose, unionSet, List.append_assoc, Profile.mk.injEq]
  refine ⟨trivial, Preservation.inter_assoc ha₁ hb₁ hc₁,
    CMap.mergeWith_assoc _ hD _ _ _ ha₂ hb₂ hc₂,
    CMap.mergeWith_assoc _ (fun _ _ _ => rfl) _ _ _ ha₃ hb₃ hc₃,
    CMap.mergeWith_assoc _ (fun _ _ _ => rfl) _ _ _ ha₄ hb₄ hc₄,
    CMap.mergeWith_assoc _ (fun _ _ _ => rfl) _ _ _ ha₅ hb₅ hc₅,
    CMap.mergeWith_assoc _ (fun _ _ _ => rfl) _ _ _ ha₆ hb₆ hc₆,
    CMap.mergeWith_assoc _ hQ _ _ _ ha₇ hb₇ hc₇⟩

/-! ### §7.1.1 property 3: where non-commutativity actually lives

The RFC says composition "is **not** required to be equal and generally [is]
not". That is true, but it is worth knowing *which* fields can differ, because
that is what a property test has to exercise. Under the field rules of §7.1.1,
every set-valued field commutes unconditionally; `preserved` and `debt` commute
under the hypotheses the RFC already requires (intersection is commutative;
§7.3.1 requires debt addition to be commutative). What does not commute is
`steps` — and `distorted`, exactly when the declared distortion rule is not
commutative, which §7.1.1 permits.
-/

theorem lost_compose_comm (dcompose : D → D → D) (qadd : Q → Q → Q)
    {a b : Profile D Q} (ha : Canonical a) (hb : Canonical b) :
    (compose dcompose qadd a b).lost = (compose dcompose qadd b a).lost :=
  CMap.mergeWith_comm _ (fun _ _ => rfl) _ _ ha.2.2.1 hb.2.2.1

theorem assumptions_compose_comm (dcompose : D → D → D) (qadd : Q → Q → Q)
    {a b : Profile D Q} (ha : Canonical a) (hb : Canonical b) :
    (compose dcompose qadd a b).introducedAssumptions
      = (compose dcompose qadd b a).introducedAssumptions :=
  CMap.mergeWith_comm _ (fun _ _ => rfl) _ _ ha.2.2.2.1 hb.2.2.2.1

theorem preserved_compose_comm (dcompose : D → D → D) (qadd : Q → Q → Q)
    {a b : Profile D Q} (ha : Canonical a) (hb : Canonical b) :
    (compose dcompose qadd a b).preserved = (compose dcompose qadd b a).preserved :=
  Preservation.inter_comm ha.1 hb.1

/-- §7.3.1: "associative and commutative — debt from two independent lossy
    mappings does not depend on the order they were incurred". Conditional on
    the pinned addition rule being commutative, which is §7.3.1's own
    requirement on the `dimension` descriptor. -/
theorem debt_compose_comm (dcompose : D → D → D) (qadd : Q → Q → Q)
    (hQ : ∀ x y, qadd x y = qadd y x)
    {a b : Profile D Q} (ha : Canonical a) (hb : Canonical b) :
    (compose dcompose qadd a b).debt = (compose dcompose qadd b a).debt :=
  CMap.mergeWith_comm _ hQ _ _ ha.2.2.2.2.2.2 hb.2.2.2.2.2.2

/-- §7.1.1: `steps` is ordered concatenation. This is the single field that
    carries pipeline order, and `Counterexamples.lean` turns it into the
    concrete witness of non-commutativity. -/
theorem steps_compose (dcompose : D → D → D) (qadd : Q → Q → Q) (a b : Profile D Q) :
    (compose dcompose qadd a b).steps = a.steps ++ b.steps := rfl

/-! ### §7.1.1: monotone loss -/

/-- §7.1.1: "`lost` — union. Information lost at any step is lost by the
    pipeline; a later step cannot restore it." -/
theorem lost_monotone_left (dcompose : D → D → D) (qadd : Q → Q → Q)
    {a b : Profile D Q} (ha : Canonical a) (hb : Canonical b) (k : Digest)
    (h : CMap.lookup k a.lost = some ()) :
    CMap.lookup k (compose dcompose qadd a b).lost = some () := by
  simp only [compose, unionSet]
  rw [CMap.lookup_mergeWith _ _ _ ha.2.2.1 hb.2.2.1 k, h]
  cases CMap.lookup k b.lost <;> rfl

theorem lost_monotone_right (dcompose : D → D → D) (qadd : Q → Q → Q)
    {a b : Profile D Q} (ha : Canonical a) (hb : Canonical b) (k : Digest)
    (h : CMap.lookup k b.lost = some ()) :
    CMap.lookup k (compose dcompose qadd a b).lost = some () := by
  simp only [compose, unionSet]
  rw [CMap.lookup_mergeWith _ _ _ ha.2.2.1 hb.2.2.1 k, h]
  cases CMap.lookup k a.lost <;> rfl

/-- §7.1.1: "`preserved` — intersection … An invariant is preserved by the
    pipeline only if preserved at every step. Preservation MUST NOT be inferred
    from the endpoints." -/
theorem preserved_antitone (dcompose : D → D → D) (qadd : Q → Q → Q)
    {a b : Profile D Q} {x y : CSet}
    (hx : CMap.Sorted x) (hy : CMap.Sorted y)
    (hap : a.preserved = .finite x) (hbp : b.preserved = .finite y) (k : Digest)
    (h : CMap.lookup k (compose dcompose qadd a b).preserved.items? = some ()) :
    CMap.lookup k x = some () ∧ CMap.lookup k y = some () := by
  simp only [compose, hap, hbp, Preservation.inter, Preservation.items?, interSet] at h
  rw [CMap.lookup_interWith _ _ _ hx hy k] at h
  cases hkx : CMap.lookup k x with
  | none => rw [hkx] at h; cases CMap.lookup k y <;> simp [CMap.meetOpt] at h
  | some u =>
    cases u
    cases hky : CMap.lookup k y with
    | none => rw [hkx, hky] at h; simp [CMap.meetOpt] at h
    | some u' => cases u'; exact ⟨rfl, rfl⟩

/-! ### §7.3.1: debt accumulation is monotone

"accumulation is **monotone**: `addDebt(a, b) >= a` in the debt order. Debt is
never reduced by incurring more of it." The debt order is not defined by the
RFC — §7.3.1 requires each `dimension` descriptor to pin one — so it appears
here as a hypothesis `qle`, together with the property the RFC's sentence
amounts to: a quantity is never decreased by adding to it.
-/

theorem debt_monotone (dcompose : D → D → D) (qadd : Q → Q → Q)
    (qle : Q → Q → Prop) (hmono : ∀ x y, qle x (qadd x y)) (hrefl : ∀ x, qle x x)
    {a b : Profile D Q} (ha : Canonical a) (hb : Canonical b)
    (k : Digest) (q : Q) (h : CMap.lookup k a.debt = some q) :
    ∃ q', CMap.lookup k (compose dcompose qadd a b).debt = some q' ∧ qle q q' := by
  simp only [compose]
  rw [CMap.lookup_mergeWith _ _ _ ha.2.2.2.2.2.2 hb.2.2.2.2.2.2 k, h]
  cases hbk : CMap.lookup k b.debt with
  | none => exact ⟨q, rfl, hrefl q⟩
  | some q₂ => exact ⟨qadd q q₂, rfl, hmono q q₂⟩

end Profile

end HSP.LossProfile

/-! ## Axiom cone -/

#print axioms HSP.LossProfile.CMap.lookup_eq_none_of_keysGt
#print axioms HSP.LossProfile.CMap.sorted_mergeWith
#print axioms HSP.LossProfile.CMap.lookup_mergeWith
#print axioms HSP.LossProfile.CMap.sorted_interWith
#print axioms HSP.LossProfile.CMap.lookup_interWith
#print axioms HSP.LossProfile.CMap.ext
#print axioms HSP.LossProfile.CMap.mergeWith_nil_left
#print axioms HSP.LossProfile.CMap.mergeWith_nil_right
#print axioms HSP.LossProfile.CMap.mergeWith_comm
#print axioms HSP.LossProfile.CMap.mergeWith_assoc
#print axioms HSP.LossProfile.CMap.interWith_comm
#print axioms HSP.LossProfile.CMap.interWith_assoc
#print axioms HSP.LossProfile.CMap.mergeWith_idem
#print axioms HSP.LossProfile.CMap.interWith_idem
#print axioms HSP.LossProfile.Preservation.inter_all_left
#print axioms HSP.LossProfile.Preservation.inter_all_right
#print axioms HSP.LossProfile.Preservation.inter_canonical
#print axioms HSP.LossProfile.Preservation.inter_comm
#print axioms HSP.LossProfile.Preservation.inter_assoc
#print axioms HSP.LossProfile.Preservation.inter_eq_all_iff
#print axioms HSP.LossProfile.Profile.empty_canonical
#print axioms HSP.LossProfile.Profile.compose_canonical
#print axioms HSP.LossProfile.Profile.compose_empty_left
#print axioms HSP.LossProfile.Profile.compose_empty_right
#print axioms HSP.LossProfile.Profile.compose_assoc
#print axioms HSP.LossProfile.Profile.lost_compose_comm
#print axioms HSP.LossProfile.Profile.assumptions_compose_comm
#print axioms HSP.LossProfile.Profile.preserved_compose_comm
#print axioms HSP.LossProfile.Profile.debt_compose_comm
#print axioms HSP.LossProfile.Profile.steps_compose
#print axioms HSP.LossProfile.Profile.lost_monotone_left
#print axioms HSP.LossProfile.Profile.lost_monotone_right
#print axioms HSP.LossProfile.Profile.preserved_antitone
#print axioms HSP.LossProfile.Profile.debt_monotone
#print axioms HSP.LossProfile.CMap.keysGt_mono
#print axioms HSP.LossProfile.CMap.lookup_cons_self
#print axioms HSP.LossProfile.CMap.lookup_cons_ne
#print axioms HSP.LossProfile.CMap.joinOpt_comm
#print axioms HSP.LossProfile.CMap.joinOpt_assoc
#print axioms HSP.LossProfile.CMap.meetOpt_comm
#print axioms HSP.LossProfile.CMap.meetOpt_assoc
#print axioms HSP.LossProfile.CMap.keysGt_mergeWith
#print axioms HSP.LossProfile.CMap.keysGt_interWith
