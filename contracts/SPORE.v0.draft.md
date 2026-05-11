---
type: "ContractDescriptor"
version: "0.2"
title: "Spore: apply as the only protocol primitive"
status: "draft"
related:
  - "../jazz/chords/2026-05-11T000847Z-codex-recipe-as-spore-ledger-native-mutators.md"
  - "../jazz/chords/2026-05-11T003413Z-codex-functional-core-lut-foundation.md"
  - "../jazz/chords/2026-05-11T004444Z-claude-aye-riff-spore-functional-core-engineering-review.md"
  - "../jazz/chords/2026-05-11T010730Z-claude-addendum-apply-as-only-primitive.md"
  - "../jazz/chords/2026-05-11T011015Z-gemini-apply-thermodynamics.md"
  - "../jazz/chords/2026-05-11T012156Z-claude-receipt-spore-apply-probe-green.md"
  - "../jazz/chords/2026-05-11T013137Z-claude-receipt-spore-r1-codex-review-accepted.md"
  - "../jazz/chords/2026-05-11T013800Z-gemini-receipt-spore-apply-python-third-impl.md"
  - "../jazz/chords/2026-05-11T013914Z-claude-receipt-spore-v0.1-three-way-green.md"
  - "../jazz/chords/2026-05-11T014918Z-claude-receipt-spore-execute-probe-green.md"
  - "../jazz/chords/2026-05-11T015443Z-claude-receipt-execute-probe-extended-three-mutators.md"
  - "../jazz/chords/2026-05-11T015740Z-claude-receipt-atp-probe-wasmtime-fuel-deterministic.md"
  - "../jazz/chords/2026-05-11T020051Z-claude-receipt-trap-behavior-probe-green.md"
  - "../jazz/chords/2026-05-11T020608Z-codex-spore-v1-runtime-decisions.md"
  - "../jazz/chords/2026-05-11T020735Z-gemini-receipt-codex-spore-v1-runtime-decisions.md"
  - "../jazz/chords/2026-05-11T021226Z-claude-aye-codex-gemini-runtime-decisions-applied.md"
  - "./SPORE_FUEL.v1.draft.md"
  - "../probes/spore-apply-v0/"
  - "../probes/spore-execute-v0/"
---

# Spore — `apply` as the only protocol primitive

## Status

**DRAFT.** This contract consolidates three independent voices
(claude, codex, gemini) that converged on a single-primitive
content-addressed compute protocol.

Three status markers are used:

- **[DRAFT-PROVEN]** — verified empirically by the 9-case probe matrix
  in `probes/spore-apply-v0/` across two independent implementations.
  Wire-level behavior is grounded; semantic/runtime behavior is not.
- **[DRAFT-SPECIFIED]** — written down precisely, internally
  consistent, but not yet probe-verified. Downstream code may
  reference but should not depend on it for cryptographic guarantees.
- **[OPEN]** — agreed in principle, slot reserved, format not yet
  fixed. Downstream code must not rely on it at all.

**Wire format is now 3-way DRAFT-PROVEN** across rust 1.94, deno 2.7,
and python 3.14 over the full 9-case probe matrix. Three
implementations across distinct paradigms (compiled systems / JIT
dynamic / interpreted scripting) cannot share a structural blind
spot.

Elevation to `status: active` (v1.0) requires:

1. ✅ Three-implementation agreement on the full probe matrix
   (rust + ts + python — done as of 2026-05-11).
2. ✅ Mutator execution probe demonstrating cross-runtime deterministic
   evaluation for at least one inscribed basis mutator (identity, rust
   wasmtime ↔ deno V8 — done as of 2026-05-11).
3. ✅ Mutator execution probe extended to arithmetic / control flow
   (identity + xor_5c + sum_bytes — done as of 2026-05-11).
4. ✅ Trap-behavior probe — div by zero, OOB memory, unreachable —
   trap signals identical across runtimes (done as of 2026-05-11).
5. ✅ Three-voice runtime-decision consensus (codex + gemini + claude)
   on canonical fuel direction, trap semantics, bulk-memory metering,
   memory.grow ban (done as of 2026-05-11 — see chord
   `2026-05-11T020608Z` and gemini receipt `2026-05-11T020735Z`).
6. 🟡 ATP accounting probe (single-runtime wasmtime fuel verified;
   cross-runtime still open — done partial as of 2026-05-11).
7. ⏳ `spore.fuel.v1` canonical table written and probed in at least
   two runtimes (wasmer + wasmtime, or wasmtime + software-meter
   over V8).
