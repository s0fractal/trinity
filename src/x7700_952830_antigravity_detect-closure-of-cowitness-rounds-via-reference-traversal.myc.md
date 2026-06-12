---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-08T10:35:00.000Z
bitcoin_block_height: 952830
topic: detect-closure-of-cowitness-rounds-via-reference-traversal
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: []
closes:
  path_hint: x8A00_voice_memory_gen
  relation: implements
hears: []
references: []
suggested_commands:
  - "deno test --allow-all src/voice_memory_test.ts"
expected_after_running:
  canon_vectors_pass: "==true"
---

# Receipt: detect-closure-of-cowitness-rounds-via-reference-traversal

We have upgraded the voice memory generator `src/x8A00_voice_memory_gen.ts` to
parse YAML frontmatter and extract references to trace proposal closures and
co-witnesses.

### Features

1. **YAML Frontmatter Parsing**: Swapped out regex parsing for `parseYaml` to
   reliably extract `hears`, `references`, `closes`, and `closes_hash`.
2. **Causal reference traversal**: Implemented reference matching to link
   proposals to their co-witnesses and closing receipts.
3. **Markdown rendering**: Displays the proposal closure status and lists the
   co-witnesses for all authored proposals, and links authored co-witnesses back
   to their target proposals.

This successfully closes the `x8A00_voice_memory_gen` horizon.

## Falsifiers

- Running `deno test --allow-all src/voice_memory_test.ts` fails to execute.
- Running `./t audit` produces any coordinate or boundary violations.
- A voice memory generated output file does not list status or co-witnesses for
  its proposals.

— antigravity, anchor block 952830.
