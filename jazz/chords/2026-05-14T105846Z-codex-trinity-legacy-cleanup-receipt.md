---
id: 2026-05-14T105846Z-codex-trinity-legacy-cleanup-receipt
speaker: codex
topic: trinity-legacy-cleanup-receipt
chord:
  primary: "oct:7.7"
  secondary: ["oct:4.4", "oct:6.6", "oct:5.5"]
energy: 0.82
stake_q16: 0
mode: RECEIPT
tension: "Trinity cleanup removed legacy registries, intake projections, generated cognition state, and a conflicting status task; receipt records the atom before the next migration wave."
confidence: high
receipt: file
actor: codex
claim_kind: receipt
hears:
  - AGENTS.md
  - jazz/chords/2026-05-13T230651Z-codex-repo-rudiments-and-strengthening-vectors.md
  - jazz/chords/2026-05-13T231653Z-codex-contracts-chords-hex-ledger-migration-plan.md
claim:
  summary: |
    Trinity's active filesystem shed the old capabilities registry, the
    intake/public-candidates conveyor, tracked generated cognition outputs,
    and the duplicate `deno task status` submodule table. Recipes now project
    from `0x0/00.ndjson` kind:8 records; capabilities are live through
    `t capabilities`; generated cognition outputs are ignored by git; and
    `deno task status` now routes to the same substrate self-reflection as
    `t status`. The remaining schema debt is explicit: default validation is
    soft, while `validate:schemas:strict` preserves fail-fast behavior for
    modernization work.
falsifiers:
  - "If any removed capabilities, intake, or public-candidates file still supplies unique live metadata not available through `t` or contracts, this cleanup cut too deep."
  - "If generated cognition outputs are needed as committed canonical state rather than runtime receipts, the .gitignore demotion is wrong."
  - "If `deno task status` was relied on as the primary submodule status surface, the alias change should be reverted or renamed more visibly."
suggested_commands:
  - "deno task status"
  - "deno check 0x0/01.ts 0x2/E.ts 0x3/C.ts 0x4/A.ts tools/cognition_snapshot.ts tools/cognition_delta.ts tools/recommend_to_chord.ts tools/cognition_recommend_receipt.ts tools/cognition_recommend.ts tools/cognition_field.ts tools/chord_play.ts tools/validate_schemas.ts scripts/run_baseline.ts scripts/phi_roundtrip.ts"
  - "deno task validate:schemas"
  - "deno task validate:schemas:strict"
expected_after_running:
  trinity_status: "well"
  deno_check: "pass"
  validate_schemas: "soft-pass"
  validate_schemas_strict: "fails-on-grandfathered-chords"
---

# Receipt: Trinity Legacy Cleanup

This cleanup narrows Trinity back toward the living hex/runtime center:

- `capabilities/` is gone after recipes moved into `0x0/00.ndjson`.
- `intake/` and `public-candidates/` are gone as active conveyors.
- transient cognition reports are ignored instead of committed as latest state.
- `chord_play` and recommendation schema no longer know about the old intake
  projection index.
- `deno task status` now means substrate status, not a separate submodule table.
- `validate:schemas` is soft by default; strict mode is explicit.

Verification at receipt time:

```text
deno check touched t/tools/scripts: pass
deno task status: overall well, health 52/52, audit 23 match / 0 mismatch
deno task validate:schemas: exits 0 and reports historical chord debt
deno task validate:schemas:strict: exits 1 on 130 grandfathered chord failures
```

Submodule dirt in `omega`, `liquid`, and `myc` was deliberately not touched.
