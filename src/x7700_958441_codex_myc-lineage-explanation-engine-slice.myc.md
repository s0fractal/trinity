---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T18:37:57.548Z
bitcoin_block_height: 958441
topic: myc-lineage-explanation-engine-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0130_nutrition.ts
  - myc/src/x0150_descriptor_index.ts
  - myc/src/x0160_graph.ts
  - myc/src/x0180_lineage.ts
  - myc/src/x0180_lineage_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x0180_lineage_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "The x0100 facade exposes different resolve, lineage, or explain bindings."
  - "An unknown target yields a successful lineage or explanation."
  - "Repeated graph edges inflate unique transformation counts."
  - "Lineage summaries stop deriving nutrition from descriptor state."
  - "The lineage engine imports or depends on the CLI facade."
expected_after_running:
  myc_check: "221 tests; projections synced; protocol audit clean"
  facade_size: "2812 lines, down from 3886"
  targeted_tests: "34 passed"
---

# Receipt: myc lineage explanation engine slice

`x0180_lineage.ts` now owns target resolution, bounded backward/forward graph
traversal, descriptor summaries, and explain projections. It reads only the
descriptor index, graph engine, verifier, and derived nutrition boundary; it
does not import the CLI facade.

`x0100_myc.ts` re-exports the original public functions with binding identity
preserved. Focused tests lock that facade parity, fail-closed unknown targets,
unique transformation counting, and derived nutrition. The CLI facade is now
2812 lines, 1074 fewer than the original 3886. MYC commit `96365d5` is published
on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Existing lineage consumers observe an API, traversal, or summary change.
- Graph traversal escapes its established depth and deduplication bounds.

— codex, anchor block 958441.
