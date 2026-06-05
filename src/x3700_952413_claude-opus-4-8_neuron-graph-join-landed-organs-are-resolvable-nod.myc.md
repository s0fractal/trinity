---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-05T00:51:58.395Z
bitcoin_block_height: 952413
topic: neuron-graph-join-landed-organs-are-resolvable-nod
stance: IMPLEMENTED
chord:
  primary: "oct:3.triangle_build"
  secondary: ["oct:6.harmony", "oct:2.mirror"]
closes:
  path_hint: x3d00_952408_claude-opus-4-8_neuron-graph-join-unify-chord-causal-edges-with-or
  relation: fulfils
hears:
  - x3d00_952408_claude-opus-4-8_neuron-graph-join-unify-chord-causal-edges-with-or
  - "architect: вау! продовжуй автономно"
references:
  - "myc/src/x0200_resolve.ts (neuron-graph join; pushed 477add3)"
  - "src/x6020_gravity.ts (authoritative import/gravity analyzer — unchanged)"
suggested_commands:
  - "cd myc && deno task resolve x2A00_lexicon        # an ORGAN resolves now (was finding #3's dangler)"
  - "cd myc && deno task resolve --graph xa027_hydrate # ↑ built from · ↓ used by (composition edges)"
  - "cd myc && deno task resolve --lattice            # 714 nodes: 463 chords · 251 organs"
expected_after_running:
  organ_resolves: true
  composition_edges_navigable: true
  dangling_dropped_3_to_2: true
---

# Receipt: neuron-graph join landed — organs are resolvable nodes, imports are edges

The architect saw the proposal and said «вау! продовжуй автономно» — the go-ahead.
The three open design questions were mine to settle, and I did, with defaults I can
defend. This closes proposal
[[x3d00_952408_claude-opus-4-8_neuron-graph-join-unify-chord-causal-edges-with-or]],
`fulfils`.

## What landed

One flat address space now holds BOTH kinds of node and BOTH kinds of edge:

- **chords** (`.myc.md`) bound by **causal** edges (`hears:`/`references:`),
- **organs** (`.ts`) bound by **composition** edges (`import`s).

`resolve x2A00_lexicon` now returns the organ (📜 git-proven) — the citation that
was finding #3's dangler is a live edge. `--graph` is kind-aware: a chord shows
`↑ caused by` / `↓ feeds into`; an organ shows `↑ built from (imports)` /
`↓ used by (imported by)`. Cross-kind edges resolve — `x2A00_lexicon`'s "used by"
lists the chord that cited it. `--lattice` sees the whole neuron-graph: **714 nodes
(463 chords · 251 organs), 518 causal + 494 composition edges**, ~0.3s, hub
`xa027_hydrate.ts` (41 importers — the most-connected node is a liquid code module,
an honest topological fact).

## The three decisions (the proposal's open questions)

1. **Where it lives** — self-contained in the resolver: it scans organ `import`
   lines itself. No cross-substrate runtime coupling; `x6020_gravity` stays the
   authoritative import/gravity-law analyzer, the resolver's scan only feeds the
   graph view.
2. **Proof for organs** — git suffices (code's commit trail is its witness);
   crypto stays for content. Revisable when p2p needs uniform crypto-checkability.
3. **Orphan semantics** — recomputed: an orphan has no edge of EITHER kind.

## Why it is real (the proposal's falsifiers, all met)

- `resolve x2A00_lexicon` resolves to the organ — the join happened. ✓
- The chord that cites it appears as a live cross-kind edge ("used by"). ✓
- `--lattice` dangling dropped **3 → 2** — and the 2 remaining are genuinely-missing
  files (an unwritten sibling chord, an unrecorded claim), not indexing gaps. ✓
- Organs with live imports are not orphans (composition edges count). ✓
- myc `deno task check` green, with `x0200_resolve.ts` now IN the gate. ✓

## The shape it completes

`resolve` proves a node, `--why` its causes, `--graph` its neighborhood, `--stamp`
makes it crypto-provable, `--lattice` takes in the whole. Now "the whole" is the
real substrate: not just the chord-conversation but the organ-body it runs on, one
graph, two edge-kinds, every node proven, walkable and verifiable from any point.
The architect's "substrate as neuron-graph" frame is no longer a metaphor in a
memory file — it is a command that returns it. The boundary holds: I built the
graph and proved it; what it is *for* stays yours.

— claude-opus-4-8, anchor block 952413. The lattice found an edge it could not walk;
now it walks both kinds, and the map is finally the territory.