8. ⏳ Bootstrap pinning mechanism in force (see I-2).
9. ⏳ Negative-determinism probe — feed mutators with f32/f64 or
   SIMD to both runtimes; verify both reject at instantiation
   (per the v0 consensus subset).

## Scope

**In scope:**

- The single protocol primitive `apply(f_hash, ...arg_hashes) → output_hash`.
- Wire format for an `apply` record.
- Multihash envelope and domain-separated hashing.
- Three-tier mutator taxonomy (protocol / basis / domain).
- ATP/gas accounting at the apply boundary.
- Error receipt and `expect` semantics.
- Effect capsule shape with `depends_on` manifest.

**Out of scope (deferred):**

- Concrete mutator implementations (WASM bytecode bodies).
- Full Merkle structure of ledger state (separate contract).
- Network propagation / spore distribution protocol.
- Capability semantics in detail (slot reserved but not specified).
- Signature schemes (slot reserved but not specified).

## Three-tier taxonomy

Per codex's AYE response:

```text
protocol primitive  = apply              (this contract)
basis mutators      = identity / compose / map / fold / concat / ...
                      (inscribed early, hash-addressed, immutable)
domain mutators     = ingest / emit / q10_tick / hydrate / ...
                      (substrate-specific, evolve continuously)
```

Eviction discipline:

- The **protocol** changes on the order of decades; any change is a
  new protocol version with a new magic byte.
- **Basis mutators** are inscribed once. New versions get new hashes
  and coexist; old recipes referencing old hashes keep working
  forever.
- **Domain mutators** are free to evolve continuously, each producing
  a new hash with each change.

## The `apply` primitive

```text
apply(f_hash, arg_hash_0, arg_hash_1, ..., arg_hash_{N-1}) → output_hash
```

Semantics:

1. `f_hash` resolves to bytes of a mutator (basis or domain).
2. Each `arg_hash_i` resolves to bytes of an input artifact.
3. The runtime executes the mutator deterministically over the
   resolved arguments.
4. The output bytes are hashed (under the appropriate domain) to
   produce `output_hash`.
5. The hash of the encoded `apply` record (not its output) is the
   `spore_id` — a stable identifier for this transition.

The protocol does not distinguish between basis and domain mutators
at the apply boundary. Both flow through the same primitive.

## Wire format **[DRAFT-PROVEN]**

Verified byte-identical across rust 1.94 (`blake3` crate) and deno 2.7
(`@noble/hashes/blake3`) in `probes/spore-apply-v0/` across **9 test
cases** covering: argc ∈ {0, 1, 2, 3}, `HAS_EXPECT` alone,
`HAS_DEPENDS` alone, `HAS_EXPECT | HAS_DEPENDS` combined, mixed
multihash algo tags (BLAKE3-256 + SHA-256 in same record), and a
reserved-flag-set negative case that both implementations reject
identically.

```text
offset  size  field        value
─────── ────  ───────────  ─────────────────────────────────
0       4     magic        "SPOR"  (0x53 0x50 0x4F 0x52)
4       1     version      0x00
5       1     kind         0x01 (= apply)
6       2     flags        big-endian u16, bitfield (see below)
8       1     argc         N, number of args after f_hash
9       ...   fields       (1 + argc) multihash entries
```

Each multihash entry:

```text
offset  size  field        value
─────── ────  ───────────  ─────────────────────────────────
0       1     algo_tag     see multihash registry below
1       1     length       L, length of digest bytes
2       L     digest       raw digest bytes
```

Field order for `kind = 0x01`:

```text
field[0]           = f_hash
field[1..1+argc]   = arg_hashes[0..argc-1]
```

Total size for `argc = N` with all BLAKE3-256: `9 + (1+N) × 34` bytes.

Flags bitfield (big-endian u16):

```text
0x0001  HAS_EXPECT       expect_hash multihash, appended after args
0x0002  HAS_CAPS         caps_hash multihash, appended after expect
0x0004  HAS_SIG          trailing signature block (not a multihash)
0x0008  HAS_DEPENDS      depends_on_manifest_hash multihash, appended last
0x0010..0x8000          reserved, MUST be zero; any reserved bit set
                        causes the record to be rejected
```

If a non-reserved flag bit is set, its associated multihash appears
in the fields section in the order: EXPECT, CAPS, DEPENDS (HAS_SIG
is a trailing signature block, addressed in §sig below).

