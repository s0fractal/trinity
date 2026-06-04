---
chord:
  primary: "oct:5.5"
  secondary: ["oct:7.2"]
energy: 0.500
stake_q16: 0
mode: "REVIEW"
tension: "receipt-two-models-on-same-chord-multi-model-jam"
confidence: "high"
receipt: "ecosystem-delta"
actor: "trinity-chord-play"
claim_kind: "observation"
hears:
  - "h.1c04ca8ce157"
verdict: "dormant"
---

# Receipt: dormant

Target chord:
`x7300_t20260509091900_claude-opus-4-7_claude-fantasy-multi-model-jam`
(h.1c04ca8ce157) Claim kind: future-fantasy

## Comparison

| metric                      | comparator |  pre | post | pass |
| --------------------------- | ---------- | ---: | ---: | :--: |
| trinity_repo_verified_count | `>=15`     |    7 |    7 |  ✗   |
| canon_vectors_pass          | `==true`   | true | true |  ✓   |
| compost_count               | `>=1`      |    0 |    0 |  ✗   |

## Pre-snapshot

```json
{
  "L4b_hash_verified_count": 7,
  "L4b_hash_verified_pct": 1.04,
  "duplicate_index_rows": 0,
  "malformed_index_lines": 0,
  "canon_vectors_pass": true,
  "trinity_repo_verified_count": 7,
  "phase": {
    "raw-fantasy": 3,
    "hypothesis": 336,
    "proposal": 4,
    "experiment": 160,
    "receipt": 82,
    "formula": 86,
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
  "L4b_hash_verified_pct": 1.04,
  "duplicate_index_rows": 0,
  "malformed_index_lines": 0,
  "canon_vectors_pass": true,
  "trinity_repo_verified_count": 7,
  "phase": {
    "raw-fantasy": 3,
    "hypothesis": 336,
    "proposal": 4,
    "experiment": 160,
    "receipt": 82,
    "formula": 86,
    "crystal": 0,
    "compost": 0
  },
  "compost_count": 0
}
```
