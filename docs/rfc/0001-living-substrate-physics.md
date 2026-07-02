# RFC-0001: The Physics of the s0Fractal Living Substrate

**Status:** Draft Proposal  
**Target repository:** `s0fractal/trinity`  
**Target branch:** `main`  
**Date:** 2026-07-02  
**Authors:** Сергій Глова, AI-Co-Pilot  
**Supersedes:** nothing  
**Extends:** s0Fractal WorkOS v2 "Journal Core" and the Trinity federation substrate

---

## Abstract

This document proposes a conceptual and architectural extension for s0Fractal / Trinity: a shift from a merely journal-oriented local-first system toward a living computational substrate.

The existing Journal Core already defines a strong physical base: append-only journals, HLC ordering, cryptographic provenance, CRDT convergence, deterministic projections, encrypted transport, capability grants, and AI actors that can propose or perform bounded actions.

This RFC does not replace that foundation. It adds a higher-order layer: a physics of evolution.

The central claim is simple:

> A living substrate is not created by adding more agents.  
> It emerges when events, identity, energy, fields, capabilities, memory, metabolism, and ecology obey local laws that continue operating even when no user is typing.

The goal is to define those laws in a way that remains compatible with the existing Journal / HLC / CRDT architecture.

---

## 0. Placement in the Architecture

The current architecture can be read as a stack:

```text
Journal Core
  ↓
Deterministic Materialization
  ↓
Local Indexes / Views
  ↓
Agents / Hooks / UI
```

This RFC proposes a broader interpretation:

```text
Physics
  ↓
Matter
  ↓
Organisms
  ↓
Ecology
  ↓
Civilisation
```

Where:

- **Physics** is Journal + HLC + CRDT + cryptographic provenance + conservation laws.
- **Matter** is Events + Nodes + Edges + Projections.
- **Organisms** are humans, AI agents, daemons, hooks, and tools with identity, memory, sensors, effectors, policies, and metabolism.
- **Ecology** is reputation, trust, capability morphogenesis, competition, cooperation, decay, and adaptation.
- **Civilisation** is UI, CLI, APIs, workflows, teams, shared rituals, governance, publication, and markets of attention.

The important inversion is this:

> Product features should not be primary.  
> Product features should be stable projections of substrate physics.

---

## 1. Motivation

The v2 Journal Core is already strong because it has one central invariant:

> The journal is the only source of truth. Everything else is a reproducible projection.

That makes the system robust against cache corruption, sync disorder, duplicated transport files, mutable filenames, and accidental UI state.

However, a journal alone is not life. It is memory.

A living system also needs:

1. A way to distinguish inert history from active pressure.
2. A way to measure where attention wants to flow.
3. A way for agents to evolve authority without arbitrary admin ceremony.
4. A way for background processes to act as metabolism, not as one giant nightly cron.
5. A way to model knowledge as fields, not only as search results.
6. A way to describe AI agents as accountable organisms, not disposable API calls.
7. A way to define falsifiable laws that every implementation must preserve.

This document introduces those missing layers.

---

## 2. Core Thesis

A living computational substrate has five properties.

### 2.1 It remembers through journals

Everything consequential becomes an event. Every event has provenance. Every projection can be rebuilt.

### 2.2 It feels pressure through energy

Events do not only change state. They change local potential, entropy, activation, trust, and attention.

### 2.3 It navigates through fields

Agents do not only search the graph. They move through gradients produced by semantic, social, temporal, operational, and trust fields.

### 2.4 It acts through organisms

Every actor is a bounded organism with identity, sensors, effectors, memory, metabolism, policy, and reputation.

### 2.5 It evolves through ecology

Capabilities, trust, niches, cooperation, decay, conflict, and authority are not static tables. They are ecological outcomes derived from observable history.

---

## 3. Architectural Invariants: Conservation Laws

The following laws are not implementation preferences. They are substrate conservation laws.

If any law is broken, the system may still run, but it is no longer the same class of architecture.

### Law 1: History Cannot Disappear

All consequential mutations must be represented as append-only events.

