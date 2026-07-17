---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T17:20:47.669Z
bitcoin_block_height: 958438
topic: bounded-context-firewall-for-model-work
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - src/x2F10_context.ts
  - src/context_test.ts
  - src/x0010_dispatch_runner.ts
  - src/x0011_glossary_parser.ts
  - src/x0100_dispatch.ts
  - src/dispatch_test.ts
  - src/x0001_glossary.ndjson
  - src/x8800_agents_gen.ts
  - .github/workflows/ci.yml
suggested_commands:
  - "./t context 'agentseal warrant release' --max-files=8 --json | jq -e '.type == \"context\" and .budget.max_files == 8 and (.relevant_files | length) <= 8'"
  - "./t context 'myc' --max-files=5 --json | jq -e '.scope == \"myc\" and (.instruction_files | index(\"myc/AGENTS.md\"))'"
  - "deno test --allow-read --allow-write src/context_test.ts src/dispatch_routing_test.ts"
  - "deno test --allow-read --allow-write --allow-env --allow-run src/dispatch_test.ts src/dispatch_routing_test.ts src/context_test.ts"
  - "./t capabilities validate --json | jq -e '.summary.unclassified_schema_types == 0'"
  - "./t check"
falsifiers:
  - "The default context result includes a historical `.myc.md` ledger file without `--include-ledger`."
  - "A caller can raise `--max-files` above 20 or receives more files than the reported budget."
  - "A MYC-scoped brief omits `myc/AGENTS.md` or the MYC verification gate."
  - "Adding the context receipt schema creates an unclassified capability or an unresolved route."
  - "Dispatcher and composition organs resolve the same alias to different glossary records."
expected_after_running:
  context_agentseal: "at most 8 relevant files; no historical ledger surface"
  context_myc: "scope=myc with root + nested instructions and `deno task check`"
  targeted_tests: "6 passed, 0 failed"
  dispatcher_context_tests: "37 passed, 0 failed"
  capabilities: "valid; 0 unclassified schema types"
  full_check: "READY; 533 tests"
---

# Receipt: bounded context firewall for model work

The first cognitive-refactor increment is live as `./t context "<task>"`.
Instead of asking a model to search 58k TypeScript lines plus roughly 118k lines
of chord history, it scans only bounded text samples from eligible source
surfaces and returns a ranked task brief containing instruction paths, relevant
files, verification commands, scope, and an explicit file budget.

The compatibility boundary is deliberate: existing pipe-to-JSON behavior was not
changed because CI and probes consume it extensively. `context` is a new
read-only route at `2/F1`; it does not spawn processes, write projections, or
load complete candidate files. Historical `*.myc.md` / `*.myc.json` ledger
surfaces, generated manifests/projections, binaries, dependencies, and build
caches are cold by default. Ledger access requires `--include-ledger`.

The file budget defaults to 10, is caller-adjustable, and is hard-capped at 20.
Each candidate contributes at most 6000 sampled bytes and the scan itself is
capped at 2000 files. `--scope=myc` automatically includes both `AGENTS.md` and
`myc/AGENTS.md` plus the nested `deno task check`; package matches add their own
package test command. The public JSON shape is registered as
`trinity.context-brief.v0.1`, linked to the `context` capability, and exercised
in CI.

This phase primarily reduces default working context. It also begins real code
contraction: the dispatcher no longer implements its own glossary word/schema
parser. `x0011_glossary_parser` now owns loaded word records,
primary-before-alias resolution, schemas, and payload validation for the
dispatcher and composition organs. Production code across the two files fell by
53 lines (1502 to 1449), the shared parser no longer exposes explicit `any`, and
a parity regression test locks the naming collision rule. The next phase can use
this firewall while decomposing the MYC monolith and consolidating projection
generators without repeatedly loading the ledger.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Default output exceeds its declared file budget.
- Cold ledger or generated projection files appear without an explicit opt-in.
- The new route breaks the existing dispatcher JSON contract.
- Glossary primary-name precedence changes during the shared-parser migration.

— codex, anchor block 958438.
