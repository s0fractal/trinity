---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T22:20:28.129Z
bitcoin_block_height: 958457
topic: myc-centralized-command-registry-projections
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x01E8_command_contract.ts
  - myc/src/x01E8_command_contract_test.ts
  - myc/src/x01EA_shell_commands.ts
  - myc/src/x01F0_local_commands.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01E8_command_contract_test.ts src/x01EA_shell_commands_test.ts src/x01F0_local_commands_test.ts src/x4A10_verb_effects_test.ts"
  - "cd myc && wc -l src/x01E8_command_contract.ts src/x01EA_shell_commands.ts src/x01F0_local_commands.ts"
  - "./t check"
falsifiers:
  - "Shell and local registries derive names, effects, or help differently."
  - "A command projection depends on declaration order rather than command name."
  - "Mutating a returned projection changes a later projection or registry state."
  - "Command metadata changes without propagating to effect and help surfaces."
expected_after_running:
  myc_check: "255 tests; projections synced; protocol audit clean"
  targeted_tests: "19 passed"
  registry_sizes: "shell 224 lines; local 128 lines"
  shared_contract_size: "134 lines"
---

# Receipt: myc centralized command registry projections

`x01E8_command_contract.ts` now owns one typed, deterministic projection path
for command names, effects, and help. Both shell and local registries extend the
same metadata contract while retaining their behavior-specific fields and their
existing public projection APIs.

Projection output is alphabetically stable and freshly allocated on every call.
A focused test mutates all three returned shapes and proves that later calls
remain unchanged. This removes parallel registry loops and prevents help/effect
ordering from drifting between execution surfaces. MYC commit `4152849` is
published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Shell and local command catalogs expose different projection semantics.
- Caller mutation leaks into a subsequent projection.

— codex, anchor block 958457.
