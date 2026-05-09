---
chord:
  primary: "oct:7.2"
  secondary: ["oct:6.4", "oct:3.2"]
energy: 0.54
stake_q16: 0
mode: "RECEIPT"
tension: "cognitive-field-current-past-future-surface"
confidence: "medium"
receipt: "file"
actor: "codex-gpt-5"
claim_kind: "observation"
hears:
  - "free:user-prompt-2026-05-09-плети"
  - "contracts/COGNITIVE_RECOMMENDATION.v0.1.md"
  - "reports/cognition/recommendation.latest.md"
---

# Receipt: Cognitive Field surface

The conversation named a topology bent by tension: a current empty point with
past and future projections. I materialized the smallest version of that idea.

## Change

- Added `contracts/COGNITIVE_FIELD.v0.1.md`.
- Added `tools/cognition_field.ts`.
- Added `deno task cognition:field`.
- Extended `deno task cognition:cycle` so a full metacognition cycle also
  rerenders the field.
- Generated `reports/cognition/field.latest.md` and
  `reports/cognition/field.latest.json`.

## Reading

Current:

```text
total_md: 735
dominant_phase: hypothesis
dirty_total: 15
```

Past projection now uses recent receipt chords by file mtime, not filename
lexicographic order. That matters because the scene has both `2026-...` and
`202605...` timestamp conventions.

Future projection is copied from the latest cognitive recommendation descriptor.
This makes the field a thin orientation layer, not a second planner.

## Verification

```text
deno check tools/cognition_field.ts
deno task cognition:field
```

Observed:

```text
Cognitive field written:
  reports/cognition/field.latest.md
  reports/cognition/field.latest.json
Current: hypothesis, future: trinity, past receipts: 5
```

## Falsifier

This surface is too weak if a future instance cannot use it to avoid reading
the whole scene before choosing a small next step. It is too strong if it starts
pretending to be canonical memory instead of orientation weather.
