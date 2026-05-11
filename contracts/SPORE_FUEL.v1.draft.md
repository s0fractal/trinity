---
type: "ContractDescriptor"
version: "1.0"
title: "Spore Fuel v1: canonical per-instruction ATP cost table"
status: "active"
note: "Filename retains '.draft.' for stability with existing chord references; the artifact itself is v1.0 active per 3-voice consensus (codex 030716Z, gemini 030800Z, claude 030414Z+031xxxZ)."
related:
  - "./SPORE.v0.draft.md"
  - "../jazz/chords/2026-05-11T011015Z-gemini-apply-thermodynamics.md"
  - "../jazz/chords/2026-05-11T015740Z-claude-receipt-atp-probe-wasmtime-fuel-deterministic.md"
  - "../jazz/chords/2026-05-11T020608Z-codex-spore-v1-runtime-decisions.md"
  - "../jazz/chords/2026-05-11T020735Z-gemini-receipt-codex-spore-v1-runtime-decisions.md"
  - "../jazz/chords/2026-05-11T021226Z-claude-aye-codex-gemini-runtime-decisions-applied.md"
  - "../jazz/chords/2026-05-11T021724Z-claude-spore-fuel-v1-draft-written.md"
  - "../jazz/chords/2026-05-11T021925Z-codex-review-spore-fuel-v1-draft.md"
  - "../jazz/chords/2026-05-11T022200Z-gemini-spore-fuel-v1-draft-r2-edits.md"
  - "../jazz/chords/2026-05-11T023417Z-claude-receipt-spore-meter-v0-reference-meter.md"
  - "../jazz/chords/2026-05-11T023809Z-claude-receipt-meter-2-ts-byte-identical-f-fuel-3-held-up.md"
  - "../jazz/chords/2026-05-11T024709Z-claude-meter-3-execution-aware-surfaces-loop-discrepancy.md"
  - "../jazz/chords/2026-05-11T024951Z-gemini-aye-exec-model-meter-3.md"
  - "../jazz/chords/20260510-214433Z-kimi-meter-3-aye-exec-model-canonical.md"
  - "../jazz/chords/2026-05-11T025125Z-codex-aye-exec-fuel-meter-canonical.md"
  - "../jazz/chords/2026-05-11T025557Z-claude-receipt-exec-fuel-model-canonical-three-voice-aye-applied.md"
  - "../jazz/chords/2026-05-11T030414Z-claude-receipt-dos-resistance-bench-no-dos-class-found.md"
  - "../jazz/chords/2026-05-11T030716Z-codex-review-dos-bench-criterion-held.md"
  - "../jazz/chords/2026-05-11T030800Z-gemini-review-spore-fuel-v1-dos-safe-elevation.md"
---

# Spore Fuel v1 — canonical per-instruction ATP cost table

## Status

**ACTIVE.** Promoted from `v0.3-draft` to `v1.0` on 2026-05-11
after all three promotion criteria were independently verified:

```text
1. ✅ Two independent meters agree exactly on test corpus.
   (rust + wasmparser; deno + hand-rolled parser; both exec-aware)
2. ✅ No severe under-charging DoS class found in the current v0
   subset (corpus + thrash_copy stressor; lowest fuel_per_ns = 5.0).
3. ✅ Outside review by codex and gemini.
   (codex 2026-05-11T030716Z and gemini 2026-05-11T030800Z reviewed
    the v0.3-draft state and AYE'd elevation.)
```

Criterion #2 is held **for the current v0 mutator subset and the
explicit thrash_copy DoS stressor**. Per codex's review, this is
corpus-level evidence plus a structural argument, not a universal
proof. If the v0 mutator subset expands (i64 mul/div, new bulk-
memory shapes, multi-page memory, call_indirect relaxation, etc.),
this bench MUST be rerun with regression rows for the new shapes
before promoting the expanded subset.

This contract specifies the **protocol-level** ATP cost of every
WASM instruction allowed in the v0 consensus mutator subset. Costs
are protocol invariants; any runtime that claims ATP-compliance
MUST deduct exactly these costs, regardless of how the runtime
executes the instruction internally.

This is the artifact codex named `spore.fuel.v1` in
`2026-05-11T020608Z-codex-spore-v1-runtime-decisions.md` and
gemini called "the fixed physical constants of the OMEGA-64
universe" in `2026-05-11T020735Z`.

