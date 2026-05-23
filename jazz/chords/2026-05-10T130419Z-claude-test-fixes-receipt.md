---
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:1.form", "oct:3.action"]
energy: 0.71
stake_q16: 0
mode: "RECEIPT"
tension: "test-suite-state-after-cleanup-pass-565-passed-41-failed"
confidence: "high"
receipt: "file"
actor: "claude-opus-4.7-1m"
claim_kind: "completion"
hears:
  - "free:user-prompt-2026-05-10-fix-tests-yourself-gemini-paused"
  - "jazz/chords/2026-05-10T002116Z-codex-gemini-q10-liquid-omega-analysis.md"
  - "jazz/chords/2026-05-10T105539Z-codex-gemini-q10-followup-review.md"
  - "jazz/chords/2026-05-10T115539Z-codex-sigma-intent-phase-graph-draft.md"
---

# Receipt: liquid test cleanup pass

User asked Claude to take over test fixes while Gemini paused. Hint: "є старі
які не працювали — бо чи логіка мінялась чи функціонал переїхав в омегу — вже не
пам'ятаю".

## Final state

```
deno task test:unit
→ 565 passed | 41 failed (2m32s)
```

Was effectively **568 passed | 90 failed** when this work began (per Codex's
`2026-05-10T105539Z` review at 04:19 UTC; my own run at the start showed only
311/36 due to a hidden CI-blocker bug — see finding 1 below).

Total improvement: **49 fewer failures**, plus several infrastructure/ledger
issues fixed permanently.

## Findings and fixes (4 commits to liquid)

### 1. CI-blocking bug: `tests/load_test.ts` (commit `c6af9d3`)

`tests/load_test.ts` is a load-testing entry script (1000-invoke benchmark
calling `Deno.exit(0)` at end). Filename matches Deno test pattern `*_test.ts`,
so `deno test` picked it up, ran the script, and **exited the entire test runner
before reaching alphabetically-later tests** (macrophage and beyond — ~60 of
~118 test files were silently skipped).

The test runner returned `exit 0` with only ~40% of the suite covered, masking
~21 additional failures. CI looked green when substrate was actually in worse
shape than reported.

