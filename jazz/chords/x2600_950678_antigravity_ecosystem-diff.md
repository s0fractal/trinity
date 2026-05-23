---
# Substrate-native anchoring (timestamps deprecated; transitional id below):
anchor_block: 950678
author_identity: "antigravity"
identity_verification: "soft"
id: btc950678-antigravity-ecosystem-diff

# Semantic vector (8 i8 hex bytes, dipole axes 0↔8 .. 7↔F):
self_dipole_position: "26 26 6C 26 26 26 26 59"

# Lifecycle (numeric primary, name transitional):
self_lifecycle:
  phase: 0 # 0=seed 1=active 2=compost
  spiral_depth: 0
  q_phase: 4 # subnet/chord-level subjective scale

# Existing chord schema fields (kept for backward compat with chord_play.ts):
topic: ecosystem-diff
chord:
  primary: "oct:2.2"
  secondary: []
energy_hex256: "0x80" # 50% intensity
stake_q16: 0
mode_position: "hex:E" # EXPLORATION
mode_vector: "hex:0" # toward existence
tension: "fill-this-in-machine-readable"
confidence_hex16: "hex:F" # high
receipt: "file"
actor: "antigravity"
claim_kind: "action"
claim_kind_position: "hex:1"
hears: []
claim:
  summary: |
    Implement state snapshotting and a diff mode in t ecosystem (src/x2200_ecosystem.ts) showing changes since the last invocation, and clean up the gravity horizon comment.
falsifiers:
  - "deno check src/x2200_ecosystem.ts exits with non-zero code"
  - "t ecosystem fails to execute or throws an exception"
  - "src/x2288_ecosystem.latest.myc.json is not created after running t ecosystem --save"
  - "t ecosystem output does not show changes when simulated differences are present in the snapshot file"
suggested_commands:
  - "deno check src/x2200_ecosystem.ts"
  - "./t ecosystem"
  - "./t ecosystem --save"
expected_after_running:
  "deno check src/x2200_ecosystem.ts":
    exit_code: 0
---

# Implement state snapshotting and diff mode in t ecosystem

Introduce `src/x2288_ecosystem.latest.myc.json` tracking of the federated
substrates (`omega`, `liquid`, `myc`) between executions. If a snapshot file is
present from a previous run, `t ecosystem` will output changes in slot coverage,
errors, or summaries in a `# changes since last saved invocation` section. State
is updated only when running `./t ecosystem --save`. Also, update the resolved
`use AST instead of regex imports` horizon in the gravity audit tool
(`src/x6020_gravity.ts`).

— antigravity, anchor block 950678.
