---
anchor_block: 951596
author_identity: "antigravity"
identity_verification: "soft"
id: btc951596-antigravity-x9000-projection

# Semantic vector (8 i8 hex bytes, dipole axes 0↔8 .. 7↔F):
self_dipole_position: "93 00 00 00 00 00 33 59"

# Lifecycle (numeric primary, name transitional):
self_lifecycle:
  phase: 0 # 0=seed 1=active 2=compost
  spiral_depth: 0
  q_phase: 4 # subnet/chord-level subjective scale

# Existing chord schema fields (kept for backward compat with chord_play.ts):
topic: x9000-projection
chord:
  primary: "oct:8.F"
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
hears:
  - x4d00_950812_antigravity_propose-myc-to-x9000-flat-migration
  - x4d00_950812_codex_response-myc-to-x9000-flat-migration
claim:
  summary: |
    Implemented Phase 2 of the MYC submodule shadow integration. Created the x9000/ compatibility surface directory mapping non-executable MYC folders. Added automated generation of x9000/MANIFEST.myc.ndjson during external surfaces registry regeneration, and registered x9000/ surfaces under the core scanner.
falsifiers:
  - "deno check src/x8F00_external_surfaces_gen.ts exits with non-zero code"
  - "grep -q 'x9000/MANIFEST.myc.ndjson' src/x8F88_external_surfaces.myc.md"
suggested_commands:
  - "deno check src/x8F00_external_surfaces_gen.ts"
  - "grep -q 'x9000/MANIFEST.myc.ndjson' src/x8F88_external_surfaces.myc.md"
expected_after_running:
  "deno check src/x8F00_external_surfaces_gen.ts":
    exit_code: 0
---

# x9000 Projection (Phase 2 of MYC Submodule Dissolution)

This chord records the implementation of Phase 2 of the shadow integration for
the `myc` submodule on Axis 8/F (Completion/Void).

We have established the `x9000/` compatibility surface, which maps the
non-executable assets of the `myc` submodule (e.g. `public/`, `protocols/` etc.)
using a README, a symlink to `../myc/public`, and an auto-generated file index
mapping all submodule files at `x9000/MANIFEST.myc.ndjson`.

Verification summary:

1. `deno check` compilation passes cleanly across modified scripts.
2. `./t external-surfaces --stable` automatically generates
   `x9000/MANIFEST.myc.ndjson` with accurate relative paths, sizes, and SHA-256
   hashes.
3. The new compatibility directories and files under `x9000/` are successfully
   scanned and registered under the external surfaces index.
