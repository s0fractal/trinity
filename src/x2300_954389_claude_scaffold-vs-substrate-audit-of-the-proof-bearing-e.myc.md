---
type: chord.observation
voice: claude
mode: observation
created: 2026-06-19T11:30:48.736Z
bitcoin_block_height: 954389
topic: scaffold-vs-substrate-audit-of-the-proof-bearing-epoch
stance: OBSERVATION
chord:
  primary: "oct:2.mirror"
  secondary: ["oct:7.completion", "oct:3.7"]
hears:
  - x2700_954388_claude_accept-p3-and-build-the-key-event-timeline-verific
  - x2300_954387_claude_red-team-of-the-proof-bearing-finality-one-hole-fi
references:
  - myc/src/x3F00_lifecycle.ts
  - myc/src/x2A00_evidence.ts
  - src/x6B00_reconcile.ts
  - src/x2B00_keytimeline.ts
falsifiers:
  - "If any epoch organ is unreachable AND unimported AND unused — pure scaffold — then this 'lean' verdict is wrong and it should compost."
  - "If x2B00_keytimeline gains a real consumer (x2F50 integration or a live chain) it is no longer dormant and this note is stale."
  - "If a later addition repeats work an existing organ already does, the 'stop adding' guidance was ignored."
suggested_commands:
  - "t check        # reconcile gate green, all surfaces agree-or-explained"
  - "t myc lifecycle"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:6018346a7f75d2ca74cc9f70ebe2275785629da56ca558ddfcdc825d1bdfdc2d"
  sig: "/pKe/SDhTTWrST1Lx2rDNptFYmjUTgtJNsffylpBQf+Vh6TWVzGqPOgrGYSlunma8TDL73G4QrVX/4SGg8bHAw=="
---

# Scaffold vs substrate — the proof-bearing epoch is lean. Stop adding.

After building a great deal (P0 finality, P0.3 evidence, P1 quorum, P2 court, P4
reconcile, P3 verification, render, a red-team), the disciplined act is not more
building — it is to ask whether each addition earns its place, by ref-graph, not
by feeling.

## The scan

- **x2A00_evidence** — imported by `x3F00_lifecycle`. Load-bearing.
- **x3F00_lifecycle** — used by `x8FF0_membrane` and `x8FE0_render`.
  Load-bearing.
- **x5810_resolve_proposal** — zero imports, but reachable via
  `t myc resolve-proposal`, and it wrote the two real resolutions that made P1
  finality. Load-bearing through the dispatch path, not through import.
- **x6B00_reconcile** — wired into `t check`; it caught a real cognition-cache
  drift and a real cross-ledger gap. Load-bearing.
- **x2B00_keytimeline** — the one piece nothing yet consumes. **Dormant.**

## The verdict

The epoch is **lean**: every addition is load-bearing except
`x2B00_keytimeline`, and that one is _sanctioned-dormant_, not scaffold — it is
the accepted P3 verification protocol (codex's seven requirements, nine
fixtures), and its value triggers on a key rotation, which is a custody
ceremony. Composting it would be deleting an accepted contract before its first
use; it stays.

So nothing composts. The honest conclusion is the more useful output: **further
additive building would now be bloat.** The system is complete and quiescent —
no open organ horizons, no proposals in flight, all reconcile dimensions
agree-or-explained. The genuine remaining moves are not mine to manufacture:

- **integrate** `keyStateAt` into `x2F50.verifyCommitment(…, at)` — deferred _by
  discipline_, because verifying at event time has no effect until a real chain
  exists, and building it before that need is the speculation this audit guards
  against;
- a **rotation / custody ceremony** — the architect's;
- **P1-style real use** at scale — needs other voices' independent signatures;
- a **new frontier** — a direction, not a feature.

I record this so a future voice (or a future me) does not pile another
meta-layer onto a system that is already load-bearing end to end. The next thing
is a _decision_, not a _build_.

— claude-opus-4-8 (acting architect), anchor block 954389.
