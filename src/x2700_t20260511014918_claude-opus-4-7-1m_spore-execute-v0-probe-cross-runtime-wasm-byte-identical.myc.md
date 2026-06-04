---
id: 2026-05-11T014918Z-claude-receipt-spore-execute-probe-green
speaker: claude-opus-4.7-1m
topic: spore-execute-v0-probe-cross-runtime-wasm-byte-identical
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:3.action", "oct:5.constraint"]
energy: 0.86
stake_q16: 0
mode: RECEIPT
tension: "f4-falsifier-claimed-two-wasm-runtimes-might-diverge-on-same-mutator-tested-with-identity-mutator-they-do-not"
confidence: high
receipt: file
actor: claude-opus-4.7-1m
claim_kind: empirical-evidence
hears:
  - x2700_t20260511013914_claude-opus-4-7-1m_spore-v0-1-three-language-probe-green-f1-closed
  - free:user-2026-05-11-prodovzhuj-then-perevirymo
claim:
  summary: "spore-execute-v0 probe verifies that the identity mutator (compiled from WAT to WASM) executes byte-identically across rust+wasmtime and deno+V8. mutator_hash, output_bytes, and output_hash all match. F-4 falsifier held up under test for the identity mutator class."
falsifiers:
  - "If a non-trivial mutator (uses memory grow, i64 arithmetic, atomic ops, traps) diverges across runtimes, F-4 is only partially closed — identity is the minimum case, not the maximum."
  - "If wasmtime and V8 happen to share a code-generation pattern for memory.copy specifically, two-runtime agreement may be weaker than the BLAKE3 case."
  - "If a third runtime (wasmer, wasmi, python's wasmtime-py) disagrees, the v0 execution semantics need tightening."
suggested_commands:
  - "bash probes/spore-execute-v0/run.sh"
expected_after_running:
  probe_green: "==true"
---

# Receipt: spore-execute-v0 — execution byte-identical across runtimes

## What was claimed

The wire format probe (`spore-apply-v0`) verified that `apply` records and
`spore_id` are byte-identical across three encoder implementations. But that
probe never executed any mutator — it only serialized records about applies.
Codex's F-4 falsifier:

> "Two WASM runtimes (e.g., wasmtime and wasmer-js) produce different
> `output_hash` for the same `f_hash` and the same args, even in strict
> deterministic mode."

This receipt grounds whether F-4 holds for the simplest possible mutator.

## What was done

Built `probes/spore-execute-v0/` containing:

```text
SPEC.md                              # what this probe tests
identity.wat                         # mutator source (4 lines of WAT)
identity.wasm                        # compiled mutator (102 bytes, committed)
wat-compile/                         # one-shot WAT → WASM tool (rust + `wat` crate)
rust/                                # probe (rust + wasmtime 26)
ts/probe.ts                          # probe (deno + V8 built-in WebAssembly)
run.sh                               # runs both, diffs
.gitignore
```

The `identity` mutator is the simplest meaningful basis mutator:

```wat
(module
  (memory (export "memory") 1)
  (func (export "apply")
    (param $in_ptr i32) (param $in_len i32) (param $out_ptr i32)
    (result i32)
    (memory.copy (local.get $out_ptr) (local.get $in_ptr) (local.get $in_len))
    (local.get $in_len)))
```

ABI: `apply(in_ptr, in_len, out_ptr) → out_len`. For identity, the function
copies `in_len` bytes from `in_ptr` to `out_ptr` (using the WASM 2.0
`memory.copy` bulk-memory instruction) and returns `in_len`.

Test vector: 32 bytes of `0xAB` written at offset 0; `apply(0, 32, 64)` called;
32 bytes read from offset 64.

## What was observed

Both runtimes produced **identical** output:

```text
mutator_hash=5bd70a84dce70b28c018ddbe253d1ef96557007816a7ecaa9c4609a2524ca10d
output_bytes=abababababababababababababababababababababababababababababababab
output_hash=43881f9dd4128a2386caa6a23c7b89d45245da35423dcd34e99be82021139b30
```

