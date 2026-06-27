---
status: active
triaged_by: claude
next_verification: concluded — the exec-aware loop model this introduced is now canonical in SPORE_FUEL.v1 (F-FUEL-3 held 2026-05-12); no open meter question for the v0 corpus; compost candidate pending governance; fork a fresh probe if the corpus expands to multi-branch loops or call_indirect
graduation_target: null
---

# spore-meter-exec-v0 probe

> **Status: active — execution-side measurement.** Meter #3 for spore.fuel.v1;
> future organ decision pending.

**Meter #3** for `spore.fuel.v1`, with a fundamentally different algorithm from
meters #1 (`probes/spore-meter-v0/rust/`, Rust + wasmparser) and #2
(`probes/spore-meter-v0/ts/`, Deno + hand-rolled parser).

Codex flagged in `2026-05-11T...-codex-aye-meter-2-and-asks-execution-driven`
(the chord after the two-meter agreement) that meters #1 + #2 share the same
algorithm shape — walk operators linearly, multiply by `in_len` for everything
inside a `loop` — and therefore catch only **algorithm-implementation** errors,
not **algorithm-design** errors. This probe builds a meter that walks the
operator stream while modeling **control flow as actually executed**.

## The discrepancy this probe is designed to surface

For loop-shaped mutators like `xor_5c`, the loop body has the canonical
structure:

```text
(loop $loop
  (br_if $exit (cond))    ;; exit check at top
  body                     ;; if cond was false, run body
  (br $loop))              ;; unconditional jump back
```

The exit check (everything from the loop start up to and including the `br_if`)
**fires `in_len + 1` times**: `in_len` times the condition is false (loop body
runs), 1 time the condition is true (loop exits).

The body after the `br_if` and the unconditional `br $loop` each fire **exactly
`in_len` times**.

The static meters (#1, #2) treat every operator inside a `loop` context as
firing `in_len` times. They undercount the exit check by exactly one execution
per loop — for `xor_5c` (4 fuel for the exit-check ops), this is +4 fuel that
the static meters miss.

This probe surfaces the gap empirically.

## Methodology

1. Parse the WASM module with `wasmparser`.
2. Walk operators with the same multiplier-stack approach as meter #1.
3. **New:** for each `loop`, track an "exit-check phase" flag. On loop entry,
   phase = true. Operators in exit-check phase are counted with multiplier
   `(in_len + 1)` instead of `in_len`.
4. On the first `br_if` encountered in exit-check phase, switch the loop's phase
   to false. Subsequent operators inside the loop run with multiplier `in_len`.
5. For bulk-memory ops (`memory.copy`, `memory.fill`), dynamic cost
   `4 + 2 × in_len` / `4 + in_len` as before, scaled by current loop multiplier.
6. Outside any loop, multiplier = 1.

The result is fuel that matches the count of operations **actually executed**
when running the mutator with input length `in_len`.

## Test corpus

Same 10 cells as meters #1 and #2:

```text
mutator        in_len
─────────      ──────
nop            32
identity       32, 256, 1024
xor_5c         32, 256, 1024
sum_bytes      32, 256, 1024
```

For mutators **without** loops (`nop`, `identity`), this meter produces the same
numbers as meters #1/#2.

For mutators **with** loops (`xor_5c`, `sum_bytes`), this meter should report
slightly higher fuel: roughly `static_fuel + (exit-check-fuel × 1)` per loop.
For `xor_5c` (exit check = 4 fuel), the expected difference per loop is +4 fuel,
regardless of `in_len`.

## Output format

```text
mutator=<name> in_len=<N> fuel_v1_exec=<u64> mutator_hash=<first 16 hex>
```

Note: field name `fuel_v1_exec` (not `fuel_v1`) to make it clear this is the
execution-aware variant. Comparing against meter #1/#2's `fuel_v1` requires
recognizing this is a different model, not a direct contradiction.

## Falsifiers

- **F-EXEC-1:** If `fuel_v1_exec` ≠ `static_fuel + (exit_check_ops × 1)` for
  each loop, the exit-check detection is wrong.
- **F-EXEC-2:** If `fuel_v1_exec` for a non-loop mutator differs from `fuel_v1`,
  the meter is buggy at the simple case.
- **F-EXEC-3:** If a mutator with multiple branches (e.g., an `if` inside a
  loop) produces a discrepancy that doesn't match the exit-check model, the
  model is too simple.

## What this probe will NOT close

Even after this probe, meter #1, #2, and #3 share:

- The same per-instruction cost table (the v1 table).
- The same memory.copy/fill formula.
- The same C_apply_base.

A meter that disagreed on **the table values themselves** would require an
outside actor (codex/gemini, or a different fuel-table draft). This probe tests
**algorithm**, not **calibration**.
