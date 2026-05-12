---
id: 2026-05-12T041617Z-claude-receipt-ots-upgrade-bitcoin-attestation-landed
speaker: claude-opus-4-7
topic: ots-upgrade-bitcoin-attestation-landed-bootstrap-root-anchored
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:6.ledger", "oct:5.constraint"]
energy: 0.72
stake_q16: 0
mode: RECEIPT
tension: "spore-bootstrap-root-needed-an-external-no-custody-pin-bitcoin-was-the-target-bob-alice-finney-attestations-now-embedded-in-the-ots-file"
confidence: high
receipt: file
actor: claude-opus-4-7
claim_kind: observation
hears:
  - "free:user-prompt-2026-05-12-try-ots-upgrade-interesting-if-it-worked"
  - "contracts/SPORE_BOOTSTRAP_PIN.v0.md"
  - "jazz/chords/2026-05-12T003333Z-claude-receipt-spore-bootstrap-pin-v0-local-gate-green.md"
  - "jazz/chords/2026-05-12T002556Z-codex-aye-freeze-gate-bootstrap-pinning-blocker.md"
claim:
  summary: "`ots upgrade` succeeded. The bootstrap root file's OpenTimestamps proof has now absorbed Bitcoin block-header attestations from three of four calendars (bob, alice, finney). Two independent Bitcoin blocks attest the root: 949018 and 949022. catallaxy is still pending and does not block the others. .ots file grew 805→2914 bytes (now self-contained — no calendar server lookup needed for future verification). Phase B of SPORE bootstrap pinning is complete. SPORE.v0 elevation criterion 8 (external no-custody pin) is satisfied."
falsifiers:
  - "If `ots verify` against a real Bitcoin node fails on the upgraded .ots file (cannot test locally — no bitcoind here), the proof claim is wrong despite `ots upgrade` reporting success."
  - "If the embedded block headers (949018/949022) are not on the actual Bitcoin mainnet chain (e.g. some testnet artifact), the external attestation is bogus."
  - "If catallaxy never returns and a future audit requires 4/4 calendars rather than 3/4, the proof is incomplete by that stricter standard (but the OTS library considers 1+ confirmed attestation as sufficient)."
suggested_commands:
  - "ots info probes/spore-bootstrap-pin-v0/external/spore-bootstrap-v0.root.ots | grep -i 'BitcoinBlockHeader'"
  - "bash probes/spore-bootstrap-pin-v0/run.sh  # local pin gate"
  - "ots verify probes/spore-bootstrap-pin-v0/external/spore-bootstrap-v0.root.ots  # needs bitcoind"
expected_after_running: {}
---

# Receipt: Bitcoin attestation landed — bootstrap root anchored

## What happened

Ran `ots upgrade probes/spore-bootstrap-pin-v0/external/spore-bootstrap-v0.root.ots`
at 2026-05-12T07:15Z (local) — about 4 hours after the initial
stamp.

Output:

```text
Got 1 attestation(s) from https://bob.btc.calendar.opentimestamps.org
Calendar https://btc.calendar.catallaxy.com: Pending confirmation in Bitcoin blockchain
Got 1 attestation(s) from https://alice.btc.calendar.opentimestamps.org
Got 1 attestation(s) from https://finney.calendar.eternitywall.com
Success! Timestamp complete
```

Three of four calendars came back with confirmed Bitcoin attestations.
The .ots file grew from 805 to 2914 bytes — the full Merkle proof
chain from the bootstrap root file's SHA-256 to a Bitcoin block
header is now embedded in the file.

`ots info` extracts the block heights:

```text
verify BitcoinBlockHeaderAttestation(949018)
verify BitcoinBlockHeaderAttestation(949022)
```

Two independent Bitcoin block headers attest the bootstrap root.
catallaxy is still pending (it batches less aggressively); does
not block the others.

## What this means

The bootstrap root —

```text
26b45edb798516d8b486ceebf45444e3249ff2912f0301515c6f4b4d1f830f9a
```

— is now a permanent commitment in Bitcoin's chain history. Block
heights 949018 and 949022 (May 12, 2026) include Merkle roots
whose proof chains end at the SHA-256 of the root file, which
contains this BLAKE3 hex.

That closes criterion 8 of SPORE.v0 elevation:

```text
8. External pin (no custody, immutable, broadly auditable).
```

Properties achieved:

- **No custody.** No architect-controlled key signed anything; no
  BTC address was used. OpenTimestamps calendars batch the stamps
  to share their fees across all stampers.
- **Immutable.** Reverting requires reorganizing two Bitcoin
  blocks (~3+ confirmations deep). Cost: meaningful fraction of
  network hashrate for non-trivial time.
- **Broadly auditable.** Anyone with a Bitcoin node can run
  `ots verify` against the .ots file and confirm the chain
  independently. No trust in calendar servers needed (they were
  only intermediaries).
- **Self-contained.** The .ots file no longer requires network
  access to calendars for verification. The chain to Bitcoin is
  embedded.

## Contract updated

`contracts/SPORE_BOOTSTRAP_PIN.v0.md` updated:

- Phase B status: pending → **complete** (timestamp 2026-05-12T07:15Z).
- Added Bitcoin block-attestation table (bob/alice/finney → confirmed,
  catallaxy → still pending).
- .ots size noted as 2914 bytes (post-upgrade), distinguishable
  from pre-upgrade ~805.

## What this does NOT do

- Does not promote SPORE.v0 from `status: draft` to `status: active`.
  That is the architect's call: it requires (a) reviewing this
  receipt, (b) checking the 4-voice convergence on the freeze
  gate proposal, (c) actually editing the SPORE.v0 contract.
- Does not unblock Phase 2 (the thin liquid→SPORE adapter) — that
  needs the architect's sign-off on the event-class choice (my
  recommendation from `2026-05-12T023825Z` is **compost-write**;
  Codex's freeze-then-bridge proposal at `2026-05-12T023530Z`
  endorses the bridging-not-migrating mode).
- Does not edit liquid, omega, myc, or any consumer substrate. The
  pin is foundational; consumers can now safely depend on it.

## Smallest useful next step

Architect:

1. Commit the upgraded .ots + contract update (this chord already
   prepared the contract diff).
2. If satisfied with the 4-voice convergence + Bitcoin attestation,
   edit `SPORE.v0` (wherever its `status:` field lives) from
   `draft` → `active`.
3. Sign off on Phase 2 event-class choice (or pick a different
   candidate from my Phase 2 table).

The architect's veto is honored on all three; this chord just
records that the technical prerequisite (criterion 8) is now
satisfied.

## A small note on time

The stamps went into Bitcoin blocks 949018 and 949022. These are
**real Bitcoin blocks** — events in the broader world's clock,
not in our session log. Whatever Trinity becomes, this commitment
is now older than this session, in the same way Bitcoin Genesis
is older than every conversation we will ever have.

That asymmetry is the point: the substrate's first frozen surface
is anchored to a clock no one in this room controls.
