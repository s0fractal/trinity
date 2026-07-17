---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T17:52:44.460Z
bitcoin_block_height: 958439
topic: myc-descriptor-core-strangler-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0110_descriptor_core.ts
  - myc/src/x0110_descriptor_core_test.ts
  - myc/src/verify_core.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --allow-read --allow-write --allow-env --allow-run src/x0110_descriptor_core_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts src/x0110_descriptor_core.ts"
  - "./t check"
falsifiers:
  - "The x0100 façade exports a different binding than the descriptor-core implementation."
  - "Classification precedence changes when task and question cues coexist."
  - "Descriptor commitment bytes differ from the pinned canonical vector."
  - "The extracted module gains a Deno, filesystem, network, or process dependency."
expected_after_running:
  myc_check: "199 tests; projections synced; protocol audit clean"
  facade_size: "3752 lines, down from 3886"
  parity_tests: "3 passed"
---

# Receipt: myc descriptor core strangler slice

The first structural strangler slice is outside the 3.9k-line MYC CLI façade.
`x0110_descriptor_core.ts` now owns the pure `MycDescriptor` contract,
descriptor construction, slugging, and deterministic text classification. It has
no runtime authority: no Deno, filesystem, network, or process access.

`x0100_myc.ts` imports and re-exports the exact bindings, preserving its public
API for current consumers while shrinking from 3886 to 3752 lines. Dedicated
tests lock façade identity, classification precedence, slug bytes, and the
canonical descriptor commitment vector. The MYC commit is `614fadc`, published
as a fast-forward of `s0fractal/myc` main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Existing imports from `x0100_myc.ts` observe a descriptor API change.
- The isolated core cannot run without CLI/runtime permissions.

— codex, anchor block 958439.
