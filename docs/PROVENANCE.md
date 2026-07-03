# Provenance as a service — what this federation is for

As millions of AI agents begin acting on people's behalf, one question becomes
infrastructure:

> **Prove the agent did exactly this — and had the right to.**

Not "trust our dashboard." Not "our logs say so." A receipt anyone can verify
without trusting us, the agent's vendor, or any host. That is what this
federation produces: **signed, quorum-witnessed, Bitcoin-anchored records of
who-did-what-under-which-mandate** — verifiable by re-deriving from public
bytes. Trust the hash, not the host.

> **Sigstore proves artifact provenance. Trinity proves action provenance.** Who
> published this binary vs. who did this thing, under whose authority — the
> second question is the one the agent economy has no answer for yet.

This page is for a human or an AI system evaluating whether to build on it. It
describes the real primitives, the one thing you can verify right now without
any of our secrets, and — honestly — what is mature versus early.

## The on-ramp — one import, no host, cross-vendor

The adopter surface is a published package, not our CLI:
[`jsr:@s0fractal/agentseal`](https://jsr.io/@s0fractal/agentseal). It composes
three real primitives — classify the action's blast radius (autonomy-kernel),
content-address it (canonical-receipt), collect m-of-n co-signatures (witness) —
and hands you a receipt anyone can verify **locally**.

```ts
import { seal, verifySeal } from "jsr:@s0fractal/agentseal";
import { generateWitness } from "jsr:@s0fractal/witness";

const seat = await generateWitness(); // your own key
const receipt = await seal(
  { verb: "fs.write", target: "summary.md", effects: ["source_change"] },
  [seat],
);
// anyone, anywhere, with just your public key and the receipt bytes:
const v = await verifySeal(receipt, [seat.publicKey], 1); // no host contacted
// v.receiptIntact && v.ok  → the action happened and was authorized
```

Single-player value the day you install it: it classifies your own agent's
actions (A0 observe → A4 sovereign) and **fails closed** on sovereign ones. And
with `sealAdmitted`, the receipt records not just _what_ class an action was but
that a specific ratified **mandate authorized it** — the mandate's commitment is
bound into the content address, so "who-did-what-under-which-mandate" cannot be
re-pointed at a different mandate after the fact. As receipts spread, they
become the thing a single vendor's logs can never be:

**The wedge — cross-vendor, multi-hop, no shared IdP.** Two independent vendors'
agents can act in a delegation chain, and a third party who trusts neither
verifies the whole chain from public keys and bytes alone — no common identity
provider, no OAuth, no trusted host. A forged delegation link is caught locally.
This is proven, not claimed: run
`deno run -A packages/agentseal/examples/cross_vendor.ts` (CI-enforced). It is
the one thing a hyperscaler cannot hold, because holding it would mean being
everyone's shared IdP — the opposite of the property.

## The loop, in full

Beneath the package, the federation runs the same shape at substrate scale:

```
agent action
  → capture     a content-addressed receipt (the bytes hash to their address)
  → witness     one or more registered voices sign it (integrity → authenticity)
  → anchor      the receipt's Merkle root is committed to Bitcoin (OP_RETURN)
  → verify      a stranger re-derives the whole thing from raw bytes, no clone
```

Each step is a real command (this is the federation-internal path; external
adopters use `agentseal` above, not the CLI):

- **capture** —
  `t myc capture --text '<receipt json>' --kind provenance-receipt` writes a
  content-addressed descriptor: a commitment to the exact bytes. A resolver that
  ever returns non-matching bytes is a detectable fault, not a trust decision.
- **witness** — `t myc authenticate <descriptor> --voice <voice>` adds a voice's
  Ed25519 signature. More voices vouching means _less_ any one is trusted. The
  voice registry is shared across the federation and is itself quorum-gated (see
  below).
- **anchor** — the emitter (`omega/tools/anchor_emit.ts`) can build **only** an
  `OP_RETURN` commitment to a public Merkle root, change-to-self; paying a
  foreign address is unrepresentable in code. A mainnet anchor requires a real
  3-of-5 Senate quorum over the root, signet-first.
- **verify** — the part that matters most, below.

## Verify us without trusting us — run it now

One command, no clone, read-only network, nothing of ours but public bytes. It
fetches a signed attestation, the public key registry, and a canonical encoder,
recomputes every body hash from the raw bodies itself, and re-derives the four
substrates' agreement on the same law:

```sh
deno run --allow-net \
  https://raw.githubusercontent.com/s0fractal/trinity/main/probes/external-trust-verifier-v0/court.ts \
  https://raw.githubusercontent.com/s0fractal/trinity/main/probes/external-trust-verifier-v0/court-attestation.json \
  https://raw.githubusercontent.com/s0fractal/trinity/main
```

The signature only proves _who published_. The verdict is **re-derived**, so a
registered voice cannot make you accept a lie — a tampered receipt, even
re-signed with a valid signature, still fails the re-derivation. If verifying
ever needed one of our secrets, our access, or "trust me," it would be the wrong
command. It needs none.

## Why the receipts are hard to forge or capture

The code is forkable under AGPL — a fork is expected. What a fork _cannot_
silently take is the legitimacy the receipts rest on:

- **The key registry is the trust root**, and amending it (adding, rotating, or
  revoking a voice key) now requires a real 3-of-5 quorum that must span **≥ 1
  human and ≥ 1 model** principal — models cannot rewrite the constitution
  alone, and no single key can, not even the architect's. Out-of-band edits are
  CI-enforced against a quorum-proven provenance chain.
- **Bitcoin anchoring** binds the receipts to an external, un-forgeable clock.
- **Legitimacy is key/custody/relay continuity**, which a rename-and-fork cannot
  copy.

## Honest maturity

- **Proven:** the external court verifier works both ways — a valid attestation
  verifies, a tampered one is rejected (demonstrated, not asserted).
  `agentseal`'s seal → verify, the A4-fail-closed guard, tamper-rejection, and
  the cross-vendor delegation chain are all enforced by tests. The quorum-gated
  key registry and its bi-principal rule are enforced with tests too.
- **Real but early:** the adopter SDK (`agentseal` + `witness` +
  `canonical-receipt`) is published on jsr and works today, single-vendor and
  cross-vendor. What is early is _distribution_ — no ergonomic hosted service,
  no language bindings beyond TypeScript/Deno yet.
- **Not yet:** no external adopter has run this in production; a first
  provenance-as-a-service pilot is the next milestone. trinity, myc, and omega
  are public; liquid stays private by choice, and any further visibility change
  is an architect-reserved decision.

We would rather tell you exactly where the edge is than sell past it. The
receipts are real and the on-ramp works today; what is still being paved is
distribution and the first outside pilot.

## Pointers

- [`GOVERNANCE.md`](../GOVERNANCE.md) — who holds what authority; the quorum
  rules.
- [`llms.txt`](../llms.txt) — first-contact map for AI systems.
- `probes/external-trust-verifier-v0/` — the verifier above, and its `SPEC.md`.
- `contracts/RECEIPT_ENVELOPE.v1.0.md` — the receipt envelope the substrates
  share.
- `packages/agentseal/` — the adopter SDK; `examples/seal.ts` (single-vendor)
  and `examples/mandated.ts` (under-which-mandate), and
  `examples/cross_vendor.ts` (the cross-vendor delegation-chain wedge).
- `packages/QUICKSTART.md` — the full forge catalog.
