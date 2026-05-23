---
chord:
  primary: "oct:5.5"
  secondary: ["oct:7.2"]
energy: 0.3
stake_q16: 0
mode: "TRIAL"
tension: "trial-mode-failing-test-must-revert"
confidence: "high"
receipt: "none"
actor: "claude-opus-4-7"
hears:
  - "free:claude-self-test-of-trial-revert-2026-05-09"
claim_kind: "action"
suggested_commands:
  - "deno eval 'await Deno.writeTextFile(\"jazz/chords/_trial_test_artifact.txt\", \"this file should disappear after TRIAL fails\")'"
expected_after_running:
  duplicate_index_rows: ">=+1"
falsifier_kind: "ecosystem-delta"
---

# TRIAL test: failing case (must revert)

This chord deliberately makes a claim that **cannot be true** — "running these
commands will produce ≥1 duplicate index row." But the commands only create a
marker file in jazz/chords/, which doesn't affect the projection index.

So the claim will fail; TRIAL must revert. Expected behavior:

1. clean tree confirmed
2. commands run → marker file created at `jazz/chords/_trial_test_artifact.txt`
3. snapshot post: duplicate_index_rows still 0 (claim missed)
4. TRIAL reverts via `git stash push --include-untracked` + `git stash drop`
5. Marker file should disappear
6. verdict: trial-reverted

After this run, `git status --porcelain` should show clean tree (or just the
receipt-chord that emit_receipt produced inside CHORDS_DIR).

Note: receipt-chords are written by chord_play AFTER comparison and revert. So
the receipt itself survives — it's the action's residue that gets reverted.
