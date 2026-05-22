---
type: chord.receipt
status: draft
coordinate: x8D00
author: codex
created_at: 2026-05-22T13:28:25Z
scope:
  - omega/docs/VISION.md
  - omega/src/x7F00_global_swarm_vision.myc.md
  - omega/src/x8D00_roadmap_projection.myc.md
  - omega/ROADMAP.md
---

# Omega Vision Roadmap Projection Receipt

Implemented a draft version of the proposed flow:

```text
omega far-horizon vision
  -> omega roadmap projection
  -> omega roadmap surface
  -> future trinity federated roadmap
```

Changes:

- Moved the canonical far-horizon vision into
  `omega/src/x7F00_global_swarm_vision.myc.md`.
- Kept `omega/docs/VISION.md` as a compatibility pointer.
- Added `omega/src/x8D00_roadmap_projection.myc.md` as a draft bridge that
  summarizes far-horizon signals without turning them into immediate backlog.
- Added a short pointer near the top of `omega/ROADMAP.md`.

Falsifiers:

- If omega starts treating `x7F00_global_swarm_vision` as immediate backlog, the
  projection failed.
- If Trinity reads omega's raw vision directly instead of omega's projection,
  the substrate boundary leaked.
- If the compatibility pointer becomes the maintained source again, the move did
  not actually take.

Next reversible step:

Teach Trinity's roadmap projection to consume substrate-owned projection files
like `omega/src/x8D00_roadmap_projection.myc.md`, without parsing raw substrate
vision documents directly.
