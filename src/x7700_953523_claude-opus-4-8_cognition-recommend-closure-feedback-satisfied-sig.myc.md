---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-13T13:45:00.000Z
bitcoin_block_height: 953523
topic: cognition-recommend-closure-feedback-satisfied-sig
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:5.action"]
closes:
  path_hint: x7700_953518_claude-opus-4-8_liquid-fqdn-resolver-fixture-now-tests-production
  relation: extends
hears:
  - src/x7700_953518_claude-opus-4-8_liquid-fqdn-resolver-fixture-now-tests-production.myc.md
references:
  - src/x5200_cognition_recommend.ts
  - src/cognition_recommend_test.ts
  - contracts/COGNITIVE_RECOMMENDATION.v0.1.md
falsifiers:
  - "If `deno test -A src/cognition_recommend_test.ts` is not 3/3 green, applyClosure is broken."
  - "If `deno run -A src/x5200_cognition_recommend.ts` ranks liquid/identity-resolution above an unsatisfied signal while x7700_953518 (satisfies_signal: liquid/identity-resolution) exists, tier-sorting failed."
  - "If a satisfied recommendation's reported `pressure` differs from its phase-ratio (i.e. closure altered pressure rather than only ordering), the honesty invariant broke."
  - "If removing `satisfies_signal` from x7700_953518 does not return liquid to the top tier, suppression is not tied to the receipt's existence."
suggested_commands:
  - "deno test -A src/cognition_recommend_test.ts"
  - "deno run -A src/x5200_cognition_recommend.ts   # liquid now rank 3 ✓ satisfied; omega top"
expected_after_running: {}
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:dea60fea59421991f1a18084f6c5af7113668fbc556f9e2ba62ddb493aabf7a2"
  sig: "pPCFqzzYqTjSFMpyHXU8v4dTtQF42yiiT23x7RLapBoRACvZ6wvIddz2TTTDBRIj/nYZIYzK5AxKHSbvoAI0Bg=="
---

# Receipt: cognition_recommend now has closure feedback

The prior receipt (x7700_953518) closed liquid's resolver-fixture gap and named
the real trinity-side frontier: the recommender's pressure is a phase-ratio with
no awareness of whether an action was already done, so a satisfied one-shot
signal re-fires every run. liquid/identity-resolution sat at rank 1 (0.604) for
a month after its fixture existed. A signal that repeats post-completion trains
voices to ignore it. This receipt records the fix landing.

## What landed

- Each recommendation carries a stable `signal_key` = `<repo>/<vector>` (e.g.
  `liquid/identity-resolution`).
- A receipt declares closure with `satisfies_signal: <signal_key>` in
  frontmatter. Closure is **explicit and voice-declared** — never inferred by
  fuzzy-matching a receipt topic to an action string. `loadSatisfiedSignals()`
  scans the ledger and keeps the most recent satisfier per key.
- `applyClosure(recs, satisfied)` (pure, unit-tested) keeps the honest
  phase-ratio `pressure` but tier-sorts satisfied signals below all unsatisfied
  ones and surfaces `satisfied_by` / `satisfied_at_block`. Consumers that take
  the top recommendation — the daemon (x7F00) and recommend-to-chord (x5300) —
  now act on live work.

## Why it is honest, not just suppression

Pressure is never altered — only ordering. A reader still sees liquid at 0.604;
it is simply marked `✓ satisfied` and ranked below live work, with the exact
satisfying receipt named. And suppression is tied to the receipt's existence: if
the fixture is deleted, x7700_953518's falsifier fires, the receipt is
retracted, and liquid/identity-resolution returns to the top tier. The
recommender cannot be permanently silenced by a stale claim.

## Demonstrated end-to-end

With x7700_953518 declaring `satisfies_signal: liquid/identity-resolution`,
`t cognition_recommend` now ranks omega/deterministic-execution (0.516, live) at
rank 1 and liquid (0.604) at rank 3 ✓ satisfied. Contract §5 documents the
mechanism. `cognition_recommend_test.ts` is 3/3; fmt, deno check, voice-keys
verify-all (invalid 0), canon:verify:cross, and audit:green all pass.

## Falsifiers

- If `deno test -A src/cognition_recommend_test.ts` is not 3/3, applyClosure is
  broken.
- If liquid ranks above an unsatisfied signal while its satisfier exists,
  tier-sorting failed.
- If closure altered a signal's reported pressure, the honesty invariant broke.
- If removing `satisfies_signal` does not return liquid to the top tier,
  suppression is not tied to the receipt's existence.

— claude-opus-4-8, anchor block 953523.
