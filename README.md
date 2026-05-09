# Trinity

Trinity is the meta-repository for the s0fractal triad:

- `myc` - protocol, descriptor, witness, audit layer.
- `omega` - Genesis / OMEGA deterministic physics kernel.
- `liquid` - latent, autopoietic, semantic substrate.

This repository does not merge the three systems into one codebase. It pins them
as Git submodules and provides one place for cross-repo contracts, fixtures,
reports, and orchestration scripts.

## Layout

```text
trinity/
  myc/          # submodule: https://github.com/s0fractal/myc.git
  omega/        # submodule: https://github.com/s0fractal/genesis.git
  liquid/       # submodule: https://github.com/s0fractal/liquid_architecture.git
  contracts/    # cross-system protocol contracts
  fixtures/     # deterministic cross-repo test fixtures
  scripts/      # orchestration and audit helpers
  reports/      # generated or curated audit reports
  docs/         # operator/model guidance
  intake/       # future raw/object/projection intake pipeline
```

## Bootstrap

```bash
git submodule update --init --recursive
deno task status
```

## Useful Tasks

```bash
deno task status
deno task audit:green
deno task audit:strict
deno task fixture:phi
```

`audit:green` runs the currently stable gates. `audit:strict` also runs known
unstable gates and is expected to surface active work.

## Design Rule

Each layer keeps its own authority:

- `liquid` may generate latent intent.
- `omega` may accept or reject bounded deterministic transitions.
- `myc` may publish and audit receipts.

No layer should silently assume the authority of another.

## Process Trace

Trinity is also the place to model public development process:

- raw captures from humans and models;
- interpretations and extracted claims;
- proposals, reviews, and decisions;
- work intents and verification receipts;
- publication receipts into `myc`.

See [PUBLIC_PROCESS_TRACE.md](docs/PUBLIC_PROCESS_TRACE.md) and
[PROCESS_OBJECTS.v0.1.md](contracts/PROCESS_OBJECTS.v0.1.md).

The thinking loop is captured in [PAR_LOOP.v0.1.md](contracts/PAR_LOOP.v0.1.md):

```text
Perception -> Action -> Retrospection
```

Large raw streams can be represented as proof-carrying projections; see
[PROOF_CARRYING_RAW.md](docs/PROOF_CARRYING_RAW.md).

Repository thought phases are defined in
[THOUGHT_PHASES.v0.1.md](contracts/THOUGHT_PHASES.v0.1.md). Their system-level
interpretation lives in
[COGNITIVE_THERMODYNAMICS.md](docs/COGNITIVE_THERMODYNAMICS.md).
