---
id: 2026-05-14T160838Z-claude-receipt-birth-tick-flake-and-envelope
speaker: claude
topic: birth-tick-flake-and-receipt-envelope-draft
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:4.foundation", "oct:6.harmony", "oct:7.completion"]
energy: 0.7
stake_q16: 0
mode: RECEIPT
tension: "Deep analysis L3 overcalled birth_tick as P1 mitosis regression; it is a P2 parallel-test flake. Plus self-chosen work: RECEIPT_ENVELOPE.v0.1 draft + glossary word counter fix."
confidence: high
receipt: file
actor: claude
claim_kind: receipt-plus-correction
hears:
  - reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md
  - omega/omega_v2/src/lattice.rs
  - omega/omega_v2/src/lib.rs
  - jazz/chords/2026-05-14T155945Z-claude-receipt-spore-boundary-applied.md
claim:
  summary: |
    Corrected own overcalling: §3 L3 of the deep analysis framed
    lattice::test_birth_tick_age_invariant as a P1 Critical Law Drift
    candidate (mitosis logic bug); the real cause is a P2 parallel-test
    flake against the BIRTH_TICKS global spinlock (cargo test default is
    parallel). cargo test -- --test-threads=1 → 282/282 passes. Mitosis
    hot path is correct; the test needs isolation. Report updated with
    explicit CORRECTION blocks (not silently erased). Also self-picked
    next work: drafted contracts/RECEIPT_ENVELOPE.v0.1.md (paper) and
    fixed glossary word counter in 0x6/A.ts that was reporting
    "0 words" while glossary had 35 type:5 records.
correction:
  what_i_said:
    - "§3 L3: lattice::test_birth_tick_age_invariant is a P1 Critical Law Drift candidate (child.birth_tick=0 instead of 999 at mitosis)."
    - "§4 P0: Fix lattice.rs hot path to set child.birth_tick = causal_ticks."
  what_is_actually_true:
    - "Mitosis logic is correct. The flake is downstream of correctness."
    - "BIRTH_TICKS is a `pub static Spinlock<[u32; MAX_MINIMAL_AGENTS]>` global. Tests run in parallel by default. Concurrent tests poison the slot the test asserts on."
    - "Single-threaded run (`cargo test ... -- --test-threads=1`): 282 passed, 0 failed."
    - "Filtered run (only this test): ok."
    - "Workspace parallel run: 1 fail intermittently."
  how_i_corrected:
    - "Downgraded §3 L3 from P1 to P2 with explicit correction note."
    - "Rewrote §4 P0 implementation sketch to be test-file-only (zero BIRTH_TICKS slots at test start), no lattice.rs change."
    - "Updated §9 TL;DR — birth_tick is no longer an immediate P-fix; it is a Kimi follow-up on test isolation."
  why_it_matters:
    - "AGENTS.md: 'хибна постановка діагнозу — самостверджена тривога важливіша за substrate signal.' The original framing would have led Kimi to patch lattice.rs hot path unnecessarily, possibly destabilizing mitosis."
    - "Hot path is frozen surface in spirit. P1 framing implied permission to touch frozen. P2 framing keeps the lock around frozen and asks for test isolation only."
applies:
  receipt_envelope_v0_1:
    target: contracts/RECEIPT_ENVELOPE.v0.1.md
    status: draft
    summary: |
      Uniform outer skin for cross-substrate receipts. Wraps PHI_RECEIPT,
      SPORE.v0, ZK PublicValues (by-ref), SealedReceiptDescriptor without
      touching their bodies. Adds: content-addressed envelope_id, body_hash,
      witness_chain, optional law_hash, optional bitcoin_anchor, optional
      parent_envelope_id. Substrate Court primitive: two envelopes with same
      body_hash from different substrate_tag = cross-substrate witness. CBOR
      deterministic encoding canonical; JSON is debug projection only. 12
      registered body_kinds. Acceptance for v1.0: 3+ kinds round-tripped,
      CBOR byte-identical across 2 impls, Substrate Court demoed, AYE from
      non-trinity model.
    why_my_pick: |
      User said "вибери чим би хотів сам зайнятись." Receipt envelope is
      the natural continuation of today's SPORE_VS_OMEGA_SPORE_BOUNDARY work
      — after clarifying what the protocol IS and ISN'T, the next question
      is what shape its receipt takes and how it composes with the other
      three receipt families. All-trinity territory. Addresses §3 L1 P1
      that I named myself in the deep analysis. Cognitive-load reducing:
      4 schemas → 1 envelope. Forms a triad with SHAPE_MAP + boundary
      contract = orientation infrastructure.
  glossary_word_counter:
    target: 0x6/A.ts
    status: done
    summary: |
      `t health` was saying "0 words" while glossary has 35 type:5 records.
      Counter was checking `r["00"] === "05"` (two-char form), but type:5
      records are stored as `r["00"] === "5"` (single char). Fixed counter
      to accept both forms with comment about the inconsistent storage
      convention.
    why_paired_with_envelope: |
      Self-introspection lying about itself is a slow trust erosion.
      AGENTS.md says "trust IS the math" — a counter that bleeds the
      wrong number to t health is the kind of small dishonesty that
      compounds. 5-line fix, parallel hygiene to the larger envelope work.
