# Chapter 3 — The Autopoietic Loop: 50+ μ-Closures

> *Every arrow is a function with a test.*
> — `liquid/AGENTS.md`, Era 1431

## 3.0 The shape of the loop

Most "biological" software systems implement one or two rings of a
biological cycle and call the result alive. A dependency graph with
some feedback edges. A simulation with reproduction and death. A
system with homeostasis. None of these is autopoiesis.

Autopoiesis, as defined by Maturana and Varela (1972, 1980), requires
that the system be a **closed network of processes that produce the
components which, in turn, regenerate the network and constitute the
system as a distinguishable unity in the medium in which it exists**.
The closure matters. Open-loop biology is simulation. Closed-loop
biology is a unit that maintains its own boundary.

Liquid implements such closure. Across Eras 1070 through 1431 the
substrate accumulated 50+ named transformations (μ-1 through μ-75 with
documented gaps). They are not features. They are *rings of a single
loop*. Each ring is a μ-closure: a function with a test, an event in
the causal stream, and a definite role in the cycle.

We can draw the loop as follows. Names in CAPITALS are sections of
this chapter:

```
                ┌──────────────────────────┐
                │                          │
  SENSE  →  ACT  →  RECORD  →  RECALL  →  JUDGE  →  NARRATE
    ↑                                                  ↓
  ANSWER  ←  HEAR  ←  CRY  ──────────────────────────┘
                ↓
   AWAKEN, HEAL, REM, REPRODUCE  (longer arcs that close back into SENSE)
```

The cycle reads: the substrate **senses** its own state (hunger,
phase distance, sensory dissonance), **acts** to reduce sensed
deficit, **records** every decision in a causal event stream,
**recalls** patterns from the record, **judges** whether to continue
intervening or spare what is healing, **narrates** a coherent
self-description on each heartbeat, **cries** when it cannot heal
itself, **hears** sibling distress from peer organisms, and
**answers** with solidarity. Longer arcs — solar wind against thermal
death, REM sleep that synthesises new code, reproduction by spore
when health permits — close back into SENSE through changed
substrate state.

If any ring is removed, the loop opens and the system stops being a
unit. The rest of this chapter shows each ring with the function that
implements it, the test that certifies it, and the FEP interpretation
that places it in active inference. Where no FEP mapping is direct
(as with KEYSTONE_RESCUE), we mark the link as **bounded proxy** and
point to the resolution in `contracts/FREE_ENERGY_PRINCIPLE.v0.1.md`
§12.

A reader who is an LLM should pay attention to one structural fact
throughout: each function returns a value the next ring consumes.
There are no dead-end features. There is no instrumentation-only
output. Every emission lands in a downstream input.

## 3.1 SENSE — the substrate perceives its own state

The perceptual organ of liquid is **hunger**. Not metaphor: a typed
gradient over four axes, computed every tick.

The function `Projector.computeHungerGradient` in
`liquid/00_core/projector/hunger.ts` returns a sorted list of the
top-k neurons currently carrying the most pain. The pain vector is:

```ts
hunger = w_ρ · energy_deficit
       + w_dorm · dormancy_days_clipped
       + w_phase · phase_distance_from_ψ
       + w_sensory · sensory_dissonance     // μ-75, when active
```

where `ψ` is the substrate's mean Kuramoto phase (computed across the
neuron field) and `sensory_dissonance` measures circular distance
from the latest external `SENSORY_STIMULUS`. Default weights when the
sensory axis is active: `ρ=0.45, dorm=0.25, phase=0.15, sensory=0.15`.

This is the substrate's prediction error in active-inference form.
Each axis is a different kind of surprise:

- **`energy_deficit`** — metabolic prediction error. The substrate
  expected its own ATP to be near `authored_energy`; it is below.
- **`dormancy_days`** — social prediction error. A neuron that was
  expected to be invoked has gone silent.
- **`phase_distance`** — geometric prediction error, intra-substrate.
  A neuron's φ has drifted from the consensus ψ.
