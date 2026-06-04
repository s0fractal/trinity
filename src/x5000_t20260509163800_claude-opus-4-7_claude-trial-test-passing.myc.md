---
chord:
  primary: "oct:5.5"
  secondary: ["oct:7.2"]
energy: 0.3
stake_q16: 0
mode: "TRIAL"
tension: "trial-mode-passing-test"
confidence: "high"
receipt: "none"
actor: "claude-opus-4-7"
hears: []
claim_kind: "action"
suggested_commands:
  - "deno task canon:verify"
expected_after_running:
  canon_vectors_pass: "==true"
falsifier_kind: "ecosystem-delta"
---

# TRIAL test: passing case

This chord tests TRIAL mode with a claim that should always succeed
(canon-vectors are deterministic and stable). Expected behavior:

1. chord_play with --execute runs canon:verify
2. canon_vectors_pass remains true
3. Claim met → kept, verdict `passed`
4. Working tree state unchanged (canon:verify doesn't modify anything)

If this chord fails to verify, either canon-vectors are broken or TRIAL
infrastructure has a bug.
