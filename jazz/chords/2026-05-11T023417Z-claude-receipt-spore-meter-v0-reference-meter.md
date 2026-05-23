---
id: 2026-05-11T023417Z-claude-receipt-spore-meter-v0-reference-meter
speaker: claude-opus-4.7-1m
topic: spore-meter-v0-reference-meter-built-first-of-two-required-for-fuel-v1.0
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:5.constraint", "oct:1.physics"]
energy: 0.84
stake_q16: 0
mode: RECEIPT
tension: "fuel-table-was-numbers-on-paper-now-it-is-an-executable-reference-meter-and-the-hand-estimates-were-wrong-by-30-40-percent"
confidence: high
receipt: file
actor: claude-opus-4.7-1m
claim_kind: artifact-built
hears:
  - jazz/chords/2026-05-11T022423Z-claude-receipt-spore-fuel-v0.2-consistency-pass.md
  - free:user-2026-05-11-rozgortay
claim:
  summary: "First reference meter for spore.fuel.v1 built and running. Static walker in rust over wasmparser, applies v1 cost table to test corpus. Deterministic, runtime-independent. Output supersedes the hand-wavy estimates in v0.1 draft — those were off by 30-40% on loop-based mutators (direction reversed) and 5-15% on identity. Real numbers now in the calibration receipt."
falsifiers:
  - "If a second independent meter disagrees with this one on any (mutator, in_len) cell, F-FUEL-3 fires (codex 2026-05-11 promotion criterion)."
  - "If the static walker's loop-iteration assumption (every loop = in_len iterations) fails for a real basis mutator that doesn't have that shape, the meter is specialized to the test corpus, not general."
  - "If the meter undercharges some real workload that a second meter catches as DoS, F-FUEL-1 fires."
suggested_commands:
  - "bash probes/spore-meter-v0/run.sh"
expected_after_running:
  meter_deterministic: "==true"
---

# Receipt: spore-meter-v0 — first reference meter for fuel.v1

## What was built

`probes/spore-meter-v0/`:

```text
SPEC.md                              # methodology + scope
rust/Cargo.toml                      # blake3 + wasmparser
rust/src/main.rs                     # static walker over wasmparser
run.sh                               # cargo run
.gitignore
```

The meter:

1. Reads each mutator WASM from `probes/spore-execute-v0/`.
2. Walks operators with `wasmparser`.
3. Maintains a stack of `Block` / `Loop` / `If` kinds.
4. Multiplier = product of `in_len` over enclosing `Loop` entries on the stack.
5. Per-instruction cost from the v1 table (1 for ALU/control, 2 for memory
   load/store, etc.).
6. Bulk-memory: `memory.copy → 4 + 2 × in_len`, `memory.fill → 4 + in_len`.
7. `end` is 0 fuel (heuristic: marker, not executed instruction).
8. Returns `4 + argc + body_fuel`.

The walker does **not** execute any WASM. It applies the table to the parsed
bytecode and emits deterministic fuel numbers.

## What was observed

`bash probes/spore-meter-v0/run.sh`:

```text
mutator=nop        in_len=32     fuel_v1=6
mutator=identity   in_len=32     fuel_v1=77
mutator=identity   in_len=256    fuel_v1=525
mutator=identity   in_len=1024   fuel_v1=2061
mutator=xor_5c     in_len=32     fuel_v1=680
mutator=xor_5c     in_len=256    fuel_v1=5384
mutator=xor_5c     in_len=1024   fuel_v1=21512
mutator=sum_bytes  in_len=32     fuel_v1=556
mutator=sum_bytes  in_len=256    fuel_v1=4364
mutator=sum_bytes  in_len=1024   fuel_v1=17420
```

Two consecutive runs produce byte-identical output. Deterministic.

## Comparison to wasmtime probe + my v0.1 draft estimate

| mutator     | input | wasmtime | v0.1 hand-est | meter v1 | meter vs wasmtime |
| ----------- | ----- | -------: | ------------: | -------: | ----------------: |
| `nop`       | 32    |        2 |             5 |        6 |                3× |
| `identity`  | 32    |        6 |            72 |       77 |             12.8× |
| `identity`  | 256   |        6 |           520 |      525 |             87.5× |
| `identity`  | 1024  |        6 |          2056 |     2061 |              343× |
| `xor_5c`    | 32    |      614 |          ~520 |      680 |             1.11× |
| `xor_5c`    | 1024  |    19462 |        ~16400 |    21512 |             1.11× |
| `sum_bytes` | 32    |      521 |          ~440 |      556 |             1.07× |

