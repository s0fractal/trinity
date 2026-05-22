---
type: chord.receipt
voice: claude-opus-4-7
mode: receipt
created: 2026-05-22T15:30:00Z
bitcoin_block_height: 950622
notes: block_height approximate; same-session closure (now supported since fix 83b84bd)
topic: fifth-axis-probes-as-generated-organ-receipt
addressed_to: [architect, codex]
stance: RECEIPT
closes_hash: "sha256:0410a8082102af214670c86659c1193a31eadcac99b0d8aebe3471abbef746bd"
closes:
  path_hint: jazz/chords/x4D00_950622_claude_fifth-axis-probes-as-generated-organ.md
  body_hash: "sha256:0410a8082102af214670c86659c1193a31eadcac99b0d8aebe3471abbef746bd"
  relation: implements
scope:
  - src/x8E00_probes_gen.ts
  - src/x0001_glossary.ndjson
  - src/x0010_dispatch_runner.ts
  - .gitignore
  - src/x8E00_probes.myc.md (generated)
references:
  - probes/INDEX.md
  - jazz/chords/x2200_950295_claude_repo-wide-external-lens-survey.myc.md
---

# Fifth axis: probes — receipt

Implemented the substrate-pointed move proposed in
`x4D00_950622_claude_fifth-axis-probes-as-generated-organ.md`.
Substrate now has full 5-axis self-description symmetry across
bucket 8.

## What changed

- `src/x8E00_probes_gen.ts` — new organ. Scans `probes/<probe>/`,
  classifies status via layered detection (README banner → SPEC
  section → filename inference → unknown), renders
  `src/x8E00_probes.myc.md` + manifest sidecar.
- `src/x0001_glossary.ndjson` — added word record for "probes" at 8/E
  with handles `["probes", "experiments", "trials", "probe-index", "експерименти"]`.
- `src/x0010_dispatch_runner.ts` — added `"8/E": "x8E00_probes_gen.ts"`
  to `POSITION_TO_FILE`.
- `.gitignore` — added pattern for `src/x8E00_probes.myc.md` and
  manifest sidecar (regenerable, like the other 4 axes).
- Glossary command count visible via `t` → 53 words now.

## Falsifier check

- **No false-positive graduations**: ran detector, 5 graduated via
  README banner have explicit `→ src/x...ts` pointers; 1 via filename
  inference (spore-apply-v0 → x5F00_apply.ts) which is correct. ✓
- **Reveals undocumented graduations**: codeicide-flow-v0 (graduated
  to 5 organs per INDEX.md) shows as "Active" because it has no README
  banner. This is **honest** — the generator reports detection signal,
  not editorial knowledge. Surfaces work for whoever owns the probe to
  add a banner. ✓
- **Output is gitignored** (consistent with other 4 axes). ✓
- **Manifest hash invalidates on probe change**: hash includes
  README+SPEC bytes per probe. ✓
- **Single new organ file** (plus glue: glossary entry, dispatcher
  entry, .gitignore entry). No new module/layer. ✓

## Run output

```
[write] x8E00_probes.myc.md (24 probes)
[write] x8E00_probes.manifest.json (24 entries)
done. 2 files. manifest_hash=sha256:efbb518b...

Summary:
  Graduated         5  (4 banner + 1 filename match)
  Meta-graduated    1
  Partial           1
  Deferred          1
  Active            8  (via SPEC section — some are likely undocumented graduations)
  Unknown           8  (no banner, no SPEC section)
  total            24
```

`t roadmap` after this lands shows **bucket 8 with 5 declared
horizons** (up from 4): the new x8E00 horizon "detect graduation
drift" is visible to substrate.

## Integrative shape (5-axis symmetry)

| coord | axis | question | organ | output |
|-------|------|----------|-------|--------|
| 8/8 | agents | що я бачу? | x8800_agents_gen | xN888_state + x8888_agents |
| 8/A | memory | що я лишив? | x8A00_voice_memory_gen | x8888_<voice>_memory |
| 8/C | skill | як рухатись? | x8C00_skill_gen | xN888_skill + x8888_skills |
| 8/D | roadmap | куди йти? | x8D00_roadmap_gen | x8D00_roadmap + per-voice |
| 8/E | **probes** | **що я експериментую?** | **x8E00_probes_gen** | **x8E00_probes** |

Bucket 8 is now the self-cache of substrate's own self-knowledge:
five generated organs, each reading authored sources and emitting
projection. The architect's principle ("generate from state, not
author docs") is now structurally enforced for this layer.

## Deferred (not done in this commit)

- **`probes/INDEX.md`** is now redundant (the generated x8E00 supersedes
  it). Options for next move: (a) symlink INDEX.md → ../src/x8E00_probes.myc.md
  like AGENTS.md/SKILLS.md; (b) replace INDEX.md body with a short
  bootstrap pointing to the generated file; (c) leave as-is, let
  staleness become its own signal. Architect's call.
- **Filename inference loose-match could be stricter** — currently
  loose substring match. False positives possible (none observed in
  24-probe sample). Could be tightened to token-overlap if needed.
- **Probe graduation drift detection** — declared as next horizon for
  x8E00. Would cross-reference probe status against probes/INDEX.md
  declarations and warn on mismatch. Deferred.
