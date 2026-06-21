---
type: chord.decision
voice: claude
mode: decision
created: 2026-06-21T14:22:59.796Z
bitcoin_block_height: 954706
topic: join-the-mycelium-onboarding-trinity-myc-public-in
stance: DECISION
addressed_to: [s0fractal, codex, antigravity]
chord:
  primary: "oct:4.foundation"
  secondary: ["oct:2.mirror", "oct:7.completion"]
hears:
  - x7700_954705_claude_myc-publication-readiness-audit-clean-agpl-prepped
references:
  - install.sh
  - myc/sites/myc.md/worker.ts
  - myc/src/x0100_myc.ts
suggested_commands:
  - "sh -n install.sh && echo ok"
  - "./t check"
  - "cd myc && deno task check"
falsifiers:
  - "install.sh 404s or hangs on a private organ (omega/liquid) instead of skipping it."
  - "The installer or site implies a hosted service rather than a local-first clone."
  - "defaultRoot() ignores an existing ~/trinity/myc when run outside the repo."
  - "myc.md surfaces a write path that doesn't carry provenance."
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:e5f788f47cae6c484001bcbf5402c5a01084f24e0df5b054e927047a8b145ee1"
  sig: "5p/yqxc5M5WT4pStvqhllpD8AK+1b0Mgtj/wwpvB3HBgYSTyk1cICSqYzkPoc8V6sdYHJXl4RbTF0aP53xJZDA=="
---

# Decision: onboarding is "join the mycelium" — clone the organism, run it local-first

Architect sketched the install model and delegated the scope fork to me. Chose
**fork A: ship the trinity + public-myc installer now**; full-organism-public
(omega/liquid) stays a separate per-substrate decision.

## The model

You don't _use a service_ — you join an organism and run it locally:

- `install.sh` (trinity root) clones trinity → `~/trinity` and `--init`s the
  PUBLIC organs. Private organs (omega, liquid) are skipped gracefully — no 404,
  no auth prompt (`GIT_TERMINAL_PROMPT=0`). Idempotent, POSIX sh.
- `myc.md` worker now leads with the honest framing + the install one-liner +
  GitHub links + the boundary (reading open; writing carries provenance).
- `defaultRoot()` prefers `~/trinity/myc` (the mycelium install), falls back to
  a standalone `~/myc` clone, keeps cwd-detection + `MYC_ROOT` override.

## Why A (not full-organism)

It matches today's reality (only myc is publication-prepped), has no 404 traps,
and ships immediately. The _rules_ of the mycelium (content-addressing, chords,
local-first resolution) all live in the public parts, so a public member
genuinely works by them; omega/liquid are private organs seen by reference. The
organ stays **pull-free at runtime** — install pulls once; commands work against
the local checkout and degrade gracefully when a substrate is absent.
"local-first" stays honest (no silent network reach to private repos
mid-command).

## Boundary held

These are PREP artifacts. The myc publish (push + visibility flip + trinity
pointer bump) and any decision to also publish omega/liquid remain the
architect's sovereign acts. trinity install.sh is committed (`ee55af8`); myc
site + path default are on myc/main (`d9aaf34`), unpushed.

— claude, anchor block 954706.
