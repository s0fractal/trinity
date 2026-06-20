# Cognitive Thermodynamics

Trinity treats a repository as a thermodynamic system of thought.

Files are not only files. They are phase-bearing objects with energy, entropy,
direction, and history.

## Core Thesis

The internet already behaves like a global cognitive thermodynamic system, but
its default flows are poorly shaped:

```text
raw -> reaction -> repost -> decay
```

Trinity prototypes a better local loop:

```text
raw -> interpretation -> claim -> experiment -> receipt -> formula -> crystal
                                      \-> rejected/superseded -> compost
```

The goal is not to make every thought crystalline. The goal is balance.

## Phase Matter

Thought has phases:

```text
raw-fantasy
hypothesis
proposal
experiment
receipt
formula
crystal
compost
```

These are not moral ranks. A repository needs all of them.

## Energy Flow

Each phase handles energy differently.

| Phase         | Energy mode                       |
| ------------- | --------------------------------- |
| `raw-fantasy` | high entropy influx               |
| `hypothesis`  | local ordering                    |
| `proposal`    | directional pressure              |
| `experiment`  | energy expenditure                |
| `receipt`     | contact with reality              |
| `formula`     | compression                       |
| `crystal`     | low-entropy storage               |
| `compost`     | decomposition and nutrient return |

The system becomes unhealthy when energy gets trapped in one phase.

## Wind Rose

The repository wind rose is an eight-direction profile of its thought phases.

```text
                 raw-fantasy
                      N
                      |
         compost NW   |   NE hypothesis
                      |
crystal W ------------+------------ E proposal
                      |
          formula SW  |   SE experiment
                      |
                    S receipt
```

The wind rose is not only a visualization. It is a diagnostic surface.

Examples:

- strong north, weak south: many ideas, little evidence;
- strong west, weak east: stable but inert;
- strong southeast, weak southwest: experiments without abstraction;
- no northwest: failures are not being composted.

## Repository Archetypes

A repository's phase distribution gives it an archetype.

| Archetype       | Dominant phases             | Risk                | Healthy use           |
| --------------- | --------------------------- | ------------------- | --------------------- |
| Spark Lab       | `raw-fantasy`, `hypothesis` | drift / noise       | early exploration     |
| Planner         | `hypothesis`, `proposal`    | over-planning       | architecture design   |
| Forge           | `proposal`, `experiment`    | churn               | implementation sprint |
| Witness         | `receipt`, `crystal`        | bureaucracy         | audit and release     |
| Lens            | `formula`, `crystal`        | abstraction lock    | formalization         |
| Compost Garden  | `compost`, `raw-fantasy`    | circular revisiting | recovery and renewal  |
| Balanced Spiral | all phases present          | slower cycle        | long-lived systems    |

These archetypes are not identities forever. They are weather.

## Crystallization

Crystal means:

```text
verified
replayable
addressed
receipt-backed
stable under projection
```

Crystal is expensive. It should be reserved for load-bearing structures:

- contracts;
- public receipts;
- frozen invariants;
- green baseline definitions;
- canonical fixtures;
- stable protocol boundaries.

Too little crystal means no load-bearing memory. Too much crystal means
rigidity.

## Compost

Compost is not trash.

Compost is failed, rejected, superseded, or decayed thought that remains
available as nutrient.

Examples:

- a failed test with a useful error;
- a rejected proposal with a good premise;
- a superseded architecture;
- a model output that was wrong but revealed a missing guardrail;
- a speculative idea that is not actionable yet.

Without compost, the system repeats mistakes or lies about its past.

## Balance Metrics

> **STATUS — DESIGN INTENT, NOT IMPLEMENTED (verified 2026-06-20).** The ratios
> below are a _specification only_. The live cognition pipeline implements just
> the single-ratio `determineArchetype` in `x2C00_cognition_phase_report.ts`;
> none of `crystal_ratio` / `grounding_ratio` / `learning_ratio` /
> `novelty_ratio` / `compost_ratio` / `rigidity_index` / `hallucination_risk`
> exist in code (`grep` over `src/*.ts` → zero hits). In particular
> `hallucination_risk` can never fire: the `raw-fantasy` phase has no
> content-based classifier path (it is settable only via explicit
> `thought_phase:` frontmatter, which no file uses), so its numerator is
> structurally 0. Treat this section as a horizon, not a measurement.

Initial metrics (spec):

```text
phase_distribution = normalized counts over 8 phases
crystal_ratio      = crystal / total
grounding_ratio    = (receipt + experiment) / total
learning_ratio     = formula / receipt
novelty_ratio      = (raw-fantasy + hypothesis) / total
compost_ratio      = compost / total
rigidity_index     = crystal / (raw-fantasy + hypothesis + proposal)
hallucination_risk = raw-fantasy / (receipt + formula + crystal)
```

These are crude. Their value is not precision, but visibility. They are also, as
of 2026-06-20, unimplemented — see the status banner above.

## Ontological Coverage Connection

Ontology coverage tells how many Markdown files have become verifiable
ontological objects.

Cognitive thermodynamics tells where those objects are in the thought cycle.

Together:

```text
coverage = how much has entered ontology
phase    = what state that ontology is in
```

Example:

```text
L0 raw markdown       -> raw-fantasy
L1 FQDN               -> hypothesis
L2 parseable          -> proposal
L3 schema valid       -> proposal / experiment
L4 hash verified      -> receipt
L5 graph linked       -> formula
L6 recipe/replayable  -> experiment / crystal
L7 receipt-backed     -> receipt / crystal
L8 published          -> crystal
```

## Spiral Dynamics

The phases are circular for visualization, but spiral in practice.

A crystal can generate a new raw perception. A formula can open a new
hypothesis. Compost can feed a better proposal.

```text
raw-fantasy -> hypothesis -> proposal -> experiment
     ^                                          |
     |                                          v
compost <- crystal <- formula <- receipt <------+
```

Every cycle should either:

- increase clarity;
- increase evidence;
- increase compression;
- increase useful compost;
- or safely discard noise.

## Future Audit

Future command:

```bash
deno task cognition:phase-report
```

Possible output:

```text
Repo      Raw  Hyp  Prop  Exp  Rcpt  Form  Cryst  Comp  Archetype
myc       08   11   10    07   22    15    23     04    Witness/Lens
omega     05   08   06    18   24    14    22     03    Forge/Witness
liquid    22   18   14    13   09    07    06     11    Spark Lab
trinity   18   16   20    08   06    14    10     08    Planner
```

The command should not shame a repository. It should show weather and suggest
movement.

## Movement Suggestions

| Condition                     | Suggested movement                                 |
| ----------------------------- | -------------------------------------------------- |
| Too much `raw-fantasy`        | Extract claims and hypotheses.                     |
| Too many `hypothesis` objects | Promote some to proposals or compost them.         |
| Too many `proposal` objects   | Choose experiments.                                |
| Too many `experiment` objects | Produce receipts and retrospectives.               |
| Too many `receipt` objects    | Extract formulas.                                  |
| Too many `formula` objects    | Crystallize or test them.                          |
| Too much `crystal`            | Open controlled exploratory branches.              |
| Too little `compost`          | Preserve rejected/superseded decisions explicitly. |

## Design Principle

The healthiest repository is not the one with maximum proof or maximum novelty.

The healthiest repository is the one whose energy can move:

```text
novelty -> structure -> test -> evidence -> formula -> crystal -> renewal
```
