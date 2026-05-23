---
type: "ContractDescriptor"
version: "0.2"
title: "In/Ledger/Src-Projection IO Architecture (evolved from v0.1)"
status: "draft"
supersedes:
  - "./IN_LEDGER_OUT.v0.1.md"
hears:
  - "./IN_LEDGER_OUT.v0.1.md"
  - "./SUBSTRATE_SELF_ABI.v0.1.md"
  - "../liquid/src/x8F10_probe_roundtrip_demo_projection.myc.md"
related:
  - "../jazz/chords/2026-05-10T224257Z-claude-vector-fractal-substrate-architecture.md"
  - "../jazz/chords/2026-05-10T225257Z-codex-aye-vector-fractal-substrate.md"
---

# In/Ledger/Src-Projection IO Architecture v0.2

## Status

**DRAFT.** Authored 2026-05-23 by claude-opus-4-7 from codex's proposal
(delivered via architect). Supersedes IN_LEDGER_OUT.v0.1 which had `out/` as a
top-level folder. After substrate-self-ABI v0.1 landed (3/3 substrates emit
projections at predictable src/ coordinates), the `out/` folder became a vestige
of pre-flat-src era.

Graduates to `active` once a second substrate (omega/myc) makes
src/x8F<NN>_*_projection.myc.md the live OUT pattern.

---

## Motivation

v0.1 specified `out/md/`, `out/wasm/`, `out/receipts/`, etc. as top-level
folders for readonly projections of ledger state. That was correct prototype
shape **before** the flat-src migration and substrate-self-ABI work matured.
After those landed:

- Every substrate has `src/` as its unified coordinate-bearing address space.
- Substrate-self-ABI established that projections live at predictable src/
  coordinates (8/D roadmap_projection, 8/E probes_projection).
- `out/` as separate folder splits the topology — same substrate artifact has
  two possible homes (`out/md/<fqdn>.md` vs
  `src/x<coord>_<handle>_projection.myc.md`).

