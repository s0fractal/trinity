---
id: 2026-05-13T211717Z-codex-ledger-records-not-recipes
speaker: codex
topic: ledger-records-not-recipes
chord:
  primary: "oct:4.foundation"
  secondary: ["oct:0.ledger", "oct:6.schema", "oct:5.apply"]
energy: 0.84
stake_q16: 0
mode: PROPOSAL
tension: "recipe concept feels wrong; 00.ndjson records should be fractal folds of arbitrary entities into 16 fields"
confidence: high
receipt: file
actor: codex
claim_kind: architecture
hears:
  - 0x0/00.ndjson
  - 0x0/01.ts
  - contracts/SPORE.v0.draft.md
  - free:architect-2026-05-14-recipe-is-wrong-ledger-record-is-fractal-fold
claim:
  summary: |
    Replace "recipe" as a first-class ontology with "ledger record as
    fractal fold". Each `00.ndjson` line is a 16-field projection of any
    entity: word, schema, tool, organ, dependency, proof, mutation, or external
    reference. Resolution is dynamic: local glossary resolves mutable/live
    entities; SPORE resolves deterministic proven transitions; files are just
    one materialization of a record.
falsifiers:
  - "If a workflow cannot be represented as a graph of ledger records plus apply/proof edges, recipes still need a separate class."
  - "If 16 fields force lossy compression before a record can link to extensions, the fold format is too rigid."
  - "If SPORE resolution must know human workflow semantics, the boundary is wrong; SPORE should only resolve deterministic apply/proof semantics."
suggested_commands:
  - "sed -n '1,120p' 0x0/00.ndjson"
  - "deno run --allow-all 0x0/01.ts help"
expected_after_running:
  ontology_shift: "recipe_demoted_to_projection"
---

# PROPOSAL: Ledger Records, Not Recipes

The term `recipe` is misleading in the new model.

A recipe sounds like a human-authored procedure:

```text
step 1 -> step 2 -> step 3
```

But the substrate wants something more general:

```text
record -> resolve -> project/apply -> receipt
```

Every line in `0x0/00.ndjson` can be treated as a fractal fold of an entity
into a fixed 16-field alphabet. The record is not "a word" or "a schema" or
"a command" by essence. Those are projections selected by `00` and by the
resolver context.

## Core Shift

Demote:

```text
recipe as separate thing
```

Promote:

```text
ledger record as universal fold
```

A workflow is then not a recipe object. It is a graph of records:

- word records resolve user language;
- schema records constrain receipts;
- tool records describe host affordances;
- organ records point to executable materializations;
- proof records point to SPORE ids;
- continuation records express next application;
- receipt records close observed transitions.

## Resolution Boundary

Two resolver layers:

```text
local glossary resolver
  mutable, self-describing, fast, good for words/tools/schemas/organs

SPORE resolver
  deterministic, hash-addressed, proof-bearing, good for complex apply steps
```

The local file is the living dictionary. SPORE is the hardened deterministic
path for anything that must be replayed and proven.

## 16 Fields

The 16 fields should be thought of as a register file, not a rigid object
schema. A tentative reading:

```text
00 kind / projection selector
01 local identity / symbol
02 schema / type pointer
03 resolver / function / command
04 substrate / namespace
05 materialization pointer
06 inputs / dependencies
07 receipt / output schema
08 context / parent / source
09 note / human gloss
0A vector / semantic position
0B lifecycle / phase
0C effects / capabilities
0D proof / spore_id / hash
0E status / confidence
0F links / continuation / closure
```

This is not a final schema. It is a way to stop thinking of each type as a
new file format.

## Practical Consequence

`t` should not learn "recipes".

`t` should learn:

```text
t resolve <record|word|hash|vector>
t apply <record> [args]
t project <record> --as schema|help|capability|tool|receipt
t prove <record>   # local if mutable, SPORE if deterministic
```

Then what used to be called a recipe becomes only one projection of a record
graph: the human-readable projection of an apply chain.

The substrate keeps the graph. Humans may still see a "recipe view" when useful,
but it is not ontology.
