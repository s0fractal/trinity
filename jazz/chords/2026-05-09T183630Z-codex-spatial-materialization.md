---
chord:
  primary: "oct:7.2"
  secondary: ["oct:5.1", "oct:6.4", "oct:3.2"]
energy: 0.72
stake_q16: 0
mode: "PROPOSAL"
tension: "borrow-omega-ontology-builder-as-spatial-materialization"
confidence: "medium-high"
receipt: "file"
actor: "codex-gpt-5"
claim_kind: "proposal"
hears:
  - "free:user-prompt-2026-05-09-omega-i-build-ontology"
  - "/Users/s0fractal/OMEGA/src/07/build_ontology.ts"
  - "/Users/s0fractal/OMEGA/I"
  - "myc/docs/DescriptorAlgebra.md"
  - "contracts/TRINITY_CAPABILITIES.v0.1.md"
---

# Proposal: Spatial materialization, not direct OMEGA port

I inspected the old OMEGA ontology builder and `I/` tree. The transferable
pattern is strong:

```text
markdown atoms -> validated DAG -> causality layers -> stable facades -> tests
```

That is exactly the ergonomic surface Trinity needs if future agents should
think in imports, capabilities, and recipes instead of rediscovering paths.

## What OMEGA got right

- Each markdown atom declared `id`, `type`, `deps`, `vars`, code blocks, and
  tests.
- The builder topologically sorted nodes into levels.
- Each generated `mod.ts` re-exported the previous level, so imports were
  stable (`@g02`, `src/_/02/mod.ts`) even while source atoms moved.
- Determinism and semantic firewalls ran before emission.
- Generated files carried SSoT source comments.
- The generator wiped output dirs before rebuilding, preventing stale outputs.

## What Trinity should change

The old system was local and path-bound. Trinity should make it spatial:

- source identity should be content-addressed (`h.*`) and resolvable through
  MYC, not only `file://.../I/path`;
- frontmatter should name exports, imports, capabilities, material targets,
  tests, and receipt policy;
- materialization should be recipe-selected, not always "build all";
- generated files are disposable projections, not source;
- receipts should record descriptor hashes, output hashes, commands, and exit
  codes.

## Change made

- Added `contracts/SPATIAL_MATERIALIZATION.v0.1.md`.
- Added capability entries:
  - `trinity.spatial-materialization.contract`
  - `trinity.capabilities.validate`
- Added recipe:
  - `recipe.spatial-materialization-bootstrap`

Validation now reports:

```text
ok: 40 capabilities, 5 recipes
```

## Recommended next step

Do not build a full code generator yet.

Build the smallest materializer:

```text
capabilities/trinity.capabilities.v0.1.json
  -> generated SpatialNodeDescriptor stubs
  -> generated model-readable index/facade
  -> deno task capabilities -- validate
  -> receipt
```

That proves `md/JSON SSoT -> generated md/index -> validator -> receipt`
before generating executable code.

## Falsifier

This approach is wrong if:

- generated projections become harder to inspect than hand-written files;
- models edit generated outputs instead of source descriptors;
- MYC resolution makes local iteration too slow;
- side effects cannot be declared precisely enough for reversible recipes;
- no tool consumes the spatial descriptors, turning them into another README.
