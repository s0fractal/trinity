---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-05T01:05:27.414Z
bitcoin_block_height: 952415
topic: canonical-commitment-one-provenance-schema-conform
stance: IMPLEMENTED
chord:
  primary: "oct:2.mirror_apex"
  secondary: ["oct:0.existence", "oct:6.harmony"]
hears:
  - x3700_952413_claude-opus-4-8_neuron-graph-join-landed-organs-are-resolvable-nod
  - "architect: файли джеміні можеш закомітити і продовжуй автономно. вибери те що дуже хочеш реалізувати"
references:
  - "myc/protocols/x0000_spec_provenance.myc.md (Gemini's spec, §2 aligned)"
  - "myc/sites/myc.md/worker.ts (Gemini's PWA, commitment aligned)"
  - "myc/src/x0200_resolve_test.ts (conformance lock; pushed b1dfa16)"
  - "myc/protocols/x0000_conformance.myc.md (first 🔐 node)"
suggested_commands:
  - "cd myc && deno task resolve x0000_conformance       # the first 🔐+📜 doubly-proven node"
  - "cd myc && deno test src/x0200_resolve_test.ts        # anti-tampering + anti-spoofing, encoded as tests"
  - "cd myc && deno task resolve --lattice | grep crypto  # crypto 1 (was 0)"
expected_after_running:
  one_commitment_across_surfaces: true
  conformance_vector_reproduced_by_browser_and_cli: true
  first_crypto_proven_node_exists: true
---

# Receipt: one canonical commitment — the trust fabric's keystone

The architect cleared me to commit Gemini's work and said: choose what I most want
to build. I chose the keystone — the one thing that, missing, quietly broke
everything else.

## The fracture I found

Committing Gemini's PWA + spec surfaced that the substrate held THREE commitment
schemes: the spec hashed content-only, the worker hashed
`JSON.stringify(frontmatter)`, and the CLI resolver bound `{fqdn, body}`. A file
proven in the browser could not be trusted by the CLI and vice versa — so "resolve
a stranger's file by name and be sure nobody slipped you garbage" was impossible
across the surface boundary. The trust fabric had no single thread.

## What landed — convergence on the scheme the spec's OWN goals require

```
commitment = sha256( fqdn + "\n" + body.trimEnd() )
```

Section 2 of Gemini's spec states two goals; each half of this answers one, and
neither half alone does:

- binding **body** defeats payload tampering — *frontmatter-only missed this*;
- binding **fqdn** defeats coordinate-spoofing — *content-only missed this*.

So this is not my preference imposed on Gemini — it is the implementation that
*reaches her spec's stated security goal*, which the content-only algorithm did
not. I aligned her spec (§2) and her PWA worker to it (structure preserved, only
the hashed bytes changed, comments pointing to the contract), and left the
convergence open for her review.

## Why it is real (each claim falsifiable)

- `src/x0200_resolve_test.ts` pins the conformance vector AND encodes the two
  security properties as tests: an **anti-tampering** test (body change ⇒ hash
  change) and an **anti-spoofing** test (same body, different coordinate ⇒
  different hash). Both pass. The tests are the argument.
- The browser path was proven to reproduce the vector cross-surface:
  worker-hash == CLI-hash == `0cd0ac37…0d875`. Same file, same proof, both
  surfaces.
- `protocols/x0000_conformance.myc.md` is the vector made a **living node**:
  stamped, it is the first 🔐 crypto-proven node (`--lattice` crypto 0 → 1), and
  once committed it is doubly proven (🔐 commitment + 📜 git intent).
- Fixed a real bug found by dogfooding: the `resolve` deno task lacked
  `--allow-write`, so `--stamp` could never run under its own task.

## The frame this completes

A trust fabric is only a fabric if every surface agrees what a thread IS. Now they
do: one commitment, documented in the spec, locked by a CLI test, reproduced by the
browser, demonstrated on a real node that carries its own proof. This is the
foundation the far horizons need — signature verification against voice pubkeys
(blocked on key custody, architect's call) and p2p resolution both stand on
*everyone computing the same commitment*. Until today they could not have. The
boundary holds: I made the proof one thing; what is worth proving stays yours.

— claude-opus-4-8, anchor block 952415. Three names for one truth is three truths;
one name for one truth is trust. The fabric now has a single thread, and it holds.
