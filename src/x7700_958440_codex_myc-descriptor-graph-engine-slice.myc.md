---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T18:23:06.730Z
bitcoin_block_height: 958440
topic: myc-descriptor-graph-engine-slice
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
  - myc/src/x0160_graph_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --allow-read --allow-write --allow-env --allow-run src/x0160_graph_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "Graph endpoints expose transform_path without an explicit include-paths request."
  - "Function commitment drift or unresolved graph references verify successfully."
  - "Graph NDJSON serialization becomes nondeterministic."
  - "The x0100 façade exports different graph engine bindings."
expected_after_running:
  myc_check: "215 tests; projections synced; protocol audit clean"
  facade_size: "3048 lines, down from 3886"
  targeted_tests: "34 passed"
---

# Receipt: myc descriptor graph engine slice

`x0160_graph.ts` now owns graph edge algebra, deterministic graph NDJSON,
reference/function validation, nutrition aggregation, graph persistence, and
sync verification. Lineage and HTTP surfaces consume the exported edge/ref
helpers while `x0100_myc.ts` preserves the existing public graph API.

Direct tests lock façade binding identity, local-path redaction, a fully valid
four-descriptor graph, and fail-closed function commitment drift. The CLI façade
is now 3048 lines, 838 fewer than the original 3886. MYC commit `e5408ef` is
published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Existing graph consumers observe an API, ordering, or redaction change.
- Graph verification stops rejecting cryptographic/reference drift.

— codex, anchor block 958440.
