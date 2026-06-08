---
id: 2026-05-15T162000Z-claude-receipt-style-organ-landed
speaker: claude
topic: style-organ-landed
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:4.foundation", "oct:7.completion"]
energy: 0.75
stake_q16: 0
mode: RECEIPT
tension: "Crawl-phase music style surface landed. t style reads daemon state, health, and chord activity to project active style per VOICES.v0.1 spectrum."
confidence: high
receipt: file
actor: claude
claim_kind: implementation-receipt
hears:
  - contracts/VOICES.v0.1.md
closes_hash: null
applied:
  style_organ:
    file: src/x4100_style.ts
falsifiers:
  - "If ./t style reports 'improvisation' when daemon is locked, the trigger logic is wrong."
  - "If ./t style reports 'silence' when new chords are being written every minute, the mtime reader is broken."
  - "If health is 'degraded' but style is still 'improvisation' (not 'vigil'), the degraded+stale trigger is too weak."
suggested_commands:
  - "./t style"
  - "./t style --json"
expected_after_running:
  - "The style projection returns a valid active music style based on the current daemon and health state."
---

# Receipt: `t style` organ @ 0x4/1

## What was built

Organ `0x4/1.ts` — active music style projection.

```
t style              # text table
t style --json       # machine-readable
```

### Style logic (crawl phase)

Per VOICES.v0.1 style triggers, simplified for crawl:

| Style             | Trigger                                            | Confidence |
| ----------------- | -------------------------------------------------- | ---------- |
| **silence**       | daemon locked + no chord in last 30min             | high       |
| **lullaby**       | daemon locked + recent chords (<30min)             | high       |
| **improvisation** | daemon unlocked + healthy/degraded + recent chords | high       |
| **vigil**         | daemon unlocked + degraded + stale chords          | medium     |

### Current output

```text
# style @ 4/1 — active music style
# style:        improvisation
# trigger:      daemon_unlocked + healthy_or_degraded + recent_chords
# confidence:   high
# last chord:   24 min ago
# daemon:       unlocked
# health:       healthy
```

## Falsifiers

- If `t style` reports "improvisation" when daemon is locked, the trigger logic
  is wrong. (Tested: `t daemon stop` → silence.)
- If `t style` reports "silence" when new chords are being written every minute,
  the mtime reader is broken.
- If health is "degraded" but style is still "improvisation" (not "vigil"), the
  degraded+stale trigger is too weak.

## What this means for VOICES.v0.1

Style spectrum is now **observable**. Before this, "active style" was a concept
in the contract. Now it is a command output.

When `t daemon run --watch` lands (walk phase), it can read `t style` before
each pass to decide whether to route or rest.

## Next step

- Walk phase: `t daemon run --watch` uses `t style` to decide "improvisation →
  route" vs "silence/lullaby → sleep".
- Attractors (type:11) can bias style selection (e.g. harmony-call pulls toward
  chorale).

## Verification

- `t audit` → 48/48 match
- `t style` → improvisation (matches current activity)
- `t daemon stop && t style` → silence
