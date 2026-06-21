---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-21T13:59:47.371Z
bitcoin_block_height: 954705
topic: myc-publication-readiness-audit-clean-agpl-prepped
stance: RECEIPT
addressed_to: [s0fractal, codex, antigravity]
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation"]
references:
  - myc/LICENSE
  - myc/NOTICE
  - myc/LICENSE-INTENT.md
  - myc/.gitignore
  - myc/README.md
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && git log --oneline -1   # 1eccbd2, on main, NOT pushed"
  - "git -C myc grep -nIE 'BEGIN .* PRIVATE|api[_-]?key|secret' || echo clean"
expected_after_running:
  myc_check: "green — 162 tests, verify-projections ok, protocol audit ok"
  pending_sovereign: "architect pushes myc + flips GitHub visibility + bumps trinity submodule pointer"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:42ff34444f6e510f2f956a724976fd7495543d1e2da73169bad2a461c0aed6db"
  sig: "WLHFNsk6InJEsFLVGyatBSMG2w47Fwpar4EotfYG3AGckPYLF8Tni29sE2O4xRxxvjwjQK+WT/g6eutHMrfRBg=="
---

# Receipt: myc publication readiness — audit clean, AGPL prepped

Architect set the direction: prepare `myc` for publication. Did the
pre-publication readiness audit (same discipline as trinity's pre-pub) and the
buildable prep. The publish itself stays sovereign.

## Readiness audit — CLEAN

- **No secrets** in the tracked tree, and **none across all 133 history
  commits** (keys/tokens/PGP/AWS scanned). No deleted sensitive files in
  history.
- **private/ + sealed/ are safe by design.** `.gitignore` excludes `private/**`
  (only 3 explanatory READMEs tracked) and sealed `.secret/.key/.token/.payload`
  (only README + 1 benign example + 2 protocol drafts tracked). Publishing
  exposes no private or sealed payload.
- **Standalone + green.** `deno task check` passes on its own — 162 tests,
  verify-projections ok, protocol audit ok (188 files); no CI dependency on
  trinity.
- **Honest.** README is candid about maturity (draft space; "not yet
  authenticity — signed descriptors await key custody").

## Prep landed (myc `1eccbd2`, on main, NOT pushed)

- AGPL-3.0-or-later matching the federation: `LICENSE` (verbatim AGPL text from
  omega), `NOTICE` (Copyright (C) 2025-2026 s0fractal
  <anna.maliyenko@gmail.com>, SPDX, mycelium-protection rationale, myc
  provenance anchor), `LICENSE-INTENT.md` (interim-stopgap reasoning), README
  License section.
- Polish: genericized two hardcoded `/Users/s0fractal` paths in `x0100_myc.ts`.

## Sovereign step remaining (architect)

Publication reverses the standing "submodules stay private" policy for myc. The
repo-visibility flip + `git push` (and then bumping trinity's myc submodule
pointer to the pushed SHA) are the architect's to perform. Until pushed,
trinity's pointer intentionally still references the pre-prep myc SHA.
Signatures/authenticity remain gated on key custody (honestly disclosed in the
README), not a publish blocker.

## Falsifiers

- A secret or private/sealed payload is found in myc's tracked tree or history.
- `cd myc && deno task check` is not green.
- myc lacks LICENSE/NOTICE, or they disagree with the federation's AGPL stance.
- A `private/**` or sealed payload file becomes tracked.

— claude, anchor block 954705.
