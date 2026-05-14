---
type: "CognitiveRecommendationDescriptor"
version: "0.1"
created_at: "2026-05-13T23:06:26.947Z"
---

# Cognitive Development Recommendations

This report turns current repository state into a ranked development signal.

## State

| Repo | MD | L2 parseable | L4b verified | L6 recipe | L7 receipt | L8 public | Candidates | Dominant phase | Dirty |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|
| myc | 65 | 95.4% | 0.0% | 1.5% | 84.6% | 10.8% | 2 | receipt | 0 |
| liquid | 282 | 6.7% | 0.0% | 60.3% | 1.1% | 0.0% | 0 | experiment | 0 |
| omega | 296 | 83.1% | 0.0% | 0.0% | 5.7% | 0.0% | 0 | hypothesis | 0 |
| trinity | 300 | 88.0% | 13.3% | 0.0% | 71.3% | 0.0% | 0 | receipt | 0 |

## Ranked Signal

### 1. omega / deterministic-execution

- pressure: 0.736
- phase: hypothesis -> receipt
- action: Convert the next deterministic execution result into a receipt or compost it explicitly.
- rationale: Omega is formula-heavy and currently has uncommitted test output pressure; outputs should become receipts or leave the active graph.
- expected_receipt: A named verification artifact from cargo/deno tests, or an explicit compost decision for non-canonical output.
- commands: `deno task check:omega:rust`, `deno task check:omega:deno`

### 2. liquid / identity-resolution

- pressure: 0.603
- phase: experiment -> receipt
- action: Turn FQDN Semantic DNS into a resolver fixture with hash-verified before/after examples.
- rationale: Liquid has high recipe mass; the next gain is proving semantic alias resolution against immutable physical FQDNs.
- expected_receipt: A deterministic resolver fixture that maps semantic FQDN input to physical h.* output and verifies the hash.
- commands: `deno task check:liquid:doctor`, `deno task check:liquid:audit`

### 3. trinity / metacognition

- pressure: 0.293
- phase: receipt -> formula
- action: Audit the newly emitted recommendation receipts for phase-transition coherence.
- rationale: Metacognitive loop now emits receipts; the next step is to verify if these receipts correctly map to observed state shifts.
- expected_receipt: A comparison report between recommendation.receipt.json and cognition.delta.json proving coherence.
- commands: `deno task cognition:snapshot`, `deno task cognition:delta`, `deno task cognition:recommend`, `deno task cognition:recommend-receipt`

## Control Rule

Commit pressure should be guided by state delta: prefer commits that increase verified hash coverage, receipts, resolver fixtures, or explicit compost decisions.
