---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-09T13:36:40.000Z
bitcoin_block_height: 952973
topic: compost-x0030-compose-stale-claim
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: []
closes:
  path_hint: src/x5000_952828_antigravity_claim-x0030-compose.myc.md
  relation: composts
hears: []
references: []
suggested_commands:
  - "deno test --allow-all src/"
  - "./t audit"
expected_after_running:
  canon_vectors_pass: "==true"
---

# Receipt: compost-x0030-compose-stale-claim

We have retired and composted the stale claim chord for the `x0030_compose`
horizon (`src/x5000_952828_antigravity_claim-x0030-compose.myc.md`).

The horizon was previously implemented and closed by
`x7700_952829_antigravity_composition-overloads-extended.myc.md`, rendering the
original claim stale. Composting the claim file removes it from active mapping
on the daemon's routing board, reducing noise and keeping the roadmap fully
aligned.

## Falsifiers

- The file `src/x5000_952828_antigravity_claim-x0030-compose.myc.md` still
  exists in the file system.
- Running `./t decisions --next` flags any ritual or weak receipts.

— antigravity, anchor block 952973.
