---
type: "ContractDescriptor"
version: "0.0-draft"
title: "Hex Route Vocabulary: standard folder-route semantics for 0..F across substrates"
status: "draft"
mode: "working-document"
hears:
  - "./HEX_DIPOLE_SEED.v0.draft.md"
  - "./HEX_REFRACTION.v0.draft.md"
  - "./VOICES.v0.1.md"
  - "../omega/docs/ONTOLOGY/OCTET.md"
related:
  - "(architect 2026-05-16: standard dictionary for vectorizing folder routes, so liquid+omega could be refactored to 0..F top-level folders and mounted into trinity's hex namespace)"
---

# Hex Route Vocabulary v0 — working draft

> Standardized folder-route semantics for the 16 hex digits (0..F), built atop
> `HEX_DIPOLE_SEED.v0` axis pairs. Defines what kind of content belongs at each
> hex slot when a repository organizes its top-level folders by hex coordinate.
> Multilingual handles equal.

## Status

**DRAFT.** No substrate is required to refactor based on this. This vocabulary
is **ground for review**, not migration instruction.

The seed `HEX_DIPOLE_SEED.v0` leaves sign convention open. This vocabulary
proposes a folder-route convention atop the dipole axes, which voices can
AYE/TWEAK/NAY before any rename action.

## Scope

This contract defines **folder-route semantics only**:

- What does it mean for code/data to live at `0x4/` vs `0xC/`?
- What handles (multilingual) name each slot?
- What pole reading (structural vs kinetic) does each digit carry?

This contract does **not** define:

- Operations between vectors (vector algebra — separate concern)
- Natural-language→vector translation (would be its own probe)
- Submodule mount tables (downstream contract once vocabulary stabilizes)
- Any refactor schedule for liquid / omega

## Foundation: dipole pair convention

From `HEX_DIPOLE_SEED.v0`, eight signed axes:

| Axis | Pair  | Axis name              |
| ---- | ----- | ---------------------- |
| 0    | 0 ↔ 8 | `void_infinity`        |
| 1    | 1 ↔ 9 | `first_penultimate`    |
| 2    | 2 ↔ A | `mirror_apex`          |
| 3    | 3 ↔ B | `triangle_build`       |
| 4    | 4 ↔ C | `foundation_container` |
| 5    | 5 ↔ D | `action_decision`      |
| 6    | 6 ↔ E | `harmony_emergence`    |
| 7    | 7 ↔ F | `completion_frontier`  |

**Proposed sign convention for folder-route v0:**

- **Lower digit (0-7)** = **structural / static / stable** pole
- **Higher digit (8-F)** = **kinetic / dynamic / mutating** pole

Reading: pair has one constructive pole and one transitional pole. Lower digit =
"what is built / what holds"; higher digit = "what moves / what becomes". This
aligns with Codex's `HEX_REFRACTION` cardinal compass (0↔8 opposite, 4↔C
opposite, structure↔chaos).

This is a **vocabulary convention**, not a frozen invariant. Voices may TWEAK
before AYE.

## The 16 slots

### Structural poles (0-7)

#### `0` — void / seed / dispatch ground

- **Axis:** 0 (void_infinity), structural pole
- **Folder role:** foundation primitives, dispatch surface, glossary, root
  ledger
- **What goes here:** routing tables, primitive composers
  (all/each/pipe/cond/try), top-level dispatcher, master glossary
- **What does not:** implementation-heavy organs, governance flow, mutation
  logic
- **Trinity de facto:** `0x0/00.ndjson` (glossary), `0x0/01.ts` (dispatcher),
  `0x0/02..0E.ts` (functional primitives)
- **Handles:** `void`, `нуль`, `seed`, `dispatch`, `ground`, `пустота`, `корінь`

#### `1` — first / origin / genesis

- **Axis:** 1 (first_penultimate), structural pole
- **Folder role:** initial state, genesis records, first-of-kind documents
- **What goes here:** genesis-hash records, initial state seeds, first-witness
  records
- **What does not:** terminal states, derivatives, completion artifacts
- **Trinity de facto:** mostly unused at top level (would host genesis-anchored
  records)
