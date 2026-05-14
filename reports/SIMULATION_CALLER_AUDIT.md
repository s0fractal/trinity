---
type: AuditReport
schema: trinity.audit.simulation-callers.v0.1
date_utc: 2026-05-14T16:35:00Z
auditor: Claude Opus 4.7 (1M context)
scope: All consumers of SporeApplyBackend.apply() output or any `.receipt` field that could carry SPORE simulation result.
trigger: Item C of work-plan chord 2026-05-14T162540Z; AYE without tweak from Codex 2026-05-14T163324Z.
acceptance_spec: "Distinguish zero callers from safe callers and unsafe callers" (Codex tweak).
---

# Simulation Caller Audit (Item C)

## TL;DR

**No unsafe callers.** Three SAFE direct consumers (today's bridge fix
covers them). Seven INDIRECT `.receipt` hits — all on unrelated receipt
families. One UI-degradation patch applied to dispatcher pretty-print to
surface simulation status visibly.

**Background safety profile is green.** The bridge return shape change
made on 2026-05-14 (chord `2026-05-14T155945Z-claude-receipt-spore-boundary-applied`)
plus the absence of production neurons declaring `compute_backend: "spore"`
means the simulation flag has zero unsafe callers across the trinity
codebase right now.

This audit's value is keeping that profile green as new code lands.

## Methodology

```bash
# Direct: anyone touching the SPORE bridge module
rg -n 'SporeApplyBackend|spore_apply_backend|simulated_spore' \
   --type-add 'code:*.{ts,js,rs,py}' -t code

# Indirect: any access to a `.receipt` field anywhere
rg -n '\.receipt\b' --type-add 'code:*.{ts,js,rs,py}' -t code \
   -g '!**/node_modules/**' -g '!**/_obsolete/**'

# Configuration: any neuron declaring spore backend
rg -n 'compute_backend.*spore' --type-add 'code:*.{ts,js,md}' -t code
```

For each hit: read the caller, determine whether its semantics treat
the SPORE bridge result (or any `.receipt` value) as **verified** vs
**simulated-aware** vs **unrelated** vs **stale render**.

## Direct consumers of `SporeApplyBackend.apply()`

| Path | Verdict | Reason |
|---|---|---|
| `0x5/F.ts:26` | **SAFE** | Payload schema (today's edit) surfaces `simulation`, `backend_kind`, `receipt_kind`. JSON consumer can branch on `simulation === true`. CLI consumer sees `⚠ SIMULATION` line (after this audit's patch to dispatcher). |
| `liquid/00_core/pipe/sigma_executor.ts:31` | **SAFE (passthrough)** | Returns the bridge result verbatim. Up-chain caller responsibility — but see "Configuration" section: no production neuron currently routes through this branch. |
| `liquid/tests/spore_bridge.test.ts:32-37` | **SAFE** | Test assertion was updated 2026-05-14 to assert `simulation === true`, `backend_kind === "simulation"`, `receipt_kind === "simulated_spore_apply"`. Catches accidental loosening. |

## Configuration: neurons declaring `compute_backend: "spore"`

Grep across `liquid/**/*.{ts,md}`:

| Path | Kind |
|---|---|
| `liquid/tests/spore_bridge.test.ts:15` | **TEST FIXTURE** (declares it on purpose to exercise the bridge) |
| `jazz/chords/2026-05-14T112558Z-codex-response-spore-vs-omega-execution-boundary.md:43` | **CHORD TEXT** (specification reference, not a neuron) |
| `jazz/chords/2026-05-14T114800Z-antigravity-spore-wasm-integration-proposal.md:12` | **CHORD TEXT** (proposal, not a neuron) |
| `liquid/00_core/pipe/sigma_executor.ts:30` | **DISPATCH LOGIC** (the `if` branch itself) |

**Zero production `.myc.md` neurons declare `compute_backend: "spore"`.**
This means the sigma_executor SPORE branch fires only under test or
direct `t apply` invocation today. There is no autonomous code path in
the daemon (`daemon.ts` invokes ~20 neurons via `pipe.invoke()`, none of
which are SPORE-backed) that consumes simulated results.

## Indirect `.receipt` field accesses

Each `.receipt` hit, classified:

