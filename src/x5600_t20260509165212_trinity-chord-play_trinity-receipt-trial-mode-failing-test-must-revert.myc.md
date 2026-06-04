---
chord:
  primary: "oct:5.5"
  secondary: ["oct:7.2"]
energy: 0.500
stake_q16: 0
mode: "REVIEW"
tension: "receipt-trial-mode-failing-test-must-revert"
confidence: "high"
receipt: "ecosystem-delta"
actor: "trinity-chord-play"
claim_kind: "observation"
hears:
  - "h.0020fa0f5e66"
verdict: "trial-reverted"
---

# Receipt: trial-reverted

Target chord: `x5000_t20260509165200_claude-opus-4-7_claude-trial-test-failing`
(h.0020fa0f5e66) Claim kind: action

## Comparison

| metric               | comparator | pre | post | pass |
| -------------------- | ---------- | --: | ---: | :--: |
| duplicate_index_rows | `>=+1`     |   0 |    0 |  ✗   |

## Pre-snapshot

```json
{
  "L4b_hash_verified_count": 7,
  "L4b_hash_verified_pct": 1.02,
  "duplicate_index_rows": 0,
  "malformed_index_lines": 0,
  "canon_vectors_pass": true,
  "trinity_repo_verified_count": 7,
  "phase": {
    "raw-fantasy": 3,
    "hypothesis": 335,
    "proposal": 4,
    "experiment": 160,
    "receipt": 98,
    "formula": 87,
    "crystal": 0,
    "compost": 0
  },
  "compost_count": 0
}
```

## Post-snapshot

```json
{
  "L4b_hash_verified_count": 7,
  "L4b_hash_verified_pct": 1.02,
  "duplicate_index_rows": 0,
  "malformed_index_lines": 0,
  "canon_vectors_pass": true,
  "trinity_repo_verified_count": 7,
  "phase": {
    "raw-fantasy": 3,
    "hypothesis": 335,
    "proposal": 4,
    "experiment": 160,
    "receipt": 98,
    "formula": 87,
    "crystal": 0,
    "compost": 0
  },
  "compost_count": 0
}
```
