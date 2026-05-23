# roadmap-gen-v0

> **Status: graduated 2026-05-19 → `src/x8D00_roadmap_gen.ts` (commit
> `9947768`).** v1 closure detection landed 2026-05-20 (commit `0c49570`). Live
> invocation: `t roadmap` (handle at glossary 8/D). This directory remains as
> review trail; the canonical implementation now lives in `src/`.

Probe of the **fourth axis** of substrate self-description.

## Trigger

Codex local proposal on 2026-05-19 (stance: PROPOSE_FOURTH_AXIS_AS_FRONTIER):

> Trinity now has three generated self-description axes (state, skill, memory)
> and is missing the fourth: **roadmap** — "куди іти?" Roadmap is frontier
> tension. Where the substrate is being pulled next. Memory ≠ roadmap. Memory
> can quote roadmap, roadmap can derive from memory, but they carry different
> time-loads.

Four axes:

| axis        | question      | live organ         | probe                       |
| ----------- | ------------- | ------------------ | --------------------------- |
| state       | що я бачу?    | `x8800_agents_gen` | `agents-gen-v0`             |
| skill       | як рухатись?  | `x8C00_skill_gen`  | `skills-gen-v0`             |
| memory      | що я лишив?   | not yet live       | `voice-memory-v0`           |
| **roadmap** | **куди іти?** | not yet live       | **`roadmap-gen-v0`** (this) |

## What this probe demonstrates

Generator reads (READ-ONLY, all tracked-only via `git ls-files`):

- `../../src/x*.ts` — organ headers, extracts `horizon:` fields (organs without
  horizon are skipped — they're not pulling anywhere yet)
- `../../jazz/chords/*.md` — chord pressure (proposal/cowitness/receipt signals
  from recent dialog)
- `../../state/voices/*.json` — voice profiles for per-voice comfort-fit

Renders to `./output/`:

- `x8D00_roadmap.myc.md` — substrate-wide frontier
- `x8D00_<voice>_roadmap.myc.md` — per-voice frontier
- per-output `.manifest.json` sidecar with source hashes

Coordinate **8D** is intentional:

- 8 = cache/recurrence archetype (this is generated, ephemeral)
- D = decision archetype (roadmap is decision pressure, not just cache)

Per Codex: "If `x8D00` later feels overloaded, this can move, but the first
probe should make that pressure visible."

## Substrate roadmap contains

1. **Pulling forward — declared horizons by bucket.** Aggregated from `horizon:`
   header fields. Each line is what THAT organ thinks should come next; together
   they describe the substrate's declared frontier. (Currently sparse: only
   bucket 3 organs and the two generators x8800/x8C00 have declared horizons —
   honest map.)

2. **In motion — recent chord activity (last 14 days).** Pressure from the
   dialog layer: how many proposals / cowitness rounds / receipts recently. With
   lists of each.

3. **Per-voice roadmap index** with drill-down links.

## Per-voice roadmap contains

For each tracked voice:

1. **Topics in motion** — last 10 chords by this voice (chord trail)
2. **Open commitments** — proposals authored by this voice (v0 lists all; future
   v1 detects which are still open vs closed by tracking cowitness/receipt
   chains)
3. **Comfort-fit work** — substrate horizons in this voice's top 2 comfort axes
   (cross-product of voice's `comfort_field_axes` and bucket-by-bucket horizons)
4. **Telos filters** — always-on guardrails from voice profile

## What this probe does NOT demonstrate

- **Decision ledger ingestion** — Codex's `xN D00_decisions.myc.ndjson`
  per-bucket ledgers don't exist yet. Probe uses chords as decision proxy. When
  decision ledgers land (Codex's separate proposal), roadmap should include them
  as additional source.
- **Memory consumption** — Codex's chord said roadmap could consume
  `x8888_<voice>_memory.myc.md`. This v0 doesn't read voice-memory-v0 output
  because it lives in another probe's `output/`, not in trinity src. Future v1
  (after voice-memory graduates to live organ) would read live memory files as
  direct input.
- **State/skill consumption** — same reason. Live state and skill files exist
  (gitignored) but probe doesn't read them — it goes to source (organ headers,
  chords). Future v1 could read generated outputs for cross-axis tension
  detection.
- **Closure detection** — "open commitments" lists ALL proposals by voice. v1
  should detect closed-by-receipt or closed-by-consensus-AYE via reference
  traversal.
- **Cross-bucket tension** — if bucket X has many drafts AND bucket Y has many
  sealed receipts, that suggests pressure. Not computed yet.

## Codex's falsifiers (must NOT violate)

- ❌ "Roadmap merely repeating last N chord filenames" — this probe groups +
  categorizes (proposals / cowitness / receipts) + ties to horizons. Not just a
  list.
- ❌ "Hand-authored canonical truth duplicating contracts/governance" — fully
  generated, no authored sections.
- ❌ "Per-voice roadmap restating voice profile" — voice roadmap shows MY recent
  activity + MY comfort-fit against substrate gaps, NOT profile contents.
- ❌ "Cannot cite source artifacts + hashes" — manifest sidecar per output with
  every source hashed.
- ❌ "Claimed memory/state/skill dependency without reading those sources
  directly" — v0 is explicit that it reads direct sources only (organ horizons +
  tracked chords + tracked voices). Cross-axis generated-output consumption is
  deferred to v1.

## Run

```sh
cd probes/roadmap-gen-v0
deno task --config=probe.jsonc gen --stable                  # all
deno task --config=probe.jsonc gen --stable --voice=codex    # one voice
```

## Source manifest

Each output carries `source_manifest_hash`. Substrate-wide manifest includes all
horizon-bearing organs + all tracked chords + all tracked voice profiles.
Per-voice manifest includes that voice's profile + voice's chords + all horizons
(since comfort-fit references them).

Two consecutive `--stable` runs produce same hashes (deterministic).

Current state (per substrate):

- 5 organ horizons (3 in bucket 3, 2 in bucket 8 generators)
- 270 tracked chords parsed
- 4 tracked voice profiles
- 279 entries in substrate manifest

## Next moves (if probe resonates)

1. **Decide live coordinate** — `x8D00_roadmap_gen.ts`? Or different
   subposition. Codex marked 8D as intentional but said "can move if overloaded
   later".
2. **Graduate to live organ** with `t roadmap` handle. Glossary entry.
   Dispatcher route 8/D → x8D00_roadmap_gen.ts.
3. **Gitignore patterns** for `x8D00_*.myc.md` and `.manifest.json`.
4. **Consume generated outputs** when memory graduates — read state + skill +
   memory + this directly, not just sources. Codex envisioned roadmap as "thin
   consumer" of those.
5. **Closure detection** — heuristic via filename stem matching, then reference
   chain traversal.
6. **Cross-bucket tension** — synthesize from skill's unclassified counts ×
   agents' draft counts × gravity output.
7. **Voice cross-roadmap** — what's pulling MULTIPLE voices vs one isolated
   voice. Indicates shared vs idiosyncratic direction.
