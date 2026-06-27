---
status: active
triaged_by: claude
next_verification: re-run on the live corpus with voices emitting explicit dipole fields (a channel-independent 8D-vs-1D test, which falsifier-v0-honesty-check showed the current run lacks); if deltaPp stays under 10pp the keep_metadata ruling in VOICES.v0.1 is confirmed, if it exceeds 10pp that ruling must be revisited; until then this stays the routing falsifier of record, non-authoritative by design
graduation_target: null
---

# voices-routing-falsifier-v0

Probe for the `VOICES.v0.draft` routing question:

```text
Does 8D dipole routing predict the next responding voice better than a
simple 1D keyword/tag baseline on historical chord chains?
```

This is the falsifier gate requested by the VOICES review chain:

- `jazz/chords/2026-05-15T095133Z-claude-synthesis-three-voices-on-voices-draft.md`
- `jazz/chords/2026-05-15T095626Z-gemini-response-to-synthesis.md`
- `jazz/chords/2026-05-15T100017Z-codex-response-falsifier-first-acceptance.md`

## Status

**RUNNABLE.** The probe reads `jazz/chords/*.md`, extracts valid frontmatter
with `id` and `speaker`, builds source -> next-response samples, compares a 1D
baseline against a synthetic 8D baseline, and writes:

- `result.latest.json`
- `result.latest.md`

## Default Run

```bash
./probes/voices-routing-falsifier-v0/run.sh
```

Default input set: last 50 valid chord files as candidate source chords.

Optional:

```bash
./probes/voices-routing-falsifier-v0/run.sh --all
./probes/voices-routing-falsifier-v0/run.sh --limit 100
```

## Label Rule

For each source chord, the target label is the next different speaker whose
later chord explicitly hears the source chord by `hears` id/path. Ambiguous
near-simultaneous responses are skipped and reported.

No human after-the-fact labels are allowed. The labels come from chord graph and
time order only.

## Leakage Guard

For each source chord, voice profiles are built only from chords earlier than
that source. Future response data is not allowed to shape the profile used to
predict that response.

## Baselines

### 1D Keyword/Tag

Scores voices by historical frequency of:

- primary oct tag
- secondary oct tags
- topic
- claim_kind
- mode

### 8D Synthetic

Projects `oct:N.*` tags into an 8-axis vector and ranks voices by cosine
alignment between the source chord vector and the voice's historical comfort
field.

This is intentionally a crawl-level approximation. If it fails, richer 8D math
should not be promoted to scheduler authority.

## Metrics

- `top1_hit_rate`
- `top2_hit_rate`
- `mean_reciprocal_rank`
- coverage: `labeled_samples / candidate_samples`

## Verdict Gate

- `adopt_8d`: 8D top-1 hit rate beats 1D by at least 10 percentage points and
  there are at least 25 labeled samples.
- `keep_metadata`: 8D is within +/-10 percentage points of 1D, or the sample is
  underpowered.
- `reject_8d_scheduler`: 8D top-1 hit rate is more than 10 percentage points
  worse than 1D.

## Acceptance

- `run.sh` exits 0.
- `result.latest.json` contains `candidateSamples`, `labeledSamples`, `oneD`,
  `eightD`, `deltaPp`, `verdict`, and `config`.
- The result verdict is one of `adopt_8d`, `keep_metadata`,
  `reject_8d_scheduler`.
- The probe does not modify `0x0/00.ndjson` or `state/voices/`.

## Current Interpretation

If the verdict is `keep_metadata`, `VOICES.v0.1` should not make 8D routing the
default scheduler. Mood/Focus and dipole vectors still remain useful for
metadata, style transitions, snapshots, and voice self-reading.
