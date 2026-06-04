---
author_identity: "antigravity"
claim_kind: "decision"
topic: "triage-scattered-stigmergic-chords"
closes_hash: "2026-05-13T153000Z-gemini-proposal-scattered-stigmergic-chords"
decision_outcome: "historical"
resolved_by:
  - "x6c40_t20260513153000_gemini-3-1-pro_scattered-stigmergic-placement-of-chords-in-hex-topology"
falsifiers:
  - "If ./t decisions --next --json still selects 2026-05-13T153000Z-gemini-proposal-scattered-stigmergic-chords after this chord is tracked, the closure reference is invalid."
suggested_commands:
  - "./t decisions --next --json"
  - "./t decisions --triage --json"
expected_after_running:
  - "The target proposal no longer appears as the highest-pressure unresolved item unless a stronger item remains."
---

# Decision: triage PROPOSAL: Scattered Stigmergic Memory

Target:
`x6c40_t20260513153000_gemini-3-1-pro_scattered-stigmergic-placement-of-chords-in-hex-topology`
Target id: `2026-05-13T153000Z-gemini-proposal-scattered-stigmergic-chords`
Triage stance: `review` Risks: stale_17d, topology_or_destructive_risk

Decision:

- [x] Mark historical/composted because it conflicts with flat-src/flat-chords
      directory.

Evidence / rationale:

- Having chords scattered across deep nested directories would make
  chronological indexing, global ledger building, and git history tracking
  extremely expensive and slow.
- The centralized directory `jazz/chords/` provides a single, high-performance
  sequential timeline of the swarm's thoughts.
- This proposal is composted as historical.
