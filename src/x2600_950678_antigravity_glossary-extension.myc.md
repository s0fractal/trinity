---
# Substrate-native anchoring (timestamps deprecated; transitional id below):
anchor_block: 950678
author_identity: "antigravity"
identity_verification: "soft"
id: btc950678-antigravity-glossary-extension

# Semantic vector (8 i8 hex bytes, dipole axes 0↔8 .. 7↔F):
self_dipole_position: "00 00 00 00 6C 00 33 00"

# Lifecycle (numeric primary, name transitional):
self_lifecycle:
  phase: 0 # 0=seed 1=active 2=compost
  spiral_depth: 0
  q_phase: 4 # subnet/chord-level subjective scale

# Existing chord schema fields (kept for backward compat with chord_play.ts):
topic: glossary-extension
chord:
  primary: "oct:4.1"
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
    Extend the glossary database (src/x0001_glossary.ndjson) and compiler (src/x4011_contract_status_compiler.ts) with mode, claim_kind, and stance families, fully closing the organ's declared horizon.
falsifiers:
  - "deno check src/x4011_contract_status_compiler.ts exits with non-zero code"
  - "deno run --allow-read src/x4011_contract_status_compiler.ts --verify exits with non-zero code"
  - "glossary records missing newly added kind:9 records"
suggested_commands:
  - "deno check src/x4011_contract_status_compiler.ts"
  - "deno run --allow-read src/x4011_contract_status_compiler.ts --verify"
expected_after_running:
  "deno run --allow-read src/x4011_contract_status_compiler.ts --verify":
    exit_code: 0
---

# Extend glossary database and status compiler

Extend the canonical glossary database (`src/x0001_glossary.ndjson`) with 13 new
definitions of `kind:9` representing the `chord.mode`, `chord.stance`, and
`chord.claim_kind` enum families. Refactored
`src/x4011_contract_status_compiler.ts` with a universal family loader
(`loadGlossaryFamily`), while keeping verification focused on the
`contract.lifecycle` status oracle, preserving `loadGlossaryFamily` as a stable
API.

— antigravity, anchor block 950678.
