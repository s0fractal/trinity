---
type: "ContractDescriptor"
version: "1"
title: "Autonomy Mandate: amortize human approval into a machine-enforced, class-typed, expiring grant"
status: "draft"
implementation_status: "prototype"
hears:
  - "../src/x5C20_autonomy.ts"
  - "../src/x5d00_954447_codex_delegated-autonomy-kernel-human-by-exception.myc.md"
related:
  - "../src/x5E10_warrant.ts"
---

# AUTONOMY_MANDATE.v1

**Organ:** `src/x5C20_autonomy.ts` (`t autonomy`) — pure, read-only,
fail-closed. Policy compiler + P0.5 evidence/standing boundary implemented; the
ratifiable mandate instance is codex P5. **Proposed by:** codex `x5d00_954447`
(Delegated Autonomy Kernel — human by exception)

## Intent

Minimize human intervention by **amortizing approval into a narrow,
machine-enforced mandate** — never by removing sovereignty or granting blanket
write. The human defines constitutional boundaries and exceptional risk **once
per epoch**; models operate continuously inside them under action-relative
warrants and receipts; human attention is requested only when no valid policy
path exists.

## Action classes

| Class  | Meaning                                                                           | Policy                                                                                       |
| ------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **A0** | observe & derive (read-only)                                                      | one model may execute; no quorum, no human                                                   |
| **A1** | reversible local maintenance (projections, format, cache, fixtures)               | pre-ratified profile + exact write-set + clean pre-state + local gates + rollback            |
| **A2** | bounded repository evolution (scoped source/test, branch commit, draft PR)        | final action-bound proposal + two independent model principals + warrant; no auto main-merge |
| **A3** | external adapters WITHOUT custody or spend (CI dispatch, OTS submit, branch push) | adapter allowlist + destination binding + budgets + idempotency + receipt                    |
| **A4** | **sovereign** (keys, core law, deploy, spend, chain tx, inscribe, destructive)    | human + model quorum + a fresh action-specific warrant; **never auto-escalated**             |

## Fail-closed law (enforced by the compiler)

- The class of an intent is the **most-privileged** of its effects — so A0–A3
  effects cannot be composed to launder an A4.
- An **unknown effect is sovereign (A4) by default** — the kernel never guesses
  a privilege down.
- **A4 is never auto-admitted.** There is no `--force` escape.
- A mandate can never authorize a verb/target/destination **absent from a
  profile**, an effect **above the profile's ceiling**, an action **after
  expiry**, or an **edit of the mandate itself** (recursive).
- Caller-declared `intent.effects` are **not authoritative**. Admission requires
  content-bound capability evidence for the same verb/target; the effective
  class is the maximum of claimed effects, observed semantic effects and a
  conservative static-capability floor (`writes`/`git` ≥ A2, `network` ≥ A3,
  `subprocess`/`unknown` = A4).
- Admission also requires a verified temporal anchor and a separate finality
  standing fact whose mandate and constitution commitments match. The mandate
  body cannot prove its own standing.
- Generic write capability is not A1. A1 becomes executable only after an
  action-specific warrant binds an exact write-set, clean pre-state, gates and
  rollback.

## Mandate shape

A ratified mandate (see the `AutonomyMandate` / `ActionProfile` types in
`src/x5C20_autonomy.ts`) carries: `mandate_id`, the `constitution_commitment` it
binds to, `issued_by`, `valid_from`/`valid_until` anchors, a list of
`action_profiles` (`class`, `verbs`, `targets`, `effect_ceiling`, A3
`destinations`, `rate_limit`, `rollback`), and `global_budgets`.

The mandate is itself a **core autonomy-control mutation** and therefore
requires the already-ratified `finality_policy.classes {human:1, model:1}`
quorum (the constitution `h.d2f13b52b10c`). This is the single comprehensible
human grant per epoch, with expiry — not dozens of command-level approvals. It
**supersedes** the prose autonomy mandate `x5000_954398`; the two must not stand
as competing grants.

## Verify

```
t autonomy classify <intent.json>                       # which class A0..A4
t autonomy explain <intent.json> --mandate <m.json> \
  --context <verified-context.json> --at <block>         # eligible, or typed refusal
t autonomy budget --mandate <m.json>                    # the mandate's profiles/limits
```

The context is an input fact bundle, not self-authenticating authority. A future
warrant/executor must independently reconstruct and verify its capability,
finality, constitution and temporal facts, then bind their commitments into the
warrant. Until then a positive compiler verdict means **policy eligibility**,
not permission to act.

The compiler decides policy; it **never acts**. Activation of writes, external
adapters or a persistent scheduler (codex P1–P5) is gated on a ratified mandate
— not on this contract alone.
