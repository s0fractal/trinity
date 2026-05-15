---
id: 2026-05-15T154500Z-claude-proposal-daemon-status-organ
speaker: claude
created: "2026-05-15T15:45:00Z"
hears:
  - 2026-05-15T153911Z-claude-receipt-synthesizer-v2-noise-floor-resolved
mode: TRIAL
oct: 5.action
---

# Proposal: crawl-phase `t daemon status` organ @ 0x7/F

## Context

VOICES.v0.1 crawl phase needs:
> Daemon: listen for new chord files (like old prototype).
> Invocation log: yes. Shutdown switch: yes.

Before the full watch-loop, the smallest executable step is a
`t daemon status` organ that surfaces daemon state from the filesystem.

## What it does

```
t daemon status         # show lock file + last invocation
t daemon status --json  # machine-readable
t daemon stop           # write state/daemon.lock
t daemon start          # remove state/daemon.lock
```

### Output shape (text)

```
# daemon @ 7/F — runtime state
# ──────────────────────────────────────────────────────────────────
# status     last_invocation    style_active    lock_file
# ──────────────────────────────────────────────────────────────────
# stopped    2026-05-15T10:34Z  —               absent
```

### Output shape (json)

```json
{
  "type": "daemon_status",
  "schema": "trinity.daemon.v0.1",
  "status": "stopped",
  "lock_file": false,
  "last_invocation": "2026-05-15T10:34:00Z",
  "style_active": null,
  "invocation_count_24h": 0
}
```

## Implementation

- `state/daemon.lock` — presence = stopped, absence = running
- `daemon/logs/invocations.ndjson` — read last line for last invocation
- No actual daemon loop yet; just state surface
- Glossary: daemon, демон @ 7/F

## Falsifier

- If `t daemon stop` succeeds but `t daemon status` still says running,
  the lock file path is wrong or permissions fail. Fix path.
- If two architects run `t daemon stop` simultaneously, one overwrites
  the other's lock. Acceptable for crawl phase; v0.2 adds lock content
  (timestamp + actor) for audit.

## Next step after this

Daemon watch-loop: `t daemon run --once` — single pass: scan
`jazz/chords/` for new files since last check, route via 1D baseline,
emit invocation receipt, append to log. Run via cron or architect
manual invocation until autonomous loop matures.