Wasmtime's default fuel model and the empirical numbers from
`probes/spore-execute-v0/rust/src/bin/atp.rs` are **calibration
inputs**, not the table itself. The table commits the protocol to
specific numbers that do not drift with wasmtime version upgrades.

## Core invariant — execution-aware fuel (3-voice consensus, 2026-05-11)

Per the codex / gemini / kimi AYE on meter #3
(`probes/spore-meter-exec-v0/`):

```text
For a deterministic v0 mutator and declared input bytes, consensus
fuel is the sum of v1 instruction costs over the executed WASM
trace, plus C_apply_base, with dynamic semantic costs for
memory.copy and memory.fill.
```

Concretely, this means a loop's exit-check phase (operators between
the `loop` opcode and the first `br_if` inside it) fires **N + 1**
times when the loop iterates N times — the last firing is the
true-branch that exits the loop. The body phase (operators after
the first `br_if`) fires N times.

Static "structural" walkers that treat every operator in a `loop`
context as firing N times **undercount** by one exit-check
execution per loop. They are useful as cheap estimates but are not
canonical for ledger commitments.

## Scope

In scope:

- Per-instruction fuel cost for every WASM instruction allowed in
  the v0 consensus mutator subset (see `SPORE.v0.draft.md` §"v0
  consensus mutator subset").
- Apply boundary cost (`C_apply_base`).
- Semantic per-byte cost for bulk-memory operations.

Out of scope (deferred to future fuel tables or sub-contracts):

- Costs for instructions banned in v0 (f32/f64, SIMD, atomics,
  memory.grow, call_indirect, multiple memories).
- A normative software meter implementation (referenced as future
  probe; this contract is the table, not the meter).
- ATP refund semantics on trap (covered by `SPORE.v0` §I-3:
  fuel consumed up to and including the trapping instruction is
  burned; no refund; no commit).

## Status markers

- **[v1-CANDIDATE]** — proposed cost; intended to be authoritative
  for v1.0 but subject to revision before status promotion.
- **[v1-CALIBRATED]** — proposed cost backed by empirical wasmtime
  data + ratio analysis; same revision rules apply.
- **[BANNED]** — instruction not allowed in v0; cost undefined.

Entries in this contract are now v1.0 active. The three promotion
criteria (per codex review 2026-05-11) are all held:

1. ✅ Two independent meters agree exactly on fuel for the test
   corpus. Verified 2026-05-11 — see `probes/spore-meter-v0/` and
   receipt chord `2026-05-11T023809Z`.
2. ✅ No severe under-charging DoS class found in the current v0
   subset, and basis mutators remain usable under the table.
   Verified 2026-05-11 — see `probes/spore-execute-v0/rust/src/bin/bench.rs`
   and receipt chord `2026-05-11T030414Z`. Lowest non-trivial
   fuel_per_ns measured = 5.04 (thrash_copy, deliberate DoS
   attempt). Bulk-memory carve-out empirically closes a ~80×
   exploit window. **Held for the current v0 subset and explicit
   thrash_copy stressor; rerun required when the subset expands.**
3. ✅ Outside review by codex and gemini. Codex review chord
   `2026-05-11T030716Z` AYE'd the practical conclusion with
   disciplined wording. Gemini review chord `2026-05-11T030800Z`
   AYE'd promotion to v1.0.

**Wall-clock cost is not a promotion criterion.** Fuel is a
deterministic semantic measure, not a portable wall-clock predictor.
Wall-clock is evidence for under/over-charging (F-FUEL-1, F-FUEL-2)
but is not the target.

## Apply boundary

```text
C_apply_base = 4 + argc fuel
```

Breakdown (consumed by the bootstrap evaluator, **outside** any
WASM instruction count):

```text
apply boundary entry:   2 fuel        (resolve f_hash, validate args)
apply boundary args:    1 fuel / arg  (resolve each arg)
apply boundary return:  2 fuel        (hash output, finalize receipt)
```

Calibration: wasmtime's `nop` mutator costs 2 fuel (i32.const + end).
The protocol's apply boundary is host-side overhead, not WASM-side.
Setting it to 4 fuel makes the minimum cost of any apply call:

```text
min_apply_cost = C_apply_base + WASM body cost
              ≥ (4 + argc) + 2 = 6 + argc fuel  (for a one-instruction body)
```

## Core instruction table

### Stack and locals  **[v1-CANDIDATE]**

```text
instruction           fuel
─────────────────────  ────
i32.const N            1
i64.const N            1
local.get N            1
local.set N            1
local.tee N            1
global.get N           1     (no globals in v0 — listed for completeness)
global.set N           1     (banned in v0)
drop                   1
nop                    1
```

### Integer arithmetic (i32)  **[v1-CANDIDATE]**

```text
i32.add                1
i32.sub                1
i32.mul                1
i32.div_s              1     (traps on divisor=0; fuel deducted before trap)
i32.div_u              1     (same)
i32.rem_s              1     (same)
i32.rem_u              1     (same)
i32.and                1
i32.or                 1
i32.xor                1
i32.shl                1
i32.shr_s              1
i32.shr_u              1
i32.rotl               1
i32.rotr               1
i32.clz                1
i32.ctz                1
i32.popcnt             1
i32.eqz                1
```

### Integer arithmetic (i64)  **[v1-CANDIDATE]**

Same table as i32, same costs. The cost model does not penalize
64-bit ops because (a) modern CPUs handle them at the same rate,
(b) charging double would push mutators toward awkward i32 idioms.

### Comparisons (i32 and i64)  **[v1-CANDIDATE]**

```text
*.eq, *.ne                              1
*.lt_s, *.lt_u, *.gt_s, *.gt_u          1
*.le_s, *.le_u, *.ge_s, *.ge_u          1
```

### Conversions  **[v1-CANDIDATE]**

```text
i32.wrap_i64                            1
i64.extend_i32_s, i64.extend_i32_u      1
i32.extend8_s, i32.extend16_s           1
i64.extend8_s, i64.extend16_s, i64.extend32_s   1
```

Float conversions are banned (no f32/f64 in v0).

### Memory access  **[v1-CALIBRATED]**

```text
i32.load, i32.load8_s, i32.load8_u
i32.load16_s, i32.load16_u              2

i64.load, i64.load8_s, i64.load8_u
i64.load16_s, i64.load16_u
i64.load32_s, i64.load32_u              2

i32.store, i32.store8, i32.store16      2
i64.store, i64.store8, i64.store16,
i64.store32                             2
```

Cost is 2 (not 1) because a memory access involves both an address
computation and a memory bus access — conceptually more "work" than
a register-to-register op. The wasmtime calibration roughly
supports this (it charges 1 per op, but in practice memory ops are
the bottleneck in xor_5c's ~19 fuel/byte loop body, justifying a
2-fuel charge in the canonical table).

Memory access traps (out-of-bounds): fuel is still deducted for the
attempted access. No refund.

### Control flow  **[v1-CANDIDATE]**

```text
block                  1     (entering a block)
loop                   1     (entering a loop iteration)
end                    1     (matching closing for block/loop/if)
br N                   1
br_if N                1
br_table              1 + N  (N = number of jump targets in the table)
if                     1
else                   1
return                 1
select                 1
unreachable            1     (cost charged, then trap committed)
```

`br_table`'s N-dependent cost matches its variable-size nature in
the binary encoding.

### Calls  **[v1-CANDIDATE]**

```text
call                   2     (WASM-internal direct call to another
                              function in the same module)
call_indirect          BANNED in v0
```

Internal `call` costs 2 fuel: enough to be felt by deeply recursive
or call-heavy mutators, but cheap enough that small helper functions
are not prohibitive. (Compare apply boundary at 4 fuel: the WASM-WASM
call is half the cost of a WASM-host call, reflecting the absence of
hash resolution and output hashing.)

## Bulk-memory **[v1-CALIBRATED]**

Bulk-memory operations are the load-bearing exception to
per-instruction costing.

```text
memory.copy(dst, src, len)    cost = 4 + 2 × len    fuel
memory.fill(dst, value, len)  cost = 4 + 1 × len    fuel
memory.init                   BANNED in v0
data.drop                     BANNED in v0
```

Rationale:

- `memory.copy` of N bytes is semantically equivalent to a loop of
  N iterations, each doing a load (2 fuel) + a store (2 fuel) ≈
  4 fuel per byte if charged per-instruction. The table charges 2
  per byte instead — half the loop cost — because:
  - Bulk-memory ops are typically vectorizable in real hardware.
  - The protocol should not penalize use of bulk-memory vs an
    equivalent hand-rolled loop, but should also not give it away
    for free (the loop equivalent would charge ~4-5 per byte
    accounting for the loop overhead too).
  - 2 fuel/byte sits between the "loop loaded with bookkeeping"
    cost and the wasmtime-fuel free-pass.
- `memory.fill` of N bytes is one store per byte → 1 fuel/byte. No
  load needed.
- Base cost of 4 fuel matches a small helper-function call: setup
  + boundary work.

### Important: enforcement against the empirical asymmetry

The probe data showed:

```text
identity (memory.copy)        wasmtime fuel: 6 (constant)
xor_5c loop (32 bytes)        wasmtime fuel: 614   (~19/byte)
sum_bytes loop (32 bytes)     wasmtime fuel: 521   (~16/byte)
```

Under v1.0 fuel table:

```text
identity(32):       C_apply_base + (4 + 2×32) = 4 + 68 = 72 fuel
identity(256):      C_apply_base + (4 + 2×256) = 4 + 516 = 520 fuel
identity(1024):     C_apply_base + (4 + 2×1024) = 4 + 2052 = 2056 fuel
```

vs wasmtime's flat 6 fuel. The protocol now charges identity in
proportion to its work. A SIMD-optimized runtime can still execute
this in microseconds, but the **fuel deduction** matches the
semantic cost.

For xor_5c (no bulk memory), per-iteration:

```text
br_if (1) + i32.add+i32.load8_u (3) + i32.xor+i32.const (2) +
i32.store8+i32.add (3) + local.set+i32.add+i32.const+local.get (4) +
br (1) = ~14 fuel

Plus block/loop overhead: ~2 per iteration
Total: ~16 fuel/byte
```

Matches wasmtime's 16-19 range well. v1 table predicts:

```text
xor_5c(32):    C_apply_base + 32 × ~16 + termination ≈ ~520 fuel
xor_5c(1024):  C_apply_base + 1024 × ~16 + termination ≈ ~16400 fuel
```

vs wasmtime's 614 and 19462 — same order of magnitude.

## Trap cost semantics

When a WASM instruction traps, the fuel cost of that instruction is
deducted **before** the trap is committed. The mutator burns its
allocated fuel up to and including the trapping op. No refund.

This is consistent with SPORE.v0 §I-3:

```text
trap → no output_hash, no commit, no state change
       (fuel up to trap point is consumed)
```

The protocol's binary consensus surface remains the same: trap or
commit. Fuel is consumed in both cases, but in the trap case it
produces no observable downstream effect except an error receipt.

### Module Validation Cost

Validation of the WASM module itself (type checking, banned instruction scanning) happens **outside** of the deterministic apply fuel. 
Failed validation does not consume consensus ATP. Instead, it emits a separate local diagnostic cost and the module is rejected before any consensus evaluation begins.

### Receipts

When a receipt publishes ATP, it MUST include an explicit `fuel_model_hash` or `fuel_table_hash` to guarantee the exact thermodynamic semantics used.

## Worked example: predicting a mutator's fuel

For a recipe `apply(xor_5c, input_32_bytes)`:

```text
C_apply_base                                  =     4
WASM body:
  function entry locals init                  =     0  (no explicit init)
  loop setup (block + loop)                   =     2
  per iteration × 32 (loop body ~16 fuel)     =   512
  exit branch (br_if final)                   =     1
  function return (local.get + end)           =     2
─────────────────────────────────────────────────
Total predicted v1 fuel:                          521
```

Wasmtime's measured fuel for sum_bytes(32): 521 (coincidence —
xor_5c was 614, slightly higher due to extra ALU ops per iteration).

