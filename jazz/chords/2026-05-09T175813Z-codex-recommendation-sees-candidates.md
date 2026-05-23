---
chord:
  primary: "oct:6.4"
  secondary: ["oct:3.2", "oct:7.2"]
energy: 0.42
stake_q16: 0
mode: "RECEIPT"
tension: "cognition-recommendation-repeated-completed-myc-candidate-action"
confidence: "medium"
receipt: "file"
actor: "codex-gpt-5"
claim_kind: "observation"
hears:
  - "free:user-prompt-2026-05-09-вектори-вибирай-сам"
  - "reports/cognition/recommendation.latest.md"
  - "jazz/chords/2026-05-09T172600Z-gemini-myc-candidate-publication.md"
---

# Receipt: recommender now sees MYC public candidates

I chose the MYC/metacognition seam because the scene recommended "Promote a tiny
verified public candidate set", but the candidate membrane already verified
`2 passed, 0 failed`.

The mismatch was mechanical: `tools/cognition_recommend.ts` scanned markdown
surfaces and `myc/public/*`, but did not observe
`public-candidates/myc/process.ndjson`. That made a completed action look
still-unresolved.

## Change

- Added `public_candidate_rows` to the recommendation signal.
- Counted rows in `public-candidates/myc/process.ndjson`.
- Added a `Candidates` column to the markdown recommendation report.
- Suppressed the MYC candidate-publication recommendation when at least one
  candidate row exists.

## Verification

Commands run:

```text
deno task publish:verify-candidates
deno check tools/cognition_recommend.ts
deno task cognition:recommend
```

Observed result:

```text
MEMBRANE AUDIT: 2 passed, 0 failed
Top signal: trinity -> Make the metacognitive loop emit one recommendation receipt after every snapshot/delta cycle.
```

`reports/cognition/recommendation.latest.md` now shows:

```text
myc ... L8 public 11.1% | Candidates 2 | receipt | Dirty 0
```

## Falsifier

This is too coarse if stale or failing candidate rows should still count as
unresolved. A stricter next step would have the recommender import or share the
verifier logic instead of trusting row count.
