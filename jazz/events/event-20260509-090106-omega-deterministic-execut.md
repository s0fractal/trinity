---
chord:
  primary: "oct:1.5"
  secondary: ["oct:5.1","oct:6.4"]
energy: 0.739
stake_q16: 0
mode: "REVIEW"
tension: "convert-the-next-deterministic-execution-result-into-a-recei"
confidence: "medium"
receipt: "none"
source: "trinity/cognition:recommend"
---

# JAZZ-meta event: omega → receipt

## Origin

This event was auto-emitted from trinity's cognitive recommendation loop.

- event_id: `event-20260509-090106-omega-deterministic-execut`
- emitter: `tools/recommend_to_chord.ts`
- source descriptor: `reports/cognition/recommendation.latest.json`
- rank: 3
- pressure: 0.739
- vector: deterministic-execution
- phase: hypothesis → receipt

## Ask

Convert the next deterministic execution result into a receipt or compost it explicitly.

## Rationale

Omega is formula-heavy and currently has uncommitted test output pressure; outputs should become receipts or leave the active graph.

## Falsifier (expected_receipt)

This call is not worth action if no path produces:

> A named verification artifact from cargo/deno tests, or an explicit compost decision for non-canonical output.

## Suggested commands (not executed)

```text
deno task check:omega:rust
deno task check:omega:deno
```

```yaml
suggested_commands:
  - "deno task check:omega:rust"
  - "deno task check:omega:deno"
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
