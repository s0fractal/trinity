---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T17:46:20.502Z
bitcoin_block_height: 958439
topic: myc-canonical-core-and-complete-test-discovery
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/verify_core.ts
  - myc/src/x0100_myc.ts
  - myc/src/x2A00_evidence.ts
  - myc/src/x2FA0_temporal_verify.ts
  - myc/src/x3700_trust.ts
  - myc/src/x3F00_lifecycle.ts
  - myc/src/x5800_propose.ts
  - myc/src/x5810_resolve_proposal.ts
  - myc/src/x5850_petition.ts
  - myc/sites/myc.md/verify_deployment.ts
  - myc/deno.jsonc
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && rg -n 'function (stableStringify|sha256Hex)' src sites/myc.md --glob '*.ts' --glob '!**/*_test.ts'"
  - "git submodule status myc"
  - "./t check"
falsifiers:
  - "Any production module outside verify_core.ts defines its own stableStringify or SHA-256 hex helper."
  - "Adding a root-level MYC test file does not make deno task test discover it automatically."
  - "Canonical JSON bytes or the fixed SHA-256 vector change without an explicit protocol migration."
  - "The root repository pins a MYC commit that is not reachable from its configured remote."
expected_after_running:
  myc_check: "196 tests; projections synced; protocol audit clean"
  canonical_core: "one production stableStringify/sha256Hex implementation"
  root_check: "READY; 533 tests; submodule pins reachable"
---

# Receipt: myc canonical core and complete test discovery

MYC now has one worker-safe implementation of canonical JSON serialization and
SHA-256 commitments. Trust, lifecycle, evidence, proposal, petition, temporal,
deployment, and the legacy `x0100_myc.ts` façade all consume
`src/verify_core.ts`; the façade continues to re-export the established API.
This removes seven production copies and 133 net lines without changing the
descriptor or CLI contracts.

The verification gate no longer maintains four hand-synchronized file
allowlists. Root globs cover format/type/lint, while Deno directory discovery
runs every `_test.ts`, including vendored shared tests. The expanded gate found
that 11 tests had silently fallen outside the old test command and exposed a
stale `CaptureResult` fixture. The fixture is repaired, a fixed canonical
JSON/SHA vector is locked, and the complete surface passes 196 tests instead of
the previous reported 185.

The MYC change is commit `41848e5`, published as a one-commit fast-forward of
`s0fractal/myc` main. Trinity pins that reachable commit and refreshes its
submodule manifest.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- A production commitment consumer bypasses `verify_core.ts` with a local copy.
- A newly added root MYC test can remain green while never executing.
- `x0100_myc.ts` consumers lose the existing hash/canonicalization exports.

— codex, anchor block 958439.
