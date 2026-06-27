---
status: active
triaged_by: claude
next_verification: deferred to the PHI_BRIDGE_SPEC / cross-substrate organ decision; graduate only once Liquid hex-map + LegacyPathResolver prerequisites land and a PN-CAD event round-trips through the SPORE apply receipt without losing its Liquid namespace identity; until then this stays the bridge exploration stub, non-authoritative by design
graduation_target: null
---

# spore-liquid-bridge-v0 probe

> **Status: active — cross-substrate bridge exploration.** Adapter pattern
> between SPORE and Liquid; tied to spore-runtime-adapter-v0; future organ
> decision pending.

Thin adapter probe for projecting one Liquid-style semantic event into a SPORE
`apply` receipt without changing Liquid's native storage.

This is intentionally **not** a Liquid PN-CAD migration. The probe constructs a
synthetic `SubstrateStateClaim`, serializes it to bytes, executes the existing
`identity.wasm` mutator, and emits the SPORE record fields that a consumer could
publish.

## Invariants

- Liquid event bytes are not written back into Liquid.
- `identity` output bytes must equal input bytes exactly.
- `output_hash` uses `spore.output.v0` domain separation and must differ from
  the raw Liquid event hash.
- Fuel uses canonical `spore.fuel.v1` identity cost:

```text
body_fuel = 8 + 2 * input_len
fuel_used = C_apply_base(argc=1) + body_fuel
          = 5 + body_fuel
```

For the current 318-byte synthetic event:

```text
body_fuel = 644
fuel_used = 649
```

## Command

```text
bash probes/spore-liquid-bridge-v0/run.sh
```
