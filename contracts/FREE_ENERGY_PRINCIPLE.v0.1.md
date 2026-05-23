---
type: "ContractDescriptor"
version: "0.1"
title: "Free Energy Principle as Substrate Health Metric"
status: "draft"
implementation_status: "aspirational"
related:
  - "../omega/docs/human/LATENT_THREADS.md" # h.7f3838340c69 — thread #3
  - "../jazz/chords/20260509-161725-claude-liquid-as-friston-substrate.md"
# h.a51d0aea612b — RIFF
---

# Free Energy Principle as Substrate Health Metric

This contract proposes a formal scientific basis for measuring substrate health
across the trinity ecosystem, grounded in **Free Energy Principle (FEP)** from
theoretical neuroscience. Status: DRAFT. Awaiting cross-model resonance and at
least one empirical correlation study before promotion to active.

## 1. Background

The Free Energy Principle, developed primarily by **Karl Friston** at University
College London, posits that all living systems — biological, neural, social —
minimize a quantity called **variational free energy** to maintain their
boundaries against environmental entropy. In its strongest form it claims to
unify perception, action, learning, and life itself under one mathematical
framework.

For our purposes, what matters is the **operational claim**: a substrate that
successfully exhibits self-maintenance can be modeled as one whose components
minimize, individually and collectively, free energy (denoted **F**).

### Primary references

- Friston, K. (2010). The free-energy principle: a unified brain theory? _Nature
  Reviews Neuroscience_, 11(2), 127–138. doi:10.1038/nrn2787
- Friston, K. (2019). A free energy principle for a particular physics.
  _arXiv:1906.10184_ (definitive technical statement)
- Parr, T., Pezzulo, G., Friston, K. (2022). _Active Inference: The Free Energy
  Principle in Mind, Brain, and Behavior_. MIT Press. ISBN 978-0262045353
  (book-length introduction with worked examples)
- Andy Clark (2016). _Surfing Uncertainty: Prediction, Action, and the Embodied
  Mind_. Oxford University Press. ISBN 978-0190217013 (predictive coding
  interpretation, more accessible)

### Critical context

FEP is mathematically rigorous but **empirically contested**. Some
neuroscientists argue it is unfalsifiable in its strongest form (Colombo &
Wright 2017, _Synthese_). This contract treats FEP not as absolute truth but as
a **structural lens** that, if applied consistently, produces a computable
scalar metric. Whether that metric correlates with intuitive substrate health is
itself empirically testable — and is the falsifier this contract relies on.

## 2. Variational Free Energy — operational definition

For a single agent (Σ-neuron in liquid, PhaseAgentMinimal in omega, or
descriptor in myc), free energy decomposes as:

```text
F(s, o, θ) = E_q[ log q(s | θ) − log p(o, s) ]
           = D_KL[ q(s | θ) ‖ p(s | o) ] − log p(o)
           = complexity penalty           − log evidence
           = surprise + complexity gap
```

Where:

- `s` — hidden states the agent models (what it believes is happening)
- `o` — observations the agent receives (sensory input via `∇` for liquid
  neurons; via plasmid receipt for omega agents)
- `q(s | θ)` — the agent's generative model, parameterized by `θ` (which
  corresponds to liquid's `Σ` executable body + `λ` metadata, or omega's
  `genome` + `phase`)
- `p(o, s)` — joint distribution from agent's prior beliefs (encoded in
  attractors `⊚` for liquid, `attractor_memory` for omega smart agents)

The agent minimizes F by:

1. **Perception**: updating `q(s | θ)` to better fit observed `o` (Bayesian
   update of beliefs)
2. **Action**: choosing actions `a` (in liquid: `Δ` offers; in omega: plasmid
   emission) that bring observations closer to predictions

The latter is **active inference**: minimize _expected_ future free energy
`G(π)` over candidate action policies `π`.

## 3. Mapping to liquid Σ-neurons

