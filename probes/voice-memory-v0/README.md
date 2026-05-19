# voice-memory-v0

Probe of voice recall projection — generated digest of stigmergy.

## Trigger

Codex 2026-05-19 (forwarded by architect):

> voice profile ≠ voice memory.
>   profile = identity / physics — authored at `state/voices/<voice>.json`
>   memory  = recall projection — generated from chords + observations + decisions
> profile lives at x2... (mirror/selfhood); memory projection at x8... (cache/recall)
> memory MUST be generated, NOT authored. Source of truth is in chords, cowitness,
> observations, decision ledger, voice profile, handoff notes.

Probe demonstrates the "memory = generated digest" pattern by reading real
substrate (state/voices/*.json + jazz/chords/*.md) and rendering per-voice
recall projection files.

## What this probe demonstrates

Generator reads (READ-ONLY):
- `../../state/voices/*.json` — 5 voice profiles (claude/codex/gemini/hermes/kimi)
- `../../jazz/chords/*.md` — ~276 chord files in 2 filename forms:
  - **wallclock**: `YYYY-MM-DDTHHMMSSZ-<voice>-<topic>.md`
  - **new coordinate**: `x<NNNN>_<block>_<voice>_<topic>.md`
  Frontmatter `voice:` field (when present) overrides filename voice token.
  Both are normalized to first segment (e.g., `claude-opus-4-7` → `claude`).

Renders to `./output/`:
- `x8888_<voice>_memory.myc.md` per voice — recall projection
- `x8888_<voice>_memory.manifest.json` per voice — source manifest sidecar
- `x2888_voices_state.myc.md` — substrate-wide voice index with style
  differentiation matrix
- `x2888_voices_state.manifest.json` — global source manifest sidecar

Each per-voice memory file contains:

1. **Profile section** — from voice JSON: handles, natural styles, telos
   filters, comfort field axes (8-dimensional dipole signature), self-description
2. **Chord activity table** — counts proposals / cowitness / receipts /
   observations / other
3. **Proposals authored** — last 15 with stance + bucket coord
4. **Cowitness contributions** — last 15 with stance (AYE/NAY/TWEAK)
5. **Observations** — last 10 chords with `mode: observation`
6. **Receipts** — last 10 chords with `mode: receipt`
7. **Recent chord trail** — last 5 of any kind, chronological
8. **Next vector** — derived from voice profile's natural_styles + telos_filters

Substrate-wide `x2888_voices_state.myc.md` contains:
- voice index table with drill-down links
- **Style differentiation matrix**: comfort_field_axes per voice, showing
  where each voice naturally lives in the 8D dipole space. Concretely
  exposes that (per current voice profiles):
  - claude-opus-4-7: mirror=108 (highest) → reflective
  - codex-gpt-5: action=108 (highest) → operational
  - gemini-pro-1-5: foundation=108 (highest) → stable/architectural
  - kimi-code-cli: triangle=89 (highest) → structural composer

## Acceptance criterion (Codex)

> Fresh model reads `x8888_<voice>_memory.myc.md` and can answer:
>   - which decisions did I help form?  → "Cowitness contributions" section
>   - which mistakes/observations should I not repeat?  → "Observations" section
>   - what is my next vector?  → "Next vector" section + recent trail
>   - how does my style differ from Codex/Claude/etc.?  → differentiation matrix
>     in voices_state.myc.md

All four answerable from probe output as it stands.

## What this probe does NOT demonstrate

- Live `t memory` / `t recall` command. Probe is standalone gen.ts; would
  graduate to `src/x8XXX_voice_memory_gen.ts` after architect approval.
- Decision ledger integration. Codex's proposal for `xN D00_decisions.myc.ndjson`
  per-bucket ledgers is separate; this probe reads chords (the current
  proxy for decisions) but doesn't process formal ledger records.
- Cross-substrate federation. Each voice's memory is trinity-only. Liquid /
  omega / myc would have their own voice memory projections if voices
  authored across substrates.
- Migration of `state/voices/*.json` to `src/x2A00_<voice>_voice.myc.json`
  (Codex's alternate location). Probe keeps state/voices/ as authoritative
  source; Codex says this should be done only after probe proves the pattern.
- Voice-specific skill brief (separate from voice memory). Skill = "how to
  move", memory = "what I left behind". Different artifact kinds.

## Run

```sh
cd probes/voice-memory-v0
deno task --config=probe.jsonc gen --stable                # all voices
deno task --config=probe.jsonc gen --stable --voice=kimi   # one voice
```

## Source manifest chain

Each generated file carries `source_manifest_hash` in its header. The
sidecar JSON lists every source file with its individual hash + size.
Chain:

```
voice profile + chord files
  → per-file sha256
  → canonical JSON manifest (sorted by path)
  → manifest_hash (sha256)
  → embedded in memory file header
```

Two consecutive `--stable` runs produce same manifest hashes (deterministic).
Source manifest changes IFF source bytes change — voice memory is a
verifiable receipt-like projection, not opaque cache.

Probe v0 manifest entries (per current substrate state):
- per-voice (e.g., kimi): 24 entries (1 profile + 23 chords)
- per-voice (e.g., claude): 120 entries (1 profile + 119 chords)
- global (voices_state.manifest.json): 281 entries (5 profiles + 276 chords)

## Next moves (if probe resonates)

1. **Decide live coordinate** for voice memory generator. Options:
   - `x2C00_voice_memory_gen.ts` (x2 mirror = voice selfhood; xC = chaos
     since memory IS the chaos-buffer of stigmergic traces)
   - `x8C00`-shaped coordinate (x8 cache + memory archetype) — but x8C00
     is already taken by skill_gen
   - `x8D00_voice_memory_gen.ts` (cache + decision = "remembered decisions")
2. **Decide voice profile location**:
   - keep `state/voices/<voice>.json` as legacy
   - migrate to `src/x2A00_<voice>_voice.myc.json` (Codex's proposal)
   - probe does not touch either; architect decides
3. **Integrate with t agents / t skill pipeline.** A single `t selfie`
   command could regen state + skill + voice memory in one pass.
4. **Add decision ledger ingestion** when decisions probe lands. Memory
   would then synthesize from chords + decisions + observations.
5. **Voice-specific skill brief**: derive `x8888_skill.<voice>.myc.md` from
   substrate skill + voice profile (high-comfort archetypes → emphasized
   skills; uncomfortable styles → demoted moves). Separate probe.