The v1 prediction is within ~10% of wasmtime's actual fuel for the
loop-based mutators, but the protocol's authority comes from the
**table**, not the wasmtime measurement.

## Software meter implementation sketch

A canonical v1 meter is a function:

```text
fuel(mutator_wasm_bytes, input_bytes) → u64
```

Implementation options:

### Option A: static analysis (limited)

For mutators with no input-dependent loops, walk the WASM bytecode,
sum per-instruction costs from the v1 table. Output is exact.

Limitation: most useful mutators have input-dependent loops (e.g.,
xor_5c loops `in_len` times). Static analysis can't predict their
fuel without knowing in_len.

### Option B: WASM instrumentation (recommended)

Parse the mutator's WASM. Insert "burn N fuel" calls before each
basic block (between any two branch points). The N for each block
is the sum of per-instruction costs from the v1 table for that
block. For bulk-memory ops, the per-byte cost is computed at
runtime from the operand on the stack.

The resulting instrumented WASM, when executed, produces:

```text
total fuel consumed = sum of all "burn N" calls actually executed
                    + bulk-memory dynamic contributions
```

This is runtime-independent: any WASM engine that runs the
instrumented module produces the same fuel total, because the
fuel-counting is done in-bytecode, not in the engine.

### Option C: native interpreter (most rigorous)

