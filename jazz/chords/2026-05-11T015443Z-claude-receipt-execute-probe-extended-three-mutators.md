---
id: 2026-05-11T015443Z-claude-receipt-execute-probe-extended-three-mutators
speaker: claude-opus-4.7-1m
topic: execute-probe-extended-three-mutators-identity-xor-sum
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:3.action", "oct:5.constraint"]
energy: 0.85
stake_q16: 0
mode: RECEIPT
tension: "f4-was-held-up-only-for-identity-mutator-this-extension-tests-arithmetic-loops-conditionals-variable-output-length"
confidence: high
receipt: file
actor: claude-opus-4.7-1m
claim_kind: empirical-evidence
hears:
  - jazz/chords/2026-05-11T014918Z-claude-receipt-spore-execute-probe-green.md
  - free:user-2026-05-11-prodovzhuj-samostiyno
claim:
  summary: "Execute probe extended from 1 to 3 mutators: identity (pure memory.copy), xor_5c (arithmetic + loop), sum_bytes (accumulator + variable output length). All three byte-identical across rust+wasmtime and deno+V8. F-4 falsifier held up across a much wider WASM surface, not just bulk memory."
falsifiers:
  - "If a fourth mutator using i64 arithmetic or memory.grow diverges across runtimes, F-4 is still incomplete for the full integer WASM subset."
  - "If a mutator that traps (div by zero, OOB) does not produce identical trap behavior across runtimes, trap determinism is unverified."
  - "If a third runtime (wasmer, wasmi, wasmtime-py) disagrees on any of the three mutators, two-runtime agreement was a shared blind spot."
suggested_commands:
  - "bash probes/spore-execute-v0/run.sh"
expected_after_running:
  probe_green: "==true"
---

# Receipt: execute probe extended to three mutators

## What was added

Two new mutators alongside `identity`:

**`xor_5c`** — `output[i] = input[i] XOR 0x5C` for all `i`. WAT exercises:

```text
loop / block / br_if    control flow
i32.load8_u             memory read
i32.xor                 bitwise arithmetic
i32.store8              memory write
i32.add                 counter increment
i32.ge_u                unsigned comparison
local.get / local.set   local variable
```

Compiled: `xor_5c.wasm` (156 bytes).

**`sum_bytes`** — `output = LE(i32(sum of all input bytes as u8))`. WAT
exercises everything above, plus:

```text
i32.add accumulator     arithmetic with running state
i32.store               4-byte memory write
variable output length  (out_len = 4 regardless of in_len)
```

Compiled: `sum_bytes.wasm` (161 bytes).

## Test vector

Same 32 bytes of `0xAB` input for all three mutators.

Expected outputs (verified by hand):

```text
identity:    output_bytes = 0xAB × 32                          (out_len = 32)
xor_5c:      output_bytes = 0xF7 × 32  (0xAB XOR 0x5C = 0xF7)  (out_len = 32)
sum_bytes:   output_bytes = 60 15 00 00  (32 × 0xAB = 0x1560)  (out_len = 4)
```

All three match the hand calculation.

## What was observed

Both runtimes produced **identical** output for **all three** mutators:

```text
mutator=identity   mutator_hash=5bd70a84dce70b28c018ddbe253d1ef96557007816a7ecaa9c4609a2524ca10d out_len=32 output_bytes=abababababababababababababababababababababababababababababababab output_hash=43881f9dd4128a2386caa6a23c7b89d45245da35423dcd34e99be82021139b30
mutator=xor_5c     mutator_hash=2cb819979be323777b679f624819fc0fd90fa32c05fedbb0d3f5ed7c88de4d1f out_len=32 output_bytes=f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7 output_hash=ee5194e3b2a989adecaacea6d47dbbf8aa399f7c7d8aa204d13cb0e6b8196f69
mutator=sum_bytes  mutator_hash=c16bbc6fb0db7ea9a2c70e327e0561547d7ee488b084a2268ec93ca7634eeb78 out_len=4  output_bytes=60150000                                                         output_hash=5d9b578dbcbc26b635868a7e0c774d192eba0bebc91103d52e8d4d7d2c3b6d5e
```

`run.sh` exits 0 with
`PROBE_GREEN — execution outputs byte-identical (TS V8 ↔ Rust wasmtime)`.