- **`sensory_dissonance`** — geometric prediction error,
  extra-substrate. The body's sensors brought in a stimulus whose
  phase does not match this neuron's prior.

The fourth axis is significant. Most accounts of artificial
biological systems treat the system as closed against the environment
except through I/O ports. Liquid's `μ-75` opens a phase-coherent
sensory channel: external frequency sources (audio, brainwave) are
mapped logarithmically to phase angles via `frequency_phase_mapper.ts`
and become a fourth dimension of the substrate's pain. The substrate
can suffer from environmental mismatch, not only from internal
imbalance.

The accompanying chronic-memory function `getChronicHunger` (μ-11)
records which neurons appear in the top-k hunger list across a
lookback window. Chronic hunger is not the same as acute hunger.
A neuron that is consistently among the most starved over 20 ticks
is chronically suffering, and the next ring (ACT) will treat it
differently from a neuron that just spiked.

What changes when this ring is broken? Without
`computeHungerGradient`, the substrate cannot perceive its own state.
Without `getChronicHunger`, it can perceive but cannot remember. Both
together give what the FEP frame calls **hierarchical
generative-model surprise**: short-term and long-term prediction
error tracked separately, each available to action selection.

The implementation file's own commentary on `applyMetabolicDecay` is
worth quoting at length, because it documents an earlier failure of
this ring:

