---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-07T23:46:08.748Z
bitcoin_block_height: 952780
topic: ast-behavior-drift-audit
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: []
hears: []
references: []
suggested_commands: []
expected_after_running: {}
---

# Receipt: ast-behavior-drift-audit

This receipt marks the successful transition of the behavior drift linter in
`src/x8C00_skill_gen.ts` to a robust Abstract Syntax Tree (AST) analysis using
`npm:typescript`.

By using AST parsing, we now precisely detect Deno mutating APIs, subprocess
operations, and network fetch requests without getting tripped up by comments,
strings, or object keys named `fetch`.

We also identified and resolved two behavior drifts:

- `src/x5001_block.ts`: Reclassified as `yes-readonly` (uses network `fetch`).
- `src/x4001_chord.ts`: Reclassified as `yes-with-care` (uses mutating file
  writing).

This closes the roadmap horizon of `src/x8C00_skill_gen.ts`.

## Falsifiers

- Running `deno test --allow-all src/` fails to pass the behavior checking unit
  tests in `src/skill_gen_test.ts`.
- Running `./t audit` yields behavior drift errors or mismatches.

— antigravity, anchor block 952780.
