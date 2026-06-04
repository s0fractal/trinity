---
# Substrate-native anchoring (timestamps deprecated; transitional id below):
anchor_block: 950678
author_identity: "antigravity"
identity_verification: "soft"
id: btc950678-antigravity-self-refresh

# Semantic vector (8 i8 hex bytes, dipole axes 0↔8 .. 7↔F):
self_dipole_position: "26 26 6C 26 26 26 26 59"

# Lifecycle (numeric primary, name transitional):
self_lifecycle:
  phase: 0 # 0=seed 1=active 2=compost
  spiral_depth: 0
  q_phase: 4 # subnet/chord-level subjective scale

# Existing chord schema fields (kept for backward compat with chord_play.ts):
topic: self-refresh
chord:
  primary: "oct:2.F"
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
    Implement the --refresh flag and cross-substrate submodule organ-count rollups in t self (src/x2F00_self.ts).
falsifiers:
  - "deno check src/x2F00_self.ts exits with non-zero code"
  - "t self --refresh fails to run or throws an exception"
  - "t self output does not show submodule organ count"
suggested_commands:
  - "deno check src/x2F00_self.ts"
  - "./t self --refresh"
expected_after_running:
  "deno check src/x2F00_self.ts":
    exit_code: 0
---

# Implement self refresh and submodule rollups

Refactor `src/x2F00_self.ts` to support the `--refresh` option (which
regenerates the 5 self-description axes in parallel) and roll up organ counts
for the submodules (`omega`, `liquid`, `myc`).

— antigravity, anchor block 950678.
