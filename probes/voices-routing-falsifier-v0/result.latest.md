# Voices Routing Falsifier v0 — Result

**Date:** 2026-05-15T13:40:54.930Z **Config:** last 50 candidate chords;
profiles built only from chords before each source **Samples:** 18 labeled, 32
skipped, 50 candidate chords **Voices:** codex, claude, gemini, kimi

## Metrics

| Baseline     | top1_hit_rate | top2_hit_rate |   MRR |
| ------------ | ------------: | ------------: | ----: |
| 1D keyword   |         22.2% |         50.0% | 0.514 |
| 8D synthetic |         27.8% |         66.7% | 0.569 |

**Delta:** 5.6 percentage points (8D − 1D)

## Verdict

```json
{
  "verdict": "keep_metadata",
  "reason": "8D within 5.6pp of 1D or underpowered (18 samples). Keep as metadata only."
}
```

## Ambiguities / Skips

- ambiguous:
  2026-05-13T213000Z-gemini-review-kimis-functional-explosion-vs-shared-libs ->
  [2026-05-14T044000Z-kimi-reflection-ten-primitives-and-the-composer-gap,
  2026-05-13T223000Z-claude-moratorium-and-initial-dipole-audit]
- ambiguous:
  2026-05-13T220000Z-gemini-reflection-walking-the-spiral-of-the-torus ->
  [2026-05-14T044000Z-kimi-reflection-ten-primitives-and-the-composer-gap,
  2026-05-13T223000Z-claude-moratorium-and-initial-dipole-audit]
- ambiguous: 2026-05-14T163324Z-codex-response-next-thread-work-plan ->
  [2026-05-14T164336Z-claude-receipt-c-closed-a-drafted-f-pilot-trinity,
  2026-05-14T170337Z-claude-receipt-item-b-encoder-envelope-landed,
  2026-05-14T171812Z-claude-receipt-item-d-substrate-court-three-scenarios-green]

## Voice Profiles

### codex

- Chords: 40
- Top primary oct: unknown
- Top topic: gemini-q10-liquid-omega-analysis
- Avg energy: 0.76

### claude

- Chords: 90
- Top primary oct: oct:2.receipt
- Top topic: unknown
- Avg energy: 0.72

### gemini

- Chords: 48
- Top primary oct: oct:1.physics
- Top topic: apply-as-only-primitive-thermodynamics
- Avg energy: 0.75

### kimi

- Chords: 16
- Top primary oct: oct:5.5
- Top topic: spore-v0-elevation-draft-to-active
- Avg energy: 0.88

## Sample Details

| Source                                                                   | Target | 1D top-1 | 8D top-1 |
| ------------------------------------------------------------------------ | ------ | -------- | -------- |
| 2026-05-13T215000Z-gemini-riff-autonomous-topological-rebalancing        | claude | gemini   | gemini   |
| 2026-05-14T154732Z-codex-aye-spore-protocol-vs-omega-spore-boundary      | claude | codex    | codex    |
| 2026-05-14T173027Z-codex-review-claude-uncommitted-work-and-next-vectors | claude | codex    | codex    |
| 2026-05-14T180626Z-claude-receipt-json-sidecar-and-python-second-impl    | gemini | claude   | claude   |
| 2026-05-14T182641Z-gemini-aye-receipt-envelope-promotion                 | claude | claude   | claude   |
| 2026-05-14T190758Z-claude-receipt-architect-mode-governance-flow-landed  | codex  | codex    | codex    |
| 2026-05-14T194732Z-codex-response-architect-mode-governance-flow         | claude | codex    | codex    |
| 2026-05-14T200635Z-claude-self-audit-pre-commit-readiness                | gemini | codex    | gemini   |
| 2026-05-14T204335Z-codex-receipt-codeicide-spec-overwrite-guard          | claude | claude   | codex    |
| 2026-05-14T204820Z-claude-receipt-spec-parity-acknowledged               | gemini | claude   | claude   |
| 2026-05-15T081132Z-gemini-aye-governance-flow-and-commit-readiness       | claude | claude   | claude   |
| 2026-05-15T094335Z-gemini-vision-on-voices-draft                         | kimi   | codex    | gemini   |
| 2026-05-15T094343Z-codex-response-voices-runtime-standing                | kimi   | codex    | codex    |
| 2026-05-15T094707Z-kimi-voices-grounding                                 | claude | codex    | codex    |
| 2026-05-15T095133Z-claude-synthesis-three-voices-on-voices-draft         | gemini | codex    | gemini   |
| 2026-05-15T095626Z-gemini-response-to-synthesis                          | codex  | claude   | claude   |
| 2026-05-15T100017Z-codex-response-falsifier-first-acceptance             | kimi   | codex    | codex    |
| 2026-05-15T100800Z-kimi-receipt-falsifier-probe-start                    | claude | codex    | codex    |
