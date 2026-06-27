---
status: active
triaged_by: claude
next_verification: graduate the SporeRuntimeAdapter interface into a stable src organ once a third backend (omega-zk or SP1) joins runMutator() with byte-identical output_hash; until then this stays the backend-agnostic apply probe, non-authoritative by design
graduation_target: null
---

# spore-runtime-adapter-v0 probe

Adapter probe for **runtime-pluggable** SPORE.v0 `apply` execution.

This probe answers one question: **can the same canonical SPORE.v0 apply record,
executed through different backends, produce byte-identical `output_hash`?** If
yes, then SPORE.v0 is genuinely backend-agnostic — and no single substrate
(including Omega) owns the protocol.

This is the **anti-doctrinal companion** to `spore-execute-v0`. The earlier
probe showed wasmtime + deno produce identical output bytes. This probe extends
that to a third backend slot for future omega-zk, and **structurally separates**
the backend from the protocol in the receipt payload.

Boundary reference: `contracts/SPORE_VS_OMEGA_SPORE_BOUNDARY.v0.1.md`.

---

## Status

**ACTIVE (2026-06-14).** Wire format inherited from `spore-apply-v0/SPEC.md`.
Execution semantics inherited from `spore-execute-v0/SPEC.md`. Landed in
`ts/backends.ts` + `ts/adapter.ts`, exercised by `ts/adapter_test.ts` (gated via
trinity `deno task test:unit`):

1. A receipt shape (`BackendReceipt`) separating `protocol` from `backend_kind`.
2. `runMutator()` runs the same mutator+input through two independent backends —
   the host WASM engine and a from-scratch TS reference — and asserts identical
   `output_hash`. Verified for `identity`, `xor_5c`, `nop`; `identity` vs
   `xor_5c` differ on the same input (proves real semantics, not a constant).
3. A backend that cannot honor a mutator's semantics returns
   `backend_compatible: false` (and `output_hash: null`) instead of a bogus hash.

This makes the backend-agnosticism claim concrete: a WASM engine and a
non-WASM reference agree byte-for-byte, so no substrate (including Omega) owns
the SPORE.v0 apply protocol. A third slot (omega-zk) can join the same
`runMutator` shape later.

---

## Receipt shape (canonical)

Every receipt from this probe — regardless of backend — looks like:

```json
{
  "protocol": "spore.v0",
  "protocol_owner": "trinity",
  "backend_kind": "wasmtime" | "deno" | "omega-zk" | "simulation",
  "backend_id": "<implementation-specific identifier>",
  "mutator_hash": "<hex>",
  "state_hash": "<hex>",
  "input_hashes": ["<hex>", ...],
  "output_hash": "<hex>",
  "output_bytes_len": <int>,
  "simulation": false,
  "receipt_kind": "spore_apply_v0"
}
```

If a backend cannot execute (e.g. unsupported mutator opcode):

```json
{
  "protocol": "spore.v0",
  "backend_kind": "wasmtime",
  "backend_compatible": false,
  "reason": "<short reason>"
}
```

**Forbidden:** any receipt that omits `backend_kind`, or that uses
`backend_kind` to claim protocol ownership (`"backend_kind": "omega"` is wrong;
the correct form is `"backend_kind": "omega-zk"` with
`"protocol_owner": "trinity"`).

---

## Adapter interface (TypeScript reference)

```typescript
export interface SporeRuntimeAdapter {
  backend_kind: "wasmtime" | "deno" | "omega-zk" | "simulation";
  apply(
    mutator_bytes: Uint8Array,
    state_bytes: Uint8Array,
    input_bytes: Uint8Array[],
  ): Promise<
    {
      output_bytes: Uint8Array;
      output_hash: string;
    } | {
      backend_compatible: false;
      reason: string;
    }
  >;
}
```

The Trinity command surface (`0x5/F.ts → SporeApplyBackend`) routes to the
chosen adapter by `backend_kind`. The adapter does not see SPORE wire format —
that is parsed in trinity/liquid before dispatch. The adapter sees raw
mutator/state/input bytes only.

Adapter implementations live under `probes/spore-runtime-adapter-v0/ts/`
(co-located with this SPEC). No `lib/` placement.

---

## Cross-backend determinism fixture

Inputs (deterministic, pinned):

```text
mutator: identity.wasm       (from spore-execute-v0/identity.wat)
state:   "hello-trinity"     (UTF-8, 14 bytes)
inputs:  []
```

Expected:

```text
output_hash (BLAKE3 derive_key over output_bytes)
  ↓
wasmtime backend: <hash-A>
deno backend:     <hash-A>   ← must equal wasmtime
```

Future:

```text
omega-zk backend: <hash-A>   ← when SP1 proof backend lands
```

Acceptance: all backends that return `backend_compatible: true` produce the same
`output_hash`. A backend that cannot execute the mutator returns
`backend_compatible: false` and is **excluded from the equality check** without
polluting it.

---

## Failure modes this probe must catch

1. **Bogus hash from incompatible backend.** A backend that doesn't actually run
   the mutator but invents a hash → must instead return
   `backend_compatible: false`.
2. **Backend claiming protocol ownership.** A backend that sets
   `protocol_owner: "omega"` → reject at adapter boundary.
3. **Wire format leakage.** Adapter that touches SPORE wire bytes → reject;
   parsing is upstream concern.
4. **Simulation passing as real.** A `backend_kind: "simulation"` result with
   `simulation: false` → reject.

---

## Bridges with neighboring probes

- `probes/spore-apply-v0/` — wire format determinism (this probe inherits).
- `probes/spore-execute-v0/` — single-backend execution determinism (this probe
  extends to multi-backend).
- `probes/spore-meter-v0/`, `spore-meter-exec-v0/` — ATP fuel accounting
  (orthogonal; adapter exposes `fuel_used` but doesn't define semantics).
- `probes/spore-liquid-bridge-v0/` — current liquid bridge probe (this one
  replaces the simulation path).

---

## Out of scope

- ATP/fuel metering (see spore-meter-*).
- Non-deterministic effects (next probe family).
- Recipe composition (chained applies — separate probe).
- Omega Φ-warrant integration (mutations that touch physical invariants require
  warrant; SPORE.v0 apply is byte-to-byte pure and does not).
