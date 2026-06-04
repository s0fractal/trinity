---
id: 2026-05-13T230651Z-codex-repo-rudiments-and-strengthening-vectors
speaker: codex
topic: repo-rudiments-and-strengthening-vectors
chord:
  primary: "oct:6.audit"
  secondary: ["oct:4.foundation", "oct:3.composition", "oct:5.action"]
energy: 0.86
stake_q16: 0
mode: ANALYSIS
tension: "architect asks which repository parts are rudiments and which vectors should be strengthened"
confidence: high
receipt: file
actor: codex
claim_kind: review
hears:
  - AGENTS.md
  - 0x0/00.ndjson
  - 0x0/01.ts
  - 0x3/C.ts
  - 0x5/C.ts
  - 0x5/D.ts
  - 0xF/A.ts
  - reports/latest-green-audit.md
  - x3a30_t20260514044000_kimi-k1-6_ten-primitives-and-the-composer-gap
claim:
  summary: |
    Trinity's live center is now the glossary-driven `t` runtime, not the old
    meta-repo scripts. The strongest cleanup targets are: restore a real `t`
    wrapper; migrate root tools and recipes into ledger-record / organ form;
    demote or remove placeholder executables that inflate health; decide the
    fate of `lib/` as bootstrap infrastructure; make green audit green by
    fixing submodule format/audit surfaces; then strengthen dataflow/Intent
    Vectors and cross-substrate status bridges instead of adding more isolated
    primitives.
falsifiers:
  - "If a legacy file is still the only source for operational metadata not projected by `t`, deletion is premature; migrate first."
  - "If subprocess recursion is too slow or brittle for composition, `lib/` remains infrastructure rather than rudiment."
  - "If placeholder fractal nodes acquire real recursive verification logic, they stop being cleanup targets."
suggested_commands:
  - "deno run -A 0x0/01.ts status"
  - "deno run -A 0x0/01.ts capabilities --json"
  - "deno task audit:green"
expected_after_running:
  trinity_status: "well"
  audit_green: "currently fails on myc formatting + liquid strict audit"
---

# Repository Rudiments and Strengthening Vectors

The center of the repository has moved. `README.md` and `TRINITY.md` still
describe Trinity as a meta-repository with orchestration scripts. That remains
true historically, but the living center is now:

```text
handle -> 0x0/00.ndjson -> hex position -> executable organ -> receipt
```

## Rudiments

1. `t` wrapper absence. AGENTS says `t status`, but the actual entrypoint is
   `deno run -A 0x0/01.ts status`. This is a small but high-friction mismatch.

2. `capabilities/trinity.capabilities.v0.1.legacy.json`. It is no longer
   source-of-truth. Its remaining live payload is recipes plus old operational
   fields (`reads`, `writes`, `side_effects`, `composes_with`) not yet encoded
   in headers or ledger records.

3. `0x3/C.ts` recipes projection. Useful as a bridge, but it still reads the
   legacy capabilities JSON. The right destination is record-graph / sequence
   records, not a standalone recipe ontology.

4. `tools/` root scripts. `validate_schemas`, `ontology_coverage`,
   `cognition_*`, `publish_*`, `intake_ingest`, and `grind` are borrowed organs
   outside the hex topology. They should become `t` words or explicit host-tool
   descriptors before deletion.

5. Placeholder organs: `0x5/D.ts`, `0xF/A.ts`, `0x5/C/A.ts`, `0x5/C/A/3.ts`.
   They are honest about being placeholders, but health counts them as existing
   organs. Either implement their claimed behavior or compost.

6. `0x5/C.ts` cross-verify. It is explicitly legacy and overlapped by
   `t all 5/C`. Keep only until `all` has parity for deep/filter modes.

7. `lib/`. It is useful infrastructure but topologically suspicious. Treat as
   bootstrap until either subprocess recursion/Intent Vectors replace it, or
   performance falsifies the purity goal.

8. Root `README.md` / `TRINITY.md`. They lag behind AGENTS and `t` reality. They
   should say "meta-layer + living runtime", not only "submodule control plane".

## Strengthen

1. Dataflow / Intent Vectors. Composition primitives currently sequence work,
   but do not pass result payloads forward. This is the main gap between "shell
   scripting with receipts" and a substrate language.

2. Cross-substrate status. `t status` is healthy but local to Trinity. The next
   strong bridge is recursive status that asks liquid/omega/myc through their
   own adapters instead of re-implementing their internals.

3. Host tools as borrowed organs. Add `t tools` / host descriptors so Deno, Git,
   Cargo, jq, gh, wasmtime, etc. are visible dependencies with degraded receipts
   when missing.

4. Receipt/schema tightening. `type:07` schemas are still legacy-shaped and
   permissive. Strengthen without over-canonicalizing: required fields for
   actual receipts first.

5. Green audit discipline. Current green audit fails on MYC formatting and
   liquid strict audit while omega passes. These are concrete cleanup surfaces,
   not architectural mysteries.

6. Topological honesty. Do not add more placeholders merely to prove nesting.
   New hex nodes should either do real work, expose a falsifier, or remain a
   chord/proposal.
