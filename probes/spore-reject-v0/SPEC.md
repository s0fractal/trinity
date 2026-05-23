# spore-reject-v0 probe

> **Status: graduated (contract) → SPORE.v0 contract active 2026-05-12.** Probe
> is the negative-determinism test record.

Negative-determinism probe for the `SPORE.v0` consensus mutator subset.

This probe verifies that two independent validators reject modules that contain
instructions banned by `contracts/SPORE.v0.draft.md` before consensus execution:

- `f32` / `f64`
- SIMD (`v128`, encoded under the `0xfd` prefix)
- `memory.grow`
- `call_indirect`

Important: this is a **protocol validator** probe, not an engine default
behavior probe. Plain WASM engines may accept some of these modules because they
are valid WebAssembly. SPORE rejects them because the v0 consensus subset is
intentionally narrower than general WASM.

## Expected output

Both validators print byte-identical lines:

```text
case=ok_i32 accepted=true
case=reject_f32 accepted=false reason=banned:f32
case=reject_f64 accepted=false reason=banned:f64
case=reject_memory_grow accepted=false reason=banned:memory.grow
case=reject_call_indirect accepted=false reason=banned:call_indirect
case=reject_simd accepted=false reason=banned:simd
```

`run.sh` exits 0 only when Rust and TypeScript validators agree.

## What this closes

This closes the `SPORE.v0` promotion item:

```text
Negative-determinism probe — feed mutators with f32/f64 or SIMD to
both runtimes; verify both reject at instantiation (per the v0
consensus subset).
```

More precise wording after this probe:

```text
verify both protocol validators reject before instantiation
```

The engine may still accept valid-but-banned WASM. Consensus must not depend on
engine defaults here.
