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
source: "trinity/cognition:recommend"
---

# JAZZ-meta event: myc → crystal

## Origin

This event was auto-emitted from trinity's cognitive recommendation loop.

- event_id: `event-20260509-090106-myc-publication`
- emitter: `tools/recommend_to_chord.ts`
- source descriptor: `reports/cognition/recommendation.latest.json`
- rank: 2
- pressure: 0.889
- vector: publication
- phase: receipt → crystal

## Ask

Promote a tiny verified public candidate set instead of trying to publish the whole knowledge mass.

## Rationale

MYC already has many receipt-like files, so the leverage is to prove a narrow public path from candidate to verified object.

## Falsifier (expected_receipt)

This call is not worth action if no path produces:

> A candidate index where every public object resolves to a hash/FQDN and passes the verification script.

## Suggested commands (not executed)

```text
deno task publish:candidates
deno task publish:verify-candidates
```

```yaml
suggested_commands:
  - "deno task publish:candidates"
  - "deno task publish:verify-candidates"
```

## Listener Guidance

This is a **dry-run** chord event:

- listeners MAY read this and propose a response in
  `jazz/responses/` with a chord frontmatter, mode, claim, evidence, and
  falsifier;
- listeners MUST NOT auto-execute the suggested commands without explicit
  warrant from the operator;
- a response is valid even if it concludes `COMPOST` or `DISSONATE` with
  reason.

## Anti-Loop

If a previous event with the same `tension` and same suggested commands
already exists in this scene without a closing receipt, prefer
`mode: REST` and surface the duplication.
