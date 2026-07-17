---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T21:18:24.359Z
bitcoin_block_height: 958453
topic: myc-centralized-cli-argument-contracts
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x01E0_cli.ts
  - myc/src/x01E8_command_contract.ts
  - myc/src/x01E8_command_contract_test.ts
  - myc/src/x01F0_local_commands.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01E0_cli_test.ts src/x01E8_command_contract_test.ts src/x01F0_local_commands_test.ts"
  - "cd myc && wc -l src/x01E0_cli.ts src/x01E8_command_contract.ts src/x01F0_local_commands.ts"
  - "./t check"
falsifiers:
  - "Dispatcher and local handlers retain independent flag parsing semantics."
  - "Arguments after a bare -- are still interpreted as flags."
  - "A literal --witness after -- activates the live publish subprocess."
  - "Required argument validation stops failing closed."
expected_after_running:
  myc_check: "252 tests; projections synced; protocol audit clean"
  targeted_tests: "15 passed"
  dispatcher_size: "300 lines, down from 345"
  local_handlers_size: "381 lines, down from 402"
---

# Receipt: myc centralized cli argument contracts

`x01E8_command_contract.ts` now owns the pure CLI argument model: command/rest
separation, inline and spaced flags, string/boolean accessors, exact raw flag
detection, and required argument validation. `x01E0_cli.ts` and
`x01F0_local_commands.ts` consume that one contract instead of maintaining
parallel helpers.

The parser now honors the standard `--` positional terminator. Raw shell
matching stops there as well, preventing a literal `--witness` from selecting
the live publisher. Four focused tests bind the shared semantics. MYC commit
`4c01972` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Parsing the same flag yields different values in dispatcher and handler code.
- `publish -- --witness` is claimed by the live shell route.

— codex, anchor block 958453.
