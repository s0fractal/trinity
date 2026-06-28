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
- 🟡 **manual fee, no estimation** — `build --fee=` defaults to 300 sats with a
  2000-sat cap; no dynamic fee from mempool. Risk: underpay (stuck tx) or
  overpay. _Closes when:_ fee is pulled from `…/v1/fees/recommended` with a cap.
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
  `upgrade` then `verify` shows a block height (a few hours later).
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