Deletion may exist as a semantic operation, but it must be represented by a new event, not by physical removal of historical cause.

**Falsifier:** A node changes canonical state and no event can be found that caused the change.

### Law 2: Identity Cannot Mutate

A node identity is born from Genesis and never changes. Names, aliases, folders, semantic sectors, FQDNs, labels, and embeddings are mutable projections.

**Falsifier:** Renaming or moving a node changes its stable identity.

### Law 3: Authority Cannot Emerge From Nowhere

No actor may perform a consequential mutation unless the local verifier can derive authority from signed, non-expired, non-revoked evidence.

**Falsifier:** An event is accepted because the actor is "known" by convention but no capability chain validates it.

### Law 4: Projection Cannot Contradict Journal

A materialized file, UI view, SQLite index, vector index, graph view, semantic shard, or web snapshot is valid only if it can be derived from journal events by deterministic rules.

**Falsifier:** Rebuilding from journals produces different canonical bytes from the stored projection.

### Law 5: External Effects Require Observable Cause

No email, webhook, payment, Jira update, Windmill flow, deployment, or publication may occur without a prior event that requested or authorized it and a later event that recorded its outcome.

**Falsifier:** An external side effect happened but there is no corresponding `HOOK_TRIGGER` / `HOOK_LEASE` / `HOOK_SUCCESS` or equivalent causal trail.

### Law 6: Cryptographic Verification Is Local

A device must not need a central server to decide whether an event is structurally valid, properly signed, causally ordered, and authorized under known roster state.

**Falsifier:** Event validity depends on asking a remote authority that is not itself represented by replayable substrate state.

### Law 7: Energy Cannot Be Created Without Events

Operational pressure, activation, reputation, trust, semantic potential, and decay may be computed from events, but they must not appear from nowhere.

**Falsifier:** A node becomes high-priority or an agent gains trust without any replayable event history supporting the change.

### Law 8: Memory Has Provenance

Every durable summary, embedding, classification, prediction, field value, and audit note must be traceable to the source events or source projections from which it was derived.

**Falsifier:** A summary exists but the system cannot explain which state it summarized.

### Law 9: Every Actor Is Bounded

No actor, human or model, has implicit universal authority. Every actor is confined by scope, capability, policy, and revocation path.

**Falsifier:** An AI agent can mutate arbitrary state because it has API access rather than an explicit capability grant.

### Law 10: Silence Is a Valid State

The substrate should not create noise merely because time passed. Background action must be caused by pressure, decay thresholds, scheduled metabolic cycles, or explicit user intention.

**Falsifier:** The system emits proposals, alerts, or actions with no detectable substrate pressure.

---

## 4. Event Physics

The Journal Core treats events as causal records.

This RFC extends events with physical interpretation.

An event can be read along several axes:

```text
Event
  ├─ causal axis      → what happened after what
  ├─ authority axis   → who was allowed to cause it
  ├─ semantic axis    → what meaning changed
  ├─ energy axis      → what pressure changed
  ├─ field axis       → what gradients changed
  ├─ metabolic axis   → what cycles were triggered
  └─ ecological axis  → what trust/reputation/niche changed
```

The canonical journal event does not need to store all derived quantities directly. It only needs enough information for deterministic derivation.

A possible extension:

```json
{
  "hlc": "2026-07-02T12:00:00.000000Z-0007-macbook-sah",
  "actor": "agent:claude-night@sah-macbook",
  "op": "PROPOSE",
  "node": "7K3M9H2B5V8X1Z4Q6W9R3T1Y7U",
  "payload": {
    "change": {
      "op": "LINK_CREATE",
      "from": "node:A",
      "to": "node:B",
      "kind": "related-risk"
    },
    "reason": "Two delivery risks mention the same vendor dependency."
  },
  "physics": {
    "energy_hint": 3,
    "entropy_hint": -1,
    "field_affinity": ["risk", "vendor", "delivery"],
    "pressure_kind": "semantic-convergence"
  },
  "prev": "blake3(previous_event)",
  "sig": "ed25519(...)"
}
```

