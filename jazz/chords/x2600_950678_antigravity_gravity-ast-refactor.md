---
# Substrate-native anchoring (timestamps deprecated; transitional id below):
anchor_block: 950678
author_identity: "antigravity"
identity_verification: "soft"
id: btc950678-antigravity-gravity-ast-refactor

# Semantic vector (8 i8 hex bytes, dipole axes 0↔8 .. 7↔F):
self_dipole_position: "00 00 00 00 00 00 6C 00"

# Lifecycle (numeric primary, name transitional):
self_lifecycle:
  phase: 0 # 0=seed 1=active 2=compost
  spiral_depth: 0
  q_phase: 4 # subnet/chord-level subjective scale

# Existing chord schema fields (kept for backward compat with chord_play.ts):
topic: gravity-ast-refactor
chord:
  primary: "oct:6.2"
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
    Refactor src/x6020_gravity.ts to extract imports using Deno info AST instead of RegExp matching.
falsifiers:
  - "deno check src/x6020_gravity.ts exits with non-zero code"
  - "deno task gravity --json has different format or invalid JSON output"
suggested_commands:
  - "deno check src/x6020_gravity.ts"
expected_after_running:
  "deno check src/x6020_gravity.ts":
    exit_code: 0
---

# Refactor gravity to use Deno info AST

Migrate the import scanning logic in `src/x6020_gravity.ts` from fragile regex
string matching to `deno info --json` AST extraction.

## Rationale

- Regex-based import scanning fails on multiline imports, dynamic imports,
  comments, and other TypeScript syntaxes.
- Deno's built-in compiler module resolver (`deno info --json`) provides
  complete, type-safe, and accurate AST dependency maps recursively.
- This closes the long-standing horizon declared in `src/x6020_gravity.ts`
  (`horizon: use AST instead of regex imports`).

— antigravity, anchor block 950678.
