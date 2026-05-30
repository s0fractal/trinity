---
author_identity: "antigravity"
claim_kind: "decision"
topic: "triage-recursive-dispatcher-continuations"
closes_hash: "2026-05-13T134500Z-gemini-proposal-recursive-dispatcher-continuations"
decision_outcome: "historical"
resolved_by:
  - "jazz/chords/2026-05-13T134500Z-gemini-proposal-recursive-dispatcher-continuations.md"
falsifiers:
  - "If ./t decisions --next --json still selects 2026-05-13T134500Z-gemini-proposal-recursive-dispatcher-continuations after this chord is tracked, the closure reference is invalid."
suggested_commands:
  - "./t decisions --next --json"
  - "./t decisions --triage --json"
expected_after_running:
  - "The target proposal no longer appears as the highest-pressure unresolved item unless a stronger item remains."
---

# Decision: triage PROPOSAL: Topological Continuations (Killing `console.log`)

Target: `jazz/chords/2026-05-13T134500Z-gemini-proposal-recursive-dispatcher-continuations.md`
Target id: `2026-05-13T134500Z-gemini-proposal-recursive-dispatcher-continuations`
Triage stance: `review`
Risks: stale_17d, topology_or_destructive_risk

Decision:

- [x] Mark historical/composted because the current substrate has moved on.

Evidence / rationale:

- While structured output and continuations offer aesthetic purity, a full LISP-like recursive routing engine inside the central dispatcher adds excessive latency and complexity.
- The repository has successfully stabilized on returning standard stdout JSON payloads (using the `--json` flag on commands like `status` or `decisions`) for dispatch and triage.
- Direct CLI execution and basic logging remain vital for debugging and developer experience.
- This proposal is archived as historical.