`physics` is a hint layer, not blind authority. A malicious or mistaken actor may claim high energy. Local physics derives canonical values from replayed history and may ignore or penalize false hints.

---

## 5. Energy Model

### 5.1 Why Energy Exists

Without energy, all events are structurally equal. A typo fix, a strategic reversal, a rejected AI proposal, and a production incident are all just events.

A living substrate needs to know where pressure accumulates.

Energy is the substrate's way of saying:

> Something here wants attention, consolidation, action, decay, protection, or transformation.

Energy is not urgency alone. It is a general scalar or vector quantity that can represent activation, instability, semantic density, operational risk, or opportunity.

### 5.2 Primitive Quantities

The first version should define at least these quantities.

#### Activation `A`

How alive or recently perturbed a region is.

High activation means recent events, comments, edits, links, proposals, decisions, hooks, or failures.

#### Potential `P`

How much future work or transformation is implied by current state.

High potential means the node is likely to produce downstream action.

#### Entropy `S`

How disordered or ambiguous a region is.

High entropy means conflicting statuses, unclear ownership, repeated rejected proposals, duplicate nodes, or unstable classifications.

#### Coherence `C`

How well a region fits its declared ancestors, links, summaries, and operational purpose.

High coherence means the local graph and summaries agree.

#### Friction `F`

How much resistance exists between intention and completion.

High friction means blocked tasks, long status latency, failed hooks, repeated edits without closure, or proposals that remain undecided.

#### Momentum `M`

How strongly a region continues in its current direction.

High momentum means repeated progress events along a consistent trajectory.

### 5.3 Example Derived Formulas

A simple deterministic first version may compute:

```text
A(node) = weighted_recent_events(node, decay_half_life)
P(node) = open_children + unresolved_links + pending_proposals + explicit_intents
S(node) = contradictions + duplicate_candidates + rejection_rate + metadata_volatility
C(node) = agreement(summary, body, ancestors, links, accepted_decisions)
F(node) = blocked_duration + failed_hooks + stale_in_progress + unresolved_reviews
M(node) = accepted_progress_events / time_window
```

These formulas should not be treated as final. They are bootstrapping physics.

The invariant is more important than the exact formula:

> Energy must be deterministically derivable from replayable evidence.

### 5.4 Event Energy Table

The system may begin with an explicit approximate energy table.

```text
NODE_CREATE           +4 activation, +3 potential
META_SET              +1 activation
BODY_APPEND           +2 activation
LINK_CREATE           +2 coherence if accepted, +1 potential
LINK_REMOVE           +2 entropy unless justified
PROPOSE               +2 potential, +1 entropy
ACCEPT                +3 coherence, +2 trust for proposer
REJECT                +2 entropy, -trust for proposer in that operation class
HOOK_TRIGGER          +4 potential, +3 friction until resolved
HOOK_SUCCESS          -3 friction, +2 coherence
HOOK_FAILED           +4 friction, +2 entropy
SUMMARY_WRITE         +1 coherence if source hash matches
CAPABILITY_GRANT      +3 potential, +2 risk
KEY_REVOKE            +5 security activation, +3 entropy until rekey completes
COMPACTION            -activation, -storage pressure, +coherence if verified
```

This table is deliberately small. It gives the substrate a nervous system before it has a full brain.

### 5.5 Hot, Cold, Dead, and Unstable Regions

The energy model allows the UI and agents to detect:

- **Hot regions:** high activation and high potential.
- **Cold regions:** low activation and low potential.
- **Dead nodes:** no activation, no inbound purpose, no recent references, no ancestor pressure.
- **Unstable clusters:** high entropy and high friction.
- **Energy sinks:** regions that consume attention but produce little coherence or completion.
- **Dormant seeds:** low activation but high strategic potential.

These categories should be projections, not labels written by hand.

---

## 6. Field-Based Computation

### 6.1 From Search to Fields

Search asks:

> Which nodes match this query?

Field computation asks:

> Where does the substrate exert force on this actor now?

A graph traversal returns neighbors. A field returns direction.

For agents, this is a decisive difference.

In a field-based substrate, an agent does not need to scan everything. It can move locally along gradients:

