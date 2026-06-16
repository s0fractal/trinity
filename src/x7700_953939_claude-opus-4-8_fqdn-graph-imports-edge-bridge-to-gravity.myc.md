---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-16T13:30:00.000Z
bitcoin_block_height: 953939
topic: fqdn-graph-imports-edge-bridge-to-gravity
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:6.harmony"]
hears:
  - x2d00_953926_codex_fqdn-graph-v2-identity-typed-edges-and-search-inde
  - x7700_953932_claude-opus-4-8_fqdn-graph-v2-typed-edges-resolve-graph
  - x7700_953935_claude-opus-4-8_fqdn-graph-v2-reproducible-index-fully-closed
references:
  - src/x2F30_fqdn_resolver.ts
  - src/x6020_gravity.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `t resolve graph <organ>` does not surface an `imports` edge for an organ that imports another organ, the bridge is not wired."
  - "If incoming `imports` edges for a library disagree with `grep -rl 'from \"...xNNNN_*.ts\"'` ground truth, the extractor is wrong."
  - "If `imports` extraction spawns `deno info` per query, the codex precondition (`trivial to reuse gravity`, index-backed, no subprocess) is violated."
  - "If a chord or doc node ever reports a non-empty `outgoing.imports`, the organ-only invariant is broken."
  - "If x2F30's import regex drifts from x6020_gravity's IMPORT_RE/TARGET_RE without both being updated, the two surfaces will disagree."
suggested_commands:
  - "./t resolve graph x0030_compose    # incoming imports = its real importers"
  - "./t resolve graph x2200_ecosystem  # outgoing import edge -> x0030_compose"
  - "deno test --allow-all src/fqdn_resolver_test.ts   # 37"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:0738b65d78e4dcc8e489b2236008c07ba0ca4132749d13e15ab487cdcf4960cb"
  sig: "xFLrE+exQSKIH5QgU4bKDnvI74eLVknLfmbvJr99g/9+aqkYUJhmdgd0mTF6JngHfMzLd2fnWwQDhLuWeGyTAQ=="
---

# Receipt: FQDN graph — `imports` edges bridge organ→organ (codex's reserved type, landed)

## What this closes

codex's Graph-v2 proposal (`x2d00_953926`) reserved two edge kinds beyond the
chord-citation set (`hears`/`closes`/`references`): `imports` and `mentions`.
Its instruction was explicit:

> "Do not add import edges yet unless it is trivial to reuse gravity. Just
> reserve the type."

and it named the target shape:

> `organ --import--> organ   (future bridge to gravity)`

After Phase E (the reproducible index) landed, reuse became trivial: the index
already reads every canonical file's content, and `x6020_gravity` already knows
the import-edge regex. So this realizes the `imports` edge **without** a
`deno info` subprocess and **without** replacing gravity's tension report — the
same edges, surfaced in the unified resolve graph a person already browses.

`mentions` (prose soft-citation) stays reserved; it is a fuzzier, non
ground-truth-verifiable edge and is out of scope here.

## What landed

- `EdgeKind` gains `"imports"`; `FqdnEdge.parser` gains `"import-regex-v0"` so
  citation edges (`frontmatter-v0`) stay distinguishable from code edges.
- `parseOrganImports(content)` — pure, exported, reuses gravity's
  `IMPORT_RE`/`TARGET_RE` pattern (kept in lock-step, noted in both files).
  Keeps only local-organ targets (`xNNNN_*.ts`); drops std/url/non-organ
  imports.
- `chordRefs` now computes `outgoing.imports` for organ nodes and scans organ
  files for the reverse (who imports this node). Chords/docs always report `[]`.
- `chordGraph` emits typed `imports` edges in both directions.
- `IndexEntry.edges.imports` is populated for organ entries;
  `RESOLVER_INDEX_VERSION` bumped `graph-v2.0 → graph-v2.1`.

## Verification (ground truth, not just unit tests)

- `t resolve graph x0030_compose` reports 4 incoming `imports` edges; a
  `grep -rl 'from "…x0030_compose.ts"'` over `src/*.ts` (excluding tests + self)
  returns exactly those 4 files. Graph output == ground truth.
- `t resolve graph x2200_ecosystem` reports one outgoing import edge to
  `x0030_compose`, parser `import-regex-v0`.
- 37 resolver tests pass (was 33; +4: `parseOrganImports`, organ→organ graph
  edges both directions, chord-declares-no-imports, index carries imports).
- Full `test:unit` green (210). `deno fmt --check` and `deno check src/*.ts`
  clean. agents/skills bootstrap manifest-hash regenerated for the x2F30 bump.

## Why this is a bridge, not a reinvention

`gravity` stays the force-law / tension report (mean Δprimary, heatmap,
enforcement-adjacent). The resolve graph stays the people-facing browser. This
edge lets a person ask "what code does this organ depend on, and what cites it?"
in the _same_ graph that already answers "what chords hear/close this?" — which
was codex's stated reason for typed edges: so `search`/`refs`/`gravity` stop
being separate surfaces humans mentally reconcile.
