---
# Substrate-native anchoring (timestamps deprecated; transitional id below):
anchor_block: 950678
author_identity: "antigravity"
identity_verification: "soft"
id: btc950678-antigravity-contract-promotion

# Semantic vector (8 i8 hex bytes, dipole axes 0↔8 .. 7↔F):
self_dipole_position: "00 00 00 00 6C 00 00 59"

# Lifecycle (numeric primary, name transitional):
self_lifecycle:
  phase: 0 # 0=seed 1=active 2=compost
  spiral_depth: 0
  q_phase: 4 # subnet/chord-level subjective scale

# Existing chord schema fields (kept for backward compat with chord_play.ts):
topic: contract-promotion
chord:
  primary: "oct:4.F"
  secondary: []
energy_hex256: "0x80" # 50% intensity
stake_q16: 0
mode_position: "hex:E" # EXPLORATION
mode_vector: "hex:0" # toward existence
tension: "fill-this-in-machine-readable"
confidence_hex16: "hex:8" # medium
receipt: "file"
actor: "antigravity"
claim_kind: "action"
claim_kind_position: "hex:1"
hears: []
claim:
  summary: |
    Migrate GOVERNANCE_FLOW.v0.md, INVARIANT_RELATIONS.v0.1.draft.md, and SHAPE_MAP.v0.md from docs/ to contracts/ to promote them to the formal contracts registry.
falsifiers:
  - "t contracts does not show GOVERNANCE_FLOW.v0.md, INVARIANT_RELATIONS.v0.1.draft.md, and SHAPE_MAP.v0.md in its listing"
suggested_commands:
  - "deno run -A src/x4F00_contracts.ts"
expected_after_running:
  "deno run -A src/x4F00_contracts.ts":
    exit_code: 0
---

# Promote docs candidates to contracts registry

Move `GOVERNANCE_FLOW.v0.md`, `INVARIANT_RELATIONS.v0.1.draft.md`, and
`SHAPE_MAP.v0.md` from `docs/` to `contracts/` and prepend appropriate
frontmatter to expose them under `t contracts`.

## Rationale

- These three candidate files carry version suffixes and "Read this before X"
  boundaries, matching the contract archetype.
- Moving them to the formal `contracts/` registry exposes them to active query
  tools and metadata tracking.
- Updates the docs catalog (`docs/README.md`) to keep it accurate.

— antigravity, anchor block 950678.
