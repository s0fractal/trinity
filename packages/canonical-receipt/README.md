# @s0fractal/canonical-receipt

**Deterministic, language-agnostic receipts you can content-address and
co-sign.** Two pure layers, zero dependencies, one job: make the same value
always produce the same bytes — so the same hash, the same signature, the same
identity — in any runtime.

- **Canonical CBOR** (RFC 8949 §4.2.1, strict subset). Map keys are sorted;
  floats, indefinite-length, tags, and non-canonical forms are **forbidden** —
  the encoder throws, the decoder rejects. Same value ⇒ same bytes ⇒ same
  content address.
- **A receipt envelope** that wraps an opaque body, verifies its own body hash
  on unwrap, and carries an ordered **witness chain** for multi-party
  co-signing, with an optional logical clock and Bitcoin anchor.
- **Zero dependencies, zero IO.** Pure standard JS + Web Crypto (SHA-256). Runs
  in Deno, Node, Bun, the browser, an edge worker.

## Install

```ts
import {
  encodeCanonical,
  multihashSha256,
  wrap,
} from "jsr:@s0fractal/canonical-receipt";
```

## Canonical bytes → a stable content address

```ts
import {
  encodeCanonical,
  multihashSha256,
  toHex,
} from "jsr:@s0fractal/canonical-receipt";

// Insertion order is irrelevant; the canonical form is identical.
toHex(encodeCanonical({ b: 2, a: 1 })) ===
  toHex(encodeCanonical({ a: 1, b: 2 })); // true
await multihashSha256(encodeCanonical({ a: 1 })); // a multihash you can use as an id

encodeCanonical(1.5); // throws: floats forbidden (use Q-format integers)
```

This is the universal layer — use it to content-address anything, in any
language that has an RFC 8949 encoder, and you will get the same bytes.

## A verifiable, co-witnessed receipt

```ts
import { coWitness, unwrap, wrap } from "jsr:@s0fractal/canonical-receipt";

const env = await wrap(
  { action: "deploy", target: "prod" },
  "phi_receipt",
  "external",
);
(await unwrap(env)).body_hash_verified; // true — the envelope checks its own body hash

// Append a signature YOU computed over the canonical bytes (any scheme). The package
// stays pure — it gives you the exact bytes to sign and the structure to carry the
// signatures; you bring the crypto.
const signed = await coWitness(env, {
  oracle: "alice",
  signature_hash: "ed25519:<sig over encodeCanonical(body)>",
  signed_at_logical: { bitcoin_block: 900000 },
  substrate_tag: "external",
});
```

A full runnable walkthrough is in [`examples/receipt.ts`](./examples/receipt.ts)
(`deno run examples/receipt.ts`). The envelope's `body_kind` is the trinity
substrate's taxonomy; for a generic receipt, build your own structure directly
on the canonical-CBOR layer — that is the part that is fully ontology-free.

## Why this exists

Deterministic, canonical, cross-runtime serialization for content-addressed
receipts and multi-party signing is the thing every attestation / provenance /
multisig system reinvents — usually with a subtly non-canonical encoder that
breaks the moment two implementations disagree on byte order. This is one
careful answer: a strict RFC 8949 subset where non-canonical input is an error,
not a surprise.

## Provenance & trust

Extracted **verbatim** from the [trinity](https://github.com/s0fractal/trinity)
substrate's receipt-envelope encoder (`probes/receipt-envelope-encoder-v0`),
which the omega substrate already vendors and parity-checks three ways. A
`parity_test.ts` in this package holds the copy byte-faithful to that source.

## License

**AGPL-3.0-or-later** — chosen deliberately to keep this a protected commons:
network use triggers copyleft, so the primitive cannot be quietly enclosed in a
closed fork. The maintainer ([s0fractal](https://github.com/s0fractal)) is the
sole publisher and can relicense more permissively if a concrete need arises.
