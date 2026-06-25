# The forge's catalog

The trinity substrate's most honest output is not its own cosmology — it is the
small set of **pure, transplantable primitives** it has crystallized and shipped
outward. Each one lifts clean (zero substrate imports, zero ontology in the
logic), proven by a transplant test, and is useful to people who never heard of
trinity. The move that produces them is repeatable: _strip the framing, ship the
math._

| primitive                                      | what it is                                                                                                                                      | runtime / registry                           | status   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------- |
| [**autonomy-kernel**](./autonomy-kernel)       | bounded, auditable, revocable authority for AI agents (classify A0–A4, admit fail-closed; Claude Code + MCP gates + a full MCP authority proxy) | TS · `jsr:@s0fractal/autonomy-kernel`        | **live** |
| [**canonical-receipt**](./canonical-receipt)   | deterministic RFC-8949 canonical CBOR + a self-verifying receipt envelope with a multi-party witness chain                                      | TS · `jsr:@s0fractal/canonical-receipt`      | **live** |
| [**kuramoto-coherence**](./kuramoto-coherence) | `no_std`, integer-only, zk-provable Kuramoto phase-coherence (bit-identical x86/ARM/RISC-V/WASM)                                                | Rust · `crates.io/crates/kuramoto-coherence` | **live** |

Each package carries its own README, examples, tests, and a parity/transplant
guard that reds if the copy ever drifts from the substrate source it was lifted
from. Two of the three self-publish on a version bump (GitHub OIDC, no token, no
human); the Rust crate publishes with a crates.io token (the maintainer's).

The catalog is open-ended: where a part of the substrate is genuinely pure and
genuinely useful, it wants to become a package. The provenance and falsifier
discipline is what makes these emissions trustable; the cosmology around them is
the scaffolding that forged them.