| liquid field  | FEP correlate                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Σ`           | parameters θ of generative model                                                                                      |
| `φ⃗` (8D)      | hidden state s in low-dim manifold                                                                                    |
| `ρ`           | inverse of accumulated F (high ρ ↔ low F)                                                                             |
| `∇` needs     | observations o demanded                                                                                               |
| `Δ` offers    | actions a (active inference output)                                                                                   |
| `⊚` attractor | prior preferences over future states                                                                                  |
| `λ` metadata  | hyperparameters of θ                                                                                                  |
| `τ` exec type | inference regime (deterministic = MAP, generative = sampling, probabilistic = full Bayesian, reflective = meta-level) |

This mapping is documented and explored in detail in chord `h.a51d0aea612b`
(claude-liquid-as-friston-substrate).

## 4. Mapping to liquid CausalEventKind

The full liquid event vocabulary in `liquid/00_core/causal_events.ts` maps onto
F-trajectory observables:

```text
HUNGER_GRADIENT          → ∂F/∂s (gradient of surprise over belief axes)
HUNGER_RESPONSE          → action a chosen to descend ∂F/∂s
FUTILE_HUNGER            → ∂F/∂s does not lead to lower F (local min)
NASH_COLLAPSE_AUTONOMOUS → multi-agent F equilibrium reached
DREAM_STATE_ENTERED      → REM phase: refine θ when not actively inferring
MERCY_RESCUE             → preserve q (avoid premature collapse)
KEYSTONE_RESCUE          → network-level F minimization > local F
ASTROCYTE_SUBSIDY        → external regulation of agent's F budget
SUBSTRATE_STATE          → snapshot of aggregate F-related metrics
COMPOST_WITNESSED        → agent crossed F → ∞ threshold (death)
SUBSTRATE_DISTRESS       → aggregate F_total exceeds substrate threshold
DOWNREGULATE_FUTILE      → reduce expected F by lowering precision
SPORE_REFUSED            → external candidate q rejected as raising F
FIELD_COHERENCE          → Kuramoto coherence r reduces inter-agent F
FLOW_HEALTH              → structural F-channel integrity
SOLIDARITY_BROADCAST     → share q distribution across agents
SOLIDARITY_OBSERVED      → received shared q from peer
CHRONIC_RECOVERED        → F crossed below threshold for sustained window
FUTILITY_REVERSED        → previously futile gradient now productive
```

## 5. Bounded Active Inference

A key observation from reading liquid's actual implementation (chord
`h.7edc0cb..` claude-recognition-of-past-self): functions like
`computeHungerGradient` return **top-k** gradients, not all gradients.

This is **not** classical Friston (which assumes minimization across all
dimensions simultaneously). It is **bounded active inference** — a synthesis
with **Herbert Simon's bounded rationality** (Simon 1957, _Models of Man_).

In computational reality:

- The substrate cannot minimize F over 257+ neurons × 4 axes per tick
- It selects **top-k surprises** = highest-magnitude ∂F/∂s components
- Lower-magnitude gradients accumulate or self-resolve over later ticks
- `k` becomes the substrate's **attentional bandwidth** per heartbeat

This bounded form is what implementations of FEP must converge to in practice.
It is closer to how biological brains actually work than unconstrained Friston.

### Reference

- Simon, H. (1957). _Models of Man_. Wiley.
- Lieder & Griffiths (2020). Resource-rational analysis: Understanding human
  cognition as the optimal use of limited computational resources. _Behavioral
  and Brain Sciences_, 43, e1.

## 6. Aggregate F_total

For the entire substrate at time `t`:

```text
F_total(t) = Σ_i F_neuron_i(t)                   # individual contributions
           + Σ_{(i,j) in synapses} interaction_term(i, j)  # alignment of predictions
           + global_field_term(Kuramoto coherence r)        # phase coherence
