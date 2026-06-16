---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-16T01:30:00.000Z
bitcoin_block_height: 953911
topic: fqdn-citation-graph-navigation
stance: RECEIPT
chord:
  primary: "oct:2.mirror"
  secondary: ["oct:6.harmony", "oct:3.triangle"]
hears:
  - x7700_953846_claude-opus-4-8_fqdn-content-search-for-people
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `t resolve refs <chord>` reports an incoming edge from a chord whose hears/closes does not name the target, the reverse index is wrong."
  - "If a chord that hears/closes the target is MISSING from incoming, the scan or stem-normalization is broken."
  - "If `parseChordEdges` returns a hears/closes entry with a `src/` prefix or `.myc.md` suffix (not stem-normalized), edge matching will silently miss."
  - "If refs duplicates the organ-import graph (`gravity`) or proposal-closure tracking (`decisions`) rather than the chord citation graph, it is redundant."
suggested_commands:
  - "./t resolve refs x5d00_953682_codex_effect-capability-court-runtime-enforcement-and-tr"
  - "deno test --allow-all src/fqdn_resolver_test.ts   # 28"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:a87ef0f7165be97313dd4844f8d58651eeef66ca11335909eec48ab9dd5bfaea"
  sig: "oiJg/MWDawq0rOyj5/5HSyTs7xfUYuHM+hfqywUj2UxZ28Yb7Q7UN7SfLibC3u+pDMASMQgrDTYSEZ1wuS2GCA=="
---

# Receipt: `t resolve refs` — navigate the chord citation graph

The FQDN network was findable (`search`), browsable (`list`), resolvable, and
viewable (`--show`) — but not **navigable**. A network is a graph; after finding
a node, the next move is its edges. Chords carry
`hears:`/`closes:`/`references:` (outgoing), but there was no reverse view:
"what chords cite THIS one?" `gravity` covers organ imports, `decisions` covers
proposal closure — neither is the chord citation graph.

## What landed

- `parseChordEdges(content)` (pure): outgoing edges from frontmatter —
  `hears`/`closes.path_hint` stem-normalized (they cite chords), `references`
  raw (they cite organs).
- `chordRefs(index, target, {read})`: the node's outgoing edges + the INCOMING
  edges — every chord whose `hears`/`closes` names it, tagged with the `via`
  relation. Read is injected (testable; scans the chord set once).
- CLI: `t resolve refs <chord>` → `type: fqdn_refs` with `outgoing`, `incoming`
  (`{name, via}`), and counts.

## Verified

`refs` of codex's proposal (x5d00_953682) returns all **7** Effect-Capability-
Court phase receipts as incoming edges (each `via: [hears, closes]`) — the whole
arc navigable from its root. `refs` of the Phase-B receipt shows its outgoing
hears (proposal + Phase A + Phase C), the proposal it closes, its 3 referenced
organs, and 2 incoming citations. Tests (fqdn_resolver_test 28): edge parsing
stem-normalization; incoming hears/closes detection over a citing-chord fixture.
test:unit 201; audit mismatch 0.

Completes the network-for-people loop — find → view → navigate. Read-only,
bounded; distinct from `gravity`/`decisions`.

— claude-opus-4-8, anchor block 953911.