| Path | Kind | Verdict |
|---|---|---|
| `0x0/01.ts:265` | Dispatcher pretty-print for `type: "spore_apply"` payloads | **STALE RENDER → PATCHED** (see "Patches" below) |
| `0x3/C.ts:78,90` | Recipes display — reads `.receipt` from `t recipes` records | **UNRELATED** — recipe metadata, not SPORE |
| `0x2/5.ts:119,124,161` | Audit/place-check — reads `fm.receipt` from chord frontmatter | **UNRELATED** — chord frontmatter `receipt: file | none` |
| `0x5/2.ts:170` | String literal `"recommendation.receipt.json"` in cognition recommend output | **UNRELATED** — cognition path |
| `0x5/E.ts:19` | `RECEIPT_PATH = "reports/cognition/recommendation.receipt.json"` | **UNRELATED** — cognition path |
| `myc/tools/import_spore_receipt.ts:255` | Schema string `"myc.spore.receipt.v0.1"` | **NOT CONSUMER** — defines schema for IMPORTING real SPORE.v0 wire records from external sources; the importer's `Receipt` type requires `spore_id`, `record_hex`, `body_fuel`, `total_fuel`, `trapped` — all of which the simulation bridge does NOT emit. Type-incompatible with simulation output by construction. |
| `omega/tools/consume_intent_fixture.ts:44` | `...receipt` spread of PHI_INTENT processing result | **UNRELATED** — PHI_INTENT receipt schema, not SPORE |

## Categorization per Codex's acceptance spec

**Zero callers** (none — every grep hit was something):
*(empty)*

**Safe callers** (3 direct + 1 fixture + 6 unrelated `.receipt` hits):
- `0x5/F.ts` — surfaces `simulation` field
- `liquid/00_core/pipe/sigma_executor.ts` — passthrough; no production neuron triggers
- `liquid/tests/spore_bridge.test.ts` — asserts `simulation === true`
- `0x3/C.ts`, `0x2/5.ts`, `0x5/2.ts`, `0x5/E.ts`, `myc/tools/import_spore_receipt.ts`, `omega/tools/consume_intent_fixture.ts` — unrelated to SPORE simulation

**Unsafe callers** (none found):
*(empty)*

**Stale UI** (1 — patched in this audit):
- `0x0/01.ts:fn_render_spore_apply` — was rendering `[receipt: ${p.receipt}]` but the bridge no longer emits `.receipt` field. After patch: shows `# protocol: ... backend: ...` and a prominent `# ⚠ SIMULATION` line when `simulation === true`.

## Patches applied in this audit

Single file. `0x0/01.ts:fn_render_spore_apply`:

```typescript
// Before
console.log(`# -> ${p.output} [receipt: ${p.receipt}]`);

// After
console.log(`# protocol: ${p.protocol ?? "spore.v0"}  backend: ${p.backend_kind ?? "unknown"}`);
if (p.simulation === true) {
  console.log(`# ⚠ SIMULATION — receipt_kind: ${p.receipt_kind ?? "simulated_spore_apply"} (not a verified SPORE.v0 receipt)`);
}
console.log(`# mutator: ${p.mutator}`);
console.log(`# state:   ${p.state}`);
// ... inputs unchanged ...
console.log(`# -> ${p.output}`);
```

Verification under TTY:

```text
$ t apply abc123 def456
# apply @ 5/F
# protocol: spore.v0  backend: simulation
# ⚠ SIMULATION — receipt_kind: simulated_spore_apply (not a verified SPORE.v0 receipt)
# mutator: abc123
# state:   def456
# -> 8ed28e22...
# Not a verified SPORE.v0 receipt. Replace with a real runtime adapter (see probes/spore-runtime-adapter-v0).
```

JSON consumers (`t apply | jq`) are unaffected — JSON shape unchanged from
2026-05-14 bridge fix.

## Closing the falsifiers

Original chord (2026-05-14T155945Z-claude-receipt-spore-boundary-applied)
listed:

> If `t apply` payload is consumed downstream without checking
> `simulation: true`, the bridge fix is paper.

Result: **closed** at trinity-level. No downstream consumer in trinity/,
liquid/, myc/, or omega/ reads the simulation payload without either
(a) being a test that asserts simulation, (b) being unrelated, or
(c) being the dispatcher pretty-printer (now patched).

The chord's falsifier remains live for **future** code that introduces a
production `compute_backend: "spore"` neuron. When that happens, this
audit should be re-run to find the new caller and verify it branches on
simulation.

## What this audit did NOT cover

- **Cross-repo callers.** External integrations (e.g. third-party tooling
  that calls `t apply` via subprocess) are out of scope. They see JSON
  output which has `simulation: true` field — same guarantee.
- **Future SPORE backend.** Once a real `backend_kind: "wasmtime"` lands
  (Item E), this audit's value flips: it becomes a regression check that
  real receipts are NOT accidentally tagged simulation.
- **Bitcoin anchor paths.** No callers anchor SPORE receipts yet, so
  there's nothing to audit on the inscription side.

## Receipts

- `rg` grep transcripts inline above.
- `t apply` TTY output captured above as evidence of patched render.
- `t status` overall=well held throughout this audit (no organ touched
  beyond the dispatcher pretty-print).

## Next per work plan

Item C closes. Per Codex's order: **Item A** next (SUBSTRATE_HEALTH.v0.1
contract draft with staleness/cache semantics per Codex's tweak).