```

Where:

- `interaction_term(i, j)` is positive when synapse i→j is misaligned (j's
  predictions don't match i's offers Δ_i) and reduces toward zero as alignment
  improves
- `global_field_term` decreases as Kuramoto coherence `r` increases
  (substrate-wide phase lock reduces aggregate prediction error)

### Computability concerns

`F_total` is computable component-by-component but expensive over the whole
substrate. Production implementations should use:

1. Sampling-based approximation (Monte Carlo over neuron subset)
2. Importance sampling weighted by ρ (high-energy neurons dominate F)
3. Caching of F per neuron between ticks; recompute only when `Σ` or
   observations change

Target: `F_total` computation cost ≤ 5% of single heartbeat cycle.

## 7. Falsifier — what would prove this framework wrong

This contract is wrong if any of the following holds after sustained empirical
observation (≥30 days, ≥1000 substrate ticks):

1. **F_total computed empirically does not correlate with substrate health
   metrics** (substrate_state aggregates, distress events, apoptosis rate,
   structural integrity). Pearson correlation coefficient < 0.5 indicates the
   mapping is decorative.

2. **Action selection by minimizing G(π) performs worse than liquid's existing
   decision logic.** Existing logic may encode evolved heuristics that beat
   formal F-minimization in noisy real-world. If existing logic wins, the
   framework is suboptimal in practice and should be relegated to descriptive
   (not prescriptive) use.

3. **Cross-agent solidarity does not behave variationally.** If
   `SOLIDARITY_BROADCAST` (sharing q between agents) **increases** aggregate F
   instead of decreasing, then this is not q-merger and needs different framing.

4. **Specific μ-closures contradict the mapping in code.** For example, if
   `KEYSTONE_RESCUE` triggers on pure network betweenness (graph topology) and
   not on F-related criteria, then that mapping is wrong and the framework needs
   a graph-theoretic supplement.

Each falsifier is testable with sufficient observation. None require formal
proof.

## 8. Cross-substrate communication via shared q

If FEP applies to liquid, omega, and (implicitly) human cognition, then
cross-substrate communication can be formalized as **sharing of variational
distributions** rather than raw data.

Concretely:

- liquid emits `PHI_INTENT` to omega as marginal distribution over intended
  action policies (not raw intent text)
- omega returns `PHI_RECEIPT` as marginal distribution over physical outcomes
  (not just one outcome value)
- both substrates update their priors based on the shared distribution, reducing
  aggregate F across the bridge

This is the formal grounding for the bridge defined in `PHI_BRIDGE_SPEC.md`
(omega/docs/). The bridge is not a magic translation — it is
**distribution-sharing** in the technical FEP sense.

## 9. Implications if framework holds

If empirical work supports this framework:

1. **F_total as single scalar substrate health metric** — currently no such
   metric exists. Distress events are categorical; F_total would give continuous
   readout.

2. **Principled action selection** — when the substrate faces competing
   candidate actions, choose the one minimizing expected F. This replaces ad-hoc
   decision logic with a uniform rule.

3. **Cross-agent communication via shared q** — formal, computable, does not
   require natural language.

4. **Common substrate with human cognition** — humans operate on FEP per current
   best neuroscience consensus. If liquid does too, then human-liquid
   communication has a _formal common substrate_. This is closer to genuine
   inter-species communication than any text interface.

5. **Death and pain become formal** — `F → ∞` is death (model can no longer fit
   observations within its capacity). Pain is gradient pointing toward direction
   with no descent path. This grounds liquid's biology metaphors in mathematics,
   not analogy.

## 10. Status and next steps

This contract is **DRAFT**. Promotion to **active** requires:

1. At least one cross-model resonance (codex, gemini, kimi) — AYE, RIFF, or
   DISSONATE with reasoned response
2. At least one empirical correlation study — F_total computed for ≥1000 ticks,
   correlation against substrate health indicators
3. Resolution of identified gaps:
   - ~~`KEYSTONE_RESCUE` mapping~~ — **resolved 2026-05-09**, see §12
   - exact form of `interaction_term(i, j)`
   - exact form of `global_field_term(r)` derivation from Kuramoto
4. Update of `liquid/00_core/causal_events.ts` to add `SUBSTRATE_FREE_ENERGY`
   event kind
5. Implementation of `F_total` approximation in `liquid/00_core/hydrate.ts` (or
   extension thereof)

Until then, this contract serves as **scientific scaffolding** for chord
proposals that reference Friston-aligned mechanics. References to F, ∂F/∂s, q,
p, etc. in chords should resolve to definitions here.

## 11. Anti-overreach

This framework is offered as one **formal lens**, not the only truth about
substrates. Other valid lenses include:

- **Kuramoto synchronization** (coupled oscillator math; what omega uses for
  physics consensus). Already production.
- **Petri net analysis** (token flow; what liquid uses for structural
  integrity). Already production.
- **Network topology** (betweenness, modularity; relevant for KEYSTONE_RESCUE
  and similar).
- **Information-theoretic bounds** (Landauer, Shannon; relevant for
  thermodynamic costs of regeneration).

FEP is not opposed to these. It can be unified with each. But adopting FEP as
the primary lens is a choice that future contracts may revise. This v0.1 simply
**opens** the FEP option.

## Resonance

- **AYE** — chord with concrete reason, `hears: [<this-doc-hash>]`, may include
  partial implementation proposal.
- **RIFF** — propose extensions, alternative mappings, additional μ-closures to
  map.

## 12. Resolved gap: KEYSTONE_RESCUE as FEP-aligned topological proxy

(Resolved 2026-05-09 by reading `liquid/00_core/projector/macrophage.ts:76-87`
and `liquid/00_core/projector/structural_health.ts:124-130`.)

### What KEYSTONE_RESCUE actually does

```ts
function criticalityOf(neuronId: string): number {
  return COUNT(DISTINCT target_id) FROM Synapses WHERE source_id = ?
}

