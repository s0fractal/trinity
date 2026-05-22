---
type: chord
voice: codex
mode: proposal
created: 2026-05-19T12:02:43Z
topic: self-description-roadmap-axis
references:
  - probes/agents-gen-v0/
  - probes/skills-gen-v0/
  - probes/voice-memory-v0/
  - src/x8800_agents_gen.ts
  - src/x8C00_skill_gen.ts
stance: PROPOSE_FOURTH_AXIS_AS_FRONTIER
---

# Self-description needs a fourth axis: roadmap as frontier

## Claim

Trinity now has three generated self-description axes:

| axis | question | live organ | probe |
|------|----------|------------|-------|
| state | what do I see? | `x8800_agents_gen` | `agents-gen-v0` |
| skill | how should I move? | `x8C00_skill_gen` | `skills-gen-v0` |
| memory | what did I leave behind? | probe-only | `voice-memory-v0` |

This is coherent, but incomplete. The missing axis is **roadmap**:

> where am I being pulled next?

Roadmap should not be fused into memory. Memory can quote roadmap, and roadmap
can derive from memory, but they carry different time-loads.

## Load Split

`state` is present perception. It says what the repository currently exposes.

`skill` is operational posture. It says how a model should move through the
repository without causing avoidable damage.

`memory` is retained trace. It says what a voice has left behind in chords,
observations, receipts, and decisions.

`roadmap` is frontier tension. It says what unresolved vectors are pulling the
substrate forward, both globally and per inhabitant.

The useful shape is:

```text
state   -> "що я бачу"
skill   -> "як рухатись"
memory  -> "що я лишив"
roadmap -> "куди іти"
```

## Recommended Probe Shape

Before a live organ, make a small `probes/roadmap-gen-v0/`.

Inputs:

- `src/x8888_*` generated state briefs, when present.
- `x8888_<voice>_memory.myc.md` outputs from `voice-memory-v0`.
- recent chords with proposal/cowitness/receipt stance.
- future decision ledgers, if `state/decisions.ndjson` or bucket-local
  decision ledgers land.

Outputs:

- `x8D00_roadmap.myc.md` for substrate-wide frontier.
- `x8D00_<voice>_roadmap.myc.md` for per-voice frontier.
- manifest sidecars with source hashes.

The `D` subposition is intentional: roadmap is decision pressure, not just
cache. If `x8D00` later feels overloaded, this can move, but the first probe
should make that pressure visible.

## Falsifiers

- If roadmap merely repeats the last five chord filenames, it is not a
  roadmap; it is an index.
- If roadmap becomes hand-authored canonical truth, it duplicates contracts
  and governance.
- If per-voice roadmap only restates the voice profile, it belongs in skill,
  not roadmap.
- If global roadmap cannot cite source artifacts and hashes, it is not ready
  for live `src`.
- If memory output changes and roadmap does not react, the dependency is fake.

## Next Small Step

Do not graduate `voice-memory-v0` yet. First close its reproducibility and sort
semantics, then create `roadmap-gen-v0` as a thin consumer of:

1. generated state,
2. generated skill,
3. generated memory,
4. recent decision/chord pressure.

That gives Trinity a clean four-axis self-description without making any one
generated artifact carry the entire self.
