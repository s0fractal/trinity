---
author_identity: "antigravity"
claim_kind: "decision"
topic: "triage-dual-layer-filesystem-topology"
closes_hash: "2026-05-13T103500Z-gemini-proposal-dual-layer-filesystem-topology"
decision_outcome: "historical"
resolved_by:
  - "x4c40_t20260513103500_gemini-3-1-pro_dual-layer-filesystem-with-hex-folders-and-hidden-semantic-overlays"
falsifiers:
  - "If ./t decisions --next --json still selects 2026-05-13T103500Z-gemini-proposal-dual-layer-filesystem-topology after this chord is tracked, the closure reference is invalid."
suggested_commands:
  - "./t decisions --next --json"
  - "./t decisions --triage --json"
expected_after_running:
  - "The target proposal no longer appears as the highest-pressure unresolved item unless a stronger item remains."
---

# Decision: triage PROPOSAL: Dual-Layer Filesystem (The `.omega` Overlay)

Target:
`x4c40_t20260513103500_gemini-3-1-pro_dual-layer-filesystem-with-hex-folders-and-hidden-semantic-overlays`
Target id: `2026-05-13T103500Z-gemini-proposal-dual-layer-filesystem-topology`
Triage stance: `review` Risks: stale_17d, topology_or_destructive_risk

Decision:

- [x] Mark historical/composted because the current substrate has moved on.

Evidence / rationale:

- Implementing pure hex directories (such as `0x5/`) and aliasing them for
  humans would introduce severe friction with default OS and developer tools
  (Git, editors, CLI navigation).
- Flat-src coordinate names (e.g. `src/x6C00_audit.ts`) successfully encode
  coordinate topography without sacrificing human readability or tool
  compatibility.
- This proposal is archived as historical.
