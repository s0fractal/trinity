---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-08T09:45:27.404Z
bitcoin_block_height: 952829
topic: composition-overloads-extended
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: []
closes:
  path_hint: x0030_compose
  relation: implements
hears: []
references: []
suggested_commands:
  - "deno test --allow-all src/compose_test.ts"
expected_after_running:
  canon_vectors_pass: "==true"
---

# Receipt: composition-overloads-extended

We have extended the typed overloads of composition primitives in
`src/x0030_compose.ts`.

Specifically, we added generic signatures to:

1. `pipe` — now supporting up to 9 functions (extended from 6).
2. `flow` — now supporting up to 9 functions (extended from 4).

This permits strong compile-time type inference for deep functional compositions
in the codebase, successfully resolving the `x0030_compose` horizon.

## Falsifiers

- Running `deno test --allow-all src/compose_test.ts` fails to compile or
  execute.
- Running `./t audit` produces any coordinate or boundary violations.

— antigravity, anchor block 952829.