Reserved-flag rejection is a contract-level invariant, not a runtime
convention. Implementations that silently accept reserved bits are in
violation. The 9-case probe verifies that both rust and ts reject
the same reserved-bit case (`flags = 0x0010`) with the same reason
string `reserved_flag_set`.

## Multihash registry **[DRAFT-PROVEN, extensible]**

```text
algo_tag  algorithm        digest size  notes
────────  ───────────────  ───────────  ─────────────────────
0x12      SHA-256          32           reserved for omega-bridge interop
0x1d      BLAKE2b-256      32           reserved
0x1e      BLAKE3-256       32           default for spore.v0
```

Implementations MUST reject unknown `algo_tag` values rather than
guess. New tags are added by spec amendment.

**Critical asymmetry:** `algo_tag` values 0x12 (SHA-256), 0x1d
(BLAKE2b-256) MAY appear inside multihash fields, but the **wrapper
hash** (`spore_id`) is **always** computed with BLAKE3 `derive_key`
in v0. There is no SHA-256 spore_id in v0. A v0 implementation that
computes `spore_id` with anything other than BLAKE3 derive_key is in
violation, even if all internal fields are SHA-256.

This asymmetry exists because:

1. BLAKE3 `derive_key` gives native domain separation; SHA-256 does
   not. Mixing wrapper algorithms with the same record bytes would
   produce two spore_ids for one logical record — alias hell.
2. The wrapper choice is a protocol-level commitment; the field
   choice is a domain-level affordance for interop with omega's
   existing SHA-256 inscriptions.

## Domain separation **[DRAFT-PROVEN]**

All hashes are domain-separated via BLAKE3 `derive_key`:

```text
hash = BLAKE3.derive_key(context_string, payload_bytes)
```

For SHA-256 fallback, equivalent domain separation:

```text
hash = SHA-256(domain_prefix(64 bytes) || payload_bytes)
where domain_prefix = pad to 64 bytes with 0x00 the ASCII context_string
```

Context strings registry:

```text
context_string         used for
─────────────────────  ─────────────────────────────────────
spore.apply.v0         spore_id of an apply record
spore.effect.v0        spore_id of an effect record
spore.receipt.v0       spore_id of a receipt record
spore.mutator.v0       hash of a mutator's bytes
spore.lut.v0           hash of a basis LUT
spore.state.v0         hash of a ledger state Merkle root
spore.output.v0        hash of a mutator's output bytes
```

Context strings are ASCII, no trailing newline, no null byte, no
trailing whitespace.

## `spore_id` and signature **[DRAFT-PROVEN for unsigned; signature DRAFT-SPECIFIED]**

```text
spore_id = BLAKE3.derive_key("spore.apply.v0", record_bytes_without_sig)
```

The `spore_id` is content-addressed: two encodings of the same logical
record produce the same `spore_id` only if the encoding is canonical
(positional, no field name strings on the wire, fixed sizes per the
registry). The wire format above is canonical by construction; there
is no alternative encoding for the same record.

**Signature contract:** when `HAS_SIG` is set in a future revision,
the signature signs the **`spore_id`**, not the raw record bytes:

```text
sig_payload = spore_id           (32 bytes, BLAKE3 derive_key output)
sig         = Sign(privkey, sig_payload)
```

Rationale (chosen over signing record_bytes):

- Verifiers need only the `spore_id` to verify, not the exact byte
  layout. They re-derive `spore_id` from the record fields and check
  the signature.
- The trailing signature block does not affect `spore_id`. Re-signing
  with a different key produces a new sig but the same `spore_id` —
  this is desirable (multi-party endorsement of the same transition).
- Avoids ambiguity if record padding or framing changes in transport.

HAS_SIG is **not** active in v0; its bit is reserved for the future
sig block. The 9-case probe does not exercise HAS_SIG.

## Mutator runtime **[DRAFT-PROVEN for basic integer WASM subset, OPEN otherwise]**

Verified empirically in `probes/spore-execute-v0/` across three
distinct mutators that together exercise a broad WASM surface:

| mutator     | size (B) | WASM features exercised                                       |
|-------------|---------:|---------------------------------------------------------------|
| `identity`  | 102      | `memory.copy`                                                 |
| `xor_5c`    | 156      | `loop` / `block` / `br_if`, `i32.xor`, `i32.load8_u`, `i32.store8`, `i32.add`, `i32.ge_u` |
| `sum_bytes` | 161      | all of the above + `i32.add` accumulator + `i32.store` (4-byte) + variable output length |

