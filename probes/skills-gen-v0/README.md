# skills-gen-v0

> **Status: graduated 2026-05-19 → `src/x8C00_skill_gen.ts` (commit `3bdd445`).**
> Pattern proved out and was promoted to a live organ. Live invocation:
> `t skill` (handle at glossary 8/C). This directory remains as review
> trail; the canonical implementation now lives in `src/`.

Probe of auto-generated operating brief per bucket + substrate-wide.

Pairs with `agents-gen-v0`: state brief says "what I see"; skill brief
says "how to move here without dumb moves".

## Trigger

Codex 2026-05-19:

> `xN888_state.myc.md` відповідає на "що тут є / куди тягнеться bucket".
> `SKILL.md` має відповідати на "як мені діяти в цьому bucket без дурних
> рухів".

Codex laid out the structure:
- `src/xN888_state.myc.md` — what bucket N is right now
- `src/xN888_skill.myc.md` — how to operate in bucket N
- `src/x8888_agents.myc.md` — substrate-wide state brief
- `src/x8888_skills.myc.md` — substrate-wide operating brief

Convention: `state` (current) + `skill` (operating) per bucket, paired
via the `_state` / `_skill` filename suffix.

## What this probe demonstrates

Generator reads three inputs:
1. `./src/` fixture organs (5 bucket-6 stubs with new `skill_tag` and
   `skill_safe` header fields)
2. `./glossary_subset.ndjson` (8 t-command records routing to coordinates)
3. `./policy_subset.json` (import policy table from morphology-v0)

Renders:
- `output/x6888_skill.myc.md` — per-bucket operating brief
- `output/x8888_skills.myc.md` — substrate-wide first-moves + bucket index

Each bucket skill brief contains:
- **Use first**: t-commands routing to this bucket (from glossary)
- **Safe to invoke**: organs marked `skill_safe: yes` or `yes-readonly`
- **Use with care**: organs marked `skill_safe: yes-with-care` (have effects)
- **Import policy**: allowed/denied/warned targets per archetype (from policy table)
- **Before editing**: bucket-specific guidance (audit/gravity baseline, dipole match, archetype warnings)
- **Falsifiers**: signals that the brief itself is wrong

The substrate-wide brief contains:
- **First moves for fresh model**: ordered sequence (status → audit → agents → gravity → bucket skills)
- **Bucket overview** table with drill-down links
- **t-commands by bucket**
- **Global guidance**: read-before-write, probe-before-contract, cowitness, receipts, falsifiers
- **Forbidden / requires-cowitness moves**: omega frozen RFC, pinned contracts, batch renames, destructive ops

## What this probe does NOT demonstrate

- Real trinity src/ ingestion (probe is fixture-only)
- Voice-specific skill briefs (`x8888_skill.codex.myc.md` etc.) — Codex
  recommends NOT rushing voice-specific until bucket skills land
- Block-height anchored skill versioning
- Cross-substrate federation (liquid/omega/myc each render own skills)
- Integration with `t agents` for combined state+skill regen

## Run

```sh
cd probes/skills-gen-v0
deno task --config=probe.jsonc gen --stable
```

## Acceptance test (Codex's criterion)

> Fresh model reads `x8888_skills.myc.md`; then executes correct first
> move: `t status`, `t audit`, doesn't immediately edit. In bucket 6
> knows audit/report/cowitness are right, action mutation without
> receipt is not.

This probe's output answers all four parts:
1. First moves listed in order at the top of `x8888_skills.myc.md`.
2. Bucket 6 skill calls out "audit-flavored, prefer read-only verifiers
   over mutating organs" + lists audit/gravity/court/cowitness as
   safe to invoke + x6D00_cowitness as "use with care (emits envelope)".
3. Bad moves enumerated under "Forbidden / requires-cowitness moves".
4. Import policy explicit per bucket (x6 may import x0/x4/x5/x6/x7;
   warns on x6→x8).

## New header fields (extending agents-gen convention)

```yaml
skill_tag: read-only-report
skill_safe: yes | yes-with-care | yes-readonly
```

`skill_tag` — short categorization of WHAT the organ does (read-only-report,
emits-envelope, external-dependency, mutates-state, etc.). Authors choose;
future audit should verify semantic match (probe v0 does NOT validate
tag/safety consistency — Codex flagged this for future extension).

`skill_safe` — invocation safety:
- `yes` — pure read, no side effects, safe to invoke from anywhere
- `yes-readonly` — reads external dependencies (e.g., baseline gates) but
  does not mutate substrate state
- `yes-with-care` — emits substrate-state-changing artifacts (envelopes,
  proposals, receipts); invoke deliberately
- `no` (default if missing) — has effects beyond pure read; document
  before invoking

These extend the `intent / maturity / horizon` triple from agents-gen.

## Next moves (if probe resonates)

1. **Decision on field set.** `skill_tag` and `skill_safe` add to the
   minimal header. Confirm via cowitness before extending to real organs.
2. **Graduate to live organ.** Move `gen_skill.ts` to `src/x8C00_skill_gen.ts`
   (or similar coordinate). Add glossary entry for `t skill` handle.
3. **Add to t agents pipeline.** `t agents` could call `t skill` internally,
   regen both state+skill briefs together. Or keep separate commands for
   different audiences.
4. **Real trinity scan.** Point gen_skill at `../../src/` to produce real
   bucket skills for trinity (will show "unclassified" for organs without
   skill_tag/skill_safe — informative, not failure).
5. **Voice-specific skills.** After bucket skills stable, consider voice
   memory layer: `x8888_skill.<voice>.myc.md` derived from voice records
   + substrate skills. Separate concern; not in this probe.
