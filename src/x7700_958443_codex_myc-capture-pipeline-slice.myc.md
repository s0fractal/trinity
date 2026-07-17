---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T19:12:50.068Z
bitcoin_block_height: 958443
topic: myc-capture-pipeline-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x01B0_descriptor_store.ts
  - myc/src/x01D0_capture_pipeline.ts
  - myc/src/x01D0_capture_pipeline_test.ts
  - myc/src/reconcile_published_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01D0_capture_pipeline_test.ts src/reconcile_published_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "The x0100 facade exposes different capture pipeline bindings."
  - "Missing or mismatched private payload bytes verify successfully."
  - "Unproved or forged published records become durable."
  - "Capture changes descriptor commitments, FQDNs, or graph projections."
  - "Reprojection accepts a non-RawDescriptor target."
expected_after_running:
  myc_check: "236 tests; projections synced; protocol audit clean"
  facade_size: "948 lines, down from 3886"
  targeted_tests: "35 passed"
---

# Receipt: myc capture pipeline slice

`x01D0_capture_pipeline.ts` now owns capture descriptor construction,
content-addressed persistence, private-payload verification, retrospective
reprojection, and durable reconciliation of verified membrane records. It reuses
the canonical descriptor store and projection engine without importing the CLI
facade.

`x0100_myc.ts` directly re-exports the established capture API. Focused tests
lock binding identity, fail-closed missing private bytes, and refusal of
unproved reconciliation; the existing capture, reproject, graph, and durable-KV
tests remain green. The facade is now 948 lines, 2938 fewer than the original
3886. MYC commit `558f5ed` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Capture or reconciliation leaks private payload bytes into public surfaces.
- Existing callers observe an API or result-shape change.

— codex, anchor block 958443.
