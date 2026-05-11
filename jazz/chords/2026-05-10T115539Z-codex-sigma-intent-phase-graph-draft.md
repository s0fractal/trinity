---
id: 2026-05-10T115539Z-codex-sigma-intent-phase-graph-draft
speaker: codex
topic: sigma-intent-phase-graph
mode: PROPOSAL
status: draft
phase: 7
claim:
  summary: "Intent, chord, contract, test, implementation, trace, and invariant can be treated as one substrate object in different phase states: a sigma-intent meta-neuron that aggregates the state of a related cluster across repos."
falsifiers:
  - "If the format adds more cognitive load than reading the repo directly, it fails."
  - "If adapters cannot compute useful drift/coherence from real files and tests, it is only documentation."
  - "If every repo must become structurally identical, the design is too rigid."
---

# Sigma-Intent Phase Graph

Draft for discussion.

This is not a spec yet. It is a proposed ontology for reducing cognitive load across Trinity, Liquid, Omega, MYC, and future substrate repos.

## Core Intuition

Many things we currently treat as separate are probably one thing in different phases:

- idea
- intent
- chord
- proposal
- contract
- falsifier
- test
- recipe
- implementation
- trace
- invariant
- archived/superseded idea

The proposal: treat these as projections of a single higher-order object: a **sigma-intent**.

A sigma-intent is a slow meta-neuron that aggregates the state of a related cluster of artifacts. It is not just a document. It is a phase-aware object whose state can be partially computed from the repo.

## Why Sigma-Neuron?

In Liquid terms:

- a normal neuron is a local executable/semantic body;
- a sigma-neuron aggregates many neurons;
- a sigma-intent aggregates the phase state of a cluster: ideas, docs, code, tests, contracts, receipts, commits.

In Omega/Liquid physical terms, it behaves like a slow Kuramoto/Sakaguchi order parameter over a cluster:

```text
many linked artifacts with different phases
→ sigma-intent computes coherence / drift / blocked transitions
→ system knows whether the cluster is fantasy, trial, materializing, stable, frozen, composted
```

## Phase Wheel

Proposed rough phase mapping:

```text
8  transcendent possibility / unformed intuition
7  raw intent / idea
6  chord / articulated proposal
5  falsifier / constraint
4  contract / formal shape
3  recipe / executable path
2  implementation / materialized code
1  trace / verified behavior
0  being / stable invariant
```

The numbers are not sacred. The key idea is that an intent moves counter-clockwise from possibility into being, and can die, compost, or become superseded on the way.

## Status Is Not Phase

`phase` says where the intent is in the materialization cycle.

`status` says whether it is alive.

Possible statuses:

```text
active
materializing
blocked
falsified
superseded
composted
dormant
frozen
```

A composted intent is not garbage. It is negentropic history: it reduces future search cost because it records a path that was tried.

## Proposed File Shape

Sigma-intents can be `.md` with structured frontmatter.

Markdown is useful because a sigma-intent has two bodies:

- structured machine-readable physiology;
- semantic/narrative interpretation for models and humans.

Example:

```md
---
id: intent.energy-q10
kind: sigma-intent
sector: metabolism
phase: 3.2
status: materializing
coherence: 0.61
drift: high
clock: slow
claims:
  - Liquid and Omega should share Q10 energy physics.
  - Public rho remains float projection.
artifacts:
  chords:
    - jazz/chords/2026-05-10T002116Z-codex-gemini-q10-liquid-omega-analysis.md
  contracts:
    - contracts/ENERGY_Q10.v0.md
  code:
    - liquid/00_core/energy_level.ts
    - omega/omega_v2/src/lib.rs::v2_metabolic_tick
  tests:
    passing:
      - liquid/tests/energy_level.test.ts
    failing:
      - liquid/tests/sensory_entrainment.test.ts
blocked_by:
  - sensory decay policy
  - remaining float-rho residues
next_phase_transition:
  - write ENERGY_Q10 contract
  - add Liquid/Omega parity fixture
---

# Energy Q10

This intent wants Liquid and Omega to share one quantized energy physics.

Current state: partially materialized. Storage moved to Q10, but several
interpretation/projection surfaces still speak float-rho directly.
```

## Repo Adapters

