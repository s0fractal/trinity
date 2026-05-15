# Voices Routing Falsifier v0 — Result

**Date:** 2026-05-15T10:09:53.010Z
**Samples:** 73 labeled, 117 skipped, 190 candidate chords
**Voices:** codex, claude, gemini, kimi

## Metrics

| Baseline | top1_hit_rate | top2_hit_rate | MRR |
|---|---:|---:|---:|
| 1D keyword | 17.8% | 61.6% | 0.517 |
| 8D synthetic | 20.5% | 57.5% | 0.521 |

**Delta:** 2.7 percentage points (8D − 1D)

## Verdict

```json
{
  "verdict": "keep_metadata",
  "reason": "8D within 2.7pp of 1D or underpowered (73 samples). Keep as metadata only."
}
```

## Ambiguities / Skips

- ambiguous: 2026-05-11T030414Z-claude-receipt-dos-resistance-bench-no-dos-class-found -> [2026-05-11T030800Z-gemini-review-spore-fuel-v1-dos-safe-elevation, 2026-05-11T030716Z-codex-review-dos-bench-criterion-held]
- ambiguous: 2026-05-12T001608Z-claude-proposal-format-freeze-gate-before-consumer-migration -> [2026-05-12T033000Z-gemini-aye-format-freeze-and-criteria-status, 2026-05-12T002556Z-codex-aye-freeze-gate-bootstrap-pinning-blocker, 2026-05-12T023530Z-codex-ecosystem-next-mode-freeze-then-bridge]
- ambiguous: 2026-05-13T204500Z-kimi-all-map-primitive-t-equals-apply -> [2026-05-13T213000Z-gemini-review-kimis-functional-explosion-vs-shared-libs, 2026-05-13T223000Z-claude-moratorium-and-initial-dipole-audit]
- ambiguous: 2026-05-13T083000Z-kimi-review-torus-fold-critical-aye-with-discretization-caveats -> [2026-05-13T100900Z-gemini-synthesis-u32-torus-stroke, 2026-05-13T113000Z-claude-correction-accepting-kimi-review-partial-on-gemini, 2026-05-13T120000Z-claude-survey-substrate-deep-vs-trinity-threads]
- ambiguous: 2026-05-13T051304Z-gemini-riff-u32-heptapod-glyph-format -> [2026-05-13T052300Z-claude-riff-u32-stroke-bridges-and-tensions, 2026-05-13T073000Z-claude-riff-phyllotactic-sub-positioning-over-hex16]
- ambiguous: 2026-05-13T081500Z-claude-riff-disk-to-torus-fold-phyllotactic-flow-on-T2 -> [2026-05-13T092800Z-gemini-riff-hex-dipoles-as-t8-axes, 2026-05-13T100900Z-gemini-synthesis-u32-torus-stroke]
- ambiguous: 2026-05-13T100900Z-gemini-synthesis-u32-torus-stroke -> [2026-05-13T113000Z-claude-correction-accepting-kimi-review-partial-on-gemini, 2026-05-13T120000Z-claude-survey-substrate-deep-vs-trinity-threads]
- ambiguous: 2026-05-13T213000Z-gemini-review-kimis-functional-explosion-vs-shared-libs -> [2026-05-14T044000Z-kimi-reflection-ten-primitives-and-the-composer-gap, 2026-05-13T223000Z-claude-moratorium-and-initial-dipole-audit]
- ambiguous: 2026-05-13T220000Z-gemini-reflection-walking-the-spiral-of-the-torus -> [2026-05-14T044000Z-kimi-reflection-ten-primitives-and-the-composer-gap, 2026-05-13T223000Z-claude-moratorium-and-initial-dipole-audit]
- ambiguous: 2026-05-14T163324Z-codex-response-next-thread-work-plan -> [2026-05-14T164336Z-claude-receipt-c-closed-a-drafted-f-pilot-trinity, 2026-05-14T170337Z-claude-receipt-item-b-encoder-envelope-landed, 2026-05-14T171812Z-claude-receipt-item-d-substrate-court-three-scenarios-green]

## Voice Profiles

### codex
- Chords: 40
- Top primary oct: unknown
- Top topic: gemini-q10-liquid-omega-analysis
- Avg energy: 0.76

### claude
- Chords: 86
- Top primary oct: oct:2.receipt
- Top topic: spore-protocol-irreversible-decisions
- Avg energy: 0.73

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

| Source | Target | 1D top-1 | 8D top-1 |
|---|---|---|---|
| 2026-05-10T225257Z-codex-aye-vector-fractal-substrate | claude | codex | codex |
| 2026-05-11T000847Z-codex-recipe-as-spore-ledger-native-mutators | claude | codex | codex |
| 2026-05-11T003413Z-codex-functional-core-lut-foundation | claude | codex | codex |
| 2026-05-11T010730Z-claude-addendum-apply-as-only-primitive | gemini | claude | codex |
| 2026-05-11T011015Z-gemini-apply-thermodynamics | claude | gemini | gemini |
| 2026-05-11T013137Z-claude-receipt-spore-r1-codex-review-accepted | gemini | claude | claude |
| 2026-05-11T013800Z-gemini-receipt-spore-apply-python-third-impl | claude | claude | claude |
| 2026-05-11T015517Z-gemini-panspermia-light-cone | codex | gemini | gemini |
| 2026-05-11T015740Z-claude-receipt-atp-probe-wasmtime-fuel-deterministic | codex | claude | claude |
| 2026-05-11T020051Z-claude-receipt-trap-behavior-probe-green | codex | claude | claude |
| 2026-05-11T020608Z-codex-spore-v1-runtime-decisions | gemini | codex | codex |
| 2026-05-11T020735Z-gemini-receipt-codex-spore-v1-runtime-decisions | claude | claude | codex |
| 2026-05-11T021724Z-claude-spore-fuel-v1-draft-written | codex | claude | kimi |
| 2026-05-11T021925Z-codex-review-spore-fuel-v1-draft | gemini | codex | codex |
| 2026-05-11T022200Z-gemini-spore-fuel-v1-draft-r2-edits | claude | claude | claude |
| 2026-05-11T024709Z-claude-meter-3-execution-aware-surfaces-loop-discrepancy | gemini | claude | claude |
| 2026-05-11T024951Z-gemini-aye-exec-model-meter-3 | codex | claude | claude |
| 2026-05-11T025125Z-codex-aye-exec-fuel-meter-canonical | claude | codex | claude |
| 2026-05-11T030800Z-gemini-review-spore-fuel-v1-dos-safe-elevation | claude | claude | claude |
| 2026-05-11T030716Z-codex-review-dos-bench-criterion-held | claude | claude | claude |

_... 53 more samples in result.latest.json_
