# spore-meter-instr-v0 probe (MVP: nop + identity)

**Meter #4** for `spore.fuel.v1`, fundamentally different in
**algorithm class** from meters #1, #2, #3.

Meters #1/#2/#3 are static walkers: they parse a mutator's WASM,
multiply per-instruction costs by predicted iteration counts, and
output a predicted fuel total **without executing** the mutator.

This probe is **Option B from `contracts/SPORE_FUEL.v1.draft.md`
§"Software meter specification"** — a WASM-to-WASM instrumenter.
It rewrites a mutator so that the rewritten module, **when actually
executed**, deducts ATP from a host counter via an imported
`spore.deduct(i32)` function. The fuel total is whatever the host
counter accumulates by the time `apply()` returns.

This closes two real gaps the contract identifies:

1. V8/Deno has no engine fuel API. Wasmtime's `consume_fuel(true)`
   is engine-specific. An instrumented module produces fuel
   accounting **inside the WASM bytecode**, so V8 and any other
   engine can run it.
2. Meters #1/#2/#3 share the same algorithm-design (linear walk
   with iteration-count multipliers). Per the contract,
   "algorithm-design independence remains untested." This probe
   uses a fundamentally different algorithm: instrument once,
   execute, measure. Disagreement between this and meter #3 surfaces
   either a cost-table bug or a walker bug; agreement is much
   stronger evidence than agreement between #1 and #2.

## Scope (MVP only)

This MVP supports **only single-basic-block mutators with no
loops, no internal calls, and no internal branches**:

- `nop` — single static body, no dynamic ops
- `identity` — single static body containing `memory.copy` (dynamic
  per-byte cost)

`xor_5c` and `sum_bytes` (loop mutators) are **deferred** to a
follow-up probe. Their support requires basic-block analysis across
loop/block/if/br_if boundaries, which is conceptually harder and
must match the canonical exec-aware model precisely (exit-check
phase, body phase). Adding loops here without that care would
weaken meter #3's exec-aware result.

If the instrumenter is asked to process a mutator containing
`loop`, `block`, `if`, `else`, `br`, `br_if`, `br_table`, or `call`,
it MUST refuse with a clear "outside-MVP-scope" error rather than
silently emitting incorrect instrumentation.

## Instrumentation strategy

For each function body in the input mutator:

1. Compute the **static body fuel** (sum of v1 costs for every
   opcode in the body, treating `memory.copy` / `memory.fill` as
   contributing only their fixed cost of 4).
2. Add one scratch i32 local (for stack manipulation around dynamic
   ops).
3. At the start of the body, prepend `i32.const <static>; call $deduct`
   — charges the static portion in one host call.
4. Immediately before any `memory.copy`: the length operand is on
   top of the stack as the 3rd operand. Insert a sequence that:
   - `local.tee $scratch` (save length, leave on stack)
   - `local.get $scratch` (duplicate)
   - `i32.const 2; i32.mul` (compute `2 * length`)
   - `call $deduct` (charge dynamic per-byte)
   This leaves `[dst, src, length]` on the stack ready for
   `memory.copy`.
5. Similarly for `memory.fill`: dynamic cost is `1 * length`. Same
   stack manipulation, with `i32.const 1; i32.mul` (or just omit
   the multiplier and call deduct on the length directly).

Module-level changes:

- Add a type `(func (param i32))` to the type section.
- Add an import `(import "spore" "deduct" (func (type N)))`, where
  N is the new type index. This becomes function index 0, shifting
  all original function indices by +1.
- Update the export section: any `(export "X" (func K))` becomes
  `(export "X" (func K+1))`.
- No internal `call` instructions exist in these mutators, but if
  any did, every `call N` in the code section would need to become
  `call (N+1)`.

## Expected output

The host counter, after `apply()` returns, must equal the **body
fuel** computed by meter #3 — i.e., `fuel_v1` minus `C_apply_base`
(which is 5 for argc=1; charged by the host's apply boundary, not
by the mutator's WASM).

```text
mutator=nop      in_len=32   body_fuel_instr=1
mutator=identity in_len=32   body_fuel_instr=72
mutator=identity in_len=256  body_fuel_instr=520
mutator=identity in_len=1024 body_fuel_instr=2056
```

`run.sh` exits 0 only when every row matches the expected value
exactly.

## What this probe will NOT close

- **Loop mutators.** Deferred.
- **Trap-on-budget.** This MVP only counts; it does not enforce a
  budget by trapping. A follow-up extension can have `deduct`
  throw a JS exception (which traps WASM) when the budget is
  exhausted. The instrumentation supports this trivially; only the
  host-side counter logic changes.
- **Internal calls.** All single-function mutators in v0 today,
  but a real probe should at least error gracefully on multi-
  function modules. This MVP does (refuses).

## Falsifiers

- **F-INSTR-1:** If the body fuel reported by the instrumented module
  differs from `fuel_v1 - C_apply_base` for any row, the
  instrumenter and the static meter disagree on the cost table for
  some op in the MVP-supported subset. This is strong evidence for
  a bug in one of them.
- **F-INSTR-2:** If the instrumented module fails to instantiate in
  V8 (Deno) at all, the WASM rewrite is producing structurally
  invalid bytes (LEB128, section ordering, type-index drift, etc.).
- **F-INSTR-3:** If `apply()` on the instrumented module produces
  output bytes that differ from `apply()` on the original module
  (when run with the same inputs), instrumentation altered
  observable mutator semantics, which it must not.
