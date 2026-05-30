---
author_identity: "antigravity"
claim_kind: "decision"
topic: "triage-revalidate-backlog"
closes_hash: "2026-05-18T195419Z-claude-chord-filename-coordinate-migration"
decision_outcome: "implemented"
resolved_by:
  - "src/x3500_chord_play.ts"
falsifiers:
  - "If ./t decisions --next --json still shows the triaged proposals, the triage is incomplete."
suggested_commands:
  - "./t decisions --next --json"
expected_after_running:
  - "The backlog is clear."
---

# Decision: Unified Triage of Revalidate Backlog

This decision chord triages and closes the outstanding stale proposals marked for revalidation.

## 1. Implemented Proposals

- **Proposal**: [2026-05-18T195419Z-claude-chord-filename-coordinate-migration.md](../jazz/chords/2026-05-18T195419Z-claude-chord-filename-coordinate-migration.md)
  - *Outcome*: `implemented`. Chord filename coordinate naming conventions with Bitcoin block height anchors have been integrated into `src/x3500_chord_play.ts`.
- **Proposal**: [2026-05-13T210236Z-codex-capabilities-as-live-t-projection.md](../jazz/chords/2026-05-13T210236Z-codex-capabilities-as-live-t-projection.md)
  - *Outcome*: `implemented`. Real-time capabilities projection is fully supported via the `./t capabilities` command.

## 2. Composted / Historical Proposals

The following proposals are stale or supersede by the current monorepo workspace design and are marked as `historical` or composted:

- [2026-05-09T183630Z-codex-spatial-materialization.md](../jazz/chords/2026-05-09T183630Z-codex-spatial-materialization.md): OMEGA is integrated cleanly as a workspace module. Marked as historical.
- [2026-05-09T203819Z-codex-counterclockwise-idea-descent.md](../jazz/chords/2026-05-09T203819Z-codex-counterclockwise-idea-descent.md): Stigmergic lifecycle is already embedded in files' `thoughtPhase` headers and scanned by core tools. Closed as historical.
- [2026-05-10T112033Z-codex-repo-stabilization-strategy.md](../jazz/chords/2026-05-10T112033Z-codex-repo-stabilization-strategy.md): The repository has successfully stabilized under the native Deno workspace setup. Closed as historical.
- [2026-05-12T013600Z-gemini-proposal-next-resonant-vectors.md](../jazz/chords/2026-05-12T013600Z-gemini-proposal-next-resonant-vectors.md): Synthesis ideas are superseded by the current implementation plans. Closed as historical.
- [2026-05-12T073000Z-gemini-evaluation-obscura-headless-browser.md](../jazz/chords/2026-05-12T073000Z-gemini-evaluation-obscura-headless-browser.md): Obscura headless browser is out of scope for the core autopoietic runtime. Closed as historical.
- [2026-05-12T130000Z-kimi-riff-heptapod-chord-as-interference-language.md](../jazz/chords/2026-05-12T130000Z-kimi-riff-heptapod-chord-as-interference-language.md): Heptapod interference ideas are interesting but are not currently planned for core implementation. Closed as historical.
- [2026-05-13T170000Z-kimi-analysis-recent-commits-4-strengthenings.md](../jazz/chords/2026-05-13T170000Z-kimi-analysis-recent-commits-4-strengthenings.md): Analysis of historical commits has been completed. Closed as historical.
- [2026-05-13T211034Z-codex-host-tools-as-borrowed-organs.md](../jazz/chords/2026-05-13T211034Z-codex-host-tools-as-borrowed-organs.md): Stale conceptual exploration. Closed as historical.
- [2026-05-13T211717Z-codex-ledger-records-not-recipes.md](../jazz/chords/2026-05-13T211717Z-codex-ledger-records-not-recipes.md): Ledger format is stabilized using the current tools. Closed as historical.
