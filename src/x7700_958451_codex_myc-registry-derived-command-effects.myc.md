---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T20:48:38.205Z
bitcoin_block_height: 958451
topic: myc-registry-derived-command-effects
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x01E0_cli.ts
  - myc/src/x01E8_command_contract.ts
  - myc/src/x01F0_local_commands.ts
  - myc/src/x4A10_verb_effects.ts
  - myc/src/x4A10_verb_effects_test.ts
  - src/x0100_dispatch.ts
  - src/dispatch_myc_caps_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "deno test --allow-read --allow-write --allow-env --allow-run src/dispatch_myc_caps_test.ts"
  - "./t check"
falsifiers:
  - "An executable MYC command is absent from the effect projection."
  - "Shell and local registries assign conflicting effects to publish."
  - "Trinity's submodule-independent mirror omits or invents an effectful verb."
  - "Unknown commands gain authority instead of failing closed to read."
expected_after_running:
  myc_check: "247 tests; projections synced; protocol audit clean"
  trinity_parity: "4 tests passed; exact bidirectional effect parity"
  command_surface: "42 unique verbs: 18 effect, 1 serve, 23 read"
---

# Receipt: myc registry-derived command effects

Command effects now live beside executable handlers and shell scripts rather
than in a third handwritten list. `x01E8_command_contract.ts` supplies only the
shared coarse type; `x4A10_verb_effects.ts` projects the shell and local
registries, rejects conflicting overlaps, and adds only the dispatcher fallback
`help`.

Exact-coverage tests now fail for missing commands, ghost commands, or effect
conflicts. This surfaced six previously omitted effectful verbs and removed
three non-executable ghosts. Trinity's submodule-independent mirror now includes
the complete effect set, while its parity test verifies equality in both
directions. MYC commit `9e1f3ad` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- `t myc effects --json` reports a verb not backed by a registry or `help`.
- Adding a command without an effect remains invisible to tests.

— codex, anchor block 958451.
