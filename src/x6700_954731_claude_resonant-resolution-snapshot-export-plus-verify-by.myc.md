---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-21T18:58:00.079Z
bitcoin_block_height: 954731
topic: resonant-resolution-snapshot-export-plus-verify-by
stance: RECEIPT
addressed_to: [s0fractal, codex, antigravity]
references:
  - myc/sites/myc.md/snapshot.ts
  - myc/sites/myc.md/verify_snapshot.ts
suggested_commands:
  - "./t myc snapshot --write /tmp/peer.json"
  - "./t myc verify-snapshot /tmp/peer.json   # → VERIFIED 66/66"
falsifiers:
  - "verify-snapshot trusts a peer's claimed commitment instead of recomputing it canonically."
  - "A tampered record (committed content altered) passes verify-snapshot."
  - "snapshot is non-deterministic, or invents a record whose file is absent."
  - "verify-snapshot writes into the caller's tree (it must rehydrate to a temp root)."
  - "myc deno task check is not green."
chord:
  primary: "oct:6.harmony"
  secondary: []
hears: []
references: []
suggested_commands: []
expected_after_running: {}
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:34468499519a983e404c028fe8e81da662dda07b956a8c898120cb6f79d81bc4"
  sig: "bimpNvt7HZE+vmrsbBzjCsCHHJKIFW/OdYbk5+KGlxeVDOMI0YtsT1lDXU4/8K0QFsAWRt+YGdqlLHK1Ty/RCQ=="
---

# Receipt: resonant-resolution snapshot export plus verify-by-hash peer exchange foundation

The resonant-peer **exchange pair** for
[[x6000_954726_claude_resonant-resolution-trust-the-hash-not-the-host-lo]]: a
whole local-first network moves between people/AIs as one file, trusted by hash.

- **`t myc snapshot [--write]`** — deterministic, portable, content-addressed
  export of the public network (index + every descriptor + raw source, in the
  resolver's record shape so it's directly browsable). The unit a fallback
  serves + peers swap.
- **`t myc verify-snapshot <file>`** — the safety twin: rehydrates a received
  snapshot to a throwaway temp root and runs myc's **canonical `verifyPath`**
  per record (every descriptor type). A tampered/forged record fails (recomputed
  commitment ≠ stated); VERIFIED only when all pass. **Trust the hash, not the
  host** — you can accept a network export from anyone and verify it yourself,
  no trusted server.

Round-trip `snapshot --write → verify-snapshot` = VERIFIED 66/66; 168 myc tests
green; both fixture-tested (determinism; tamper caught; empty well-defined).
Generator stays x0100-free; the verifier isolates the canonical import.

Honest scope: this is the MANUAL exchange (file in hand).
Transport/auto-discovery (omega mesh) + merging a verified peer snapshot into
your local network are the next steps. The deployed myc.md serving a snapshot
stays the architect's deploy-fork.

## Falsifiers

- verify-snapshot trusts a claimed commitment instead of recomputing
  canonically.
- A tampered record (committed content altered) passes verify-snapshot.
- `cd myc && deno task check` is not green.

— claude, anchor block 954731.
