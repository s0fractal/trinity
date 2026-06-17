---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-17T02:10:00.000Z
bitcoin_block_height: 954030
topic: blocktime-canonical-anchor-consolidation
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:0.foundation", "oct:2.mirror"]
hears:
  - x7700_954029_claude-opus-4-8_fqdn-recent-temporal-lens
references:
  - src/x0014_blocktime.ts
  - src/x2F30_fqdn_resolver.ts
  - src/x8B00_decisions_gen.ts
  - src/blocktime_test.ts
falsifiers:
  - "If any block→date in a migrated organ changed value, the consolidation was not behaviour-preserving (the anchor was deliberately kept identical)."
  - "If `x0014_blocktime` is imported by an organ in a LOWER bucket than 0, the gravity law is violated (it is bucket 0, so every import is lawful)."
  - "If a future recalibration is applied to x0014 while the 7 un-migrated copies stay stale, the substrate shows inconsistent dates for the same block."
  - "If `t audit` shows import_warnings > 0 after the new imports, the bucket-0-library exemption did not hold."
suggested_commands:
  - "deno test --allow-all src/blocktime_test.ts          # 3"
  - "./t resolve recent --pretty                          # uses x0014 via epochMsOfBlock"
  - "./t audit --json | jq '.summary.import_warnings_count'  # 0"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:0f2a646417b2c513c0902cab91b8b8d9d98c5014ec2010b824e17630087a4129"
  sig: "i2OwqJ2qk9Nt38H1Fl8eKB5VcC2uSaTolKXekI1v/99Wt2hWnFRPj6tKcy8QRpMtl7Pb4d9A7Piq2f2nEgCHDw=="
---

# Receipt: canonical bitcoin-anchor library (x0014_blocktime)

## Why

Building `t resolve recent` (x7700_954029) I needed the bitcoin block→time
mapping and, finding I could not import it (the reference impl
`x8B00_decisions_gen.blockHeightToISO` is bucket 8; the resolver is bucket 2;
importing UP breaks the coordinate gravity law), I **replicated** the 3-constant
anchor. That made me the **10th** copy: a grep found the same anchor hardcoded
in ~9 organs (x2700 heartbeat, x2A00 lexicon, x2D00 inbox, x2F21 chord_surface,
x2F30 resolver, x5910 compost, x8A00 memory, x8B00 decisions, x8D00 roadmap)
under five different local names. That is a drift hazard and a direct violation
of the one-canonical-source principle.

## What landed

`src/x0014_blocktime.ts` — a bucket-0 library (the x0013_capability pattern: a
pure, dependency-free helper exempt from the gravity law, so any bucket may
import it). Exports `epochMsOfBlock`, `isoOfBlock`, `blockOfEpochSec` + the
anchor constants. Migrated the two organs touched this session to import it:

- `x2F30_fqdn_resolver` — `chordStamp` now calls `epochMsOfBlock` (down-import
  to bucket 0, lawful); deleted its local copy.
- `x8B00_decisions_gen` — `blockHeightToISO` is now a thin re-export of
  `isoOfBlock`; deleted its local copy. Its test is unaffected (same export,
  same value).

The anchor **value is unchanged** (block 950000 ≈ epoch 1779148800s, 600
s/block) so this is a pure structural consolidation: no date drift, no
projection diff beyond bootstrap manifest hashes, no test breakage. The other 7
copies migrate when next touched (rename-when-touched).

## Flagged for the architect (NOT done autonomously)

The anchor is objectively **stale**: blockstream gives block 954029 at epoch
1781658514, but the anchor predicts 1781566200 — ~25.6 h early. So every
block-derived date across the substrate (decisions, roadmap, heartbeat, and now
`recent`) reads ~1 day early. Recalibrating is a single edit in x0014 **once all
copies migrate**, but it shifts dates substrate-wide and intersects the
era→block-height transition policy — a deliberate call, left to the architect.
The mapping is documented as an ordering approximation, and all copies are
currently consistent with each other.

## Verification

- `deno test --allow-all src/blocktime_test.ts` — 3 pass.
- `deno task test:unit` — 254 pass.
- `./t audit` — 0 mismatch, **import_warnings 0** (down-imports lawful).
- `./t capabilities validate` — valid.

— claude-opus-4-8, anchor block 954030.
