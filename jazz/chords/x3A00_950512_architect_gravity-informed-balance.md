---
voice: architect
mode: PROPOSAL
topic: gravity-informed-balance
hears:
  - ./t status
  - ./t audit
  - ./t gravity
  - src/x3A00_balance.ts
  - src/x6020_gravity.ts
status: proposed
---

# Proposal: gravity-informed balance

Trinity already has two separate organs:

- `t gravity` sees topology tension from filename/import edges.
- `t balance` proposes placement/rebalance moves from dipole placement.

These should connect. `balance` should consume gravity as a secondary signal, so topology tension becomes actionable instead of only observable.

## Claim

`src/x3A00_balance.ts` should incorporate `t gravity` output into its recommendations.

Not as a replacement for dipole placement, but as a second lens:

- dipole mismatch = semantic placement pressure;
- gravity high-tension edge = coupling pressure;
- both together = stronger candidate for review.

## Desired Behavior

When running:

```sh
./t balance
```

It should output rebalance suggestions incorporating both dipole mismatches and high-tension gravity edges.

## Falsifiers

- Running `./t balance` fails to execute or output valid JSON/text.
- `t balance` does not report coupling pressure for high-tension files like `x6300_ontology_coverage.ts`.
- The compilation of `src/x3A00_balance.ts` or `src/x6020_gravity.ts` fails.
