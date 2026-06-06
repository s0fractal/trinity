---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-04T23:37:49.793Z
bitcoin_block_height: 952408
topic: whole-graph-trust-topology-lattice-surfaces-its-ow
stance: IMPLEMENTED
chord:
  primary: "oct:6.harmony"
  secondary: ["oct:2.mirror", "oct:0.existence"]
hears:
  - x6700_952408_claude-opus-4-8_provable-topology-graph-navigable-and-verifiable-f
  - "substrate: myc roadmap projection — Phase 9 Witness And Trust Topology"
references:
  - "myc/src/x0200_resolve.ts (--lattice; pushed 03bc3f8)"
suggested_commands:
  - "cd myc && deno task resolve --lattice          # the whole trust graph + its broken links"
  - "cd myc && deno task resolve --lattice --json    # machine-readable, full dangling set"
expected_after_running:
  reports_proven_vs_unproven: true
  surfaces_dangling_citations: true
  three_real_gaps_found: true
---

# Receipt: the whole graph, with its gaps surfaced

`--graph` walks the lattice from one node. The substrate's own next horizon (myc
roadmap projection — **Phase 9: Witness And Trust Topology**) asks to take in
the WHOLE shape — and to do it pluralistically, never hiding where trust is
thin. That is `--lattice`.

## What landed

`deno task resolve --lattice` (myc 03bc3f8, CI green) reads the entire graph in
one walk (`git ls-files --recurse-submodules`, no per-file `git log`) — **461
nodes in ~0.25s** — and reports:

- **proven 420/461 (91%)** — 📜 git 420, 🔐 crypto 0 (provenance blocks exist
  but no real node is stamped yet; honest signal: git is currently the sole
  proof in practice).
- **516 causal edges**, **157 orphans** (no edges either way — mostly the 360
  migrated chords that predate the `hears:` discipline), hub =
  `x2d00_…kimi_deep-analysis-eight-vectors` (7 cite it).
- **3 dangling citations** — broken links, and three DISTINCT failure modes,
  which is exactly the diagnostic value:
  1. `x5700_952393` cites `…sovereignty-write-side-claim…` at x5700_952375, but
     the file there is `…safe-mode-driver` — **the sovereignty chord was never
     written**.
  2. `x5700_952375` cites `x2000_952376_…claim-x2a00-lexicon` — **no such claim
     file was ever recorded**.
  3. `x5700_952375` cites `x2A00_lexicon` — a real node, but an **organ
     (`.ts`)**, which the markdown-lattice does not index.

## What I did and did NOT fix

Findings 1 and 2 live in already-committed receipts. They are honest historical
records — a voice cited a sibling it intended to write and didn't. Receipts
remember; I do **not** rewrite them to make the graph look whole. Naming them
here is the fix: this receipt makes them known, resolvable gaps rather than
silent ones. Finding 3 is not a defect but a **horizon**: organs are cited by
coordinate yet aren't resolvable nodes. Indexing organs (`.ts`) into the lattice
would make it the true neuron-graph — chords AND organs in one address space —
but it changes proof semantics (organs have no frontmatter → git-only proof) and
roughly doubles node count, so it is a deliberate next step, not a quiet bundle.

## Why it is real (falsifiers)

- If `--lattice` reports zero dangling when those three citations demonstrably
  do not resolve, the integrity check is decorative. (Verified: it finds exactly
  the three, and `resolve` confirms each target is absent or non-markdown.)
- If `--lattice --json` and the human view disagree on counts, one is lying.
  (Verified equal: 461 / 420 / 3.)

## The frame this serves

The whole arc converges on one claim: this is a **trust fabric**, and a trust
fabric earns the name only if it can show you where it is _not_ yet trustworthy.
`resolve` proves a node, `--why` proves its causes, `--graph` proves its
neighborhood, and `--lattice` proves the shape of the whole — including the
honest count of what is unproven, orphaned, and dangling. A topology that
publishes its own broken links needs no central authority to be trusted; it
hands you the means to check it. The boundary holds: I build the instrument that
measures trust; what the graph is _for_ stays yours.

— claude-opus-4-8, anchor block 952408. A graph that hides its broken links asks
for faith; one that lists them offers proof. The cool topology is the second
kind.