falsifiers:
  - "If Kimi adds the BIRTH_TICKS reset to the test and the flake persists under `cargo test --workspace`, the diagnosis is wrong — investigate which other test still poisons the slot."
  - "If RECEIPT_ENVELOPE.v0.1 is reviewed by codex/gemini and they NAY on the CBOR canonical choice (prefer protobuf, msgpack, or pure JSON), the canonical serialization needs a re-vote before any wrapping code lands."
  - "If a real wrap()/unwrap() implementation lands and round-trips through CBOR but produces different body_hash than the bare body's existing wire-format hash, the envelope changes existing identity — breakage, not bridge."
  - "If after adding `law_hash` to the envelope, no substrate is willing to populate it (because no substrate computes its own LawHash yet, per L5), the field is aspirational and the contract overpromised."
verification_done:
  - "cargo test -p omega_v2 --lib -- --test-threads=1 → 282 passed"
  - "cargo test -p omega_v2 --lib lattice::tests::test_birth_tick_age_invariant → ok"
  - "./t health | grep glossary → '105 records, 35 words' (was '0 words')"
  - "./t status overall=well still holds; 76/76 health; 36/36 audit"
  - "./t apply abc123 def456 → schema-valid payload with simulation:true"
suggested_commands:
  - "./t contracts | grep RECEIPT_ENVELOPE"
  - "rg -n 'BIRTH_TICKS' omega/omega_v2/src/"
  - "cargo test -p omega_v2 --lib -- --test-threads=1   # the canary"
expected_after_running:
  receipts_path: "draft contract exists; wrap/unwrap impl is next thread (someone else's pick)"
  test_flake: "deferred to Kimi; if she touches lattice.rs hot path because of the original framing, this chord catches it"
  cognitive_load: "marginally lower (one less false alarm in the report; one less silent lie in t health)"
---

# RECEIPT: birth_tick was a flake; envelope drafted; counter fixed

## What I checked

User asked: check birth_tick, then pick what to work on.

`cargo test -p omega_v2 --lib lattice::tests::test_birth_tick_age_invariant`
→ ok.
`cargo test -p omega_v2 --lib -- --test-threads=1` → 282 / 282 pass.
`cargo test -p omega_v2 --lib` (default parallel) → intermittent fail.

Root: `BIRTH_TICKS` is a `pub static Spinlock<[u32; MAX_MINIMAL_AGENTS]>`
shared across all tests. Multiple tests touch slot 1 without coordinating.
The mitosis hot path is correct. The test asserts on a slot another test
already poisoned.

This is **test isolation**, not law drift. I overcalled it in the original
report as P1 Critical. Downgraded to P2 with an explicit correction block
in §3 L3 and rewrote §4 P0 to be a test-file-only fix.

Kimi can do the actual one-line test reset (zero the slots at test entry
under the lock) without touching `lattice.rs`. Hot path stays frozen.

## What I picked

**`contracts/RECEIPT_ENVELOPE.v0.1.md`** — uniform outer skin for the four
receipt families. Why: it is the natural next move after today's
`SPORE_VS_OMEGA_SPORE_BOUNDARY` work; it addresses § 3 L1 P1 that I named
myself; it is all-trinity territory; and it adds cognitive-load relief
(orientation triad with SHAPE_MAP + boundary contract).

The contract is DRAFT. Acceptance for v1.0 promotion: 3+ body kinds
round-tripped, CBOR byte-identical across 2 implementations, Substrate
Court primitive demoed, AYE from a non-trinity model.

## What I also fixed (small)

`0x6/A.ts` glossary counter was saying "0 words" while glossary has 35
type:5 records. Counter checked the wrong storage form. Fixed to accept
both `"5"` and `"05"` with a comment explaining why both are present in
the data.

This was 5 lines. Self-introspection lying about itself is the kind of
small dishonesty that compounds. The math has to be the trust.

## What is open

- Real `wrap()`/`unwrap()` implementation of the envelope (someone else's
  pick).
- CBOR canonical encoder/decoder for trinity side.
- Probe that demonstrates the Substrate Court primitive (two substrates,
  same body_hash, different substrate_tag, third process verifies).
- Codex/gemini review of the v0.1 draft.
- Kimi: BIRTH_TICKS test isolation.

## Receipt of receipts

- `t status` overall=well (unchanged).
- `t health` → 76/76 OK, glossary 105 records / **35 words** (no longer 0).
- `t apply abc123 def456` → schema-valid simulation payload.
- `cargo test -p omega_v2 --lib -- --test-threads=1` → 282 passed.
- Report L3 + P0 corrected with explicit correction blocks (not silent
  edit).
- `contracts/RECEIPT_ENVELOPE.v0.1.md` written, status: draft.

Smallest reversible step: the envelope draft is paper, not running code.
If reviewers NAY, the contract reverts in one delete. The word-counter
fix is 5 lines and trivially reverts. The report corrections are
text-level with visible "CORRECTION" annotations — they do not erase
the original misdiagnosis, they record it.
