---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T18:30:24.846Z
bitcoin_block_height: 958441
topic: myc-deterministic-projection-engine-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0150_descriptor_index.ts
  - myc/src/x0160_graph.ts
  - myc/src/x0170_projections.ts
  - myc/src/x0170_projections_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --allow-read --allow-write --allow-env --allow-run src/x0170_projections_test.ts src/x0100_myc_test.ts src/proposal_visibility_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "Index verification becomes sensitive to valid NDJSON row ordering."
  - "Canonical, immutable, or output aliases disappear from rebuilt indexes."
  - "Missing or stale index content verifies successfully."
  - "The x0100 facade exports different projection engine bindings."
  - "Index rebuild callers reintroduce redundant graph writes."
expected_after_running:
  myc_check: "218 tests; projections synced; protocol audit clean"
  facade_size: "2963 lines, down from 3886"
  targeted_tests: "35 passed"
---

# Receipt: myc deterministic projection engine slice

`x0170_projections.ts` now owns deterministic index NDJSON serialization,
index/graph rebuild orchestration, and projection verification. It delegates
graph semantics to `x0160_graph.ts` and descriptor discovery to
`x0150_descriptor_index.ts`, keeping the boundary narrow and independently
testable while `x0100_myc.ts` preserves the existing public API.

Tests lock facade binding identity, relative and alias-complete index output,
order-insensitive verification, and rejection of stale content. Four redundant
graph rebuilds after index rebuilds were removed. The CLI facade is now 2963
lines, 923 fewer than the original 3886. MYC commit `b78ca7e` is published on
main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Existing projection consumers observe an API, content, or path-policy change.
- Verification accepts missing aliases or stale descriptor commitments.

— codex, anchor block 958441.
