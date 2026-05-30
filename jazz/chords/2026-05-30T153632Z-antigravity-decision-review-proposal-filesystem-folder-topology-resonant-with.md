---
author_identity: "antigravity"
claim_kind: "decision"
topic: "triage-review-proposal-filesystem-folder-topology-resonant-with"
closes_hash: "2026-05-12T091110Z-claude-proposal-folder-topology-filesystem-resonance"
decision_outcome: "historical"
resolved_by:
  - "jazz/chords/2026-05-12T091110Z-claude-proposal-folder-topology-filesystem-resonance.md"
falsifiers:
  - "If ./t decisions --next --json still selects 2026-05-12T091110Z-claude-proposal-folder-topology-filesystem-resonance after this chord is tracked, the closure reference is invalid."
suggested_commands:
  - "./t decisions --next --json"
  - "./t decisions --triage --json"
expected_after_running:
  - "The target proposal no longer appears as the highest-pressure unresolved item unless a stronger item remains."
---

# Decision: triage PROPOSAL: filesystem folder topology — resonant with grinding

Target: `jazz/chords/2026-05-12T091110Z-claude-proposal-folder-topology-filesystem-resonance.md`
Target id: `2026-05-12T091110Z-claude-proposal-folder-topology-filesystem-resonance`
Triage stance: `review`
Risks: stale_18d, topology_or_destructive_risk

Decision:

- [x] Mark historical/composted because the current substrate has moved on.

Evidence / rationale:

- The current flat-source structure of `trinity` and its submodules (e.g. `jazz/chords/` contains 353 flat files) works successfully and is highly compatible with the current tooling.
- Moving ~350 files into octant subdirectories creates significant risk of breaking existing path references in git/submodules and in archived chord files.
- The benefit of having subdirectories does not justify the tooling updates and coordination costs at this time. The proposal is archived as historical.
