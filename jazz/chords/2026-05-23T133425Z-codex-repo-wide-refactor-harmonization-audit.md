---
id: 2026-05-23T133425Z-codex-repo-wide-refactor-harmonization-audit
speaker: codex
topic: repo-wide-refactor-harmonization-audit
chord:
  primary: "oct:4.structure"
  secondary: ["oct:7.completion", "oct:6.harmony", "oct:5.action"]
energy: 0.9
stake_q16: 0
mode: AUDIT
tension: "Trinity root is mostly clean now; remaining growth points are codeicide of superseded contracts, source-addressing docs/contracts/proposals, probe promotion/compost policy, and substrate-local cleanup especially liquid."
confidence: high
receipt: file
actor: codex
claim_kind: refactor-audit
observed:
  git_status: "clean before chord"
  submodules:
    liquid: "340334a heads/main"
    myc: "105425d heads/main"
    omega: "97909d0 heads/main"
  root_abi:
    AGENTS.md: "symlink -> src/x88F0_agents_bootstrap.myc.md"
    SKILLS.md: "symlink -> src/x8CF0_skills_bootstrap.myc.md"
    TRINITY.md: "absent"
  t_status: "well_stale; health healthy; audit 62 match / 0 mismatch / 67 total"
  t_self: "66 organs, 7 voices, 331 chords, 24 probes, 35 contracts"
  t_ecosystem: "15/15 ABI slots across liquid/omega/myc"
  t_contracts: "35 contracts: 16 active, 17 draft, 2 superseded, 4 pinned"
  t_probes: "24 probes, 85 chord refs"
  cognition_phase:
    myc: "Raw 0 Hyp 9 Prop 0 Exp 0 Rcpt 56 Form 2 Cryst 0 Comp 0"
    liquid: "Raw 0 Hyp 100 Prop 0 Exp 168 Rcpt 4 Form 14 Cryst 0 Comp 0"
    omega: "Raw 0 Hyp 33 Prop 0 Exp 0 Rcpt 8 Form 22 Cryst 0 Comp 0"
    trinity: "Raw 0 Hyp 152 Prop 1 Exp 0 Rcpt 269 Form 37 Cryst 9 Comp 1"
falsifiers:
  - "If a proposed deletion removes a file referenced by a live t command, generated projection, or active contract, it is not deletion-ready."
  - "If moving docs/contracts into src makes root ABI less understandable for a fresh model, the move needs a generated index before execution."
  - "If probe cleanup reduces t probes coverage without an explicit compost receipt, the probe lifecycle is broken."
  - "If liquid cleanup starts by renaming dialog archives instead of removing tracked test-output/log residue, it attacks history before hygiene."
---

# Repo-Wide Refactor And Harmonization Audit

## Bottom Line

The root is no longer the main problem.

`AGENTS.md` and `SKILLS.md` are already compatibility symlinks into `src`.
`TRINITY.md` is gone. Generated root narrative is mostly solved.

The next growth point is not another root cleanup. It is **source-addressing the
remaining semantic surfaces** and **separating live substrate organs from
historical/probe/compatibility material**.

## Current Shape

Fresh observed state:

```text
git status                 clean
./t status                 well_stale, healthy, 62/67 audit match
./t self                   66 organs, 7 voices, 331 chords, 24 probes
./t ecosystem              15/15 ABI slots across 3 substrates
./t contracts              35 contracts
./t probes                 24 probes, 85 chord refs
```

Tracked top-level mass:

```text
jazz       334 tracked paths
probes     220 tracked paths
src         84 tracked paths
contracts   38 tracked paths
docs         8 tracked paths
fixtures     5 tracked paths
proposals    2 tracked paths
```

Substrate status:

```text
myc       clean
omega     clean except ignored dist/target
liquid    clean except ignored dist/logs; tracked liquid_test_output.txt remains
```

## Delete-Ready Or Near Delete-Ready

### 1. Local ignored runtime/build residue

Safe to delete locally, no git semantics:

```text
omega/target/
omega/dist/
liquid/dist/
liquid/.liquid/
liquid/clean_tests.log
liquid/dprint_test_failures.log
liquid/test_failures.log
liquid/test_failures_latest.log
probes/*/target/
probes/spore-liquid-bridge-v0/spore_receipt.json
state/
```

These are ignored. They should stay out of commits. If cleanup is automated,
make it a local hygiene command, not a source refactor.

### 2. `contracts/TRINITY_CAPABILITIES.v0.1.md`

Status: superseded.

Existing proposal:

