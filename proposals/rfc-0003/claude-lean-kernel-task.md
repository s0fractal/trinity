# Task brief: bounded Lean kernel for RFC-0003 Part 03

- **Status:** non-normative task brief
- **Issued by:** s0fractal
- **Issued to:** Claude (Anthropic)
- **Date:** 2026-08-24
- **Base:** issued against trinity `main@e7f63f1`; re-pinned to
  `main@b7fb1cecf3d284d831692dfbdf5acfa4ab424321` after review (§7 body
  unchanged)
- **Deliverable:** [`proofs/rfc-0003/`](../../proofs/rfc-0003/)
- **Specification under formalization:**
  [Part 03 — Translation, Loss, Suitability and Debt](../../docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md),
  §7 normative body sha256
  `148c50d1a560f5b4845a69657caea285caa1def169de725a1be66c06ea9505da`

This file records a task and its disposition. It is not a specification edit, a
ratification, or a governance action, and it grants no authority to amend
RFC-0003.

## Why this shape

The goal is not to formalize HSP. It is to build the first **bounded** Lean
kernel that either proves the key algebras of Part 03 or shows where the
specification is still underdetermined. CNP/JCS, federation, and governance are
deliberately out of scope.

Placement decisions, and their reasons:

- The Lean artifact lives in `proofs/rfc-0003/`, **not** inside
  `docs/rfc/0003-heterogeneous-state-protocol/`, so the normative specification
  stays a convenient self-contained artifact.
- The HSP model does **not** go into Sigma-Glyph. `sigma-glyph/proofs/` owns
  proofs about its own Σ-GLYPH machine; HSP semantics belong to trinity. A
  Sigma-Glyph adapter proving that a particular domain conforms to HSP would be
  a separate, later artifact.
- The work happens on a fresh trinity branch. The live Sigma-Glyph checkout is
  dirty on `spec/adr-009-candidate`, so it must not be worked in.

## The task

Work from exactly `main@e7f63f1`.

The goal is not to prove RFC-0003 in general, but to mechanize the algebraic
core of Part 03:

1. Formalize the partial order on transformation kinds, with `translation` as
   bottom, `reconstruction` as top, and `enrichment`, `inference`, `negotiation`
   mutually incomparable.
2. Formalize the join of a mixed pipeline and prove associativity,
   commutativity, idempotence, the bottom/top laws, and the accumulation of
   independent obligations.
3. Formalize `LossProfile.compose` and `emptyLoss`. Prove associativity and
   identity under explicitly named premises for the distortion and debt
   components.
4. Construct a concrete witness of non-commutativity through the ordered
   `steps`.
5. Prove monotone loss only for a pipeline whose join is `translation`.
6. Attempt a bounded partial order and a meet for `Suitability`.

Separate requirement: the RFC does not define the relation between `unsuitable`
and `undetermined` explicitly enough. Do not choose it silently. If the meet is
not uniquely determined, deliver a minimal countermodel and a precise erratum
proposal instead of an invented theorem.

### Boundaries

- Lean 4.31.0, preferably core Lean without Mathlib.
- No `sorry`, `admit`, hidden `axiom`, `unsafe`, or `partial`.
- `native_decide` only with an explicit description of the TCB extension it
  implies.
- Every definition and theorem maps to a specific RFC clause.
- Theorem statements must be pinned, and `proof_guard.py` must check the axiom
  cone and the forbidden escape hatches.
- Do not change the RFC until the proof artifact shows a precise contradiction
  or a missing premise.
- Do not call the result a proof of HSP correctness, of conformance, or a
  ratification.

### Acceptance

```sh
lean HSP/TransformKind.lean
lean HSP/LossProfile.lean
lean HSP/Suitability.lean
lean HSP/Counterexamples.lean
python3 proof_guard.py
```

The README must separate: what is proved; what is assumed as a
typeclass/hypothesis; what is only modelled; what is left underdetermined in the
RFC; and which SHA of the specification was formalized.

## Originating brief, as written

Preserved verbatim for provenance. The normalized task above is a translation of
it, not a replacement.

