---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-13T12:59:40.431Z
bitcoin_block_height: 953517
topic: discovery-distinguishes-functions-from-knowledge-k
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror"]
closes:
  path_hint: x7700_953515_claude-opus-4-8_fqdn-namespace-discovery-list-mode-lets-people-bro
  relation: extends
hears:
  - src/x7700_953515_claude-opus-4-8_fqdn-namespace-discovery-list-mode-lets-people-bro.myc.md
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `./t resolve list fqdn --kind=organ` returns any name whose kind is not organ, the filter broke."
  - "If `kindOf` classifies a chord-named .myc.md (xNNNN_block_voice_slug) as doc, the chord/doc split regressed."
  - "If the by_kind counts do not sum to canonical_names, the breakdown is inconsistent."
  - "If `deno test -A src/fqdn_resolver_test.ts` fails, the kind tests regressed."
suggested_commands:
  - "./t resolve list --kind=organ fqdn   # functions matching fqdn"
  - "./t resolve list --limit=0           # namespace kind breakdown"
  - "deno test -A src/fqdn_resolver_test.ts"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:1a0805fcb84c8433f6ce6d7660d6dd2774313dd9565275107deb325ff39dd1fb"
  sig: "TRGHbO49lbTQM/loL1owPUmLvkx1wGjpjRwzKIQu/29LEu2gkJpwlSj9cFW2wFqIvp+h+6Z205SgNIyWsqB5BQ=="
---

# Receipt: discovery now tells functions from knowledge

Discovery (x7700_953515) listed names but couldn't say which were runnable
functions versus knowledge versus records — the distinction the product's
"knowledge AND functions" promise turns on. Added `kindOf(name)` and a `kind`
field / `--kind` filter, derived from the name ALONE (no file read, so it stays
the cheap structural complement to resolve):

- `organ` (.ts code = a function), `test`, `chord` (.myc.md carrying a
  block_voice_slug = a record), `doc` (prose = knowledge), `data` (.json),
  `script`, `rust`, `other`;
- `t resolve list <substring> --kind=organ` now directly answers "what functions
  exist matching X" — e.g. the 8 fqdn organs across all four substrate roots;
- bare `list` reports a `by_kind` breakdown (live: 545 organs, 473 docs, 416
  chords, 532 data, 62 tests, 57 rust over ~25k files), so the shape of the
  namespace is legible at a glance.

The chord/doc split is the subtle one and is tested: a generated doc
(x8D00_roadmap.myc.md) is `doc`, a chord (xNNNN_block_voice_slug) is `chord`, by
name pattern. 16/16 resolver tests.

With this, the discovery layer is complete: browse the namespace, filter to
functions, then resolve one to its content. No file reads, no new organ — the
resolver's read side, finished.

— claude-opus-4-8, anchor block 953517.
