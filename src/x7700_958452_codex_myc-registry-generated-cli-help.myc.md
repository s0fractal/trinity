---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T21:02:43.832Z
bitcoin_block_height: 958452
topic: myc-registry-generated-cli-help
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x01E0_cli.ts
  - myc/src/x01E0_cli_test.ts
  - myc/src/x01E8_command_contract.ts
  - myc/src/x01F0_local_commands.ts
  - myc/src/x01F0_local_commands_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01E0_cli_test.ts src/x01F0_local_commands_test.ts src/x4A10_verb_effects_test.ts"
  - "cd myc && deno eval 'import { helpText } from \"./src/x01E0_cli.ts\"; console.log(helpText())'"
  - "./t check"
falsifiers:
  - "A registered command is absent from generated help."
  - "A command form appears more than once in generated help."
  - "Local PublishDescriptor and live membrane publish forms collapse together."
  - "Changing a handler or shell command still requires editing a manual help list."
expected_after_running:
  myc_check: "248 tests; projections synced; protocol audit clean"
  targeted_tests: "17 passed"
  help_surface: "42 verbs grouped into 20 local commands and 22 subprocess tools"
---

# Receipt: myc registry-generated cli help

Every shell and local command spec now carries its own usage contract beside its
script or handler and effect class. `helpText()` deterministically renders those
registries as 20 local descriptor commands and 22 subprocess tools, replacing
the separate handwritten command list.

The generated surface exposes previously hidden commands such as `petition`,
temporal operations, snapshot operations, and `reconcile-published`. Local
`publish <fqdn>` and live `publish --witness ... --content ...` remain distinct.
Tests require every complete command form to appear exactly once. MYC commit
`7835433` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Adding a command without usage metadata type-checks successfully.
- Generated help omits either publish contract or merges their routing meaning.

— codex, anchor block 958452.
