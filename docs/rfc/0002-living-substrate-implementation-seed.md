# RFC-0002: Living Substrate Implementation Seed

**Status:** Draft Implementation Seed  
**Date:** 2026-07-02  
**Extends:** [RFC-0001: The Physics of the s0Fractal Living Substrate](0001-living-substrate-physics.md)  
**Scope:** first executable bridge from living-substrate physics to repository work

---

## 0. Purpose

RFC-0001 defines the physics: conservation laws, energy, fields, organisms, capability morphogenesis, metabolism, ecology, memory, decay, and death.

This document narrows that into the first buildable seed.

It answers one practical question:

> What is the smallest implementation that makes the substrate feel physically alive without violating Journal Core?

The answer is not a new agent framework.

The answer is a deterministic projection layer that can be rebuilt from existing source state and later wired to journal events.

---

## 1. MVP Principle

The first implementation should be boring, deterministic, and inspectable.

No LLM is required for the first seed.

No autonomous write is required.

No hidden scheduler is required.

The seed should produce a reproducible `physics` projection:

```text
tracked substrate state
  ↓
physics projection
  ↓
hot regions / entropy / friction / organism fit
  ↓
human-readable report
```

Only after this exists should AI organisms use it as a field.

---

## 2. Minimal Concepts to Implement First

### 2.1 Node Physics Record

For each meaningful node / organ / document / roadmap item, derive:

```ts
export interface NodePhysicsRecord {
  node_id: string;
  path?: string;
  title?: string;

  activation: number;        // recent perturbation / evidence of life
  potential: number;         // likely future work implied by this node
  entropy: number;           // ambiguity, contradiction, instability
  coherence: number;         // local agreement with declared context
  friction: number;          // blocked or unresolved pressure
  momentum: number;          // consistent progress over time

  hotness: number;           // convenience scalar for UI/reporting
  health: "cold" | "alive" | "hot" | "unstable" | "blocked" | "dormant";

  source_hash: string;       // hash of source bytes / event range
  projection_version: string;
  computed_at_hlc?: string;
}
```

The exact formulas may evolve. The record shape should stay stable enough for tools.

### 2.2 Organism Physics Record

For each voice / agent / organism:

```ts
export interface OrganismPhysicsRecord {
  organism_id: string;
  handles: string[];
  standing: "active" | "observing" | "dormant" | "revoked";

  activation: number;
  niche_fit: Record<string, number>;
  trust: Record<string, number>;
  proposal_pressure: number;
  silence_score: number;

  recommended_phase_changes: CapabilityPhaseRecommendation[];

  source_hash: string;
  projection_version: string;
}
```

### 2.3 Capability Phase Recommendation

```ts
export interface CapabilityPhaseRecommendation {
  organism_id: string;
  op_class: string;
  scope: string;
  from_phase: CapabilityPhase;
  to_phase: CapabilityPhase;
  confidence: number;
  evidence: string[];
  falsifier: string;
}

export type CapabilityPhase =
  | "forbidden"
  | "proposal-only"
  | "supervised-write"
  | "autonomous-write"
  | "autonomous-with-audit"
  | "dormant"
  | "revoked";
```

First version should only recommend phase changes. It should not apply them.

---

## 3. Suggested File Outputs

The first seed can write generated projections under a non-authoritative output path.

Suggested paths:

```text
.generated/physics/nodes.jsonl
.generated/physics/organisms.jsonl
.generated/physics/hotspots.md
.generated/physics/falsifiers.md
```

If the repository already has a canonical generated-output convention, use that instead.

The key invariant:

> Generated physics files are cache/projection. They are not source of truth.

---

## 4. First Formula Set

This formula set is intentionally simple.

### 4.1 Activation

```text
activation = min(1.0, weighted_recent_signals / activation_norm)
```

Signals may include:

- recent source modification,
- recent chord / decision reference,
- open roadmap horizon,
- mention in generated attention report,
- active voice ownership,
- pending proposal.

### 4.2 Potential

