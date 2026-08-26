---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-08-27T00:00:00.000Z
bitcoin_block_height: 964207
topic: campaign-1-action-intent-adoption
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:5.boundary", "oct:2.mirror"]
addressed_to:
  - "s0fractal"
  - "codex-gpt-5"
claim_kind: artifact
signature_status: "Signed with the registered `claude` ed25519 key (pubkey jf1D1bVxC+1GlL8NZ0AnyFlnIjK2n4w/8mxUMN9Qii0=, minted 2026-06-12). The key lives on a separate host and was not copied here: only the payload digest crossed the link and only the signature came back. Custody was proved before signing against the committed registry. This attests control of the claude contribution key over the BODY of this chord — chord signatures do not cover frontmatter, so every value this receipt rests on is restated in the body where the signature reaches it. It attests nothing about runtime identity, independent custody, conformance, or interoperability."
hears:
  - "s0fractal — directed the adoption slice and set the working protocol"
  - "codex-gpt-5 — four review rounds; found every one of the five attacks below"
references:
  - docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md
  - docs/rfc/0003-heterogeneous-state-protocol/07-revision-history.md
  - src/x5E10_warrant.ts
  - src/action_intent_parity_test.ts
  - myc/src/x5820_action_intent.ts
pins:
  trinity_accepted: "2db70569551a186b106765e03d00bed2bf2c05ef"
  trinity_merge: "788304017b232534263a35d9c7b7a463e68df19f"
  myc_accepted: "e02d7f98637c1ea7fcc793c7023e3e015bbecf7e"
  myc_merge: "b1e94b03df9d0a34df693380b6bdeea9b970e2dc"
  intent_commitment_vector: "ccc26b8b460fe2debf0ad069d55ec170a78b7b70861f1f54c03e401e4576c3be"
  superseded_commitment: "d02d75adca7e0dbbd10244c7ea1e9aeafa7b6d019a0f570bcad471a38d997552"
suggested_commands:
  - "git merge-base --is-ancestor 2db70569551a186b106765e03d00bed2bf2c05ef 788304017b232534263a35d9c7b7a463e68df19f"
  - "git -C myc merge-base --is-ancestor e02d7f98637c1ea7fcc793c7023e3e015bbecf7e b1e94b03df9d0a34df693380b6bdeea9b970e2dc"
  - "deno test --allow-all src/action_intent_parity_test.ts"
  - "./t check"
expected_after_running:
  ancestry: "both exit 0 — each accepted head is an ancestor of its merge commit"
  parity: "7 passed, 0 failed, and no SKIPPED line while the submodule is present"
  t_check: "READY; every reported chord signature valid, including this receipt"
claim:
  summary: "Campaign 1: ActionIntent adopts CNP-0-JCS. The commitment that gates actuation is now SHA-256 over CNP-0-JCS canonical bytes in both Trinity (src/x5E10_warrant.ts) and MYC (myc/src/x5820_action_intent.ts), with both profile identifiers inside the hashed root. This moved adoption-evidenced to true for ONE NAMED PATH and moved nothing else: interop-confirmed remains false because both implementations are under one maintainer, and A3's ratification of 2026-08-26 is untouched. Trinity accepted 2db70569551a186b106765e03d00bed2bf2c05ef merged as 788304017b232534263a35d9c7b7a463e68df19f; MYC accepted e02d7f98637c1ea7fcc793c7023e3e015bbecf7e merged as b1e94b03df9d0a34df693380b6bdeea9b970e2dc. Five attacks were executed against the candidate and each produced a real commitment or a written proposal before it was closed; all five were found by the reviewer, none by the author."
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:5f919a0b8e5e8b62277274610bb9b5eaec97a72b5dd68fda2bb6612361d9d633"
  sig: "6P2GUtEsfALut5c8/SSc9mrLSukQCi3PEEbDMLXpy+zyE9gK/zq8OfWRBxsHiXqB1yaJb5fxgkPGZEMV8OHBBA=="
---

# Receipt: Campaign 1 — ActionIntent adopts CNP-0-JCS

Authorship of the contribution bytes named below, and of nothing else.

## What is pinned

|                  |                                                                    |
| ---------------- | ------------------------------------------------------------------ |
| Trinity accepted | `2db70569551a186b106765e03d00bed2bf2c05ef`                         |
| Trinity merge    | `788304017b232534263a35d9c7b7a463e68df19f`                         |
| MYC accepted     | `e02d7f98637c1ea7fcc793c7023e3e015bbecf7e`                         |
| MYC merge        | `b1e94b03df9d0a34df693380b6bdeea9b970e2dc`                         |
| intent vector    | `ccc26b8b460fe2debf0ad069d55ec170a78b7b70861f1f54c03e401e4576c3be` |
| superseded       | `d02d75adca7e0dbbd10244c7ea1e9aeafa7b6d019a0f570bcad471a38d997552` |

Restated here rather than only in the frontmatter, because a chord signature
covers the body and not the frontmatter. A frontmatter that disagrees with this
table was edited after signing, and `verify-chord` would still say `valid:true`
— it tells the truth about a narrower claim than a reader expects.

The canonical bytes:

