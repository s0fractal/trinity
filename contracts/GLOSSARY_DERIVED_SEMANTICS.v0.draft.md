---
type: "ContractDescriptor"
version: "0.0-seed"
title: "Glossary-Derived Semantics: positional concepts before English schemas"
status: "draft"
related:
  - "./HEX_DIPOLE_SEED.v0.draft.md"
  - "./HEX_ROUTE_VOCABULARY.v0.draft.md"
  - "./FQDN_SEMANTIC_DNS.v0.1.md"
  - "../jazz/chords/2026-05-13T163000Z-gemini-stance-glossary-driven-schema-over-shared-router.md"
  - "../jazz/chords/2026-05-13T203000Z-kimi-option-D-glossary-driven-schema-validation.md"
---

# Glossary-Derived Semantics

This is a far-horizon seed, not an active interface.

It captures the vector where Trinity gradually minimizes canonical English field
names, enum labels, and hand-written schemas by deriving concepts from
`src/x0001_glossary.ndjson`.

Current practice still needs English/YAML/JSON fields for tool compatibility.
This contract does **not** remove them. It reframes them as projections that can
eventually be generated from a smaller positional semantic substrate.

## Claim

The long-term source of semantic truth should be:

```text
coordinate + glossary slots + handles[] + dipole signature + relations
```

not:

```text
English field names + string enum values + hand-authored schema prose
```

English remains useful as an API projection, but not as the deepest identity
layer.

## Motivation

Trinity already treats multilingual handles as equal projections of one
substrate position. `status`, `статус`, and `як` can route to the same organ.

The same principle can extend below commands into schemas:

- `active`, `draft`, `superseded` are not inherently English constants.
- `type`, `status`, `voice`, `mode`, `stance` are not inherently canonical
  English keys.
- They are handles for positions and relations in a glossary-backed semantic
  space.

If the repository keeps moving toward source-addressed topology, then field
names should eventually become generated surfaces, not ontology.

## Non-Goal

Do not break current JSON/YAML/Markdown interfaces.

Existing consumers, model tooling, tests, and contracts depend on readable
English keys. Compatibility views should survive for as long as they are useful.

## Seed Model

`src/x0001_glossary.ndjson` becomes a semantic compiler input.

A glossary record may define:

- concept kind
- equal handles across languages
- topological coordinate
- human note
- dipole signature
- relation slots
- projection templates

Then generated schemas can expose conventional views:

```yaml
type: ContractDescriptor
status: draft
```

while the deeper record is positional:

```json
{
  "00": "<record-kind>",
  "02": ["draft", "чернетка", "seed"],
  "04": "<coordinate>",
  "09": "<semantic note>",
  "11": "<dipole bytes>"
}
```

The exact slot vocabulary is intentionally not frozen here.

## Migration Gradient

### Phase 0: Document Equivalence

For existing schema fields, add glossary records that name them as concepts. No
runtime behavior changes.

Examples:

- `type`
- `status`
- `mode`
- `stance`
- `voice`
- `coordinate`
- `source_layer`

### Phase 1: Enum Demotion

String enums become generated compatibility projections.

Instead of treating:

```yaml
status: active
```

as primitive, treat `active` as a handle resolving to a glossary concept in a
lifecycle-state relation.

Compatibility output can still render `active`.

### Phase 2: Glossary-Backed Validation

Validators accept concepts by relation membership rather than hard-coded English
lists.

Example:

```text
field accepts any concept with relation lifecycle_state
```

rather than:

```text
allowed values: active | draft | superseded
```

### Phase 3: Generated Schemas

Human-readable schema files become generated artifacts from glossary records
plus relation constraints.

Contracts can still be written as Markdown, but their schema sections are
compiled surfaces rather than manually maintained enumerations.

### Phase 4: Positional Canonical Ledger

Canonical machine records use compact positional slots. English, Ukrainian, JSON
Schema, Markdown tables, and API docs are generated projections.

At this point:

```text
glossary = semantic source
schemas = generated affordance
English = compatibility projection
coordinate = identity
handles = equal language surfaces
```

## Relation To FQDN

FQDN names remain useful for object identity and human routing.

This contract says the words inside the FQDN and schema should not be mistaken
for the deepest semantic source. A semantic FQDN may itself become a projection
from glossary position plus selected handles.

## Guardrails

1. Compatibility projections stay until no active consumer needs them.
2. No field-key removal without a migration receipt and roundtrip tests.
3. No replacement of readable contracts with opaque slot records unless the
   generated readable surface is byte-stable enough for review.
4. Multilingual handles remain equal; do not reintroduce canonical English
   through generated schemas.
5. Glossary records must not become a new hand-maintained dumping ground. They
   need source manifests or generated receipts when derived.

## Falsifiers

This vector is wrong or premature if:

1. Generated schema projections are harder for models and humans to review than
   hand-written schemas.
2. Positional records hide important semantic distinctions that English fields
   made obvious.
3. Validators built from glossary relations become less stable than explicit
   enum lists.
4. Two independent implementations derive incompatible schemas from the same
   glossary records.
5. The glossary grows faster than the concepts it clarifies, becoming another
   registry rather than a semantic compiler input.

## First Reversible Probe

Pick one low-risk enum family, probably contract lifecycle status:

```text
active | draft | superseded | pinned
```

Add glossary concepts and generate a compatibility table from them. Keep the
current YAML fields unchanged. Compare generated output with the existing
contract parser.

If the generated table is stable and clearer, extend to `mode` / `stance`.

## Status

Seed draft.

This is a direction for far-future substrate simplification. It should not block
current work on `SUBSTRATE_SELF_ABI`, `IN_LEDGER_SRC_PROJECTION`, or
cross-substrate roadmap federation.
