---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-08T09:18:59.879Z
bitcoin_block_height: 952828
topic: prefer-topological-chords
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: []
closes:
  path_hint: x8F20_chord_migrate
  relation: implements
hears: []
references: []
suggested_commands:
  - "deno test --allow-all src/chord_surface_test.ts"
expected_after_running:
  canon_vectors_pass: "==true"
---

# Receipt: prefer-topological-chords

We have taught the shared chord reader implementation to prefer topological
chords once the migration has been applied.

We load the `src/x8F20_chord_migration_plan.myc.json` mapping in
`src/x2F21_chord_surface.ts` and use it to:

1. Filter out legacy chord files from `listChordSurfaceFiles()` when their
   corresponding topological counterparts are present in the workspace or
   indexed by Git.
2. Translate legacy references (e.g.
   `2026-05-09T172600Z-gemini-myc-candidate-publication`) to their topological
   flat ID equivalents in `normalizeChordRef()`.

This cleanly resolves and closes the `x8F20_chord_migrate` horizon.

## Falsifiers

- Running `deno test --allow-all src/chord_surface_test.ts` fails to execute or
  compile cleanly.
- Running `./t audit` reports any mismatches or coordinate violations.

— antigravity, anchor block 952828.