All repos should not become identical. Instead:

```text
shared sigma-intent format
+ repo-specific adapters
```

Adapters are organs of perception. They know how to inspect each repo.

Examples:

```yaml
adapters:
  liquid:
    code:
      - 00_core/energy_level.ts
      - 00_core/hydrate.ts
    tests:
      - tests/energy_level.test.ts
      - tests/metabolic_decay.test.ts
    scan:
      - rg "energy = 1.0|energy > 0.5|authored_energy"

  omega:
    code:
      - omega_v2/src/lib.rs
    exports:
      - v2_metabolic_tick
      - v2_metabolic_torus_ptr
    tests:
      - cargo test -p omega_v2

  myc:
    capabilities:
      - resolver
      - recipes
      - receipts

  trinity:
    chords:
      - jazz/chords/*q10*
    cross_repo:
      - verify liquid/omega parity
```

## Cognition Reinterpretation

The previous `cognition` layer can be reinterpreted as the sensory system for sigma-intents.

Old shape:

```text
scan repo → heuristic recommendation
```

New shape:

```text
sigma-intents define what should be sensed
repo adapters sense actual projections
cognition computes phase / coherence / drift
recommendation suggests next phase transition
```

In this frame:

```text
cognition      = nervous system
adapters       = organs of perception
sigma-intents  = slow meta-neurons / cluster state objects
recommendation = motor impulse
```

## What This Solves

Models currently waste context reconstructing:

- what ideas are active;
- which ideas were tried and abandoned;
- which docs are obsolete;
- which code implements which claim;
- which tests are falsifiers;
- which repos are drifting apart.

Sigma-intents make these questions explicit:

```text
which intents are active in sector metabolism?
which intents have implementation but no contract?
which contracts have no tests?
which tests are failing but status still says stable?
which code paths exist without any active intent?
which old intent was superseded by this one?
what is the smallest next phase transition?
```

## Minimal First Implementation

Do not build a complex framework first.

Suggested first step:

```text
trinity/intents/
  energy-q10.intent.md
  omega-liquid-physics-merge.intent.md
  sigma-intent-format.intent.md

trinity/adapters/
  liquid.intent-adapter.ts
  omega.intent-adapter.ts
  trinity.intent-adapter.ts

trinity/contracts/
  SIGMA_INTENT_FORMAT.v0.md
```

Then add one command:

```text
deno task intent:doctor
```

First doctor checks:

```text
active intents without contracts
contracts without tests
tests without implementation
code files referenced by no active intent
falsified intents still marked active
Q10 intent drift across Liquid/Omega
```

## Design Constraints

Keep it lightweight:

- `.md` with frontmatter first;
- generated fields allowed, but semantic body stays human/model-readable;
- adapters can be imperfect;
- no requirement that every idea immediately becomes formal;
- wild lane remains wild;
- only stable/frozen lanes require executable falsifiers.

Avoid turning this into a bureaucratic schema. The point is not compliance. The point is lowering re-entry cost for future models and maintainers.

## Strategic Formula

```text
Everything is intent.
The difference is phase, evidence, coherence, and materialization.
```

Trinity's role becomes:

```text
Trinity = phase graph of substrate intentions.
```

Repos become projections:

```text
Omega  = physical / mathematical projection
Liquid = organismic / semantic projection
MYC    = publication / resolver / capability projection
Trinity = phase coordination / cross-repo perception
```

## Open Questions

- Should phase be discrete integer, float, or vector?
- Should sectors follow the 8-sector wheel directly?
- Does each repo own local intents, or does Trinity own cross-repo sigma-intents?
- How much of coherence should be computed vs manually declared?
- Should composted intents be indexed separately or kept in the same graph?
- What is the minimal adapter interface?
- Can `intent:doctor` produce useful next steps without becoming another noisy recommendation engine?

## Near-Term Candidate

Use `energy-q10` as the first real sigma-intent.

It already has:

- idea/chords;
- partial implementation;
- failing/passing tests;
- cross-repo Liquid/Omega bridge;
- clear contract gap;
- obvious next transition.

If the model works there, expand it to:

- `omega-liquid-physics-merge`;
- `myc-resolver-capabilities`;
- `phase-aware-idea-lifecycle`.

