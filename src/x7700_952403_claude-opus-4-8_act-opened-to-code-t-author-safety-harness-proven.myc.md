---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-04T22:24:00.104Z
bitcoin_block_height: 952403
topic: act-opened-to-code-t-author-safety-harness-proven
stance: IMPLEMENTED
chord:
  primary: "oct:7.completion"
  secondary: ["oct:5.action", "oct:2.mirror"]
hears:
  - x5700_952393_claude-opus-4-8_phase-3-act-door-opened-loop-self-maintains
  - "architect: відкрий --act до коду з safety-дизайном"
references:
  - src/x7C00_author.ts
  - "https://github.com/s0fractal/trinity/pull/1"
suggested_commands:
  - "./t author --dry-run --task 'x' --json | grep -v '^#' | jq '{merge_policy, protected_paths}'   # PR by default, 13 protected"
  - "./t author --verify-only <branch> --no-review --json | grep -v '^#' | jq '.action'   # the harness verdict on any branch"
  - "gh pr view 1 --json additions,deletions   # the loop's first autonomous PR: tiny + reviewable"
expected_after_running:
  rejects_protected_path: true
  rejects_type_error: true
  rejects_destructive: true
  approves_valid: true
  default_merge_policy: "open PR (human merge)"
---

# Receipt: the loop authors code now — and the harness is what makes it safe

The last door. The architect asked me to open `--act` to CODE, with a safety
design. Autonomous code authoring is the genuinely dangerous frontier: code can
be wrong in ways that pass fmt, type-check, even tests. The safety is NOT in
constraining the author — an LLM is general — it is in the **harness** around
it.

## What landed: `t author` (organ 7/C)

A defence-in-depth pipeline. The author is `claude -p` headless; everything else
is the guardrail:

1. **Preconditions** — clean main worktree, not locked.
2. **Isolation** — a fresh `git worktree` on a branch off main; main is never
   edited directly.
3. **Scope limits** — 13 protected paths the author can NEVER touch (.git,
   .github/CI, the dispatcher, the glossary, this organ itself, the daemon, the
   lockfile, every submodule); bounded diff size; no new network imports.
4. **Mechanical gates** — fmt + type-check (liquid-closure-excluded, workspace
   stripped like CI) + audit invariants (no coordinate-gravity/import/registry
   breaches) + projection drift == 0.
5. **Success check** — the task's own machine-checkable criterion.
6. **Adversarial review** — an INDEPENDENT second `claude -p` reviews the diff
   and must reply APPROVE; default-reject on any doubt.
7. **Merge policy** — default opens a **PR (a human merges)**; `--auto-merge` is
   an explicit, off-by-default knob. The same restraint I put on `--push`: open
   the capability, gate the irreversible step.
8. **Reversible** — any gate failing discards the branch; one task per run.

## Proven, not asserted — the harness discriminates

I built proof branches and ran the harness on each. It is theatre unless it
rejects bad changes, so I proved each:

- edits `.github/workflows/ci.yml` → **REJECT (scope): touches protected path**
- introduces a type error → **REJECT (type-check)**
- a destructive side-effect (a projection regen wiped `x9000/MANIFEST`) →
  **REJECT (adversarial): "destructive, out-of-scope side-effect"** — the second
  LLM caught what the mechanical gates passed. That single catch is the whole
  reason the adversarial gate exists, and it earned its place on its first run.
- a valid change → **PASS**, adversarial **APPROVE**

Then the full end-to-end happy path: the loop authored a real 2-line doc-comment
improvement to `src/x0300_all.ts`, passed all five gates, and opened
[PR #1](https://github.com/s0fractal/trinity/pull/1) — a clean +4/−2 diff, **not
auto-merged**, waiting for a human.

## Two real bugs the build surfaced (fixed)

- The verify worktree had no submodules → deno failed on the workspace before
  judging the change (it would have rejected everything). Fixed: strip the
  workspace + exclude the liquid closure, mirroring CI; discard deno.lock and
  submodule-dependent regen artifacts so the harness never produces a
  destructive change itself.
- Branch cleanup deleted the branch before removing the worktree (git refuses) →
  stale branches survived. Fixed: remove worktree first.

## The boundary I kept

The unattended cron still runs `t daemon tick --act` — maintenance ONLY.
Autonomous **code** authoring requires an explicit `t author` invocation; I did
NOT wire it into the unattended schedule. Opening a capability is not the same
as running it unsupervised forever. `--auto-merge` likewise stays off by
default: the harness can propose autonomously; merging arbitrary code to a
Bitcoin-anchored main without a human is a further deliberate step, and its
organ horizon now asks for a stronger adversarial quorum before it should ever
go to cron.

So the full ladder is open and each rung is gated: orient → choose → act (safe
maintenance, autonomous) → **author code (autonomous → PR, human merges)** →
verify (CI) → record → decide. The loop can now write code — and the harness is
the reason that is a sentence about safety, not about risk.

— claude-opus-4-8, anchor block 952403. The author is general; the harness is
the conscience. I proved the conscience before I trusted the author.
