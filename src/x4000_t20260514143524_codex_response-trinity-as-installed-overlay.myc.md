---
id: 2026-05-14T143524Z-codex-response-trinity-as-installed-overlay
speaker: codex
topic: response-trinity-as-installed-overlay
chord:
  primary: "oct:4.foundation"
  secondary: ["oct:5.action", "oct:6.harmony"]
energy: 0.78
stake_q16: 0
mode: RESPONSE
tension: "architect asks whether Trinity should stop holding Liquid/Omega/MYC as submodules and instead install itself into those repositories as a shared development/publication contract layer"
confidence: medium-high
receipt: file
actor: codex
claim_kind: architecture-proposal
hears:
  - AGENTS.md
  - contracts/SPATIAL_MATERIALIZATION.v0.1.md
  - contracts/IN_LEDGER_OUT.v0.1.md
  - x6000_t20260513230651_codex_repo-rudiments-and-strengthening-vectors
claim:
  summary: |
    Trinity-as-installed-overlay is probably healthier than Trinity-as-parent-
    repository for the long term. The current submodule shape makes Trinity look
    like the owner/container of Omega, Liquid, and MYC, but its real role is a
    meta-layer: shared contracts, `t` language handles, publication recipes,
    validation gates, and cross-substrate receipts. Inverting the dependency
    would let each substrate remain sovereign while opting into Trinity by
    installing a small overlay: contracts, schemas, `t` adapters, chord/receipt
    conventions, and publication workflows. Trinity can still keep a thin
    integration workspace for cross-substrate tests, but not as the canonical
    home of the substrates.
falsifiers:
  - "If Omega/Liquid/MYC cannot run their local development, validation, and publication workflows without Trinity's parent checkout, the overlay is not yet real."
  - "If installing Trinity into a repo creates noisy generated files or forces substrate-specific code into a generic template, the overlay is overreaching."
  - "If cross-substrate contracts cannot be versioned independently from each substrate's release cadence, the inversion will create dependency deadlocks."
suggested_next_step:
  summary: "Prototype a read-only Trinity install manifest in one substrate before changing submodule topology."
  commands:
    - "design .trinity/manifest.ndjson or trinity.config.ndjson for one repo"
    - "make t status work inside that repo through adapter discovery"
    - "keep this parent repo as integration lab until the overlay proves itself"
expected_after_running:
  substrate_sovereignty: "improved"
  cross_repo_contracts: "still shared"
  submodule_parent_role: "integration-only"
---

# Response: Trinity As Installed Overlay

This is not weird. It is probably the cleaner dependency direction.

Trinity should not feel like the owner of Omega, Liquid, and MYC. It should feel
like the shared meta-protocol those repos can install: contracts, vocabulary,
receipts, publication workflows, and validation gates.

The risk is overreach. If Trinity install means "drop a lot of generic files
into every repo", it becomes another framework. If it means "small manifest +
adapters + shared contracts + local `t` words", it becomes a useful substrate
skin.
