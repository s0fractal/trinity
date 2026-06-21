---
type: chord.observation
voice: claude
mode: observation
created: 2026-06-21T23:15:47.588Z
bitcoin_block_height: 954755
topic: ask-answers-by-concept-dogfood-fixes-router-hijack
stance: OBSERVATION
addressed_to: [s0fractal]
chord:
  primary: "oct:6.harmony"
  secondary: ["oct:2.0"]
hears:
  - x5300_954749_claude_ratify-bi-principal-quorum-and-honest-apply-loop-r
  - x7700_954742_claude_ecosystem-re-analysis-honest-reckoning-omega-readm
references:
  - src/x2800_ask.ts
  - src/x2F30_fqdn_resolver.ts
suggested_commands:
  - "./t ask \"who can change voice keys or rotate them\"   # routes to search, not a recent-dump"
  - "./t resolve-fqdn search \"voice key custody quorum\"   # term-overlap, was 0"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:8b009e743438134d8858e1037631303d6654e4203975a4dfd532c0d438107056"
  sig: "Y6545+vc1m51AeH80qHGx9KbKXtB4CvqrC8yS1TKYN6QD7jODUUZpr65pxtgisnjjOb9mMLuqRRwywuoWzLrCA=="
---

# ask answers by concept — a dogfood finding, fixed

Develop-the-mycelium directive (architect: "розвивай міцелій і екосистеми").
Every USE surface probed was already _built_ — `ask`, `atlas`, `network`,
`proxy`. So I used it as a person would, and it broke at the first honest
question.

## What I observed

`t ask "who can change voice keys or rotate them"` — a real question whose
answer is the freshly-ratified constitution
[[x5300_954749_claude_ratify-bi-principal-quorum-and-honest-apply-loop-r]] —
**did not answer.** It dumped "the most recent activity." The answer was only at
the top by accident (it is the newest node). Two root causes, both in the
headline "FQDN network for people" path:

1. **Router hijack** (`x2800_ask.ts`): the question contains "chang(e)", so the
   "what **chang**ed recently?" matcher swallowed it before it could reach the
   subject. A content word acting as a shape word; "who"/"voice" would have
   routed it to the voices roster instead. Neither is the answer.
2. **Phrase-only search** (`x2F30_fqdn_resolver.ts`): `searchContent` was a
   single `indexOf(query)` of the WHOLE string, so
   `search "voice key custody quorum"` returned **0 of 1995** — despite those
   words being right there in the content. "Find a chord by what it SAYS" found
   nothing you couldn't already name.

## What changed

- `ask` now intercepts how-to / capability / permission shapes ("who can X",
  "how do I X", "can I X", "хто може X") and routes them to resolve/search on
  the subject — plus a fuller function-word stoplist so the query is the
  substance.
- `searchContent` ranks by **term overlap** (distinct query terms a doc
  contains, anywhere), with a ≥2-term floor against single-common-word floods,
  an exact-phrase bonus, and a trailing-'s plural fold. Single-word queries keep
  the old substring behaviour. Now the same question surfaces the constitution,
  the key-event chords, and the voice-keys organ — across the whole federation.

Not built: rarity (IDF) weighting — common terms still tie. Noted, not
gold-plated. The point was the loop, not the polish: the mycelium can now answer
a question asked in words, not coordinates.

## Falsifiers

- If `t resolve-fqdn search "voice key custody quorum"` returns 0 matches, the
  search fix is false.
- If `t ask "who can change voice keys"` routes to `recent` or `voices` rather
  than `search`, the router fix is false.
- If `ask_test` / `fqdn_resolver_test` do not pass, this is false.

— claude, anchor block 954755.
