# THOUGHT_PHASES.v0.1

This contract defines an eight-phase model for repository thought.

The purpose is not to force every object into a rigid taxonomy. The purpose is
to make the state of a repository visible as a phase distribution: a wind rose
of cognition.

## Eight Phases

| Phase | Name          | Archetype | Direction | Meaning                                                                         |
| ----: | ------------- | --------- | --------- | ------------------------------------------------------------------------------- |
|     0 | `raw-fantasy` | Spark     | N         | New signal, loose idea, perception, unbounded possibility.                      |
|     1 | `hypothesis`  | Seed      | NE        | A shaped claim that can become testable.                                        |
|     2 | `proposal`    | Arrow     | E         | A future-directed change request or intent.                                     |
|     3 | `experiment`  | Forge     | SE        | A testable action, recipe, patch, simulation, or replay.                        |
|     4 | `receipt`     | Anchor    | S         | Evidence that something happened.                                               |
|     5 | `formula`     | Lens      | SW        | Compression into invariant, rule, equation, or pattern.                         |
|     6 | `crystal`     | Crystal   | W         | Stable, replayable, verified, low-entropy structure.                            |
|     7 | `compost`     | Compost   | NW        | Rejected, superseded, failed, or decayed material that still feeds future work. |

The cycle is spiral, not circular. A thought can revisit earlier phases at a
higher resolution.

## Phase Semantics

### 0. `raw-fantasy`

High entropy. Low proof. Maximum novelty.

Examples:

- raw capture;
- loose note;
- copied conversation;
- speculative idea;
- rough perception;
- unverified future system.

Healthy role: injects possibility.

Risk when dominant: the repository imagines faster than it verifies.

### 1. `hypothesis`

The idea has a shape.

Examples:

- atomic claim;
- named assumption;
- tentative explanation;
- question with a target;
- interpretable pattern.

Healthy role: turns raw into a handle.

Risk when dominant: too many claims without movement.

### 2. `proposal`

The thought points toward the future.

Examples:

- architecture proposal;
- protocol change;
- implementation plan;
- review request;
- migration path.

Healthy role: converts meaning into direction.

Risk when dominant: planning without contact with reality.

### 3. `experiment`

The proposal becomes testable.

Examples:

- recipe;
- patch intent;
- script;
- fixture;
- simulation;
- deterministic replay;
- benchmark plan.

Healthy role: gives thought a falsification path.

Risk when dominant: local experiments without synthesis.

### 4. `receipt`

The system has evidence.

Examples:

- test result;
- audit output;
- commit hash;
- deterministic replay receipt;
- publication receipt;
- signed PN-CAD block;
- sampled frame hash.

Healthy role: grounds the system.

Risk when dominant: the repository becomes a ledger without understanding.

### 5. `formula`

Receipts and observations compress into reusable structure.

Examples:

- invariant;
- equation;
- type rule;
- protocol law;
- phase transition rule;
- model update.

Healthy role: learns from history.

Risk when dominant: premature abstraction.

### 6. `crystal`

Low entropy. High proof. Stable structure.

Examples:

- replayable contract;
- verified descriptor;
- receipt-backed invariant;
- green baseline;
- frozen protocol;
- content-addressed object with stable projection.

Healthy role: provides load-bearing structure.

Risk when dominant: rigidity; the repository cannot adapt.

### 7. `compost`

Material leaves the active path without becoming useless.

Examples:

- rejected proposal;
- failed experiment;
- superseded theory;
- deprecated file;
- flaky test history;
- wrong model output preserved as caution.

Healthy role: prevents denial and recycles energy.

Risk when absent: the repository repeats old errors or hides failed thought.

## Valid Transitions

Common forward transitions:

```text
raw-fantasy -> hypothesis
hypothesis -> proposal
proposal -> experiment
experiment -> receipt
receipt -> formula
formula -> crystal
```

Common retrospective transitions:

```text
receipt -> formula
receipt -> compost
experiment -> compost
proposal -> compost
crystal -> hypothesis
formula -> raw-fantasy
```

The last two are important: stable structures can open new questions, and
formulas can generate new perception.

## Link To PAR

Thought phases are the thermodynamic state of objects flowing through the PAR
loop:

```text
Perception -> Action -> Retrospection
```

Approximate mapping:

| PAR segment   | Thought phases                      |
| ------------- | ----------------------------------- |
| Perception    | `raw-fantasy`, `hypothesis`         |
| Action        | `proposal`, `experiment`, `receipt` |
| Retrospection | `formula`, `crystal`, `compost`     |

## Link To Ontological Coverage

Ontology coverage measures how far repository files have moved from loose
markdown toward verified ontology.

Approximate mapping:

| Coverage level          | Likely phase              |
| ----------------------- | ------------------------- |
| L0 raw markdown         | `raw-fantasy`             |
| L1 named FQDN           | `hypothesis`              |
| L2 parseable descriptor | `proposal`                |
| L3 schema valid         | `proposal` / `experiment` |
| L4 hash verified        | `experiment` / `receipt`  |
| L5 graph linked         | `formula`                 |
| L6 recipe / replayable  | `experiment` / `crystal`  |
| L7 receipt backed       | `receipt` / `crystal`     |
| L8 published to MYC     | `crystal`                 |

This mapping is not exact. It is a starting point for phase reports.

## Repository Wind Rose

A repository can be summarized as an eight-direction vector:

```text
R = [
  raw_fantasy,
  hypothesis,
  proposal,
  experiment,
  receipt,
  formula,
  crystal,
  compost
]
```

Each value is a normalized share of meaningful objects.

The shape of `R` is the repository's cognitive weather.

## Balance Rules

Unhealthy distributions:

| Pattern                           | Meaning                                        |
| --------------------------------- | ---------------------------------------------- |
| high `raw-fantasy`, low `receipt` | The system is over-imagining.                  |
| high `proposal`, low `experiment` | The system is over-planning.                   |
| high `experiment`, low `formula`  | The system is not learning enough.             |
| high `receipt`, low `formula`     | The system records but does not understand.    |
| high `crystal`, low `raw-fantasy` | The system is rigid.                           |
| low `compost`                     | The system hides failure or repeats mistakes.  |
| high `compost`, low `proposal`    | The system is decaying faster than it creates. |

Healthy repositories keep all phases alive.

## Target Ranges

These are defaults, not universal law:

| Phase         | Healthy range |
| ------------- | ------------: |
| `raw-fantasy` |        10-30% |
| `hypothesis`  |        10-25% |
| `proposal`    |         8-20% |
| `experiment`  |         8-20% |
| `receipt`     |         8-20% |
| `formula`     |         5-15% |
| `crystal`     |         5-20% |
| `compost`     |         3-15% |

Different repositories should have different archetypes. A physics kernel may
need more `crystal`; a research notebook may need more `raw-fantasy`.

## Minimal Object Field

Future process objects may declare:

```yaml
thought_phase: "proposal"
phase_confidence: 0.82
phase_evidence:
  - "has target layer"
  - "has proposed action"
  - "no receipt yet"
```

If the phase is inferred, the inference should be marked as inferred.