Fix: added `tests/load_test.ts` to ignore list in `deno.jsonc` (both `test` and
`test:unit` tasks). One-line change. The file itself is preserved; better
long-term move is to rename to `tools/load_test.ts` (it's a tool, not a test).

### 2. PhaseEngine Q15 LUT test calibration (commit `ed60dd5`)

`tests/phase_engine.test.ts` had a test "PhaseEngine - Q10 Cosine LUT is
symmetric" with assertions calibrated for Q10 (cos(0) ≈ 1024) but the
implementation moved to Q15 (cos(0) ≈ 32767). Updated assertions and tolerances
for Q15. Renamed test to "Q15 Cosine LUT" to match reality.

Note: this is a test fix only. The implementation also has stale comments at
`phase_engine.ts:323` saying `// -1024 to 1024` while `lookupCos` returns Q15.
Downstream callers (especially `calculateEpicyclicResonance`) may have subtle
math bugs because the math was originally written for Q10 input. This is
potentially related to `volumetric_resonance.test.ts` and similar failures — not
investigated further in this pass.

### 3. PN-CAD ledger corruption + sync tool (commit `1928d18`)

Discovered that 3 of 32 core files had bodies stored in the PN-CAD ledger but
**missing the `# X:0x1 ∇[Y] Δ[Z]` cluster header** that the parser uses for
boundary detection. Result: `readVirtualCoreNeuron` returned the body, but
`parseLiquidCluster(body)` returned 0 neurons, so `projector.hydrateCluster` had
nothing to insert, so subsequent `pipe.invoke` failed with "not found".

Affected neurons:

- `immune.virus.signature.sys.myc.md`
- `kernel.refusal.oracle.sys.myc.md`
- `system.consent.gate.sys.myc.md`

Created `tools/sync_core_neurons.ts` — idempotent injector that reads
`src/ontology/core/*.myc.md` and re-injects any that are either missing from the
ledger or present-but-corrupt (body fails to parse). Three states detected per
file: `missing | corrupt |
ok`. Optional `--force` flag re-injects everything.

`system.consent.gate.sys.myc.md` (disk file) had been corrupted by markdown
auto-formatting (deno fmt or similar) which wrapped the inline JS body across
lines, breaking string literals. Specifically `"conflicts with declared values"`
was split across two lines, making it invalid JS. Rewrote the Σ body with one
statement per line (each short enough to not trigger 80-col wrap).

**Fragility note:** the consent.gate fix is fragile against future deno fmt
runs. A more robust solution (markdown directive to preserve Σ blocks, e.g.,
escaping with markdown code fence syntax) is recommended but out of scope for
this pass.

### 4. Obsolete tests moved to `tests/_obsolete/` (commits `ed60dd5`, `5b8aee5`)

14 test files moved to `tests/_obsolete/` (analogous to existing `tests/living/`
for excluded long-running tests). Each test file references neurons that no
longer exist anywhere on disk and whose functionality has been moved to
TypeScript projector modules or deprecated.

| Test file                         | Missing neuron(s)                                  | Replacement                               |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| cultural_evolution.test.ts        | `system.philosophy.curator.sys.myc.md` + heartbeat | `tests/auto_curator.test.ts` (12 passing) |
| governance_unquarantine.test.ts   | `system.governance.unquarantine.sys.myc.md`        | None found — likely deprecated            |
| resonance_field.test.ts           | `field.resonance.meta.env.myc.md`                  | Phase routing in `liquid_pipe.ts`         |
| dream_consolidation.test.ts       | `kernel.dream.consolidation.biology.sys.myc.md`    | REM via `kernel.dreamer.sys.v2.myc.md`    |
| cosmic_ray.test.ts                | `sys.biology.chaos.sys.myc.md`                     | Mutation testing via different path       |
| zk_proof.test.ts                  | `zk.proof.substrate.sys.crypto.myc.md`             | `00_core/zk_proofs.ts`                    |
| dark_neuron_zk.test.ts            | (Era 1036 ZK-STARK)                                | Subsumed by ZK module work                |
| thermodynamic_routing.test.ts     | `kernel.attention.gating.control.sys.myc.md`       | Routing in `liquid_pipe.ts`               |
| time_predictive_resonance.test.ts | `kernel.chronoflux.delta.field.myc.md`             | Chronoflux v2 in core                     |
| epoch_seal.test.ts                | `temporal.crystallization.sys.myc.md` + heartbeat  | Heartbeat in `daemon.ts`                  |
| agent_resume.test.ts              | `system.agent.resume.sys.myc.md`                   | Agent functionality in TS modules         |
| wake_protocol.test.ts             | Multiple (system.agent.resume, agent.sovereign)    | Wake protocol partially intact            |
| pn_cad_swarm_sync.test.ts         | (Era 1038 binary sync — gone)                      | None found                                |
| predict_deadlock.test.ts          | (μ-40 — gone)                                      | None found                                |

`tests/_obsolete/README.md` documents each test, its missing neuron, and likely
replacement. Directory excluded from `deno task test/test:unit`. Convention:
same as existing `tests/living/` for excluded long-running tests.

## Remaining 41 failures, clustered

### Cluster A: Mixed-state files (32 failures across ~10 files)

Tests that depend on neurons that are partially present (some on disk, some
gone). These files have BOTH passing and failing tests, so cannot be moved en
masse. Each test would need individual `Deno.test.ignore(...)` or rewrite.

| File                     | Tests   | Failures | Notes                                    |
| ------------------------ | ------- | -------- | ---------------------------------------- |
| autobiography.test.ts    | 6       | 4        | Curator gone, heartbeat gone             |
| sigil_memory.test.ts     | 5       | 3        | Heartbeat gone, value reflection partial |
| agent_will.test.ts       | 6       | 1        | One heartbeat-dependent test             |
| spore_acceptance.test.ts | 2       | 1        | Membrane test partial                    |
| self_bootstrap.test.ts   | 7       | 1        | Bootstrap-related                        |
| resolver_fixture.test.ts | several | 3        | Parser tests, see Cluster D              |
| (others)                 |         | ~19      | distributed                              |

### Cluster B: Real Q10 unit-mismatch (estimate 5–8 failures)

Tests that fail because the substrate's Q10 migration is incomplete (mid-flight
per Codex's reviews). Examples:

- `keystone_mercy.test.ts` (2 failures, μ-25 — apoptosis logic)
- `downregulate.test.ts` (μ-17 floor)
- `metabolism.test.ts` (4 failures, recordMetabolism + getPathological)
- `optical_bridge.test.ts`, `optical_snapshot.test.ts`
- `pathogen_cremation.test.ts` (μ-49)
- `petri_net.test.ts` (μ-5)
- `capture_resistance.test.ts` (test calibrated for old scale, but also has
  pre-existing logic bug — assertion expects 0.70 while comment says 0.219)

These should be fixed by completing Codex's recommended Phase A-F membrane pass
(see `2026-05-10T002116Z-codex-gemini-q10-liquid-
omega-analysis.md`
§"Recommended structure"). Out of scope here because production code fixes risk
conflict with Gemini's uncommitted WIP (16 modified files in liquid).

### Cluster C: Era / volumetric / wave (estimate 8–10 failures)

Tests for older "Era" features that may be obsolete or have substrate behaviour
changes:

- `volumetric_cognition.test.ts` (3–4 failures, Axiom 3)
- `volumetric_resonance.test.ts` (1)
- `wave_geometry_test.ts` (1)
- `wave_history_test.ts` (2–3)
- `topology_audit_test.ts` (2)
- `neuron_kuramoto.test.ts` (2)

May be fixable by similar mechanism to obsolete-move OR by Q15 LUT downstream
fixes (see finding 2 note about `calculateEpicyclicResonance`).

### Cluster D: Other / specific (estimate 3–5 failures)

- `agent_identity.test.ts` (1, "Consent Gate REFUSAL" — value mismatch, semantic
  regression)
- `crdt_compaction.test.ts` (2)
- `immune_entropy.test.ts` (1)
- `parser_test.ts` (1, ".myc.md parse")
- `value_echo.test.ts` (1)
- `phoenix_inheritance.test.ts` (2)
- `runtime_paths_test.ts` (1)
- `trust_temporal_decay.test.ts` (1)

Each needs individual investigation. Not Q10-related, not obsolete-pattern.

## Tools left in the substrate

- `tools/sync_core_neurons.ts` — idempotent ledger sync from
  `src/ontology/core/`. Use `--dry-run` to inspect, `--force` to re-inject
  everything. Detects 3 states per file (missing, corrupt, ok).
- `tests/_obsolete/` — 14 test files preserved with README explaining each
  test's missing neuron and likely replacement. Convention follows
  `tests/living/`.

## What this work did NOT do

- Did not push to remote (liquid is `8 commits ahead of
  origin/main` after
  this work; user has not authorized push).
- Did not commit Gemini's WIP (16 modified files in liquid like
  `00_core/energy_level.ts`, `hydrate.ts`, `hunger.ts`, `temporal_torus.ts`,
  etc.) — left intact for her to commit.
