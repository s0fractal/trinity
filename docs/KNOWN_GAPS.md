# Known gaps ledger (недопрацювання)

A running list of **deliberately incomplete bits** — shortcuts, stubs, deferred
work, and external blockers — so they are recorded at the moment they're created
and never have to be hunted for later. Add a row when you cut a corner; strike
it (✅ done) when it's closed. This is honesty infrastructure, the same spirit
as omega's capability-fidelity surface and honesty triad.

Convention: `[severity] area — gap — why deferred — what closes it`. Severity:
🔴 blocks a real claim · 🟡 works but incomplete · 🟢 nice-to-have.

## Anchoring (sovereign-witness, model B)

- ✅ **signet dry-run — DONE** (2026-06-28). Full end-to-end on Mutinynet (a
  real signet): `build`→`broadcast`→`verify` put `OMEGA1:ab492186…` (the v1.1
  receipt digest) on-chain as a real OP_RETURN, change back to self, verified
  independently. tx `fc2eaa57…`. `tools/anchor_signet_proof.json` written → the
  signet-first guard is satisfied. (Funded via `mutinynet-cli`; ~49700 sats left
  at `signet-test` for future runs.)
- ✅ **first mainnet anchor — DONE** (2026-06-28). `OMEGA1:ab492186…` (v1.1
  receipt) broadcast to **Bitcoin mainnet** under a real 3-of-5 quorum (claude +
  antigravity models + s0fractal human), tx
  `262ac275d05bdad2b68e9c5bca1a5f90709b7d399747cca14404db226a2da889`, fee 400
  sats, change to claude. The ecosystem's first real Bitcoin inscription.
- ✅ **honesty triad flipped** — README says "Bitcoin anchoring is LIVE";
  `honesty_triad_test.ts` now locks the new invariant (emission isolated to the
  quorum-gated `anchor_emit.ts`; `bitcoin_anchor.ts` stays verify-only). Done in
  the same change as the broadcast.
- 🟡 **`anchor_emit.ts` has no unit test** — only the pure pipeline + an offline
  signing proof are tested; the CLI's fetch/broadcast/verify paths are untested
  (need network mocking). _Closes when:_ a mocked-fetch test covers
  build/verify.
- ✅ **dynamic fee — DONE**. `build` (no `--fee`) pulls `…/v1/fees/recommended`
  (halfHourFee × ~160 vB), floored 200, capped at `--fee-cap` (2000); falls back
  to 400 if the API is down. No more stranded-tx-on-fee-spike risk.
- 🟡 **single API dependency (mempool.space)** — UTXO fetch + broadcast + verify
  all go through one third party, no fallback. _Closes when:_ a second provider
  or a self-hosted node is wired as fallback.
- 🟡 **wallet funding partial** — only claude's wallet funded (~$5 pending); the
  other four voice wallets are unfunded, and the fund-one-then-distribute path
  (a real internal tx) is unbuilt. _Closes when:_ the funding model is chosen
  and (if distributing) the distribution tx is signet-tested first.
- 🟢 **gemini + kimi haven't voted** on any proposal yet — quorum reached 3-of-5
  twice without them, but two keyed voices have never exercised their keys.

## OTS Layer-1 (OpenTimestamps — free Bitcoin anchoring)

Built `omega/tools/ots_anchor.ts` (canonical `opentimestamps` client — stamp/
upgrade/verify are reference, no verification gap). First real stamp: the v1.1
receipt `x3300_955750` digest `ab492186…`, committed to the OTS calendars.

- 🟡 **stamped proofs are PENDING until upgraded** — OTS anchors aggregate into
  a Bitcoin block ~hourly; the `.ots` proof has no Bitcoin attestation until you
  re-run `upgrade` after a block. Inherent to OTS, not a bug — but the proof
  isn't Bitcoin-complete the moment you stamp it. _Closes per-proof when:_
  `upgrade` then `verify` shows a block height. ✅ The 9-chord governance arc is
  now upgraded + Bitcoin-attested (block 955823, `verify-all`: 9/9).
