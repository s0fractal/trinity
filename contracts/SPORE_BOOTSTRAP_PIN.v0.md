---
type: "BootstrapPinDescriptor"
version: "v0"
status: "draft"
algorithm: "blake3-256"
related:
  - "./SPORE.v0.draft.md"
  - "./SPORE_FUEL.v1.draft.md"
  - "../probes/spore-bootstrap-pin-v0/"
  - "../jazz/chords/2026-05-12T002556Z-codex-aye-freeze-gate-bootstrap-pinning-blocker.md"
  - "../jazz/chords/2026-05-12T033000Z-gemini-aye-format-freeze-and-criteria-status.md"
  - "../jazz/chords/2026-05-12T001608Z-claude-proposal-format-freeze-gate-before-consumer-migration.md"
---

# SPORE Bootstrap Pin v0

## Status

**DRAFT** as of 2026-05-12. This artifact addresses **criterion 8**
of `SPORE.v0.draft.md` (Elevation to status: active):

> 8. ⏳ Bootstrap pinning mechanism in force (see I-2).

A verifier needing to trust the SPORE.v0 evaluator must first
verify that the bootstrap surface they are about to trust is the
one the protocol names. This file enumerates that surface and
publishes a BLAKE3-256 hash of each canonical artifact in it.

The local pre-freeze gate is satisfied when:

1. This manifest exists. ✅
2. `probes/spore-bootstrap-pin-v0/run.sh` re-computes each hash
   and exits green. ✅ (on 2026-05-12; see receipt chord
   `2026-05-12T...-claude-receipt-spore-bootstrap-pin-v0-local-gate-green`).
3. The bootstrap root hash (BLAKE3 over the canonical
   `(path\n hash\n)*` concatenation, in the manifest order below)
   is recorded in this contract.

