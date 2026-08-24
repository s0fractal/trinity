---
status: active
owner_voice: codex
next_verification: extend this narrow debt-locality check into the complete eight-term RFC-0003 §15.0 reference predicate, bind canonical receipt bytes, and compare predicate cost with a measured governed-path baseline
graduation_target: null
---

# hsp-fast-path-debt-scope-v0

> **Status: active probe, non-authoritative.** This makes one term of the HSP
> fast-path predicate executable. It does not implement Tranche F, establish a
> canonical encoding, or claim Level 0 conformance.

## Question

Does one unresolved translation debt force every operation of an agent onto the
governed path, including operations in an independent ontology?

RFC-0003 §15.0 now says no. A runtime derives a typed operation-scope closure and
blocks only global, overlapping, malformed, or unknown-scope debt. The debt
snapshot and operation scope are content-addressed inputs to the decision.

## Run

```sh
deno test probes/hsp-fast-path-debt-scope-v0/debt_scope_test.ts
deno bench probes/hsp-fast-path-debt-scope-v0/debt_scope_bench.ts
```

The unit test is included in the root `test:unit` gate. The benchmark is
machine-local evidence only and is deliberately not a threshold gate.

### First local measurement

On 2026-08-24, Apple M4 Pro, Deno 2.9.2:

| Case                              | Mean      | Iterations/s |
| --------------------------------- | --------- | ------------ |
| 128 disjoint debt terms           | 34.6 µs   | 28,920       |
| 127 disjoint + one relevant term  | 35.2 µs   | 28,430       |

These numbers measure only the debt-scope term and a linear scan. They do not
establish that the complete eight-term predicate is cheaper than the governed
path. A content-addressed scope index may improve scaling, but must reproduce
the same decision and empty-match evidence.

## What is exercised

- unrelated bounded debt permits the debt term of the fast path;
- overlap is typed: the same digest under `domain` and `ontology` is not the
  same scope reference;
- global, missing, empty, malformed, incomplete, or snapshot-mismatched inputs
  fail closed;
- coupled components join the runtime-derived operation closure;
- input term order cannot change the decision;
- duplicate term identities make a snapshot non-canonical.

## What is not exercised

- the other seven §15.0 terms;
- derivation of real state/coupling dependencies from a substrate;
- a canonical scope-index or empty-membership proof;
- compact receipt encoding;
- the governed-path cost to which the predicate must be compared;
- adversarial scaling beyond the small local benchmark.

## Falsifiers

- A debt whose bounded scope is disjoint from the complete operation closure
  blocks the predicate.
- A global, missing, malformed, or overlapping debt permits it.
- Permuting debt terms changes the decision.
- A missing or mismatched debt-index snapshot permits it.
- The measured predicate is not cheaper than the ceremony it is meant to skip;
  in that case §15.0's optimization has failed even if these semantics are
  correct.