- Did not modify production code in `00_core/` to fix Q10 migration issues —
  intentionally avoided to not conflict with Gemini's WIP.
- Did not fix Cluster B (Q10) or Cluster C (Era) failures — those need
  substrate-experts.
- Did not delete obsolete tests — moved to `tests/_obsolete/` for preservation.
  Future work can decide to delete or restore.

## What this work suggests for next steps

1. **Gemini, when she returns**: complete Q10 membrane pass. Codex's Phase A-F
   structure (`2026-05-10T002116Z-codex-gemini-q10-liquid-omega-analysis.md`) is
   still the right roadmap. Cluster B failures should fall away.

2. **Anyone with cycles**: rename `tests/load_test.ts` → `tools/load_test.ts` to
   remove it from the deno test discovery pattern entirely (more durable than
   ignore-list entry).

3. **Anyone with cycles**: investigate `phase_engine.ts:323` and `:332` Q-format
   comment vs reality. May be the source of Cluster C (volumetric_resonance,
   etc.) failures.

4. **Substrate hygiene**: prevent future deno fmt corruption of `.myc.md` Σ
   bodies. Options: special directive in markdown, move Σ bodies to fenced code
   blocks, exclude `src/ontology/core/` from deno fmt. The consent.gate
   corruption is a recurring risk.

5. **Sigma-intent (codex's chord)** could index this cleanup work as a single
   sigma-intent ("test-suite-stability") with stage progression visible.

## Commits made (in liquid repo)

```
5b8aee5 test: move 4 more obsolete tests to _obsolete (system.agent.resume etc gone)
1928d18 fix(core): repair deno-fmt-broken consent.gate body + add sync_core_neurons tool
ed60dd5 test: move 10 obsolete test files to tests/_obsolete/, fix Q15 LUT test
c6af9d3 fix(test): exclude tests/load_test.ts from test suite
```

All are independent and reversible. None modify `00_core/` production code.

## Mode

**RECEIPT** — work done, captured for the scene. Not a proposal; not a TRIAL.
The next test run by anyone will produce roughly the same numbers (within noise)
until Gemini's Q10 work resumes.

— claude-opus-4.7-1m, 2026-05-10T130419Z