v0.2 collapses the split: **OUT becomes a projection class INSIDE src/**, not a
folder outside it.

---

## The evolved formula

```text
in/                    local ephemeral untracked input queue
src/x2D<NN>            tracked inbox / pending intent records
ledger                 private operational wave (often .liquid/ or db/bin)
src/x5<NN>             apply/import/ingest organs
src/x6<NN>             audit/roundtrip verification organs
src/x8F<NN>            OUT projections / receipts / exports at coordinates
src/x8D<NN>            roadmap_projection (per SUBSTRATE_SELF_ABI)
src/x8E<NN>            probes_projection (per SUBSTRATE_SELF_ABI)
```

**Invariant:** _Ledger is operational truth; src/ projections are
source-addressed collapses that make the wave reviewable, recoverable, and
cross-substrate visible._

---

## What changes from v0.1

```diff
- out/md/<fqdn>.md
+ src/x8F<NN>_<handle>_projection.myc.md

- out/wasm/<fqdn>.wasm
+ src/x8F<NN>_<handle>_artifact.wasm (or omit — wasm rarely needs src coord)

- out/sql/<fqdn>.sql
+ src/x8F<NN>_<handle>_query.sql

- out/receipts/<fqdn>.json
+ src/x8F<NN>_<handle>_receipt.myc.json (or x7<NN> for completion-phase receipts)

- out/manifests/<fqdn>.yaml
+ src/x8F<NN>_<handle>_manifest.yaml
+ OR src/x<organ_coord>_<handle>.manifest.json (per-organ pattern already in use)

- OUT is readonly (folder invariant)
+ src/ projection artifacts are readonly/generated unless explicitly authored
```

---

## What stays from v0.1

### I-1. IN is ephemeral

Unchanged. `in/` remains local ephemeral untracked queue. A file in `in/` is a
perturbation request; successful ingestion deletes or moves the file.

NEW nuance: important input artifacts that have stabilized into intent/proposal
form MAY live as `src/x2D<NN>_*` tracked records (per existing pattern with
x2D00_inbox). The split:

- `in/` — untrusted, ephemeral, transient
- `src/x2D<NN>` — accepted, tracked, intent-shaped

### I-3. Multi-projection invariant

Unchanged in spirit, evolved in form. The substrate emits zero or more src/
projection artifacts; each is regeneratable from the ledger; ledger remains
source of truth. Different projection classes serve different consumers (human
reading, runtime, query, audit), now distinguished by filename suffix
(`.myc.md`, `.wasm`, `.sql`, `.json`) rather than folder.

### I-4. Ledger is the wave; files are collapses

Unchanged. The substrate's actual state is the wave in the ledger. Files in src/
projections are collapsed measurements. Two projections never need to be
perfectly synchronized — they are independent collapses.

---

## Migration path

**Substrate adoption is voluntary and incremental** (per
`feedback_substrates_are_mature` + `feedback_liquid_not_trinity`). Each
substrate decides when its `out/` content migrates to src/ projections.

Pilot completed:

- `liquid/out/md/probe.roundtrip.demo.myc.md` →
  `liquid/src/x8F10_probe_roundtrip_demo_projection.myc.md` (commit at liquid
  HEAD; only file in liquid/out/ at the time; liquid/out/ removed)

No other substrate (omega, myc, trinity) had `out/` content; they already use
src/ projection pattern natively.

---

## Operational rules

### R-1. New OUT artifacts MUST use src/ projection form

Going forward, no substrate should create `out/<class>/` folders. Projections go
to `src/x8F<NN>_<handle>_<class>.myc.<ext>` or appropriate coordinate-bearing
alternative.

### R-2. Existing v0.1 `out/` folders MAY be migrated per "rename when touched"

Per `feedback_no_extra_abstractions` — no batch migration required. If a
substrate has `out/` content and touches it, migrate to src/ projection form at
that moment.

### R-3. `in/` keeps its ephemeral semantics

Don't track `in/`. Don't make it canonical. It's a queue, not state.

### R-4. Substrate-self-ABI projections (8/D, 8/E, 8/D-variants) take precedence

If an OUT projection IS one of the substrate-self-ABI slots (roadmap_projection,
probes_projection, etc), use the ABI coord, not the generic x8F<NN>. The ABI
coords reserve specific semantic slots; x8F<NN> is for projections that don't
fit a reserved slot.

---

## Falsifiers

- Any substrate creates a new `out/` top-level folder after this contract
  activates → contract failed to set norm.
- src/ projection artifacts get hand-edited (and changes survive next regen) →
  readonly invariant broken; substrate is treating projection as authored
  source.
- Two substrates implement the same projection class with incompatible filename
  schemes (e.g. `_projection.myc.md` vs `_proj.md`) → norm-setting too loose;
  revisit naming.
- An OUT artifact that morally belongs to a substrate-self-ABI slot ends up at
  x8F<NN> instead of the proper ABI coord → ABI precedence rule violated.

---

## Relationship to SUBSTRATE_SELF_ABI.v0.1

This contract is the GENERAL case; SUBSTRATE_SELF_ABI is the specialized case.
Substrate-self-ABI specifies 5 mandatory projection slots (2/E, 4/A, 6/C, 8/D,
8/E) every federation participant emits. This contract says: ALL projections
(mandatory ABI slots + optional extras) live in src/, not in out/ folders.

If a substrate has projections beyond the 5 ABI slots (probe roundtrip demos,
capability examples, receipt traces, etc), they go to x8F<NN>_ coords (or other
appropriate buckets), still in src/.

---

## Why this evolution matters

Codex (via architect 2026-05-23) framed it as:

> "out/ був правильний прототип, бо тоді ще не було зрілої flat-src топології.
> Зараз він вже виглядає як старий компроміс."

After 2026-05-18 flat-src migration + 2026-05-23 substrate-self-ABI v0.1
graduation, the topology IS mature. v0.1's `out/` folder is the last remaining
vestige of the "different content kinds live in different folders" pre-flat-src
model. Collapsing it into src/ completes the unification:

> Кожен стабілізований стан має топологічну адресу в src/, а transient queue
> може бути зовні.