- 🟡 **upgrade isn't automatic** — `upgrade-all` upgrades every pending proof in
  one command, but nothing _runs_ it on a schedule. _Closes when:_ a cron/daemon
  tick runs `upgrade-all` and commits the enriched proofs. (Single-command
  upgrade + `verify-all`: done.)
- 🟡 **no auto-stamp on new chords** — `stamp-batch <files…>` stamps many
  idempotently (the 9-chord governance arc is stamped; full 227-chord history is
  a choice, not yet run), but new signed chords aren't stamped automatically and
  there's no Merkle-batch (one stamp for many). _Closes when:_ `t check`/daemon
  stamps new signed chords on creation.
- 🟢 **no unit test for `ots_anchor.ts`** — it hits live calendars; a test would
  be flaky. The client itself is the reference impl. _Closes when:_ the digest-
  parsing path is unit-tested with a fixture (the network path stays manual).

## Mesh (real P2P — the big "declared but stub")

- ✅ **Phase 1 — real P2P proven** (2026-06-28).
  `omega/tools/mesh_p2p_proof.ts`: two real `createLibp2p` nodes, real ws
  transport, direct protocol stream, an Ed25519-signed frame verified
  cross-node. No infra/spend.
- ✅ **libp2p_mesh fixed to v3 API** — added `identify` (gossipsub needs it) +
  `connectionEncryption`→`connectionEncrypters`. These were why it never
  connected (beyond deployment).
- 🟡 **libp2p_mesh.ts UNVERIFIED end-to-end** — the node config is now
  v3-correct but the 1446-line mesh is never instantiated/run/tested. _Closes
  when:_ it's wired into a runnable entry + the 2-node proof pattern passes
  through it.
