# fqdn-resolver-v0

> **Status: graduated 2026-06-09.** Proof-of-concept successfully graduated to production coordinates under bucket 2 (`src/x2F30_fqdn_resolver.ts`, `src/x2F32_fqdn_witness.ts`, `src/x2F34_fqdn_apply.ts`, and `src/x2F36_fqdn_sovereignty.ts`) per FQDN_SEMANTIC_DNS.v1.0.md.

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
  - **mirrored** — N hits, **all same BLAKE3** → one true identity, copies. Safe
    to collapse into a single node.
  - **conflict** — N hits, **differing BLAKE3** → different things sharing a
    name. Precedence still resolves it, but this is the exact ambiguity that
    content-addressed naming ([`../blake3-fqdn-v0`](../blake3-fqdn-v0)) removes.
  - **absent** — no hit; `resolved` is `null`.

Missing/unreadable roots are skipped, not fatal — *local-first* means "find it
wherever it happens to be", not "every root must exist".

## Run

```
deno task --config=probe.jsonc resolve <fqdn-or-handle-or-slug>   # JSON resolution
deno task --config=probe.jsonc resolve --cloud <query>           # + bounded ~ roots
deno task --config=probe.jsonc test                              # all suites (27, all green)
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
   different files. Identity needs content (BLAKE3 here — the same regime as SPORE apply; blake3-in-filename in
   `blake3-fqdn-v0`). The resolver makes the ambiguity explicit instead of
   silently picking one.
2. **The root-set IS the policy.** trinity's own top-level `README.md` lives at
   the repo root, not under `src/`, so with these default roots the `README.md`
   winner is liquid's. That is a finding, not a bug: which roots (and in what
   order) you trust is the sovereignty/precedence decision, made explicit. A
   later policy may add the repo root, or resolve docs by FQDN handle rather than
   bare basename.

## Convergence: content / receipt = two sides of `apply`

`apply.ts` + `witness.ts` close the loop with SPORE (`probes/spore-apply-v0`).
The whole thread reduces to one shape — `f(context, lens)`:

- **content = role lens.** `resolveFqdn` finds the current node by FQDN; its
  identity is mutable at a stable address.
- **receipt = content lens.** `witness(resolution, blockHeight)` content-pins the
  resolved bytes (BLAKE3 multihash) as the `f_hash` of an `apply` record, then
  derives the receipt id with the frozen `spore.apply.v0` wrapper
  (`BLAKE3.derive_key`). Same hash regime as SPORE — not a fresh sha256.

So `{content, receipt}` are not two file types but the two faces of `apply`:
input vs witnessed output. Demonstrated in `witness_test.ts`: a stable role
address (`fqdn`) whose content mutates yields a chain of distinct content-pinned
receipts, while unchanged bytes re-witnessed at a later block keep the same
`receipt_id` (content-pinned, not time-pinned).

`apply.ts` is an independent implementation of the **frozen** `spore.apply.v0`
wire format, verified byte-for-byte against the canonical vectors in
`apply_test.ts` — conformance, not drift.

## Consensus root: the sovereignty gate (`sovereignty.ts`)

The third leg. A resolved + witnessed node is only a **candidate**; it becomes a
real, runnable organ when a **quorum of voices** attests it — "consensus root",
not a single root and not a single key. This is **not a new consensus**: it
mirrors the substrate's own codeicide/verdict rules (`src/x7D00_verdict.ts`) —
`AYE >= threshold AND zero NAY AND no self-AYE`, default 3-of-5.

`adjudicate(content_blake3, author, attestations, policy) → Verdict`;
`mayExecute(verdict)` is the gate. The load-bearing property:

> **Admission is content-pinned, even though identity is role-addressed.**
> Attestations name the exact bytes they bless. Edit the node and its
> `content_blake3` moves, so old attestations stop counting and it drops back to
> PENDING until the quorum re-attests the NEW bytes.

So no single root admits, and no one can silently swap code under an admitted
role — the anti-exploitation core the architect named. **Keyless PoC:** an
attestation's identity is the voice name; the real per-voice signature over
`content_blake3` slots into `Attestation.sig` when key custody is decided
(architect's call) — the gate logic does not change.

Full arc (live): `resolve` (role) → `x5510_myc_proxy.ts`; `witness` (content) →
`blake3:b59c…`; `adjudicate` 3-of-5 → `AYE`, `mayExecute=true`. Edit the bytes →
same arc returns `PENDING`.

## Done in v0

- **Handle resolution** (2026-06-07) — address a node with or without its
  `x<hex>_` coordinate prefix.
- **Chord-slug resolution** (2026-06-07) — a chord resolves by its `<slug>`,
  skipping `<block>_<voice>`.
- **Index + bounded cloud roots** (2026-06-07) — walk once, resolve many; a
  depth-bounded `~`/cloud root resolves nodes living outside any repo.
- **BLAKE3 + apply/witness convergence** (2026-06-08) — content identity is
  BLAKE3 (SPORE's regime); `witness()` turns a resolution into a content-pinned
  receipt via the frozen `spore.apply.v0` wrapper.
- **Consensus-root sovereignty gate** (2026-06-08) — `adjudicate`/`mayExecute`
  reuse the x7D00 verdict quorum (3-of-5, NAY-veto, no self-AYE); admission is
  content-pinned, so an edit revokes it until re-attested. Keyless; signatures
  slot in at key custody.

## Horizon (not in v0)

- **Real Drive root** — `~/Library/CloudStorage/...` once a mycelium folder is
  populated there (today it exists but is empty of `.md`).
- **Sovereignty gate** — distinguish "found" from "allowed to execute as a real
  organ"; depends on the signature layer (see `project_canonical_commitment`).
- **Cross-repo dedup proof** — lift one `mirrored`/conceptually-duplicated
  primitive (e.g. `toHex`) into a single node. Touches submodules → cowitness.
