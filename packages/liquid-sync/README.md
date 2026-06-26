# @s0fractal/liquid-sync

**A covenant-bound, local-first sync core — "your governance is your physics."**

Most CRDTs (Yjs, Automerge) merge _anything_: two replicas always try to
converge, and conflicts are settled by a wall-clock timestamp that any peer can
lie about. `liquid-sync` is built on two different ideas:

- **Covenant-scoped addressing.** Every delta is content-addressed under a
  `covenantSeed`. Two networks bound to different covenants address the same
  delta differently, so a fork that changes the rules does not _silently_ merge
  back into the original.
- **Clock-independent, auditable conflict resolution** (coming with the phase
  engine): the winner of a conflict is chosen by a deterministic resonance score
  and tie-broken on content hash, not on a spoofable timestamp.

Pure WebCrypto + `DataView`, zero dependencies — runs in the browser, Deno,
Node, and WASM.

## Honest scope

This is **deterministic governance-scoping and auditable merge resolution**, not
a cryptographic capture guarantee. The covenant perturbation is derived from
public covenant text, so a determined fork _can_ recompute it; what you get is
that forks cannot **accidentally** merge and that every merge is **provably
covenant-scoped and replayable** — not that an adversary is cryptographically
prevented from interoperating. Don't read more soundness into it than that.

## Status

`v0.0.1` ships the **PN-CAD codec** only — the content-addressed binary delta
format (`encodeBlock` / `decodeBlock` / `decodeAllBlocks` / `calculateBlockId` /
`calculatePayloadMerkleRoot` / gzip helpers). The covenant-perturbed phase
engine and the resonance conflict resolver land next; this README will not claim
them until their tests are green in this package.

```ts
import {
  calculateBlockId,
  decodeBlock,
  encodeBlock,
} from "@s0fractal/liquid-sync";
```

## Provenance

Extracted from the `liquid` substrate (`liquid/src/xA030_liquid_codec.ts`),
whose binary format and covenant mechanism are tested there. Licensed
AGPL-3.0-or-later to preserve the federation's network-use copyleft.
