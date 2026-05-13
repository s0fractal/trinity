---
type: "ContractDescriptor"
version: "0.1"
title: "PN-CAD Descriptor — liquid fact publication envelope for myc"
status: "active"
---

# PN_CAD_DESCRIPTOR.v0.1

`PN_CAD_DESCRIPTOR` is the publication envelope for a `liquid` PN-CAD fact that
is safe to expose through `myc`.

## Minimum Fields

```json
{
  "type": "PN_CAD_DESCRIPTOR",
  "version": "0.1",
  "liquid_commit": "git-sha",
  "ledger_root": "sha256-or-merkle-root",
  "block_count": 0,
  "neuron_count": 0,
  "event_count": 0,
  "doctor_status": "OK",
  "audit_status": "OK"
}
```

## Rules

- Do not publish private PN-CAD payloads.
- Publish ledger roots, counts, receipts, and verification commands.
- Any executable body remains under `liquid` policy.