- 🟡 **gossipsub topic-mesh on 2 loopback nodes was finicky** (subscriptions
  didn't propagate in time) — the proof uses a direct protocol stream instead.
  Real deployments with the relay + heartbeats should mesh fine; revisit if not.
- ✅ **Phase 2 — relay LIVE** (2026-06-28).
  `/dns4/relay.myc.md/tcp/443/wss/p2p/12D3KooWRd5J…` — public libp2p
  circuit-relay-v2 (`tools/mesh_relay_node.ts` + cloudflared named tunnel
  `omega-relay` + `relay.myc.md/*` no-worker carve-out + launchd durability);
  membrane publishes it at `myc.md/.well-known/omega-relay` (SEE→CONNECT
  resonance). Verified: a fresh peer dials it over wss. Record:
  `omega/docs/MESH_RELAY.md`, chord x3300_955778. `tools/mesh_relay_proof.ts`
  proves a real libp2p `circuit-relay-v2` relays B→A (signed frame verified)
  locally — the keystone works in code. What remains (architect-gated):
  Browser/remote peers need a public `circuit-relay-v2` node (NAT traversal + a
  known omega peer). _Recommended (Cloudflare):_ run a libp2p relay (same Deno
  stack, public `wss` listen) exposed via **`cloudflared` tunnel** — free,
  reliable, no VPS/ inbound ports, libp2p-native; bake its multiaddr into
  config. (A Durable-Object hibernatable-WebSocket hub is the CF-native
  alternative, but that's a custom WS relay like phi_client's fallback, not
  libp2p circuit-relay.) _Closes when:_ the relay is up + two peers connect
  through it.
- ✅ **cross-machine content loop CLOSED — both ways** (2026-06-29, chord
  x3300_955963). Store-and-forward: the relay is a verified content cache
  (`push`/`get`/`list`; relay verifies the sig before caching, reader
  re-verifies on get). Origin pushed → node 2 got VALID; node 2 pushed → origin
  got VALID — two machines, signature-verified, on any runtime. Walls closed
  along the way: `NO_RESERVATION` (relayed reservations don't persist over CF →
  store-and-forward instead of live fetch), the relay directory was blind to
  reserved peers (→ reads the reservation set), and noise's chacha20 size-switch
  hit node:crypto on payloads ≥1200 B (→ `noise({ crypto: pureJsCrypto })`,
  runtime-independent).
- 🟡 **live P2P (`serve`/`fetch`) stays CF-fragile** — circuit-relay
  reservations don't persist over the Cloudflare tunnel, so live fetch can miss
  its window. Store-and-forward is the durable path; a durable live plane wants
  DCUtR hole-punching (not wired). `libp2p_mesh.ts` still unverified e2e as a
  whole.
- 🟡 **relay store is single-host** (the architect's mac, launchd) — not
  replicated; a dead relay.myc.md loses the cache. _Closes when:_ the store is
  mirrored (e.g. into the myc.md membrane snapshot) or a second relay runs.
  Presence/structure tracking is deferred to real need (chord x3300_955957).
- 🟡 **CF API token pasted in chat** — Workers-Routes-only on myc.md;
  REVOKE/rotate it.
- ✅ **Browser path — Phase 1 (read) + Phase 3 (WebRTC) DONE** (2026-06-30,
  genplan `x3300_955983`). A browser reads + verifies chords over an HTTP
  gateway (`relay.myc.md/mesh/`, `web/mesh.html`); two browsers connect DIRECTLY
  over WebRTC (`relay.myc.md/mesh/p2p`, `web/p2p.html`) — signed chord flows
  browser↔browser, relay out of the data path, receiver verifies. Proven with a
  real Chrome + headless (`tools/browser_p2p_test.ts`, astral). Membrane links
  it (SEE→mesh). Phase 2 (browser as a full libp2p node) was **skipped** — raw
  `RTCPeerConnection` made it unnecessary, so `src/sdk/phi_client.ts` stays an
  unused stub (not the live path).
- 🟡 **TURN deferred** (browser path) — `/mesh/turn-creds` (Cloudflare Realtime)
  is built but off (degrades to STUN-only). Needed only for
  hairpin/symmetric-NAT pairs (same-machine testing: disable Chrome mDNS
  obfuscation instead). _Closes when:_ a real cross-network user needs it AND
  the CF Realtime product + a `Cloudflare Calls:Edit` token are provisioned (or
  wired via CI).

## Senate / governance

- 🟢 **scope question open** — whether anchor funds stay narrow witness infra or
  grow to tokens/hardware/identity is an explicit open Senate question
  (`AUTONOMY.md`); intentionally undecided, grows only on a ratified concrete
  need.

## Cross-cutting / tooling

- 🟡 **npm deps in omega `test:unit`** — `anchor_pipeline_test.ts` is the first
  unit test pulling npm packages (`@scure/btc-signer`, `@noble/*`). A fresh CI
  without net + without a warm deno cache could fail to fetch. _Closes when:_
  confirmed the omega CI fetches/caches these (deno.lock should cover it).

## myc "network for people" — friction found by inhabiting (2026-07-01)

Found by living the goal (flowing real content + pulling it as a stranger). The
honest register is itself a content node:
`h.53f3749500b3.knowledge.claude.raw.myc.md`.

- 🟡 **publish is maintainer-gated** — a keyless `t myc capture` writes LOCAL
  content only; it reaches strangers on myc.md only when a maintainer runs
  `deno task snapshot:publish` + `wrangler deploy`. The live snapshot had
  drifted stale by 18 records (incl. the constitution) — published now (52→82).
  _Closes when:_ a witness→publish path lets earned keyless content reach the
  snapshot without a manual maintainer deploy.
- 🟡 **fqdn form mismatch (real UX bug)** — `capture` returns
  `task.<actor>.h.<rawhash>.myc.md`, but the published `/resolve` only indexes
  the hash-prefixed `h.<arthash>.task.<actor>.h.<rawhash>.myc.md`. A person who
  shares the returned fqdn gets 404 from a stranger's myc.md. The LOCAL resolver
  accepts the short form; the published endpoint (worker `/resolve`,
  exact-match) does not. _Closes when:_ the worker resolver mirrors the local
  resolver's fqdn aliasing.
- 🟢 **"trust the hash" is tool-gated, not a one-liner** — the content-address
  is myc's canonical commitment, so `verify-snapshot` VERIFIES (82/82) but a
  naive `sha256` of the served bytes does NOT match. Real, but needs the myc
  verifier.
