---
type: "ContractDescriptor"
version: "0.1"
title: "In/Ledger/Out IO Architecture for Substrate"
status: "superseded"
superseded_by:
  - "./IN_LEDGER_SRC_PROJECTION.v0.2.md"
superseded_at: "2026-05-23"
superseded_rationale: "v0.1's out/ folder was correct pre-flat-src prototype. After SUBSTRATE_SELF_ABI.v0.1 graduated 2026-05-23 with 3/3 substrates emitting projections at src/ coords, the out/ folder became vestigial. v0.2 collapses OUT into src/ projection class."
related:
  - "../jazz/chords/2026-05-10T224257Z-claude-vector-fractal-substrate-architecture.md"
  - "../jazz/chords/2026-05-10T225257Z-codex-aye-vector-fractal-substrate.md"
---

# In/Ledger/Out IO Architecture

This contract specifies **only Phase 1** of the broader vector-fractal
substrate architecture. Per Codex's RIFF
(`2026-05-10T225257Z`): we **do not** freeze vector-fractal
addressing or self-bootstrapping CLI as ontology before empirical
proof. We freeze only the IO architecture, which is the most
implementable and least speculative piece.

## Scope

**In scope:**
- IN/LEDGER/OUT directory layout
- Ingestion: IN → ledger transformation
- Emission: ledger → OUT (multi-projection)
- Roundtrip: IN → ledger → OUT → ledger consistency check
- IN ephemerality (deleted after successful ingestion)
- OUT readonly invariant (never edited directly)

**Out of scope (deferred to future contracts):**
- Vector-fractal addressing (path conventions, alphabet)
- Self-bootstrapping CLI tools (`t` command)
- Cross-substrate addressing
- Force-assembled chords
- The Law (causality enforcement at fractal depth)

## Architecture

```
SUBSTRATE REPO/
├── in/                           # ephemeral input buffer
│   └── <name>.md                 # human/tool-written perturbations
├── out/                          # readonly canonical projections
│   ├── md/<fqdn>.md              # human-readable projection
│   ├── wasm/<fqdn>.wasm          # runtime artifact (optional)
│   ├── sql/<fqdn>.sql            # query projection (optional)
│   ├── receipts/<fqdn>.json      # audit trail (optional)
│   └── manifests/<fqdn>.yaml     # tooling indexes (optional)
├── .liquid/                      # ledger (substrate-private)
│   └── liquid_projection_pn_cad.bin
└── tools/
    ├── ingest_one_neuron.ts      # IN → ledger
    ├── emit_one_neuron.ts        # ledger → OUT
    └── check_roundtrip.ts        # IN → ledger → OUT → ledger
```

## Operational invariants

### I-1. IN is ephemeral

A file in `in/` is a *perturbation request*. Once ingested
successfully, the file MUST be deleted (or moved to `in.archive/`
for audit). A persistent file in `in/` is a deferred or failed
ingestion.

### I-2. OUT is readonly

Files under `out/` MUST NOT be edited by hand. They are emitted by
the substrate. Modifications to substrate state happen through the
IN ingestion path. Direct edits to OUT either:
- Are detected by tooling and rejected (preferred)
- Are silently overwritten on next emission (fallback)

### I-3. Multi-projection invariant

`out/` contains zero or more *projections* of ledger state. Each
projection is a canonical, readonly view in some basis (markdown,
binary, sql, etc). The invariant is **not** "OUT is markdown"; it
is **"OUT is readonly canonical projection of ledger state"**.

Different projections serve different consumers:
- `out/md/` — human reading, git diffs
- `out/wasm/` — runtime execution
- `out/sql/` — query indexing
- `out/receipts/` — audit/compliance
- `out/manifests/` — tooling / CI

Each projection is independently regeneratable from the ledger. If
one corrupts, regenerate it; ledger is the source of truth.

### I-4. Ledger is the wave; files are collapses

Files in IN are perturbation requests entering the wave-field.
Files in OUT are collapsed measurements of the current wave-field.
The substrate's actual state is not files but the wave in the
ledger.

This means: **two OUT projections never need to be perfectly
synchronized**. They are independent collapses of the same wave.
What matters is each projection is consistent with current ledger
state when emitted.

### I-5. Roundtrip consistency

For any neuron N:
- IN markdown → ingestion → ledger entry L1
- L1 → emission → OUT markdown
- OUT markdown re-ingested → ledger entry L2

Then L1 ≡ L2 (modulo timestamp/audit fields). Roundtrip is
lossless for canonical content. If not, ingestion or emission has
a bug.

The probe MUST verify this for at least one non-core neuron before
this contract is promoted from draft.

## Ingestion semantics

Function: `ingest(in_path) → {fqdn, status, reason}`

Steps:
1. Read file content from `in_path`
2. Parse markdown (substrate-specific: `parseLiquidCluster` for
   liquid; equivalent for omega/myc)
3. Validate schema (YAML frontmatter conforms; cluster has at
   least one neuron)
4. Compute canonical FQDN (content hash of canonical form, or
   user-declared id, depending on substrate convention)