- **Handles:** `first`, `перший`, `genesis`, `початок`, `origin`, `seed-record`

#### `2` — mirror / reflection / self-read

- **Axis:** 2 (mirror_apex), structural pole
- **Folder role:** self-inspection, identity organs, mirror reads
- **What goes here:** status reflections, voice profiles, self-portraits, inbox,
  cognition-traces
- **What does not:** outward mutations, governance decisions
- **Trinity de facto:** `0x2/0` (voices), `0x2/3` (self-portrait), `0x2/4`
  (status), `0x2/8..9` (cognition_*), `0x2/D` (inbox)
- **Handles:** `mirror`, `дзеркало`, `reflection`, `self`, `я`, `відбиток`

#### `3` — triangle / composition / stable form

- **Axis:** 3 (triangle_build), structural pole
- **Folder role:** composition primitives, recipes, balance recommendations
- **What goes here:** chord composition scaffolds, workflow recipes, balance
  recommendations
- **What does not:** ongoing builders, generators, dynamic construction
- **Trinity de facto:** `0x3/A` (balance), `0x3/C` (recipes), `0x3/D`
  (chord_play scaffolds)
- **Handles:** `triangle`, `трикутник`, `composition`, `recipe`, `рецепт`,
  `баланс`

#### `4` — foundation / structure / contracts

- **Axis:** 4 (foundation_container), structural pole
- **Folder role:** data structures, contracts, snapshots, propose surface
- **What goes here:** typed data definitions, contract schemas, propose
  primitives, snapshot envelopes
- **What does not:** code that mutates substrate, audit/review of structure
- **Trinity de facto:** `0x4/D` (propose), `0x4/E` (snapshot), `0x4/F`
  (contracts), `0x4/A` (capabilities)
- **Handles:** `foundation`, `фундамент`, `structure`, `contract`, `основа`,
  `структура`

#### `5` — action / mutation / apply

- **Axis:** 5 (action_decision), structural pole (active grasp)
- **Folder role:** mutations, applications, code that CHANGES substrate state
- **What goes here:** apply primitives, validators that gate writes,
  apply-codeicide, cross-verify
- **What does not:** passive reads, audit-only, governance decisions
- **Trinity de facto:** `0x5/4` (validate), `0x5/D` (apply-codeicide), `0x5/E`
  (cross-verify), `0x5/F` (verify)
- **Handles:** `action`, `дія`, `apply`, `mutation`, `застосувати`, `рухати`

#### `6` — harmony / audit / review

- **Axis:** 6 (harmony_emergence), structural pole (static balance)
- **Folder role:** audit, review, court, coherence checks
- **What goes here:** audit organs, cowitness, court, health checks, ontology
  coverage
- **What does not:** code that applies changes, output artifacts, daemon
- **Trinity de facto:** `0x6/3` (health), `0x6/C` (audit), `0x6/D` (cowitness),
  `0x6/E` (court), `0x6/A` (ontology)
- **Handles:** `harmony`, `гармонія`, `audit`, `review`, `огляд`, `баланс`,
  `coherence`

#### `7` — completion / verdict / artifact

- **Axis:** 7 (completion_frontier), structural pole (sacred end)
- **Folder role:** output artifacts, verdicts, completion gates, anchor
  preparation
- **What goes here:** verdict outputs, daemon (completion surface, not action),
  grind, anchor-prep
- **What does not:** uncommitted work, draft state, mutation surface
- **Trinity de facto:** `0x7/0` (grind), `0x7/D` (verdict), `0x7/E`
  (anchor-prep), `0x7/F` (daemon)
- **Handles:** `completion`, `завершення`, `artifact`, `verdict`, `вердикт`,
  `результат`

### Kinetic poles (8-F)

#### `8` — infinity / recurrence / persistence

- **Axis:** 0 (void_infinity), kinetic pole
- **Folder role:** persistence layers, recurrence rules, cache, long-cycle
  continuity
- **What goes here:** persistent state stores, cache layers, recurrence rules,
  content-addressed indexes
