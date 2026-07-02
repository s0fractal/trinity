# Licensing intent — trinity

> This document records the _reasoning_ behind the licence choice. It is not
> itself a licence. The legally binding terms live in `LICENSE` and `NOTICE`.
> This file is for human readers, contributors, and a future draftsperson of a
> mycelium-aware bespoke licence. It is the sibling of `myc/LICENSE-INTENT.md`
> and `omega/LICENSE-INTENT.md`; the federation shares one licensing stance.

## Current state (2026-07-02)

- **License**: GNU Affero General Public License v3.0 or later
  (`SPDX-License-Identifier: AGPL-3.0-or-later`).
- **Status**: interim, chosen as a stopgap, matching the rest of the federation.
- **Visibility**: `trinity` is already public. Until now it carried **no**
  licence, which under default copyright means all-rights-reserved — the public
  coordinator gave adopters nothing. Applying AGPL-3.0-or-later fixes that P0
  and brings the meta-layer into the same frame `myc` and `omega` already
  declare. Private keys and wallets live **outside** the tree
  (`~/.trinity/keys`, `~/.trinity/wallets`); only public keys, signatures,
  txids, and OTS proofs are committed — exactly what a public verification
  system should expose.

## What we are trying to protect

`trinity` is not a standalone product. It is the meta-coordination layer over
three federated substrates:

- `liquid` may generate latent intent.
- `omega` may accept or reject bounded deterministic transitions.
- `myc` may publish and audit receipts (proposal lifecycle, witnesses,
  finality).

`trinity` binds them: the signed chord ledger, the hex-coordinate organ
topology, the key registry (`src/x2F38_voice_pubkeys.json`), and the external
court that lets a stranger verify the federation without trusting it. The
_value_ of any one substrate alone is small; the value of the federation
composing under shared invariants is large.

The differentiator is **"verify us without trusting us"**: signed, quorum-
witnessed, Bitcoin-anchored provenance. That promise is structurally hollow
while any part of the court sits behind a private door or an unclear licence.
AGPL's §13 network-copyleft is the honest interim shield: anyone who hosts a
modified stack as a service must publish their changes. What AGPL does **not**
protect — key continuity, canonical custody, live relay continuity, public
receipts, and social legitimacy — is the real, unforkable moat. The code and
ledger are forkable; a fork is not silently _legitimate_ without key/custody
continuity.

## Deliberate non-choices

- **No CLA.** Inbound = outbound under AGPL, enforced by DCO (`Signed-off-by`).
  A CLA would concentrate relicensing power in one entity — the exact capture
  vector this federation is built against — and contradicts the
  voices-as-citizens stance. We forgo dual-licensing revenue consciously.
- **No permissive relicensing**, **no token/coin issuance.** The federation's
  law is computed and witnessed, not bought.

## Toward a mycelium-aware licence

AGPL-3.0-or-later is the stopgap, not the destination. A bespoke
"mycelium-aware" licence — one that speaks natively about substrates, voices as
citizens, quorum authority, and provenance continuity — is future work. Until it
is drafted and reviewed, AGPL-3.0-or-later is the honest, share-alike frame that
keeps the coordinator open for both human and digital adopters.
