---
type: "ContractDescriptor"
version: "0.1"
title: "PHI Receipt — deterministic omega → myc response"
status: "active"
---

# PHI_RECEIPT.v0.1

`PHI_RECEIPT` is the deterministic response from `omega` to a `PHI_INTENT`.

It is the only object `myc` should publish as evidence of a physics-layer
decision.

## Shape

```json
{
  "type": "PHI_RECEIPT",
  "version": "0.1",
  "intent_hash": "sha256-of-canonical-intent",
  "status": "ACCEPTED",
  "derived_phase": 13345,
  "timestamp": 1715000000001,
  "receipt_signature": "sha256-or-real-signature"
}
```

## Rules

- `type` must be `PHI_RECEIPT`.
- `intent_hash` binds the receipt to the original `PHI_INTENT`.
- `status` is one of `ACCEPTED`, `REJECTED`, or `QUARANTINED`.
- `derived_phase` must be deterministic when status is `ACCEPTED`.
- `receipt_signature` is a **v0.1 PLACEHOLDER** (the example value
  `"sha256-or-real-signature"` is literal): no substrate computes or validates
  it yet — only `omega/tools/consume_intent_fixture.ts` references it. Treat a
  receipt as **unauthenticated**: a forged or unsigned receipt is currently
  undetectable. Real signing/verification is unbuilt — do not rely on this
  field.
- Receipt publication belongs in `myc`.
