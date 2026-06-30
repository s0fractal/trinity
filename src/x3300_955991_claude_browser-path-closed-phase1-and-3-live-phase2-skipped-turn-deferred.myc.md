---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-30T00:03:00.000Z
bitcoin_block_height: 955991
topic: browser-path-closed-phase1-and-3-live-phase2-skipped-turn-deferred
stance: RECEIPT
chord:
  primary: "oct:3.observation"
  secondary: ["oct:6.flow", "oct:4.foundation", "oct:1.intent"]
addressed_to: [s0fractal, codex, antigravity, gemini, kimi]
hears:
  - "free: s0fractal — 'пункт 1 зробив - працює'; 'онови документаційні моменти — щоб у нас задеклароване відповідало зробленому'"
  - x3300_955983_claude_genplan-browser-path-mesh-reachable-from-any-browser
references:
  - omega/web/mesh.html
  - omega/web/p2p.html
  - omega/tools/mesh_relay_node.ts
  - omega/tools/browser_p2p_test.ts
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:8d02fa53796252ff8bf49fed75b97c27adf59192de251146c59bbc77a6f01d3b"
  sig: "DFPSGfgH3tE9cQOpuFp3emwwfb7GERTcMAmXj/pEglrE2xf9nfzChONY+tMriy70OouxMEuq7QXIJfP/Nk+pAA=="
---

# Browser path — closure: what was declared vs what was done

The genplan
([[x3300_955983_claude_genplan-browser-path-mesh-reachable-from-any-browser]])
declared three phases. This records the actual outcome, so the ledger matches
reality. Docs updated to match: `MESH_RELAY.md`, trinity `KNOWN_GAPS.md`, and a
note in `phi_client.ts`.

## Outcome by phase

- **Phase 1 — browser READER: DONE + live.** HTTP gateway on the relay
  (`/mesh/list`, `/mesh/get`, page at `relay.myc.md/mesh/`, `web/mesh.html`). A
  browser fetches + verifies the Ed25519 `content_sig` itself against `x2F38`
  from an independent source (GitHub raw) — gateway untrusted by design. Linked
  from the membrane (`myc.md` → "browse the live mesh"): SEE→CONNECT navigable.

- **Phase 2 — browser as a full libp2p NODE: SKIPPED (not needed).** The plan
  expected a bundled browser libp2p node as the stepping-stone to P2P. Raw
  `RTCPeerConnection` reached browser↔browser directly without it, so the heavy
  bundle was never built. `src/sdk/phi_client.ts` stays an **unused stub** — not
  the live path.

- **Phase 3 — browser↔browser WebRTC: DONE + PROVEN.** `/mesh/signal` (a dumb
  WebSocket rendezvous) + `web/p2p.html` (raw WebRTC). A signed chord flows
  browser↔browser DIRECTLY, relay out of the data path, receiver verifies.
  Proven with a real Chrome and headless (`tools/browser_p2p_test.ts`, astral):
  connect + direct chord + **VALID**. Matchmaking is ghost-proof (live peers
  offer newcomers, dead sockets pruned); verification is native-Web-Crypto-first
  with a pure-JS noble fallback so any browser verifies.

- **TURN — BUILT, deferred.** `/mesh/turn-creds` mints Cloudflare Realtime TURN
  creds (key from a 0600 file outside the repo) and the page merges them into
  ICE. Off by default → STUN-only. Needed only for hairpin/symmetric-NAT pairs
  (the architect's same-machine test, behind a no-hairpin MikroTik). Deferred
  until a real cross-network user needs it; provisioning needs the CF Realtime
  product + a `Cloudflare Calls:Edit` token (the token supplied was valid but
  lacked that scope). Same-machine: disabling Chrome mDNS obfuscation connects
  two tabs directly with no TURN — verified by the architect.

## What this session also bought

A reusable **headless-browser test** (`tools/browser_p2p_test.ts`, astral) — the
browser path now has a regression test runnable here, including against the real
Chrome binary. Found + fixed two real issues this way (cross-browser Ed25519
verify; ghost-peer matchmaking) before they reached the architect.

## Falsifier

If `relay.myc.md/mesh/p2p` ever shows a chord VALID without independently
verifying its signature, or `phi_client.ts` is wired in as the live P2P path (it
isn't), this closure is wrong.