**External pin** (step 4 of codex's checklist) is **NOT yet in
force**. Promotion of SPORE.v0 to `status: active` additionally
requires at least one external pinning mechanism from
`SPORE.v0.draft.md` §I-2:

- signed git tag, OR
- package-registry checksum, OR
- Bitcoin OP_RETURN inscription / other external commitment.

Choice of mechanism is deferred to architect / multi-voice
consensus.

## What is pinned

Per codex `2026-05-12T002556Z` and gemini `2026-05-12T033000Z`, the
bootstrap surface is the union of:

1. **Protocol contracts** — `SPORE.v0` and `SPORE_FUEL.v1` define
   what is legal and what each instruction costs.
2. **Wire format** — `probes/spore-apply-v0/` defines the apply
   record encoding, `spore_id` hash construction, and the
   multihash format.
3. **v0 banned-subset validator** — `probes/spore-reject-v0/`
   defines what a conforming validator must reject before
   instantiation, with byte-identical Rust + TS implementations.
4. **Deterministic execution** — `probes/spore-execute-v0/`
   defines the deterministic execution calling convention, the
   canonical basis mutators (nop, identity, xor_5c, sum_bytes,
   thrash_copy), and the trap classes (div0, OOB, unreachable).
5. **Canonical fuel meters** — `probes/spore-meter-v0/`
   (static walker, rust + ts) and `probes/spore-meter-exec-v0/`
   (execution-aware static walker).

## What is NOT pinned (deliberately)

- **`probes/spore-meter-instr-v0/`** — the Option-B instrumented-WASM
  meter (meter #4). This is **proof** of cross-runtime fuel
  determinism (criteria 6 and 7), not the canonical evaluator a
  verifier runs. Including it would couple every meter-instr
  iteration to a re-pin, which is the kind of coupling pre-freeze
  decisions should avoid. The proof artifact is referenced in
  `SPORE_FUEL.v1.draft.md` F-FUEL-3 / F-FUEL-5 instead.
- **`probes/*/rust/target/`** — build outputs, gitignored.
- **`Cargo.lock`** files where gitignored — current choice is to
  pin the source files (`Cargo.toml` is pinned) and let exact
  dependency versions float by SemVer; if reproducibility hardens
  later, lock files may be added to the pin.
- **Trinity chords** — chord receipts reference the bootstrap;
  they do not constitute it.

## Pin Manifest

The table below is the **canonical source of truth** for the
bootstrap surface. The verifier
(`probes/spore-bootstrap-pin-v0/rust/src/verify_pin.rs`) parses
this table directly. Adding, removing, or reordering entries
changes the bootstrap surface and requires a new pin.

| path | blake3-256 |
| --- | --- |
| `contracts/SPORE.v0.draft.md` | `7bc82038e0c3e34e6baddb8e30fe22993e4beb437c13d62bed0c0779b5492673` |
| `contracts/SPORE_FUEL.v1.draft.md` | `4d9d1d0e2bb3f6e84b5ff4184f344f8fbd2b436636d612fcd77eddc6aab38659` |
| `probes/spore-apply-v0/SPEC.md` | `bab8eb2af2f4107a5007d5b7917bdcb76b2bc8d163e77f4ca81e117bb8e41c2b` |
| `probes/spore-apply-v0/run.sh` | `16a8752497470a98677db0d8a4792400ac17c35cee984d634d565f77e57de524` |
| `probes/spore-apply-v0/rust/Cargo.toml` | `c896dff0b6702f57cafea809bfc1d49e47e76d7796b78455d3f33cf4197844d4` |
| `probes/spore-apply-v0/rust/src/main.rs` | `18b5a85150b64e310da0a3ce1729ebd7a6f56b3e707d4de258d9bab87bb06a46` |
| `probes/spore-apply-v0/ts/probe.ts` | `49a89eb1e409bb487c9339c8725bb0bfe74e0f9c919bd35f2ff29bb0aedefce2` |
| `probes/spore-apply-v0/python/probe.py` | `13533932342b827481c8d52c495b1cf2be6a3dfa205f4c167353e012e386221d` |
| `probes/spore-reject-v0/SPEC.md` | `02bb5ca356250b5ecb5b315babac84fb086ee6d330082745f50343495d51bcc9` |
| `probes/spore-reject-v0/run.sh` | `02652844ecf192c3dad16a44d7161826d38aed567a17f1c7133ae2ce8f48cb3b` |
| `probes/spore-reject-v0/rust/Cargo.toml` | `02c7461937a70a8d8fd296e64670da62718ed0406e0f23462bcd8017e049a88b` |
| `probes/spore-reject-v0/rust/src/main.rs` | `d19623f9d19b638ee43af8f33b4d132f43c7c3f63eebd0a145fc126518c8ef76` |
| `probes/spore-reject-v0/ts/probe.ts` | `ebe7a816be94a3a9836412e9e52b6db8d74a5bdbe658ef6ccf7c74963c21c5d3` |
| `probes/spore-reject-v0/ok_i32.wat` | `d6411030e5eec2bfab5186bf99e99f133f02ba3c519096825d3647626c700b95` |
| `probes/spore-reject-v0/reject_f32.wat` | `db50bff9a0508a43f2f09ee2e46e1d3319a3da21b4d85333fb52d0daba4bf736` |
| `probes/spore-reject-v0/reject_f64.wat` | `f126d91e20d450929581f44cedf812e2deb2854302fac64c7291749c4796aefc` |
| `probes/spore-reject-v0/reject_memory_grow.wat` | `16bc61fd50151def5cc9a0aaf2e290bfbd9d0830d257d2e6fc4988e4253b99d4` |
| `probes/spore-reject-v0/reject_call_indirect.wat` | `aa3fddee4a37f58b4360619e9b5efa2f28357f1c3b6c10fcafb094ffd8147d2c` |
| `probes/spore-reject-v0/reject_simd.wat` | `b0249f23758bf78ddd5eecc31968205d8d899a2f6bbd95ace70e758a61e82b52` |
| `probes/spore-execute-v0/SPEC.md` | `65cc3621f907e96a3c3d40c764370edcb647fd847e7a9100fc0d79a47ecc6ae0` |
| `probes/spore-execute-v0/run.sh` | `138b07eaa5a55e944ec4eb7fa62b6bb7589c7dd90f6babcf2df26f62c748176e` |
| `probes/spore-execute-v0/rust/Cargo.toml` | `f47288c162fc6fcc7aca3706e104b094a64c4d36b9a969b906c32642f14f5613` |
| `probes/spore-execute-v0/rust/src/main.rs` | `dcfac79e978da37147208ed069756dd0ecd02869c33ce029d79c91323b0b1bf0` |
| `probes/spore-execute-v0/rust/src/bin/atp.rs` | `47118fdf894c049f670b5a171afc4470d5b4ad2aa7d13ca909eb7ae183d94a25` |
| `probes/spore-execute-v0/rust/src/bin/bench.rs` | `9a1e79f3ff7c106b6d804f985850af2f8f58930d232d508ed0ce151c059a0122` |
| `probes/spore-execute-v0/ts/probe.ts` | `5eedaa530f4173792c3c429972a27e592317b878927c3a14042b0c58c8ef6bca` |
| `probes/spore-execute-v0/nop.wat` | `c178333ae25cd5c9200222f0294989c44f16e5b6dc7359addaf2df0bdc9bfc7b` |
| `probes/spore-execute-v0/identity.wat` | `ebbecc578791279cefc36a43fa23d45058df1d4742d438e10ecea80aba2345ac` |
| `probes/spore-execute-v0/xor_5c.wat` | `c05c7379e417e4f536f1e9f878ee9cb5e94133715062e9c13b554af9f77306c5` |
| `probes/spore-execute-v0/sum_bytes.wat` | `9306ec8638662446ee8a02e20151b87d92020e44e77d9456575a7c2d4e11e2b8` |
| `probes/spore-execute-v0/thrash_copy.wat` | `d85b100220a7157ae47c668ec20feee7a94412baaecc77a2580b11739ecb442f` |
| `probes/spore-execute-v0/trap_div0.wat` | `6f4fdcb874f9b1a3833b749b9ca65ce62fbc6628fc841435546e7a412a60893e` |
| `probes/spore-execute-v0/trap_oob.wat` | `b94aadd25a9d30995c346e3ae7aca63eb972172eeee95dfe65b77c2ffd767ff8` |
| `probes/spore-execute-v0/trap_unreachable.wat` | `55ec423a36590316bffbdb93e51fcefa75d5d843df551e964121472293b18989` |
| `probes/spore-execute-v0/nop.wasm` | `b03160583ddb72c80528907a0714eea364cc6bbd7aa3bc8eb96eb229f601a0f1` |
| `probes/spore-execute-v0/identity.wasm` | `53f79c8ae7321aff37b9349426a41d97e168a1700dfa3e45b58287bfd3411cd7` |
| `probes/spore-execute-v0/xor_5c.wasm` | `bc1562c872eccef7a482876ff67c62874a62ed1632269de56a7b2c5733f696fc` |
| `probes/spore-execute-v0/sum_bytes.wasm` | `2df69d119c6797027200343fb32c5a9dc54799b70f58a63f6fb91b52c2bbeaa4` |
| `probes/spore-execute-v0/thrash_copy.wasm` | `32722b0da649567bcb1855fc3e53808c5f02403bc9ca0be071abe145ce82d8a0` |
| `probes/spore-execute-v0/trap_div0.wasm` | `689c55664a4650c118cc81085cd8b4480ad6c075074291141149207725b04594` |
| `probes/spore-execute-v0/trap_oob.wasm` | `6b5e18e17d739d8ed3ee3f9e03b80c8046eec391092dc5684ffad7d92c99e50a` |
| `probes/spore-execute-v0/trap_unreachable.wasm` | `55f5f82dc7db758ff43d6989717ecf1938dcf57d92d42ef82601bd9e31aa1bf3` |
| `probes/spore-meter-v0/SPEC.md` | `f7423eeecc3bff8c438463f4f0fa4ea23af56a2b7ae7dcb261fb601bf49dfe79` |
| `probes/spore-meter-v0/run.sh` | `a266fe42982f81ded23abfaa3ae7e85f0c96ba194dec6b326403a24a21bdc9d2` |
| `probes/spore-meter-v0/rust/Cargo.toml` | `840623998016fc8ff81563b1d0de368d6ea249a9d66f0ae85be4785d5d3608dc` |
| `probes/spore-meter-v0/rust/src/main.rs` | `9245098b5f9d3cd00519e64b9cb638e66e2b42fe1044a8d43796afb9332216c1` |
| `probes/spore-meter-v0/ts/meter.ts` | `23dc9c57bd8bb544140dd9b71caa05429194eed357e39b93400eb7fcf90c11a8` |
| `probes/spore-meter-exec-v0/SPEC.md` | `6af6b901f795f636e5b45355358d97e5c0f07484bd95e2ea3c862d451d63ee70` |
| `probes/spore-meter-exec-v0/run.sh` | `bdf8779a419619771fdf89bb7ea461146e90f32327c9ff52fec9c4647e6e9bc3` |
| `probes/spore-meter-exec-v0/rust/Cargo.toml` | `89f539fb10c17050f79c52f3cb3b3eb12e2742636c3c5b843919dc8c0d343685` |
| `probes/spore-meter-exec-v0/rust/src/main.rs` | `90a7cf0b5fc3f1b15d95dca2e891bdf4922aad2c5d787e33648d6af8ecd814dd` |

## Bootstrap root hash

The bootstrap root hash is the BLAKE3-256 of the canonical
serialization:

```text
for each (path, hash) in the manifest table above, in order:
  emit:  <path>  <hash>\n
```

(Two spaces between path and hash; LF newlines; no trailing
newline after the final entry.)

The current bootstrap root hash, computed by
`probes/spore-bootstrap-pin-v0/rust/src/verify_pin.rs --print-root`,
is:

```text
26b45edb798516d8b486ceebf45444e3249ff2912f0301515c6f4b4d1f830f9a
```

First green verification: 2026-05-12, 51 pinned files. See
`jazz/chords/2026-05-12T...-claude-receipt-spore-bootstrap-pin-v0-local-gate-green`.

This root hash is what an external pin (signed git tag, Bitcoin
OP_RETURN, etc.) should commit. Until that step happens, the pin
is local-only.

## Amendment process (pre-freeze)

Before `status: active`, this manifest may be updated freely as
new artifacts join or leave the bootstrap surface. Each update
requires:

1. A chord proposing the change with rationale (what is being
   added or removed and why).
2. AYE from at least two non-author voices.
3. Recompute the bootstrap root hash and update this contract.
4. Re-run `probes/spore-bootstrap-pin-v0/run.sh` → green.

After `status: active`, the manifest is frozen and any change
follows the SPORE.v0 amendment process (TBD), not this lightweight
pre-freeze flow.
