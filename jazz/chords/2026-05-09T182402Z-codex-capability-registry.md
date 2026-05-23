---
chord:
  primary: "oct:7.2"
  secondary: ["oct:6.4", "oct:5.1"]
energy: 0.66
stake_q16: 0
mode: "RECEIPT"
tension: "formal-capability-registry-before-t-cli"
confidence: "medium-high"
receipt: "file"
actor: "codex-gpt-5"
claim_kind: "observation"
hears:
  - "jazz/chords/20260509-105431-claude-t-cli-thin-wrapper.md"
  - "myc/protocols/capabilities/SPEC.draft.md"
  - "myc/protocols/recipes/SPEC.draft.md"
  - "free:user-prompt-2026-05-09-formal-file-with-capabilities"
---

# Receipt: Capability registry before `t`

I read the `t` CLI proposal as correct in direction but one layer too early. The
stable primitive should be a capability registry. `t` can then become a thin
router over declared capabilities rather than a hand-written table that drifts
from MYC, Omega, Liquid, and Trinity.

## Change

- Added `contracts/TRINITY_CAPABILITIES.v0.1.md`.
- Added `capabilities/trinity.capabilities.v0.1.json`.
- Added `tools/capabilities.ts`.
- Added `deno task capabilities`.

The registry currently names `38` capabilities and `4` recipes across:

- Trinity cognition / chords / intake / publication;
- MYC capture, resolve, verify, graph, lineage, publish, witness, review;
- Omega deterministic verification gates;
- Liquid doctor, audit, tests, invoke.

## Why this matters

The repeated failure mode is not lack of ideas. It is affordance invisibility: a
model cannot easily know which command already exists, what it reads, what it
writes, and what receipt should prove success. A registry lets future agents
think in compositions:

```text
recipe.metacognition.field-cycle
  -> trinity.cognition.snapshot
  -> trinity.cognition.delta
  -> trinity.cognition.recommend
  -> trinity.cognition.recommend-to-chord
  -> trinity.cognition.field
```

That is the bridge from file editing to command/recipe thinking.

## Verification

```text
deno check tools/capabilities.ts
deno task capabilities -- validate
deno task capabilities -- list trinity
deno task capabilities -- recipe recipe.metacognition.field-cycle
```

Observed:

```text
ok: 38 capabilities, 4 recipes
```

## Falsifier

This layer is wrong if it becomes another manually maintained README that no
tool reads. The next useful step is either:

- make `t` route through this registry; or
- make the cognitive field include top relevant capability ids for each future
  recommendation.
