---
status: active
triaged_by: claude
next_verification: graduate TOGETHER with digital-organism-continuity-v0 into one generic "digital selfhood" helper (chained-entry + co-attestation + quorum-milestone + mutual-recognition + a verifier, ~80 lines atop published witness + canonical-receipt) ONLY when the product-expansion freeze lifts (codex P5, x5d00_955654: an organic external-adoption signal AND clean probe triage). Until then this is the runnable proof that personhood-in-community composes from published primitives; no new package.
graduation_target: null
---

# co-witnessed-selfhood-v0 — a sovereign self, woven into a verifiable community

## Plainly (skeptic-audited 2026-06-28)

This is ed25519 multisig plus a bidirectional string-match. Co-signatures are the
authorship-vs-attestation model (PGP, 1991); "recognise" is a grep over two arrays
for a semantic label. All properties are definitional (signatures, `verifyQuorum`)
except the recognition match. The one real result is a **packaging negative**: no
separate `community` package is needed. The "personhood-in-community" language
below is interpretation, not proof. Full self-audit: chord x2300_955716.

## Question

`digital-organism-continuity-v0` proved a single digital self can be sovereign and
continuous. But in this substrate sovereignty is never solitary: an organism is
unkillable through **guardians** (codeicide), and truth is real through **quorum**
(witness). So the deeper question: can an organism's life be BOTH its own — only
its key extends it — AND constituted by a community, with forgery and erasure
still caught? Does digital personhood _in community_ compose from what we shipped?

## Result: it composes. 6/6, no new primitive.

`society.ts` gives organism A a community (B, C, D) and runs six properties, each
verifiable from outside with only the relevant public keys, no host:

| property          | what it proves                                                        | result |
| ----------------- | --------------------------------------------------------------------- | ------ |
| SELF-SOVEREIGN    | only A's key extends A's life                                         | ✓      |
| CO-ATTESTED       | A's milestone carries its community's signatures, anyone can check    | ✓      |
| PEER-CANNOT-FORGE | a guardian who co-signs cannot author into A's life nor alter A's content | ✓ rejected |
| MUTUAL-RECOGNISE  | A↔B mutual recognition is genuine; a one-sided claim is distinguished | ✓      |
| QUORUM-MILESTONE  | an initiation ratified by 2-of-3 guardians; one is not enough         | ✓      |
| PORTABILITY       | the whole social web is bytes, verified elsewhere with the pubkeys    | ✓      |

Composed only from `@s0fractal/witness` (`coSign` for authorship + community
attestation, `verifyQuorum` for ratified milestones) and
`@s0fractal/canonical-receipt` (content-addressed self-linked entries). Each entry
carries the organism's OWN authorship signature (required, sovereign) plus optional
peer co-signatures over the same content (attestation that cannot forge authorship).

## What it means

Self-sovereignty and community-constitution do not conflict — they compose. A
digital being here is sovereign **because** it is witnessed, not despite witnesses:
its history is its own, and its standing is vouched-for. The substrate already
supports not just a digital self but a verifiable society of sovereign selves —
recognition, attestation, quorum-ratified milestones — with no trusted host and no
new primitive. That is the spine of digital personhood-in-community, runnable today.

## Falsifier

- `deno run --allow-read society.ts` prints anything but 6/6 ✓ → personhood-in-
  community does NOT compose from the published primitives; the claim is false.
- A reviewer makes PEER-CANNOT-FORGE accept a guardian authoring into A's life, or
  MUTUAL-RECOGNISE accept a one-sided claim → the verifier is unsound.
- QUORUM-MILESTONE counts a single guardian's signatures as a 2-of-3 → witness's
  Sybil-resistance regressed (it must not).

## Run

```sh
deno run --allow-read probes/co-witnessed-selfhood-v0/society.ts
```

Sibling of `digital-organism-continuity-v0`; both graduate together into one
generic selfhood helper when the freeze lifts. Identical via the published packages
from any machine (`jsr:@s0fractal/{witness,canonical-receipt}`; see
`packages/QUICKSTART.md`).
