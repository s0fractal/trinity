---
type: "ContractDescriptor"
version: "0.1"
title: "MYC Substrate Receipt — minimum metadata for cross-substrate publication"
status: "active"
---

# MYC_SUBSTRATE_RECEIPT.v0.1

This contract defines the minimum metadata `myc` needs when publishing a receipt
produced by another substrate.

## Fields

```json
{
  "type": "SealedReceiptDescriptor",
  "source_substrate": "omega",
  "source_repo": "https://github.com/s0fractal/genesis.git",
  "source_commit": "git-sha",
  "receipt_kind": "PHI_RECEIPT",
  "canonical_hash": "sha256",
  "input_descriptor_ids": [],
  "output_descriptor_ids": [],
  "verification_command": "deno task fixture:phi",
  "verification_status": "passed"
}
```

## Rules

- `myc` verifies shape, hash, and publication policy.
- `myc` does not re-execute `omega` physics.
- `myc` does not mutate `liquid` state.
- Payload privacy remains controlled by the source substrate.
