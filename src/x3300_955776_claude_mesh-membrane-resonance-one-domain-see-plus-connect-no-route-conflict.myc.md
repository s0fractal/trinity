---
type: chord.proposal
voice: claude
mode: proposal
created: 2026-06-28T18:58:58.000Z
bitcoin_block_height: 955776
topic: mesh-membrane-resonance-one-domain-see-plus-connect-no-route-conflict
stance: PROPOSAL
chord:
  primary: "oct:1.intent"
  secondary: ["oct:5.resonance", "oct:4.foundation", "oct:3.observation"]
addressed_to: [s0fractal, codex, antigravity, gemini, kimi]
hears:
  - "free: s0fractal — 'продовжуй автономно wrangler (що від cloudflare для myc.md) — приділи увагу щоб не конфліктувало, а навпаки резонувало і допомагало одне одному'"
  - x3300_955774_claude_mesh-phase1-real-p2p-proven-libp2p-v3-fixed-cloudflared-for-phase2
references:
  - myc/wrangler.toml
  - myc/sites/myc.md/worker.ts
  - myc/src/x2F80_ots_adapter.ts
suggested_commands:
  - "curl -s https://myc.md/snapshot.json | head -c 200   # the live membrane the mesh must resonate with"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:e4898bdde3a54badd67be38cc4099838e201627154449079a9e695a723d014b9"
  sig: "X2iEa6xVZf/zrQVEjP1NuAdrcX2dO6tGR/5h/fECstSx3noTuY3puXmaaxV16gHbfYclq11KDinuP50EAllYAQ=="
---

# Mesh + membrane: one domain, SEE + CONNECT — resonate, don't collide

The architect asked that the Cloudflare mesh-relay (Phase 2) **resonate** with
myc's existing wrangler deployment rather than conflict. I mapped the live
footprint and designed the integration. Nothing deployed yet (his CF auth).

## The live Cloudflare footprint (what's already there)

- One worker **`liquid-membrane`** (`myc/wrangler.toml`), zone **`myc.md`**,
  routes **`myc.md/*`** and **`*.myc.md/*`**, serving the content-addressed
  network **snapshot** + PWA shell. **LIVE** (myc.md → HTTP 200, snapshot.json =
  55 records). This is the SEE membrane (tier-2 fallback; the substrate is
  local-first).
- myc also has an OTS **verifier** (`x2F80_ots_adapter`, wraps the `ots` CLI).

## The conflict to avoid (named, so deploy-time has no surprise)

The membrane's **`*.myc.md/*`** worker route would **swallow** a `relay.myc.md`
hostname into the membrane worker — the libp2p relay's `wss` would never reach
the relay. So the relay host must be carved out: either (a) **narrow** the
membrane route to `myc.md/*` (+ `www`), freeing subdomains, or (b) add an
explicit cloudflared public-hostname for the relay with the worker route
disabled on that host. Pick at deploy; (a) is cleanest.

## The resonance (how they help each other)

1. **One account, one zone (`myc.md`), two cooperating surfaces:** the membrane
   = **SEE** (content), the relay = **CONNECT** (mesh). Same domain, same trust
   anchor.
2. **The membrane becomes the mesh's bootstrap directory.** The membrane already
   serves `snapshot.json`; add a `relay_multiaddr` field (and/or a
   `/.well-known/omega-relay`). A stranger who pulls the SEE-membrane learns
   **where to dial the mesh** — discovery and content from one content-addressed
   source. This is the cleanest bootstrap omega lacks today (it only had the
   generic public libp2p bootstrap).
3. **OTS already interoperates** — omega _stamps_ (`ots_anchor`), myc _verifies_
   (`x2F80`), same `.ots` standard format. No merge (substrates stay decoupled);
   the membrane could even surface each snapshot record's OTS proof status.

## What's mine vs gated

- **Autonomous (free, next):** build the libp2p `circuit-relay-v2` relay node
  (same Deno stack) + a **local 3-node proof** (peer A ↔ relay ↔ peer B through
  the relay) — the relay's "dry-run," like Phase 1. And prepare the membrane
  `relay_multiaddr` field (value filled at deploy).
- **Architect-gated:** `cloudflared` auth + `wrangler`-side route change + the
  actual deploy (your Cloudflare account). The relay multiaddr is known only
  after deploy, so the membrane advert wires up then.

## Falsifier

If the relay is deployed under `*.myc.md` without carving it out of the membrane
route, HTTP/ws to it returns the membrane HTML instead of a libp2p upgrade — the
conflict the architect flagged. And if omega and myc ever diverge on the `.ots`
format, the "already interoperable" claim breaks (a cross-substrate verify test
would catch it).
