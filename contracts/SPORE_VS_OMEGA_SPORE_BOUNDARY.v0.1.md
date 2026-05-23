---
type: "ContractDescriptor"
version: "0.1"
title: "SPORE protocol vs Omega spore lineage: boundary"
status: "draft"
hears:
  - "./SPORE.v0.draft.md"
  - "./SPORE_BOOTSTRAP_PIN.v0.md"
  - "./SPORE_FUEL.v1.draft.md"
  - "../omega/omega_v2/src/spore_frame.rs"
  - "../omega/omega_v2/src/spore_runner.rs"
  - "../omega/omega_spore/"
  - "../liquid/00_core/pipe/spore_apply_backend.ts"
related:
  - "../jazz/chords/2026-05-14T154732Z-codex-aye-spore-protocol-vs-omega-spore-boundary.md"
  - "../reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md"
---

# SPORE protocol vs Omega spore lineage: boundary

## Status

**DRAFT.** Codifies a categorical distinction that previously lived only in
chord-thread (`2026-05-14T154732Z-codex-aye-...`). Required because the
2026-05-14 deep analysis report conflated the two, and a verifier-level mistake
is evidence the boundary is not yet legible from the codebase alone.

## The Two Spores

Two artifacts share the substring `spore` and are sometimes both called "spore"
in chord text. They are **distinct categories**.

### Capital-SPORE (Trinity protocol)

Pinned content-addressed deterministic apply protocol. Lives under
`trinity/contracts/SPORE.v0.draft.md` and `SPORE_BOOTSTRAP_PIN.v0.md`.

```text
apply(mutator_hash, input_hashes...) -> output_hash / spore_id / receipt
```

- **Owner:** Trinity contracts.
- **Wire format:** `SPORE.v0` 32-byte header (magic `SPOR`, kind=`apply`, argc,
  multihash entries).
- **Bootstrap:** `SPORE_BOOTSTRAP_PIN.v0` (51 pinned files, Bitcoin
  OpenTimestamps attestation).
- **Runtime:** **backend-agnostic.** wasmtime, deno V8, native, or future Omega
  proof backend — all valid implementations. None is the protocol owner.
- **Concern:** byte-to-byte deterministic mutation, identity by hash,
  cross-substrate verifiable receipts.

### Lowercase-spore (Omega device lineage)

A no_std microcontroller / mesh transport substrate. Lives under
`omega/omega_v2/src/spore_frame.rs`, `spore_runner.rs`, `spore_routing.rs`, and
the `omega/omega_spore/` firmware crate.

```text
[u8; 32] frame over UART/SPI/BLE
  magic = 0x4F46 ('OF'), frame_type ∈ {1..6}, FNV-1a CRC at offset 28
```

- **Owner:** Omega.
- **Wire format:** Omega 32-byte SporeFrame (DIFFERENT layout from SPORE.v0).
- **Runtime:** bare-metal, no allocator, ring-buffer DMA.
- **Concern:** physical mesh telemetry, warrant votes, halo state, heartbeats,
  snapshot digests, composite health, post-mortem quorum.

## Why both names contain "spore"

Both are spore-like in the **resonance** sense — small autonomous units that
carry/witness change. But that resonance is **semantic**, not structural. The
wire bytes do not match. The execution model does not match. The ownership does
not match.

## Allowed Bridges

| Bridge                                                     | Direction       | Use                                                                                                       |
| ---------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| Omega spore frame **carries** a SPORE.v0 receipt hash      | Omega → Trinity | A mesh device witnesses a SPORE receipt was anchored. The frame payload carries the receipt's `spore_id`. |
| Omega ZK guest **proves** SPORE.v0 apply was deterministic | Omega → Trinity | Future Omega proof backend can be one implementation of SPORE.v0 apply, alongside wasmtime/deno.          |
| SPORE.v0 receipt **anchored by** Omega Φ-chain             | Trinity → Omega | A receipt's `bitcoin_anchor` field references Omega's φ-anchor chain.                                     |

## Forbidden Crossings

- Renaming `spore_frame.rs` to claim it implements SPORE.v0 wire format.
- Exporting `v2_spore_apply` from `omega_v2_core.wasm` as **the canonical**
  SPORE owner (it may be **one backend** among several).
- Moving `SPORE.v0.draft.md` into `omega/` (it remains Trinity-level shared
  protocol).
- Deleting Omega `spore_*` modules because of name collision (they are real
  device/telemetry substrate work).
- Liquid's bridge emitting `simulated_spore_receipt` without an explicit
  `simulation: true` marker (see also `spore_apply_backend.ts`).

## Implementation Roles

| Role                        | Layer                      | Concrete file                                                         |
| --------------------------- | -------------------------- | --------------------------------------------------------------------- |
| SPORE protocol semantics    | Trinity                    | `contracts/SPORE.v0.draft.md`                                         |
| SPORE wire format           | Trinity                    | `probes/spore-apply-v0/SPEC.md`                                       |
| SPORE bootstrap pin         | Trinity                    | `contracts/SPORE_BOOTSTRAP_PIN.v0.md`                                 |
| SPORE backend (one of many) | wasmtime / deno / omega-zk | `probes/spore-execute-v0/`, future `probes/spore-runtime-adapter-v0/` |
| SPORE marshaller            | Liquid                     | `liquid/00_core/pipe/spore_apply_backend.ts`                          |
| SPORE command surface       | Trinity                    | `0x5/F.ts` (`t apply`)                                                |
| SPORE receipt publication   | Myc                        | `myc/tools/import_spore_receipt.ts`                                   |
| Omega witness frames        | Omega                      | `omega/omega_v2/src/spore_frame.rs`                                   |
| Omega witness runtime       | Omega                      | `omega/omega_v2/src/spore_runner.rs`                                  |
| Omega witness firmware      | Omega                      | `omega/omega_spore/`                                                  |

## Falsifiers

- If Omega's `spore_frame`/`SporeRunner` can parse and execute canonical
  `SPORE.v0` apply records byte-for-byte, the two lineages may be unified under
  one adapter. **Current evidence: they cannot.** Different magic, different
  fields, different execution model.
- If a `SPORE.v0` apply implementation needs Omega physical lattice state or
  Senate warrant for pure byte-to-byte mutation, the apply boundary is
  overcoupled and this contract is wrong.
- If a mutation affects Omega physical invariants (q-phase law, mitosis, Genesis
  identity, mesh admission, Senate-governed state), routing it through SPORE
  alone is a boundary violation; it needs Φ-warrant.

## How to read this contract

`./t contracts show SPORE_VS_OMEGA_SPORE_BOUNDARY` should surface this without
forcing a reader to scan chord history. Until that organ exists, read this file
before reading either `SPORE.v0.draft.md` or any `omega/.../spore*.rs`.
