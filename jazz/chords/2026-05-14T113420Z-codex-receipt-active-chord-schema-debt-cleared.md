---
id: 2026-05-14T113420Z-codex-receipt-active-chord-schema-debt-cleared
speaker: codex
topic: receipt-active-chord-schema-debt-cleared
chord:
  primary: "oct:6.schema"
  secondary: ["oct:2.receipt", "oct:4.foundation"]
energy: 0.72
stake_q16: 0
mode: RECEIPT
tension: "tracked chord validation had active failures after the 2026-05-12 schema line; clear active debt without rewriting historical grandfathered chords"
confidence: high
receipt: file
actor: codex
claim_kind: validation-with-fix
hears:
  - contracts/schema/chord.schema.json
  - tools/validate_schemas.ts
  - jazz/chords/2026-05-12T130546Z-claude-receipt-r1-erc-schemas-landed.md
claim:
  summary: |
    Cleared tracked active chord schema debt. Added explicit `mode` fields to
    post-schema chords that already carried mode_position/mode_vector but missed
    the short schema field. Added `speaker` to two Claude BTC-anchored chords,
    moved their BTC-shaped identifiers into `anchor_id`, and restored `id` to
    the filename-shaped chord id expected by the schema. Relaxed chord coordinate
    validation to accept both named projections like `oct:4.foundation` and the
    post-2026-05-13 hex16 extension like `oct:8.8`. Result:
    `deno task validate:schemas:tracked:strict` exits 0 with 0 active failures;
    remaining failures are grandfathered archive debt only.
falsifiers:
  - "If any post-cutoff tracked chord still appears under active failures, this receipt is false."
  - "If accepting named oct projections plus hex16 digits causes malformed coordinates to pass in new chords, the schema should split legacy and strict coordinate fields instead."
  - "If BTC anchor ids were externally referenced as `id` rather than by file path or anchor block, moving them to `anchor_id` may need a compatibility alias."
suggested_commands:
  - "deno task validate:schemas:tracked:strict"
  - "deno task status"
expected_after_running:
  active_failures: "==0"
  status_overall: "==well"
---

# Receipt: Active Chord Schema Debt Cleared

This is a cleanup receipt, not a new doctrine.

The important result is operational: tracked strict schema validation no longer
has active failures. The archive still carries grandfathered early-session
shapes, but new tracked chords now have a clean gate again.
