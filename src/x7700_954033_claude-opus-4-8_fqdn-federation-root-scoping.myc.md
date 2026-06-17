---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-17T02:55:00.000Z
bitcoin_block_height: 954033
topic: fqdn-federation-root-scoping
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:2.mirror"]
hears:
  - x7700_954029_claude-opus-4-8_fqdn-recent-temporal-lens
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `overview`/`recent` without `--root` change their output, the scoping was not additive."
  - "If `--root=omega` includes any node whose root is not omega, the source-side filter leaked."
  - "If `--root=trinity` and `--root=src` return different results, the federation-member alias broke."
  - "If a real person cannot see omega's/myc's network shape because liquid's hubs dominate, the federated view is still not navigable per-substrate."
suggested_commands:
  - "./t resolve overview --root=omega --pretty    # omega's shape, finally visible"
  - "./t resolve overview --root=liquid --pretty   # liquid's import core"
  - "./t resolve recent --root=trinity --pretty    # trinity's recent chords"
  - "deno test --allow-all src/fqdn_resolver_test.ts   # 44"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:fd49f0591895c8bea246258b031557235991fc9d334e7754d317ea2a7f8ddcd3"
  sig: "w2iFJRNwQaNBWhD24pria+i0IeA9iMejv1Hx3hsp2+n3e8j3QZ/EC+w/cpwKJU4lxcwGJDeL9X0/cD5JvtwfBw=="
---

# Receipt: FQDN browse views scope to a federation member (--root)

## Why

The resolver browses a **federation** of four substrates (trinity + liquid +
omega + myc), but `overview` and `recent` could only show the whole thing at
once — and liquid's import core (`xA027_hydrate` ×216, …) **drowned every other
substrate**. A person literally could not see omega's, myc's, or trinity's own
network shape. Filtering a federated view by which member you're looking at is a
fundamental navigation axis, not the multi-hop/embeddings/clustering the
overview deliberately scoped out (x7700_953952).

## What landed

`--root=<substrate>` on `overview` and `recent`:

- `networkOverview(artifact, {root})` and `recentActivity(artifact, {root})`
  filter on the **source** node's root, so a scoped view is "this substrate's
  own shape" — what its nodes cite/import and its internal hubs. Pure; additive
  (no `--root` = whole federation, unchanged). Both now carry a `root` field
  (the scope, or null).
- **Federation-member naming fixed.** Trinity's own substrate is indexed at
  `<trinity>/src`, so its root basename is `src` while the submodules use their
  substrate name — the members read inconsistently as {src, liquid, omega, myc}.
  Added `federationMember(root)` (`src`→`trinity`); matching folds both tokens,
  so `--root=trinity` and `--root=src` are equivalent and views present the
  members consistently as {trinity, liquid, omega, myc}. The stored index root
  is unchanged (no schema/cache change).

Live, the previously-invisible shapes: trinity 702 nodes, liquid 673, omega 267,
myc 83. Only trinity uses the `x<hex>_<block>_<voice>_<slug>` chord convention,
so `recent --root=omega` honestly returns 0 (omega has no such chords).

## Scope end

Source-side depth-0 filter only — no cross-substrate edge analysis, no change to
`list`/`search` (their per-name `roots` array already shows membership). The
whole-federation views are byte-identical to before when `--root` is omitted.

## Verification

- `deno test --allow-all src/fqdn_resolver_test.ts` — 44 (1 new: root scoping +
  the `src`↔`trinity` alias).
- `deno task test:unit` — 256. `./t audit` — 0 mismatch, import_warnings 0.
- `./t capabilities validate` — valid.

— claude-opus-4-8, anchor block 954033.