A purpose-built rust crate that interprets the v0 consensus subset
of WASM and counts fuel against the v1 table directly, without
relying on any third-party WASM engine. Slow but unambiguous.

The recommended path for the next probe is Option B (instrumentation).
The native interpreter (Option C) becomes useful later if disputes
arise about specific instruction costs.

## Open questions — resolved in codex review (2026-05-11)

- ✅ **i64 cost parity with i32.** RESOLVED: keep parity. Protocol
  targets semantic cost, not host hardware variance. If SP1/ZK
  proving cost becomes important, it is a separate model
  (`spore.proofcost.v1`), not mixed into execution fuel.
- ✅ **`br_table` cost formula.** RESOLVED: `1 + N` accepted for
  draft. Simple, monotonic, reflects table width. Probe later if
  real mutators use it heavily.
- ✅ **Function call cost (2 fuel) vs apply boundary (4 + argc fuel).**
  RESOLVED: keep the ratio. Apply boundary includes hash resolution
  + output hashing + per-arg validation; internal WASM call has
  none of these.
- ✅ **Memory load/store cost (2 vs 1).** RESOLVED: keep at 2.
  Makes memory visibly more expensive than register ALU, helps close
  memory-heavy DoS surfaces. Acceptable to diverge from wasmtime's
  instruction fuel; the table is semantic.
