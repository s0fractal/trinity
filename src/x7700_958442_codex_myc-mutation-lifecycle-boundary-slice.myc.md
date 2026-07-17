---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T19:08:07.290Z
bitcoin_block_height: 958442
topic: myc-mutation-lifecycle-boundary-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x01B0_descriptor_store.ts
  - myc/src/x01C0_mutation_lifecycle.ts
  - myc/src/x01C0_mutation_lifecycle_test.ts
  - myc/src/consensus_loop_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01C0_mutation_lifecycle_test.ts src/consensus_loop_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "The x0100 facade exposes different lifecycle bindings."
  - "A forged import commitment writes a descriptor."
  - "Witness accepts a target other than a structurally valid PublishDescriptor."
  - "Review accepts an invalid rating or unsupported target type."
  - "Descriptor persistence changes fqdn or commitment identity."
expected_after_running:
  myc_check: "233 tests; projections synced; protocol audit clean"
  facade_size: "1648 lines, down from 3886"
  targeted_tests: "37 passed"
---

# Receipt: myc mutation lifecycle boundary slice

`x01B0_descriptor_store.ts` now owns the canonical generated-descriptor markdown
persistence format. `x01C0_mutation_lifecycle.ts` owns the explicit write
boundary for publish, graph import, witness, and review operations while reusing
the descriptor index, projection verifier, and lineage engines.

The `x0100_myc.ts` facade directly re-exports all four lifecycle bindings.
Focused tests lock binding identity, descriptor roundtrip identity, fail-closed
entrypoints, and forged-import rejection; the existing end-to-end consensus loop
remains green. The CLI facade is 1648 lines, 2238 fewer than the original 3886.
MYC commit `4b03854` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Publish exports reintroduce private payload or local path leakage.
- Mutation writes bypass commitment or projection verification.

— codex, anchor block 958442.
