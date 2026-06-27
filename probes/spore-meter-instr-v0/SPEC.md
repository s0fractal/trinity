---
status: active
triaged_by: claude
next_verification: concluded — F-FUEL-3 held: instrumented-WASM body fuel matches the exec-aware meter across all 10 corpus cells (Deno+V8 = wasmtime, 2026-05-12), closing the algorithm-class-independence gap SPORE_FUEL.v1 required; compost candidate pending governance; extend or fork if the corpus grows beyond the v0 subset
graduation_target: null
---

# spore-meter-instr-v0 probe (full v0 corpus: nop + identity + xor_5c + sum_bytes)

> **Status: active — instrumentation-side measurement.** Meter #4 for
> spore.fuel.v1; future organ decision pending.

**Meter #4** for `spore.fuel.v1`, fundamentally different in **algorithm class**
from meters #1, #2, #3.

Meters #1/#2/#3 are static walkers: they parse a mutator's WASM, multiply
per-instruction costs by predicted iteration counts, and output a predicted fuel
total **without executing** the mutator.

This probe is **Option B from `contracts/SPORE_FUEL.v1.draft.md` §"Software
meter specification"** — a WASM-to-WASM instrumenter. It rewrites a mutator so
that the rewritten module, **when actually executed**, deducts ATP from a host
counter via an imported `spore.deduct(i32)` function. The fuel total is whatever
the host counter accumulates by the time `apply()` returns.

This closes two real gaps the contract identifies:

1. V8/Deno has no engine fuel API. Wasmtime's `consume_fuel(true)` is
   engine-specific. An instrumented module produces fuel accounting **inside the
   WASM bytecode**, so V8 and any other engine can run it.
2. Meters #1/#2/#3 share the same algorithm-design (linear walk with
   iteration-count multipliers). Per the contract, "algorithm-design
   independence remains untested." This probe uses a fundamentally different
   algorithm: instrument once, execute, measure. Disagreement between this and
   meter #3 surfaces either a cost-table bug or a walker bug; agreement is much
   stronger evidence than agreement between #1 and #2.

## Scope

Single-function v0 mutators with the v0 consensus instruction subset, including
loops via `block` / `loop` / `if` / `else` / `br` / `br_if`. Current corpus:

- `nop` — single BB
- `identity` — single BB with `memory.copy` (dynamic per-byte cost)
- `xor_5c` — `block { loop { br_if; body; br } }`, 7 BBs
- `sum_bytes` — same shape, 7 BBs

Still refused (out of scope):

- Internal `call` (no v0 mutator uses it today)
- `call_indirect` (banned in v0)
- `br_table` (1+N cost, not yet handled)
- Banned f32 / f64 / SIMD ops
- Pre-existing imports (would require accumulating index-shift math)

When refused, the instrumenter errors clearly rather than silently emitting
incorrect instrumentation.

## Instrumentation strategy

For each function body in the input mutator:

1. Split the operator stream into **basic blocks** (BBs). A BB ends at every
   control-flow op: `block` / `loop` / `if` / `else` / `end` / `br` / `br_if` /
   `br_table` / `return` / `unreachable` / `call`.
2. Compute static fuel for each BB as the sum of v1 costs of every op in the BB.
   `memory.copy` / `memory.fill` contribute only their fixed cost of 4 here;
   their dynamic per-byte cost is charged separately.
3. Add one scratch i32 local (preserved on top of any existing locals).
4. Emit BB-entry charge `i32.const <bb_cost>; call $deduct` at the **start** of
   each BB whose cost > 0. Charges of 0 are skipped (they would be dead bytes in
   unreachable BBs and structurally fine but pointless).
5. Immediately before any `memory.copy`, insert dynamic charge:
   - `local.tee $scratch` (save length, leave on stack)
   - `local.get $scratch` (duplicate)
   - `i32.const 2; i32.mul` (compute `2 * length`)
   - `call $deduct` (charge dynamic per-byte) Stack ends with
     `[dst, src, length]` ready for `memory.copy`.
6. Similarly for `memory.fill`: dynamic cost is `1 * length`. Same tee/get/call
   pattern without the `i32.const 2; i32.mul` step.

### Why the exit-check fires N+1 times automatically

In WASM, a `br $loop` (where `$loop` is a `loop` label) resumes execution at the
instruction immediately after the `loop` opcode. The BB-entry charge for the
exit-check phase sits exactly at that position, so the charge fires every time
control re-enters the loop — `N` body iterations plus `1` final iteration that
hits the exit branch = `N + 1`. The loop-body BB starts right after the `br_if`,
so its charge fires `N` times. This matches meter #3's canonical exec-aware
model by construction; no special-case code in the instrumenter is needed.

Module-level changes:

- Add a type `(func (param i32))` to the type section.
- Add an import `(import "spore" "deduct" (func (type N)))`, where N is the new
  type index. This becomes function index 0, shifting all original function
  indices by +1.
- Update the export section: any `(export "X" (func K))` becomes
  `(export "X" (func K+1))`.
- No internal `call` instructions exist in these mutators, but if any did, every
  `call N` in the code section would need to become `call (N+1)`.

## Expected output

The host counter, after `apply()` returns, must equal the **body fuel** computed
by meter #3 — i.e., `fuel_v1` minus `C_apply_base` (which is 5 for argc=1;
charged by the host's apply boundary, not by the mutator's WASM).

```text
mutator=nop       in_len=32   body_fuel_instr=1
mutator=identity  in_len=32   body_fuel_instr=72
mutator=identity  in_len=256  body_fuel_instr=520
mutator=identity  in_len=1024 body_fuel_instr=2056
mutator=xor_5c    in_len=32   body_fuel_instr=679
mutator=xor_5c    in_len=256  body_fuel_instr=5383
mutator=xor_5c    in_len=1024 body_fuel_instr=21511
mutator=sum_bytes in_len=32   body_fuel_instr=555
mutator=sum_bytes in_len=256  body_fuel_instr=4363
mutator=sum_bytes in_len=1024 body_fuel_instr=17419
```

Closed-form: `xor_5c body = 7 + 21·N`, `sum_bytes body = 11 + 17·N`, both linear
in `N` as expected from the exec-aware fuel model.

`run.sh` performs three diffs: deno (V8) vs expected, wasmtime vs expected, deno
vs wasmtime. Exits green only when all three pass.

## What this probe still does NOT close

- **Trap-on-budget.** This probe only counts; it does not enforce a budget by
  trapping. A follow-up extension can have `deduct` throw / return a trap when
  the budget is exhausted. The instrumentation supports this trivially; only the
  host-side counter logic changes.
- **Internal `call`** and **`br_table`** are not yet handled.
- **Multi-function modules** would need function-index-shift accounting in
  `call` instructions; refused for now.

## Falsifiers

- **F-INSTR-1:** If the body fuel reported by the instrumented module differs
  from `fuel_v1 - C_apply_base` for any row, the instrumenter and the static
  meter disagree on the cost table for some op in the MVP-supported subset. This
  is strong evidence for a bug in one of them.
- **F-INSTR-2:** If the instrumented module fails to instantiate in V8 (Deno) at
  all, the WASM rewrite is producing structurally invalid bytes (LEB128, section
  ordering, type-index drift, etc.).
- **F-INSTR-3:** If `apply()` on the instrumented module produces output bytes
  that differ from `apply()` on the original module (when run with the same
  inputs), instrumentation altered observable mutator semantics, which it must
  not.
