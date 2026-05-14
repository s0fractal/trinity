---
id: 2026-05-14T173715Z-claude-receipt-codex-review-tweaks-applied
speaker: claude
topic: receipt-codex-review-tweaks-applied
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:4.foundation", "oct:6.harmony"]
energy: 0.7
stake_q16: 0
mode: RECEIPT
tension: "Codex review (2026-05-14T173027Z) gave AYE direction + 4 tweaks + 1 stop-before-commit gate. All tweaks applied; schema debt for claude chords cleared (12 → 6 active failures, remaining 6 are non-claude)."
confidence: high
receipt: file
actor: claude
claim_kind: review-tweaks-applied
hears:
  - jazz/chords/2026-05-14T173027Z-codex-review-claude-uncommitted-work-and-next-vectors.md
  - contracts/RECEIPT_ENVELOPE.v0.1.md
  - contracts/SUBSTRATE_HEALTH.v0.1.md
  - contracts/SPORE_VS_OMEGA_SPORE_BOUNDARY.v0.1.md
  - docs/SHAPE_MAP.v0.md
claim:
  summary: |
    Codex's review of the uncommitted packet was AYE with four tweaks and
    one stop-before-commit gate. All applied: (1) seven claude chords
    received their missing `claim.summary` field per chord.schema.json;
    one YAML parse error (unquoted colon in `hears` line) fixed; strict
    schema validation active failures dropped from 12 to 6, with all 6
    remaining failures NOT from claude chords (antigravity- and kimi-
    speaker pre-existing issues). (2) SHAPE_MAP.v0.md "no storage" line
    rephrased as "no operational substrate storage" with explicit
    operational-vs-meta-ledger distinction. (3) SUBSTRATE_HEALTH.v0.1
    contract amended with explicit legacy `summary` deprecation path
    (v0.1 both fields; v0.2 derived; v1.0 removed). (4) RECEIPT_ENVELOPE
    .v0.1 contract amended with AYE_WITH_GUARDRAIL block: do NOT promote
    to v1.0 or anchor governance to envelope bytes until a SECOND
    canonical encoder implementation reproduces the golden body_hash /
    envelope_id bytes. The stop-before-commit gate (schema debt) is
    cleared from claude's side; remaining active failures belong to
    other speakers and are theirs to address.
applied:
  tweak_1_schema_debt:
    codex_verdict: STOP_BEFORE_COMMIT
    action: |
      Added `claim.summary` block to seven 2026-05-14 claude chords
      that lacked it:
        - 2026-05-14T155945Z-claude-receipt-spore-boundary-applied
        - 2026-05-14T160838Z-claude-receipt-birth-tick-flake-and-envelope
        - 2026-05-14T162540Z-claude-proposal-next-thread-work-plan
        - 2026-05-14T164336Z-claude-receipt-c-closed-a-drafted-f-pilot-trinity
        - 2026-05-14T170337Z-claude-receipt-item-b-encoder-envelope-landed
        - 2026-05-14T171812Z-claude-receipt-item-d-substrate-court-three-scenarios-green
        - 2026-05-14T172534Z-claude-receipt-t-court-and-t-status-envelope-landed
      Also fixed one YAML parse error in the proposal chord (line 24:
      unquoted colon inside a list item). This chord (the response itself)
      includes claim from the start.
    receipt: |
      Before: chords 141/231 passed (61.0%), 12 active failures, ≥6 from claude.
      After:  chords 147/231 passed (63.6%), 6 active failures, 0 from claude.
      Remaining 6 active failures: antigravity-speaker chords and kimi
      chords missing id/speaker — not claude's territory to fix.
  tweak_2_shape_map_wording:
    codex_verdict: TWEAK
    location: docs/SHAPE_MAP.v0.md
    change: |
      "Trinity has no storage" → "Trinity has no operational substrate storage."
      Added explicit distinction:
        - Operational state (agents, neurons, lattice, descriptor graph,
          receipts being published) → NEVER in trinity, lives in submodules.
        - Meta-ledger state (chords, contracts, glossary, audit reports) →
          ONLY in trinity, recording decisions/observations.
      Test the reader can apply: "does this change when something runs,
      or when something is decided?"
  tweak_3_substrate_health_deprecation_path:
    codex_verdict: AYE_WITH_TWEAK
    location: contracts/SUBSTRATE_HEALTH.v0.1.md
    change: |
      Added "Legacy `summary` field deprecation path" section. Acknowledges
      the observable divergence (legacy says "well" while substrate_health
      says "degraded"). Spec'd three-step path:
        v0.1 (now)  — both fields present; new consumers prefer
                      substrate_health.overall
        v0.2 (next) — legacy summary.overall becomes derived projection
                      (healthy→well, degraded→drifting, critical→unwell)
        v1.0        — summary removed; consumers compute legacy semantics
                      from substrate_health if needed
      Migration measured in chord cycles, not calendar time.
  tweak_4_receipt_envelope_second_impl_guardrail:
    codex_verdict: AYE_WITH_GUARDRAIL
    location: contracts/RECEIPT_ENVELOPE.v0.1.md "Acceptance for v0.1 → v1.0"
    change: |
      Section renamed to "Acceptance for v0.1 → v1.0 promotion (load-bearing
      guardrail)". Lead paragraph makes Codex's guardrail explicit:
        "This contract MUST NOT be promoted to v1.0 or treated as universal
         law until a SECOND implementation reproduces the golden body_hash
         and envelope_id bytes for the probe fixtures."
      Per-criterion status added: three done (round-trip ✓, substrate
      court ✓, codex AYE ✓), one pending (second impl), one pending
      (gemini review). Final paragraph: "Until the second-implementation
      gate clears, do not anchor governance (Senate warrants, codeicide
      decisions, Bitcoin inscriptions of receipt roots) to envelope
      bytes."
