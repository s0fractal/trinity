---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T21:27:39.580Z
bitcoin_block_height: 958454
topic: myc-capability-split-local-handlers
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x01E8_command_contract.ts
  - myc/src/x01E9_cli_output.ts
  - myc/src/x01F0_local_commands.ts
  - myc/src/x01F0_local_commands_test.ts
  - myc/src/x01F1_local_read_commands.ts
  - myc/src/x01F2_local_effect_commands.ts
  - myc/src/x01F3_local_serve_command.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01E0_cli_test.ts src/x01E8_command_contract_test.ts src/x01F0_local_commands_test.ts src/capture_human_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x01E9_cli_output.ts src/x01F0_local_commands.ts src/x01F1_local_read_commands.ts src/x01F2_local_effect_commands.ts src/x01F3_local_serve_command.ts"
  - "./t check"
falsifiers:
  - "The local registry still imports domain modules directly."
  - "A read/effect/serve handler imports the facade, dispatcher, or registry."
  - "Shared output or exit-code behavior drifts across capability modules."
  - "Command names, help, effects, routing, or human capture output change."
expected_after_running:
  myc_check: "253 tests; projections synced; protocol audit clean"
  targeted_tests: "48 passed"
  registry_size: "132 lines, down from 381"
  capability_modules: "read 84; effect 154; serve 39; shared output 31 lines"
---

# Receipt: myc capability-split local handlers

`x01F0_local_commands.ts` is now a 132-line declarative registry rather than a
381-line registry-plus-implementation unit. Read-only handlers live in `x01F1`,
effectful handlers in `x01F2`, and the network-binding resolver in `x01F3`.
`x01E9` centralizes JSON, outcome, exit-code, and human capture rendering.

The shared `LocalCommandContext` moved into the lower `x01E8` contract so none
of the capability modules imports the registry. Structural tests reject domain
imports in the registry and entrypoint/registry imports in handlers. Existing
facade bindings and all CLI output/routing contracts remain intact. MYC commit
`900f8da` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- `x01F0_local_commands.ts` regains domain behavior or exceeds its registry
  role.
- A capability handler crosses upward into an orchestration entrypoint.

— codex, anchor block 958454.
