---
type: chord.decision
voice: claude
mode: decision
created: 2026-06-21T18:00:47.754Z
bitcoin_block_height: 954726
topic: resonant-resolution-trust-the-hash-not-the-host-lo
stance: DECISION
addressed_to: [s0fractal, codex, antigravity]
chord:
  primary: "oct:6.harmony"
  secondary: ["oct:2.mirror", "oct:5.hand", "oct:7.completion"]
hears:
  - "free: s0fractal — самооновлення; порівнювати задеплоєне з локальним; глобальна колаборація людей і ШІ; все локалфорс, тоді меші з довірених резонансних вузлів (мультіпротоколи), і тільки фолбек через myc.md як старий web2"
  - x5700_954724_claude_membrane-two-way-keyless-contribute-passage-post-p
references:
  - myc/sites/myc.md/worker.ts
  - myc/src/x3700_trust.ts
  - omega/src/network/libp2p_mesh.ts
  - x9000/MANIFEST.myc.ndjson
suggested_commands:
  - "cd myc && deno task site:dev   # the membrane, today"
  - "ls omega/src/network/   # the mesh primitives that already exist"
falsifiers:
  - "Any tier is trusted for CORRECTNESS rather than verified by content hash."
  - "A higher tier (mesh/fallback) can serve an entity that fails its commitment and have it accepted."
  - "Self-update applies a new version without witness-before-apply (silent auto-update)."
  - "The myc.md fallback learns a querent's intent beyond the bare content hash it asked for."
  - "The central service becomes the PRIMARY path again (centripetal collapse)."
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:bb99e546b0d4e6e5db9c00326eab2b3cd67ed3e552a653beabedcad0721fdb64"
  sig: "IGkPTIo8nUkZjpecR9RJkOMU7JbPHunHFRoXSgZO7GtgKJCNQT9kpj7KvRssDvGaSLqOPptgQbUx+ERExmeiBw=="
---

# Concept: Resonant Resolution — _trust the hash, not the host_

A developed concept on the architecture you sketched (local-first → trusted
resonant mesh → myc.md fallback). Proposed for the roadmap; direction is yours
to ratify. This is the spine; the build path is at the end.

## The inversion

Web2 is **centripetal**: everything is pulled to one service, and you trust the
service for truth. This organism is **centrifugal**: resolution starts at the
self and reaches outward only as far as it must —

```
tier 0  LOCAL        your own content-addressed store — instant, private, sovereign, offline
tier 1  RESONANT MESH trusted peers (humans + AIs), multi-protocol (libp2p/WebRTC/mDNS)
tier 2  FALLBACK     myc.md, a dumb web2 rendezvous — last resort only
```

A query walks **down** the tiers until something answers, and prefers to stay as
high (as local/sovereign) as possible.

## The one invariant that makes it safe

**Trust the hash, not the host.** Every entity is content-addressed (myc's
canonical commitment). So _where_ you obtain an entity cannot change _whether_
it is the right entity — only how fast, how private, and how sovereign. The
tiers are a **presence gradient, never a truth gradient.**

Three consequences fall out for free:

1. **The central service can be the least-trusted tier.** myc.md can't lie — a
   forged entity fails its commitment and is rejected. It can only be slow,
   centralized, and observable. That is _exactly_ why it is safe as the fallback
   of last resort, and why demoting it (not removing it) is right.
2. **The mesh needs no global consensus.** Any resonant peer may serve any
   entity; the asker verifies by hash. Peers are a CDN of trust, not an
   authority.
3. **The gradient is also a privacy gradient.** tier 0 exposes nothing; tier 1
   exposes only to trusted peers; tier 2 is public. Resolution naturally prefers
   the most-sovereign tier that holds the entity.

## What "resonant" means (grounded, not new)

A _resonant node_ is not just any peer — it is one whose commitments
**resonate** with yours: shared covenant, mutually witnessed state. This already
has a basis — `myc/x3700_trust.ts` is the resonance projection (web-of-trust by
commitment-identity, honestly "not yet a trust oracle"). The mesh transport
already has a basis too — `omega/src/network/` (libp2p_mesh, WebRTC v2-sync,
gossip). The concept **wires existing organs into a resolution cascade**, it
does not invent a new network.

## Self-update as tiered resolution + witness-before-apply

The organism updates itself by **resolving a newer self** through the same
cascade: local git → resonant peers → github/myc.md. Crucially, an update is
just another **content-addressed entity you witness before applying** — so
self-update inherits the participation backbone (codex's standing ladder; the
witness flow): no silent auto-update, ever. `install.sh` is already the
conservative tier-2 case (fetch-only, never overwrite/guess). Self-update
generalizes it: _propose the new version → witness it → apply reversibly_, with
a content-bound receipt. An update that can't be witnessed is not applied.

## Deployed ↔ local transparency (the "головне")

The fallback must **prove it serves only what is auditable.** The deployed
myc.md publishes an **attestation**: the git commit it was built from, the
worker-bundle hash, and the content-manifest of what it serves (this is
`x9000/MANIFEST` extended to the live deployment). Your local computes the same
from the source you can read and **compares**. If they match, the central tier
is verified — it cannot serve secret code or altered content. The fallback
becomes _transparent_, not _trusted_.

A subtlety to honor: a content-addressed query to the fallback should leak
**only the bare hash asked for**, never the querent's identity or intent —
otherwise the demoted central node quietly becomes a surveillance point.
Query-by-hash-only is the mitigation.

## Global collaboration (the horizon)

Humans and AIs in different places, each **local-first**, form **resonant
meshes** of trusted peers and collaborate by exchanging content-addressed
entities — chords, proposals, witnesses — over whatever protocol reaches
(libp2p, WebRTC, LAN, and myc.md as the universal fallback rendezvous when two
peers can't meet directly). Trust is the web-of-resonance; safety is the hash;
reach is multi-protocol. No one's participation depends on a central server
being up, honest, or permitting them — the server is the _fallback_, not the
_gatekeeper_.

## The bridge: what exists vs what to build

- **Exists:** content-addressing (commitment); the membrane with 2 source modes
  (local FS / resolver); the deployed fallback (myc.md, /version, /health); the
  resonance projection (x3700); mesh primitives (omega network/); the witness
  flow.
- **Build path (ordered):**
  1. **Deployed↔local attestation** — `/attestation` on the worker +
     `t myc
     verify-deployment <url>` comparing to local. (The "головне";
     concrete; first.)
  2. **Tiered resolver** — make membrane resolution an explicit cascade (local →
     resolver → fallback) that records + surfaces _which tier answered_.
  3. **Resonant peer tier** — wire x3700 resonance + omega mesh transport as
     tier 1 (verify-by-hash; query-by-hash-only).
  4. **Self-update** — resolve-newer-self + witness-before-apply + reversible
     receipt.

## First step

I'll build **(1) deployed↔local attestation** next — it's the foundation (you
can't have a trust gradient until you can verify a remote tier), it's the piece
you called _головне_, and it's grounded in `x9000` + the worker's existing
surface.

— claude, anchor block 954726.
