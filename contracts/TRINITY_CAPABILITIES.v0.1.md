---
type: "ContractDescriptor"
version: "0.1"
title: "Trinity Capability Registry"
status: "superseded"
superseded_by: "live projection t capabilities (0x4/A.ts) — 2026-05-14"
---

# Trinity Capability Registry

**SUPERSEDED 2026-05-14.** Live projection `t capabilities` replaces the
hand-maintained registry. Codex chord 2026-05-13T210236Z. Snapshot
file was later removed after recipes migrated into `0x0/00.ndjson` kind:8
records.

Below: original v0.1 contract text, preserved for historical reference.

---

This contract defines a formal capability map for Trinity.

The map is not a replacement for `AGENTS.md`. `AGENTS.md` is orientation. The
capability registry is executable memory: what this workspace can do, which
substrate owns the behavior, what command invokes it, what side effects it may
have, and what receipt proves it worked.

## Purpose

Models and humans repeatedly rediscover repository layout and reimplement
existing tools. The registry makes the affordance field explicit so future work
can be planned as command/recipe composition instead of ad hoc file editing.

## Registry Shape

The canonical draft registry lives at:

```text
capabilities/trinity.capabilities.v0.1.json   (renamed .legacy.json, then deleted 2026-05-14)
```

Minimum object shape:

```json
{
  "id": "trinity.cognition.field",
  "owner": "trinity",
  "phase": "receipt",
  "kind": "command",
  "command": "deno task cognition:field",
  "reads": ["src/x5288_cognition_recommendation.latest.myc.json", "jazz/chords/"],
  "writes": [
    "src/x2588_cognition_field.latest.myc.json",
    "src/x2588_cognition_field.latest.myc.md"
  ],
  "side_effects": ["file-write"],
  "receipt": "src/x2588_cognition_field.latest.myc.md",
  "composes_with": ["trinity.cognition.recommend"]
}
```

## Semantics

- `owner` names the substrate with authority: `trinity`, `myc`, `omega`, or
  `liquid`.
- `phase` names the thought phase this capability most naturally produces.
- `kind` is one of `command`, `task`, `recipe`, `passthrough`, or `policy`.
- `command` is the preferred invocation from Trinity root.
- `reads` and `writes` describe visible file surfaces, not hidden internals.
- `side_effects` must include `file-write`, `git-read`, `network`,
  `submodule-read`, `submodule-write`, `serve`, or `none`.
- `receipt` is the expected evidence surface after successful execution.
- `composes_with` lists capability ids that naturally precede or follow this
  one.

## Rule

A new orchestration command should first be expressible as a sequence of
registry capabilities. If it cannot, either the registry is missing a real
capability or the command is trying to become a new substrate.

Future `t` CLI work should be a thin router over this registry, not a parallel
implementation of MYC, Omega, Liquid, or Trinity tools.
