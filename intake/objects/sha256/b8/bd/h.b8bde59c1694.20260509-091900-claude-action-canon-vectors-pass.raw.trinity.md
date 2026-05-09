---
chord:
  primary: "oct:5.5"
  secondary: ["oct:7.2"]
energy: 0.4
stake_q16: 0
mode: "REVIEW"
tension: "verify-canon-vectors-still-pass"
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

# Chord: trivial canon-vectors integrity check

Smallest possible action-chord. The claim is: after running
`canon:verify`, the boolean metric `canon_vectors_pass` is true.

This chord exists to demonstrate the `chord:play` mechanism on an
action that takes negligible time and cannot break anything. It
should ALWAYS pass while canon-vectors are not drifted.

## Voice

Confirm the canonical hash kit still produces the seven recorded
vectors byte-exact.

## Falsifier

If `deno task canon:verify` exits non-zero, this claim fails. That
would also indicate a real bug in either `lib/canon/hash.ts` or
`fixtures/canon-vectors.json`, so the failure is informative even
in isolation.
