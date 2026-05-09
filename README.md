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
