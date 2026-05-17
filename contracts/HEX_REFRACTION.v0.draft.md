---
type: "ContractDescriptor"
version: "0.0"
title: "Hex Refraction: spiral import law and optical naming for hex-space repositories"
status: "draft"
mode: "working-document"
hears:
  - "./HEX_DIPOLE_SEED.v0.draft.md"
  - "./TOPOLOGICAL_GRINDING.v0.draft.md"
  - "./VOICES.v0.1.md"
  - "./STYLE_TRANSITION.v0.draft.md"
  - "../jazz/chords/2026-05-12T130000Z-kimi-riff-heptapod-chord-as-interference-language.md"
  - "../jazz/chords/2026-05-13T051304Z-gemini-riff-u32-heptapod-glyph-format.md"
related:
  - "(architect thread 2026-05-16: hex folders, generalizers, spiral imports, refraction through liquid layers)"
---

# Hex Refraction v0 — working draft

> This is a seed contract for **optical architecture** in hex-space
> repositories. It does not require renaming Trinity's existing `0x*`
> folders. It names the law that would make clean hex folders, substrate
> mounts, function names, imports, and build artifacts compose as one
> refractive system.

## Status

**DRAFT.** No consumer is required to enforce this yet.

This contract is intentionally prior to implementation. It defines vocabulary
and falsifiable import/naming constraints before any large rename or mount
table migration happens.

## Core distinction: attractor vs generalizer

A single hex symbol is an **attractor**: a local direction of semantic gravity.

A repeated path is a **generalizer**: the same attractor surviving recursive
depth, therefore becoming more invariant.

```text
8        local return / loop / continuity attractor
8/8      recurrence rule
8/8/8    cross-layer continuity invariant
8/8/8/8  near-axiom of persistence
```

So yes: something placed at `8/8/8/8` is "more eternal" than something placed
at `8`, but only because it is more recursively generalized. The symbol `8`
is the direction; repeated nesting is the invariant ladder.

## Cardinal hex compass

The minimal compass uses four cardinal poles:

| Symbol | Reading | Opposite |
|---|---|---|
| `0` | void, silence, minimal seed, reset, time-before-form | `8` |
| `4` | structure, mathematics, low entropy, crystal, law | `C` |
| `8` | eternity, loop, return, continuity, recurrence | `0` |
| `C` | chaos, novelty, movement, high entropy, becoming | `4` |

In a 16-position circular hex space:

```text
0 opposite 8
4 opposite C
```

Additional stable poles can be used as diagonals:

| Symbol | Reading |
|---|---|
| `2` | mirror, reflection, self-reading |
| `6` | harmony, living coherence |
| `A` | recursive memory, reflected return |
| `E` | frontier, transition pressure |

This does not replace `HEX_DIPOLE_SEED`; it gives a coarse optical compass for
folders and imports.

## Paths as refraction, not trees

A path is not only containment. A path is a **ray through media**.

```text
0/4/8/C/0
```

reads as:

```text
seed -> structure -> continuity -> mutation -> new seed
```

This is a spiral, not a cycle. Returning to `0` at deeper path depth is not
the same `0`; it is `0'`, a new seed carrying memory of the prior pass.

## Three import kinds

### 1. Radial import

Pure generalizer into local expression.

```text
4/4/4 -> 4/4 -> 4
8/8/8 -> 8/8 -> 8
```

Allowed direction: from more generalized repeated path to less generalized
or local path.

### 2. Spiral import

Current phase may import prior phase as memory/fuel.

```text
0/4 imports 0
0/4/8 imports 0/4
0/4/8/C imports 0/4/8
0/4/8/C/0 imports 0/4/8/C
```

Denied direction: prior phase importing future phase.

```text
0/4 must not import 0/4/8
4/8 must not import 4/8/C
```

That would make the past depend on a future refraction and create a causal
loop.

### 3. Bridge import

Opposite poles require explicit refractor/bridge.

```text
4 <-> C
0 <-> 8
```

Direct cross-pole import is denied unless a named bridge exists. Example:

```text
4/C/refract.ts      # structure entering chaos
C/4/refract.ts      # chaos crystallized into structure
0/8/refract.ts      # void becoming continuity
8/0/refract.ts      # continuity collapsing into reset
```

