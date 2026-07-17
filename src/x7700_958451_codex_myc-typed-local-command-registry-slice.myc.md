---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T20:33:38.132Z
bitcoin_block_height: 958451
topic: myc-typed-local-command-registry-slice
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
  - myc/src/x01F0_local_commands.ts
  - myc/src/x01F0_local_commands_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01E0_cli_test.ts src/x01F0_local_commands_test.ts src/capture_human_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x01E0_cli.ts src/x01F0_local_commands.ts src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "The local registry omits or silently claims an unknown command."
  - "A handler performs effects before validating its required arguments."
  - "Local handlers import the CLI dispatcher or compatibility facade."
  - "HTTP serve wiring changes resolver services or audit behavior."
  - "Human and JSON output contracts drift from established CLI behavior."
expected_after_running:
  myc_check: "245 tests; projections synced; protocol audit clean"
  dispatcher_size: "260 lines, down from 586"
  local_handlers_size: "330 lines"
  facade_size: "105 lines, down from 3886"
  targeted_tests: "41 passed"
---

# Receipt: myc typed local command registry slice

`x01F0_local_commands.ts` now maps 20 in-process verbs to explicit typed
handlers. Shared validation, JSON rendering, outcome exit codes, resolver serve
wiring, and human capture rendering live beside those handlers rather than in
the CLI dispatcher.

`x01E0_cli.ts` now only parses arguments, dispatches the shell permission
registry, delegates a typed local context, and renders help. Tests lock the
complete local command set, fail-open refusal of unknown verbs, validation
before effects, and independence from both `x01E0` and `x0100`. The dispatcher
is 260 lines, down from 586; the thin facade remains 105 lines. MYC commit
`f1aa344` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Registry conversion changes command results, output, or exit status.
- A local handler bypasses its dedicated domain module boundary.

— codex, anchor block 958451.