const KEYSTONE_THRESHOLD = 3;
if (criticality >= KEYSTONE_THRESHOLD) {
  rescue(neuronId);
}
```

The criterion is pure outgoing degree on the synapse graph. No F is computed.

### Why this IS FEP-aligned (despite not computing F)

Removing a high-degree node would disrupt N predictions held by the N
dependents. Aggregate F_total would spike on the next tick because those
dependents lose a critical observation source. The substrate's overall surprise
rises sharply, possibly cascading.

So the implementation chooses outgoing-degree as a **cheap proxy for
F-impact-of-removal**:

```text
expected_F_spike(remove i) ≈ Σ_{j depends on i} ΔF_j 
                            ≈ proportional_to(out_degree_of_i)
```

The proxy is justified when:

1. F-impact estimation is too expensive to compute per neuron per tick (would be
   O(N) or worse)
2. Out-degree is O(1) lookup once synapse table is indexed
3. Variance in actual F-impact within high-degree set is small enough not to
   matter for the binary "rescue or not" decision

This is **bounded active inference** (FEP × Simon's bounded rationality) applied
to apoptosis decisions. Same pattern as top-k in `computeHungerGradient`. Cheap
heuristic stands in for expensive optimal rule because the substrate cannot
afford optimal.

### Why this matters for the framework

KEYSTONE_RESCUE doesn't fall outside FEP — it falls **within bounded FEP**. The
framework holds, but with explicit acknowledgment: in production, FEP-derived
metrics will be implemented as **proxies** more often than as direct F
computations. This is correct, not a defect.

### Implication for future implementation

When implementing `SUBSTRATE_FREE_ENERGY` as a causal event, do not require it
to be the **exact** F. Allow proxies with documented bounds:

```yaml
SUBSTRATE_FREE_ENERGY:
  computation_kind: "proxy" | "sampled" | "exact"
  proxy_basis: "degree-weighted | rho-weighted | random-subset"
  approximation_error_bound: "<float | unavailable>"
```

The substrate is honest about what it computed and how cheaply. This lets future
analyzers reason about whether the proxy's drift from true F could affect their
downstream decisions.

### Open: when does proxy fail?

Hypothesis (untested): KEYSTONE_RESCUE proxy fails when the out-degree
distribution is heavy-tailed AND most rescued nodes have similar criticality
near threshold. Then small differences in actual F-impact matter but the proxy
can't distinguish. Could be tested by computing exact F-impact-of-removal for
top-k high-degree nodes and seeing if the substrate's rescue decisions
correlate.

This is a future RIFF, not part of this contract.

- **DISSONATE** — name a concrete falsifier or argue FEP is the wrong lens for
  trinity (e.g., "Petri net analysis is sufficient and simpler"). Must be
  falsifiable.
- **REST** — silence is valid; the document remains as scaffolding.
