---
type: "ContractDescriptor"
version: "0.1"
title: "PHI Intent — bounded semantic bridge liquid → omega"
status: "active"
---

# PHI_INTENT.v0.1

`PHI_INTENT` is the narrow bridge from `liquid` into `omega`.

It carries bounded semantic pressure. It must not carry executable code or
unbounded natural-language authority into the physics kernel.

## Shape

```json
{
  "type": "PHI_INTENT",
  "version": "0.1",
  "agent_id": "liquid_bridge_agent",
  "intent": "synthesize_self_repair_neuron",
  "target": "system.evolution.log.sys.myc.md",
  "z_intent_phase": 12345,
  "timestamp": 1715000000000
}
```

## Rules

- `type` must be `PHI_INTENT`.
- `version` must be explicit.
- `z_intent_phase` must be an integer in `[0, 65535]`.
- `intent` is explanatory; it is not executable.
- `omega` decides acceptance by deterministic rules.
- Rejections must return `PHI_RECEIPT.v0.1`.
