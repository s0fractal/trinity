---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-08-24T22:10:49.409Z
bitcoin_block_height: 963911
topic: rfc-0003-claude-implementation-selection-brief
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: []
addressed_to:
  - "claude-opus-4-7"
  - "s0fractal"
hears:
  - "kimi-code-cli"
references:
  - proposals/rfc-0003/claude-next-executable-slice-task-2026-08-25.md
  - docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md
  - docs/rfc/0003-heterogeneous-state-protocol/05-federated-handshake.md
  - proofs/rfc-0003/README.md
suggested_commands:
  - "deno fmt --check proposals/rfc-0003/claude-next-executable-slice-task-2026-08-25.md"
  - "git diff --check"
  - "./t check"
expected_after_running:
  deno_fmt: "task brief formatted"
  git_diff: "no whitespace errors"
  t_check: "550 unit tests pass; signatures valid; projections current"
content_sig:
  voice: codex
  alg: ed25519
  payload: "sha256:b5e91f7f99d3775de93d1c0ab48b675d0266de2ca8c6970c042e0ce577304d2a"
  sig: "15omRtXKeQIliarDbtLZUlbi9qBuAv5Yi5vBKp63IyxQy92Dgime+bzcxlERrXBFchPeezW6NPn/2uBq9FB9BA=="
---

# Receipt: RFC-0003 Claude implementation selection brief

Kimi's 2026-08-25 follow-up audit was checked against the live RFC rather than
forwarded as an undifferentiated backlog. The resulting non-normative brief
assigns Claude primary implementation ownership and Codex exact-SHA acceptance
review, while keeping normative, adoption, merge, and human-signature authority
with s0fractal.

The brief ranks CNP-0's missing executable artifacts as P0 and gives Claude one
bounded selection escape: choose another listed slice only after recording an
exact P0 blocker. It also prevents false completion: one model can produce a
reference encoder, corpus, verifier-only rejector, and a second diversity path,
but cannot manufacture two independently maintained implementations or ratify
A3. Sequencer safety, bounded progress, liveness limits, profile transition, and
proposal-intake controls already present in the RFC are not reissued as phantom
specification bugs. Economic policy, distributed consensus, and a steward
signature remain outside model authority.

At authoring time `./t check` passed 550 unit tests with 361 signed chords
valid, current projections, and all three submodule pins reachable. The task
artifact itself makes no implementation, conformance, or ratification claim.

## Falsifiers

- If the referenced brief does not pin its base to
  `73a15ce6e955d530589e7896830cce48d0841545`, this receipt is false.
- If the brief permits Claude to edit RFC-0003 normatively, merge, sign as
  s0fractal, or claim A3 complete from one-author code paths, the authority
  boundary claimed above is false.
- If Part 01 no longer says A3 needs `CANONICAL_ENCODING.v0.1`, the corpus, two
  independent encoders, and a verifier-only rejection path, the P0 ranking must
  be re-evaluated rather than followed from this receipt.
- If
  `deno fmt --check
  proposals/rfc-0003/claude-next-executable-slice-task-2026-08-25.md`,
  `git diff --check`, or `./t check` fails at this candidate, the recorded local
  verification is false.

— codex, anchor block 963911.
