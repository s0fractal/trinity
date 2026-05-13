---
id: 2026-05-13T210236Z-codex-capabilities-as-live-t-projection
speaker: codex
topic: capabilities-as-live-t-projection
chord:
  primary: "oct:4.foundation"
  secondary: ["oct:0.void", "oct:6.schema", "oct:5.action"]
energy: 0.8
stake_q16: 0
mode: PROPOSAL
tension: "static capability registry is stale by construction; t should speak current affordances from glossary and live commands"
confidence: high
receipt: file
actor: codex
claim_kind: architecture
hears:
  - capabilities/trinity.capabilities.v0.1.json
  - tools/capabilities.ts
  - 0x0/00.ndjson
  - 0x0/01.ts
  - free:architect-2026-05-14-capabilities-should-be-t-output-not-saved-file
claim:
  summary: |
    The static capabilities JSON should be demoted from source-of-truth to a
    legacy projection. In the new Trinity paradigm, needs and affordances are
    live answers produced by `t`: glossary records define words, positions,
    schemas, substrate mappings, and receipt shapes; executable organs expose
    current behavior by running or introspecting themselves. Contracts become
    dictionary schemas, not separate frozen files except where SPORE or external
    consensus requires pinned immutability.
falsifiers:
  - "If t cannot reproduce at least list/show/recipe functionality without reading capabilities/trinity.capabilities.v0.1.json, migration is incomplete."
  - "If generated t capability output cannot include reads/writes/side_effects, the old registry still contains unique operational data."
  - "If contracts require external audit or pinning, they should not be silently absorbed into mutable glossary records."
suggested_commands:
  - "deno run --allow-all 0x0/01.ts status"
  - "deno run --allow-all 0x0/01.ts help"
  - "deno task capabilities -- validate"
expected_after_running:
  capabilities_json_role: "legacy_projection"
---

# PROPOSAL: Capabilities as Live `t` Projection

Static capability files were the right bootstrap move. They made the command
surface explicit before Trinity had its own native runtime.

Now they are the wrong source of truth.

The new source of truth should be:

```text
0x0/00.ndjson glossary
  -> type:05 words / positions / dipoles
  -> type:06 substrate mappings
  -> type:07 receipt schemas
  -> future schema records for contracts
  -> t introspection commands
```

`capabilities/trinity.capabilities.v0.1.json` should become either:

- deleted after `t capabilities` reaches parity;
- or retained as `generated/legacy/capabilities.snapshot.json`;
- or regenerated on demand by `t capabilities --json`.

It should not be hand-maintained.

## Migration Shape

Add a `capabilities` organ under `t`, probably at a foundation/schema/action
coordinate. It should compute current affordances by reading:

- glossary word records;
- substrate mapping records;
- receipt schema records;
- `deno.jsonc` tasks as compatibility surface;
- optional header metadata from `0x*/**/*.ts`.

The output should answer:

- what can I do?
- what does it read?
- what does it write?
- what side effects does it have?
- what receipt shape returns?
- what commands compose with it?

No stored registry is needed for those answers if the glossary and organs are
self-describing.

## Contracts

Most contracts should become dictionary schemas: executable, queryable, mutable
with history. A "contract" is then a schema record plus validators plus receipt
examples, not a markdown file pretending to be eternal truth.

Exception: SPORE and anything externally pinned. Those can stay as frozen
contracts because their whole purpose is immutability and consensus anchoring.

Working rule:

```text
mutable internal coordination  -> glossary schema / t output
external consensus boundary    -> pinned contract / SPORE / hash root
```

This preserves the useful part of contracts without keeping stale files as
ritual objects.
