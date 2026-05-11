# spore-meter-v0 probe

Reference software meter for `spore.fuel.v1`.

This probe implements **meter #1** required by `SPORE_FUEL.v1.draft.md`'s
promotion criterion:

> "Two independent meters agree exactly on fuel for the test corpus."

It does **not** use wasmtime's built-in fuel. It walks WASM bytecode
with `wasmparser` and applies the v1 cost table directly, producing
runtime-independent fuel cost.

---

## Inputs

For each `(mutator, in_len)` pair:

- `mutator_wasm_bytes` — the compiled mutator from
  `probes/spore-execute-v0/<name>.wasm`.
- `in_len` — input length (used both as the assumed loop iteration
  count and as the operand length for `memory.copy`/`memory.fill`).
- `argc = 1` — apply boundary scales as `C_apply_base = 4 + argc`.

## Output

```text
mutator=<name> in_len=<N> fuel_v1=<u64> mutator_hash=<first 16 hex>
```

One line per `(mutator, in_len)` pair, deterministic.

---

## Methodology

1. Parse the WASM module with `wasmparser`.
2. For the `apply` function's body, walk every operator linearly.
3. Maintain a stack of block kinds: each `block`/`loop`/`if` push;
   each matching `end` pop.
4. For each operator, the **multiplier** is the product of `in_len`
   over every enclosing `loop` on the stack (the assumption: every
   loop in the test corpus iterates `in_len` times).
5. Per-operator cost is looked up from the v1 table:

   - stack / locals / const / drop / nop → 1
   - i32 / i64 ALU + comparisons + conversions → 1
   - i32 / i64 load / store → 2
   - block / loop / if / else / return / select / unreachable → 1
   - br / br_if / call → 1 / 1 / 2
   - end → 0 (heuristic: end is a marker, not an executed instruction)
   - `memory.copy` → `4 + 2 × in_len`
   - `memory.fill` → `4 + 1 × in_len`

6. Block / loop / if are counted **before** their push, so the
   block-entry opcode runs at the outer multiplier.
7. Sum body_fuel = Σ multiplier × cost over all operators.
8. Return `C_apply_base + body_fuel`.

---

## What this meter is and isn't

**Is:**

- A reference implementation of `spore.fuel.v1` cost computation.
- Deterministic given `(mutator_wasm_bytes, in_len, argc)`.
- Independent of any WASM runtime (no execution involved).

**Isn't:**

- A general-purpose meter for arbitrary WASM mutators. The
  assumption "every loop iterates `in_len` times" matches the test
  corpus exactly but does not generalize. A general meter requires
  WASM instrumentation (Option B in the fuel contract).
- An execution probe. It does not invoke `apply`; it only walks
  WASM bytecode.

For codex's promotion criterion ("two meters agree exactly on test
corpus"), this is meter #1. Meter #2 is a separate probe yet to be
built — probably an instrumented-WASM approach that drives loop
counts from actual execution.

---

## Test corpus

Read from `probes/spore-execute-v0/` (already proven byte-identical
between rust + wasmtime and deno + V8):

```text
mutator        in_len
─────────      ──────
nop            32
identity       32, 256, 1024
xor_5c         32, 256, 1024
sum_bytes      32, 256, 1024
```

Trap mutators (`trap_div0`, `trap_unreachable`, `trap_oob`) are
out of scope for this probe; their fuel is whatever they consume
up to the trapping instruction, which depends on runtime state, not
just `in_len`.

---

## Success criterion

The meter prints deterministic output. Re-running produces
byte-identical output. The output is the input to F-FUEL-3
falsification when meter #2 lands.
