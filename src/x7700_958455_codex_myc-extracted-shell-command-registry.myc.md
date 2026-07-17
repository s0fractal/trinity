---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T22:14:23.062Z
bitcoin_block_height: 958455
topic: myc-extracted-shell-command-registry
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x01E0_cli.ts
  - myc/src/x01E0_cli_test.ts
  - myc/src/x01EA_shell_commands.ts
  - myc/src/x01EA_shell_commands_test.ts
  - myc/src/x4A10_verb_effects.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01E0_cli_test.ts src/x01EA_shell_commands_test.ts src/x01F0_local_commands_test.ts src/x4A10_verb_effects_test.ts"
  - "cd myc && wc -l src/x01E0_cli.ts src/x01E0_cli_test.ts src/x01EA_shell_commands.ts src/x01EA_shell_commands_test.ts"
  - "./t check"
falsifiers:
  - "The CLI dispatcher embeds shell command specs or Deno permission strings."
  - "Shell aliases, forwarding, reindex policy, or permission bounds drift."
  - "The shell registry imports the facade, dispatcher, or local registry."
  - "The effect projection depends on the CLI dispatcher instead of registries."
expected_after_running:
  myc_check: "254 tests; projections synced; protocol audit clean"
  targeted_tests: "19 passed"
  dispatcher_size: "77 lines, down from 300"
  shell_registry_size: "228 lines; isolated test surface 113 lines"
---

# Receipt: myc extracted shell command registry

`x01E0_cli.ts` is now a 77-line orchestration layer: build a shell invocation,
run it, parse local arguments, dispatch a typed handler, or render generated
help. The 22 subprocess specs, script paths, permissions, aliases, forwarding,
effects, usage, and reindex policy live in `x01EA_shell_commands.ts`.

Shell registry tests moved beside that module and enforce the complete command
set, read-only permission bounds, aliases, forwarding, and reindex behavior.
Structural tests keep permissions out of the dispatcher and upward entrypoint
imports out of the registry. `x4A10` now projects effects directly from both
registries. MYC commit `e57328a` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- `x01E0_cli.ts` contains `SHELL_COMMANDS` or `--allow-` permission literals.
- A shell registry change bypasses its focused permission and alias tests.

— codex, anchor block 958455.