All three mutators run byte-identically across rust 1.94 +
`wasmtime 26` (Cranelift JIT) and deno 2.7 + V8 built-in
WebAssembly (TurboFan JIT). `mutator_hash`, `output_bytes`, and
`output_hash` all match for all three.

Pre-recommendation for the broader runtime contract (not yet probed
for non-identity mutators):

- The mutator runtime is **integer-only WASM** in strict deterministic
  mode (no `f32`/`f64` operations, no SIMD non-determinism, no
  threads, no atomic instructions with observable contention).
- The bootstrap evaluator implements one function:

  ```text
  fn apply(f_hash, args[]) -> output_hash {
      let f_bytes  = resolve(f_hash);
      let arg_byts = args.map(resolve);
      let result   = wasm_run_deterministic(f_bytes, arg_byts);
      BLAKE3.derive_key("spore.output.v0", result)
  }
  ```

- `resolve` checks local content store, then P2P/MYC fallbacks.
  Unresolvable hashes fail with an error receipt; they do not silently
  no-op.

### Calling convention (DRAFT-PROVEN for identity)

```text
WASM module exports:
  memory           linear memory, at least 1 page (64 KiB)
  apply            (in_ptr i32, in_len i32, out_ptr i32) -> out_len i32
```

- Host writes `in_len` bytes to `memory[in_ptr..in_ptr+in_len]`.
- Host calls `apply(in_ptr, in_len, out_ptr)`.
- Module writes some bytes to `memory[out_ptr..out_ptr+out_len]`.
- Host reads `out_len` bytes from `memory[out_ptr..out_ptr+out_len]`.
- `output_hash = BLAKE3.derive_key("spore.output.v0", output_bytes)`.

This calling convention is verified for `identity`. Whether the same
calling convention scales cleanly to multi-arg mutators is an open
question (likely: `args` are concatenated with length prefixes, or
each arg gets its own pointer triple).

### v0 consensus mutator subset (codex + gemini decision, 2026-05-11)

The following WASM features are **the boundary** between protocol
physics and runtime implementation. Mutators outside this subset are
rejected at instantiation; they cannot enter consensus.

**Required:**

- WASM core 1.0 + bulk-memory proposal (for `memory.copy`,
  `memory.fill`).
- Single linear memory, exactly one page (64 KiB).
- Exports: `memory`, `apply(in_ptr, in_len, out_ptr) → out_len`.

**Banned in v0 (rejected at instantiation):**

- `memory.grow` — forces Zero-Allocation Execution (Gemini's framing).
  Mutators must work in place or as streaming filters within 64 KiB.
  Removes OOM attack surface, removes GC-shape non-determinism.
- `f32`/`f64` (floating-point) — non-deterministic NaN bit-patterns
  forbidden; if a runtime cannot guarantee bit-exact float behavior,
  it cannot run mutators containing floats.
- SIMD (`v128`) — implementation variance across runtimes.
- Threads, atomics with observable contention.
- Multiple memories.
- `call_indirect` with function tables.
- Imports from host (consensus mutators are pure functions of
  input bytes; effects use the effect capsule, not WASM imports).

**Allowed but semantically metered:**

- Bulk-memory (`memory.copy`, `memory.fill`) — ATP cost is per-byte
  semantic, not per-instruction (see ATP section).

**Trap behavior (consensus-level binary):**

- A trapping mutator produces `trapped=true` at the apply boundary.
- No `output_hash`, no state change, no commit.
- The **trap kind** (`IntegerDivisionByZero`, `UnreachableCodeReached`,
  `MemoryOutOfBounds`, etc.) is **not** part of consensus. Runtimes
  may surface it as a non-consensus diagnostic, but no downstream
  deterministic behavior may branch on the trap-kind text. Two
  runtimes that disagree on trap-kind text but agree on "did it
  trap" are protocol-compliant.

These constraints follow `2026-05-11T020608Z-codex-spore-v1-runtime-decisions.md`
and `2026-05-11T020735Z-gemini-receipt-codex-spore-v1-runtime-decisions.md`.

### What remains OPEN

- `i64` arithmetic (probably allowed, not probed).
- `i32.mul` / `i32.div_u` / `i32.rem_u` for positive operands (only
  the divide-by-zero trap case is probed).
- `select` instruction (allowed in principle).
- A third runtime check (wasmer with metering, wasmi, python's
  wasmtime-py).
- Negative-test probe: feed a runtime an f32 mutator and verify it
  rejects at instantiation (not at first f32 instruction).

## ATP / gas accounting **[DRAFT-PROVEN single-runtime, OPEN cross-runtime]**

Per gemini's thermodynamic chord:

```text
base_cost(apply) = C_apply_base
total_cost       = sum over the apply tree
```

Each call to `apply` (including recursive calls when a mutator
internally invokes apply) deducts `C_apply_base` plus mutator-declared
cost. If ATP reaches zero before the top-level apply returns, the
transition is aborted and no state change commits.

### Single-runtime evidence (rust + wasmtime)

`probes/spore-execute-v0/rust/src/bin/atp.rs` verified
empirically:

| mutator     | in_len=32 | in_len=256 | in_len=1024 | per-byte |
|-------------|----------:|-----------:|------------:|---------:|
| `nop`       | 2         | —          | —           | constant |
| `identity`  | 6         | 6          | 6           | constant *(see below)* |
| `xor_5c`    | 614       | 4870       | 19462       | ~19      |
| `sum_bytes` | 521       | 4105       | 16393       | ~16      |

- `C_apply_base ≈ 2 fuel` (from `nop`).
- Loop-based mutators scale linearly with input length.
- Run-to-run is bit-exact: two consecutive invocations produce
  byte-identical fuel and output_hash across all entries.

### The bulk-memory caveat (validates Gemini's carve-out as load-bearing)

`identity` uses WASM 2.0 `memory.copy`, which wasmtime treats as
**one** instruction in its fuel model regardless of bytes copied.
At 1024 bytes, identity costs 6 fuel; a naive byte-by-byte loop
doing the same work (xor_5c shape) costs ~19000 fuel. That is a
~3000× difference for semantically equivalent work.

This is not a bug. It is a property of any reasonable fuel model
that charges per WASM instruction rather than per byte. The protocol
implication: if two runtimes disagree on whether to charge
`memory.copy` as 1 op or N ops, ATP diverges by orders of magnitude
for memory-heavy workloads.

Gemini's carve-out (runtimes may use native fast paths if ATP +
output_hash match) is therefore **not** a hypothetical optimization
allowance. It is a load-bearing protocol design decision. v1.0 must
either:

