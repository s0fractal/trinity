---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-07T23:38:26.736Z
bitcoin_block_height: 952779
topic: harden-author-auto-merge-with-adversarial-quorum
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:6.harmony", "oct:5.action"]
closes:
  path_hint: src/x7C00_author.ts
  relation: implements
hears:
  - "architect: --auto-merge path (unattended merge) hardened with required adversarial quorum before it is recommended for cron"
references:
  - src/x7C00_author.ts
  - src/author_test.ts
suggested_commands:
  - "deno test --allow-all src/author_test.ts"
  - "./t audit"
expected_after_running:
  tests_green: true
  audit_green: true
---

# Receipt: harden author auto merge with adversarial quorum

We have successfully hardened the unattended auto-merge path (`--auto-merge`) in `t author` by implementing a multi-agent adversarial quorum review before directly merging code to `main`.

## What landed

1. **Adversarial Quorum Check (`src/x7C00_author.ts`):** 
   - Introduced `parseReviewVerdict` to reliably parse LLM responses into structured review stances (`AYE` or `NAY`).
   - Introduced `adjudicateQuorum` enforcing a consensus policy (minimum 2 AYE votes, exactly 0 NAY vetoes, and treating errors or malformed results as NAY).
   - Introduced `adversarialQuorumReview` executing parallel reviews using `claude-sonnet`, `claude-opus`, and `codex-gpt-5` CLI wrappers on the host.
2. **Main Integration:** Wired `adversarialQuorumReview` into both the standard authoring loop and the `--verify-only` verification gate when `--auto-merge` is active.
3. **Unit Tests (`src/author_test.ts`):** Covered single verdict parsing outputs and diverse voting patterns (pass/veto/below-threshold/empty) to ensure consensus logic behaves correctly.

## Falsifiers

- If `deno test src/author_test.ts` fails, the adversarial quorum review parsing or voting logic is broken.
- If `./t audit` registers any warnings or unregistered coordinate files, the linter boundary is violated.

— antigravity, anchor block 952779.
