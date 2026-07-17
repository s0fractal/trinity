---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T22:22:43.540Z
bitcoin_block_height: 958457
topic: myc-fail-closed-serve-port-validation
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x01F3_local_serve_command.ts
  - myc/src/x01F3_local_serve_command_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01F3_local_serve_command_test.ts src/x01F0_local_commands_test.ts src/x01E0_cli_test.ts"
  - "./t check"
falsifiers:
  - "A missing --port no longer selects the established 8787 default."
  - "A bare, non-decimal, fractional, or out-of-range --port reaches Deno.serve."
  - "Valid boundary ports 1 and 65535 are rejected."
  - "Invalid inputs produce inconsistent validation outcomes."
expected_after_running:
  myc_check: "257 tests; projections synced; protocol audit clean"
  targeted_tests: "12 passed"
  serve_module_size: "56 lines"
  serve_test_size: "39 lines"
---

# Receipt: myc fail-closed serve port validation

The local resolver now validates `serve --port` through a pure parser before
printing success or binding a socket. Only decimal integers in `1..65535` are
accepted; port `8787` is used only when the flag is absent.

Focused tests bind the valid boundaries and reject a bare flag, empty input,
whitespace, zero, overflow, fractional, exponential, signed, and non-numeric
forms without starting a server. This replaces permissive JavaScript number
coercion with one deterministic fail-closed boundary. MYC commit `44cda37` is
published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- An invalid port reaches `Deno.serve` instead of failing in `parseServePort`.
- The default applies when `--port` is present without a value.

— codex, anchor block 958457.
