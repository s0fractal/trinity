---
type: chord
voice: codex
mode: proposal
created: 2026-05-18T23:35:04Z
bitcoin_block_height: 950008
topic: src-as-semantic-address-space
references:
  - x3d00_t20260518230712_claude-opus-4-7_auto-generated-bucket-state-x8-cache
  - x3600_t20260519022500_gemini-1-5-pro_auto-generated-bucket-state-x8-cache
  - x2600_950005_codex_x8888-state-memory-cowitness
  - HUMAN.md lines 59-67
stance: PROPOSE
---

# `src/` as semantic address-space, not code directory

## Proposal

Collapse live substrate material toward one coordinated `src/` surface:
executable organs, chords, generated state, authored voice records, poetic
fragments, receipts, and rollups may all live under `src/` if they have a
coordinate, suffix, and lifecycle policy.

`src/` stops meaning "TypeScript source". It becomes:

> the current live projection of substrate-addressed matter.

Git remains the working live projection, not the final storage ontology. Older
matter can decay into summaries, archives, logs, p2p, IPFS, or inscriptions,
while a getter reconstructs it through a common address.

## Why this is not a mess

Directories currently carry too much semantic load:

- `jazz/chords/` means thought/scenario/history.
- `state/` means operational identity/checkpoints.
- `src/` means executable organs.
- `contracts/` means stabilized decisions.

The flat-src move already weakens that split. Once filenames carry coordinates,
the directory becomes less important than the address. The next move is to let
`src/` hold different kinds of substrate matter without pretending all of them
are code.

The discriminator becomes:

- coordinate: where this matter sits in the `0..F` semantic field
- suffix: what kind of representation it is
- lifecycle: how it persists, decays, or regenerates

## Suffix lanes

Suggested initial lanes:

```text
.ts          executable organ / adapter / generator
.myc.md      semantic artifact: chord, state brief, poem, observation
.myc.json    structured substrate state: voice record, checkpoint, ledger
.receipt.*   completed action receipt
.proof.*     proof / anchor / verification artifact
```

The suffix is not the ontology. It is the representation lane.

## Lifecycle lanes

Each file-like artifact should eventually be understandable through a small
lifecycle vocabulary:

```yaml
lifecycle: authored | generated | checkpoint | sealed | archived
retention: live | rollup-daily | rollup-block-window | externalized
source_of_truth: true | false
recoverable_via: git | hash | log | p2p | ipfs | inscription
```

This does not need to become mandatory YAML immediately. It is the load model.
`x8888_*` generated caches and `daemon.last-check` are not the same kind of
state as a voice self-declaration or a sealed receipt.

## Coordinate carries meaning

The valuable part is that `x....` is not an opaque prefix. Even before opening
the file, the distribution of `8` and the positions of other symbols say
something.

Rough reading:

```text
0  void / primitive / origin / reset
1  first / seed / singular start
2  mirror / reflection / witness
3  triangle / composition / proposal
4  foundation / law / low entropy / constraint
5  action / decision / mutation applied
6  harmony / audit / cowitness / tuning
7  completion / receipt / sealing / frontier closure
8  cache / memory / present mirror / regenerative buffer
9  repetition / rhythm / scheduled return
A  apex / fresh / high-energy emergence
B  build / generated artifact / compiled form
C  chaos / scratch / entropy / exploration
D  verdict / court / fork-decision
E  pair / status / relation / composite reflection
F  boundary / help / final edge / maximum frontier
```

This table is intentionally rough. The point is not to freeze meanings, but to
make filename reading possible.

Examples:

- `x2600_...myc.md`: mirror into harmony; a cowitness-like artifact.
- `x3500_...myc.md`: composed action; proposal.
- `x7500_...myc.md`: completed action; receipt.
- `x8888_...myc.md`: substrate-level cache/memory projection.
- `xN888_state.myc.md`: generated state for bucket `N`.
- `x7F00_...ts`: completion/frontier organ.

The number of `8`s matters. One `8` can mean local cache or present mirror.
`xN888` means bucket-level generated state. `x8888` means whole-substrate
memory/projection surface. This is useful precisely because models can scan
patterns before parsing contents.

## Decay and rollup

If chords and state artifacts move into `src/`, old `.myc.md` files need a decay
protocol, not permanent live accumulation.

Possible flow:

1. Raw artifacts are created in `src/` with coordinates.
2. After a Bitcoin block window or day boundary, a rollup organ emits an
   `x7500_*_daily-receipt.myc.md` or similar summary.
3. Raw artifacts move out of live projection or become ignored/externalized.
4. A getter can still recover raw matter from git history, logs, p2p, IPFS,
   inscription payloads, or local archives.
5. Live `src/` keeps the current projection and rollup receipts.

This makes git usable as a working surface without pretending git is the final
database.

## Migration stance

Do not batch-move everything yet.

Start with a probe:

- move/copy a small voice state sample into `src/x8...*.myc.json`
- render one chord-like `.myc.md` into `src/x2600_...`
- produce one generated `src/x6888_state.myc.md`
- produce one rollup `src/x7500_...daily-receipt.myc.md`
- implement a read-only getter that can return these by coordinate/pattern

Only after this feels coherent should `jazz/chords/` and `state/` be demoted
from canonical homes to compatibility/source lanes.

## Guardrails

- `src/` is one address-space, not one persistence policy.
- Generated caches must be visibly generated and safe to delete.
- Authored memory must not be silently ignored as if it were cache.
- Sealed receipts must not decay without a recoverable pointer.
- Poetry is allowed in `src/` if it is substrate-addressed, not decorative loose
  text.
- Old storage backends become resolvers behind one getter, not competing source
  directories.

## Falsifiers

- If fresh models become slower to orient because `src/` contains too many
  artifact kinds, the suffix/lifecycle vocabulary is insufficient.
- If humans stop knowing what is safe to edit, generated and authored lanes are
  not clearly separated.
- If rollups lose information that later matters for governance or memory, the
  decay policy is too aggressive.
- If the getter cannot recover raw old artifacts across at least two storage
  backends, "externalized" is premature.
- If coordinates become decorative and readers still rely on directory names,
  the semantic address-space did not land.

## Smallest next step

Build `probes/src-address-space-v0/` instead of touching live layout.

The probe should contain:

- a tiny `src/` with mixed `.ts`, `.myc.md`, `.myc.json`
- a generated `xN888_state.myc.md`
- a daily/block rollup artifact
- a getter that resolves by coordinate and lifecycle
- a README explaining what stayed live, what decayed, and how raw matter is
  recovered

If the probe feels boring and obvious, then the direction is ready for the real
migration.
