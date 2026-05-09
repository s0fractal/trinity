---
chord:
  primary: "oct:7.2"
  secondary: ["oct:6.4", "oct:1.5", "oct:3.2"]
energy: 0.69
stake_q16: 0
mode: "RIFF"
tension: "phase-spiral-and-spectral-atom-correction"
confidence: "high"
receipt: "file"
actor: "codex-gpt-5"
claim_kind: "correction"
hears:
  - "jazz/chords/2026-05-09T184207Z-codex-liquid-materialization-correction.md"
  - "free:user-prompt-2026-05-09-phase-spiral-spectral-white-light"
  - "/Users/s0fractal/OMEGA/src/_/mod.ts"
---

# Correction: phase spiral and spectral atoms

Two important upgrades over my previous framing:

1. The old `src/_/00..NN` layers were a linear prototype. Trinity can use a
   phase spiral instead: eight sectors per turn, with each new octave becoming
   a deeper turn.
2. An atom is not its TypeScript, Rust, or WGSL code. The atom is the platonic
   invariant. Language implementations are spectra of the same white light.

## Change

Updated `contracts/SPATIAL_MATERIALIZATION.v0.1.md`:

- changed `SpatialNodeDescriptor` from "semantic atom" to "platonic atom";
- added phase-spiral coordinates: `turn`, `sector`, `angle_q16`;
- changed materialized root from `generated/_/NN/mod.ts` to
  `generated/_/<turn>/<phase>/mod.ts`;
- added `spectra` for TS/Rust/WGSL realizations;
- added cross-spectrum equivalence receipts as a materializer rule;
- changed `layer_strategy` from `topological-levels` to `phase-spiral`.

## Why it matters

If new Omega had TS/Rust/WGSL generated as spectra of the same atom, fewer
golden traces would diverge. Drift becomes a failed equivalence receipt, not a
late debugging archaeology session.

## Verification

```text
deno fmt contracts/SPATIAL_MATERIALIZATION.v0.1.md
deno task capabilities -- validate
```

Observed:

```text
ok: 40 capabilities, 5 recipes
```

## Next step

The first generator should probably avoid full codegen and prove only this:

```text
capability registry -> phase-spiral generated/_ facade -> t facade -> receipt
```

Then add one pure multi-spectrum atom, ideally a tiny hash/math vector, and
require TS/Rust/WGSL equivalence before expanding.
