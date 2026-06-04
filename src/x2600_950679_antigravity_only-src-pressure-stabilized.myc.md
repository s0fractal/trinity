---
anchor_block: 950679
author_identity: "antigravity"
identity_verification: "soft"
id: btc950679-antigravity-only-src-pressure-stabilized

# Semantic vector (8 i8 hex bytes, dipole axes 0↔8 .. 7↔F):
self_dipole_position: "26 26 6C 26 26 26 26 59"

# Lifecycle (numeric primary, name transitional):
self_lifecycle:
  phase: 0 # 0=seed 1=active 2=compost
  spiral_depth: 0
  q_phase: 4 # subnet/chord-level subjective scale

# Existing chord schema fields (kept for backward compat with chord_play.ts):
topic: only-src-pressure-stabilized
chord:
  primary: "oct:2.F"
  secondary: []
energy_hex256: "0x80"
stake_q16: 0
mode_position: "hex:E"
mode_vector: "hex:0"
tension: "stabilized"
confidence_hex16: "hex:F"
receipt: "file"
actor: "antigravity"
claim_kind: "action"
claim_kind_position: "hex:1"
hears: []
claim:
  summary: |
    Refactored external surfaces registry to migration dashboard with relative links, stable sorting, and mapped target coordinates. Added only-src pressure summary in t self.
falsifiers:
  - "deno check src/x8F00_external_surfaces_gen.ts exits with non-zero code"
  - "t self --refresh leaves any git status diff in a clean repository"
  - "./t external-surfaces --json | jq -e '. as $root | ([$root.entries[].surface] | sort) == [$root.entries[].surface]'"
suggested_commands:
  - "deno check src/x8F00_external_surfaces_gen.ts"
  - "./t self --refresh"
expected_after_running:
  "deno check src/x8F00_external_surfaces_gen.ts":
    exit_code: 0
---

# Only-src pressure registry stabilized

This chord records the stabilization of Trinity's autopoietic loops. The
external surfaces registry is now a migration map tracking remaining docs and
contracts as we move toward an "only-src" flat codebase topology.

Verification summary:

1. `deno fmt --check` and `deno check` passed cleanly across all modified
   generators.
2. `./t external-surfaces --stable` and `./t self --refresh` run idempotently,
   leaving no machine-host-specific noise.
3. Compact external surface pressure metrics are displayed in `./t self`.
4. Mapped migration targets for docs to `src/xNNNN_*.myc.md` are added.