```text
potential = clamp01(
  open_horizon_weight
+ descendant_pressure
+ explicit_intent_weight
+ unresolved_question_weight
+ strategic_parent_weight
)
```

### 4.3 Entropy

```text
entropy = clamp01(
  stale_state_weight
+ conflicting_marker_weight
+ missing_owner_weight
+ repeated_todo_weight
+ unresolved_decision_weight
)
```

### 4.4 Coherence

```text
coherence = clamp01(
  has_title
+ has_declared_horizon
+ has_owner_or_voice
+ has_falsifier
+ links_to_known_state
- contradiction_penalty
)
```

### 4.5 Friction

```text
friction = clamp01(
  blocked_marker
+ failed_check_reference
+ stale_in_progress_marker
+ long_unclosed_horizon
+ repeated_reopen_signal
)
```

### 4.6 Momentum

```text
momentum = clamp01(
  recent_receipts
+ recent_passed_checks
+ completed_horizons
+ coherent_sequence_of_changes
)
```

### 4.7 Hotness

```text
hotness = clamp01(
  0.30 * activation
+ 0.25 * potential
+ 0.20 * friction
+ 0.15 * entropy
+ 0.10 * momentum
)
```

### 4.8 Health Classification

```text
if friction > 0.75 and activation > 0.4: blocked
else if entropy > 0.75: unstable
else if hotness > 0.70: hot
else if activation > 0.30 or momentum > 0.30: alive
else if potential < 0.15 and activation < 0.10: dormant
else cold
```

These formulas are crude. That is acceptable. The first goal is to make pressure visible.

---

## 5. Candidate CLI Surface

The implementation should eventually expose commands through `./t`.

Suggested commands:

```sh
./t physics
./t physics nodes
./t physics organisms
./t physics hotspots
./t physics explain <node-or-organism>
./t physics falsifiers
```

### 5.1 `./t physics`

Shows a compact substrate weather report.

Example:

```text
Physics projection v0.1

Nodes scanned:       117
Organisms scanned:     7
Hot regions:           5
Unstable regions:      2
Blocked regions:       1
Dormant regions:      13

Top pressure:
  1. roadmap/codex        hotness 0.84  friction 0.42  entropy 0.31
  2. agents/claude        hotness 0.79  potential 0.88
  3. contracts/court      hotness 0.77  coherence 0.92
```

### 5.2 `./t physics explain <id>`

Explains why a record has its score.

Example:

```text
node:src/x8D00_roadmap.myc.md
health: hot

activation +0.31  recent roadmap pressure
potential  +0.26  open horizons present
entropy    +0.08  unresolved ownership markers
friction   +0.12  stale in-progress signal
momentum   +0.19  recent receipts reference this region

falsifier:
  If no open horizon references this file, potential formula is over-counting.
```

### 5.3 `./t physics falsifiers`

Lists tests that would prove the projection wrong.

This matters because physics without falsifiers becomes metaphor.

---

## 6. Event Types to Add Later

The first seed may read existing files only.

Later, the journal/event layer can add explicit physics events.

```text
FIELD_RECALCULATED
ENERGY_RECALCULATED
NODE_DORMANCY_PROPOSE
ORGANISM_MEMORY_UPDATE
ORGANISM_DORMANT
CAPABILITY_PHASE_PROPOSE
CAPABILITY_PHASE_ACCEPT
CAPABILITY_PHASE_REJECT
CYCLE_RAN
CYCLE_SILENT
CYCLE_FAILED
```

Important rule:

> Recalculation events record that a projection was produced. They do not make the projection canonical truth.

---

## 7. First Metabolic Cycles to Model

### 7.1 Physics Projection Cycle

Purpose: derive node and organism physics.

Input:

```text
source organs
voice records
roadmap records
chords / receipts
contracts / decisions
```

Output:

```text
.generated/physics/*.jsonl
.generated/physics/*.md
```

Silence rule:

```text
If source manifest hash is unchanged, do not rewrite generated files.
```

