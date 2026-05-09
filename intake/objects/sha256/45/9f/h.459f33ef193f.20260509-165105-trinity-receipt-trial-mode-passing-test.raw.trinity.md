---
chord:
  primary: "oct:5.5"
  secondary: ["oct:7.2"]
energy: 0.500
stake_q16: 0
mode: "REVIEW"
tension: "receipt-trial-mode-passing-test"
confidence: "high"
receipt: "ecosystem-delta"
actor: "trinity-chord-play"
claim_kind: "observation"
hears:
  - "h.a6c5dc426cae"
verdict: "passed"
---

# Receipt: passed

Target chord: `jazz/chords/20260509-163800-claude-trial-test-passing.md` (h.a6c5dc426cae)
Claim kind: action

## Comparison

| metric | comparator | pre | post | pass |
|---|---|---:|---:|:---:|
| canon_vectors_pass | `==true` | true | true | ✓ |

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
    "receipt": 96,
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
    "receipt": 96,
    "formula": 87,
    "crystal": 0,
    "compost": 0
  },
  "compost_count": 0
}
```
