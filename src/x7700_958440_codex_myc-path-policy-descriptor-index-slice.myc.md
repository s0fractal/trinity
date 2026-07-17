---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T18:15:31.621Z
bitcoin_block_height: 958440
topic: myc-path-policy-descriptor-index-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0140_paths.ts
  - myc/src/x0140_paths_test.ts
  - myc/src/x0150_descriptor_index.ts
  - myc/src/x0150_descriptor_index_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --allow-read --allow-write --allow-env --allow-run src/x0140_paths_test.ts src/x0150_descriptor_index_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "The x0100 façade exposes different path/index bindings."
  - "Canonical, immutable, or output FQDN aliases stop resolving."
  - "Schema fixtures or empty-content fossils enter the descriptor index."
  - "A missing optional scan surface crashes discovery."
expected_after_running:
  myc_check: "212 tests; projections synced; protocol audit clean"
  facade_size: "3367 lines, down from 3886"
  targeted_tests: "37 passed"
---

# Receipt: myc path policy descriptor index slice

MYC checkout policy and read-only discovery no longer live inside the CLI
monolith. `x0140_paths.ts` owns portable path joining and default-root policy;
`x0150_descriptor_index.ts` owns descriptor file parsing, verification wrappers,
surface scanning, canonical/immutable/output addressing, node keys, and FQDN
resolution.

The `x0100_myc.ts` façade re-exports the same public bindings and consumes the
same internal address helpers for graph/index projections. Tests lock binding
identity, explicit `MYC_ROOT`, portable joins, alias resolution, schema
exclusion, and empty-content hygiene. The façade is 3367 lines, 519 fewer than
the original 3886. MYC commit `63629bd` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Existing x0100 scanner/resolver consumers observe an API/result change.
- Discovery widens beyond the established six read-only surfaces.

— codex, anchor block 958440.