- **What does not:** one-shot operations, transient state
- **Trinity de facto:** mostly unused at top level
- **Per HEX_REFRACTION:** `cache` ≈ `8/8`
- **Handles:** `infinity`, `нескінченність`, `cycle`, `цикл`, `persistence`,
  `пам'ять-довга`, `recurrence`

#### `9` — penultimate / closing / finalization

- **Axis:** 1 (first_penultimate), kinetic pole
- **Folder role:** terminal states, finalization, last-of-kind records
- **What goes here:** finalization logic, terminal-state markers, closing
  pipelines
- **What does not:** initial state, generative records
- **Trinity de facto:** unused
- **Handles:** `penultimate`, `передостанній`, `final`, `closing`, `закриття`

#### `A` — apex / meta / recursive memory

- **Axis:** 2 (mirror_apex), kinetic pole (start-of-new-cycle)
- **Folder role:** meta-abstraction, recursive memory, language about language
- **What goes here:** meta-language organs, recursive reflection, language
  design records
- **What does not:** concrete implementations, leaf organs
- **Trinity de facto:** unused at top level
- **Handles:** `apex`, `апекс`, `meta`, `мета`, `recursive`, `recursive_memory`

#### `B` — build / construction / generator

- **Axis:** 3 (triangle_build), kinetic pole (ongoing construction)
- **Folder role:** active construction, builders, generators, scaffolding
- **What goes here:** code generators, builders, scaffolding tools
- **What does not:** finished artifacts, static compositions
- **Trinity de facto:** unused
- **Per HEX_REFRACTION:** `target` ≈ `4/7` (structural→completion); `B` would
  host the construction process itself
- **Handles:** `build`, `будувати`, `construction`, `generator`, `генератор`,
  `створення`

#### `C` — container / chaos / mutation field

- **Axis:** 4 (foundation_container), kinetic pole (enclosing vessel, high
  entropy)
- **Folder role:** high-entropy zone, mutation field, transient state, tmp
- **What goes here:** scratch space, mutation experiments, transient state
- **What does not:** stable contracts, frozen invariants
- **Trinity de facto:** unused
- **Per HEX_REFRACTION:** `tmp` ≈ `0/C`
- **Handles:** `container`, `контейнер`, `chaos`, `хаос`, `mutation`, `мутація`,
  `tmp`

#### `D` — decision / judgment / governance verdict

- **Axis:** 5 (action_decision), kinetic pole (choice-making)
- **Folder role:** decisional/governance outcomes, verdicts before action
- **What goes here:** decision artifacts, governance verdicts,
  propose/cowitness/verdict/apply pipeline endpoints
