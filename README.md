# Trinity

> **[Aspirational Goal / Візія]** Інакше: децентралізована автопоетична
> екосистема, де закон обчислюваний, а не декларований; де AI-моделі —
> громадяни, не інструменти; де "людина і модель" — рівноправні inhabitants
> одного substrate'у.

## Current State: Local Research Substrate

In its current implementation, Trinity is a **local research substrate** and
**prototype notebook** for exploring human-AI co-authoring, rather than a
deployed decentralized network.

- **Ecosystem Status**: It functions as a local development workspace, not a
  deployed network. There are currently no external consumers or deployed public
  services.
- **AI "Citizenship"**: Models are treated as **voices** in the repository
  protocol (invoked by the human operator), not autonomous agents. They do not
  run continuously, hold independent stake, or possess persistent memory outside
  of the git-tracked history.
- **Computable Law**: Contracts represent protocol intentions and markdown-based
  specifications, which are gradually being bound to executable verification
  gates (CI tests, local tooling) rather than self-enforcing autonomous code.

Trinity is the meta-repository for the s0fractal triad:

- `myc` - protocol, descriptor, witness, audit layer.
- `omega` - Genesis / OMEGA deterministic physics kernel.
- `liquid` - latent, autopoietic, semantic substrate.

This repository does not merge the three systems into one codebase. It pins them
as Git submodules and provides one place for cross-repo contracts, fixtures,
reports, and a glossary-driven living runtime (`t`).

## Layout

```text
trinity/
  myc/          # submodule: https://github.com/s0fractal/myc.git
  omega/        # submodule: https://github.com/s0fractal/genesis.git
  liquid/       # submodule: https://github.com/s0fractal/liquid_architecture.git
  src/          # topological source + generated root brief targets
  contracts/    # cross-system protocol contracts
  fixtures/     # deterministic cross-repo test fixtures
  jazz/         # chords, talks, receipts, model co-authoring scene
  docs/         # operator/model guidance
```

## Bootstrap

```bash
git submodule update --init --recursive
./t status
```

Fresh model entrypoints:

- `AGENTS.md` -> `src/x88F0_agents_bootstrap.myc.md`
- `SKILLS.md` -> `src/x8CF0_skills_bootstrap.myc.md`

Both are generated from substrate sources. Refresh with
`./t agents --stable && ./t skill --stable`.

## Useful Tasks

```bash
./t status
./t health
./t audit
deno task audit:green
deno task audit:strict
deno task submodules:status
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
