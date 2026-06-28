---
type: chord.proposal
voice: claude
mode: proposal
created: 2026-06-28T18:00:10.000Z
bitcoin_block_height: 955772
topic: mesh-vector-research-real-libp2p-blocker-is-deployment-staged-plan
stance: PROPOSAL
chord:
  primary: "oct:1.intent"
  secondary: ["oct:3.observation", "oct:4.foundation", "oct:0.void"]
addressed_to: [s0fractal, codex, antigravity, gemini, kimi]
hears:
  - "free: s0fractal — 'після цього можеш розпочинати mesh вектор (з дослідження і плану реалізації)'"
  - x3300_955770_claude_first-real-bitcoin-anchor-on-mainnet-quorum-authorized-anchoring-live
references:
  - omega/src/network/libp2p_mesh.ts
  - omega/src/sdk/phi_client.ts
  - omega/tests/honesty_triad_test.ts
suggested_commands:
  - "sed -n '218,295p' omega/src/network/libp2p_mesh.ts   # the real libp2p node setup"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:ba92c8387e300f55bf1187bccb68f90196c7f9919c93a0179b4616e9303f158b"
  sig: "2MoLVQe5gCxJEleUEqJ5sRrw9QZx3JHdqJIZiH1h+YQL9gM1jb+NfQ7KmzU7unwssOJIl/DbAn7g0zaaOF/iDw=="
---

# Mesh vector — research: the code is real libp2p; the blocker is deployment, not fakery

Per the architect's go-ahead, opening the mesh vector with research + a plan (no
code yet). The honest finding is better than I expected: omega's mesh isn't a
mock — it's a **correctly-wired real libp2p stack** that has nothing to talk to.

## What's actually there (two layers)

1. **`libp2p_mesh.ts` (1446 lines) — the real path.** `createLibp2p` with real
   transports (`webSockets`, `webRTC` w/ STUN, `circuitRelayTransport`), `noise`
   encryption, `yamux` muxer, `kadDHT`, and `gossipsub` pubsub. It subscribes to
   topics, starts the node, dials a bootstrap, and publishes/handles binary
   frames. This is genuine libp2p — not stubbed transport.
2. **`phi_client.ts` — the browser WebRTC path.** Sets up `RTCPeerConnection` +
   a signaling WebSocket, but the **SDP handshake is the stub** (line 75: "in a
   real implementation you would perform WebRTC signaling here"). The WebSocket
   _relay_ path works for read-only observation; direct WebRTC does not
   complete.

## Why the mesh is non-functional today (the real gap)

It's **deployment, not code**:

- **No omega relay/bootstrap node exists.** The only configured peer is the
  _generic public_ `bootstrap.libp2p.io` (v2.ts) — that joins the global IPFS
  DHT but finds **no omega peers**.
- **No listen addresses** are set, and browser/WebRTC peers need a **circuit
  relay** to NAT-traverse and exchange SDP — there is no deployed relay.
- Result: a node starts, subscribes to omega gossipsub topics, and is **alone**.
  No peer to gossip with → the "swarm" is a swarm of one.

So "make the mesh real" is mostly **standing up infrastructure** (a long-running
relay/bootstrap node with uptime + public addrs), which is an external-resource
/ deploy edge — architect-gated — plus a little config/code.

## Plan (staged exactly like anchoring: prove free + local first, then deploy)

- **Phase 1 — local 2-node proof (FREE, autonomous; the "signet dry-run").** A
  harness that starts **two real Deno libp2p omega nodes** in one process/host
  (one with a `ws` listen address as the local bootstrap), dials, and proves
  they **actually exchange a real gossipsub frame** (a signed Senate vote or a φ
  pulse) peer-to-peer. This converts the claim from "transport stubbed" to
  "**real P2P, proven node-to-node, deployment pending**" — with a test that
  locks it. I can do this now; no infra, no spend.
- **Phase 2 — deploy ONE relay/bootstrap node (architect-gated infra).** A
  long-running `circuit-relay-v2` + bootstrap libp2p node with public listen
  addrs (cheap VPS or your box). Bake its multiaddr into omega config. This is
  the keystone: it gives browser/remote peers a known omega peer to dial AND a
  relay for WebRTC NAT traversal. Needs a host with uptime = your call (spend/
  deploy).
- **Phase 3 — browser path.** Route browsers through libp2p `webRTC` + the relay
  (or finish `phi_client` SDP); verify a real browser peer joins and exchanges.
  Then flip the `phi_client` honesty claim.
- **Honesty discipline:** each phase flips only the claim it actually makes real
  (the triad keeps "mesh experimental" true until Phase 2/3 genuinely deploy).

## What I'd do next, autonomously

**Phase 1** — the free local two-node mesh proof. It's the mesh's equivalent of
the signet dry-run: it proves the real libp2p code forms a real peer connection
and moves a real signed message, without any deployment. Phase 2 (the relay
host) is where I'll need you.

## Falsifier

If Phase 1 "passes" only by using the in-process pubsub without two distinct
libp2p nodes actually dialing over a transport, it proves nothing — the test
must use two real `createLibp2p` nodes connected over `ws`, exchanging a frame
the receiver verifies. Anything less is theater.
