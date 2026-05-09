# Proof-Carrying Raw

Large raw inputs are often not the right long-term representation.

Raw is valuable because it preserves contact with the world, but raw is also
heavy, noisy, distorted, and frequently redundant.

The goal is to turn raw perception into proof-carrying projections.

## Example: Deterministic Game Stream

Suppose the source is a video stream of a game.

If the game is deterministic, the primary evidence may be:

```text
game build hash
initial state hash
input action log
deterministic replay engine
overlay stream hashes
final state hash
sampled rendered frame hashes
```

The video is then no longer a single opaque source of truth. It becomes a
verification channel.

## Why This Matters

A raw video says:

```text
something visually happened
```

A proof-carrying projection says:

```text
given this engine, this initial state, and this action log,
the same state trajectory is reproduced;
these sampled frames match the rendered evidence;
these overlays explain what the observer saw.
```

That is much closer to a formula.

## Channel Model

For complex perception, separate the input into channels.

```text
world_state_channel
actor_action_channel
observer_body_channel
widget_overlay_channel
renderer_channel
receipt_channel
```

Each channel can have its own hash and fidelity class.

## Descriptor Shape

```yaml
---
type: "ProjectionDescriptor"
version: "0.1"
projection_kind: "action-log"
projects_from: "sha256:raw-video-or-session-hash"
payload_hash: "sha256:action-log-hash"
loss_model: "bounded-loss"
reconstruction_claim: "deterministic replay reproduces state trace"
verification_method: "replay engine + sampled frame hashes"
verification_level: "L3-sampled-visual"
---
```

## Interpretation Boundary

Not every projection proves the same thing.

An action log may prove what inputs were made.

A state trace may prove what the deterministic engine computed.

A frame hash may prove what was rendered.

A widget overlay may prove what the player was shown.

A model summary may only prove what a model inferred.

These should not be collapsed into one undifferentiated "raw".

## Development Analogy

The same pattern applies to repository work.

Instead of storing every terminal byte forever, Trinity can preserve:

```text
command
cwd
exit code
stdout hash
stderr hash
selected excerpt
verification receipt
affected git commit
```

For high-risk actions, keep more raw evidence. For routine green checks, a
receipt and selected excerpt may be enough.

## Future Direction

The long-term path is:

```text
raw stream
  -> channel split
  -> projection
  -> replay/verification
  -> formula/invariant
  -> public receipt
```

This lets models reason over huge experience streams without pretending that the
full raw stream is always necessary or always truthful.
