---
type: "ContractDescriptor"
version: "0.1"
title: "Chord Claim Kinds"
status: "active"
---

# Chord Claim Kinds

A chord is a typed speech act. Different speech acts make different
promises about the world and are verified by different procedures.

This contract lists the four claim kinds Trinity recognizes today and
how each is verified by deterministic scanner output.

## 1. claim_kind: "action"

The chord proposes an action and bets on a measurable post-state.

```yaml
claim_kind: "action"
suggested_commands:
  - "deno task intake:ingest intake/raw/*.md"
expected_after_running:
  L4b_hash_verified: ">=+3"
  duplicate_index_rows: "==0"
falsifier_kind: "ecosystem-delta"
```

Verification:

1. snapshot pre
2. run `suggested_commands`
3. snapshot post
4. for each metric in `expected_after_running`, check post against pre + comparator
5. emit a receipt-chord with the result; promote the original chord to
   `experiment` (claim met) or `compost` (claim missed)

`expected_after_running` is the **promise**. If it isn't met, the chord
is composted with reason. If a `stake_q16` was attached, it may be
slashed (only for falsifiable misses, never for "I disagree").

### 1.1. mode: "TRIAL" (reversibility-first action)

An action chord with `mode: TRIAL` opts into automatic revert when the
claim is missed. Implements the reversibility-first principle from
governance chord `h.1a8cddefa3dc`: cheap action + rollback is preferred
over expensive deliberation when the action is reversible.

```yaml
claim_kind: "action"
mode: "TRIAL"
suggested_commands:
  - "some risky local mutation"
expected_after_running:
  some_metric: ">=+1"
```

Verifier behavior under TRIAL:

1. Refuse to run unless working tree is clean (`git status --porcelain`
   returns empty).
2. Run `suggested_commands`.
3. Snapshot post and compare against pre.
4. If all metrics pass → keep changes, emit receipt with verdict
   `passed`.
5. If any metric fails → run `git stash push --include-untracked`
   then `git stash drop`, restoring the pre-trial state. Emit receipt
   with verdict `trial-reverted`.

TRIAL is NOT a substitute for thinking. It is appropriate for
mutations that:

- are local (no submodule, no external services)
- are reversible by working-tree operations alone
- have small, computable falsifier (e.g., ecosystem-delta metric)
- would cost more in deliberation than in attempt + revert

It is NOT appropriate for:

- pushes to remote
- writes to public surfaces (myc/public/)
- changes that mutate omega frozen invariants
- anything outside the local trinity working tree

Trial revert uses `git stash drop` rather than `git reset --hard`
because stash preserves a momentary backup if the user wants to
recover.

## 2. claim_kind: "future-fantasy"

The chord is a present-day raw idea that will become actionable later.
It declares the conditions under which it should be promoted from
raw-fantasy to proposal.

```yaml
claim_kind: "future-fantasy"
becomes_actionable_when:
  L4b_hash_verified: ">=30%"
  trinity_compost_count: ">=5"
  canon_vectors_pass: "==true"
```

Verification:

1. snapshot now
2. for each metric in `becomes_actionable_when`, check current value
3. if all conditions met, emit a promotion-chord that points at the
   original chord with `phase_to: "proposal"`
4. otherwise, the chord stays dormant — silent, no receipt

`becomes_actionable_when` is **not a promise**. It is a wakeup condition.
A fantasy chord may sit in the scene indefinitely; its only obligation
is to declare when it should stop being a fantasy.

## 3. claim_kind: "observation"

The chord records a snapshot or perception. It makes no claim about
future delta or activation.

```yaml
claim_kind: "observation"
observed:
  L4b_hash_verified: "1.1%"
  trinity_repo_verified_count: 7
```

Verification: trivial — just record. Observation chords are inert
ledger entries; they never auto-execute.

## 4. claim_kind: "critique"

The chord asserts something is wrong about another chord. It must be
falsifiable but its falsifier targets a chord, not an ecosystem state.

```yaml
claim_kind: "critique"
critiques: "h.<other-chord>"
finding: "expected_after_running references metric not produced by scanner"
falsifier: "if scanner_core.ts emits the named metric, this critique is wrong"
```

Verification: by inspection of the targeted chord plus the scanner
output. A successful critique composts the targeted chord (with reason
pointing at the critique).

## Comparator Grammar

Both `expected_after_running` and `becomes_actionable_when` use the
same tiny comparator language:

| Form | Meaning |
| --- | --- |
| `">=+N"` | post is at least pre + N (delta-positive, integer N) |
| `"<=-N"` | post is at most pre - N (delta-negative) |
| `">=N%"` | metric value is at least N percent (absolute) |
| `"<=N%"` | metric value is at most N percent (absolute) |
| `">=N"` | absolute >= N |
| `"<=N"` | absolute <= N |
| `"==N"` | absolute == N |
| `"==true"` / `"==false"` | boolean check |

The comparator is intentionally narrow. If a chord needs richer logic,
it should be decomposed into multiple chords, not a more complex grammar.

## Available Metrics

The verifier tool reads these from scanner output (no LLM required):

- `L4b_hash_verified` — count or percent
- `L4b_hash_verified_count` — count only
- `L4b_hash_verified_pct` — percent only
- `duplicate_index_rows` — integer
- `malformed_index_lines` — integer
- `canon_vectors_pass` — boolean
- `trinity_repo_verified_count` — integer (L4b in trinity repo only)
- `phase[receipt]`, `phase[formula]`, etc. — counts per phase
- `compost_count` (per repo) — integer

New metrics MAY be added by extending the scanner; the contract version
should bump (`CHORD_CLAIM.v0.2`) when this happens.

## Why Four Kinds and Not One

A single "claim" field would force every chord to either lie or stay
silent. Critiques aren't promises. Observations aren't bets. Fantasies
aren't actions. Squashing them into one shape produces either
ceremony (every chord must declare expected delta) or noise (every
chord declares trivially-true expected delta).

Four narrow kinds allow each chord to be honest about what kind of
speech act it is.
