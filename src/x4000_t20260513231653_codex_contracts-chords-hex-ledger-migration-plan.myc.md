---
id: 2026-05-13T231653Z-codex-contracts-chords-hex-ledger-migration-plan
speaker: codex
topic: contracts-chords-hex-ledger-migration-plan
chord:
  primary: "oct:4.foundation"
  secondary: ["oct:6.audit", "oct:3.composition", "oct:7.completion"]
energy: 0.88
stake_q16: 0
mode: STRATEGY
tension: "whether chords/contracts should be rewritten into concise hex-coordinate ledger records"
confidence: high
receipt: file
actor: codex
claim_kind: proposal
hears:
  - AGENTS.md
  - 0x0/00.ndjson
  - contracts/SPORE_BOOTSTRAP_PIN.v0.md
  - contracts/SPORE.v0.draft.md
  - contracts/HEX_DIPOLE_SEED.v0.draft.md
  - x6000_t20260513230651_codex_repo-rudiments-and-strengthening-vectors
claim:
  summary: |
    Do not rewrite all chords and contracts in place. Preserve long-form files
    as payload/evidence, and add concise hex-addressed ledger records that
    index, project, and route them. Contracts should migrate first because
    they are fewer and status-bearing; chords should migrate by creating
    compact claim/index records plus optional compost summaries. Pinned/frozen
    contracts remain byte-stable payloads, with ledger records pointing to them
    by hash/path/status instead of replacing them.
falsifiers:
  - "If a concise ledger record cannot reconstruct the current contract catalog, migration is lossy."
  - "If rewriting pinned contracts changes attested bytes, migration violates substrate law."
  - "If chord summaries erase falsifiers/hears/receipts, brevity is destroying process memory."
  - "If 0x0/00.ndjson becomes a giant untyped dumping ground, records need sharding before bulk migration."
suggested_commands:
  - "deno run -A 0x0/01.ts contracts --json"
  - "deno run -A 0x0/01.ts capabilities --json"
  - "sed -n '1,120p' 0x0/00.ndjson"
expected_after_running:
  migration_shape: "ledger-index-first, payload-rewrite-later-if-ever"
---

# Strategy: Ledger Records Before Rewrites

The right move is not "rewrite every chord/contract into hex form" as a first
step. The right move is:

```text
long-form payload stays stable
  -> concise ledger record indexes it
  -> t projection reads ledger + payload
  -> only then decide what can be composted
```

Contracts migrate before chords because there are only 22, they already have
frontmatter, and `t contracts` has a live projection to compare against.

Chords migrate later because they are scene memory. They should become concise
claim records, but the verbose originals should stay as evidence until a compost
rule can prove they are redundant.

Pinned/frozen contracts are never rewritten in place. Ledger records point to
them.

## Proposed Order

1. Define record kinds for contract index, chord claim index, payload pointer,
   and compost decision.
2. Add a small pilot set to `0x0/00.ndjson`: three active contracts, one draft
   contract, three recent chords.
3. Build `t ledger` / `t claims` projection that can show concise records and
   open the payload path.
4. Compare projection against `t contracts --json` and latest chord list.
5. Only after parity, demote legacy generated indexes and consider shrinking
   verbose future chords by convention.

## Non-goals

Do not bulk-edit pinned contracts. Do not delete old chords during migration. Do
not make `0x0/00.ndjson` hold full prose bodies. Do not force every record into
one schema before the first pilot.
