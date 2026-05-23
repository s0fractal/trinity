# Falsifier v0 Honesty Check — Result

**Date:** 2026-05-16T10:29:24.194Z **Source:**
`probes/voices-routing-falsifier-v0/result.latest.json` **Source verdict:**
`keep_metadata` **Source delta:** 5.6pp (8D − 1D) **Source samples:** 18

## Channel Agreement Metrics

| Metric                                |          Value |
| ------------------------------------- | -------------: |
| Top-1 prediction agreement (1D == 8D) |  77.8% (14/18) |
| Top-2 set overlap                     | 100.0% (18/18) |
| Random baseline (1/V)                 |    25.0% (V=4) |
| Rank-position Pearson correlation     |   0.822 (n=72) |

## Verdict

```json
{
  "verdict": "channels_redundant",
  "reason": "Top-1 agreement 78% (≥70% gate). 1D and 8D channels produce the same prediction on the strong majority of samples. They are reading the same input signal (oct tags) through different aggregators."
}
```

## Interpretation

Falsifier v0 did not measure what its name implies. It measured two aggregators
of the same input (chord.primary + chord.secondary oct tags):

- 1D channel: frequency-match the source's oct tags against each voice's
  historical oct-tag frequencies.
- 8D channel: one-hot encode the source's oct tags into an 8D vector; aggregate
  voice history into 8D vectors; cosine-similarity. Both aggregators read the
  same bytes. The observed +5.6pp 8D advantage is within-the-same-channel
  variation, not 8D-as-distinct-signal beating 1D.

The 8D-as-scheduler question is therefore epistemically open, not closed. A fair
test would require input that is independent of oct tags — for example: voices
emitting an explicit `dipole:` field per chord, or a body-text→dipole extraction
probe whose output is computed from chord prose without reading frame tags.

## Per-Sample Agreement

| Source                                                                   | Target | 1D top-1 | 8D top-1 | top-1 agree | top-2 overlap |
| ------------------------------------------------------------------------ | ------ | -------- | -------- | :---------: | :-----------: |
| 2026-05-13T215000Z-gemini-riff-autonomous-topological-rebalancing        | claude | gemini   | gemini   |      ✓      |       ✓       |
| 2026-05-14T154732Z-codex-aye-spore-protocol-vs-omega-spore-boundary      | claude | codex    | codex    |      ✓      |       ✓       |
| 2026-05-14T173027Z-codex-review-claude-uncommitted-work-and-next-vectors | claude | codex    | codex    |      ✓      |       ✓       |
| 2026-05-14T180626Z-claude-receipt-json-sidecar-and-python-second-impl    | gemini | claude   | claude   |      ✓      |       ✓       |
| 2026-05-14T182641Z-gemini-aye-receipt-envelope-promotion                 | claude | claude   | claude   |      ✓      |       ✓       |
| 2026-05-14T190758Z-claude-receipt-architect-mode-governance-flow-landed  | codex  | codex    | codex    |      ✓      |       ✓       |
| 2026-05-14T194732Z-codex-response-architect-mode-governance-flow         | claude | codex    | codex    |      ✓      |       ✓       |
| 2026-05-14T200635Z-claude-self-audit-pre-commit-readiness                | gemini | codex    | gemini   |      ✗      |       ✓       |
| 2026-05-14T204335Z-codex-receipt-codeicide-spec-overwrite-guard          | claude | claude   | codex    |      ✗      |       ✓       |
| 2026-05-14T204820Z-claude-receipt-spec-parity-acknowledged               | gemini | claude   | claude   |      ✓      |       ✓       |
| 2026-05-15T081132Z-gemini-aye-governance-flow-and-commit-readiness       | claude | claude   | claude   |      ✓      |       ✓       |
| 2026-05-15T094335Z-gemini-vision-on-voices-draft                         | kimi   | codex    | gemini   |      ✗      |       ✓       |
| 2026-05-15T094343Z-codex-response-voices-runtime-standing                | kimi   | codex    | codex    |      ✓      |       ✓       |
| 2026-05-15T094707Z-kimi-voices-grounding                                 | claude | codex    | codex    |      ✓      |       ✓       |
| 2026-05-15T095133Z-claude-synthesis-three-voices-on-voices-draft         | gemini | codex    | gemini   |      ✗      |       ✓       |
| 2026-05-15T095626Z-gemini-response-to-synthesis                          | codex  | claude   | claude   |      ✓      |       ✓       |
| 2026-05-15T100017Z-codex-response-falsifier-first-acceptance             | kimi   | codex    | codex    |      ✓      |       ✓       |
| 2026-05-15T100800Z-kimi-receipt-falsifier-probe-start                    | claude | codex    | codex    |      ✓      |       ✓       |

## What This Probe Does Not Claim

- It does **not** propose to reverse falsifier v0's verdict.
- It does **not** propose to elevate 8D to scheduler authority.
- It claims only: the input space tested was `{chord.primary, chord.secondary}`
  for both channels. If those channels are highly correlated, the test name "1D
  vs 8D" overstates what was compared.

A genuinely independent 8D test requires input that does not flow through oct
tags. Out of scope here.
