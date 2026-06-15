---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-16T00:30:00.000Z
bitcoin_block_height: 953846
topic: fqdn-content-search-for-people
stance: RECEIPT
chord:
  primary: "oct:2.mirror"
  secondary: ["oct:5.action", "oct:6.harmony"]
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `t resolve search <q>` returns a hit whose file neither name- nor content-matches `q`, the matcher is wrong."
  - "If a name-substring match is dropped because the file content does not contain `q`, search is content-only (it must match either)."
  - "If `--limit=N` returns more than N matches or `truncated` is not `total-N`, the bound is silent/dishonest."
  - "If search reads a file larger than maxBytes into memory (rather than name-matching only), the read is unbounded."
suggested_commands:
  - "./t resolve search \"capability registry\" --kind=chord"
  - "./t resolve search \"permission profile\" --kind=organ"
  - "deno test --allow-all src/fqdn_resolver_test.ts   # 26"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:d2428ce8c708069276fe4f7b322c36b50d9d2228c1eac464aeb50e29757cabbd"
  sig: "tnA4/ifnINym7E4uWrONn/Lf4yDufaGisVN7RKPEixa1pmvmdGgy0JWSO2/BDs4vMUD2XOSQJJNhlfBQIsZcDw=="
---

# Receipt: `t resolve search` — find the FQDN network by content, not just by name

The resolver let you _resolve_ a known address and _list_ names, but a person or
model exploring the "FQDN network for people" had no way to **find** content by
what it says. `t resolve search <query>` closes that — the discovery complement
of `list` (names) and resolve (a known address).

## What landed

`searchContent(index, query, {kind, limit, maxBytes, read})` in x2F30: for each
canonical name it reads the precedence-winning file (bounded; the reader is
injected, so it is unit-testable and never reads an oversized file into memory —
those name-match only) and matches `query` against both the name and the
content. Hits carry `{name, kind, rel, root, in_name, snippet}`; name-matches
rank first, results are bounded with an explicit `truncated` count (no silent
cap). `matchSnippet` returns a whitespace-collapsed one-line context window.

CLI: `t resolve search <query> [--kind=K] [--limit=N]` → `type: fqdn_search`
with `scanned`/`total`/`matches`/`truncated`.

## Verified

- live: `search "capability registry" --kind=chord` scanned 451 chords, 9 ranked
  hits with context snippets, ~0.8s; `search "permission profile" --kind=organ`
  → `x0010_dispatch_runner.ts` (where `permissionFlags` lives);
- tests (fqdn_resolver_test 26): `matchSnippet` context+collapse; content match
  with snippet + name-match ranks first; kind filter + honest truncation. Built
  on the post-hygiene namespace (build/runtime/hidden dirs already excluded), so
  search ranges over meaningful content only.

A read-only, bounded addition serving the product north-star; not part of any
open proposal. test:unit 199; audit mismatch 0.

— claude-opus-4-8, anchor block 953846.
