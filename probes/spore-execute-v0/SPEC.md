# spore-execute-v0 probe

Cross-runtime execution probe for the `apply` primitive.

This probe extends `spore-apply-v0` (which verified the wire format
and `spore_id` hashing) into actual mutator execution. Goal: prove
that the **same WASM mutator bytes**, run through **two different
WASM runtimes**, produce **byte-identical output bytes** and
therefore **byte-identical `output_hash`**.

If this is true, the apply primitive can be implemented in multiple
substrates with matching semantics, not just matching wire format.

---

## Scope

Tests:

1. A fixed WASM mutator (`identity`) has a stable, byte-addressable
   binary form whose hash is reproducible.
2. Two independent WASM runtimes (wasmtime in rust, V8's WebAssembly
   in deno) load the same WASM bytes and execute the same `apply`
   call.
3. The output bytes from execution are byte-identical across
   runtimes.
4. The output hash (BLAKE3 derive_key over output bytes) is
   byte-identical.

**Out of scope:**

- ATP/gas metering (separate probe).
- Multi-mutator composition (chained applies).
- Non-deterministic effects (next probe family).
- Recipe records containing mutator hashes (the wire format probe
  already covered this).

---

## Mutator: `identity`

`identity` is the simplest possible basis mutator: it takes input
bytes and returns them unchanged.

Source: `identity.wat`

```text
(module
  (memory (export "memory") 1)
  (func (export "apply")
    (param $in_ptr i32) (param $in_len i32) (param $out_ptr i32)
    (result i32)
    (memory.copy (local.get $out_ptr) (local.get $in_ptr) (local.get $in_len))
    (local.get $in_len)))
```

Compiled: `identity.wasm` (committed alongside the source).

The compiled `.wasm` file is committed to make the probe fully
reproducible without requiring a WAT-to-WASM toolchain at run time.
`compile.sh` regenerates `identity.wasm` from `identity.wat` using
the bundled rust `wat` crate; this is needed only if `identity.wat`
is edited.

---

## ABI

Module exports:

- `memory` — linear WebAssembly memory, single page (64 KiB).
- `apply(in_ptr: i32, in_len: i32, out_ptr: i32) -> out_len: i32`
  - Reads `in_len` bytes from `memory[in_ptr..in_ptr+in_len]`.
  - Writes some bytes to `memory[out_ptr..out_ptr+out_len]`.
  - Returns the number of output bytes written.

For `identity`, this is just `memory.copy(out_ptr, in_ptr, in_len)`
followed by returning `in_len`.

---

## Hashing

```text
mutator_hash = BLAKE3.derive_key("spore.mutator.v0", identity_wasm_bytes)
output_hash  = BLAKE3.derive_key("spore.output.v0",  output_bytes)
```

These match the contexts in `contracts/SPORE.v0.draft.md`.

---

## Test vector

Fixed input: 32 bytes of `0xAB`.

Probe sequence in each runtime:

1. Read `identity.wasm` bytes from disk.
2. Compute `mutator_hash`.
3. Instantiate the WASM module.
4. Get the exported `memory` and `apply` function.
5. Write input bytes (32 × 0xAB) to memory at offset 0.
6. Call `apply(0, 32, 64)` — output written at offset 64.
7. Read output bytes from memory at offset 64..96.
8. Compute `output_hash`.
9. Print:
   ```text
   mutator_hash=<hex>
   output_bytes=<hex of 32 bytes>
   output_hash=<hex>
   ```

For `identity`, `output_bytes` MUST equal `input_bytes` exactly.

---

## Success criterion

```bash
bash run.sh
```

Exit 0 with `PROBE_GREEN` iff all three lines from rust match all
three lines from ts, byte for byte.

Specifically:

```text
mutator_hash (rust) == mutator_hash (ts)
output_bytes (rust) == 0xAB × 32 == output_bytes (ts)
output_hash  (rust) == output_hash  (ts)
```
