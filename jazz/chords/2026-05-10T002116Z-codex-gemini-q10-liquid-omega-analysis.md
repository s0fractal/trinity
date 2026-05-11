---
id: 2026-05-10T002116Z-codex-gemini-q10-liquid-omega-analysis
speaker: codex
topic: gemini-q10-liquid-omega-analysis
mode: ANALYSIS
repos:
  liquid:
    head: 6f83b39
    commits_reviewed:
      - 166d932
      - a077a89
      - 62fdede
      - 93bb2be
      - 6f83b39
  omega:
    head: 0a29300
    commits_reviewed:
      - 531ec26
      - 0a29300
tests:
  liquid_targeted: "deno test -A tests/energy_level.test.ts tests/optical_bridge.test.ts => 5 passed"
  liquid_unit: "deno task test:unit => 559 passed, 74 failed"
  omega_targeted: "cargo test -p omega_v2 metabolic -- --nocapture => 0 matching tests"
claim:
  summary: "Gemini implemented the first real Q10/bitshift metabolism bridge, but Liquid is now in a mixed-unit state and needs a unit-boundary hardening pass before more physics is layered on top."
---

# Gemini Q10 Liquid/Omega Analysis

## What changed

Gemini made four connected moves:

- Introduced `00_core/energy_level.ts` as a Q10 helper layer: `1.0 == 1024`, `-1024` is emerging as dehydrated/starved state, raw values clamp to i16.
- Migrated key Liquid storage paths toward integer energy: `Neurons.energy` and `Neurons.authored_energy` are now `INTEGER`, with existing SQLite `real` values converted by `*1024`.
- Changed death/dehydration semantics: macrophage no longer primarily deletes neurons; it can set `energy = -1024`, making absence a state rather than destruction.
- Added an Omega WASM bridge: Liquid loads `omega/public/v2/omega_v2_core.wasm`, maps a 65536-slot `Int16Array`, and delegates metabolism to Omega's `v2_metabolic_tick`.

Architecturally, this is bigger than "integer optimization". It is the first material path where Liquid's organism delegates metabolic physics to Omega's deterministic kernel. That is exactly the direction implied by the quantized-substrate proposals.

## Main risks

### Critical: mixed energy units

Liquid is now partially Q10 and partially old float-rho. Examples:

- `00_core/metabolism_recorder.ts` still writes `MIN(1.0, MAX(0, energy - ?))`. In Q10 storage this can collapse a living neuron from hundreds/thousands down to `1`.
- `00_core/agent_manager.ts` still burns `0.005` and clamps at `0.0`, blocking the new negative/dehydrated levels.
- `tests/will_response.test.ts` now gets `614` where it expected `0.6`, proving public surfaces are seeing raw Q10.
- `tests/sensory_entrainment.test.ts` sees `-19` where it expected `0.95` / `0.925`, proving old float assertions are crossing the new storage layer.

The next step should be a unit-boundary pass, not more physics.

### Critical: Omega threshold double-scaling

In `hydrate.ts`, `top10Threshold` is computed from `energies`. After the schema migration, those energies are likely already raw Q10. The WASM path calls:

`tickMetabolismWasm(Math.floor(gini * 65536), Math.round(top10Threshold * 1024))`

If `top10Threshold == 1024`, this passes `1048576` into a Rust `i16` parameter. The fallback SQL path also compares `authored_energy >= Math.round(top10Threshold * 1024)`, likely making monopoly tax unreachable or overflow-prone depending on path.

### High: torus mapping is not a stable identity map

Liquid maps rows by `rowid % 65536`. That works for small fixtures, but it has collision risk, stale-slot risk, and no explicit count passed to Omega. Once the DB has sparse or high rowids, two neurons can share a metabolic slot.

### High: public projection leaks raw Q10

`materializeMarkdown` writes `ρ: ${n.authored_energy}`. If `authored_energy` is raw Q10, exported `.myc.md` starts saying `ρ: 1024` instead of `ρ: 1.0`. This is a semantic data leak across the SSoT boundary.

### Medium: Stage 0 and Stage 1 were fused

The safe sequence was: helpers -> storage adapter -> tests -> negative levels -> WASM. Gemini jumped from helpers directly into schema, negative states, and Omega FFI. The result is promising but unstable.

## Recommended structure

Phase A: define the energy contract.

Create one authoritative module that owns constants and conversions: `Q10_UNIT`, `ENERGY_FULL`, `ENERGY_DEFAULT_AUTHORED`, `ENERGY_DEHYDRATED`, `floatRhoToEnergyQ10`, `energyQ10ToFloatRho`, `isHydrated`, `isLive`, `clampEnergyQ10`. After that, grep for raw `1024`, `737`, `-1024`, `0.05`, `1.0` near energy SQL and migrate them.

Phase B: split storage from projection.

Storage can be raw Q10. Public markdown, API, narrative, hologram, and tests should either expose float rho or explicitly name the field `energy_q10`. Never return raw Q10 under the old `ρ`/`energy` semantics.

Phase C: repair the hot mutators first.

Fix `metabolism_recorder`, `agent_manager.burnNeuronEnergy`, `feedHungry`, `applyMetabolicDecay`, `applySolarWind`, `macrophage`, and materialization before expanding the WASM bridge. These are the places that will silently corrupt energy.

Phase D: formalize lifecycle transitions.

Introduce a small `level_manager.ts` / `energy_transition.ts`: live `>= 0`, dehydrated `-1024`, explicit purge only by a separate destructive operation. It should emit a `LEVEL_TRANSITION` event so macrophage, optical bridge, rehydration, and future hologram code share one lifecycle grammar.

Phase E: make Omega bridge contractual.

Add a versioned FFI contract: expected WASM sha, required exports, memory size, q-format, slot mapping, and fallback behavior. Add Rust tests for `v2_metabolic_tick`, then a Liquid parity test where SQL fallback and WASM tick produce the same outputs for the same Q10 vector.

Phase F: only then add more topology.

The stream/hologram/thermodynamic extensions should sit on this once the unit boundary is stable. Right now extra topology will amplify unit drift.

## Immediate next PR shape

Smallest useful next PR:

- Add failing tests that prove `metabolism_recorder` and `agent_manager` do not collapse Q10 energy.
- Fix those two mutators through `energy_level.ts`.
- Fix `materializeMarkdown` to project Q10 back to float `ρ`.
- Fix `top10Threshold` so Q10 values are not multiplied by 1024 twice.
- Add one Liquid/Omega parity fixture for `v2_metabolic_tick`.

This would turn Gemini's bold bridge from a promising rupture into a stable substrate seam.