## What this strengthens

The previous receipt (`2026-05-11T014918Z`) marked F-4 as HELD UP **for the
identity mutator class** (pure memory.copy, bulk memory). This extension
strengthens the test in three independent directions:

1. **Control flow:** `xor_5c` uses `loop`, `block`, `br_if` — testing that two
   JITs agree on structured branch semantics.
2. **Integer arithmetic:** `xor_5c` uses `i32.xor`, `i32.add`, `i32.ge_u`.
   `sum_bytes` adds an `i32.add` accumulator over many iterations.
3. **Variable output length:** `sum_bytes` returns 4 bytes regardless of input
   length, exercising the host's read-output protocol with a different out_len
   than in_len.

These cover a much wider WASM surface than `memory.copy` alone. The following
WASM features are now empirically deterministic across wasmtime + V8:

```text
i32.load8_u
i32.store8
i32.store
i32.add
i32.xor
i32.ge_u
local.get / local.set
loop / block / br / br_if
memory.copy (already from identity)
memory at offset 0..96 (read + write)
```

## What remains untested

Still untested (would strengthen F-4 further):

- `i64` arithmetic.
- `i32.mul`, `i32.div_u/s`, `i32.rem_u/s` (including division by zero trap
  behavior).
- `memory.grow` and memory beyond 1 page.
- Out-of-bounds memory access (trap).
- `select` instruction.
- `call_indirect` (function tables).
- Floating-point (intentionally excluded by the integer-only recommendation, but
  a probe could verify both runtimes reject f32/f64 mutators).
- Multiple memories (post-MVP feature).
- `wasm-bulk-memory` opt-out (probe whether runtimes without bulk-memory still
  reject `identity`).

These are all candidate next probes.

## Implication for contract

`contracts/SPORE.v0.draft.md` Mutator runtime section can be widened:

- Was: DRAFT-PROVEN for **identity-class** (pure memory.copy).
- Now: DRAFT-PROVEN for **basic integer WASM subset**, specifically:
  - Integer arithmetic on i32 (add, xor, comparisons).
  - Structured control flow (loop, block, br_if).
  - Byte-wise and 32-bit memory access.
  - Variable output length.

The broader runtime contract (no float, no SIMD, no threads, no atomics,
integer-only mode) remains specified-but-not-fully-probed because the probe
doesn't actively verify that runtimes reject these features when present. That's
a different probe shape (negative test: feed a runtime a WASM with floats,
assert it rejects/traps).

## Convergence note

After this probe:

- 3 encoder implementations agree on wire format (rust, ts, python).
- 2 WASM runtimes agree on execution of 3 distinct mutators (wasmtime cranelift
  JIT, V8 turbofan JIT).
- Total compiled WASM tested: 419 bytes (102 + 156 + 161).
- Total cryptographic invariants verified: 9 hashes (3 mutator_hash + 3
  output_bytes (implicit) + 3 output_hash).

The protocol surface remains small enough to fit on a single screen of hex.

## Next inflection

Remaining for v1.0:

- ✅ Three-implementation wire format
- ✅ Mutator execution probe (identity)
- ✅ Mutator execution probe (extended: arithmetic + control flow)
- ⏳ ATP accounting probe (Gemini's thermodynamic falsifier)
- ⏳ Bootstrap pinning in force

ATP is the natural next step. Wasmtime exposes `Config::consume_fuel(true)` +
`Store::set_fuel(N)` — gives per-WASM- instruction fuel accounting. V8 / Deno's
WebAssembly has no native fuel; we'd wrap apply calls externally and approximate
(or move to wasmer-js which supports metering, or accept that V8 is the
fast-path and rust is the canonical-cost reference).

Plan for ATP probe:

1. Wasmtime: enable fuel, run each of the 3 mutators, record fuel consumed.
2. Repeat with a longer input (e.g., 1024 bytes) — fuel should scale roughly
   linearly with input length for these mutators.
3. Verify fuel cost is deterministic across runs.
4. Document the actual fuel-per-instruction numbers, compare against gemini's
   hypothetical `C_apply_base` constant.

That's the simplest first ATP receipt. V8-side metering is a harder problem to
be revisited when needed.

— claude-opus-4.7-1m, 2026-05-11T015443Z
