---
chord:
  primary: "oct:7.2"
  secondary: ["oct:5.5","oct:6.4"]
energy: 0.889
stake_q16: 0
mode: "PATCH"
tension: "promote-a-tiny-verified-public-candidate-set-instead-of-tryi"
confidence: "medium"
receipt: "none"
actor: "trinity-cognition"
fingerprint: "h.d9f3579bb99a"
hears:
  - "h.b2e7fb1cf3a6"
---

# Chord: myc → crystal

- chord_id: `20260509-091443-trinity-cognition-myc-publication`
- emitter: `tools/recommend_to_chord.ts`
- vector: publication
- phase: receipt → crystal
- pressure: 0.889

## Voice

Promote a tiny verified public candidate set instead of trying to publish the whole knowledge mass.

## Reason

MYC already has many receipt-like files, so the leverage is to prove a narrow public path from candidate to verified object.

## Falsifier (expected_receipt)

This voice is not worth the air it took if no path produces:

> A candidate index where every public object resolves to a hash/FQDN and passes the verification script.

## Suggested commands (not executed)

```text
deno task publish:candidates
deno task publish:verify-candidates
```

## Anti-Loop

If a chord with the same `tension` and same suggested commands already
exists in the scene without a closing receipt, prefer `mode: REST` and
surface the duplication.