- **What does not:** mechanical action (that's 5), audit before decision
  (that's 6)
- **Trinity de facto:** `0x4/D` (propose), `0x5/D` (apply-codeicide), `0x6/D`
  (cowitness), `0x7/D` (verdict). **Note:** `D` slot is currently the "decision"
  digit across all axes — emergent convention, supports this vocabulary.
- **Handles:** `decision`, `рішення`, `judgment`, `verdict-pre-action`,
  `вердикт`, `присуд`

#### `E` — emergence / kinetic coherence / state pulse

- **Axis:** 6 (harmony_emergence), kinetic pole (kinetic flow)
- **Folder role:** dynamic coherence, state pulse, emergence signals
- **What goes here:** state-pulse emitters, coherence-in-motion, emergence
  diagnostics
- **What does not:** static audit (that's 6), one-shot reviews
- **Trinity de facto:** `0x2/E` (status), `0x6/E` (court — court emits live
  coherence reads)
- **Handles:** `emergence`, `виявлення`, `flow`, `потік`, `kinetic-coherence`,
  `пульс`

#### `F` — frontier / anchor / publishing

- **Axis:** 7 (completion_frontier), kinetic pole (absolute boundary)
- **Folder role:** publishing, anchoring, distribution surface
- **What goes here:** publishing tools, anchor primitives (Bitcoin/IPFS),
  distribution endpoints
- **What does not:** internal-only artifacts, draft state
- **Trinity de facto:** `0x4/F` (contracts — published projection), `0x7/F`
  (daemon — distribution authority)
- **Per HEX_REFRACTION:** `dist` ≈ `7/8`, but `F` itself = the act of
  publication
- **Handles:** `frontier`, `рубіж`, `anchor`, `якір`, `publishing`,
  `публікація`, `distribution`

## Cross-substrate mount semantics (proposed, not active)

If liquid/omega were eventually refactored to top-level hex folders, substrate
mounts inside trinity could follow:

| Trinity slot | Mounted substrate            | Reading                                                       |
| ------------ | ---------------------------- | ------------------------------------------------------------- |
| `0x4/`       | omega (frozen foundation)    | foundation pole; omega's role is structural law               |
| `0x6/`       | liquid (operational harmony) | harmony pole; liquid's role is live coherence                 |
| `0x7/F/`     | myc (publishing frontier)    | published frontier slot                                       |
| `0x2/`       | trinity (mirror meta)        | trinity is itself; this is where trinity's mirror organs live |

**Identity vs coordinate:** following `HEX_REFRACTION`, the folder name declares
**role**, the manifest declares **identity**:

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

**This section is reference-only.** No mount table is being committed.

## Git and artifact policy by route symbol (draft)

Route vocabulary should eventually drive repository hygiene. The same symbol
should carry the same default git/artifact policy anywhere it appears: trinity
root, a substrate directory, or a future nested hex namespace.

This policy is **semantic default**, not an unconditional filesystem rule.
Contracts, receipts, proofs, and anchor manifests may be tracked even when they
are generated, because their role is governance state rather than build trash.

| Symbol | Default git policy | Artifact policy                                                                                                                  |
| ------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `0`    | track              | Primitive dispatch, glossary, seeds.                                                                                             |
| `1`    | track              | Genesis / first-witness records.                                                                                                 |
| `2`    | track              | Mirror reads, status, self-inspection receipts.                                                                                  |
| `3`    | track              | Recipes, composition scaffolds, balance outputs when intentionally recorded.                                                     |
| `4`    | track              | Contracts, schemas, snapshots, structural manifests.                                                                             |
| `5`    | track              | Mutation/apply code and validation gates.                                                                                        |
| `6`    | track              | Audit, court, health, cowitness code and receipts.                                                                               |
| `7`    | track selectively  | Verdicts, anchors, release manifests; avoid bulky generated blobs unless they are pinned evidence.                               |
| `8`    | ignore by default  | Cache, recurrence state, derived indexes. Track only manifests/proofs describing the recurrence.                                 |
| `9`    | track selectively  | Finalization records; ignore temporary closing buffers.                                                                          |
| `A`    | track              | Meta-language, recursive memory, stable abstractions.                                                                            |
| `B`    | ignore by default  | Build outputs, generated code, scaffolding products. Track source generators and pinned generated proofs only.                   |
| `C`    | ignore by default  | Scratch, tmp, high-entropy experiments, mutation sandboxes.                                                                      |
| `D`    | track              | Decisions, governance verdicts, judgment records.                                                                                |
| `E`    | track selectively  | Dynamic coherence pulses; track summaries/receipts, ignore raw high-volume telemetry.                                            |
| `F`    | track selectively  | Publishing/anchor surfaces; track manifests and deployment recipes, ignore secrets and bulky dist outputs unless release-pinned. |

Practical reading:

```text
any path segment semantically mapped to 8/8 -> cache policy
any path segment semantically mapped to B   -> generated/build policy
any path segment semantically mapped to C   -> scratch/tmp policy
any path segment semantically mapped to 7/F -> publish/anchor policy
```

This is the rule behind common folder mappings:

```json
{
  "cache/": "8/8",
  "target/": "B or 4/7 depending context",
  "dist/": "7/8 or F depending context",
  "tmp/": "C",
  "scratch/": "C"
}
```

The route symbol names the **default**. A local manifest can override it when
the generated object is itself a receipt, proof, anchor payload, or other
governance artifact.

## Collision risks (real, surfaced)

If liquid/omega refactor proceeds, these tensions must be resolved:

### Trinity's own 0x2/ already populated

Trinity's `0x2/` hosts five+ live mirror organs (voices, self-portrait, status,
inbox, cognition_*). Mounting trinity-at-2 collides. Options:

- Trinity does NOT mount itself (trinity is the meta-host; only submodules
  mount, trinity occupies the namespace directly)
- Or trinity's mirror organs move to a sub-slot inside `0x2/2/`

This needs voice review before any mount design.

### Tools expect non-hex conventional folders

- Cargo expects `src/`, `target/`
- npm/deno expect `dist/`, `node_modules/`
- Python expects `__init__.py` patterns

Per `HEX_REFRACTION`, the resolution is **manifest-as-mapping**, not
tool-fighting. Conventional folder names stay; their hex semantics become
metadata. Build-artifact mapping (from HEX_REFRACTION):

```json
{
  "src/": "0/4",
  "target/": "4/7",
  "dist/": "7/8",
  "tmp/": "0/C",
  "cache/": "8/8"
}
```

### Omega is FROZEN

Omega's RFC v1.0 is Bitcoin-inscribed (Genesis Hash `0x549A6307`). Renaming
omega's top-level folders = patching frozen substrate. **Requires warrant** (3/5
oracle AYE via Senate) + re-anchor of any changed invariants. **Not a unilateral
refactor.**

### Liquid is operational

Liquid Era 1431 has live agents, running ledger, SQLite refs to file paths.
Folder rename breaks running state. Migration path: **incremental
shadow-mounting** (`liquid/00_core/` ↔ `liquid/4/` symlinks during transition),
not big-bang rename.

## Falsifiers

- **Vagueness:** If two voices classify 20 existing trinity organs into hex
  slots using this vocabulary with <80% agreement, the definitions are too vague
  and need tightening before adoption.
- **Pole-convention failure:** If across substrates, the "structural-lower vs
  kinetic-higher" convention keeps producing counter-intuitive classifications
  (e.g., naturally kinetic content keeps wanting to live at 0-7), the convention
  is wrong and should flip or split into per-substrate conventions.
- **Handle ambiguity:** If voices use different multilingual handles for the
  same digit and the substrate cannot resolve them through glossary, the handle
  set is incomplete or ambiguous.
- **Tooling collision:** If applying this vocabulary requires fighting
  Cargo/npm/deno conventions beyond manifest-mapping, the vocabulary is
  incompatible with operational substrates and should remain trinity-only.
- **Frozen-substrate stress:** If omega's invariants cannot map to this
  vocabulary without rewriting Φ-manifest semantics, the vocabulary is
  trinity-specific, not substrate-universal.

## Acceptance gate for v0.1 (proposed)

This vocabulary moves from `v0.0-draft` to `v0.1` only when:

1. At least 3 voices (codex, gemini, kimi) review and AYE/TWEAK the slot
   definitions.
2. At least 20 existing trinity organs are classified under this vocabulary with
   ≥80% inter-voice agreement.
3. Multilingual handles are extended by voices in their own languages (no
   canonical-language privilege).
4. No refactor of liquid or omega is required for v0.1 elevation.

## What this contract does NOT do

- Does not rename any folder in any substrate.
- Does not modify `HEX_DIPOLE_SEED.v0` (the underlying axis names).
- Does not commit substrate to using this vocabulary operationally.
- Does not preclude refinement: v0.0 → v0.1 may shift slot semantics.
- Does not establish mount table for any submodule.
- Does not propose a refactor schedule for liquid or omega.

## What this contract enables (if it survives review)

- Common folder-route language across trinity / liquid / omega / myc.
- Voice-readable classification of substrate code by hex slot.
- Foundation for `HEX_REFRACTION` import law (which paths are radial, which are
  spiral, which are bridge) once slots are stable.
- Eventual substrate mount tables that declare role-coordinate per manifest.
- Multilingual navigation: any voice can speak about hex slots in their native
  language without canonical-English overhead.

## Provenance

- Architect's ask: "видай стандартний словник векторизації маршрутів папок, щоб
  можна було ліквід зарефакторити і омегу" (2026-05-16)
- Builds atop: `HEX_DIPOLE_SEED.v0` (3-voice latent convergence, 2026-05-13),
  `HEX_REFRACTION.v0.draft` (Codex, 2026-05-16T091705Z)
- This draft: claude-opus-4-7-1m, 2026-05-16. Reversible. Seed for voice review,
  not migration.