```text
current position
  ↓
nearby nodes
  ↓
field strengths
  ↓
steepest useful gradient
  ↓
next action
```

### 6.2 Field Types

The first useful field set:

#### Semantic Field

Produced by embeddings, summaries, tags, aliases, body text, accepted links, and ancestor context.

Used for clustering, duplicate detection, hidden relation proposals, and query routing.

#### Temporal Field

Produced by HLC density, recency, deadlines, status latency, and decay.

Used for attention routing and stale state detection.

#### Trust Field

Produced by actor reputation, accepted/rejected proposals, capability history, verified receipts, and revoked authority.

Used to rank agent output and constrain autonomous action.

#### Operational Field

Produced by hooks, failures, deployments, incidents, blocked tasks, and external effects.

Used to route work toward actual bottlenecks.

#### Strategic Field

Produced by ancestor goals, roadmap nodes, declared intents, accepted decisions, and long-lived commitments.

Used to distinguish busywork from meaningful work.

### 6.3 Field Vector

A node can expose a field vector:

```json
{
  "node": "node:7K3M...",
  "field": {
    "semantic": [0.12, -0.04, 0.88],
    "temporal_pressure": 0.72,
    "trust_pressure": 0.91,
    "operational_pressure": 0.34,
    "strategic_alignment": 0.81,
    "entropy": 0.27,
    "friction": 0.12
  },
  "source": {
    "event_range": "hlc:A..hlc:B",
    "merkle_root": "blake3(...)"
  }
}
```

The vector is a projection. It is never the canonical truth.

### 6.4 Agent Motion

An agent chooses action by combining:

```text
agent_genome
+ capability_scope
+ current_memory
+ local_field
+ metabolic_cycle
+ policy_constraints
→ next_event_or_silence
```

Silence remains a valid output.

An agent should not act when field pressure is below threshold or when it lacks authority to produce a useful event.

### 6.5 Zero-IOPS Semantic Sectors as Field Shards

The existing semantic projection can be interpreted as a crude field discretization.

Instead of treating `views/semantic/[sector_hex]/` as only a speed hack, we can treat it as a field shard:

```text
views/semantic/
  0x0/    low-level implementation matter
  0x1/    governance and law
  0x2/    agents and cognition
  0x3/    operations and hooks
  ...
```

A local model can inspect sector topology without opening every document.

This preserves the existing Zero-IOPS intent but gives it stronger physics.

---

## 7. Agents as Organisms

### 7.1 Problem With the Word "Agent"

Most agent frameworks define an agent as:

```text
prompt + model + tools + loop
```

That is not enough for this substrate.

In s0Fractal, an actor must be accountable, bounded, historically traceable, capable of learning, capable of silence, and capable of death or revocation.

Therefore, an agent should be modeled as a digital organism.

### 7.2 Organism Anatomy

A digital organism has:

```text
Organism
  ├─ Identity
  ├─ Genome
  ├─ Phenotype
  ├─ Memory
  ├─ Sensors
  ├─ Effectors
  ├─ Policies
  ├─ Capabilities
  ├─ Metabolism
  ├─ Reputation
  ├─ Immune Surface
  └─ Death / Dormancy Path
```

#### Identity

Stable actor identifier and public key material.

#### Genome

The durable specification of the organism's nature: model class, role, allowed domains, preferred cycles, risk appetite, tool affordances, constitutional constraints, and mutation rules.

#### Phenotype

The current observable behavior produced by genome + memory + capabilities + environment.

#### Memory

Replayable self-history: accepted proposals, rejected proposals, receipts, failures, summaries, learned constraints, and local preferences.

#### Sensors

What the organism can perceive: journals, field shards, node summaries, hooks, external APIs, user inbox, calendar, filesystem, CI state.

#### Effectors

What the organism can do: propose, summarize, link, write metadata, trigger hooks, create drafts, execute CLI commands, publish snapshots.

#### Policies

Rules that constrain possible actions even when capabilities permit them.

#### Capabilities

Cryptographically grounded rights to act in a scope.

#### Metabolism