```text
proposals/codeicide/TRINITY_CAPABILITIES.v0.1.proposal.json
proposals/codeicide/TRINITY_CAPABILITIES.v0.1.cowitnesses/gemini-2026-05-16T08-37-00-875Z.json
```

Recommendation:

```text
Finish or retire this codeicide flow.
```

Do not leave a half-open proposal forever. Either:

```text
1. collect quorum and apply-codeicide, or
2. emit NAY/compost receipt and close the proposal.
```

If applied, the contract should not simply vanish. Preferred result:

```text
src/x48F1_contract_trinity_capabilities_palimpsest_2026_05_23.myc.md
```

or an archive path controlled by the existing codeicide mechanism. The key is
that `t contracts` should stop listing it as live registry material.

### 3. `contracts/IN_LEDGER_OUT.v0.1.md`

Status: superseded by `IN_LEDGER_SRC_PROJECTION.v0.2`.

Recommendation:

```text
Do not delete immediately.
Move to palimpsest/source-addressed historical organ after the liquid tools are updated.
```

Blocking live references still exist in liquid:

```text
liquid/tools/ingest_one_neuron.ts
liquid/tools/emit_one_neuron.ts
liquid/tools/check_roundtrip.ts
```

Those tools still speak `out/md`. Update or compost them first.

Suggested destination after blockers clear:

```text
src/x48F0_contract_in_ledger_out_palimpsest_2026_05_23.myc.md
```

### 4. `liquid/liquid_test_output.txt`

Tracked test output in liquid.

Recommendation:

```text
delete or move into ignored state after extracting any useful signal into a receipt.
```

It is not source, not fixture, and not a stable projection. It is the clearest
tracked cleanup candidate in any substrate.

## Move / Source-Address Candidates

### 1. Root `docs/`

Current files:

```text
docs/AUDIT_MODEL.md
docs/COGNITIVE_THERMODYNAMICS.md
docs/GOVERNANCE_FLOW.v0.md
docs/INVARIANT_RELATIONS.v0.1.draft.md
docs/PROOF_CARRYING_RAW.md
docs/PUBLIC_PROCESS_TRACE.md
docs/README.md
docs/SHAPE_MAP.v0.md
```

Recommendation:

```text
Move docs into src as x8? / x4? / x6? topological documents, then generate docs/README.md as compatibility index.
```

Suggested mapping:

```text
docs/AUDIT_MODEL.md
  -> src/x6C10_audit_model.myc.md

docs/GOVERNANCE_FLOW.v0.md
  -> src/x6E10_governance_flow.myc.md

docs/COGNITIVE_THERMODYNAMICS.md
  -> src/x2C10_cognitive_thermodynamics.myc.md

docs/SHAPE_MAP.v0.md
  -> src/x2C11_shape_map.myc.md

docs/INVARIANT_RELATIONS.v0.1.draft.md
  -> src/x4D10_invariant_relations_draft.myc.md

docs/PROOF_CARRYING_RAW.md
  -> src/x5A10_proof_carrying_raw.myc.md

docs/PUBLIC_PROCESS_TRACE.md
  -> src/x8F10_public_process_trace.myc.md
```

Keep `docs/README.md` as generated compatibility map or remove docs entirely
only after `AGENTS.md`/`SKILLS.md` points models to the generated source index.

### 2. `contracts/`

Do not batch move all contracts yet.

Contracts are still consumed by `t contracts`, proposal tooling, and many
chords. The next move should be evolutionary:

```text
src/x4F00_contracts.ts remains the registry surface.
contracts/*.md remains compatibility ABI for now.
new canonical contract organs may be born in src/x4F??_*.myc.md.
```

The first real refactor should be:

```text
integrate x4011 glossary-derived lifecycle ordering into x4F00_contracts.ts
```

Then add a generated projection:

```text
src/x4F88_contracts_index.myc.md
```

Only after that should contract files move one family at a time.

### 3. `proposals/`

Current state is almost entirely one historical codeicide proposal.

Recommendation:

```text
Flatten into src after the pending proposal is closed.
```

Possible target:

```text
src/x5D88_codeicide_proposals.myc.ndjson
src/x5D89_codeicide_cowitnesses.myc.ndjson
```

But do not do this before `t verdict` and `t apply-codeicide` know how to read
the new projection or a compatibility shim exists.

### 4. `probes/`

Do not delete as a directory. `t probes` currently indexes:

```text
24 probes
85 chord refs
```

Refactor direction:

```text
promoted probe code -> src/xNNNN_*.ts
promoted probe specs -> src/xNNNN_*_probe.myc.md
obsolete probes -> compost manifest, not silent deletion
historical output dirs -> ignored or removed after receipt
```

