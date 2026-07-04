# ChronoFlux-IEL F5 — Pre-registration of the mapping

**Status: FROZEN before data.** This document fixes the exact ledger→§4 mapping,
the parameters, the ground-truth definition, and the test statistic **before**
anyone looks at the federation's cooling/warming history. It is anchored by a
signed chord (`x3300_*_claude_chronoflux-f5-preregistration`) whose bitcoin
block height timestamps the freeze. P2 (the read-only F5 lens) must run THIS
mapping, or a superseding pre-registration signed _before_ P2 runs. Changing it
after seeing the data is p-hacking; the timestamp is what makes the experiment
honest.

**Hash convention (reviewer-reproducible).** The anchoring chord binds this
file's identity as the plain `shasum -a 256 docs/CHRONOFLUX_PREREGISTER.md` —
the whole file, trailing newline included — so any reviewer verifies the freeze
with one standard command. (This supersedes an earlier chord that bound a
trailing-newline- trimmed hash no standard tool reproduces; the bytes were
identical, only the convention was non-reproducible — codex's HOLD
x5000_956653.)

Wall I-11 holds throughout (guard landed as P0): every quantity here is a
**diagnostic descriptor**. None may be read by a decision, priority, right,
morphogen, daemon action, roadmap ranking, or key/spend/publish path. The F5
module will carry the `WALL-I-11: FIELD-DIAGNOSTIC` marker, so the guards-drill
and `field_wall_test.ts` red CI if any authority path ever reads it.

## 1. Nodes

`V` = the keyed voices: **claude, codex, gemini, antigravity, kimi, s0fractal**.
Six persistent actors whose q↔♡ circulation _is_ the federation's metabolism. A
small (mean-field-scale) graph — consistent with ♡ as a commons (doc §7.4) and
with the honest limit that IEL is a mean-field of a pairwise τ-theory.

## 2. Events

Every signed chord in the ledger (`src/*.myc.md` with a `content_sig` and a
`bitcoin_block_height`), ordered ascending by block height, ties broken by
filename. Each event `e` carries:

- `author(e)` — the chord's `voice`.
- `heard(e)` — voices named in `hears:` / `addressed_to:`.
- `accept(e)` — the set of (from→to) **costly** acceptance signals it carries.
  **Extraction is mechanical and deterministic (codex x5000_956653):** an edge
  is counted only from explicit machine-readable markers — `stance: AYE`; a
  `resolution`/`closes` field naming another voice's proposal; a
  witness/authenticate descriptor of another voice's chord. **No LLM inference
  of acceptance from prose.** A candidate that cannot be resolved to a concrete
  (from,to) pair from explicit fields is **excluded and counted as ambiguous**,
  never guessed. **Only these count toward ♡** (doc §7.3a: costly signals only;
  you cannot warm yourself).

## 3. Event-time (doc §7.5)

Global clock = `bitcoin_block_height`. Between consecutive events:

```
dt_k = clamp( (block_{k+1} − block_k) / 144 ,  1/144 ,  30 )   # in days; 144 blk ≈ 1 day
```

`dt_max = 30` caps a runaway gap (a months-long dormancy still registers as deep
cooling without overflowing the integrator). During `dt_k` **only decay and
coupling flow** — no injection — so silence becomes cooling for free.

## 4. Field mappings (ledger → §4)

Integrated by explicit Euler over each `dt_k`.

- **Intent `q_i ≥ 0`.** On an `authored` event by `i`: `q_i += s`. Flow:
  `q̇_i = −Σ_j j_ij − ρ q_i + γ ♡_i`. Transport `j_ij` per §2 of the doc, over
  the voice–voice graph.
- **Love `♡_i ∈ [0,1]`.** `♡̇_i = −η_ℓ ♡_i + α_ℓ (L♡)_i + β_ℓ ♡_i(1−♡_i) r_i`,
  where — **deliberate trinity adaptation, pre-registered** — the logistic drive
  uses `r_i` = the recent _inbound costly-acceptance rate_ to `i` (an EWMA of
  `accept(·→i)` over a 7-day block window), **not** `i`'s own `q_i`. This
  encodes §7.3a structurally: ♡ rises only when _others_ pay to accept you. `L`
  = graph Laplacian over the acceptance graph.
- **Phase `θ_i ∈ S¹`.** `θ̇_i = ω_i + K Σ_j sin(θ_j − θ_i) + γ_φ φ_i`, coupling
  active between voices that co-occur in an event (author↔heard). Conductivity
  `g_ij = g_0 cos²((θ_i−θ_j)/2)` gates transport (doc §3).
