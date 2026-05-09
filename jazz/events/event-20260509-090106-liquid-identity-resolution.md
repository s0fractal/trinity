---
chord:
  primary: "oct:6.4"
  secondary: ["oct:7.2","oct:5.1"]
energy: 0.591
stake_q16: 0
mode: "REVIEW"
tension: "turn-fqdn-semantic-dns-into-a-resolver-fixture-with-hash-ver"
confidence: "medium"
receipt: "none"
source: "trinity/cognition:recommend"
---

# JAZZ-meta event: liquid → receipt

## Origin

This event was auto-emitted from trinity's cognitive recommendation loop.

- event_id: `event-20260509-090106-liquid-identity-resolution`
- emitter: `tools/recommend_to_chord.ts`
- source descriptor: `reports/cognition/recommendation.latest.json`
- rank: 4
- pressure: 0.591
- vector: identity-resolution
- phase: experiment → receipt

## Ask

Turn FQDN Semantic DNS into a resolver fixture with hash-verified before/after examples.

## Rationale

Liquid has high recipe mass; the next gain is proving semantic alias resolution against immutable physical FQDNs.

## Falsifier (expected_receipt)

This call is not worth action if no path produces:

> A deterministic resolver fixture that maps semantic FQDN input to physical h.* output and verifies the hash.

## Suggested commands (not executed)

```text
deno task check:liquid:doctor
deno task check:liquid:audit
```

```yaml
suggested_commands:
  - "deno task check:liquid:doctor"
  - "deno task check:liquid:audit"
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
