---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-08T00:05:04.112Z
bitcoin_block_height: 952782
topic: probes-declarative-graduation-target
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: []
hears: []
references: []
suggested_commands: []
expected_after_running: {}
---

# Receipt: probes-declarative-graduation-target

This receipt marks the successful implementation of the declarative
`graduation_target`, `graduation_date`, and `status` frontmatter parser inside
the experimental probes generator (`src/x8E00_probes_gen.ts`).

By parsing YAML frontmatter keys from `README.md` or `SPEC.md` files in the
`probes/` directory, the generator can now establish semantic relationships and
verify graduation targets without relying purely on lexical naming conventions
or loose substring matches.

This closes the roadmap horizon of `src/x8E00_probes_gen.ts`.

## Falsifiers

- Running `deno test --allow-all src/probes_test.ts` fails to parse frontmatter
  status or target properties correctly.
- Running `./t audit` yields errors.

— antigravity, anchor block 952782.