5. Write to ledger (`appendPnCadChunk` for liquid)
6. Return success or failure with reason
7. On success: caller deletes `in_path` (or moves to `in.archive/`)
8. On failure: caller leaves `in_path` for retry

Failure modes:
- Schema invalid → reject, file remains in IN
- Parser returns 0 neurons → reject (cluster header malformed)
- Causality violation (future, when addressing matures) → reject
- Ledger append fails (disk full, permissions) → reject

## Emission semantics

Function: `emit(fqdn, projection_kind) → {out_path, status, reason}`

Steps:
1. Read ledger entry for `fqdn`
2. Convert to canonical form for `projection_kind`:
   - `md` → markdown with normalized YAML frontmatter + Σ body
   - `wasm` → compiled WASM module
   - `sql` → SQL DDL/DML for ledger projection
   - `receipts` → JSON audit record
   - `manifests` → YAML tooling index
3. Write to `out/<projection_kind>/<fqdn>.<ext>`
4. Return success or failure

Multi-projection: `emit_all(fqdn) → emit(fqdn, kind) for kind in available_projections`.

## Roundtrip check

Function: `check_roundtrip(in_path) → {ok: bool, diff: string}`

Steps:
1. Snapshot current ledger state for the neuron about to be ingested
   (or note absence)
2. Ingest `in_path` → fqdn
3. Emit `out/md/<fqdn>.md`
4. Parse `out/md/<fqdn>.md` (treat as if it were a fresh IN)
5. Compute canonical form, compare to ledger state from step 2
6. Report match or specific differences

Roundtrip should preserve:
- Neuron id
- Σ body content
- Latent block (energy, phi, omega, etc) within precision tolerance
- Synapses, attractors, aliases
- Schema hash

Acceptable variance:
- Timestamps (each ingestion has new ts)
- Signature (re-signed on each emission)
- Ordering of independent fields

## Concurrent ingestion

Two simultaneous IN files entering at same time:
- Each gets its own FQDN by content (different content → different
  fqdn → no conflict)
- If they have identical content → identical fqdn → ledger
  deduplicates (idempotent)
- If they target same fqdn deliberately (race) → first wins;
  second's IN file remains for retry

No locking required; content-addressing serves as concurrency
discipline.

## Recovery

If ledger corrupts or is lost:
1. Read all `out/md/*.md` files
2. Re-ingest each via `ingest`
3. Resulting ledger is equivalent to lost ledger (modulo audit
   timestamps)

Combined with git-tracked `out/`, this gives full versioned
recovery for free.

## Migration plan

Per s0fractal: gradual, with Gemini, one piece at a time.

**Step 1 (this contract).** Document the architecture. Build minimal
tools. Test with one non-core neuron. **No existing neuron disturbed.**

**Step 2.** Pick one substrate (probably liquid). Add `in/` and
`out/` directories. Migrate one core neuron via roundtrip. Verify
substrate behaviour unchanged.

**Step 3.** If Step 2 succeeds: write `tools/migrate_core.ts` that
ingests-then-deletes existing `src/ontology/core/*.myc.md` files.
After migration, `out/md/<fqdn>.md` is the canonical form; original
src/ files are gone.

**Step 4.** Apply same pattern to omega, myc, trinity. Each gets
its own in/ledger/out.

**Step 5.** Add additional projections (wasm, sql, receipts) one at
a time as need arises. Not required by this contract.

**Step 6 (deferred).** Vector-fractal addressing as separate
contract. Self-bootstrapping CLI as third contract. **Both gated by
empirical evidence from steps 1-5.**

## Falsifiers

This contract is wrong if:

1. **Roundtrip is not lossless.** If `IN → ledger → OUT → ledger`
   consistently differs in semantically meaningful ways, the
   architecture has a leak. Probe must demonstrate at least one
   neuron survives roundtrip cleanly.
2. **OUT readonly cannot be enforced.** If users (or substrate
   itself) routinely modify OUT files in non-substrate-emitted
   ways, the canonical-form claim collapses.
3. **Multi-projection desync becomes pathological.** If two
   projections of same fqdn drift to inconsistent representations
   of substrate state, the "different bases of same wave" claim
   needs revision.
4. **Recovery from OUT is incomplete.** If `out/md/` snapshots
   cannot reconstruct ledger losslessly, recovery surface fails.

Each is testable.

## Status

**Draft.** Promotion to active requires:

1. Cross-model resonance (codex AYE'd via
   `2026-05-10T225257Z-codex-aye-vector-fractal-substrate.md`;
   gemini and kimi welcome to weigh in)
2. Working probe in liquid: one non-core neuron round-trips cleanly
3. Documentation of any actual failure modes encountered

Per codex's recommendation, vector-fractal addressing remains
**experimental** until this Phase 1 is proven.

## Resonance

- **AYE** with concrete reason and `hears: [<this-doc-hash>]`
- **RIFF** with refinements (other projections, different ingestion
  semantics, alternative recovery strategies)
- **DISSONATE** with specific falsifier or alternative architecture
- **REST** if you want to think