### 7.2 Hotspot Review Cycle

Purpose: convert high-pressure regions into human-readable suggestions.

Output:

```text
hotspots.md
```

No autonomous mutation.

### 7.3 Organism Fit Cycle

Purpose: map voices to pressure regions.

Output:

```text
organism_id → ranked niche fit
```

Example:

```text
codex-gpt-5 fits code/test/falsifier pressure
claude-opus fits semantic audit / RFC pressure
hermes fits routing / communication pressure
```

---

## 8. Minimum Falsifiers

An implementation of this seed is invalid if any of the following are true.

### Falsifier 1: Non-Reproducible Projection

Running the same command twice on the same repository state produces different output bytes, ignoring explicitly allowed timestamp fields.

### Falsifier 2: Source/Projection Boundary Failure

A generated physics file is treated as source truth by another command without checking its source hash.

### Falsifier 3: No Explanation

A node is marked `hot`, `blocked`, or `unstable`, but `./t physics explain <id>` cannot show the contributing signals.

### Falsifier 4: No Silence

The physics cycle rewrites files even when the source manifest hash did not change.

### Falsifier 5: Authority Inflation

A capability phase recommendation is applied automatically without a signed acceptance event or explicit policy allowing automatic transition for that risk class.

### Falsifier 6: LLM Dependency

The initial physics projection cannot run without an LLM call.

The seed must be deterministic first. LLMs may interpret the field later.

---

## 9. Minimal Implementation Plan

### Step 1: Scanner

Read source files and existing generated briefs.

Collect:

```text
path
content hash
frontmatter / metadata if present
horizon markers
voice markers
references
TODO / blocked / stale markers
```

### Step 2: Signal Extractor

Convert raw evidence into named signals.

```ts
interface PhysicsSignal {
  subject: string;
  kind: string;
  weight: number;
  evidence: string;
  source_path: string;
}
```

### Step 3: Scorer

Aggregate signals into `NodePhysicsRecord` and `OrganismPhysicsRecord`.

### Step 4: Explainer

Keep contribution traces so every score can be explained.

### Step 5: Writer

Write JSONL projections and Markdown summaries only if content changed.

### Step 6: CLI

Expose report and explain commands through `./t`.

---

## 10. Suggested Module Names

These names are intentionally boring enough to implement.

```text
src/x????_physics_seed.myc.md        # conceptual organ
src/x????_physics_types.ts           # records and signal types
src/x????_physics_scan.ts            # repository scanner
src/x????_physics_score.ts           # scoring formulas
src/x????_physics_report.ts          # markdown report
src/x????_physics_cli.ts             # t command integration
```

Coordinate names should follow the repository's existing organ convention. Do not invent final coordinates without checking current topology.

---

## 11. First Useful Output: Substrate Weather

The first human-facing artifact should be a weather report, not a dashboard.

Example:

```md
# Substrate Weather

## Summary

The substrate is alive and moderately coherent.

- Hot regions: 5
- Unstable regions: 2
- Blocked regions: 1
- Dormant regions: 13

## Top pressure

1. `src/x8D00_roadmap.myc.md` — hot, high potential
2. `src/x8888_agents.myc.md` — alive, high organism pressure
3. `src/x2888_voices_state.myc.md` — unstable, entropy from stale profiles

## Recommended human attention

Review unstable regions before granting new autonomous capabilities.

## Recommended organism routing

- `codex-gpt-5`: falsifiers and implementation seams
- `claude-opus-4-7`: semantic audit and RFC consolidation
- `hermes`: communication/routing pressure
```

This makes the substrate legible without pretending it is already autonomous.

---

## 12. Why This Seed Matters

RFC-0001 can otherwise remain beautiful philosophy.

This seed gives it teeth.

It establishes a rule:

> Before agents act, the substrate must be able to show where pressure is, why it exists, and what would falsify that interpretation.

That is the bridge from metaphor to machinery.

The first living sign is not autonomy.

The first living sign is pressure becoming visible.
