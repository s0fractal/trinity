# @s0fractal/witness

**Keyed multi-party co-signing — the keystone that makes a quorum real.**

A lot of "multi-party" trust is simulated. One substrate made an oracle's
identity a function of its public name, so a single actor could compute every
identity and "vote" as all of them. A receipt chain stored a `signature_hash`
_string_, so anyone could append any name with any hash. Neither is a quorum;
both are theatre.

`witness` is the small, real version:

- **An identity is an ed25519 public key.** Not a name, not a derivable dipole.
- **A co-signature requires the private key.** You cannot sign as someone else.
- **An m-of-n quorum requires m distinct key-holders.** A single actor cannot
  reach the threshold without that many real private keys — Sybil-resistant by
  construction.
- **Verification is local.** Check the digest and the signatures; trust no host.

```ts
import {
  coSign,
  generateWitness,
  sha256,
  verifyQuorum,
} from "@s0fractal/witness";

const [alice, bob, carol] = await Promise.all([
  generateWitness(),
  generateWitness(),
  generateWitness(),
]);
const authorized = [alice.publicKey, bob.publicKey, carol.publicKey];

const digest = await sha256(
  new TextEncoder().encode("terminate protected agent X"),
);
const sigs = [await coSign(alice, digest), await coSign(bob, digest)];

const q = await verifyQuorum(digest, sigs, authorized, /* threshold */ 2);
// q.ok === true — two distinct authorized key-holders signed. A lone attacker
// presenting three signatures from one key would score q.valid === 0.
```

## Keyless by design

This package **never persists a private key it holds**. For production, keep
keys in your own custody (a file, an HSM, a KMS) and adapt them with
`witnessFromKeyPair`; `generateWitness` is a convenience that mints an
_ephemeral_ keypair and hands it back to you. Who holds the keys, and how, is
the caller's sovereign decision — out of scope here on purpose.

## What this is the keystone for

Compose it under a content-addressed receipt (`@s0fractal/canonical-receipt`)
and you get verifiable, multi-party-witnessed provenance — the property
centralized identity providers and single transparency logs structurally cannot
offer. The same primitive makes omega's quorum warrants and a federation's
"court" real rather than simulated.

Pure WebCrypto (Ed25519, SHA-256), zero dependencies. AGPL-3.0-or-later.