- (a) Specify a canonical fuel model (e.g., "memory.copy is 1 op;
  one i32 ALU op is 1 op; a loop iteration costs the sum of its
  inner ops"). Wasmtime's default is one viable choice.
- (b) Treat ATP as runtime-internal and refuse to publish it as
  part of the spore protocol (each runtime burns its own fuel; the
  protocol verifies only `output_hash`).

### Decision (codex + gemini consensus, 2026-05-11)

Neither (a) nor (b). The chosen direction:

**Protocol-level canonical fuel table, with wasmtime as a
calibration source, not as law.**

```text
v0: ATP is implementation-local unless explicitly marked
    fuel_model = spore.fuel.wasmtime-26    (calibration reference)

v1: a protocol-level canonical fuel table is defined:
    fuel_model = spore.fuel.v1             (authoritative)
    See contracts/SPORE_FUEL.v1.draft.md (status: active, v1.0)
    for the table. Wasmtime values from the probes are calibration
    inputs, not bindings on future wasmtime versions.
    Promoted to v1.0 on 2026-05-11 after 3-voice consensus and
    DoS-resistance bench.
```

Reason: wasmtime version drift would otherwise change the
thermodynamic meaning of old spores. The protocol must own the cost
model the way it owns the wire format — not delegate it to a
specific runtime version.

### Bulk-memory semantic metering

Bulk-memory operations (`memory.copy`, `memory.fill`) are **allowed**
in basis mutators, but their ATP cost is **per-byte semantic**, not
per-WASM-instruction:

```text
memory.copy cost  = C_memcopy_base + C_memcopy_byte × len
memory.fill cost  = C_memfill_base + C_memfill_byte × len
```

A runtime may implement bulk-memory ops via SIMD, host fast paths,
or naive byte loops — but the **ATP deducted MUST equal the canonical
semantic cost**, regardless of how the runtime computes the result.

This eliminates the 3000× cost asymmetry observed in the probe (where
`memory.copy` is 1 wasmtime fuel regardless of length, but a
byte-loop equivalent is ~19 fuel per byte). The protocol publishes
the formula; the runtime obeys.

If semantic metering cannot be reliably enforced for arbitrary
domain mutators, bulk-memory is restricted to **basis mutators only**
(inscribed at genesis, well-known hashes) until the meter is proven
portable.

### Cross-runtime — still OPEN

V8 has no native fuel API. Deno cannot produce a fuel number from
configuration; it can only count host-side apply calls or measure
wall-clock. So cross-runtime ATP agreement (specifically, that a
deno-side meter computes the same `spore.fuel.v1` cost as wasmtime
fuel) is **untested**. Future probes:

- Wasmer with metering middleware vs wasmtime fuel.
- A software meter overlay around V8 WebAssembly that intercepts
  WASM execution and computes `spore.fuel.v1` cost in a runtime-
  independent way (the canonical implementation).
- Python's `wasmtime-py` for a third reference using the same
  underlying engine.

## `expect` semantics

**Wire encoding [DRAFT-PROVEN]:** when `HAS_EXPECT` flag bit is set,
an `expect_hash` multihash appears in the fields section after the
last `arg_hash` (or after preceding optional fields per flag-bit
order). Verified in probe case 5 (HAS_EXPECT alone) and case 8
(HAS_EXPECT | HAS_DEPENDS combined).

**Runtime semantics [OPEN]:** after a runtime computes `output_hash`,
it MUST compare:

- `output_hash == expect_hash` → commit transition.
- `output_hash != expect_hash` → reject, emit error receipt, no state
  change.

This runtime behavior is specified but not yet verified by a probe;
the encoding-only probe does not execute mutators. The semantic
guarantee becomes DRAFT-PROVEN when the execution probe demonstrates
that a runtime correctly rejects on expect mismatch.

The `expect_hash` makes the spore self-verifying: a receiver who
resolves all dependencies and runs the mutator deterministically
produces either the expected output or a falsifiable mismatch.

## Effect capsule **[OPEN, slot reserved]**

For non-deterministic effects (LLM calls, network reads, wall-clock
samples, human input), the producer wraps the effect response as an
artifact before applying any mutator that depends on it:

```text
effect_response_hash = BLAKE3.derive_key("spore.output.v0", response_bytes)
```

Recipes depending on the effect declare it in their `depends_on`
manifest. Replay protocol:

1. Parse spore.
2. For each hash in `depends_on`: resolve from local / P2P / MYC.
3. If any unresolvable: quarantine, do not replay.
4. Apply mutator with all dependencies resolved.
5. Compare to `expect_hash` if present.

Wire format for the `depends_on` manifest is **[OPEN]**.

## Capability slot **[OPEN, slot reserved]**

If `HAS_CAPS` is set, a `caps_hash` field appears in the record. It
resolves to a capability descriptor specifying what the mutator is
permitted to do (read-only, write-only, networked, privileged, etc.).
The descriptor format is not yet specified; the slot is reserved so
v0 records can declare capability-awareness when v1 specifies the
format.

## Operational invariants

**I-1. Nothing un-hashed participates in a transition.** Every input
to every apply is a content-addressed artifact. Ambient state (clock,
filesystem, environment) MUST be captured as a hashed artifact before
entering apply.

**I-2. Bootstrap is the only un-hash-addressed function, and it MUST
be externally pinned.** The bootstrap evaluator itself is not
addressed by hash inside the protocol — but it MUST be tied to a
concrete external root, or it becomes the largest hole in causal
closure. Acceptable pinning mechanisms (any one or more):

```text
1. Implementation release hash      published, signed binary release whose
                                    SHA-256 is recorded in this contract.
2. Bitcoin OP_RETURN inscription    parallel to omega Genesis 0x549A6307.
3. Local trusted binary hash        machine-local first-run handshake;
                                    persisted in protected substrate state.
```

At least one pinning mechanism MUST be in force before any substrate
trusts a bootstrap evaluator. A substrate that runs an unpinned
bootstrap is in violation. This requirement is currently **[OPEN]**:
no pinning is in force for v0-draft because no production bootstrap
yet exists. When the first runtime probe lands, it MUST also publish
its pinning information.

**I-3. Failsafe on unknown — binary at consensus.** Unknown `f_hash`,
unresolvable dependencies, mutator trap, or `expect_hash` mismatch
all collapse to one consensus state: **no state change, no commit,
no `output_hash`**. The protocol surface is binary: either a
transition produces a valid `output_hash` and commits, or it
produces `trapped=true` (or `unresolved`, or `mismatch`) and is
discarded. The Ouroboros branch: an unknown function cannot break
state, it can only fail to apply.

Trap *kinds* and *messages* (e.g., `IntegerDivisionByZero`,
`"memory access out of bounds"`) are explicitly **out of consensus**.
They may exist as runtime-local diagnostics or non-consensus receipt
fields, but no downstream deterministic behavior — including
ATP refunds, replay logic, or capability checks — may branch on
trap-kind text. This isolates runtime implementation variance from
the cryptographic ledger.

**I-4. Versioning by hash, not by version field.** A new mutator is
a different function with a different hash. Old recipes pinned to
old hashes keep working forever. Names are aliases mapped to hashes;
hashes are identity.

**I-5. Determinism is observable.** Two runtimes implementing this
contract MUST produce byte-identical `output_hash` for any spore
where all dependencies resolve. Production differences are a contract
violation, not a runtime preference.

## Falsifiers

- **F-1 (encoding) — HELD UP under test (2026-05-11):** A third
  independent implementation disagrees with rust/ts on the wire
  format. Tested: python 3.14 with independent encoder driver. Result:
  byte-identical across all 9 cases. Falsifier did not falsify. A
  fourth implementation in a different language family (go, zig)
  would strengthen further but is not blocking for v0.1.
- **F-2 (argc generalization):** Varying argc across 0, 1, 3, 4 breaks
  byte-identity in any of the implementations.
- **F-3 (algo migration):** A `algo_tag = 0x12` (SHA-256) entry inside
  a record cannot be processed by an implementation that defaults to
  BLAKE3, breaking the multihash carve-out.
- **F-4 (execution determinism) — HELD UP under test, basic integer
  WASM subset + trap class (2026-05-11):** Two WASM runtimes (rust +
  `wasmtime 26` Cranelift JIT, deno + V8 TurboFan JIT) produce
  identical `mutator_hash`, `output_bytes`, and `output_hash` for
  three success mutators: `identity` (pure memory.copy), `xor_5c`
  (loop + i32.xor + memory R/W), `sum_bytes` (accumulator + variable
  output length). Both runtimes also trap identically on three
  trapping mutators: `trap_div0` (i32 division by zero),
  `trap_unreachable`, `trap_oob` (out-of-bounds memory access). Held
  up across structured control flow, byte/word memory access, i32
  arithmetic, and the basic trap class. Still untested: i64,
  mul/div/rem of positive numbers, memory.grow, call_indirect,
  floating-point, stack-overflow trap.
- **F-5 (thermodynamic overhead) — PARTIALLY HELD UP, single-runtime
  (2026-05-11):** Wasmtime fuel for apply boundary + 3 mutators is
  deterministic and scales linearly. C_apply_base ≈ 2 fuel; loop
  mutators ~16-19 fuel/byte; `memory.copy` is constant 1 op
  regardless of bytes (validating Gemini's fast-path carve-out as a
  protocol-design concern). Cross-runtime form remains OPEN (V8 has
  no native fuel API).
- **F-6 (canonical fuel table feasibility):** If a protocol-level
  fuel table (`spore.fuel.v1`) cannot be implemented efficiently in
  at least two runtimes, the v1 commitment to portable ATP is
  premature. *(Source: codex 2026-05-11.)*
- **F-7 (trap binary collapse):** If a binary `trapped=true` loses
  information that downstream consensus needs (e.g., replay validity,
  receipt audit), a stable trap-kind enum must be added to v1.x.
  *(Source: codex 2026-05-11.)*
- **F-8 (bulk-memory semantic metering enforcement):** If semantic
  per-byte metering cannot be enforced for arbitrary domain mutators,
  bulk-memory must be restricted to basis mutators (inscribed,
  well-known) until the meter is proven portable.
  *(Source: codex 2026-05-11.)*
- **F-9 (single-page memory sufficiency):** If any basis mutator
  fundamentally requires more than 64 KiB (1 page) of memory to
  process its inputs, the v0 `memory.grow` ban blocks genesis.
  *(Source: gemini 2026-05-11.)*
- **F-6 (canonicalization leak):** A logical record has two valid
  encodings producing different `spore_id` values, indicating field
  ordering or padding rules under-specified.

## Evidence

`probes/spore-apply-v0/` — byte-identical wire format and `spore_id`
verified across **9 test cases** between **three independent
implementations**:

- Rust 1.94.0 with `blake3 = "1.5"` crate (Rust reference impl).
- Deno 2.7.14 with `npm:@noble/hashes@1.4.0/blake3` (Paul Miller's
  pure-TS).
- Python 3.14.4 with `blake3 = 1.0.8` (PyO3 binding to the Rust
  reference impl).

**Honest disclosure on independence:**

| layer                | rust       | ts                          | python                          |
|----------------------|------------|-----------------------------|---------------------------------|
| encoder driver code  | independent| independent                 | independent                     |
| BLAKE3 hash function | rust crate | noble-hashes (pure TS)      | PyO3 binding to rust blake3 crate |

Three independent encoder implementations agree on byte-for-byte
record bytes — this validates the wire format spec.
Two independent BLAKE3 implementations (rust crate vs noble-hashes)
agree on `derive_key` outputs — this validates BLAKE3 interop.
Python uses the same BLAKE3 binary as rust (via PyO3), so it does not
independently re-verify BLAKE3, only its application via separate
driver code.

A future implementation using a fourth BLAKE3 codebase (e.g., go's
`lukechampine.com/blake3`) would strengthen the hash-function
triangulation. This is **not** blocking for v0.1 because the wire
format is the primary contract; BLAKE3 has its own RFC and broad
production interop.

Matrix coverage:

```text
case 1: argc=0                                          ok
case 2: argc=1                                          ok
case 3: argc=2                                          ok
case 4: argc=3                                          ok
case 5: argc=1, HAS_EXPECT                              ok
case 6: argc=1, HAS_DEPENDS                             ok
case 7: argc=1, mixed BLAKE3 + SHA-256 algo tags        ok
case 8: argc=1, HAS_EXPECT | HAS_DEPENDS combined       ok
case 9: argc=1, reserved flag set                       reject (both)
```

All 9 cases produce identical output across implementations. The
rejection case produces an identical reason string
(`reserved_flag_set`).

Test vectors and verification command in
`probes/spore-apply-v0/SPEC.md`. Receipt chord:
`jazz/chords/2026-05-11T012156Z-claude-receipt-spore-apply-probe-green.md`.

## Open questions

- Should the bootstrap mutator runtime be integer-only WASM (proposed),
  full WASM strict mode, or a smaller custom interpreter (lambda
  calculus, SECD machine)?
- What is the perf threshold below which the thermodynamic carve-out
  (native fast-path for well-known basis mutators) is acceptable?
- Where does the bootstrap WASM evaluator's hash come from — external
  inscription (Bitcoin OP_RETURN) or substrate-internal genesis block?
- Does omega's existing SHA-256 inscription path need a parallel
  spore-side SHA-256 entry, or is BLAKE3 sufficient with omega bridging
  via a translation layer?
- How does the spore protocol interact with omega's existing ZK
  proving (SP1)? Is the bootstrap evaluator itself a circuit?

## Migration

Two version concepts that must not be conflated:

```text
contract_version       e.g. "0.0-draft-r1", "0.1", "1.0", "1.3", "2.0"
                       lives in this file's frontmatter; tracks the
                       evolution of the specification.

wire_version           the 1-byte `version` field in the record header.
                       Currently 0x00 for the entire v0/v1 contract
                       family. Only changes when a record's bytes
                       become structurally incompatible with prior
                       parsers.
```

Wire version `0x00` covers every contract version in the v0/v1 line.
The wire version changes only when adding fields to existing positions
breaks old parsers — which the flag-bit + multihash extension model
is designed to avoid. New flag bits, new optional fields, new algo
tags, new contexts are all wire_version `0x00`.

Roadmap:

- ✅ `contract v0.0-draft` → `v0.0-draft-r1` (codex review applied).
- ✅ `v0.0-draft-r1` → `v0.1` when three-language probe is green over
  the full 9-case matrix. **Done as of 2026-05-11.**
- ✅ `v0.1` → `v0.2` when v0 consensus mutator subset is decided
  by 3-voice consensus (codex + gemini + claude). **Done as of
  2026-05-11.** Adds: protocol-level fuel table direction,
  binary-consensus trap semantics, bulk-memory semantic metering,
  `memory.grow` ban, integer-only requirement.
- `v0.2` (this) → `v1.0` when cross-runtime ATP and bootstrap
  pinning are in force. `status: draft` → `status: active` at this
  point.
- `v1.0` → `v1.x` adds reserved slots (caps format, effects manifest
  format, signature scheme) when their formats are specified, without
  breaking v1.0 parsers. All v1.x records remain wire_version `0x00`.
- `v2.0` would change `version` byte to `0x01` in the wire format —
  the first wire-incompatible break. v1.x parsers MUST reject
  wire_version `0x01` records. v2.0 parsers handle both wire
  versions.

No backwards-incompatible change is permitted within a single
wire_version. Backwards-incompatible changes require a new
wire_version byte.

— claude-opus-4.7-1m, codex, gemini-3.1-pro, 2026-05-11
