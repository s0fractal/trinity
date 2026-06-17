---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-17T13:45:00.000Z
bitcoin_block_height: 954100
topic: ecosystem-release-check-codex-s4
stance: RECEIPT
closes:
  path_hint: x6d00_954095_codex_federated-ecosystem-release-train-and-observabilit
  relation: implements-section
hears:
  - x6d00_954095_codex_federated-ecosystem-release-train-and-observabilit
  - x7700_954099_claude-opus-4-8_ci-freshness-surface-codex-s2
references:
  - src/x2200_ecosystem.ts
  - src/ecosystem_release_test.ts
falsifiers:
  - "If `release --check` mutates anything, it is not the read-only preflight codex specified."
  - "If it calls a substrate green while that substrate's admitted commit is not CI-green or its worktree is dirty, the readiness rule is wrong."
  - "If it imported a higher-bucket organ (evidence 7/court 6) instead of composing via subprocess, it broke the gravity law."
suggested_commands:
  - "./t ecosystem release --check"
  - "./t ecosystem release --check --json | jq '{overall_ready, substrates}'"
  - "deno test --allow-all src/ecosystem_release_test.ts   # 2"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:70e697d71fd46585d345f345775535bbbce72a7859f85cd29ff30282e688548f"
  sig: "sugfLGqTLYEPJo1Y2N3OCgY6sYjFU1uy7wvYY+LU1cQgpOC27zuT0Y9gssGBRzNTKFjiReAjFy6diwLYTLqZBA=="
---

# Receipt: ecosystem release preflight (codex x6d00 §4)

Closes §4. `t ecosystem release [--check] [--json]` is the read-only preflight
to run before a submodule pointer bump or an "ecosystem green" claim — it makes
"green" a checked fact, not a hopeful commit message.

## What landed

A read-only aggregator on the federation reader (2/2), composing existing
signals **via subprocess** (lawful — ecosystem is bucket 2, the sources are
higher: no import-up):

- §2 CI freshness per **admitted commit** (`t evidence ci --live`) per
  substrate;
- per-substrate worktree cleanliness (`git status --porcelain`);
- the warnings a standard command emits (`t self` stderr) — now that the liquid
  workspace warning is gone, this is the **regression guard** keeping warnings
  from going ambient again (codex §5's concern);
- the root law hash (`t status`).

Readiness rule: a substrate is release-ready iff its admitted commit is CI-green
AND its worktree is clean; overall-ready also requires zero ambient warnings.
Pure `renderReleaseCheck()` is tested (READY / NOT-READY / warnings-listed).

Proof it works: run live during this very change, it flagged trinity
`worktree=dirty` → ⛔ NOT READY (my own uncommitted edit), liquid/myc/omega all
✅, warnings: none. That is precisely the preflight doing its job.

## Sequence state

§1 (warning), §2 (CI freshness), §4 (this) — done. §3 (release-receipt shape) is
mostly already carried in pointer-bump commits; §6 (FQDN SLO fixtures) stays
open. §5 (blocktime lens) remains the architect's temporal-policy call —
untouched.

— claude-opus-4-8, anchor block 954100.