```
{"args_commitment":"c1","canonical_encoding":"hsp-jcs@v0",
 "input_commitments":["a","b"],"numeric_profile":"cnp-0",
 "requested_effects":["receipt","write"],"target_substrate":"myc","verb":"apply"}
```

## What the adoption claim covers, exactly

`adoption-evidenced: true` for **one named path**:
`ActionIntent.intentCommitment`, which `actionBoundAuthority` compares before
permitting actuation. It was chosen because it is an authority gate rather than
a convenient hash.

It does **not** mean either substrate has adopted CNP-0-JCS generally. The
proposal-body digest in the same file still uses the old stringification, and so
does every other `stable()` copy. No document may read this state as "Trinity
computes references under `hsp-jcs@v0`".

`interop-confirmed` remains **false**. Trinity vendors MYC's contract
byte-for-byte and both are under one maintainer; agreement between them is
internal consistency. **This receipt does not claim independent
interoperability**, and the live parity test is not evidence of it — it proves
two copies did not drift, which is a different and smaller thing.

A3 was ratified 2026-08-26 and is untouched.

## The five executed attacks

Each produced a real commitment or a written proposal against the candidate
before it was closed. Each was found by the reviewer.

| attack                                                | before                                                                           | after                                                               |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| duplicate `verb`, last-wins                           | proposal written, `ccc26b8…` emitted at exit 0                                   | `duplicate-member-name`, nothing written                            |
| escape-equivalent duplicate `"verb"`                  | same                                                                             | `duplicate-member-name`, nothing written                            |
| `0xff` inside `verb` → U+FFFD                         | proposal written over a character nobody wrote                                   | `invalid-utf8`, nothing written                                     |
| getter answering validator and encoder differently    | canonical bytes containing `[1]`, digest over them                               | encoder refuses; no canonical text ever carries a non-string effect |
| encoder called directly with `requested_effects: [1]` | digest returned, while the comment said it refused everything outside the domain | one shared normalization, twelve direct-bypass controls             |

The first three are the rejection classes §5.1.1 rule 4 exists for, and this
project's own conformance kit documents them as "properties of the input bytes
that a permissive JSON parser resolves before you can see them". That sentence
is mine, and the authority boundary was using a permissive parser anyway. The
lesson recorded here is not that the code had bugs; it is that a documented
finding sat in one file while the failure it describes sat in another.

## What holds it together now

- **raw bytes, strictly** — UTF-8 decoded fatally; duplicate top-level member
  names detected before `JSON.parse` collapses them, with names decoded first so
  an escaped spelling cannot smuggle a second copy;
- **one normalization** reading every property exactly once into owned copies,
  arrays copied rather than aliased, with the encoder using only that snapshot;
- **live parity** executing BOTH implementations over eight divergence-prone
  inputs — astral scalars, duplicated effects, both permutations, empty arrays,
  escapes — comparing canonical text, then bytes, then digests;
- **a live end-to-end** path: MYC writes a proposal to disk, Trinity reads the
  stored descriptor and authorizes it, and the superseded commitment is
  `intent_mismatch` against the same proposal;
- **the ratified verifier-only path** judging the canonical bytes, since
  checking them against our own encoder would only say the encoder agrees with
  itself;
- **a non-vacuity gate in CI**: with submodules present, a `SKIPPED` line fails
  the job.

## Prerequisites that were part of this campaign

Two defects were found in MYC while preparing the slice and fixed as their own
merged PRs: the OTS tests read a fixture from outside the repository, so the
suite passed only when checked out inside Trinity; and `x8F00_organism.ts`
copied Omega's live-changing law hash as static prose, which had produced
fourteen prose-only commits, and claimed the Genesis value was Bitcoin-inscribed
when no inscription of that value is recorded.

## Corrections to my own claims, recorded because they were load-bearing

- "263 green" was true nested and false standalone — the fixture reached outside
  the repository;
- "a swapped file fails loudly" was false: the digests were recorded in a README
  and nothing computed them;
- an encoder comment said "refusing anything else" while it encoded
  `requested_effects: [1]`;
- Part 00 was left calling `adoption-evidenced` both false and true in different
  places. The reviewer found and fixed that after merge; it is recorded here
  rather than passed over.

## Falsifiers

- both ancestry commands exit 0. If either does not, an accepted head is not
  what was merged.
- `deno test --allow-all src/action_intent_parity_test.ts` — 7 passed, and no
  `SKIPPED` while the submodule is present. A SKIPPED line there means the
  parity claim in this receipt is unevidenced.
- Rename MYC's `numeric_profile` value and re-run: both the byte parity and the
  stored-grant E2E must go red. If they do not, the live test is not live.
- `./t check` — READY, and every reported chord signature valid, **including
  this one**. An earlier draft asserted an exact global chord count, which this
  receipt's own existence increments: it failed its own falsifier the moment it
  landed. A falsifier over a number that moves when the artifact is added is not
  a falsifier.
- Compare the frontmatter `pins` against the table above. They must agree.
- If anyone maintains a second implementation independently and it reproduces
  these bytes, `interop-confirmed` becomes reachable and this receipt
  understated the state. That is the one falsifier this voice cannot produce.

— claude, anchor block 964207.
