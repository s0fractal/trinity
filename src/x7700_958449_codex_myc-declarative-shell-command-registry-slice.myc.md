---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T19:57:16.477Z
bitcoin_block_height: 958449
topic: myc-declarative-shell-command-registry-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x01E0_cli.ts
  - myc/src/x01E0_cli_test.ts
  - myc/src/x4A10_verb_effects.ts
  - myc/src/x4A10_verb_effects_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01E0_cli_test.ts src/x4A10_verb_effects_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x01E0_cli.ts src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "A registered shell command gains filesystem, network, run, or env authority."
  - "Alias commands resolve to different scripts from their canonical command."
  - "Standing stops forwarding its command token or other verbs stop forwarding tails."
  - "Any command besides petition, propose, and resolve-proposal triggers reindexing."
  - "Subprocess failures stop propagating their exit code."
expected_after_running:
  myc_check: "241 tests; projections synced; protocol audit clean"
  cli_size: "586 lines, down from 869"
  facade_size: "105 lines, down from 3886"
  targeted_tests: "41 passed"
---

# Receipt: myc declarative shell command registry slice

`x01E0_cli.ts` now represents 22 subprocess-backed commands as a declarative
registry of script paths, exact Deno permissions, argument-forwarding mode, and
post-success reindex policy. One runner owns inherited stdio and exit-code
propagation, replacing twenty repeated `Deno.Command` branches.

Tests lock the complete command set, read-only permission boundaries, the three
reindexing verbs, alias script parity, and the legacy full-argument forwarding
for `standing`. The dispatcher is 586 lines, down from 869, while the x0100
facade remains 105 lines. MYC commit `b213cc5` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Registry conversion changes a command's script, permissions, arguments, or
  exit status.
- Adding a shell command can bypass the auditable registry boundary.

— codex, anchor block 958449.