## Function names as phase transitions

Prefer naming functions by **phase transition**, not implementation detail.

Instead of:

```text
parseChord()
validateSchema()
buildTarget()
publishDist()
```

Prefer a refractive reading:

```text
refract_0_2   raw utterance -> mirror/structured reading
refract_2_4   reflected shape -> formal structure
refract_4_7   structure -> completed artifact
refract_7_8   completed artifact -> persistent/distributable form
```

Composition should read like a path:

```ts
const artifact = refract("0/2/4/7/8", seed);
```

or explicitly:

```ts
const artifact =
  pipe(seed)
    .through(refract_0_2)
    .through(refract_2_4)
    .through(refract_4_7)
    .through(refract_7_8);
```

This makes a workflow resemble light passing through liquid layers: each layer
changes phase/density/direction, and the output becomes the input to the next
medium.

## Build artifact mapping

Common build words can be interpreted as phase regions:

| Word | Hex path | Reading |
|---|---|---|
| `src` | `0/4` | seed becoming structure |
| `target` | `4/7` | structure becoming completed artifact |
| `dist` | `7/8` | completed artifact becoming persistent/distributable |
| `out` | `C/0` or `7/8` | emitted next seed, or distributable artifact depending context |
| `cache` | `8/8` | retained recurrence |
| `tmp` | `0/C` | transient mutation field |

This does **not** require changing tools like Cargo, which expect `target/`.
Instead, a future mount/manifest layer can declare:

```json
{
  "target/": "4/7",
  "dist/": "7/8",
  "tmp/": "0/C",
  "cache/": "8/8"
}
```

Tool compatibility remains; substrate semantics become visible.

## Substrate mounts by role coordinate

Submodules should eventually mount by **role coordinate**, not repo brand:

```text
4/  -> omega   physical law / frozen structure / foundation
6/  -> liquid  operational life / harmony / emergence
7/  -> myc     publication / frontier / completion
2/  -> trinity mirror / meta-language / dispatch
```

But the identity must live in a manifest, not in the bare coordinate:

```json
{
  "type": "SubstrateMount",
  "slot": "4",
  "role": "physical_law_foundation",
  "canonical_name": "omega",
  "aliases": ["omega", "омега", "physical", "фізика"],
  "boundary": "frozen physical substrate; no patch without warrant"
}
```

Rule:

```text
folder name = role coordinate
manifest    = identity and boundary
```

This lets repositories compose recursively without hardcoding brand names into
the topology.

## Import law summary

An import is allowed if one of these is true:

1. **Same-prefix local import:** a path imports inside its own local region.
2. **Pure generalizer import:** a local path imports a repeated-symbol
   invariant of the same attractor.
3. **Prior spiral phase import:** current phase imports its immediate or
   declared prior phase as memory/fuel.
4. **Declared bridge import:** cross-pole transition passes through a named
   refractor/bridge.

An import is denied if:

1. A generalizer imports a concrete child as dependency.
2. A prior phase imports a future phase.
3. Opposite poles import each other without a bridge.
4. A mixed transformation path is treated as if it were a pure invariant.

## Falsifiers

- If simple tree imports are easier to reason about and catch the same class
  of dependency mistakes, spiral import law is over-formalization.
- If two independent voices cannot classify 20 real imports into allowed /
  denied with at least 80% agreement using this draft, the law is too vague.
- If existing build systems cannot be mapped to phase regions without fighting
  their native conventions, semantic mounts should remain metadata only.
- If refraction-style function names make code less readable for ordinary
  maintainers, use them only at workflow boundaries, not every helper.
- If a future implementation allows `0/4` to import `0/4/8`, the spiral law
  is not actually enforced.

## Crawl proposal

Do not rename the repository yet.

First crawl:

1. Pick 20 existing imports/calls from Trinity organs.
2. Manually classify them under this law.
3. Write a small `probes/hex-refraction-import-law-v0/` checker only after
   the manual classification stabilizes.
4. Keep all current paths intact.

Only after the law catches real dependency mistakes should clean hex folders or
role-coordinate submodule mounts be considered.
