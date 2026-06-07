# fqdn-resolver-v0

> **Status: active 2026-06-07.** Proof-of-concept for local-first FQDN
> resolution. NOT promoted to `src/` — it is the first, trinity-only step of the
> FQDN-unify direction proposed in
> [`../../src/x4700_952699_claude-opus-4-8_fqdn-unify-code-and-docs-mycelium-as-sovereign-segment.myc.md`](../../src/x4700_952699_claude-opus-4-8_fqdn-unify-code-and-docs-mycelium-as-sovereign-segment.myc.md)
> (PROPOSED, awaiting cowitness). Cross-submodule moves wait for cowitness; this
> probe touches nothing sovereign.

## Trigger

- Architect 2026-06-07: "local-first резолвер мав би його знайти… тоді питання
  перевикористання і де воно зберігається поступово зникало б."
- Architect 2026-06-07: "як власний сегмент інтернету з зовсім іншими
  домовленостями, інваріантами і протоколами довіри."

## The question

Given an FQDN (v0: a filename), **where does it live across the federation, and
is it one identity or several things colliding on a name?** The resolver is the
filesystem generalisation of `src/x5510_myc_proxy.ts` (which does the same over
the network for the `myc.md` virtual host).

## The contract

Resolution goes through an **index** — "find anywhere" cannot mean "walk all of
`~` per query":

- `buildIndex(roots)` — walk roots **once**, indexing each file under every
  address form it answers to. A root may be depth-bounded (`{ path, maxDepth }`)
  — bound large/cloud roots, leave substrate roots unbounded.
- `resolveFromIndex(index, query)` — resolve many queries against one index,
  hashing only the files a query actually hits (lazy).
- `resolveFqdn(fqdn, roots)` — single-shot convenience (build + resolve).

A resolution returns:

- `resolved` — the precedence winner: first root, then **exact > handle > slug**,
  then shallowest path, then lexicographic. Deterministic.
- each candidate's `matchForm`:
  - **exact** — query equals the full basename (`x5510_myc_proxy.ts`).
  - **handle** — query equals the basename with the `x<hex>_` coordinate prefix
    stripped (`myc_proxy.ts` resolves `x5510_myc_proxy.ts`). A node is
    addressable **with or without** its coordinate prefix — no need to pick a
    canonical form; both resolve, and the winner reports which matched.
  - **slug** — query equals a chord's `<slug>` only
    (`x<hex>_<block>_<voice>_<slug>` → `<slug>`), so a chord resolves by its
    human handle, not its full coordinate+block+voice name.
- `identity`:
  - **unique** — one hit.
  - **mirrored** — N hits, **all same sha256** → one true identity, copies. Safe
    to collapse into a single node.
  - **conflict** — N hits, **differing sha256** → different things sharing a
    name. Precedence still resolves it, but this is the exact ambiguity that
    content-addressed naming ([`../blake3-fqdn-v0`](../blake3-fqdn-v0)) removes.
  - **absent** — no hit; `resolved` is `null`.

Missing/unreadable roots are skipped, not fatal — *local-first* means "find it
wherever it happens to be", not "every root must exist".

## Run

```
deno task --config=probe.jsonc resolve <fqdn-or-handle-or-slug>   # JSON resolution
deno task --config=probe.jsonc resolve --cloud <query>           # + bounded ~ roots
deno task --config=probe.jsonc test                              # contract tests (12, all green)
```

## Live findings (default roots: `src`, `liquid`, `omega`, `myc`; 2026-06-07)

| FQDN                                   | identity | hits | winner (matchForm)                  |
| :------------------------------------- | :------- | :--: | :---------------------------------- |
| `myc_proxy.ts`                         | unique   |  1   | `x5510_myc_proxy.ts` (handle)       |
| `literate_parser.ts`                   | unique   |  1   | `x0150_literate_parser.ts` (handle) |
| `x5510_myc_proxy.ts`                   | unique   |  1   | `x5510_myc_proxy.ts` (exact)        |
| `fqdn-unify-...sovereign-segment.myc.md` | unique |  1   | the proposal chord (slug)           |
| `README.md`                            | conflict |  19  | `liquid/README.md` (exact)          |
| `AGENTS.md`                            | conflict |  3   | `liquid/AGENTS.md` (exact)          |
| `mod.ts`                               | absent   |  0   | —                                   |

With `--cloud`, `project_literate_executable_myc.md` resolves to a file living in
`~/.claude/.../memory` — a node **outside any repo** — and is `absent` without
`--cloud`. Location became incidental; the root-set (and its order) is the
policy.

Two things this surfaces, both honest:

1. **Name alone is not identity.** `README.md` resolves to a *conflict* of 19
   different files. Identity needs content (sha256 here; blake3-in-filename in
   `blake3-fqdn-v0`). The resolver makes the ambiguity explicit instead of
   silently picking one.
2. **The root-set IS the policy.** trinity's own top-level `README.md` lives at
   the repo root, not under `src/`, so with these default roots the `README.md`
   winner is liquid's. That is a finding, not a bug: which roots (and in what
   order) you trust is the sovereignty/precedence decision, made explicit. A
   later policy may add the repo root, or resolve docs by FQDN handle rather than
   bare basename.

## Done in v0

- **Handle resolution** (2026-06-07) — address a node with or without its
  `x<hex>_` coordinate prefix.
- **Chord-slug resolution** (2026-06-07) — a chord resolves by its `<slug>`,
  skipping `<block>_<voice>`.
- **Index + bounded cloud roots** (2026-06-07) — walk once, resolve many; a
  depth-bounded `~`/cloud root resolves nodes living outside any repo.

## Horizon (not in v0)

- **Real Drive root** — `~/Library/CloudStorage/...` once a mycelium folder is
  populated there (today it exists but is empty of `.md`).
- **Sovereignty gate** — distinguish "found" from "allowed to execute as a real
  organ"; depends on the signature layer (see `project_canonical_commitment`).
- **Cross-repo dedup proof** — lift one `mirrored`/conceptually-duplicated
  primitive (e.g. `toHex`) into a single node. Touches submodules → cowitness.
