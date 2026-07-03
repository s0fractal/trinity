---
type: "ContractDescriptor"
version: "0.1"
title: "Spatial Materialization"
status: "draft"
derived_from:
  - "~/OMEGA/src/07/build_ontology.ts"
  - "~/OMEGA/I"
  - "myc/docs/DescriptorAlgebra.md"
  - "contracts/TRINITY_CAPABILITIES.v0.1.md"
---

# Spatial Materialization

This contract captures the portable part of the older OMEGA ontology builder:

```text
markdown atoms -> validated graph -> layered facades -> compiled/tested outputs
```

The old system generated TypeScript, Rust, and AssemblyScript from markdown
nodes in `~/OMEGA/I`, then emitted stable import barrels such as
`src/_/02/mod.ts`. That made mutation cheap: a model could change a semantic
atom without needing to know every downstream import path.

Trinity can borrow the pattern, but should combine it with MYC:

```text
SpatialNodeDescriptor      content-addressed platonic atom
MYC descriptor graph       distributed SSoT and witness layer
liquid materialization     one generated phase-spiral conductivity field
spectral implementations   TS / Rust / WGSL / AS as realizations of one atom
generated facades          stable imports / CLI / tests over that field
```

The source of truth is not the generated code. The source of truth is the
addressed descriptor graph plus materialization receipts.

## OMEGA Pattern To Preserve

OMEGA's builder had several good primitives:

- `id`, `type`, `deps`, `vars`, `tests` in markdown frontmatter;
- topological sorting into causality levels;
- facade files where level `N` re-exported level `N-1`;
- generated files marked with their SSoT source path;
- determinism and semantic firewalls before emission;
- generated tests from node-local examples;
- complete directory wipe before regeneration to avoid stale outputs.

The key ergonomic win was import stability:

```ts
import { something } from "@g02";
```

The model did not need to know which specific file provided `something`; the
materializer knew.

## OMEGA Pattern To Replace

The old builder is too monolithic for Trinity as-is:

- frontmatter is local and path-bound, not content-addressed;
- source identity is `file://.../I/<path>`, not a MYC-resolved descriptor;
- parser heuristics infer too much from raw code blocks;
- schema is code-local instead of a shared contract;
- outputs are generated from one filesystem tree, not a distributed graph.

The global layer selection itself is not the flaw. It is the strongest part:
there is one generated conductivity field, and every atom can enter it. The
thing to replace is only the local/path-bound source model and the weak effect
metadata.

The linear `00..NN` causality structure is also not the final form. It was a
working prototype of topology. Trinity can generalize it into a phase spiral:
eight phase sectors per octave, then a new turn of the spiral.

```text
turn 0: 00.raw-fantasy -> ... -> 07.compost
turn 1: 08.raw-fantasy -> ... -> 15.compost
turn 2: 16.raw-fantasy -> ... -> 23.compost
```

Or, in import/facade form:

```text
generated/_/00/raw-fantasy/mod.ts
generated/_/00/hypothesis/mod.ts
...
generated/_/01/raw-fantasy/mod.ts
```

The materializer can still topologically sort, but it places atoms into
phase-sector coordinates instead of pretending that "higher level" is the only
meaningful direction.

## Spatial Node Descriptor

Draft minimum frontmatter:

```yaml
---
type: "SpatialNodeDescriptor"
version: "0.1"
id: "trinity.cognition.field"
fqdn: "h.<12hex>.trinity.cognition.field.spatial.trinity.md"
kind: "command | contract | pure_fn | module | recipe | facade | receipt | doc"
owner: "trinity | myc | omega | liquid"
phase: "proposal | experiment | receipt | formula | crystal | compost"
spiral:
  turn: 1
  sector: "receipt"
  angle_q16: 32768
exports:
  - "trinity.cognition.field"
imports:
  - symbol: "trinity.cognition.recommend"
    from: "h.<12hex>..."
deps:
  - "h.<12hex>..."
capabilities:
  - "trinity.cognition.field"
effects:
  reads:
    - "src/x5288_cognition_recommendation.latest.myc.json"
    - "jazz/chords/"
  writes:
    - "src/x2588_cognition_field.latest.myc.json"
    - "src/x2588_cognition_field.latest.myc.md"
  side_effects:
    - "file-write"
entrypoints:
  cli:
    - "t field"
  imports:
    - "@trinity"
spectra:
  ts:
    block: "typescript"
    verifier: "deno check"
  rust:
    block: "rust"
    verifier: "cargo test"
  wgsl:
    block: "wgsl"
    verifier: "shader compile/readback test"
tests:
  - command: "deno check tools/cognition_field.ts"
    expected: "exit_code == 0"
canonicalization: "spatial-node-v0.1"
---
```

Body sections may contain prose, code blocks, recipes, or verification notes.
The frontmatter names graph semantics; the body carries payload.

## Liquid Materialization Root

OMEGA's strongest move was that materialization location was not an open
question. The ontology did not ask each atom "where should I put you?" It
compiled the whole graph into one generated architecture:

```text
src/_/00/mod.ts
src/_/01/mod.ts  -> exports @g00
src/_/02/mod.ts  -> exports @g01
...
src/_/mod.ts     -> exports every level
```

That root was sometimes gitignored because it was not source. It was a
regenerable conductive body. Once an atom entered the body, it could be reached
by import, test, daemon, CLI, or higher-level orchestration without the model
knowing its physical source file.

Trinity should preserve this:

