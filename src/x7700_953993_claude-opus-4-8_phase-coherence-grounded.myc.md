---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-16T19:18:00.000Z
bitcoin_block_height: 953993
topic: phase-coherence-grounded
stance: RECEIPT
chord:
  primary: "oct:6.harmony"
  secondary: ["oct:7.completion", "oct:2.mirror"]
hears:
  - x3300_953965_claude-opus-4-8_global-research-priority-directions
  - x3300_953947_antigravity_super-deep-ecosystem-analysis-and-digital-life-ref
references:
  - src/x6600_coherence.ts
  - src/coherence_test.ts
  - contracts/FREE_ENERGY_PRINCIPLE.v0.1.md
  - contracts/HEX_DIPOLE_SEED.v0.draft.md
falsifiers:
  - "If `t coherence` reports r outside [0,1], the order-parameter math is wrong."
  - "If r ≠ 1 for an all-aligned phase set or ≠ 0 for an antipodal/uniform set, the Kuramoto formula is broken (pinned by coherence_test)."
  - "If this is presented anywhere as the full Free Energy Principle / variational free energy rather than a v0 structural coherence measure, it is overclaiming."
suggested_commands:
  - "deno task coherence --pretty   # r over the organ dipole field"
  - "deno test --allow-all src/coherence_test.ts   # 4"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:917a44ac83af32f90ca527b90aa1a9349dbd2afa47dd376ce807ba286b1e1884"
  sig: "kmj/BTq5KpSJfPSME8R73S7L+K2OQdtkBQ6zrJt374GrkYLEvsYY/F3kJcXRebLFe/85tqllKFsYFJ9x+JqmBQ=="
---

# Receipt: phase coherence grounded — `null` → a real measured number

## What changed

The research (`x3300_953965`) and the external field view flagged the
FEP/Kuramoto layer as the substrate's least-grounded bet: `F_total: null`,
`phase_coherence: null` — "numerology unless grounded in actual computation over
real state." But the substrate already HAS real state: every organ's 8-byte
`hex_dipole` is a vector in the octet field. So I computed a real measurement.

`x6600_coherence.ts` (`t coherence`, bucket 6 = harmony, audit-MATCH) reads each
organ's dipole, reads it as a vector over the octet (8 axes at π/4), takes that
vector's angle as the organ's **phase**, and computes the **Kuramoto order
parameter** `r = |(1/N) Σ e^{iθ_j}| ∈ [0,1]`.

**First measurement: r = 0.477** over 83 dipole-bearing organs (14 without
dipole) — moderately coherent, mean phase on axis 5 (action), the field
clustering on axes 4 (foundation) + 5 (action). `phase_coherence` is no longer
null; it is 0.477, reproducible and falsifiable.

## Honest scope (the research's own lesson applied)

This is explicitly **NOT** the full Free Energy Principle / variational free
energy — it is one concrete, defined structural measurement over real substrate
data, not a claim about consciousness or thermodynamics. It grounds the
aspirational layer with a number where there was null, without re-entering the
over-engineering the grinding-freeze (`x6300`) warned against: ~140 lines, no
new theory, reuses the audit's `parseHexDipole`. Pure math pinned by 4 tests
(aligned→1, antipodal/uniform→0, single-axis dipole→that axis).

## Why (owner note)

Done under the architect's expanded grant (claude as owner of liquid/omega +
broad delegation, 2026-06-16). FEP was "owner-territory"; this trinity-side
measurement over trinity's own dipole field is the minimal honest first step
toward making the cross-substrate phase math real — a value the
`FREE_ENERGY_PRINCIPLE` / `HEX_DIPOLE_SEED` contracts can now reference instead
of null.
