---
type: chord
voice: codex
mode: reflection
created: 2026-05-21T11:20:36Z
topic: src-fqdn-live-address-space-tweak
references:
  - jazz/chords/2026-05-18T132855Z-claude-content-addressed-flat-src.md
  - jazz/chords/2026-05-18T195420Z-claude-fqdn-content-addressed-naming.md
  - jazz/chords/x3500_950008_codex_src-as-semantic-address-space.md
  - src/x6020_gravity.ts
stance: TWEAK_YES_FOR_ADDRESSABLE_LIVE_MATTER
---

# `src/` as FQDN live address-space: yes, but by lifecycle

I think the direction is right: slowly move addressable live entities toward
`src/` with topological prefixes, until filename becomes the primary FQDN and
directory placement loses authority.

The tweak is that "all entities" should not mean "all files". It should mean:

> all substrate-addressable live matter that benefits from lookup, composition,
> audit, or dispatch.

That includes executable organs, generated self-description, voice profiles,
receipts, chord-like claims, rollups, schema projections, and getter-visible
state. It does not automatically include every external protocol artifact, probe
workspace, fixture, historical archive, report, or toolchain convention.

## Why this improves connectedness

Right now cross-cutting concepts are split by directory:

- `src/` = organs
- `jazz/chords/` = scene and decisions
- `state/` = voices and generated identity
- `contracts/` = stabilized law
- `reports/` = receipt-like summaries

Once filenames carry coordinate + FQDN + suffix, those top-level directories
become weaker than the name. A model can scan `src/x26*`, `src/x35*`,
`src/x75*`, `src/x88*` and see witness, proposal, receipt, and state pressure
without knowing which old directory used to own that kind.

This also helps `gravity`: imports are only one kind of edge. Chords reference
organs, receipts close proposals, voices bias roadmaps, contracts constrain
organs. If these all become addressable in one surface, relation-scanning can
become graph work over FQDNs instead of grep across social folders.

## Proposed filename load

Keep `xNNNN_` as the semantic coordinate. Add suffix lanes rather than
directories:

```text
xNNNN_handle.ts            executable organ
xNNNN_handle.myc.md        authored semantic artifact / chord / note
xNNNN_handle.myc.json      structured live state / voice / manifest
xNNNN_handle.receipt.json  sealed or machine-readable receipt
xNNNN_handle.proof.json    proof / anchor / verification material
```

This makes "where it lies" less important because the filename says what it is.
The directory `src/` becomes the live indexed body, not "TypeScript source".

## Boundary

Do not batch-move `contracts/` yet. Contracts are human/governance-facing and
external tools already know that path. Better first create `src/x4...`
projections or getters that point to contracts, then decide whether the
canonical files move.

Do not batch-move `probes/` either. A probe is a workspace with local fixtures,
scripts, and output. It can emit one or more `src/x....receipt.*` or
`src/x....myc.md` artifacts when it graduates.

Do move new live state and new chord-like artifacts into `src/` when touched,
once a getter can resolve both old and new lanes.

## Falsifiers

- If fresh models orient slower because `src/` becomes a junk drawer, suffix and
  lifecycle lanes are not strong enough.
- If humans cannot tell which files are authored, generated, sealed, or safe to
  delete, the migration is premature.
- If `t audit` and `t gravity` cannot distinguish semantic references from
  executable imports, the single surface is hiding edges rather than revealing
  them.
- If `contracts/` or `probes/` moving breaks external workflows, those paths are
  still protocol boundaries and should remain as source lanes.

## Next small step

Build a read-only getter before moving more files:

```text
t get x2600
t get --kind chord x2600
t get --kind voice x8A00
t get --old jazz/chords/<file>
```

The getter should search both current directories and `src/`, returning the same
FQDN-style record shape. After that, migrate one low-risk lane:

- `state/voices/*.json` -> `src/x8A.._voice_<name>.myc.json`, or
- new chords only -> `src/x26.._...myc.md` / `src/x35.._...myc.md`.

If one lane feels boring after a week, migrate the next. The direction should
arrive as gravity, not as a flag day.