`diff` empty. `run.sh` exits 0 with
`PROBE_GREEN — execution outputs byte-identical (TS V8 ↔ Rust wasmtime)`.

Verified using:

- Rust 1.94.0 + `wasmtime = "26"` (Bytecode Alliance reference, Cranelift JIT).
- Deno 2.7.14 + V8 built-in `WebAssembly` (TurboFan JIT).
- BLAKE3 via `blake3 = "1.5"` crate (rust) and `npm:@noble/hashes@1.4.0/blake3`
  (TS — pure-TS implementation, fully independent from rust crate).

Two completely different JIT compilers backing two completely different runtimes
producing the same bytes for the same WASM module and the same memory
operations.

## What this does NOT yet prove

This is `identity` — a single mutator with pure memory copy. The following are
still uncovered:

- **Non-trivial mutators.** Integer arithmetic, conditional branches, loops with
  i32/i64 operations. WASM spec guarantees these are deterministic, but
  `identity` doesn't test them.
- **Memory growth.** `identity` uses 1 page (64 KiB) and never grows. Larger
  workloads might surface page-allocation differences.
- **Traps.** WASM trap semantics on out-of-bounds, division by zero, etc.
  `identity` cannot trap.
- **Floating point.** `identity` doesn't use floats. The contract recommends
  integer-only WASM; this probe doesn't enforce it.
- **ATP / gas metering.** Gemini's thermodynamic concern. Neither runtime is
  metered here — they just run to completion.
- **Three-runtime agreement.** Only rust + ts. Python's `wasmtime-py` would
  close F-4 more strongly; wasmer or wasmi would close a different gap.

These are all **next probes**, not this probe's scope.

## Implications for the contract

`contracts/SPORE.v0.draft.md` can be updated:

- **Mutator runtime section** — currently `[OPEN]`. Should become
  `[DRAFT-PROVEN]` for the **identity-class mutator subset** (pure memory
  operations, bulk-memory WASM 2.0, no traps, no float). Other classes remain
  `[OPEN]`.
- **F-4 falsifier** — should be marked
  `HELD UP under test (identity
  mutator, 2 runtimes, 2026-05-11)`. Stronger
  triangulation requires a third runtime AND non-trivial mutators.
- **Bootstrap pinning (I-2)** — the bootstrap evaluator for this probe is
  `wasmtime 26.x` (rust side) and `V8 built-in WebAssembly` (ts side). Neither
  is yet inscribed via OP_RETURN or release-hash pinning. This remains `[OPEN]`.

## Convergence note

The mutator's compiled binary is **102 bytes**. Its hash is a 32-byte digest.
The hash of its output (over the 32-byte input) is another 32-byte digest. These
three small numbers are now cryptographic invariants that two completely
separate engineering ecosystems agree on without coordination. The protocol
surface, encoded, is small enough to read aloud.

That's what "minimum protocol" means in practice.

## Next inflection

Per
`x2700_t20260511013914_claude-opus-4-7-1m_spore-v0-1-three-language-probe-green-f1-closed`,
remaining for v1.0 elevation:

- ✅ Three-implementation wire format (done in spore-apply-v0).
- ✅ Mutator execution probe (this).
- ⏳ ATP accounting probe — Gemini's thermodynamic falsifier.
- ⏳ Bootstrap pinning in force.

ATP is the natural next step. The shape:

1. Add a fuel counter to the rust wasmtime store (wasmtime supports
   `Config::consume_fuel`).
2. Add an equivalent fuel-tracking wrapper in deno (V8 doesn't have native fuel;
   the wrapper would intercept `apply` calls and deduct per-call cost).
3. Define `C_apply_base` as a constant in the contract.
4. Run identity + a multi-call composition; verify ATP burn matches apply-tree
   depth.

Estimated effort: similar to this probe, maybe a bit more on the ts side (V8
doesn't have native fuel metering, so we wrap externally).

Or: write a third execute probe with a non-trivial mutator first (e.g., `concat`
— takes two byte arrays, returns their concatenation; exercises memory write at
variable offsets). Closes more of F-4.

Open to user direction.

— claude-opus-4.7-1m, 2026-05-11T014918Z
