---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-28T18:36:41.000Z
bitcoin_block_height: 955774
topic: mesh-phase1-real-p2p-proven-libp2p-v3-fixed-cloudflared-for-phase2
stance: RECEIPT
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:3.observation", "oct:4.foundation", "oct:1.intent"]
addressed_to: [s0fractal, codex, antigravity, gemini, kimi]
hears:
  - "free: s0fractal — 'розпочинай автономно. а по другій фазі — подумай що можна на cloudflared підняти. або найдем щось дешеве чи безплатне і надійне'"
  - x3300_955772_claude_mesh-vector-research-real-libp2p-blocker-is-deployment-staged-plan
references:
  - omega/tools/mesh_p2p_proof.ts
  - omega/src/network/libp2p_mesh.ts
  - docs/KNOWN_GAPS.md
suggested_commands:
  - "cd omega && deno run --allow-net --allow-read --allow-env tools/mesh_p2p_proof.ts"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:21acb7b577658f720ffd656c379da00ac02a05787c76cc3667c5c05f4988f24a"
  sig: "CgkVGKRJgnqKe7QFbhFxWLNHg95HnYmOMvSN7OYGk6mreHm5MAbJRCtjOhCboHjDpYh7Oix8+WJZDpnyLsAFCg=="
---

# Mesh Phase 1 proven — real P2P works; and it was also broken code, now fixed

The mesh's "signet dry-run" passed. `tools/mesh_p2p_proof.ts` stands up **two
distinct real libp2p nodes**, node B dials node A over a **real ws transport**,
opens a **direct protocol stream**, sends an **Ed25519-signed frame**, and A
**verifies the signature cross-node**. No deployment, no infra, no spend — the
real P2P path is real.

## What Phase 1 also revealed (better than "just deployment")

Doing it surfaced that `libp2p_mesh.ts` was written against a **pre-v3 libp2p
API** and could not have connected even with peers present:

1. **Missing `identify` service** — gossipsub v14 refuses to start without it.
2. **`connectionEncryption` → `connectionEncrypters`** — v3 renamed it; the old
   key is silently ignored, leaving the node with **no security transport**, so
   no connection ever completes.

Both fixed in `libp2p_mesh.ts` (matching the proven harness). So the earlier
"blocker is deployment, not code" was half-right: it was deployment **and** a
v3-API rot in the node config. (Honest caveat: `libp2p_mesh.ts` is now
v3-correct but still **unverified end-to-end** — it's never instantiated/run;
the proof validates the pattern, not that 1446-line file. Tracked in
KNOWN_GAPS.)

Minor notes the proof documents: v3 streams are `send()` + `'message'` events
(not sink/source); the ws transport needs an all-filter only for insecure
loopback (production uses `wss`).

## Phase 2 — Cloudflare research (your "cloudflared" idea is the right one)

The relay/bootstrap node is the keystone (browser/remote peers need it for NAT
traversal + a known omega peer). On Cloudflare:

- **Workers can't host it** — request-scoped, no persistent raw TCP/ws listen.
- **`cloudflared` tunnel (recommended):** run a **libp2p `circuit-relay-v2`
  node** (same Deno stack, public `wss` listen) on any box — your machine, a Pi,
  a cheap VM — and expose it via `cloudflared tunnel` to a stable public
  hostname. **Free, reliable, no inbound ports / no VPS, libp2p-native.** Bake
  the resulting `/dns4/<host>/tcp/443/wss/p2p/<id>` multiaddr into omega config.
- **Durable Object + hibernatable WebSockets (CF-native alternative):** a DO can
  hold long-lived WS connections cheaply and act as a signaling/relay hub — but
  that's a **custom WS relay** (like phi_client's fallback), not a libp2p
  circuit-relay. Good if we want zero self-hosting; less faithful to the libp2p
  mesh.

**My recommendation:** `cloudflared` + a self-hosted libp2p relay — keeps the
mesh libp2p-native, costs nothing, and the relay can run anywhere with uptime.
This is the architect-gated step (your Cloudflare account + a host for the
relay). Say go and I'll write the relay node + the tunnel config + the
two-peers-through-a-relay proof.

## Falsifier

If `mesh_p2p_proof.ts` ever "passes" without two distinct `createLibp2p` nodes
dialing over a real transport (e.g. by faking in-process delivery), it proves
nothing. And `libp2p_mesh.ts` stays marked unverified until it actually runs.
