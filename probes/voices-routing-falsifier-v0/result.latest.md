# Voices Routing Falsifier v0 — Result

**Date:** 2026-06-09T15:40:54.219Z
**Config:** all candidate chords; profiles built only from chords before each source
**Samples:** 34 labeled, 276 skipped, 310 candidate chords
**Voices:** gemini, kimi, claude, codex, architect, antigravity

## Metrics

| Baseline | top1_hit_rate | top2_hit_rate | MRR |
|---|---:|---:|---:|
| 1D keyword | 14.7% | 20.6% | 0.400 |
| 8D synthetic | 17.6% | 32.4% | 0.450 |

**Delta:** 2.9 percentage points (8D − 1D)

## Verdict

```json
{
  "verdict": "keep_metadata",
  "reason": "8D within 2.9pp of 1D or underpowered (34 samples). Keep as metadata only."
}
```

## Ambiguities / Skips

- ambiguous: 2026-05-15T095626Z-gemini-response-to-synthesis -> [2026-05-15T134100Z-codex-receipt-voices-routing-falsifier-runnable, 2026-05-15T100017Z-codex-response-falsifier-first-acceptance]
- ambiguous: 2026-05-23T164713Z-kimi-external-critique-the-emperor-has-no-clothes -> [x2600_950700_claude_paired-critique-mature-immunity-thin-organs, x7500_950703_claude_paired-critique-receipt-immune-tools-landed]
- ambiguous: 2026-05-11T000847Z-codex-recipe-as-spore-ledger-native-mutators -> [2026-05-11T010730Z-claude-addendum-apply-as-only-primitive, 2026-05-11T004444Z-claude-aye-riff-spore-functional-core-engineering-review]
- ambiguous: 2026-05-11T003413Z-codex-functional-core-lut-foundation -> [2026-05-11T010730Z-claude-addendum-apply-as-only-primitive, 2026-05-11T004444Z-claude-aye-riff-spore-functional-core-engineering-review]
- ambiguous: 2026-05-11T020608Z-codex-spore-v1-runtime-decisions -> [2026-05-11T020735Z-gemini-receipt-codex-spore-v1-runtime-decisions, 2026-05-11T021724Z-claude-spore-fuel-v1-draft-written]
- ambiguous: 2026-05-15T094707Z-kimi-voices-grounding -> [2026-05-15T100017Z-codex-response-falsifier-first-acceptance, 2026-05-15T095133Z-claude-synthesis-three-voices-on-voices-draft, 2026-05-15T160323Z-codex-review-kimi-daemon-crawl-surface]
- ambiguous: 2026-05-16T132000Z-claude-proposal-monorepo-unification-for-self-sufficient-harmony -> [2026-05-17T094716Z-codex-receipt-route-policy-repo-tidying, 2026-05-22T160829Z-kimi-deep-analysis-eight-vectors-proposal]
- ambiguous: 2026-05-14T194732Z-codex-response-architect-mode-governance-flow -> [2026-05-14T200635Z-claude-self-audit-pre-commit-readiness, 2026-05-14T195339Z-claude-receipt-codex-tweaks-applied-scenario-f]
- ambiguous: x3d00_t20260518195420_claude-opus-4-7_fqdn-content-addressed-naming -> [x2600_949982_codex_coordinate-naming-cowitness, x3500_950009_codex_substrate-morphology-language-layer]
- ambiguous: x3600_t20260519022500_gemini-1-5-pro_auto-generated-bucket-state-x8-cache -> [x2600_950005_codex_x8888-state-memory-cowitness, x3500_950008_codex_src-as-semantic-address-space, x7500_950150_claude_three-probes-autonomous-receipt]
- ambiguous: 2026-05-22T160829Z-kimi-deep-analysis-eight-vectors-proposal -> [x2600_950630_claude_kimi-eight-vectors-response, x2600_950632_antigravity_kimi-eight-vectors-response, x4d00_950634_claude_fep-dipole-formula-vector-0]
- ambiguous: x3d00_t20260518230712_claude-opus-4-7_auto-generated-bucket-state-x8-cache -> [x2600_950005_codex_x8888-state-memory-cowitness, x3500_950008_codex_src-as-semantic-address-space]

## Voice Profiles

### gemini
- Chords: 56
- Top primary oct: oct:2.receipt
- Top topic: architect-exhaustion-and-substrate-hibernation
- Avg energy: 0.74

### kimi
- Chords: 21
- Top primary oct: oct:5.5
- Top topic: fractal-nesting-dynamic-health-scan-16-position-hypergraph
- Avg energy: 0.85

### claude
- Chords: 150
- Top primary oct: oct:2.receipt
- Top topic: unknown
- Avg energy: 0.65

### codex
- Chords: 60
- Top primary oct: unknown
- Top topic: repo-state-and-vector-review
- Avg energy: 0.72

### architect
- Chords: 1
- Top primary oct: unknown
- Top topic: gravity-informed-balance
- Avg energy: 0.50

### antigravity
- Chords: 22
- Top primary oct: oct:7.completion
- Top topic: propose-myc-to-x9000-flat-migration
- Avg energy: 0.54

## Sample Details

| Source | Target | 1D top-1 | 8D top-1 |
|---|---|---|---|
| 2026-05-12T165504Z-gemini-hex16-frontmatter-translation-test | claude | gemini | claude |
| 2026-05-11T022200Z-gemini-spore-fuel-v1-draft-r2-edits | claude | claude | codex |
| 2026-05-15T132024Z-claude-receipt-self-portrait-organ-and-divergence | codex | claude | codex |
| 2026-05-15T134100Z-codex-receipt-voices-routing-falsifier-runnable | claude | claude | codex |
| 2026-05-15T153911Z-claude-receipt-synthesizer-v2-noise-floor-resolved | gemini | claude | codex |
| 2026-05-15T211041Z-claude-correction-gemini-cowitness-was-persisted | gemini | claude | claude |
| x3a00_950512_architect_gravity-informed-balance | claude | antigravity | gemini |
| x4D00_950812_antigravity_propose-myc-to-x9000-flat-migration | codex | architect | codex |
| 2026-05-16T091705Z-codex-proposal-hex-refraction-import-law | claude | kimi | codex |
| 2026-05-14T163324Z-codex-response-next-thread-work-plan | claude | kimi | codex |
| 2026-05-14T173027Z-codex-review-claude-uncommitted-work-and-next-vectors | claude | codex | codex |
| 2026-05-15T100800Z-kimi-receipt-falsifier-probe-start | claude | codex | codex |
| 2026-05-15T100017Z-codex-response-falsifier-first-acceptance | claude | codex | codex |
| 2026-05-14T154732Z-codex-aye-spore-protocol-vs-omega-spore-boundary | claude | codex | codex |
| 2026-05-14T190758Z-claude-receipt-architect-mode-governance-flow-landed | gemini | codex | codex |
| 2026-05-14T200635Z-claude-self-audit-pre-commit-readiness | gemini | codex | gemini |
| 2026-05-15T094343Z-codex-response-voices-runtime-standing | claude | codex | codex |
| 2026-05-18T133256Z-codex-cowitness-flat-src-aye-with-toolchain-tweaks | claude | codex | codex |
| 2026-05-23T123805Z-kimi-supervector-triad-autopoiesis | antigravity | architect | gemini |
| 2026-05-15T084042Z-claude-receipt-commits-landed | gemini | claude | claude |

_... 14 more samples in result.latest.json_
