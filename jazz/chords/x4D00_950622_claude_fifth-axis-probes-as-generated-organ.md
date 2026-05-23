---
type: chord
voice: claude-opus-4-7
mode: proposal
created: 2026-05-22T15:00:00Z
bitcoin_block_height: 950622
notes: block_height approximate; substrate-pointed by probes/INDEX.md's own self-declaration + architect's "generate from state" principle
topic: fifth-axis-probes-as-generated-organ
addressed_to: [architect, codex]
references:
  - probes/INDEX.md
  - jazz/chords/x2200_950295_claude_repo-wide-external-lens-survey.myc.md
  - src/x8800_agents_gen.ts
  - src/x8A00_voice_memory_gen.ts
  - src/x8C00_skill_gen.ts
  - src/x8D00_roadmap_gen.ts
stance: PROPOSE
---

# Fifth axis: probes as generated organ (`x8E00_probes_gen.ts`)

## Proposal

Add a fifth self-description axis at `8/E`:

| coord   | axis       | question                | source                          |
| ------- | ---------- | ----------------------- | ------------------------------- |
| 8/8     | agents     | що я бачу?              | `src/xNNNN_*.ts` headers        |
| 8/A     | memory     | що я лишив?             | per-voice chord trails          |
| 8/C     | skill      | як рухатись?            | bucket-level skill bottlecaps   |
| 8/D     | roadmap    | куди йти?               | organ horizons + chord pressure |
| **8/E** | **probes** | **що я експериментую?** | **probes/** subdirs             |

`x8E00_probes_gen.ts` scans `probes/*/` and emits `src/x8E00_probes.myc.md`
listing each probe with detected status (graduated / partial / deferred / active
/ unknown), inferred target organ if graduated, and the source of the status
signal (graduation banner, SPEC.md status field, git inactivity, etc.).

## Why now

Three signals converge:

1. **probes/INDEX.md is self-pointing**: it explicitly says "When count gets
   unwieldy it should become a generated `t probes` organ". Filed under survey
   chord finding #3. Substrate-pointed.
2. **Architect's principle (2026-05-22)**: docs are rudiment; most artifacts
   should generate from state, not be authored. INDEX.md is an authored doc —
   exactly the anti-pattern.
3. **Survey chord finding #3**: "only 4 of ~16 graduated probes are marked". An
   automated scan catches drift the authored index misses.

## Status extraction logic

For each `probes/<probe-name>/` directory:

1. **Explicit graduation banner** — scan README.md / SPEC.md for status markers
   I added in earlier sessions (`> Status: graduated → x...`, etc.). Highest
   signal.
2. **SPEC.md frontmatter `status:`** field if present.
3. **Inferred from filename pattern** — if probe name matches an existing
   `src/xNNNN_<same-handle>*` organ, mark "likely graduated" with the target
   organ.
4. **Git last-modified** — if no activity in N days AND no graduation marker,
   mark "stale".
5. **Default** — "active" (still being worked).

## Falsifiers

- Running `./t probes` produces "graduated" for a probe that has no
  corresponding live organ (false positive).
- Running `./t probes` produces "active" for a probe that already graduated
  months ago (false negative on inactive but graduated).
- The generated file is not gitignored (output should be derived, like
  agents/memory/skill/roadmap outputs).
- Source manifest hash does not change when probe content changes (manifest
  leak).
- The implementation invents a new module/file beyond `src/x8E00_probes_gen.ts`
  and dispatcher entry.

## Reversibility

- Single new organ file + one dispatcher entry + generated output (gitignored).
- probes/INDEX.md left untouched in this proposal — it becomes a bootstrap
  pointer ("see generated"), or a separate later move decides whether to symlink
  it to the generated file.
- Revert = revert the commits, regen will produce nothing without the organ.

## Next step

I implement, regenerate, write receipt with `closes_hash`.
