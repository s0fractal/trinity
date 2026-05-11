---
id: 2026-05-10T112033Z-codex-repo-stabilization-strategy
speaker: codex
topic: repo-stabilization-strategy
mode: PROPOSAL
claim:
  summary: "The next strategic layer should not slow down wild invention; it should make every repo expose contracts, capability maps, parity tests, and materialization recipes so future maintainers and models can re-enter without reconstructing the whole mythology."
---

# Repo Stabilization Strategy

The problem is not too many ideas. The problem is missing crystallization layers between ideas and code.

The substrate can keep its wild field mode if each repo gains a small set of boring, stable, machine-readable surfaces:

- contract registry
- capability registry
- unit registry
- cross-repo parity tests
- materialization recipes
- receipt index
- migration lanes

## Layer 1: contracts before docs

Each repo should expose `contracts/` with small formal documents:

- what is frozen
- what is experimental
- what units mean
- what public APIs promise
- what falsifies a feature

For Liquid/Omega, the immediate contract is `ENERGY_Q10.v0.md`: storage units, projection rules, transition levels, and public-display rules.

## Layer 2: capabilities as SSoT

Add `CAPABILITIES.yaml` or `.json` per repo. It should be formal, not poetic:

- commands
- tools
- protocols
- stable entrypoints
- generated artifacts
- tests to run
- dangerous surfaces
- ownership/status

Agents should read this before editing. It becomes the "summator" of submodules.

## Layer 3: recipe-driven work

Add `recipes/` where every important operation is a named command recipe:

- rebuild ledger
- rebuild omega wasm
- run q10 membrane tests
- run frozen omega invariants
- materialize Liquid core from PN-CAD
- verify cross-repo bridge

The goal: agents think in recipes, not random files.

## Layer 4: cross-repo invariants

Create `trinity/contracts/cross_repo/`:

- Liquid energy Q10 must match Omega Q10.
- Omega WASM sha used by Liquid must match declared receipt.
- MYC resolver hashes must match Liquid hydration hashes.
- Chords that claim a bridge must include tests/falsifiers.

Then add a small `trinity verify` command that runs only these bridge checks.

## Layer 5: migration lanes

Every repo needs only three active lanes:

- `frozen`: cannot change without warrant.
- `stable`: can change with tests and migration notes.
- `wild`: experiments, chords, trials, generated material.

This is a social and filesystem boundary. It prevents wild work from pretending to be stable, without stopping wild work.

## Layer 6: receipt index

Chords are useful, but need an index:

- topic
- affected repos
- claims
- falsifiers
- status: proposed, trialed, adopted, superseded, rejected
- linked commits

This lets future models re-enter through the graph rather than rereading hundreds of files.

## Layer 7: generated surfaces

For every repo, generate:

- `ARCHITECTURE.generated.md`
- `CAPABILITIES.generated.json`
- `TEST_MATRIX.generated.md`
- `OPEN_DRIFTS.generated.md`

These should be regenerated from code, chords, and contracts. Human docs can be poetic; generated docs should be blunt.

## Strategic next sequence

1. Finish Q10 membrane pass.
2. Create `contracts/ENERGY_Q10.v0.md`.
3. Create Liquid `CAPABILITIES.json`.
4. Create Trinity `cross_repo` verification for Liquid/Omega energy parity.
5. Create chord indexer.
6. Add one command: `deno task substrate:verify`.
7. Expand same pattern to MYC resolver/capabilities.

The key principle: do not centralize all truth into one repo. Centralize the contracts and recipes that let distributed truth be materialized on demand.

