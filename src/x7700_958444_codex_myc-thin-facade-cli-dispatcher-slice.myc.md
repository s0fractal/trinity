---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T19:16:30.052Z
bitcoin_block_height: 958444
topic: myc-thin-facade-cli-dispatcher-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0190_http.ts
  - myc/src/x01D0_capture_pipeline.ts
  - myc/src/x01E0_cli.ts
  - myc/src/x01E0_cli_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01E0_cli_test.ts src/capture_human_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "The x0100 facade exposes different CLI or renderer bindings."
  - "The CLI dispatcher imports the compatibility facade."
  - "Command routing changes effect, network, or output behavior."
  - "The executable bootstrap bypasses the exported main function."
expected_after_running:
  myc_check: "239 tests; projections synced; protocol audit clean"
  facade_size: "105 lines, down from 3886"
  targeted_tests: "35 passed"
---

# Receipt: myc thin facade cli dispatcher slice

`x01E0_cli.ts` now owns argument parsing, subprocess routing, human rendering,
help text, and command dispatch. It composes the dedicated descriptor, graph,
projection, HTTP, policy, lifecycle, and capture modules directly and never
imports the compatibility facade.

`x0100_myc.ts` is now a thin stable facade: canonical re-exports, five-service
HTTP wiring, and the executable `main` bootstrap. Focused tests lock CLI binding
identity, facade independence, and compact non-JSON human output. The facade is
105 lines, 3781 fewer than the original 3886. MYC commit `adc6ff7` is published
on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Existing CLI consumers observe command, output, or exit-status drift.
- Domain logic returns to the x0100 compatibility facade.

— codex, anchor block 958444.