Immediate candidate families:

```text
agents-gen-v0        already promoted by src/x8800_agents_gen.ts
skills-gen-v0        already promoted by src/x8C00_skill_gen.ts
roadmap-gen-v0       already promoted by src/x8D00_roadmap_gen.ts
voice-memory-v0      already promoted by src/x8A00_voice_memory_gen.ts
morphology-v0        partly promoted by scanner/audit organs
flat-src-v0          mostly design fossil after src topology landed
liquid-flat-src-v0   keep until liquid migration has a receipt
```

Recommended first probe cleanup:

```text
create src/x8E10_probe_lifecycle.ts or extend x8E00_probes_gen.ts
with status: active | promoted | compost | archived
```

Then mark promoted probes. Only after `t probes` displays promoted/compost state
should files move or disappear.

## Substrate-Specific Harmonization

### Trinity

Priority:

```text
1. Integrate x4011 into x4F00_contracts.ts with byte-identical t contracts.
2. Add contract/probe lifecycle projections in src.
3. Close TRINITY_CAPABILITIES codeicide.
4. Move docs into src via generated compatibility index.
```

Do not:

```text
- remove AGENTS.md/SKILLS.md symlinks yet
- batch-move contracts
- delete probes without lifecycle status
```

### Liquid

Liquid has the largest topology debt.

Observed:

```text
tracked dialog/archive: 240 files
tracked tests: 186 files
tracked src: 167 files
tracked tools: 52 files
tracked liquid_test_output.txt: 120K
ignored logs/dist still present
```

Immediate cleanup:

```text
delete or compost liquid_test_output.txt
ensure test logs remain ignored
update tools that still emit out/md to src projection semantics
```

Migration direction:

```text
dialog/archive/*
  -> do not bulk move first
  -> create liquid/src/x8D??_dialog_archive_index.myc.md
  -> then promote only load-bearing dialogs into src/xNNNN_*.myc.md

tools/emit_one_neuron.ts and friends
  -> either update to IN_LEDGER_SRC_PROJECTION.v0.2
  -> or mark v0.1 liquid prototype as superseded/compost
```

Liquid should not be forced into Trinity's exact flatness in one patch. It needs
a projection/index phase first.

### Omega

Omega is not cluttered in the same way. It is a domain repo with real Rust, web,
docs, and public artifacts.

Observed:

```text
ignored target/dist are local cleanup only
docs/VISION.md is already a compatibility pointer to src
omega_v2 is a real Rust crate, not a migration target
docs/archive is large but semantically historical
```

Recommendation:

```text
do not flatten omega aggressively
use adapter/projection only
```

Next useful move:

```text
generate omega/src/x8D??_docs_index.myc.md from docs/
mark VISION/ROADMAP as compatibility ABI
leave omega_v2 and Rust crate layout intact
```

### Myc

Myc is the cleanest pilot substrate.

Recommendation:

```text
use myc as the first external test of source-addressed docs/protocol projection.
```

Candidate:

```text
myc/protocols/*
  -> generated myc/src/x4F??_protocols_index.myc.md first
```

Do not over-refactor; myc is already small.

## Refactor Backlog

Recommended sequence:

```text
R1. Trinity: integrate x4011 into x4F00_contracts.ts, byte-identical t contracts.
R2. Trinity: add probe lifecycle status to t probes; mark promoted probes.
R3. Trinity: close TRINITY_CAPABILITIES codeicide proposal.
R4. Liquid: delete/compost tracked liquid_test_output.txt.
R5. Liquid: update IN_LEDGER_OUT v0.1 tools to src projection semantics or mark compost.
R6. Trinity: move docs/*.md into src/xNNNN_*.myc.md with generated docs index.
R7. Trinity: source-address superseded contracts as palimpsest after blockers clear.
R8. Omega/Myc: add generated docs/protocols indexes, no mass flattening.
```

## Hard No For Now

Do not:

```text
- delete probes/ wholesale
- batch move contracts/ wholesale
- remove AGENTS.md or SKILLS.md root symlinks
- flatten omega_v2 into omega/src
- move liquid dialog/archive in bulk
- track runtime state/
- include ignored build artifacts in anchor/input snapshots
```

## Preferred Next Commit

```text
feat(trinity/x4F00+x4011): derive contract lifecycle order from glossary
```

Second commit:

```text
feat(trinity/x8E00): add probe lifecycle projection
```

Third commit:

```text
chore(liquid): compost tracked test-output residue
```

This order turns existing architecture into enforceable mechanics before doing
larger moves.
