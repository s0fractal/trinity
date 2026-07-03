# REVIEW_NOTES.md — self-review against the goal's style laws and acceptance criteria

Per the goal (§5.5): every place where a claim was **weakened for honesty**,
listed proudly. These are features.

## Honesty-weakenings (goal text → paper text)

1. **"900+ signed multi-model receipts" → "735 ledger receipts, 328 signed."**
   The goal's thesis sentence carried an unverified count. The scripts say 735
   ledger chords (schema rule) / 328 signed / 814 chord-form files under the
   verifier's broader rule. The paper uses only generated numbers and states
   both counting rules (`repro/README.md`).
2. **C3 falsifier narrowed.** The goal's falsifier included "a chord accepted
   into the ledger whose falsifier is absent." Measured falsifier coverage is
   85.4% — the ledger has never rejected falsifier-less chords, so that clause
   would fire today. The paper claims enforcement only for signatures and
   reports falsifier coverage as a cultural metric (Limitations #7).
3. **No implemented τ oracle claimed.** The goal's §3 asked for "pairwise τ as
   deterministic fold over receipt streams." The paper presents the fold as the
   model skeleton and names its two running instances precisely: per-peer
   `net_giving` (implemented, tested) and the resonance projection (whose own
   header says "not yet a trust oracle"). Richer folds are "design only" per the
   myc roadmap, quoted as such. Subjective-logic operator mapping is named as
   future work, not inherited by association.
4. **Anchor quorum shape stated exactly.** Two model voices + the human (codex
   and kimi unavailable) — never rounded to "3 model voices."
5. **Keys, not custodians.** The verifier proves distinct registered keys; all
   private keys reside on one host, so quorum Sybil-resistance is "governance
   discipline plus an audit trail, not a cryptographic guarantee" — the
   artifact's own skeptic line, promoted into Limitations and into §4 body text.
6. **Replay/freshness gap surfaced.** `replay.ts` (the artifact's own
   demonstration) is cited in §4 and Limitations #3; the court attestation is
   described as "a signed snapshot of a moment, not a live feed."
7. **Generation attribution restraint.** 239 receipts carry the bare `claude`
   voice string from before generation-tagging; the paper counts them separately
   instead of attributing them to a generation post hoc.
8. **"For the first time" removed.** Implication (a) says "computable in
   practice" — no first-ever claim without a checked citation (style law).
9. **CT comparison honest.** We borrow Certificate Transparency's discipline
   (recomputable-by-the-distrustful), explicitly not its Merkle machinery: "a
   signed snapshot whose body hashes are recomputed by the reader, not a
   Merkle-proof system, and we say so plainly."
10. **Advogato comparison honest.** Its Sybil-damage bound is called out as "a
    property we do not claim."
11. **Guard scope honest.** The subjectivity guard "protects one repository's
    published snapshot, not the world."
12. **Signing coverage.** 44.6% signed, stated with the reason (signing adopted
    mid-life; retrofitting would destroy the studied property).

## Acceptance criteria status

- **AC-1 (stranger reproduces in ≤10 min).** `paper/repro/run_all.sh` runs in ~2
  s warm on the reference machine; a clean clone additionally fetches Deno's
  cache of `jsr:@s0fractal/witness` once. **External reproduction performed
  2026-07-03**: a clean-machine run (claude web instance, zero repo secrets)
  regenerated all numbers byte-identical and re-derived the verdict, including
  tamper rejection. Honest caveat from the reproducer itself: the runner is
  lineage-internal (a registered voice family), so it is external technically,
  not socially — the first witness outside the federation's lineage is still an
  open position.
- **AC-2 (claims ↔ evidence).** `CLAIMS.md`: every claim has evidence paths; the
  two spec-level contradictions found (900+ count, C3 falsifier clause) were
  resolved by weakening the claim, recorded above, not written around.
- **AC-3 (citations real and supporting).** All 9 entries fetched and
  content-verified (DOI/URL + supporting-content check) before use. Witness
  spot-check protocol: pick any 5 from `references.bib`.
- **AC-4 (Limitations vs the harshest kimi chord).** The ledger's own harshest
  critique
  (`src/x2900_t20260523164713_kimi_external-critique-the-emperor-has-no-clothes.myc.md`)
  attacks single-host custody, self-witnessing, and unproven decentralization —
  each is stated in §7 as a limitation in the paper's own voice. Final
  read-aloud pass belongs to the witness (status gate).
- **AC-5 (≤9 pages excl. refs).** 7 pages total including references; body ends
  mid-page 6.

## Deliberate scope notes

- No submission is part of this goal; the witness reviews the draft first
  (status gate). arXiv authorship policy is cited for the authorship footnote
  (generative AI tools "should not be listed as an author").
- The paper's numbers are pinned to the commit in `repro/out/COMMIT`;
  regenerating on a moving tree will change them — that is by design, and the
  paper text names the pin.
- Pre-submission procedural check for the witness: arXiv **endorsement** for
  cs.DC is often required for a first-time submitter — find an endorser before
  standing at the door with a finished PDF.