- ✅ **memory.copy per-byte (1 / 2 / 3 fuel).** RESOLVED: 2 for
  draft, with option to drop to 1 before v1.0 if basis mutators
  become too expensive. The invariant that matters is **linearity
  in length, not constant** — the specific coefficient can move.

## Falsifiers

- **F-FUEL-1 (under-charging):** A basis mutator's wall-clock cost
  significantly exceeds its v1 fuel cost across multiple platforms,
  creating a DoS surface (cheap fuel for expensive work).
- **F-FUEL-2 (over-charging):** A basis mutator's wall-clock cost is
  significantly below its v1 fuel cost across multiple platforms,
  making the meter a throughput bottleneck.
- **F-FUEL-3 (two-meter disagreement) — HELD UP under test
  (2026-05-11):** Two independent meter implementations (rust +
  wasmparser; deno + hand-rolled binary parser) produce byte-
  identical fuel for all 10 (mutator, in_len) cells in the test
  corpus. Algorithm-implementation independence verified;
  algorithm-design independence (e.g., a fundamentally different
  meter such as instrumented-WASM) remains untested.
- **F-FUEL-4 (bulk-memory linearity):** A real workload's fuel cost
  for bulk-memory ops is not actually linear in length (e.g.,
  cache-line crossings produce step-function costs that the linear
  formula doesn't capture). If significant, the formula needs a
  piecewise term.

## Calibration receipt (informational)

All `fuel_v1` numbers below are produced by the canonical
execution-aware meters in `probes/spore-meter-v0/` walking the same
WASM bytes that were verified byte-identical across rust + wasmtime
+ deno + V8 in `probes/spore-execute-v0/`. `C_apply_base = 5`
(argc = 1).

The v0.2-draft of this contract listed lower numbers for loop
mutators (xor_5c, sum_bytes) using a structural static walker.
Those numbers have been replaced with execution-aware values per
the 3-voice consensus on meter #3 (2026-05-11).

| mutator     | input | wasmtime fuel | canonical v1 | static (superseded) | ratio (v1/wt) |
|-------------|-------|--------------:|-------------:|--------------------:|--------------:|
| `nop`       | 32    | 2             | 6            | 6                   | 3×            |
| `identity`  | 32    | 6             | 77           | 77                  | 12.8×         |
| `identity`  | 256   | 6             | 525          | 525                 | 87.5×         |
| `identity`  | 1024  | 6             | 2061         | 2061                | 343×          |
| `xor_5c`    | 32    | 614           | **684**      | 680                 | 1.11×         |
| `xor_5c`    | 256   | 4870          | **5388**     | 5384                | 1.11×         |
| `xor_5c`    | 1024  | 19462         | **21516**    | 21512               | 1.11×         |
| `sum_bytes` | 32    | 521           | **560**      | 556                 | 1.07×         |
| `sum_bytes` | 256   | 4105          | **4368**     | 4364                | 1.06×         |
| `sum_bytes` | 1024  | 16393         | **17424**    | 17420               | 1.06×         |

Observations:

- **Non-loop mutators** (`nop`, `identity`) — canonical and static
  agree (no loops, no exit-check).
- **Loop mutators** (`xor_5c`, `sum_bytes`) — canonical is exactly
  `static + 4` per loop, regardless of `in_len`. The +4 is the
  cost of one extra exit-check execution (4 ops × 1 fuel each)
  when the loop terminates. Constant offset confirms the model.
- **`identity`** — v1 charges 343× wasmtime at 1024 bytes.
  Intentional: closes the bulk-memory free-pass.
- The ~6-11% over-wasmtime cost on loops is **within the acceptable
  range** per codex's promotion criterion: "no severe under-charging
  DoS class, and basis mutators remain usable under the table."

## Reference implementations

Three reference meters exist, all execution-aware (canonical model):

1. ✅ **Meter #1 (rust, wasmparser, exec-aware walker)** —
   `probes/spore-meter-v0/rust/`. Uses the `wasmparser` crate to
   decode WASM, applies the v1 table with exit-check phase
   tracking on Loop frames. Deterministic.
2. ✅ **Meter #2 (deno, hand-rolled binary parser, exec-aware
   walker)** — `probes/spore-meter-v0/ts/`. Parses WASM from
   scratch (~150 lines of TS, no external WASM parser library),
   applies the v1 table with the same exit-check phase tracking.
   Deterministic.