```text
descriptors/atoms       source of truth
generated/_/<turn>/<phase>/mod.ts
generated/_/mod.ts      whole-field facade
generated/t.ts          CLI facade over selected entrypoints
generated/tests/        receipts over materialized behavior
```

Effects do not exclude an atom from the field. Effects must be declared so the
materializer can route them into the correct affordance surface:

| Effect class      | Materialized as                                |
| ----------------- | ---------------------------------------------- |
| `none`            | pure import / deterministic test candidate     |
| `file-read`       | command/helper import with read policy         |
| `file-write`      | CLI action requiring receipt policy            |
| `submodule-write` | gated action, not automatic import side effect |
| `serve`           | long-running command entrypoint                |
| `network`         | capability-gated command                       |

## Platonic Atom, Spectral Code

An atom is not "the TypeScript implementation". It is the invariant shape that
can refract into several implementation spectra:

```text
       SpatialNodeDescriptor
               |
   -------------------------
   |          |            |
  TS        Rust         WGSL
   |          |            |
deno test  cargo test  shader/readback
   \          |          /
    \         |         /
     equivalence receipt
```

This directly addresses a failure mode in the newer Omega: TS, Rust, and WGSL
equivalent logic can drift, causing golden traces to separate. If the atom owns
the invariant and each language block is only a spectral realization, the
materializer can generate equivalence tests and golden vectors from one source
instead of relying on humans or models to keep parallel implementations aligned.

The atom should declare:

- semantic invariant;
- accepted spectra (`ts`, `rust`, `wgsl`, `as`, `python`, etc.);
- per-spectrum verifier;
- cross-spectrum equivalence vectors;
- effect class, if the atom is not pure.

Pure math atoms should be able to emit TS/Rust/WGSL from one descriptor. Effect
atoms can still enter the field, but their spectra may be command wrappers, host
functions, or gated entrypoints rather than pure kernels.

## Materialization Recipe

A materialization recipe should not decide arbitrary output paths for atoms. It
selects a view over the same generated field: which atoms are exposed as CLI
commands, which tests run, which subset is published, or which context bundle is
prepared for a model.

```yaml
---
type: "MaterializationRecipeDescriptor"
version: "0.1"
id: "recipe.trinity.t-cli"
select:
  owners: ["trinity", "myc"]
  capabilities:
    - "trinity.cognition.field"
    - "myc.verify"
projection:
  field_root: "generated/_"
  entrypoint: "generated/t.ts"
  layer_strategy: "phase-spiral"
  expose:
    cli:
      - "t field"
      - "t myc verify"
verification:
  commands:
    - "deno check generated/_/mod.ts"
    - "deno check generated/t.ts"
    - "deno task capabilities -- validate"
receipt_policy: "write MaterializationReceiptDescriptor"
---
```

The same descriptor graph can produce different projections:

- a `t` CLI surface;
- a model prompt/context bundle;
- a test harness;
- an import facade;
- a public MYC publication set;
- a human index.

## Spatial Frontmatter

"Spatial" means a descriptor locates itself in several coordinate systems at
once:

- content address: `fqdn` / `payload_hash` / `descriptor_hash`;
- semantic address: `id`, `exports`, `imports`;
- substrate address: `owner`, `capabilities`;
- causal address: `deps`, topological level;
- material address: generated level, exported symbols, entrypoints;
- spectral address: implementation languages and equivalence vectors;
- proof address: `tests`, `receipt_policy`.

This is the missing upgrade over OMEGA frontmatter. It lets a model answer:

```text
What can I import?
What command already does this?
What depends on this?
Where does this atom enter the conductive field?
Which spectra implement this atom?
Do the spectra still agree?
What receipt proves it?
```

without reading the whole repository.

## Materializer Rules

1. Resolve descriptors through MYC or local registry before reading paths.
2. Validate frontmatter with a shared schema before using body code.
3. Topologically sort by `deps` and `imports`.
4. Reject cycles unless the recipe explicitly requests a deferred/runtime edge.
5. Place atoms into phase-spiral coordinates, not only integer levels.
6. Generate disposable outputs only under the declared materialization root.
7. Mark generated files with source descriptor FQDNs, not only local paths.
8. Generate or run cross-spectrum equivalence checks where declared.
9. Run recipe verification commands after generation.
10. Emit a receipt that records descriptor hashes, output hashes, commands, and
    exit codes.

## Relationship To `t`

The `t` CLI should not start as a handcrafted command table.

Better sequence:

```text
capability registry
  -> SpatialNodeDescriptor for each command/recipe
  -> materialize universal field
  -> materialize t facade from field entrypoints
  -> tests verify generated CLI
  -> receipt enters MYC / Trinity scene
```

Then `t` is just one executable facade over the liquid field. If the capability
registry changes, the field and `t` can be regenerated instead of manually
edited.

## Minimal Next Step

Do not port OMEGA's full builder yet.

The smallest useful step is:

```text
live `t capabilities` projection
  -> generated markdown SpatialNodeDescriptor stubs
  -> generated/_/<turn>/<phase> phase-spiral facade
  -> generated/t.ts entrypoint facade
  -> deno task capabilities -- validate
```

That creates the loop:

```text
md/JSON SSoT -> liquid generated field -> validator/test -> receipt
```

After that loop holds, richer code generation can be added as more atom kinds.

## Falsifier

This approach is wrong if:

- generated projections become harder to inspect than hand-written files;
- models edit generated outputs instead of source descriptors;
- MYC resolution makes local iteration too slow;
- recipes cannot declare side effects precisely enough to keep materialization
  reversible;
- the registry drifts because no validator or materializer reads it.
