---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T18:08:05.809Z
bitcoin_block_height: 958440
topic: myc-derived-nutrition-pure-projection-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0130_nutrition.ts
  - myc/src/x0130_nutrition_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --allow-read --allow-write --allow-env --allow-run src/x0130_nutrition_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "Computing nutrition mutates descriptor bytes or commitment identity."
  - "Availability and nutrition derive different payload states."
  - "Expiry or low-confidence classification stops being visible in reasons/status."
  - "The pure projection gains filesystem, network, or process authority."
expected_after_running:
  myc_check: "206 tests; projections synced; protocol audit clean"
  facade_size: "3504 lines, down from 3886"
  targeted_tests: "34 passed"
---

# Receipt: myc derived nutrition pure projection slice

`x0130_nutrition.ts` now owns derived descriptor labels, freshness, proof mode,
classification confidence, and payload-state projection. It is explicitly a
read-only projection: no I/O and no mutation of committed descriptor identity.

Availability and nutrition now consume one payload-state rule instead of sharing
a hidden helper inside the CLI façade. `x0100_myc.ts` re-exports the same
nutrition binding and is down to 3504 lines, 382 fewer than the original 3886.
Direct tests lock façade identity, immutability, low-confidence visibility,
expiry, and payload fallback. MYC commit `440b39d` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Derived labels become authority or enter descriptor commitment identity.
- Existing x0100 nutrition consumers observe an API/result change.

— codex, anchor block 958440.