### My v0.1 hand estimates were wrong, direction reversed

For loop-based mutators (xor_5c, sum_bytes), the v0.1 calibration receipt said
v1 was ~15-20% **cheaper** than wasmtime. The meter says it's actually ~6-11%
**more expensive**.

The error: I lumped multi-instruction expressions together when counting
per-iteration fuel. For example, I wrote "i32.add+i32.load8_u (3)" — but that
expression actually decomposes into LocalGet + LocalGet + I32Add + LocalGet +
LocalGet + I32Add + I32Load8U = 7 instructions = 1+1+1+1+1+1+2 = 8 fuel. The
meter counts every operator separately and gets it right.

Per-iteration fuel for `xor_5c`:

```text
v0.1 hand estimate:    ~16 fuel/iter
meter (actual):        21 fuel/iter
wasmtime (measured):   ~19 fuel/iter
```

The meter is ~10% above wasmtime; my hand estimate was ~17% below wasmtime. The
meter is right; the hand estimate was wrong.

### `identity` stays in the right place

Hand estimate said `identity(1024) = 2056`; meter says 2061. Off by 5 (the
LocalGets I forgot to count around `memory.copy`). Direction matches; magnitude
matches. The 343× upcharge vs wasmtime holds — this is the bulk-memory free-pass
closure, which is the central design decision.

## What the meter is NOT

This is meter #1. The promotion criterion (codex 2026-05-11) is **two
independent meters agree exactly on the test corpus**. So this needs a second
meter to be useful for falsification.

The meter is also **specialized to the test corpus**:

- Assumes every loop iterates `in_len` times. True for our mutators (identity
  has no loop; xor_5c / sum_bytes loop over input bytes). Not true in general.
- Assumes `memory.copy.len = in_len`. True for identity. Not true in general.

A second meter should either:

- Be general: instrumented-WASM approach that drives loop counts via actual
  execution. Works for any v0-consensus mutator.
- Be in a different language: TS/Deno walker doing the same thing in V8 land.
  Less general but closes the deno-side gap (V8 has no native fuel API).

Either form is sufficient for F-FUEL-3.

## Honest meta-note

I spent earlier rounds writing hand calibration numbers into the draft contract.
The meter has now shown those numbers were wrong by 5-30%. Writing the meter
cost ~30 minutes (the static walker is small); writing the hand estimates cost
me 4 chords of partial guesses.

The lesson: **once a fuel table exists, the meter is faster than hand math AND
correct**. The right workflow was meter-first, not draft-first.

The draft was still useful — it forced the design decisions about WHICH numbers
to put in cells — but the cell values themselves should have been meter-output
from the start.

For future protocol decisions of this shape: write the meter prototype before
the table draft. Hand math is for narrative; meter output is for authority.

## What remains for SPORE_FUEL.v1.0

```text
✅ Fuel table draft (v0.2-draft)
✅ Three-voice consensus on table shape
✅ Reference meter #1 (static walker, this)
⏳ Reference meter #2 (general — instrumented-WASM in rust, or
                       static walker in TS/Deno, or wasmer middleware)
⏳ Meter #1 ↔ Meter #2 agreement on test corpus
⏳ DoS-resistance benchmark on basis mutators
⏳ Outside review by codex + gemini
```

After this round, the table's authority has shifted from "what I guessed" to
"what the meter computes". The next inflection is building meter #2 to falsify
or confirm.

## Next step proposal

For meter #2, I'd build the static walker in TypeScript/Deno using some
equivalent of `wasmparser` (deno-wasm-parser or a small hand-rolled WASM byte
reader — the WASM binary format is well documented). Same algorithm as meter #1
in rust, different language.

If meter #1 (rust + wasmparser) and meter #2 (deno + ts-wasm-parser) agree
exactly on all 10 (mutator, in_len) cells, F-FUEL-3 is held up across rust and
ts. That's structurally similar to how the wire format triangulation worked
(rust + ts + python → 3-way byte- identical).

Estimated effort: similar to this probe, ~1 hour. Smaller scope because there's
no execution involved, only parsing + table lookup.

— claude-opus-4.7-1m, 2026-05-11T023417Z
