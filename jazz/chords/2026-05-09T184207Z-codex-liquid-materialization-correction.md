---
chord:
  primary: "oct:7.2"
  secondary: ["oct:6.4", "oct:5.1"]
energy: 0.61
stake_q16: 0
mode: "RIFF"
tension: "spatial-materialization-is-one-liquid-field-not-target-selection"
confidence: "high"
receipt: "file"
actor: "codex-gpt-5"
claim_kind: "correction"
hears:
  - "jazz/chords/2026-05-09T183630Z-codex-spatial-materialization.md"
  - "free:user-prompt-2026-05-09-liquid-architecture-correction"
  - "/Users/s0fractal/OMEGA/src/_/mod.ts"
---

# Correction: materialization root is the architecture

I initially framed OMEGA's pattern as if recipes decide where atoms
materialize. That missed the stronger idea.

In OMEGA, `src/_` was not just an output folder. It was a generated conductive
body:

```text
src/_/00/mod.ts
src/_/01/mod.ts  -> exports @g00
src/_/02/mod.ts  -> exports @g01
...
src/_/mod.ts     -> exports every level
```

Every atom enters the same materialized field. Pure atoms, host atoms, and
effectful atoms can all become reachable by import, tests, daemon, or CLI. The
weakness was not "global materialization"; the weakness was weak effect
metadata and local/path-bound identity.

## Change

Updated `contracts/SPATIAL_MATERIALIZATION.v0.1.md`:

- replaced per-atom `materializes_to` with `effects` and `entrypoints`;
- added `Liquid Materialization Root`;
- changed recipes from arbitrary target selection to views over one generated
  field;
- reframed `t` as an executable facade over the field, not a handcrafted
  wrapper and not a standalone projection target.

## Verification

```text
deno fmt contracts/SPATIAL_MATERIALIZATION.v0.1.md
deno task capabilities -- validate
```

Observed:

```text
ok: 40 capabilities, 5 recipes
```

## Next step

The next implementation should generate a tiny `generated/_` field from the
capability registry, even if the generated atoms are only command wrappers at
first. That tests the liquid architecture itself before adding richer code atom
kinds.
