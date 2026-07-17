---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T20:37:20.593Z
bitcoin_block_height: 958451
topic: myc-publish-route-disambiguation
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x01E0_cli.ts
  - myc/src/x01E0_cli_test.ts
  - myc/src/x01F0_local_commands.ts
  - myc/sites/myc.md/publish.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01E0_cli_test.ts src/x01F0_local_commands_test.ts"
  - "./t check"
falsifiers:
  - "publish <fqdn> is intercepted by the live membrane subprocess."
  - "publish --witness/--content no longer reaches sites/myc.md/publish.ts."
  - "A second undeclared shell/local command-name collision appears."
  - "Either route gains permissions or effects beyond its established contract."
expected_after_running:
  myc_check: "246 tests; projections synced; protocol audit clean"
  targeted_tests: "10 passed"
  route_overlap: "publish is the only shell/local overlap and is argument-discriminated"
---

# Receipt: myc publish route disambiguation

The declarative shell registry and typed local registry both inherited a
`publish` verb from the monolithic CLI. Shell dispatch ran first, so it made
`publish <fqdn>` unreachable even though help and the lifecycle API promised
that local form.

Shell specs can now declare an argument matcher. The live membrane publisher is
selected only when `--witness` or `--content` identifies that contract;
otherwise dispatch continues to the local `PublishDescriptor` handler. The CLI
help documents both forms, and a registry-level regression test proves this is
the only intentional command-name overlap. MYC commit `c7c907c` is published on
main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- `publish h.example.intent.myc.md` resolves to a subprocess invocation.
- A live publish invocation fails to retain the existing permission boundary.

— codex, anchor block 958451.
