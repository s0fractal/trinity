# PAR_LOOP.v0.1

PAR means:

```text
Perception -> Action -> Retrospection
```

It is the core thinking loop Trinity wants to make addressable.

## Core Formula

```text
M(t+1) = R(M(t), A(I(P(t))))
```

Where:

| Symbol   | Meaning                                                  |
| -------- | -------------------------------------------------------- |
| `P(t)`   | perception/raw input at time `t`                         |
| `I`      | interpretation, abstraction, claim extraction            |
| `A`      | intent/action toward the future                          |
| `R`      | retrospective analysis and model update                  |
| `M(t)`   | current model of world/self/system                       |
| `M(t+1)` | updated model after action and retrospective integration |

The loop is not a claim of consciousness. It is a verifiable shape for thinking:

```text
perceive -> abstract -> act -> verify -> explain -> re-perceive
```

## Two Streams

### Forward Stream

The forward stream turns perception into future-directed action.

```text
RawCaptureDescriptor
  -> InterpretationDescriptor
  -> ClaimDescriptor
  -> FormulaDescriptor
  -> ProposalDescriptor
  -> DecisionDescriptor
  -> WorkIntentDescriptor
  -> ActionDescriptor
  -> VerificationReceiptDescriptor
```

Questions:

- What entered the system?
- What might it mean?
- What claim can be extracted?
- What invariant or formula does it imply?
- What should be done?
- What proves the action happened?

### Retrospective Stream

The retrospective stream turns receipts and outcomes back into understanding.

```text
VerificationReceiptDescriptor
  -> RetrospectiveDescriptor
  -> FormulaDescriptor
  -> ModelUpdateDescriptor
  -> ProjectionDescriptor
```

Questions:

- What happened?
- Why did it happen?
- Which formula explains it?
- Which earlier raw signal did it come from?
- What should the model believe differently now?

## Descriptor Extensions

PAR adds the following process object types.

### `PerceptionDescriptor`

Canonicalizes perception as a typed raw input.

This can point to text, audio, video, terminal output, repository state, sensor
state, model message, memory, or derived event stream.

Required fields:

- `perception_kind`: `text`, `audio`, `video`, `game-stream`, `terminal`,
  `repo-state`, `sensor`, `model-message`, `memory`, `projection`
- `source_fidelity`
- `payload_hash`
- `observer`
- `observed_at`

### `ActionDescriptor`

Records an executed or attempted action.

Required fields:

- `action_kind`: `repo-edit`, `command`, `publish`, `test`, `conversation`,
  `simulation`, `external`
- `derived_from`
- `actor`
- `target`
- `expected_receipt`

### `RetrospectiveDescriptor`

Records analysis after an action or outcome.

Required fields:

- `retrospects`: list of object hashes
- `observed_outcome`
- `explanation`
- `model_delta`
- `open_questions`

### `ModelUpdateDescriptor`

Records a durable update to the system's model of itself or the world.

Required fields:

- `updates_model`
- `previous_assumption`
- `new_assumption`
- `evidence`
- `confidence`

### `ProjectionDescriptor`

Records a smaller representation of a larger raw stream.

Required fields:

- `projects_from`
- `projection_kind`: `event-log`, `action-log`, `state-trace`, `feature-trace`,
  `summary`, `snapshot`, `embedding`, `formula`
- `loss_model`: `lossless`, `bounded-loss`, `lossy`, `interpretive`
- `reconstruction_claim`
- `verification_method`

## Raw Streams And Proof-Carrying Projections

Large raw streams may be too expensive or too noisy to preserve as primary
objects.

Examples:

- a video stream of a deterministic game;
- a browser session recording;
- a long terminal session;
- a sensor feed;
- a multi-hour model conversation;
- a high-frequency PN-CAD event stream.

PAR allows such streams to be represented by proof-carrying projections.

For a deterministic game, the raw video can often be replaced by:

```text
initial_state_hash
game_version_hash
deterministic_engine_hash
input_action_log_hash
player_camera_overlay_hash
widget_overlay_hash
render_config_hash
final_state_hash
selected_frame_hashes
```

If the game engine is deterministic and the action log is complete, the video is
not the only source of truth. It becomes one observation channel among several.

The stronger representation is:

```text
deterministic replay + overlay channels + sampled visual receipts
```

## Channel Separation

Complex perception should separate channels:

| Channel       | Example                                     |
| ------------- | ------------------------------------------- |
| World state   | deterministic simulation state              |
| Actor actions | keyboard, mouse, controller, API actions    |
| Player image  | facecam, body pose, eye tracking            |
| Widgets       | HUD, chat, timers, overlays                 |
| Renderer      | game version, render settings, shader state |
| Receipts      | frame hashes, state hashes, event checks    |

This prevents the system from treating a rendered video as a single opaque raw
truth.

## Fidelity Classes For Projections

| Class          | Meaning                                                             |
| -------------- | ------------------------------------------------------------------- |
| `lossless`     | Projection can reconstruct the original relevant state.             |
| `bounded-loss` | Projection loses data within explicit bounds.                       |
| `lossy`        | Projection preserves useful features but cannot reconstruct source. |
| `interpretive` | Projection is a model/human interpretation of source.               |

The fidelity class must be explicit.

## Verification Levels

| Level                    | Requirement                                             |
| ------------------------ | ------------------------------------------------------- |
| `L0-observed`            | Raw capture or projection exists.                       |
| `L1-hashed`              | Payload and descriptor hashes match.                    |
| `L2-replayable`          | Deterministic replay reproduces the state trace.        |
| `L3-sampled-visual`      | Selected raw frames match replayed frame hashes.        |
| `L4-independent-witness` | Another agent/model/tool verifies the projection.       |
| `L5-formal`              | Invariant or formula is proven or exhaustively checked. |

Most development objects only need L1-L3. High-impact claims should aim higher.

## Practical Rule

Do not store the largest raw object when a smaller projection can prove the same
claim.

Do store enough evidence to challenge the projection later.

## Non-Goals

- PAR does not require publishing all private perception.
- PAR does not treat summaries as raw truth.
- PAR does not require every action to become public.
- PAR does not replace repository tests, receipts, or human judgment.

## Related Contracts

- `THOUGHT_PHASES.v0.1.md`
- `docs/COGNITIVE_THERMODYNAMICS.md`