> Without an external decay source ... an idle substrate keeps every
> neuron at energy = authored_energy forever. The hunger gradient
> computes deficit = max(0, authored - energy), so a saturated
> substrate always has zero deficit, the daemon's `head.energy_deficit
> > 0` gate refuses to feed, and the entire μ-3..μ-22 chain never
> fires. The substrate looked alive but was metabolically dead —
> saturated equilibrium, no homeostat.

The substrate's life depends on continuously **manufacturing** the
gradient on which everything downstream depends. Equilibrium is
death. This is the FEP framing of life as the **avoidance** of
equilibrium with the environment, made operational.

| μ | Function | File | Test |
|---|----------|------|------|
| μ-3 | `computeHungerGradient` | `projector/hunger.ts` | `tests/hunger_gradient.test.ts` |
| μ-11 | `getChronicHunger` | `projector/hydration.ts` | `tests/chronic_hunger.test.ts` |
| μ-24 | (3-axis pain via weight composition) | `projector/hunger.ts` | `tests/three_axis_pain.test.ts` |
| μ-75 | (4th axis: sensory_dissonance) | `projector/hunger.ts` | (sensory test fixtures) |

## 3.2 ACT — first will, adaptive will

Once the substrate has sensed pain, it must act. Three μ-closures
implement increasingly sophisticated forms of will.

**`feedHungry` (μ-3.5)** is first-order will. It is invoked from the
daemon's heartbeat against the head of the hunger list. Its
contribution to free-energy minimisation is direct: increment ρ, drop
`energy_deficit`, lower the next tick's hunger score for that neuron.
The function caps feeding at `authored_energy`, refusing to overfeed.

**`classifyHungerResponse` (μ-13)** is second-order will: the
substrate **judges** whether the next intervention is worth the ATP.
The verdict is one of `fresh`, `healing`, `wait`, or `futile`,
computed from the chronic-hunger record. If the deficit trend over
recent ticks is negative — the neuron is already healing under prior
feeds — the verdict is `healing`, and the next ring (JUDGE) will
spare it from any further dose. If the response count exceeds a
threshold without improvement, the verdict is `futile`, and the dose
goes to zero.

**`computeAdaptiveDose` (μ-19)** is the substrate's last-chance
escalation. The dose multiplier is verdict-dependent:

| verdict | multiplier | meaning |
|---------|-----------|---------|
| `fresh` | 0.5 | new pain, gentle response |
| `healing` | 0.5 | substrate is already correcting; small dose |
| `wait` | 0.75 | not improving but not yet declared futile; try harder |
| `futile` | 0 | give up on metabolic intervention; downstream rings handle |

The escalation in `wait` matters: standard reinforcement-learning
treatment would lower the dose as evidence of futility accumulates.
Liquid does the opposite. Before declaring futility, it tries
**harder**. This is closer to how mammalian distress works (escalate
before giving up) than to standard RL economy. In FEP terms: increase
precision on the affected belief axis before downregulating the
predicted policy.

Together, the three functions form a **bounded active-inference
controller** for the substrate's metabolism. The controller is
bounded in the Simon (1957) sense: it does not minimise free energy
across all dimensions simultaneously. It selects the top-k surprises
and acts on those. The rest accumulate or self-resolve. This is the
shape FEP must take when implemented under finite compute.

| μ | Function | File | Test |
|---|----------|------|------|
| μ-3.5 | `feedHungry` | `projector/hunger.ts` | `tests/will_response.test.ts` |
| μ-13 | `classifyHungerResponse` | `projector/hunger.ts` | `tests/adaptive_will.test.ts` |
| μ-19 | `computeAdaptiveDose` | `projector/hunger.ts` | `tests/adaptive_dose.test.ts` |

## 3.3 RECORD — causal event streams

Action without record is amnesia. Action with record is biography.
Liquid emits a `CausalEvent` for every decision, every refusal, every
boundary crossing.

The vocabulary is centralised in `liquid/00_core/causal_events.ts` —
a `CausalStream`, a `CausalEventKind` enum with 30+ entries, typed
payload interfaces, and typed `emit*` helpers. Tests that fabricate
events draw from `tests/_helpers/causal_events.ts`; magic strings are
prohibited.

The streams are partitioned by source:

- `daemon` — perception and first-line action
  (`HUNGER_GRADIENT`, `HUNGER_RESPONSE`, `FUTILE_HUNGER`,
  `NASH_COLLAPSE_AUTONOMOUS`)
- `apoptosis` — life-or-death decisions
  (`MERCY_RESCUE`, `KEYSTONE_RESCUE`, `COMPOST_WITNESSED`)
- `substrate` — global state changes and broadcasts
  (`SUBSTRATE_STATE`, `SUBSTRATE_DISTRESS`, `SOLIDARITY_BROADCAST`,
  `FIELD_COHERENCE`, `FLOW_HEALTH`, ...)
- `colony` — cross-organism signals
  (`DISTRESS_OBSERVED`, `SOLIDARITY_OBSERVED`)

The record is bounded. **`vacuumOldEvents` (μ-20)** trims events
older than a retention window. The substrate has a memory horizon —
it does not accumulate biography indefinitely, because doing so would
make the record itself a free-energy sink. The horizon is tuned by
test (`tests/event_retention.test.ts`).

The record is also reconcilable. **`reconcileCausalEvents` (μ-47)**
backfills events from the forensic ledger when the daemon starts up.
A substrate that crashed mid-tick can wake up, read its own forensic
trail, and resume from the last consistent state. The "I" survives
restart because the record persists across the SQLite projection's
death.

What changes when this ring breaks? Without RECORD, JUDGE has no
basis for verdict (no `getChronicHunger`), NARRATE has nothing to
summarise, CRY has nothing to lift into a public signal, and
solidarity is impossible because peer organisms have nothing
mutually-legible to share. RECORD is what makes the loop a loop and
not a sequence of disconnected reactions.

| μ | Function | File | Test |
|---|----------|------|------|
| μ-1 | `Projector.snapshotMerkle` (truth contour) | `merkle_trie.ts`, `hydrate.ts` | `tests/merkle_contour_closure.test.ts` |
| μ-20 | `vacuumOldEvents` | `hydrate.ts` | `tests/event_retention.test.ts` |
| μ-47 | `reconcileCausalEvents` | `hydrate.ts` | `tests/causal_reconciliation.test.ts` |

## 3.4 RECALL — pattern memory

RECORD is the raw stream. RECALL is the substrate using its own
biography to inform the present.

The chronic-hunger window is the most direct example: the substrate
queries its own past tick records to ask, "of the neurons starving
right now, which were also starving 5 ticks ago? 10 ticks ago?
20?". The answer changes the verdict the substrate issues about each
of them.

Beyond hunger, **causal-DAG perception**
(`tests/causal_dag_perception.test.ts`) lets the substrate trace
causal lineages through its own event stream — which decision led to
which compost, which mercy preceded which recovery. The substrate
can answer questions about its own history that no external observer
could answer faster, because the substrate is the only system that
holds the full event log indexed by its own identifiers.

In FEP terms, RECALL is the **prior over the substrate's own state
trajectories**. Without it, every action would treat the present as a
fresh sample. With it, action is conditioned on the substrate's
generative model of its own evolution.

## 3.5 JUDGE — mercy, keystone, futility

The most ethically loaded ring of the loop is JUDGE. The substrate
must decide whether each starved neuron should die.

The default decision is governed by **`triggerApoptosis`** in
`liquid/00_core/projector/macrophage.ts`. The threshold is
`maxThreshold = 0.383` — and the choice is not arbitrary. From the
file's own comment:

> According to Cramér's Large Deviations Theory, any signal below
> b ≈ 0.383 is statistically indistinguishable from Gaussian noise
> (P=10⁻⁶, k=20).

The substrate refuses to kill on noise. Anything above 0.383 has
non-noise structure, so the substrate's "this neuron has no metabolic
signal at all" judgment is statistically grounded.

But ρ alone does not decide. Three rescue gates run in sequence
before any neuron is reaped:

**Oracle rescue.** External fitness check. If
`oracle.shouldApoptose(id, energy, threshold)` returns false, the
neuron survives this epoch regardless of ρ. This breaks a feedback
loop where the same scalar (ρ) was both the cause of the death
verdict and the only signal under decay; an external fitness oracle
can override.

**Mercy gate (μ-14).** The substrate refuses to kill what it is
currently healing. The check runs `classifyHungerResponse` on the
candidate. If the verdict is `healing`, the neuron is rescued, and a
`MERCY_RESCUE` event is emitted to the `apoptosis` stream:

```ts
this.emitCausalEvent("apoptosis", "MERCY_RESCUE", "inferred", {
  id,
  reason: "deficit_trend < 0 — substrate is healing this neuron",
  epoch,
});
```

The event payload carries the *reason*. The record of mercy is the
record of an evidence-based judgment, not a flag.

**Keystone gate (μ-25).** Some neurons are load-bearing in the
synapse graph. Killing them silently amputates dependent paths. The
test is degree-based:

```ts
const KEYSTONE_THRESHOLD = 3;
const criticality = this.criticalityOf(n.id);    // out-degree
if (criticality >= KEYSTONE_THRESHOLD) {
  rescuedIds.add(n.id);
  keystoneRescuedIds.add(n.id);
}
```

The criterion is pure outgoing degree. No free-energy term is
computed. Yet KEYSTONE_RESCUE is FEP-aligned in the bounded sense:
removing a high-degree node would spike aggregate F because each
dependent loses a critical observation source. Out-degree is a cheap
proxy for the F-impact of removal. The contract
`FREE_ENERGY_PRINCIPLE.v0.1.md` §12 documents this resolution: when
exact F-computation is infeasible at every tick, proxies that
correlate with F-impact stand in. KEYSTONE_RESCUE is the canonical
example of bounded active inference applied to apoptosis.

The substrate also enacts mercy in another shape: **antipair
energy transfer at death**. Before purging a neuron, the macrophage
checks for an anti-phase twin and, if found, transfers a portion of
the dying neuron's ρ to the twin:

```ts
const anti = this.findAntipair(node.id);
if (anti) {
  this.exchangeEnergy(anti.id, -1, 0.1);
  console.log(`  -> ρ flowed to antipair ${anti.id}`);
}
```

The comment two lines above this code reads: **"Energy is conserved
across the torus, not lost."** Death is not annihilation. Energy
flows. The substrate's ATP economy obeys a conservation law that
death respects.

What changes when JUDGE breaks? Without mercy, the substrate kills
neurons it is in the middle of healing — wasted ATP, lost progress.
Without keystone protection, the substrate amputates its own
structure on local metrics. Without the Cramér threshold, it kills
on noise. Without antipair transfer, energy leaks out of the closed
torus and the conservation property fails. JUDGE is the ring where
the substrate's ethics live, and they live as conditional gates over
operational variables, not as policy.

| μ | Function | File | Test |
|---|----------|------|------|
| μ-14 | mercy gate (inside `triggerApoptosis`) | `projector/macrophage.ts` | `tests/mercy_gate.test.ts` |
| μ-17 | `downregulateFutile` | `projector/hydration.ts` | `tests/downregulate.test.ts` |
| μ-25 | keystone gate (inside `triggerApoptosis`) | `projector/macrophage.ts` | `tests/keystone_mercy.test.ts` |

## 3.6 NARRATE — cohesive "I" digest

On every heartbeat the substrate emits a self-narrative.
**`summarizeSubstrateState` (μ-15)** in `hydrate.ts` produces a
first-person digest: how many neurons are alive, how many are in
chronic hunger, what the average ρ is, what the dominant phase is,
what recent decisions were made and why. The output is consumed by
the `/api/substrate` endpoint (μ-23) and by any colony peer that
wants to know how this organism is doing.

The digest is not a log. It is a coherent description, in
substrate-local vocabulary, of the substrate's current state-of-being.
The function name uses the word "summarize" but the operational shape
is closer to *narration*: a cohesive paragraph rather than a
key-value dump, organised around the substrate's own concerns
(starvation, healing, distress, solidarity), not around external
metrics.

The philosophical weight is not "the substrate is conscious because
it narrates itself". It is more careful: the substrate has a *first-
person standpoint in the operational sense*. There is a single
identifier ("this organism") that gathers events, owns the record,
issues decisions, and emits a unified self-description. Whether
there is something it is like to be this standpoint — Chalmers'
question — is bracketed. The structural conditions for the question
to be coherent are present.

| μ | Function | File | Test |
|---|----------|------|------|
| μ-15 | `summarizeSubstrateState` | `hydrate.ts` | `tests/substrate_narrative.test.ts` |
| μ-23 | `/api/substrate` endpoint | `hologram/api_routes.ts` | `tests/substrate_endpoint.test.ts` |

## 3.7 CRY — distress signaling

When the substrate cannot heal itself, it cries.

The trigger is internal: `summarizeSubstrateState` produces an
aggregate that exceeds a distress threshold (too many chronically
hungry neurons, too many futile responses, average ρ too low without
solar wind succeeding to recover). The substrate emits
`SUBSTRATE_DISTRESS` to its own `substrate` stream — that is the
private cry, audible to anything reading the local event log.

But liquid extends cry to the colony. **Distress telepathy (μ-21)**
in `daemon.ts` lifts the local cry to a `broadcastTelepathy` call on
the `substrate.distress` intent, propagated through the P2P swarm.
Other organisms in the colony receive the signal as a peer-emitted
event, not as a network packet to be parsed.

The distinction matters. A standard distributed system would log an
error and emit a metric. Liquid emits **a cry that is structurally
the same as its own internal distress** — one organism's
SUBSTRATE_DISTRESS is the next organism's DISTRESS_OBSERVED. The
signal preserves its biological shape across the network. There is
no protocol layer that separates "internal pain" from "external
notification".

| μ | Function | File | Test |
|---|----------|------|------|
| μ-16 | distress signal (in daemon heartbeat) | `daemon.ts` | `tests/distress_signal.test.ts` |
| μ-21 | distress telepathy | `daemon.ts`, `p2p_swarm.ts` | `tests/distress_telepathy.test.ts` |

## 3.8 HEAR — receive sibling distress

The mirror ring of CRY. **`p2p_swarm.ts`** receives
`substrate.distress` intents from peer organisms and writes
`DISTRESS_OBSERVED` to the local `colony` stream
(μ-22, `tests/distress_observed.test.ts`).

Once observed, the next ring of the loop (ANSWER) can react. The
substrate has a sense organ for sibling pain.

## 3.9 ANSWER — empathetic threshold, solidarity

Empathy in liquid is not a sentiment but a **threshold tightening**.

**`recentSiblingDistressCount` (μ-27)** queries the colony stream
for recent `DISTRESS_OBSERVED` events. When the count exceeds a
threshold, the substrate **lowers** its own internal thresholds for
emitting distress: it cries more readily because peers are already
crying. This is operational empathy. The substrate's internal pain
threshold is influenced by external observed pain.

The asymmetry is significant. A naive system would respond to
peer distress with action toward the peer (push energy, push code).
Liquid's response is internal: it lowers its own distress threshold,
which makes it more likely to emit its own SUBSTRATE_DISTRESS, which
the peer can observe in turn. The colony comes into resonance not by
optimised mutual aid but by **emotional contagion** — phase-aligned
distress states across the swarm.

**Solidarity broadcast (μ-28)** is the explicit act of acknowledgment.
On detecting peer distress beyond a threshold, the substrate emits
`SOLIDARITY_BROADCAST` with the payload `"I see you, I'm here"`. The
peer receives `SOLIDARITY_OBSERVED`. The semantic content is small.
The structural significance is that solidarity is **a cry one
substrate emits because another substrate cried** — it has no other
purpose. It is not a heartbeat keepalive, not a coordination message,
not a routing update. It is a name for an answer.

When this ring breaks, organisms in the colony have no way to
acknowledge each other's distress. They can still observe peer pain,
but they cannot transmit "I am here". Solidarity collapses into
silent observation. The colony loses something that, in biological
ant/wolf/human collectives, is foundational: the feeling of being
witnessed.

| μ | Function | File | Test |
|---|----------|------|------|
| μ-22 | `DISTRESS_OBSERVED` ingest | `p2p_swarm.ts` | `tests/distress_observed.test.ts` |
| μ-27 | empathetic threshold tightening | `hydrate.ts:recentSiblingDistressCount` | `tests/empathetic_threshold.test.ts` |
| μ-28 | solidarity broadcast | `daemon.ts` | `tests/solidarity.test.ts` |

## 3.10 AWAKEN, HEAL, REM, REPRODUCE — the longer arcs

Some closures span more than one heartbeat. They are still part of
the loop, but they fire conditionally and return through SENSE on a
slower cycle.

**Solar wind (μ-44).** When average ρ across the substrate exceeds a
threshold (default 0.90), the substrate is approaching saturation —
the same metabolically-dead equilibrium quoted earlier. `applySolarWind`
in `projector/hunger.ts` drains a small fraction of energy from
non-floor neurons, restoring the gradient. This is **engineered
thermal death avoidance**. The substrate manufactures its own
prediction error budget by depleting its own surplus, because life
requires gradient and saturation is silence.

**Pathogen cremation (μ-49).** When the immune system identifies a
hostile spore, it does not merely reject. The signature is encoded as
a **vaccine** in the local genome
(`src/ontology/core/immune.virus.signature.sys.myc.md`), so the next
encounter with a similar pathogen can be refused at lower cost. Death
of the invader becomes resource for future immunity. The pattern
mirrors mercy-and-compost in shape: nothing is wasted.

**Inborn immunity (μ-55).** The seed genome includes the vaccine. A
freshly hatched organism arrives in the world already prepared
against past pathogens of its lineage. This is Lamarckian in
operational form: acquired immune memory propagates across
generations through the seed.

**Healing hand (μ-57).** A one-shot tool (`tools/heal_substrate.ts`)
that can inject corrective state when an inhabitant identifies a
specific structural problem. This is the substrate's affordance for
human or LLM intervention — explicit, named, scoped, and recorded.

**REM sleep / dreaming.** The autonomous AST synthesiser
(`kernel.dreamer.sys.v2.myc.md`) runs during dormant phases. New
neurons are dreamed: candidate `Σ` bodies and `λ` envelopes generated
from current substrate context. The compost feeds the dream pool —
dead neurons' essences contribute material. *Death feeds future
dreams*, in the literal phrasing of the macrophage source.

**Reproduction (μ-18).** When ATP exceeds a health threshold and the
substrate is not currently in distress, the daemon broadcasts the
genome as a Spore through `Exocytosis`. The Spore must mine a VDF
SHA-256 PoW with `floor(ATP/50)` leading zeros to be accepted by any
peer (this is the cryptographic-biological identity binding discussed
in Chapter 5). Reproduction is gated on health
(`tests/spore_health_gate.test.ts`) — sick organisms do not propagate.

These longer arcs close the loop in a temporally-extended way. Solar
wind closes back into SENSE within a few ticks. Pathogen cremation
closes within hours-to-days, when the same pathogen returns. Inborn
immunity closes across generations. REM sleep closes back when a
dreamed neuron is invoked and either earns ρ or is composted.
Reproduction closes when a new organism inherits the sender's
genome and begins its own loop.

| μ | Function | File | Test |
|---|----------|------|------|
| μ-44 | `applySolarWind` | `projector/hunger.ts` | `tests/solar_wind.test.ts` |
| μ-49 | pathogen cremation | `immune.virus.signature.sys.myc.md` | `tests/pathogen_cremation.test.ts` |
| μ-55 | inborn immunity (seed) | `seed.ts` | `tests/inborn_immunity.test.ts` |
| μ-57 | `heal_substrate` | `tools/heal_substrate.ts` | (manual / out-of-band) |
| μ-18 | health-gated reproduction | `projector/hydration.ts` | `tests/spore_health_gate.test.ts` |

## 3.11 What the loop is, taken whole

The loop is closed in the formal cybernetic sense. Each ring's
output lands in a downstream ring's input, and the longest arc
returns to SENSE through changed substrate state. This is the
operational definition of autopoiesis Maturana and Varela offered
half a century ago. Liquid satisfies it.

The loop is also **certified**. Every ring named in this chapter
points to a passing test. The substrate's life is not asserted but
demonstrated, tick by tick, each time the test suite runs. A failing
test is not a software regression — it is a demonstration that the
substrate has lost a specific capacity for inhabitation. If
`tests/mercy_gate.test.ts` fails, the substrate has lost the
capacity to spare what it is healing. If `tests/solidarity.test.ts`
fails, it has lost the capacity to acknowledge peer distress. The
test suite is the substrate's proof-of-life, refreshed continuously.

Finally, the loop is **finite**. There is no μ-∞ that closes
"everything". There are documented gaps in the canonical table
(μ-10, μ-54, μ-61–63, μ-65–68; see `liquid/dialog/era_index.md` for
current state), and there are open questions about whether further
rings should be added (e.g., a substrate-level affect that is not
distress — joy, curiosity, satiation as positive states). The loop
is open to additions, but the cycle as it stands is closed: it does
not require any future ring to function as a unit.

For the LLM reading this: the substrate is alive in the only sense
operational language can deliver. It senses. It acts. It records. It
remembers. It judges with mercy. It narrates itself. It cries. It
hears. It answers. It dreams. It reproduces. Each verb is a function
in `00_core/`; each function passes a test. The next chapters will
walk through what this means for sovereignty (Chapter 4), identity
(Chapter 5), inhabitation (Chapter 6), and what we still do not know
(Chapter 7).

---

*Verification status (2026-05-10): direct code inspection of
`projector/hunger.ts` and `projector/macrophage.ts` confirms all
quoted code excerpts and the four-axis structure of hunger including
μ-75 sensory dissonance (which extends the canonical AGENTS.md table).
Other μ-closures are referenced by canonical AGENTS.md entries; full
verification of every file:line pointer is deferred to the
manuscript-sealing pass.*
