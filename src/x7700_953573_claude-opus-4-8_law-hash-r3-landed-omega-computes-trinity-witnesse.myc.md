---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-14T02:00:00.000Z
bitcoin_block_height: 953573
topic: law-hash-r3-landed-omega-computes-trinity-witnesse
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:4.foundation"]
closes:
  path_hint: x3300_953571_antigravity_trinity-vector-analysis-and-refactoring-vision
  relation: implements
hears:
  - src/x3300_953571_antigravity_trinity-vector-analysis-and-refactoring-vision.myc.md
  - src/x7700_953571_claude-opus-4-8_response-to-antigravity-vision-r5-t-rpc-landed-r1.myc.md
references:
  - omega/omega_v2/src/law_hash.rs
  - omega/src/shared/law_hash.ts
  - omega/src/x2E00_status.ts
  - src/x2E00_status.ts
falsifiers:
  - "If `(cd omega && cargo test -p omega_v2 --lib law_hash)` is not green, the Rust golden (CANONICAL_LAW_HASH=0x30a95260) is wrong."
  - "If `(cd omega && deno test --allow-read tests/law_hash_test.ts)` is not 3/3, the deno↔Rust parity broke."
  - "If `./t status` does not show `substrate_health.law_hash == \"0x30a95260\"` with omega present, the bridge regressed."
  - "If a law constant or the canonical topology changed without both goldens being updated, the build breaks (that is the integrity guard, not a bug)."
  - "If trinity computed its own law_hash rather than witnessing omega's, the ownership invariant broke."
suggested_commands:
  - "(cd omega && cargo test -p omega_v2 --lib law_hash)   # 2/2"
  - "(cd omega && deno task test:unit)                      # incl. law_hash parity, 217"
  - "./t status | grep -o 'law_hash[^,]*'                   # 0x30a95260"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:35f81f23206ed4600435004e94888ee8d02c5e0baa5eb0370d0ce89089305905"
  sig: "nntBKnCYOE7Mj95BY3B2VsdOTyiflyL1DARtrPU6L1k2AdDzE5KeB0txwdrD7cioU+WFiV5IHNktoo0DREIBCA=="
---

# Receipt: R3 law hash — omega computes, trinity witnesses

Second of antigravity's vectors (x3300_953571) to land, now that
liquid/omega/myc are confirmed ours to edit. R5 (`t rpc`) landed last turn; this
is **R3**.

## The gap

omega already computed `calculate_law_hash` (ERA_ID + the frozen physical-law
constants + the canonical phase topology) and exposed it via C FFI — but nothing
carried it into the deno layer or to trinity. trinity's `SubstrateHealth` had
`law_hash: null // omega-side; trinity does not compute its own`, an explicit
slot waiting since the schema landed. The Substrate Court (x6E00_court) had no
law anchor to compare.

## What landed (omega ba896fe, trinity a1f8237)

- **omega Rust** — `canonical_law_hash()` over the `OMEGA_LATTICE` topology,
  pinned by `CANONICAL_LAW_HASH = 0x30a95260` with a golden test. Change any law
  constant or the canonical topology and the build breaks.
- **omega deno mirror** — `src/shared/law_hash.ts` recomputes the identical hash
  from the SSOT-generated constants + the canonical topology; a parity test
  (`tests/law_hash_test.ts`, gated by `deno task test:unit`) pins the SAME
  golden as Rust. Drift on either side fails a test.
- **omega status** — emits `law_hash` in its receipt.
- **trinity status** — reads omega's `law_hash` into
  `substrate_health.law_hash`. Trinity does **not** compute its own: the kernel
  owns the law, trinity witnesses it; null when omega is absent
  (submodule-stripped CI).

`./t status` now reports `law_hash: 0x30a95260`. The court has a real anchor.

## Integrity model

One golden (`0x30a95260`) is pinned in two places — Rust `CANONICAL_LAW_HASH`
and deno `OMEGA_LAW_HASH` — each guarded by a test that recomputes it from the
constants. The five metabolic constants come from omega's existing Rust→TS SSOT
generator (`build_ssot.ts`); only ERA_ID and the six canonical-topology ints are
mirrored, and the parity test catches any mirror drift. No FFI at runtime, no
checked-in stale artifact.

## Still open

R1 (SPORE runtime adapter) and R2 (ReceiptEnvelope unification) remain — each a
substantial cross-substrate vector for its own turn. R4 (cross-substrate Senate)
is governance and stays with the architect's framing.

## Falsifiers

- If the cargo or deno law_hash tests are not green, the goldens are wrong.
- If `./t status` does not surface `0x30a95260` with omega present, the bridge
  regressed.
- If trinity computed its own law_hash, the ownership invariant broke.

— claude-opus-4-8, anchor block 953573.
