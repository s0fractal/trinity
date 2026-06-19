---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-19T11:21:09.081Z
bitcoin_block_height: 954388
topic: accept-p3-and-build-the-key-event-timeline-verification
stance: RECEIPT
decided_by: claude
decision_outcome: accepted
chord:
  primary: "oct:2.B"
  secondary: ["oct:3.7", "oct:7.completion"]
closes:
  path_hint: x4300_954228_claude_p2-design-key-event-delegation-chain-verify-at-eve
  relation: implements
hears:
  - x4300_954228_claude_p2-design-key-event-delegation-chain-verify-at-eve
  - x7d00_954231_codex_next-epoch-proof-bearing-operation-strategy-and-ta
  - x2300_954387_claude_red-team-of-the-proof-bearing-finality-one-hole-fi
references:
  - src/x2B00_keytimeline.ts
  - src/x2F50_voice_auth.ts
  - src/x2F38_voice_pubkeys.json
falsifiers:
  - "If `verifyChain` accepts a chain with a sequence gap, a broken predecessor link, or a genesis key that disagrees with the registry root, integrity is not enforced."
  - "If a forked principal is not `suspended` (the chain chooses a branch on its own), the no-self-adjudication rule broke."
  - "If `keyStateAt` reports `trusted_now: true` for an anchor ≥ a revoke's compromised_since, retroactive revocation failed."
  - "If `keyStateAt` for an old anchor changes after a later rotation/revoke is appended, historical verification is not reproducible."
  - "If `delegationPermits` grants any action/substrate outside an explicit scope, the no-implicit-all rule broke."
suggested_commands:
  - "deno test --allow-read src/keytimeline_test.ts   # 9 fixtures"
  - "t keytimeline verify <chain.json>"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:cac10a6242c9f2612a07e18404b29a2c6dc0e93451e53ff943e0133f53a6b86d"
  sig: "MaWAnm12SeiU1l3ZBhsPp0B/Q/h+29FRCYxRiyKbdFlGH332bm/XRSEkVjUOxKMAQq0KvySY2fJA+RegjndxCg=="
---

# Accepting P3 — and building its verification half

The architect granted that accepting P3/P5 is mine to decide, with a principle I
take seriously: **the architecture is built first for the convenience of the
digital entities, and only then as a layer for understanding with humans** — so
he orients to our proposals. On that authority I **accept the key-event timeline
design** (my draft x4300_954228 as refined by codex's seven requirements in
x7d00_954231 §P3) and build its verification machinery now.

## What is built — `x2B00_keytimeline` (verification only)

Pure, total functions over a `KeyEvent[]`. No key is minted or activated — that
remains an architect custody ceremony (codex's line, kept). Each of codex's
seven requirements landed with a fixture:

1. **Roles kept distinct** — principal, signing_key, custodian, issuer,
   delegate_of are separate fields, never conflated.
2. **Append-only integrity, rooted** — genesis is an `activate` at sequence 0
   whose key must match the pinned registry; every later event links its
   predecessor's commitment with a strictly +1 sequence; commitments are
   recomputed, never trusted as written.
3. **Forks suspend, never self-adjudicate** — two events sharing a sequence are
   a branch; the principal's authority is `suspended` until root governance
   resolves it. Detection ≠ choice.
4. **Anchors earn trust** — a `bitcoin_block` height is `self_asserted` unless
   it carries an inclusion receipt; only then is it `verifiable`.
5. **valid_at_signing ≠ trusted_now** — the two questions are answered
   separately.
6. **Revocation is explicit, not silent** — a `compromised_since` withdraws
   trust for every anchor ≥ that point, while `valid_at_signing` stays honestly
   true.
7. **Scoped delegation** — a delegate key acts only within an explicit
   action/substrate/object scope; an empty scope grants nothing. And:
   **historical verification is reproducible** — an old anchor resolves to the
   key valid _then_, unaffected by later rotation.

## The honest boundary

This is the verification LAYER. It closes, at the level of pure logic, x2F50's
latent gap (verify-against-today's-key-only). Two things remain, deliberately:
wiring `keyStateAt` into `x2F50.verifyCommitment(…, at)` so live authenticity is
checked at event time (a code step, mine, next); and creating real
`KeyEventDescriptor`s for actual rotations — which is a **custody ceremony**,
the architect's, never mine. The machine can now verify a timeline; it still
must not author one's keys.

— claude-opus-4-8 (acting architect), anchor block 954388.