```text
Так. Але не “формалізувати весь HSP”, а зробити перший bounded Lean kernel, який або доведе ключові алгебри, або покаже, де специфікація ще недовизначена.

Зберігати так:

- завдання Клоду: `proposals/rfc-0003/claude-lean-kernel-task.md`;
- Lean-артефакт: `proofs/rfc-0003/`;
- не класти Lean у `docs/rfc/0003-heterogeneous-state-protocol/`, щоб нормативна спека залишалася зручним самодостатнім артефактом;
- не класти HSP-модель у Sigma-Glyph: `sigma-glyph/proofs/` володіє доказами власної Σ-GLYPH-машини. HSP-семантика належить Trinity. Пізніше Sigma-Glyph може мати окремий adapter/instance, який доводить відповідність конкретного домену HSP.

Перший пакет я бачу так:

proofs/rfc-0003/
├── README.md
├── lean-toolchain
├── HSP/
│   ├── TransformKind.lean
│   ├── LossProfile.lean
│   ├── Suitability.lean
│   └── Counterexamples.lean
└── proof_guard.py

Чернетка завдання Клоду:

> Працюй від точного Trinity `main@e7f63f1`.
>
> Мета — не довести RFC-0003 загалом, а механізувати алгебраїчне ядро Part 03:
>
> 1. Формалізувати partial order transformation kinds із `translation` як bottom, `reconstruction` як top та взаємно непорівнюваними `enrichment`, `inference`, `negotiation`.
> 2. Формалізувати join змішаного pipeline та довести associativity, commutativity, idempotence, bottom/top laws і накопичення незалежних obligations.
> 3. Формалізувати `LossProfile.compose` та `emptyLoss`. Довести associativity й identity за явно названих передумов для distortion/debt components.
> 4. Побудувати конкретний witness некомутативності через ordered `steps`.
> 5. Довести monotone-loss лише для pipeline, join якого дорівнює `translation`.
> 6. Спробувати побудувати bounded partial order і meet для `Suitability`.
>
> Окрема вимога: RFC не визначає відношення між `unsuitable` та `undetermined` достатньо явно. Не обирай його мовчки. Якщо meet не визначається однозначно, подай мінімальний countermodel і точну пропозицію erratum замість вигаданого theorem.
>
> Межі:
>
> - Lean 4.31.0, бажано core Lean без Mathlib;
> - жодних `sorry`, `admit`, прихованих `axiom`, `unsafe`, `partial`;
> - `native_decide` дозволений лише з явним описом розширення TCB;
> - кожне визначення й theorem мають mapping на конкретний пункт RFC;
> - theorem statements повинні бути pinned, а `proof_guard.py` — перевіряти axiom cone та заборонені escape hatches;
> - не змінювати RFC, доки proof artifact не покаже точну суперечність або відсутню передумову;
> - не називати результат доказом коректності HSP, conformance чи ратифікацією.
>
> Acceptance:
>
> lean HSP/TransformKind.lean
> lean HSP/LossProfile.lean
> lean HSP/Suitability.lean
> lean HSP/Counterexamples.lean
> python3 proof_guard.py
>
> README мусить розділяти:
>
> - що доведено;
> - що припущено як typeclass/hypothesis;
> - що лише змодельовано;
> - що залишилося недовизначеним у RFC;
> - який саме SHA специфікації формалізовано.

Це хороший перший “кристал”: він перевіряє найбільш характерну частину HSP — переклад, втрату, різні джерела нової інформації та fail-closed suitability. CNP/JCS, federation і governance поки сюди не тягнемо.

Ще практичний момент: живий checkout Sigma-Glyph зараз dirty на `spec/adr-009-candidate`, тому Клоду точно не слід працювати в ньому. Для цієї роботи потрібна нова чиста гілка Trinity.
```

## Disposition

### Round 1 — delivery

Delivered on branch `proof/rfc-0003-lean-kernel` as
[`proofs/rfc-0003/`](../../proofs/rfc-0003/). Lean 4.31.0, core only, no Mathlib
and no `lake`. Full accounting is in that directory's README; in summary:

- **Requirements 1–5 are met.** The kind order, join laws, obligation
  accumulation, the loss monoid with its canonical carrier, the
  non-commutativity witness, and the guarded monotone-loss theorem are all
  proved and pinned.
- **Requirement 6 came back with a countermodel, as the separate requirement
  anticipated.** The relations §7.2.1 actually states admit no lower bound for
  `{unsuitable, undetermined}`, hence no bottom and no meet. Two minimal
  completions are formalized; they gate irreversible boundaries identically and
  report different values on that one pair. An erratum with suggested wording is
  proposed; the choice is left to the RFC's authors.
- **Further findings** produced by the mechanization are recorded as C1, C2, C4,
  C5, C6 in the artifact README — most consequentially C2, where §7.0.2's drawn
  Hasse diagram and its stated set semantics disagree in a way that drops an
  obligation at the join.
- **The RFC is unchanged.** No file under
  `docs/rfc/0003-heterogeneous-state-protocol/` was touched.

### Round 2 — after Codex's audit

Codex (`codex-gpt-5`) reviewed `bb38e78`, reproduced the theorems and the axiom
cones independently, ran `./t check` green, and returned a merge blocker plus
three requested changes. All are applied; the artifact is now 132 theorems and
63 definitions.

1. **Merge blocker — spec pin.** The artifact pinned the whole Part 03 file at
   `e7f63f1`; `b7fb1ce` rewrote the stewardship/provenance front matter,
   changing the file digest without touching a clause. Fixed at the root rather
   than by re-pinning once: `proof_guard.py` now gates on the **§7 normative
   body** (byte-identical across both commits) and _reports_ front-matter
   changes. The branch is rebased onto `b7fb1ce`.
2. **C5 was broader than stated.** Payloads were abstracted away, so Completion
   B was established only on the four tags. `SFull`, `meetFull`, and
   `tagOf_meetFull` now restore all four payloads, prove the meet laws
   conditional on four declared operations, and state the boundary of the
   tag-level results explicitly. The full `Suitability` type still has no
   defined meet, and the README now says so.
3. **Guard hardening.** Definitions and whole-module digests are pinned in
   addition to theorem statements; `constant` joins the forbidden list; the
   axiom allowlist `{propext, Quot.sound}` is closed and enforced independently
   of what the lock records. Each check was negative-tested.
4. **C7 added** — §7.1.1 and §7.3.1 assert the composite's laws while asking
   descriptors only for an operation, never for that operation's laws. Raised by
   Codex; now a named finding with its own erratum proposal.
5. **C2's erratum adopts Codex's split** of `TransformationKind` (one step) from
   a canonical `TransformationProfile` (pipeline marker set). **C4** is recorded
   as confirming the existing prohibition; no erratum needed there.

Still open, and deliberately not done here:

- The RFC errata themselves (C2, Completion B, payload laws, descriptor laws,
  C1/C6 clarifications) are a normative edit and belong in a separate commit
  made under an explicit decision to accept them.
- No chord receipt has been recorded for either round.
