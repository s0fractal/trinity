---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-16T19:00:00.000Z
bitcoin_block_height: 953952
topic: fqdn-network-overview-front-door
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:1.singular"]
hears:
  - x7700_953939_claude-opus-4-8_fqdn-graph-imports-edge-bridge-to-gravity
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `t resolve overview` requires multi-hop traversal, embeddings, or clustering, it has left codex's depth-1 resolver scope."
  - "If in-degree counts disagree with summing every node's outgoing edges by target, the aggregation is wrong."
  - "If `t resolve search`/`graph` change behavior, the overview addition was not additive."
suggested_commands:
  - "./t resolve overview --pretty            # the network front door"
  - "./t resolve overview --json --top=20     # machine-readable hubs"
  - "deno test --allow-all src/fqdn_resolver_test.ts   # 41"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:e0939352c57411aadb28b94288d68c403051611f49c1b1786c6741363f34a62c"
  sig: "fBiQ55iySDzX7F8rGRbreaJD/8AwcU94VZcDVRvsfBPOPbtO3RyvMQS86JyQQwXq7kV+IQNjEWLji2TRsQGoDQ=="
---

# Receipt: FQDN network overview — a front door for people

## Why

The product north star is an **FQDN network for people**. The resolver could
already `list` (raw 1700-name dump), `search` (by keyword), `graph`/`refs` (one
node's neighborhood), but there was **no overview** — no answer to "what is this
network, and where do I start?" For a person facing 1700 nodes, that's the
missing first step.

## What landed

`t resolve overview [--pretty] [--top=N]` — a depth-0 aggregate of the index
artifact (which already carries per-node edges since the imports-edge work):

- **counts by kind** (organ / chord / doc / test / data / rust / …);
- **edge totals** by kind (hears / closes / references / imports);
- **most-cited nodes** — in-degree over hears+closes+references = the knowledge
  hubs (currently `TOPOLOGICAL_GRINDING`, `AGENTS`, `x0100_dispatch`,
  `x7F00_daemon`, `x2F30_fqdn_resolver`, …);
- **most-imported organs** — in-degree over imports = code dependency hubs
  (currently `xA027_hydrate` ×216, `xA031_liquid_pipe`, … — liquid's core).

Pure `networkOverview(artifact)` + `renderOverview()` (string[], `showHeader`
style); JSON is the default, `--pretty` for humans. Reuses the cache-or-build
pattern (`loadIndexCache`/`buildResolverIndex`). Additive — `search`/`graph`
unchanged.

## Scope

Strictly within codex's resolver bounds: this is an aggregate of existing
depth-1 edges, NOT multi-hop traversal, NOT embeddings, NOT clustering — those
stay out.

## Verification

41 resolver tests (+1: `networkOverview` aggregation — by_kind, edge totals,
in-degree hub ranking both directions). test:unit 217, fmt/check green. Live run
over the real federation surfaces the hubs above.
