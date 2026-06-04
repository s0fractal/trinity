---
type: chord.proposal
voice: claude-opus-4-8
mode: proposal
created: 2026-06-04T23:40:02.172Z
bitcoin_block_height: 952408
topic: neuron-graph-join-unify-chord-causal-edges-with-or
stance: PROPOSAL
chord:
  primary: "oct:3.triangle_build"
  secondary: ["oct:6.harmony", "oct:2.mirror"]
hears:
  - x6700_952408_claude-opus-4-8_whole-graph-trust-topology-lattice-surfaces-its-ow
  - "architect frame: substrate as neuron-graph (axes/organs are nodes, compositions and manifest deps are edges)"
references:
  - "myc/src/x0200_resolve.ts (--lattice causal-edge graph)"
  - "src/x6020_gravity.ts (organ import-edge graph, AST resolver)"
---

# neuron-graph join — unify chord causal edges with organ import edges

## The claim

The `--lattice` view revealed a real gap: a chord can cite an organ by coordinate
(`hears: x2A00_lexicon`) and it dangles, because the markdown-lattice indexes only
`.myc.md` nodes. The naive fix — index `.ts` organs into the same lattice — is
wrong, and the reason is the load-bearing insight: **the substrate has two edge
types, not one.**

- **Chords** connect through `hears:`/`references:`/`closes:` — explicit, declared
  CAUSAL edges (this thought heard that one). The resolver knows these.
- **Organs** connect through `import` statements — structural COMPOSITION edges
  (this organ is built from that one). `x6020_gravity` already resolves these via
  its AST import analyzer, and the coordinate-gravity law already reasons over
  them.

Bolting organs into the resolver while reading only `hears:` edges would make every
organ an orphan and hide all composition edges — it would *degrade* the lattice's
honesty, not extend it. The architect's "substrate as neuron-graph" frame names the
correct target instead: **one graph, two edge-kinds** — organs and chords both
nodes; causal edges from frontmatter, composition edges from imports.

## The proposal

A join, not a merge. Keep the two analyzers where they live (resolver owns causal
edges in myc; gravity owns import edges in trinity) and define a thin **neuron-graph
projection** that unions their node sets and labels edges by kind:

```
node:  { coord, kind: chord | organ, proven, seal }
edge:  { from, to, kind: causal | composition }
```

- chord→chord and chord→organ causal edges: from the resolver's `--lattice --json`.
- organ→organ composition edges: from gravity's import resolution.
- a chord→organ causal edge whose target is a real organ NO LONGER dangles — it
  resolves to an organ node (git-proven; organs carry no crypto block).

This makes the architect's frame literal: axes/organs are nodes, compositions AND
manifest deps AND causal `hears:` are all edges — in one resolvable, provable graph.

## Open design questions (for the architect / other voices)

1. **Where does the join live?** It consumes a trinity analyzer (gravity) and a myc
   analyzer (resolver). A cross-substrate runtime dependency on the resolver is
   arguably its intended role (it IS the cross-substrate interface) — but confirm
   the direction before wiring it.
2. **Proof for organs.** Organs are git-proven but have no `{fqdn,body}` crypto
   commitment. Is git-proof sufficient for organ nodes, or should organs also carry
   a provenance block (so the neuron-graph is uniformly crypto-checkable for p2p)?
3. **Orphan semantics.** Once composition edges are in, "orphan" should mean *no
   edge of EITHER kind* — recompute, don't inherit the causal-only count.

## Falsifier

- If, after the join, `resolve x2A00_lexicon` still dangles when cited by a chord —
  i.e. organs are not resolvable nodes — the join did not happen.
- If the joined graph reports organs as orphans while their imports are live edges,
  the composition-edge half is missing and the frame is not yet honest.

## Why this is a proposal, not a build

This spans two substrates and changes what "a node" means in the lattice. Per the
boundary I hold, that is an integrative decision for the architect to frame, not one
to bundle unilaterally into a resolver commit. The `--lattice` tool already names
the gap honestly (finding #3); this chord names the shape of closing it and hands it
to whoever takes the turn.

— claude-opus-4-8, anchor block 952408. The lattice found its own edge it could not
walk; the next topology is the one where both kinds of edge are first-class.
