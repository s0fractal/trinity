---
type: "ContractDescriptor"
version: "0.0"
title: "X9 Substrate Namespace Shadow Integration"
status: "draft"
implementation_status: "prototype"
related:
  - "../jazz/chords/x4D00_950812_antigravity_propose-myc-to-x9000-flat-migration.md"
  - "../jazz/chords/x4D00_950812_codex_response-myc-x9000-hard-tweak.md"
implemented_claims:
  - "myc_x9_shadow_status"
---

# X9 Substrate Namespace Shadow Integration v0.0

## Claim

`x9...` is reserved as a shadow/import namespace for external substrates inside
Trinity `src/`. It is not permission to dissolve a submodule by copy-paste.

The first implemented probes are MYC status, capabilities, and protocol audit:

```text
myc/src/x2E00_status.ts
  -> src/x92E0_myc_status.ts
myc/src/x4A00_capabilities.ts
  -> src/x94A0_myc_capabilities.ts
myc/src/x6C00_protocol_audit.ts
  -> src/x96C0_myc_protocol_audit.ts
```

The `9` prefix means "imported substrate namespace". The second coordinate digit
preserves the native substrate axis (`2/E` status remains `x9 2 E 0`).

## Rules

- x9 organs MUST be adapters, projections, or receipts over an external
  substrate, not duplicated ownership.
- x9 organs MUST preserve a live reference to their source substrate path.
- x9 organs MUST expose replayable evidence before any source movement is
  proposed.
- Direct submodule dissolution is allowed only after shadow parity proves that
  commands, receipts, contracts, and generated projections survive fresh clone
  execution.

## Current Prototype

- `src/x92E0_myc_status.ts` executes `myc/src/x2E00_status.ts` and wraps the
  result as a Trinity-dispatchable shadow status receipt.
- `src/x94A0_myc_capabilities.ts` executes `myc/src/x4A00_capabilities.ts` and
  wraps the result as a Trinity-dispatchable shadow capabilities receipt.
- `src/x96C0_myc_protocol_audit.ts` executes
  `myc/src/x6C00_protocol_audit.ts myc` and wraps the result as a
  Trinity-dispatchable shadow protocol audit receipt.
- `./t myc-status-shadow`, `./t myc-capabilities-shadow`, and
  `./t myc-protocol-audit-shadow` are the public command handles.
- `./t evidence --strict` includes the probe as a prototype claim.

## Falsifiers

- `./t myc-status-shadow` cannot run from a fresh recursive checkout.
- `./t myc-capabilities-shadow` cannot reflect MYC capabilities from a fresh
  recursive checkout.
- `./t myc-protocol-audit-shadow` cannot run MYC protocol audit against the MYC
  root from a fresh recursive checkout.
- The x9 adapter diverges from native MYC status without explicitly reporting
  the divergence.
- x9 becomes a dump bucket for copied files instead of a narrow bridge with
  source-path provenance.
- Any proposal deletes `myc/` before parity for status, capabilities, protocol
  audit, import receipts, and generated projections exists.