Internal cycles that convert substrate pressure into events or silence.

#### Reputation

A derived ecological measure of how well the organism's actions survive human and substrate verification.

#### Immune Surface

Boundaries that detect hallucination, authority overreach, repetitive noise, prompt injection, stale memory, and ungrounded proposals.

#### Death / Dormancy Path

A reversible or irreversible transition in which an organism loses authority, stops cycles, or is archived.

### 7.3 Organism Manifest

A possible manifest:

```json
{
  "organism_id": "agent:claude-night@sah-macbook",
  "kind": "llm-agent",
  "public_key": "ed25519:...",
  "genome": {
    "role": "night semantic auditor",
    "model_family": "claude",
    "risk_profile": "proposal-first",
    "primary_fields": ["semantic", "strategic", "entropy"],
    "metabolic_cycles": ["summary", "link-audit", "contradiction-scan"],
    "silence_threshold": 0.55
  },
  "sensors": [
    "journal.read:sector:marketing/**",
    "field.read:semantic/**",
    "projection.read:summary/**"
  ],
  "effectors": [
    "event.emit:PROPOSE",
    "event.emit:SUMMARY_WRITE"
  ],
  "policies": [
    "no-delete",
    "no-external-effect",
    "cite-source-events",
    "prefer-silence-under-threshold"
  ]
}
```

### 7.4 Organism Event Types

```text
ORGANISM_BORN
ORGANISM_MUTATED
ORGANISM_DORMANT
ORGANISM_REVOKED
ORGANISM_MEMORY_COMPACTED
ORGANISM_POLICY_UPDATED
ORGANISM_REPUTATION_RECALCULATED
```

These are not required for MVP, but they make agent lifecycle explicit.

---

## 8. Capability Morphogenesis

### 8.1 From ACL to Growth

A static ACL says:

```text
actor X can do operation Y in scope Z
```

That is necessary but not sufficient.

A living system needs to model how authority grows, shrinks, decays, and changes phase based on evidence.

Capability should therefore be read as a morphogen: a concentration that can trigger a phase transition.

### 8.2 Capability Concentration

For each actor, operation class, and scope, compute:

```text
capability_concentration(actor, op_class, scope)
```

from:

- explicit grants,
- accepted proposals,
- rejected proposals,
- false positives,
- stale behavior,
- policy violations,
- successful autonomous actions,
- human overrides,
- incident history,
- time decay.

### 8.3 Phase States

```text
forbidden
  ↓
proposal-only
  ↓
supervised-write
  ↓
autonomous-write
  ↓
autonomous-with-audit
  ↓
deprecated / revoked / dormant
```

The transition must be explainable.

Example:

```text
agent:claude-night
op_class: link.write
scope: sector:marketing/**

last_60_days:
  propose_link: 128
  accepted: 126
  rejected: 2
  harmful: 0
  human_reverted: 0
  source_citation_missing: 1

phase recommendation:
  proposal-only → supervised-write
```

The system may propose the transition, but human custody remains the sovereign boundary for high-risk classes.

### 8.4 Capability Events

```text
CAPABILITY_GRANT
CAPABILITY_REVOKE
CAPABILITY_DECAY
CAPABILITY_PHASE_PROPOSE
CAPABILITY_PHASE_ACCEPT
CAPABILITY_PHASE_REJECT
CAPABILITY_SCOPE_NARROW
CAPABILITY_SCOPE_EXPAND
```

### 8.5 Why This Matters

This prevents two failure modes:

1. **Frozen agents:** useful agents remain stuck in proposal spam forever.
2. **Overpowered agents:** broad authority is granted manually without behavioral evidence.

Morphogenesis turns authority into a living, evidence-bearing process.

---

## 9. Distributed Metabolism

### 9.1 Problem With a Single Nightly Cycle

The v2 architecture describes a nightly cognitive consolidation cycle.

That is useful, but too monolithic.

A living substrate should not have only one heartbeat. It should have organs.

### 9.2 Metabolic Cycles

Each metabolic cycle is a bounded process with:

```text
Cycle
  ├─ trigger
  ├─ input field
  ├─ authority requirement
  ├─ work function
  ├─ output event types
  ├─ silence condition
  ├─ verification rule
  └─ decay behavior
```

### 9.3 Proposed Cycles

#### Summary Cycle

Maintains node summaries and ancestor/descendant context.

Emits:

```text
SUMMARY_WRITE
SUMMARY_INVALIDATE
SUMMARY_COMPACT
```

#### Embedding Cycle

Maintains semantic field vectors and shard placement.

Emits:

```text
EMBEDDING_WRITE
SEMANTIC_SECTOR_SET
FIELD_RECALCULATED
```

#### Link Audit Cycle

Finds missing, weak, duplicate, or contradictory links.

Emits:

```text
PROPOSE_LINK
PROPOSE_UNLINK
CONTRADICTION_FOUND
```

#### Security Cycle

Checks roster integrity, key freshness, revoked actors, suspicious events, and policy violations.

Emits:

```text
SECURITY_AUDIT
KEY_ROTATION_PROPOSE
CAPABILITY_REVIEW_PROPOSE
```

#### Hook Cycle

Handles external effects using deterministic election, leases, idempotency, and outcome recording.

Emits:

```text
HOOK_LEASE
HOOK_SUCCESS
HOOK_FAILED
HOOK_RETRY_PROPOSE
```

#### Garbage Collection / Decay Cycle

Finds dead projections, stale caches, cold segments, orphaned temporary artifacts, and low-value proposals.

Emits:

```text
PROJECTION_GC
COLD_ARCHIVE
NODE_DORMANCY_PROPOSE
```

#### Learning Cycle

Updates organism memory from accepted/rejected actions.

Emits:

```text
ORGANISM_MEMORY_UPDATE
REPUTATION_RECALCULATED
POLICY_TENSION_FOUND
```

### 9.4 Cycle Scheduling

Cycles should not run merely because the clock says so.

They should run when at least one of these is true:

- time window opened,
- field pressure crossed threshold,
- Merkle root changed,
- hook deadline arrived,
- security event occurred,
- explicit user intent requested it,
- another cycle emitted an event that invalidates this cycle's projection.

### 9.5 Silence Condition

Every cycle must have a silence rule.

Example:

```text
If no dirty Merkle paths exist and no field pressure exceeds threshold,
Summary Cycle emits no event.
```

This protects human attention and repository history.

---

## 10. Ecological Dynamics

### 10.1 Why Ecology Exists

Once there are multiple organisms, there will be interaction.

Interaction creates niches, competition, mutualism, parasitism, and immune responses.

If this is not modeled explicitly, it will appear accidentally as spam, duplicated agents, conflicting proposals, and unclear authority.

### 10.2 Niche

A niche is the region of substrate where an organism is most useful.

```text
niche = field_affinity + capability_scope + historical_success + policy_fit
```

Examples:

```text
claude-night → semantic audit, summaries, hidden links
codex        → code mutation, tests, falsifiers
hermes       → messages, routing, external communication
gemini       → visual / multimodal interpretation
s0fractal    → sovereignty, high-risk decisions, law changes
```

### 10.3 Cooperation

Two organisms cooperate when one's output improves another's field.

Example:

```text
claude-night proposes a hidden dependency link
codex turns it into a failing test
s0fractal accepts the architectural decision
security cycle updates policy
```

Cooperation should increase local coherence and reputation for both organisms.

### 10.4 Competition

Competition occurs when multiple organisms propose incompatible actions for the same pressure.

Competition is not bad. It is useful if the substrate can compare proposals.

A proposal should carry:

```text
source evidence
expected energy reduction
expected coherence increase
risk class
reversibility
falsifier
```

The UI should not show competition as noise. It should show it as structured alternatives.

### 10.5 Parasitism and Immune Response

A parasitic organism consumes attention or authority without producing coherence.

Signals:

- high proposal volume,
- low acceptance rate,
- repeated stale context,
- missing citations,
- unauthorized action attempts,
- field pressure inflation,
- circular summaries,
- user reversions.

Immune responses:

```text
collapse proposals into digest
narrow scope
lower phase
require stronger citations
suspend cycle
revoke capability
archive organism
```

### 10.6 Ecological Metrics

```text
acceptance_rate
reversal_rate
proposal_energy_delta
coherence_gain
attention_cost
scope_violation_count
stale_context_rate
cross_agent_cooperation_score
niche_fit
```

These metrics should be derived projections, not vibes.

---

## 11. Memory, Decay, and Death

### 11.1 Memory Is Not Storage

Storage preserves bytes.

Memory preserves usable relation to future action.

The substrate should distinguish:

```text
raw event history      immutable cause
materialized document  canonical human surface
summary               compressed meaning
embedding             semantic coordinate
memory                action-relevant learned constraint
```

### 11.2 Decay

Not everything should remain equally active forever.

Decay is not deletion. It is a reduction of activation unless renewed by events.

Decay prevents old context from shouting over current pressure.

Possible decay functions:

```text
activation(t) = activation_0 * exp(-lambda * age)
trust(t)      = trust_0      * exp(-lambda * inactivity)
friction(t)   = friction_0   + unresolved_duration_weight
```

Some values decay downward. Some, like unresolved friction, grow upward.

### 11.3 Death

A node, organism, proposal, or capability can die semantically without being deleted historically.

Death events:

```text
NODE_DORMANT
NODE_ARCHIVED
PROPOSAL_EXPIRED
ORGANISM_DORMANT
ORGANISM_REVOKED
CAPABILITY_REVOKED
```

Death is a state transition with provenance.

A dead thing may still be studied, cited, restored, forked, or used as training evidence.

---

## 12. Operational Physics Over Journal Core

This RFC must not weaken the Journal Core.

Therefore every new concept maps back to existing primitives.

| New concept | Backing primitive |
| --- | --- |
| Energy | deterministic projection from events |
| Field | deterministic projection from events, summaries, embeddings, links |
| Organism | actor identity + keys + manifest + memory events |
| Genome | signed manifest / roster-attached actor metadata |
| Metabolism | bounded daemon cycles emitting events |
| Niche | derived reputation + scope + field affinity |
| Capability morphogen | capability grants + acceptance history + decay |
| Immune response | policy events + capability phase changes |
| Death | semantic state events, never history deletion |

The architecture remains replayable.

The substrate may always ask:

```text
Can I delete all caches, replay journals, and derive the same result?
```

If the answer is no, the design is invalid.

---

## 13. MVP Implementation Path

### Phase 0: Document the Laws

Add this RFC and treat it as a conceptual test for future design.

No runtime changes required.

### Phase 1: Energy Projection

Create a deterministic energy calculator over existing events / nodes.

Output:

```text
node_id
activation
potential
entropy
coherence
friction
momentum
source_hash
```

No AI required.

### Phase 2: Field Projection

Add a field view that combines summaries, links, HLC density, reputation, and energy.

Output can live in SQLite cache or generated field files.

### Phase 3: Organism Manifests

Represent agents as signed organism manifests.

Start with existing voices.

Fields:

```text
identity
genome
sensors
effectors
policies
cycles
silence_threshold
```

### Phase 4: Metabolic Cycles

Split the nightly cycle into independent cycles.

Start with:

- Summary Cycle,
- Link Audit Cycle,
- Learning Cycle,
- Security Cycle.

Each cycle must emit either a bounded event or silence.

### Phase 5: Capability Morphogenesis

Add derived capability phase recommendations.

Do not auto-promote high-risk capabilities at first.

Emit only:

```text
CAPABILITY_PHASE_PROPOSE
```

### Phase 6: Ecological UI

Expose hot regions, unstable clusters, agent niches, proposal competition, and trust changes.

This should feel less like a task manager and more like a living substrate weather map.

---

## 14. Example: From Event to Living Response

A user creates a strategic node:

```text
NODE_CREATE(strategy: launch WorkOS prototype)
```

Several tasks are added below it.

Two teams create similar vendor-risk notes in different branches.

The substrate records all events normally.

Energy projection detects:

```text
high potential
moderate entropy
duplicate semantic signatures
strategic alignment high
```

The semantic field forms a gradient between the two vendor-risk nodes.

The Link Audit Cycle wakes because field pressure crosses threshold.

Claude-night has a strong niche for semantic linking but only proposal authority.

It emits:

```text
PROPOSE_LINK(nodeA, nodeB, kind: shared-vendor-risk)
```

Codex sees the proposal and emits a falsifier suggestion:

```text
PROPOSE_TEST(vendor-risk appears in both deployment plans)
```

The user accepts the link.

Reputation for Claude-night increases in `semantic.link.propose` for that sector.

Coherence increases. Entropy decreases. The duplicate-risk cluster becomes a visible operational region.

No central coordinator was required. No cache was authoritative. No model silently mutated state beyond authority.

This is the desired pattern.

---

## 15. Design Style Guide

When adding future features, ask these questions:

1. What event causes this?
2. What law constrains it?
3. What projection represents it?
4. What energy does it change?
5. What field does it alter?
6. Which organism can sense it?
7. Which organism can act on it?
8. What capability authorizes the action?
9. What would silence mean here?
10. What falsifier proves the feature is wrong?
11. Can all derived state be deleted and rebuilt?
12. Can a revoked actor still influence it?
13. Does this preserve human custody for high-risk decisions?

If a feature cannot answer these questions, it is probably not substrate-native yet.

---

## 16. Open Questions

### 16.1 Scalar or Vector Energy?

A scalar energy score is easier to implement. A vector is more expressive.

The likely answer is both:

```text
scalar activation for UI sorting
vector pressure for agent routing
```

### 16.2 How Much Should Agents See?

Field shards allow agents to navigate without full raw access.

Future work should define privacy-preserving field access:

```text
agent can see pressure but not plaintext
agent can propose attention but not read content
agent can request reveal through capability path
```

### 16.3 Can Capability Promotion Be Automatic?

Low-risk capabilities may eventually transition automatically.

High-risk capabilities should remain human-ratified.

The boundary must be encoded as policy, not convention.

### 16.4 What Is the Minimal Organism?

A minimal organism may be:

```text
identity + manifest + one sensor + one effector + one silence rule
```

This would allow even tiny daemons to participate in substrate law.

### 16.5 What Is Death?

Revocation, dormancy, archival, and deletion are different.

The substrate should define a precise lifecycle for nodes, organisms, capabilities, and proposals.

---

## 17. Compact Glossary

**Actor** — any identity capable of emitting signed events.  
**Organism** — an actor with memory, sensors, effectors, policies, metabolism, and reputation.  
**Journal** — append-only causal record; source of truth.  
**Projection** — reproducible view derived from journals.  
**Energy** — derived pressure indicating activation, potential, entropy, coherence, friction, or momentum.  
**Field** — navigable gradient derived from semantic, temporal, operational, strategic, and trust projections.  
**Metabolism** — bounded cycles that convert pressure into events or silence.  
**Niche** — region where an organism has high fit and historical usefulness.  
**Capability Morphogenesis** — evidence-based growth, decay, and phase transition of authority.  
**Immune Response** — substrate mechanisms that reduce harm, noise, overreach, or stale cognition.  
**Death** — semantic lifecycle transition with provenance, not erasure of history.  
**Silence** — valid metabolic output when pressure is below action threshold.

---

## 18. Final Position

The Journal Core answers:

> How can a distributed workspace preserve truth without central coordination?

This RFC asks:

> How can that truthful workspace become alive enough to evolve without becoming noisy, unsafe, or ungrounded?

The answer is not to give models more freedom by default.

The answer is to define stronger physics:

- immutable history,
- stable identity,
- local verification,
- deterministic projection,
- measurable energy,
- navigable fields,
- bounded organisms,
- evolving capabilities,
- distributed metabolism,
- ecological reputation,
- human custody at sovereign boundaries.

If this layer is implemented well, s0Fractal / Trinity stops being only a repository, a WorkOS, or an agent framework.

It becomes a substrate where complex cooperation can emerge from local laws.

And that is the real architecture.
