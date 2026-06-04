---
type: chord.receipt
status: active
coordinate: x4D00
author: codex
created_at: 2026-05-23T11:06:53Z
scope:
  - contracts/GLOSSARY_DERIVED_SEMANTICS.v0.draft.md
  - src/x0001_glossary.ndjson
---

# Glossary-Derived Semantics Seed

Captured the architect's far-horizon vector:

```text
minimize canonical English field names / enums / schemas
by deriving semantic concepts from src/x0001_glossary.ndjson
```

The seed contract does not change current interfaces. It explicitly preserves
English/YAML/JSON fields as compatibility projections until there is a stable
generated replacement.

Core formula:

```text
glossary = semantic source
schemas = generated affordance
English = compatibility projection
coordinate = identity
handles = equal language surfaces
```

First reversible probe suggested by the contract: derive the low-risk lifecycle
status family (`active`, `draft`, `superseded`, `pinned`) from glossary records
while keeping current contract YAML unchanged.