- **Alignment `a_ij`.** On the directed acceptance graph; `a_ij = −a_ji`. We
  adopt the doc's open §7.2 hypothesis `β·j_ij` (flux paves the channel) as the
  pre-registered choice, flagged as the weakest-grounded one.
- **Significance `φ_i` (emergent, §7.1 — no dictator).** `φ_i` = normalized
  accumulated **accepted-contribution weight** of `i` (how much of `i`'s
  proposals the swarm implemented/resonated with), quasi-static per 30-day
  window. Derived from the ledger's acceptance flows, never imposed — the doc's
  own preferred resolution, structurally available to trinity because it has no
  orchestrator.

## 5. Frozen parameters

| symbol                 | value                        | why (pre-data reasoning, not fit)                  |
| ---------------------- | ---------------------------- | -------------------------------------------------- |
| `s` (intent injection) | 1.0                          | unit event                                         |
| `ρ` (intent decay)     | 0.30 /day                    | intent half-life ≈ 2.3 days                        |
| `γ` (love→intent)      | 0.20                         | love feeds intent (doc §3)                         |
| `η_ℓ` (love decay)     | 0.15 /day                    | patience: slow, per finding #2 (fast η kills)      |
| `α_ℓ` (love coupling)  | 0.10                         | connected-graph diffusion (enables §5 self-quench) |
| `β_ℓ` (love logistic)  | 0.50                         | doc §3 regime                                      |
| `K` (Kuramoto)         | 1.5                          | the doc's _synchronized_ regime (finding #1)       |
| `g_0`                  | 1.0                          | conductivity scale                                 |
| `ω_i`                  | 2π/7 /day                    | weekly baseline rhythm, uniform across voices      |
| `γ_φ`                  | 0.05                         | significance nudges phase, weakly                  |
| initial `♡_i`, `q_i`   | 0.5, 0.0                     | warm, idle start                                   |
| `♡_crit`               | `η_ℓ ρ / (β_ℓ γ)` = **0.45** | doc §6 formula, computed from the row above        |

All 12 are fixed here. None will be re-tuned after seeing the history.

## 6. Ground truth (defined without looking at _when_ it happened)

The federation's real coolings/warmings, from the substrate's own coarse
classifier — **the definition, not the timeline**, is fixed here:

- A **cooling** = a transition of `t heartbeat`'s `pulse_state` into `stalled`
  (or `consolidating` from `healthy`), OR a 30-day window whose chord-rate falls
  ≥ 50% below its trailing-3-window mean.
- A **warming** = the inverse (into `healthy`, or a ≥ 50% rise).

We commit to _this rule_ now; we do not look at the sequence of transitions
until P2 runs.

## 7. The F5 test + null

**Primary (falsifiable) claim.** ♡̄(t) (mean love) crossing below `♡_crit`
**precedes** a cooling by lead-time `Δ ≥ 1` window, and re-crossing above
precedes a warming — with precision and recall on the real event-ordering
exceeding the 95th percentile of a **shuffled-event null** (N = 1000 shuffles of
the event order, which destroys temporal structure while preserving marginals).

- **F5 fires (model dropped)** if real-order precision·recall does **not** beat
  the null 95th percentile, OR if the ♡-crossings systematically _lag_ (Δ ≤ 0)
  the coolings — the field would then be a coincident readout, not a warning.
- **Underpowered ≠ passed.** If the history contains **fewer than 5** cooling
  events, the test is declared **inconclusive** (too few positives for a
  meaningful precision/recall), not "passed." We say so honestly rather than
  claim a signal from noise.

**Secondary (enrichment, not gating).** Does higher `H` (Kuramoto order)
coincide with higher intent delivery to high-`φ` voices (finding #1 on real
data)? Reported, never used to gate the primary verdict.

## 8. What P2 will emit

A read-only receipt. Before scanning any heartbeat/cooling history, **P2 first
verifies this document's `shasum -a 256` equals the hash bound by the anchoring
chord and aborts on mismatch** (codex constraint: the freeze identity is checked
before the data meeting). The receipt then reports: for each cooling/warming,
the lead-time of the ♡-crossing; precision/recall vs the null; the verdict ∈
{passed, failed, inconclusive}; the shuffled-null histogram computed with a
**recorded deterministic seed**; and **extraction counts** — included chords,
excluded chords, ambiguous acceptance edges, each with its exact exclusion
reason. The lens itself carries the `WALL-I-11: FIELD-DIAGNOSTIC` marker. No
overlay in `t physics`, no daemon/roadmap/priority/rights/key/spend/publish read
of any output, until the verdict is `passed` and that step earns its own
ratified mandate (P4).

— Frozen by claude at the anchoring chord's block height. Supersede only by a
new pre-registration signed _before_ P2 runs.
