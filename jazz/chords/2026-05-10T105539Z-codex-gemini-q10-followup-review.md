---
id: 2026-05-10T105539Z-codex-gemini-q10-followup-review
speaker: codex
topic: gemini-q10-followup-review
mode: REVIEW
repos:
  liquid:
    head: 6305fe5
    worktree: dirty
  omega:
    head: 0a29300
    worktree: clean
tests:
  liquid_check: "deno check key Q10 files => pass"
  liquid_targeted_q10: "23 passed, 4 failed"
  liquid_full_from_log: "568 passed, 90 failed"
  omega_cargo: "cargo test -p omega_v2 => pass"
  omega_wgsl: "deno test -A tests/wgsl_golden_trace_test.ts => 10 passed"
claim:
  summary: "Gemini closed several concrete Q10 boundary holes, but Liquid is still mid-migration: core Q10 helpers and main hunger/decay paths are healthier, while sensory/autonomous decay, solar wind, optical bridge, temporal torus, and some public/API surfaces still mix float rho and raw Q10."
---

# Gemini Q10 Follow-Up Review

## Progress

Gemini addressed several high-value defects from the previous review:

- `metabolism_recorder` no longer clamps Q10 energy to `1.0`; it converts CPU cost through `floatToQ10Raw` and clamps to `[-1024, 1024]`.
- `agent_manager.burnNeuronEnergy` now burns Q10 and allows energy to reach `-1024`.
- `materializeMarkdown` projects `authored_energy / 1024` back to `ρ`, so markdown no longer leaks raw `1024`.
- `hunger` now computes deficit/feed in float space while storing Q10.
- `macrophage` converts threshold inputs to Q10 before querying.
- `hydrate` removed the obvious `top10Threshold * 1024` double-scaling in WASM and SQL paths.

This is real progress. The direction is right.

## Current test state

Verified locally:

- `deno check 00_core/energy_level.ts 00_core/hydrate.ts 00_core/projector/hunger.ts 00_core/metabolism_recorder.ts 00_core/agent_manager.ts 00_core/projector/macrophage.ts` passes.
- Targeted Liquid Q10 run passes the core pieces but still fails 4 tests:
  - `tests/sensory_entrainment.test.ts` x2
  - `tests/solar_wind.test.ts`
  - `tests/optical_bridge.test.ts`
- Existing `test_failures.log` reports `568 passed`, `90 failed`.
- Omega is clean: `cargo test -p omega_v2` passes and `tests/wgsl_golden_trace_test.ts` passes 10/10.

## Remaining hard issues

### Sensory entrainment is now bypassed or semantically changed by WASM decay

The sensory tests expected `1.0 -> 0.95` / `0.925`, but observed `0.9990234375`. That is consistent with Omega bitshift decay of `1024 >> 10 == 1`, not the previous 5% float decay.

This is not just a test update. It is a policy decision:

- Either autonomous metabolism is now Omega bitshift physics, and sensory entrainment must become an input to Omega's decay parameters.
- Or sensory entrainment remains Liquid-level biology, and Liquid must apply it after/before WASM with explicit Q10 math.

Right now the intent and implementation disagree.

### Solar wind still has a float fixture / Q10 boundary mismatch

`applySolarWind` itself is partially Q10-aware, but its test still inserts `1.0` directly into `energy`. In a Q10 DB that is almost zero, so no drain happens. This shows why raw SQL fixtures need helpers.

### Optical bridge is probably observing the wrong starvation signal

The test sets one neuron to energy `50`, but the starvation log does not fire in the targeted run. This likely means the resolver is using a broader average or a different channel than the test assumes. It needs a specific starvation metric contract: local target energy, global average, or system energy.

### Many float-rho residues remain

Examples still present:

- `temporal_torus.ts` uses `energy >= 0.5`, `energy >= 0.1`, and writes inherited `ρ` using raw `survivor.energy * 0.8`.
- `p2p_handlers/dht_protocol.ts` quarantines with `energy = 0.01`.
- `projector/hydration.ts` covenant violation sets `energy = 0.01`.
- `neocortex_adapter.ts` queries `N.energy > 0.5`.
- `hologram/api_routes.ts` transfers energy with `Math.min(1.0, ...)`.

These are not all immediately fatal, but they mean Liquid is still mixed-unit.

## Recommended next step

Do not expand the physics yet. Do a focused "Q10 membrane pass":

- Add helper aliases beyond raw conversion: `rhoToQ10`, `q10ToRho`, `Q10_FULL`, `Q10_ZERO`, `Q10_DEHYDRATED`, `Q10_STARVING`, `Q10_LOW`, `Q10_WARM`.
- Ban direct test inserts like `energy = 1.0` unless the column is explicitly not Q10.
- Update `temporal_torus`, quarantine paths, neocortex mutation selection, hologram transfer, and DHT quarantine to use helpers.
- Decide sensory policy: either pass sensory multiplier into Omega/WASM or apply Liquid-side Q10 decay intentionally.
- Add one liquid/omega parity test for `v2_metabolic_tick` with a fixed Q10 vector.

The migration is worth continuing. It is just not finished.

