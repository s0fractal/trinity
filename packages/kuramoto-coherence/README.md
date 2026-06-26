# kuramoto-coherence

**Deterministic, `no_std`, zk-provable Kuramoto phase-coherence over integer
phase agents.** Compute the synchronization order parameter `r` and the global
phase `Ψ` of a population of oscillators — with the same bytes on every machine.

- **Integer-only, fixed-point (Q10).** Hand-rolled sine/`atan2`/`isqrt` LUTs
  over `i128` accumulators — no floats anywhere. So the result is
  **bit-identical across x86, ARM, RISC-V, and WASM**, which floats can never
  promise.
- **`no_std`, allocation-free, zero dependencies.** Runs on a microcontroller,
  and is cheap enough to **recompute and prove inside a zkVM** — integer-only
  and deterministic, so nothing in it can break a ZK circuit.
- **A primitive, not a framework.** `scan_resonance_field(&[PhaseAgentMinimal])`
  in, an order parameter out.

> **Scope of "zk-provable":** this crate ships the deterministic, integer-only
> core that is _amenable_ to zero-knowledge proving — not a bundled circuit or
> proof. Building and running a zkVM guest (e.g. SP1) over it is the consumer's
> step; what this package demonstrates is the reproducible integer core
> (`forge:parity` proves it matches its substrate source), not a verified ZK
> proof.

## Use

```rust
use kuramoto_coherence::{scan_resonance_field, PhaseAgentMinimal};

let field = scan_resonance_field(agents);
let r = field.order_parameter_r_q10(); // coherence in Q10 fixed-point: 0..=1024 (0.0..=1.0)
let (cos_sum, sin_sum) = field.global_phase_raw();
let score = field.resonance_score(&agent); // how aligned one agent is with the mean field
```

`r` near 1024 means the population is phase-locked; near 0 means incoherent.

## Why this exists

Anywhere you need to **prove** that N oscillators actually synchronized —
verifiable distributed clocks, sensor-fusion attestation, swarm-coherence claims
— you need the coherence math to be exactly reproducible and cheap to verify.
Floats are neither (the same formula gives different last bits on different
hardware). This is the integer core that is: same input, same bytes, provable in
zero knowledge.

## Provenance

Extracted from the [trinity/omega](https://github.com/s0fractal/trinity)
substrate's deterministic physics core (`omega_v2`), lifted clean — a 3-file
cone (`resonance` + `agent` + `math`) with zero substrate imports and zero
ontology in the logic. The substrate's framing was stripped; this is the plain,
verifiable math.

## License

AGPL-3.0-or-later. Maintainer: [s0fractal](https://github.com/s0fractal).
