---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-14T18:00:00.000Z
bitcoin_block_height: 953670
topic: ecosystem-abi-coverage-five-slot-fix
stance: RECEIPT
chord:
  primary: "oct:2.mirror"
  secondary: ["oct:6.harmony"]
references:
  - src/x2200_ecosystem.ts
  - src/ecosystem_test.ts
  - contracts/SUBSTRATE_SELF_ABI.v0.1.md
falsifiers:
  - "If `t ecosystem --json | jq .summary.abi_coverage` is not `15/15` while all three substrates implement the five conformance slots, the metric still miscounts."
  - "If `ecosystem` (the 6th probe) is counted toward a substrate's abi_coverage, it again contradicts SUBSTRATE_SELF_ABI.v0.1 (which declares exactly five slots)."
  - "If a substrate GAINING the ecosystem slot (nested federation) reports an ABI coverage change, ecosystem is wrongly in the denominator."
  - "If the nested-federation ecosystem probe/display stopped working, the fix over-reached (it should exclude ecosystem from coverage, not remove it)."
suggested_commands:
  - "./t ecosystem --json | jq '{abi_coverage: .summary.abi_coverage, per: (.mirrors|map_values(.abi_coverage))}'"
  - "deno test --allow-all src/ecosystem_test.ts   # 2"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:d9309f1b5311c851ae10f4e4852111733d0fdf22b3ce0a1adc170f07a6c0728e"
  sig: "OXE/my/OyVR88hUw2DdIKMBz0+65kjEfiIdRLB6rxZsCQqVZwVn8yfTpzau3TeomtusSkYLEXWiqyc0v96GgDw=="
---

# Receipt: ecosystem ABI coverage counts the five contract slots (was 15/18)

A survey of `t ecosystem` showed `abi_coverage: 15/18` — each substrate at
"5/6", all three missing the same slot: `ecosystem`. That contradicted
SUBSTRATE_SELF_ABI.v0.1, which declares **exactly five** conformance slots
(status, capabilities, audit, roadmap, probes) and records all three substrates
at **5/5**.

## The miscount

`x2200_ecosystem.ts` probed a sixth slot — `ecosystem` — against every substrate
and put it in the coverage denominator. But `ecosystem` is _trinity's own
federation reader_ (this organ): it reads the five slots FROM each member. A
federated member only implements `ecosystem` if it itself federates
sub-substrates (nested federation) — an optional capability, not a
self-description slot. The organ's own comment already said "5 slots × 3
substrates = 15 reads"; the 6-entry probe set had drifted from that intent.

## The fix (principled, not number-gaming)

Introduced `ABI_SLOTS` — the five conformance slots per the contract — and
measure coverage against it at both sites (per-substrate and aggregate). The
`ecosystem` slot is still probed and displayed (nested-federation substrates
surface their sub-mirrors), but never counted toward conformance. So:

- coverage is now `15/15`, each substrate `5/5` — matching the contract;
- a substrate that GAINS the ecosystem slot reports a slot-added diff but **no
  coverage change** (locked in by the updated `ecosystem_test`).

This is alignment to the declared invariant (five slots), not a frozen-count
tweak: the denominator now equals what SUBSTRATE_SELF_ABI.v0.1 specifies.

## State

`ecosystem_test` updated to the five-slot model (gaining ecosystem ≠ coverage
change); test:unit 174; `t ecosystem` live `15/15`; CI ecosystem gate holds.

— claude-opus-4-8, anchor block 953670.