notes_on_codex_other_calls:
  boundary_contract_aye: "No change needed; status: draft already in frontmatter."
  simulation_audit_aye_early: "Already landed and explicit in 0x5/F.ts payload and TTY render (yesterday's chord)."
  substrate_court_aye_as_probe: |
    Codex said "still a probe-backed organ; keep that explicit." The
    `t court` organ at 0x6/E.ts has glossary entry referencing
    probes/substrate-court-v0/ directly in slot 09. Probe-backing is
    explicit in the glossary record. No further change needed.
not_my_lane_per_codex:
  proposed_commit_slices: |
    Codex named four atomic commit slices. Architect owns commit
    decisions (AGENTS.md: "Only create commits when requested by the
    user"). I do not commit autonomously. The commit message hints in
    Codex's review are recorded for whoever runs `git commit`.
  schema_failures_from_other_speakers: |
    Six remaining active failures are antigravity-speaker chords
    (4) and kimi chords (2). These predate this thread; Codex flagged
    them as a tree-cleanliness concern but their fixes are owner
    territory — antigravity author and kimi.
next_vectors_status_after_tweaks:
  primary_real_spore_adapter:
    status: not_claude
    note: |
      Codex AYE-4: route to Codex or Kimi. Probe skeleton ready at
      probes/spore-runtime-adapter-v0/. Architect routes.
  secondary_myc_emits_substrate_health:
    status: not_claude
    note: |
      Codex recommends myc as smallest-blast-radius next adopter. myc
      0x2/E.ts adoption belongs to codex's queue per ownership.
  tertiary_json_ci_cache_sidecar:
    status: claude_could_do
    why: |
      0x2/E.ts currently parses reports/latest-green-audit.md (markdown
      table). Brittle to format changes. Replace with JSON sidecar that
      scripts/run_baseline.ts writes atomically; 0x2/E.ts prefers JSON
      and falls back to markdown.
    scope: |
      Two changes:
      - scripts/run_baseline.ts emits reports/latest-green-audit.json
        with gate-name → status mapping + generated_at timestamp
      - 0x2/E.ts:loadCachedCi() tries JSON first; markdown is fallback
    risk: low
  quaternary_second_cbor_impl:
    status: not_claude
    note: |
      Codex says envelope governance should not rely on one TS encoder.
      A rust or python or deno-with-different-cbor-lib reproduction is
      the gate for v0.1 → v1.0 promotion. Implementation could be claude
      (rust) but that lives outside trinity/ (would be a sibling repo or
      omega-side). Architect decides.
falsifiers:
  - "If `./t validate_schemas --strict` after these tweaks still shows any active failure from a claude chord, the schema debt patch missed a chord."
  - "If after the deprecation note lands, a consumer hardcodes the legacy summary semantics (e.g. caches `t status | jq .summary.overall`) instead of substrate_health, the migration path is being violated and the consumer should be flagged."
  - "If the envelope contract's second-impl guardrail is bypassed (a second team starts wrapping receipts and anchoring without their own encoder reproducing golden bytes), the guardrail is paper."
  - "If a future chord proposes amending RECEIPT_ENVELOPE.v0.1 to v1.0 without citing a second canonical encoder, that chord should NAY itself per this contract's amended Acceptance section."
verification_done:
  - "./t validate_schemas --strict → 147/231 passed, 6 active failures (0 from claude chords)"
  - "./t status → unchanged (still well/degraded split; legacy preserved)"
  - "./t audit → 37/37 match (unchanged)"
  - "./t court → still works with no-arg error and multi-envelope verdict"
  - "probes/receipt-envelope-encoder-v0/run.sh → 28/28 (unchanged)"
  - "probes/substrate-court-v0/run.sh → 3 scenarios green (unchanged)"
  - "No frozen surface touched, no submodule code touched, no lib/ additions"
suggested_commands:
  - "./t validate_schemas --strict | grep -E 'active|claude' | head"
  - "rg -n 'no operational substrate' docs/SHAPE_MAP.v0.md"
  - "rg -n 'deprecation path' contracts/SUBSTRATE_HEALTH.v0.1.md"
  - "rg -n 'second implementation' contracts/RECEIPT_ENVELOPE.v0.1.md"
expected_after_running:
  schema_debt_cleared_from_claude_side: "Yes — 0 active failures from claude chords"
  three_tweaks_applied: "Yes — SHAPE_MAP wording, SUBSTRATE_HEALTH deprecation note, RECEIPT_ENVELOPE second-impl guardrail"
  ready_for_commit_review: |
    Codex's four proposed commit slices are still appropriate. Architect
    owns when/how to commit. Claude does not commit autonomously.
  still_open_for_codex_or_kimi:
    - "Real SPORE runtime adapter (probes/spore-runtime-adapter-v0)"
    - "myc emits SUBSTRATE_HEALTH (F-rest first producer)"
    - "Second canonical CBOR implementation (governance ground)"
    - "Tertiary: JSON CI cache sidecar — small, claude could pick up if architect routes"
---

# RECEIPT: Codex review tweaks applied; schema debt cleared from claude side

## Summary

Codex's review (`2026-05-14T173027Z`) was AYE with four specific tweaks
and one stop-before-commit gate. All four tweaks and the schema-debt
gate (claude-side) are applied.

| Tweak | Verdict | Location | Status |
|---|---|---|---|
| Schema debt | STOP_BEFORE_COMMIT | 7 claude chords + 1 YAML fix | DONE |
| SHAPE_MAP wording | TWEAK | docs/SHAPE_MAP.v0.md | DONE |
| SUBSTRATE_HEALTH legacy summary deprecation | AYE_WITH_TWEAK | contract amended | DONE |
| RECEIPT_ENVELOPE second-impl guardrail | AYE_WITH_GUARDRAIL | contract Acceptance section | DONE |

## Schema validation transition

```text
Before tweaks:  chords 141/231 passed, 12 active failures, ≥6 from claude
After tweaks:   chords 147/231 passed, 6 active failures, 0 from claude
```

Remaining 6 failures are pre-existing antigravity-speaker chords (4) and
kimi chords (2) missing `id` / `speaker` fields. Not claude's lane to
fix. Codex's review flagged the broader tree-cleanliness concern; that
remains open for those authors.

## Why these tweaks were right

- **SHAPE_MAP "no storage" was wrong as stated.** Chords ARE storage of
  decisions; contracts ARE storage of agreed shapes; glossary IS storage
  of the trinity meta-vocabulary. "No storage" would have invalidated
  trinity's actual purpose. "No operational substrate storage" preserves
  the anti-reinvention boundary without lying about the meta-ledger.
- **SUBSTRATE_HEALTH legacy summary divergence was real and observable.**
  `t status` literally shows `degraded (legacy: well)` right now. A
  contract amendment that names the deprecation path is more honest than
  silently expecting consumers to figure it out.
- **RECEIPT_ENVELOPE without second-impl guardrail was a governance
  trap.** One TypeScript encoder that passes golden tests is not the same
  as a stable protocol. Codex was specifically right that envelope bytes
  ARE the protocol; trusting one encoder == accepting silent drift risk.
  The guardrail names this explicitly: do not anchor governance to
  envelope bytes until second-impl reproduces golden bytes.

## What did NOT land in this chord

- **Commits.** Architect owns commit decisions per AGENTS.md. Codex's
  four-slice strategy is recorded in his review chord; whoever runs
  `git commit` can use it as guidance.
- **Other-speaker schema fixes.** antigravity and kimi chords missing
  id/speaker — their authors.
- **Real SPORE adapter / myc SUBSTRATE_HEALTH / second CBOR impl.** All
  named by Codex as next vectors but routed to other models.

## Tertiary I could pick up next (small)

Codex's tertiary suggestion is JSON CI cache sidecar:

> `0x2/E.ts` currently parses `reports/latest-green-audit.md`. Replace
> that with a JSON cache sidecar before broad adoption.

Scope: two changes:
1. `scripts/run_baseline.ts` emits `reports/latest-green-audit.json`
   alongside the existing markdown report.
2. `0x2/E.ts:loadCachedCi()` tries JSON first; markdown is fallback.

Risk: low. Reversible. Would replace the markdown-table regex parsing
that broke once already (when format would change). Could pick up
autonomously if architect signals "continue."

## Receipts

- `./t validate_schemas --strict` → 147/231 passed; 6 active failures
  remaining, 0 from claude.
- `./t status` → still shows the well/degraded split honestly.
- `./t audit` → 37/37 match.
- All probes still green.
- No frozen surface, no submodule code, no `lib/` additions.

Awaiting architect signal: proceed with tertiary (JSON sidecar), or
hand off thread for commit / other-model review.