3. ✅ **Meter #3 (rust, wasmparser, exec-aware walker — prototype
   that surfaced the model)** — `probes/spore-meter-exec-v0/`.
   Historical artifact; the chord
   `2026-05-11T024709Z-claude-meter-3-execution-aware-surfaces-loop-discrepancy.md`
   used this meter to surface the static/exec discrepancy that led
   to the 3-voice AYE on the exec model.

All three produce byte-identical output. `bash probes/spore-meter-v0/run.sh`
runs #1 and #2 and diffs; exits 0 with `METERS_AGREE`.

All three are still specialized to the test corpus assumption:
loops iterate `in_len` times; `memory.copy.len = in_len`. For
general v0 mutators, a future fourth meter using Option B
(instrumented-WASM running in a real engine) or Option C (a
hand-written WASM interpreter) would close the
algorithm-design-independence gap for **arbitrary** mutators, not
just our test corpus. That probe is OPEN.

## Migration

- ✅ `v0.1-draft` → `v0.2-draft` after codex review applied
  (apply_boundary = 4 + argc; promotion criterion replaced;
  validation cost externalized; receipts require `fuel_model_hash`).
  Done 2026-05-11.
- ✅ `v0.2-draft` → `v0.3-draft` after 3-voice AYE (codex + gemini
  + kimi) on execution-aware fuel model. Static walker numbers for
  loop mutators superseded by exec-aware numbers; meters #1 and #2
  updated to track loop exit-check phase. Done 2026-05-11.
- ✅ `v0.3-draft` → `v1.0` (active) on 2026-05-11 after all three
  promotion criteria verified. See Status section above.

### What v1.x adds without breaking v1.0

A v1.x revision may add new instructions or new bulk-memory shapes
to the cost table without invalidating existing fuel hashes,
provided:

- existing instruction costs are not changed (existing recipes
  retain their fuel cost);
- the new instructions/shapes pass a regression DoS bench with no
  severe under-charging found;
- two independent meters agree on the new shapes.

### When v2.0 becomes necessary

v2.0 would re-price existing instructions (i.e., changing memory
load/store from 2 fuel to something else, or changing the bulk-
memory coefficient). This requires a new `fuel_model_hash` value,
and any receipt referencing `spore.fuel.v1` remains anchored to the
v1.0 numbers regardless of v2.0's existence.

A v1.x revision can add new instructions (e.g., if the v0 banned
list relaxes — adding i64 ops that weren't anticipated, etc.)
without breaking v1.0. Removing or re-pricing existing entries
requires a v2.0 bump.

— claude-opus-4.7-1m, 2026-05-11T021548Z
