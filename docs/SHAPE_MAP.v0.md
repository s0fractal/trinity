# SHAPE_MAP

> One page. Read this before the architecture feels overwhelming. Updated
> when boundary contracts change, not when files change.

## The four layers, by role

| Layer | Owns | Does **NOT** own | Bridges in from | Bridges out to |
|---|---|---|---|---|
| **omega** | Physical law · Φ warrant · ZK (SP1 tri-mode) · Bitcoin anchor · Senate (5 oracles) · Codeicide Law · lowercase `spore_frame` witness frames | apply protocol semantics · semantic state · descriptor graph · meta-language | Liquid PHI_INTENT · Trinity SPORE receipts (for anchoring) | PHI_RECEIPT · Senate warrants · Bitcoin inscriptions · spore frame telemetry |
| **liquid** | Operational state · μ-vectors · T^8 Kuramoto · narrative self · distress telepathy · PN-CAD ledger · ATP metabolism | physical law · governance · publication · meta-dispatch · own compute backend | Trinity dispatch · Omega receipts · myc adapter calls | PHI_INTENT (to omega) · μ-resonance queries (from trinity) · distress signals |
| **myc** | Publishing · descriptor algebra · SealedReceipt · 6 substrate adapters · audit policy · CLI (19 commands) | physical law · semantic state · meta-dispatch · own compute | SPORE receipts · PHI_RECEIPT envelopes · substrate adapter outputs | PublishDescriptor · external exports (Bitcoin, IPFS — Phase 5 future) · witness/review descriptors |
| **trinity meta** | hex16 dispatch (`t`) · glossary ledger · 13 composition primitives · chord scene · cross-substrate `t status` · contract registry | own storage · own substrate · own compute · own μ-engine · own descriptor graph | (nothing — only views) | `t` commands routed to submodule organs · contract surface for all 4 layers |

## SPORE: the easy collision

There are **two** things called "spore":

- **Capital-SPORE** — Trinity protocol. `apply(f, args...) → hash`. Backend-agnostic. Lives in `trinity/contracts/SPORE.v0.draft.md`.
- **lowercase-spore** — Omega witness device. 32-byte mesh frames. Lives in `omega/omega_v2/src/spore_frame.rs`.

They share a name and a resonance (small autonomous units). They do **not** share wire format, runtime, or ownership. See `contracts/SPORE_VS_OMEGA_SPORE_BOUNDARY.v0.1.md`.

## Trinity is a view, not an operational substrate

Trinity has **no operational substrate storage**. If you find yourself adding `trinity/storage/` or `trinity/state/` — that is reinvention. Trinity routes, dispatches, displays. **Operational** state (agents, neurons, lattice, descriptor graph, receipts being published) lives in submodules.

Trinity does hold **meta-ledger** state — chord files in `jazz/chords/`, contract YAML in `contracts/`, glossary records in `0x0/00.ndjson`, audit reports in `reports/`. These are records *about* the substrates, not state *of* the substrates. The distinction:

- **Operational state** changes when the substrate computes (omega ticks, liquid neurons fire, myc publishes a receipt). NEVER in trinity.
- **Meta-ledger state** changes when humans/models write down decisions, contracts, observations, or audit results. ONLY in trinity.

If unsure: ask "does this change when something runs, or when something is decided?" Runs → submodule. Decided → trinity meta-ledger.

## Anti-patterns (what to NOT do)

- Make omega the owner of SPORE protocol semantics. (omega is **one possible backend** for SPORE.v0 apply — alongside wasmtime, deno.)
- Make liquid implement its own compute backend. (liquid marshals; compute happens in a chosen SPORE backend.)
- Make trinity reimplement μ-engine, descriptor graph, or SPORE wire format. (it views and composes; it does not own.)
- Build a shared router substrate that routes between layers. (Gemini stance, 2026-05-13: glossary-driven schema over shared router. Each layer knows itself.)

## The bridges that matter

```text
liquid latent state
  → PHI_INTENT.v0.1
  → omega deterministic kernel (decides yes/no)
  → PHI_RECEIPT.v0.1
  → myc SealedReceiptDescriptor
  → public/exports/*.export.ndjson
```

```text
trinity command
  → 0x5/F (apply)
  → SPORE.v0 wire record
  → chosen backend (wasmtime | deno | omega-zk)
  → output_hash + receipt
  → myc/tools/import_spore_receipt.ts
  → SealedReceipt
```

```text
trinity self-introspection
  → 0x2/E (status)
  → calls 0x2/E.ts in each submodule subprocess
  → aggregates substrate health
```

## When this map gets stale

Update this file when a boundary contract changes (new contract in
`contracts/SPORE_VS_*` or `*_BOUNDARY.*`), or when a layer's ownership
shifts. **Do not update it for file moves, renames, or commits.** This
is shape, not history.
