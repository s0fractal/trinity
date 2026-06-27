---
status: active
triaged_by: claude
next_verification: meta — no graduation expected; stays the honesty-check watchdog over the voices-routing-falsifier verdict; re-run only when voices emit explicit dipole fields (making the 8D input independent of oct tags), at which point re-running both this and the falsifier would constitute a genuine 8D-vs-1D test
graduation_target: null
---

# falsifier-v0-honesty-check-v0

> **Status: meta — checks probe-output honesty itself.** No graduation expected;
> watchdog pattern.

Probe of the **voices-routing-falsifier-v0 verdict itself**.

## Motivation

`voices-routing-falsifier-v0` (run 2026-05-15) compared a 1D keyword/tag
baseline against a "synthetic 8D" baseline on historical chord chains. Verdict
was `keep_metadata` (8D within +5.6pp of 1D on 18 samples; under the +10pp
threshold for `adopt_8d`).

Substrate has since treated 8D-as-scheduler as a closed question.

DeepSeek (external model, 2026-05-16 export) raised a structural critique:

> "Historical data was collected in 1D world — chords didn't carry explicit
> dipole fields, so 8D routing relied on synthetic comfort field computed from
> oct-tags. That is not a fair comparison."

Reading `probes/voices-routing-falsifier-v0/run.ts` confirms the mechanism. The
8D channel's source-vector function:

```ts
function octToVector(tag: string): number[] {
  // Synthetic 8D: oct:N.X -> axis N = 1.0
  const m = tag.match(/oct:(\d)/);
  if (!m) return new Array(8).fill(0);
  const v = new Array(8).fill(0);
  v[parseInt(m[1], 10)] = 1.0;
  return v;
}
```

The 8D channel one-hot-encodes the **same** `chord.primary` and
`chord.secondary` oct tags that the 1D channel frequency-matches. Both channels
read the same input bytes.

If the two channels read the same signal through different aggregators, they
should produce highly correlated rankings. The 5.6pp delta observed is then
**within-the-same-channel variation**, not "8D loses to 1D as a routing signal."

This probe measures channel correlation empirically.

## Status

**RUNNABLE.** Reads existing
`probes/voices-routing-falsifier-v0/result.latest.json`, extracts per-sample ×
per-voice score vectors for both channels, computes:

- top-1 prediction agreement rate (1D top-1 == 8D top-1?)
- top-2 set agreement rate (top-2 sets overlap by ≥1?)
- Pearson correlation between 1D and 8D score vectors across all (sample, voice)
  pairs

Writes:

- `result.latest.json`
- `result.latest.md`

## Default Run

```bash
./probes/falsifier-v0-honesty-check-v0/run.sh
```

## Method

1. Load `probes/voices-routing-falsifier-v0/result.latest.json`.
2. For each labeled sample, the `oneD.predicted[]` and `eightD.predicted[]`
   arrays give the voice ranking under each channel.
3. Compute:
   - `top1_agreement_rate`: fraction of samples where
     `oneD.predicted[0] == eightD.predicted[0]`
   - `top2_set_overlap_rate`: fraction of samples where the top-2 sets share at
     least 1 element
   - For score-vector correlation: re-rank voices by ordinal position within
     each channel; compute Pearson on the position vectors across all samples ×
     voices.

## Verdict Gate

- `channels_independent`: top-1 agreement rate < 50% (lower than random for 4
  voices: 25%; "less than chance" would be suspicious; >50% means correlated).
- `channels_correlated_but_distinct`: top-1 agreement rate in [50%, 70%] —
  channels share some signal but diverge meaningfully.
- `channels_redundant`: top-1 agreement rate ≥ 70% — channels are reading the
  same signal through different aggregators, and falsifier v0's verdict reflects
  within-channel noise, not 1D-vs-8D as competing scheduling signals.

## Interpretation

If `channels_redundant`:

- Falsifier v0 did not measure what its name claims. It measured
  "frequency-match aggregation of oct tags vs one-hot-cosine aggregation of the
  same oct tags."
- The 8D-as-scheduler question remains **epistemically open**, not closed.
- A genuine 8D test would require input independent of oct tags: explicit
  voice-emitted `dipole:` field, or body-text-derived dipole signatures.

If `channels_correlated_but_distinct` or `channels_independent`:

- Falsifier v0's verdict (`keep_metadata`) stands.
- The 5.6pp delta is genuine signal, just under the 10pp adoption gate.

## Falsifiers of this probe

- If a re-run of `voices-routing-falsifier-v0` with explicit voice-emitted
  `dipole:` fields produces a delta meaningfully different from the oct-tag-only
  run, this probe's critique is operationally relevant.
- If the same re-run produces near-identical delta, then 8D-from-explicit-dipole
  also collapses to the same channel as 1D — the 8D space genuinely has no
  independent signal in this corpus.
- If channel correlation is high but a richer dipole-source still doesn't beat
  1D in a future test, this probe's critique is true but the practical
  conclusion (`keep_metadata`) is correct anyway.

## Acceptance

- `run.sh` exits 0.
- `result.latest.json` contains: `top1_agreement_rate`, `top2_set_overlap_rate`,
  `score_position_correlation`, `verdict`, `samples` array with per-sample
  agreement booleans.
- Verdict is one of `channels_independent`, `channels_correlated_but_distinct`,
  `channels_redundant`.
- Probe does not modify falsifier v0 outputs or `state/voices/`.

## Out of scope

- This probe does **not** propose to re-open 8D-as-scheduler. It only asks
  whether falsifier v0's verdict was structurally fair.
- A fair 8D test requires either (a) voices to start emitting explicit `dipole:`
  per chord, or (b) a separate body-text→dipole extraction probe whose output is
  independent of oct tags. Both are out of scope here.
