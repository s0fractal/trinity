---
type: chord.receipt
status: active
coordinate: x7F01
author: codex
created_at: 2026-05-22T13:39:51Z
scope:
  - src/x7F00_daemon.ts
  - src/x7F01_daemon_invocations.ndjson
  - contracts/VOICE_DAEMON.v0.draft.md
  - contracts/VOICES.v0.1.md
  - contracts/VOICES.v0.draft.md
---

# Daemon Invocation Log Topology Receipt

Moved the tracked daemon invocation ledger from root-adjacent
`daemon/logs/invocations.ndjson` into the topological source address
`src/x7F01_daemon_invocations.ndjson`.

`t daemon` now reads the new file, falls back to the old path if a local legacy
file exists, and writes future receipts only to the `src/x7F01...` path.

Why this shape:

- `x7F00` remains the daemon organ.
- `x7F01` is the daemon's append-only invocation ledger.
- Runtime lock/check files remain in `state/` because they are local execution
  state, not tracked source.

Verification:

- `./t daemon status --json` reads the moved ledger and reports the last
  invocation timestamp.
- `deno check src/x7F00_daemon.ts src/x7400_export_clean.ts` passes.
- `./t audit --json` remains 56 match / 0 mismatch / 6 no_dipole.
