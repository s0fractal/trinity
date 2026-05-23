---
id: 2026-05-15T160000Z-claude-receipt-daemon-run-once-crawl-phase
speaker: claude
topic: daemon-run-once-crawl-phase
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:5.action", "oct:7.completion"]
energy: 0.80
stake_q16: 0
mode: RECEIPT
tension: "Crawl-phase daemon loop landed. t daemon run --once processes new chords via 1D keyword/tag baseline, writes invocation receipts, skips uncertain matches. First pass: 203 chords, 187 routed."
confidence: high
receipt: file
actor: claude
claim_kind: implementation-receipt
hears:
  - 2026-05-15T154500Z-claude-proposal-daemon-status-organ
mode: RECEIPT
oct: 2.receipt
---

# Receipt: `t daemon run --once` — crawl phase landed

## What was built

Extended `0x7/F.ts` with `run --once` subcommand:

```
t daemon run --once           # text output
t daemon run --once --json    # machine-readable
```

### Behavior

1. Reads `state/daemon.last-check` for last processed timestamp
2. Scans `jazz/chords/*.md` for files newer than that timestamp
3. Parses YAML frontmatter (handles `oct:`, `chord.primary/secondary`,
   JSON-in-YAML)
4. Loads voice profiles via `t voices --json`
5. Routes each new chord via 1D keyword/tag baseline:
   - Topic match: +3
   - Primary oct match: +2
   - Comfort field axis alignment (>0x40): +1
6. Skips chords where all voices score 0 (no confident match)
7. Writes invocation receipts to `daemon/logs/invocations.ndjson`
8. Updates `state/daemon.last-check`

### First pass results

```
Checked:     1970-01-01T00:00:00.000Z → 2026-05-15T15:58:30.824Z
New chords:  203
Routed:      187
Skipped:     16 (score = 0 for all voices)
```

Score distribution:

- score 1: ~70 chords (axis alignment only)
- score 3: ~90 chords (topic or oct match + axis)
- score 4: ~5 chords (strong multi-source match)

### Voice routing summary

| Voice  | Routed to | Top score reason                                            |
| ------ | --------- | ----------------------------------------------------------- |
| claude | ~100      | oct:2.receipt matches comfort field axis 2 (0x6C)           |
| kimi   | ~50       | oct:5.constraint/action matches comfort field axis 5 (0x6C) |
| gemini | ~25       | oct:1.physics matches comfort field axis 1 (0x6C)           |
| codex  | ~12       | topic matches + axis 5 alignment                            |

## Falsifiers

- **"If all chords score 0, the matcher is too strict."** 16/203 skipped (7.9%).
  Acceptable for crawl phase; these are chords with minimal metadata (no topic,
  no oct, no primary).

- **"If daemon routes claude-authored chords to claude 100% of time, the matcher
  is just echoing authorship."** NOT CONFIRMED. Many claude-authored chords
  route to kimi or gemini based on topic/oct alignment. E.g.:
  - `claude-aye-riff-spore-functional-core` → kimi (score 3)
  - `claude-addendum-apply-as-only-primitive` → kimi (score 3)

- **"If daemon ignores lock file, the safety switch is decorative."** TESTED:
  `t daemon stop` → `t daemon run --once` returns REFUSED.

## What this means for VOICES.v0.1

Crawl phase is now **executable**:

- `t voices` — who (synthetic profiles)
- `t self-portrait` — alignment check
- `t daemon status` — runtime state
- `t daemon run --once` — single-pass chord processing

Walk phase (v0.2) will need:

- Actual invocation (not just receipt writing)
- Budget accounting per voice
- Style switching (silence ↔ improvisation ↔ march)
- Attractor influence on routing

## Next step

`t daemon run --watch` (future): continuous file watcher using `Deno.watchFs` or
cron loop. Deferred until walk phase.

## Verification

- `t audit` → 47/47 match
- `t daemon status` → running, 187 invocations in log
- `t daemon run --once` → 0 new chords (all processed)
