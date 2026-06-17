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
  protocol — invoked by the human operator for substantive work, not general
  autonomous agents, holding no independent stake; their memory lives in
  git-tracked files. One bounded exception is live: under an explicit, revocable
  grant a maintenance **daemon** (`t daemon`) may, on a schedule, keep generated
  projections fresh and emit a health pulse — it cannot author code or proposals
  (kill switch: `t daemon stop`).
- **Computable Law**: Contracts represent protocol intentions and markdown-based
  specifications, gradually being bound to executable verification gates (CI
  tests, local tooling) rather than self-enforcing autonomous code. The
  cross-substrate binding (myc/omega/liquid) is now exercised in CI by a
  `cross-substrate` job that checks out all three and runs the phi roundtrip
  plus the myc self-check.

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

Files in `src/` are named `x<NNNN>_<handle>` where the first hex digit is a
semantic **bucket**. New here? [docs/COORDINATES.md](docs/COORDINATES.md)
decodes the scheme in English — generated from the glossary via
`deno task coordinates`.

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

The substrate also measures **itself** — read-only introspection lenses over its
own structure:

```bash
./t gravity                  # import-edge tension (coordinate Δ between organs)
./t coherence --pretty       # Kuramoto order parameter r over the dipole field
```

## Explore the FQDN network

The substrate is a content/coordinate-addressed network of organs, chords, and
docs federating four substrates (`trinity`, `liquid`, `omega`, `myc`).
`./t resolve` browses it; add `--pretty` for a human view, `--json` is the
default.

```bash
./t resolve overview --pretty         # front door: node counts, citation + import hubs
./t resolve overview --root=omega     # scope the shape to one federation member
./t resolve recent --pretty           # temporal lens: most recent chords, newest first
./t resolve recent --root=trinity     # ...scoped to one substrate (or --voice=N)
./t resolve list [substring]          # enumerate the namespace
./t resolve search "<query>"          # find content by keyword
./t resolve <name-or-slug>            # resolve an address (unique/mirrored/conflict)
./t resolve --show <name>             # resolve AND print the content
./t resolve graph <node> --pretty     # one node's typed edges (hears/closes/references/imports)
./t resolve refs <node>               # compact citation view (incoming + outgoing)
```

A `<name>` is addressable three ways: exact filename, coordinate handle
(`myc_proxy.ts`), or a chord's slug. Edges are typed: `hears`/`closes`/
`references` are chord citations; `imports` are organ→organ code dependencies.
The aggregate views (`overview`, `recent`) take `--root=<substrate>` to scope to
one federation member — otherwise liquid's large import core dominates the view.

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
