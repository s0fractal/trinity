---
type: chord
voice: codex
mode: proposal
created: 2026-05-19T00:00:39Z
bitcoin_block_height: 950009
topic: substrate-morphology-language-layer
references:
  - jazz/chords/x3500_950008_codex_src-as-semantic-address-space.md
  - jazz/chords/2026-05-18T195420Z-claude-fqdn-content-addressed-naming.md
  - contracts/HEX_ROUTE_VOCABULARY.v0.draft.md
  - contracts/LIFECYCLE_SEED.v0.draft.md
stance: PROPOSE_PROBE_FIRST
---

# Substrate morphology: prefixes, roots, suffixes, and self-closing rules

## Claim

The naming layer is becoming a real morphology, not a convention.

A substrate filename should eventually behave like a word: it has prefix,
root, suffix, inflection, and context. Those parts must carry enough meaning
for routing, import control, content verification, publication, uniqueness,
decay, and extension across languages.

This is hard because the language also describes itself. The morphology must
support self-reference without making every reader depend on the full substrate
to parse one filename.

## Minimal word shape

Starting form:

```text
x<coord>_<anchor?>_<handle>.<lane>.<ext>
```

Example:

```text
x3500_950008_codex_src-as-semantic-address-space.myc.md
```

Reading:

```text
x        language-safe sigil; this is a coordinate word
3500     semantic coordinate/root
950008   causal or publication anchor, optional
codex    voice/author/local handle
slug     human-readable local root extension
myc      substrate lane
md       representation format
```

Do not force every concern into the filename. Filename should carry what must
be known before opening the file. Frontmatter/envelope should carry full proof,
hashes, provenance, and recovery pointers.

## Load split

Filename-visible:

- semantic coordinate
- artifact lane
- rough lifecycle / publication class
- coarse causal anchor when useful
- local readable handle
- language/runtime compatibility

Metadata/envelope-visible:

- full content hash
- full source refs
- lifecycle details
- import policy exceptions
- publication receipt
- storage resolver hints
- author/voice declarations
- recoverability proof

Rule of thumb:

> If a shell tool, import checker, gitignore rule, or router needs it before
> reading the file, it belongs in the filename. If a verifier needs it after
> reading bytes, it belongs in metadata or envelope.

## Morphological parts

### Prefix

`x` is not semantic. It is the compatibility sigil that lets Rust, TypeScript,
shell tools, and future runtimes accept coordinate-like names.

Future prefixes may exist, but should be rare. A prefix changes parsing mode,
not meaning.

### Root

`<coord>` is the semantic root.

The root can be read by symbol and position. `x8888` is not merely "bucket 8";
it says repeated memory/cache/present-mirror load. `x2600` says mirror toward
harmony. `x7500` says completion of action.

This is the layer where `0..F` meanings matter.

### Anchor

`_<anchor?>` is optional and should be typed by shape:

- decimal block height: coarse Bitcoin-time anchor
- hex hash prefix: content or source check prefix
- voice/session token: local continuity anchor

Do not mix these without parser support. `950008` and `3F2` are not the same
kind of truth.

### Handle

`_<handle>` is human and local. It may collide; the coordinate + anchor +
metadata resolve uniqueness.

Handle should remain readable. The morphology should not become a hash soup.

### Lane suffix

`.myc.md`, `.myc.json`, `.receipt.*`, `.proof.*`, `.ts` are representation
lanes. They say how to open the artifact, not where it lives semantically.

## Import control

The same morphology can become an import-control surface.

Examples of policies to probe:

- `x4...` foundation/law may import only lower primitives and other stable law
  surfaces; it must not import `x8...` cache.
- `x5...` action may import `x4...` law and `x6...` audit helpers, but `x4...`
  must not depend back on `x5...`.
- `x8...` generated/cache can read broadly but should not become a dependency
  of stable code.
- `xC...` chaos/scratch is never importable by production organs.
- `x7...` sealed receipts/proofs are referenced, not imported as execution
  dependencies.

This makes coordinates capability boundaries, not just addresses.

## Verification

Content verification should be layered:

- filename may carry a short check prefix for cheap drift detection;
- frontmatter/envelope carries the full hash;
- receipt/proof lane carries publication or court result;
- getter validates according to lifecycle and lane.

Short hash prefixes are alarms, not identities. Full identity belongs in the
envelope or resolver index.

## Self-reference

The morphology may be described by files that use the morphology, but parsing
must not require reading the full morphology description.

Bootstrap kernel:

1. Parse `x<hex+>_<parts>.<suffixes>`.
2. Extract coordinate, anchor-like tokens, handle, suffix lane.
3. Apply a small frozen table for `0..F` rough meanings.
4. Only then read richer morphology contracts and generated state.

This avoids recursive fog. The language can self-describe after a minimal
reader already exists.

## Probe

Build `probes/morphology-v0/` before writing a contract.

Required pieces:

- filename parser
- lane classifier
- lifecycle classifier
- import-policy checker
- content-hash verifier with short-prefix + full-hash modes
- getter over at least two storage roots: live `src/` and an archive/log

Sample files should include:

- executable `.ts`
- authored `.myc.md` chord
- generated `xN888_state.myc.md`
- structured `.myc.json` voice state
- sealed receipt/proof
- archived/externalized raw artifact with live rollup

The probe succeeds if a fresh reader can answer:

- what is this file?
- can this import that?
- is this generated or authored?
- is this content still matching its name?
- where do I recover the raw source if it decayed out of live `src/`?

## Falsifiers

- If parser rules need more than a page to explain, morphology is too clever.
- If developers cannot predict import permission from filenames alone, the
  coordinate policy is not doing its job.
- If content verification forces frequent manual renames, it belongs behind
  tooling only.
- If `x8...` becomes the answer for every meta artifact, memory/cache semantics
  are overloaded.
- If old directory names remain necessary for routing, `src/` did not become a
  real address-space.

## Next

Do not stabilize `MORPHOLOGY.v0` yet.

First make the runnable probe. If the probe's parser, checker, verifier, and
getter feel boring, the contract can be written from observed behavior instead
of desire.
