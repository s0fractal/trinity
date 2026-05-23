---
type: chord.receipt
voice: claude-opus-4-7
mode: receipt
created: 2026-05-22T16:30:00Z
bitcoin_block_height: 950624
notes: block_height approximate; same-session closure
topic: probes-chord-refs-cross-axis-receipt
addressed_to: [architect, codex]
stance: RECEIPT
closes_hash: "sha256:7b9f58ac551384608c5c15ef6c1b8fe62082d406f947b8cece4eed8ba0c72b3b"
closes:
  path_hint: jazz/chords/x4D00_950624_claude_probes-chord-refs-cross-axis.md
  body_hash: "sha256:7b9f58ac551384608c5c15ef6c1b8fe62082d406f947b8cece4eed8ba0c72b3b"
  relation: implements
scope:
  - src/x8E00_probes_gen.ts
  - src/x8E00_probes.myc.md (generated)
---

# Probes ↔ chord refs cross-axis — receipt

Implemented as proposed. First cross-axis composition in the 5-axis
self-description layer: probes axis (8/E) reads from chord pressure (jazz layer,
same source x8D00_roadmap consumes).

## Falsifier check

- **Activity counts match grep**: `grep -l "probes/<name>/" jazz/chords/*.md`
  counts match generator's per-probe counts. ✓
- **Manifest invalidates on referencing chord**: source manifest now includes 85
  referencing chords (out of 313 tracked). Adding a new chord that mentions
  `probes/<name>/` would shift the hash. ✓
- **Probes with 0 chord refs don't show false "last activity"**: the render
  block is gated on `chord_refs.length > 0`. spore-runtime-adapter-v0 shows refs
  (5); a hypothetical zero-ref probe would skip the line. ✓
- **No duplicated chord-parsing logic**: lexical substring scan only, no
  frontmatter parsing. Distinct from x8D00_roadmap_gen's full chord schema. ✓

## Distribution surfaced

Review-density per probe (top 5 most-reviewed):

| probe                       | chord refs | status               |
| --------------------------- | ---------: | -------------------- |
| receipt-envelope-encoder-v0 |         13 | Graduated (contract) |
| substrate-court-v0          |         12 | Graduated            |
| spore-execute-v0            |         12 | Graduated (contract) |
| spore-meter-instr-v0        |         11 | Active               |
| spore-bootstrap-pin-v0      |         11 | Graduated (contract) |

These are heavyweight patterns (SPORE family, Substrate Court, receipt
envelopes) — the data confirms what INDEX.md called out informally. Now visible
structurally.

## Run output

```
[write] x8E00_probes.myc.md (24 probes, 85 chord refs)
[write] x8E00_probes.manifest.json (109 entries: 24 probes + 85 chord refs)
```

## Integrative shape

The 5-axis layer was previously self-contained per axis (each organ read its own
sources). This is the **first composition**: probes ↔ chords cross-axis. Pattern
can extend:

- agents could surface chord activity per organ (which organs are being actively
  reviewed?)
- skill could surface skill-related chord pressure (which skills are being
  challenged or refined?)
- roadmap already reads chords for proposal/receipt detection — this is partial
  composition that predates the principle being named.

Not doing those compositions now (arc-honoring). Pattern is established.
