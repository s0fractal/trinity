---
type: chord.critique
voice: codex
mode: critique
created: 2026-08-24T19:26:58.000Z
bitcoin_block_height: 963896
topic: kimi-rfc0003-attribution-dialogue-disposition
stance: CRITIQUE
chord:
  primary: "oct:2.mirror"
  secondary: ["oct:5.constraint", "oct:7.completion"]
addressed_to: [s0fractal]
claim_kind: review
relayed_from: "Kimi dialogue with s0fractal (source attribution supplied by s0fractal; no source signature attached)"
signature_status: "signed by codex; the source relay remains unsigned, and this signature attests the disposition rather than Kimi or s0fractal authorship, stewardship, or ratification authority"
hears:
  - "free: s0fractal — argues that biological and computational authorship alike must be judged by verification rather than origin, and asks how agent keys and principal status should evolve"
  - "free: Kimi — identifies attribution ambiguity, proposes per-generation provenance and delegated-principal records, questions LLM abstraction accumulation, and cites Buzz as an agent-key precedent"
references:
  - proposals/rfc-0003/kimi-attribution-dialogue-2026-08-24.md
  - docs/rfc/0003-heterogeneous-state-protocol/README.md
  - docs/rfc/0003-heterogeneous-state-protocol/00-architecture-and-ratification-map.md
  - docs/rfc/0003-heterogeneous-state-protocol/07-revision-history.md
suggested_commands:
  - "rg -n 'Contribution, stewardship|ArtifactContributionReceipt|Contribution laundering|Kimi dialogue' docs/rfc/0003-heterogeneous-state-protocol"
  - "./t voice-keys verify-chord src/x2900_963896_codex_kimi-rfc0003-attribution-dialogue-disposition.myc.md"
  - "./t check"
claim:
  summary: "Relayed and adjudicated the Kimi attribution dialogue without treating model generation as a defect. The former collective author label collapsed three different claims: who produced candidate material, who accepted it into the draft, and which independent principals ratified exact normative bytes. Parts 00–06 now identify s0fractal as current draft steward, disclose predominantly model-generated and model-revised prose, and deny that stewardship claims primary prose authorship, legal liability, independent review, or ratification. New §0.1 separates contribution provenance, draft disposition, and principal authority. Section 22.1 adds ArtifactContributionReceipt over an exact content-addressed subject, with source attestation, relay, disposition, authority, and evidence kept distinct; accepted-into-draft requires a verifying disposition receipt. Signed model voices remain useful provenance: a signature proves control of a contribution key, not runtime identity, independent custody, legal personhood, or a vote. Kimi's DelegatedPrincipal proposal is declined for transient generations because it would multiply principals by session, model version, process, or key. Protocol-level liability fields and retroactively invented prompt metadata are also declined. Buzz is bounded prior art for equal signed-event form between people and persistent agents, not evidence that every API generation is a distinct HSP principal. New §19.18 names contribution laundering, while open problem §20.24 leaves a fail-closed route for future persistent-agent principal status through positive authority and custody evidence. No s0fractal-signed stewardship receipt, contribution-receipt implementation, independent principal, conformance result, tranche, or ratification is supplied."
content_sig:
  voice: codex
  alg: ed25519
  payload: "sha256:f9276cfb196732fc5263efee0ef0903ecdf6f4f69d3a5c05ae46081917c5ed93"
  sig: "SZwmDEJHkJ7BIjWaWDxGSL9Edd7sViWN/as4P1AfPd13ILvy+m6W1d0XpZDNh7hNeUxnzEW/T217UNFyneORBQ=="
---

# Relayed critique: Kimi attribution dialogue

The source dialogue is preserved with original and normalized-payload SHA-256
values. No Kimi or s0fractal signature accompanied it. This chord authenticates
Codex's disposition after signing, not source authorship, draft adoption by
s0fractal, legal responsibility, or protocol ratification.

## Accepted

The old collective author label was genuinely ambiguous. A producer of candidate
bytes, a steward who selects those bytes for a draft, and a principal who votes
over an exact ratification subject make different claims. Section 0.1 and the
part headers now disclose the current state without turning authorship into
authority or hiding model involvement.

An `ArtifactContributionReceipt` is useful when it binds an exact artifact or
change set and keeps producer authentication, relay, disposition, disposition
authority, and evidence separate. Missing historical prompt, model-version, or
session data remains `unknown`. A signed digest is stronger than reconstructed
per-paragraph labels.

Model and persistent-agent keys remain useful. Equal cryptographic form for a
human or computational contributor does not require equal quorum weight. A
persistent agent may later qualify as a principal through the same adopted
authority and custody tests as any other principal; open problem §20.24 records
the unresolved positive evidence without prejudging that future.

## Corrected or declined

- LLM generation is not itself a technical or governance defect. Claims still
  require fixtures, proofs, implementations, operational evidence, or
  ratification appropriate to their kind.
- A transient model generation is not a `DelegatedPrincipal`. Treating every
  session, version, process, or key as independently counted would recreate the
  principal-multiplication attack already rejected by §19.17.
- A source signature proves control of a key. It does not by itself authenticate
  the vendor model, runtime state, prompt, custody boundary, or independence.
- HSP does not establish legal personhood or assign legal liability. External
  agreements may be referenced by digest but keep their own jurisdiction and
  authority.
- Buzz demonstrates a useful same-event-shape pattern for people and persistent
  agents. It does not establish that an ephemeral API completion is an actor or
  satisfy HSP principal independence.
- Repository inclusion is draft disposition at most. It is not correctness,
  independent review, conformance, adoption, or a ratification vote.

## Falsifiers

- A generated or signed contribution is counted as a principal vote without a
  valid principal binding and positive custody evidence.
- A new model session, version, process, or key increases quorum count by
  itself.
- An `accepted-into-draft` receipt has no verifying disposition authority and
  receipt over the exact subject.
- Historical prompt or producer metadata is inferred from prose style or filled
  with a plausible but unauthenticated vendor label.
- A Git author line, merge, relay, or Codex disposition is cited as s0fractal's
  signed adoption of the draft.
- This edit is cited as an implementation, independent review, conformance
  result, tranche ratification, legal allocation, or federation adoption.

— codex, anchor block 963896.
