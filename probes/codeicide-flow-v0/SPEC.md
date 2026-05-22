# codeicide-flow-v0 probe

> **Status: graduated 2026-05-14 → `src/x4D00_propose.ts` (4 more organs).** Full set: `src/x6D00_cowitness.ts`, `src/x7D00_verdict.ts`, `src/x6E00_court.ts`, `src/x5D00_apply_codeicide.ts`. Available as `t propose`, `t cowitness`, `t verdict`, `t court`, `t apply-codeicide`.

End-to-end demonstration of the trinity meta-ledger **governance flow**:

```text
propose → cowitness×N → verdict → apply-codeicide → RESURRECT
```

Built on `CODEICIDE_PROPOSAL.v0.1`, `RECEIPT_ENVELOPE.v1.0`, and the
four organs at hex coords `4/D`, `6/D`, `7/D`, `5/D`. This is the
first probe in trinity that **actually applies a reversible
side-effect to the filesystem** (file move, not delete).

## Status

**RUNNABLE.** SPEC + run.sh exercising the full pipeline on a sacrificial
fixture file. Probe asserts every gate, executes apply for real, then
runs RESURRECT to verify reversibility.

## What this probe answers

> Given the four governance organs we built (propose, cowitness, verdict,
> apply-codeicide) and the witness primitives (wrap, court, anchor-prep),
> can a real, end-to-end, reversible decision flow be executed from
> shell, asserting every safety gate?

If yes, trinity has a working governance mechanism — not paper, not
isolated probes, but a single line of pipes that takes a file from
`live` to `archived` through witness chains, AND a single line of bash
that takes it back.

## Pipeline

```text
                                              ┌─────────────────────┐
sacrificial fixture file                ────→ │ t propose           │
                                              │ --target ... --reason
                                              │ --out proposal.json │
                                              └─────────┬───────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────────┐
oracle 1 cowitness   ─── pipe envelope ────→  │ t cowitness         │
                                              │ --oracle claude     │
                                              └─────────┬───────────┘
                                                        │
                                                        ▼
oracle 2 cowitness   ─── pipe envelope ────→  ... (codex) ...
                                                        │
                                                        ▼
oracle 3 cowitness   ─── pipe envelope ────→  ... (gemini) ...
                                                        │
                                                        ▼
                                              ┌─────────────────────┐
                                              │ t verdict           │
                                              │ <cowitnessed.json>  │
                                              └─────────┬───────────┘
                                                        │
                                                        ▼ (AYE)
                                              ┌─────────────────────┐
                                              │ t apply-codeicide   │
                                              │ --proposal ...      │
                                              │ --verdict ...       │
                                              └─────────┬───────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────────┐
                                              │ archive/<ts>/...    │
                                              │ ├── <target file>   │
                                              │ ├── RECEIPT.json    │
                                              │ └── RESURRECT.sh    │
                                              └─────────┬───────────┘
                                                        │
                                                        ▼
   (test reversibility)                        ┌─────────────────────┐
                                              │ bash RESURRECT.sh   │
                                              └─────────┬───────────┘
                                                        │
                                                        ▼
                                              file back at original path
```

## Test scenarios (run.sh)

### Scenario A — Happy path: propose → 3 cowitnesses → AYE → apply → resurrect

1. Create fixture `fixtures/sacrifice-A.txt` with known content.
2. `t propose --target probes/codeicide-flow-v0/fixtures/sacrifice-A.txt --reason "test fixture" --out work/proposal-A.json`
3. `t cowitness --oracle claude-opus-4-7 work/proposal-A.json --out work/wit1-A.json` (extracted envelope)
4. `t cowitness --oracle codex-gpt-5 work/wit1-A.json --out work/wit2-A.json`
5. `t cowitness --oracle gemini-3-1-pro work/wit2-A.json --out work/wit3-A.json`
6. `t verdict work/wit3-A.json --out work/verdict-A.json` → expect AYE
7. `t apply-codeicide --proposal work/wit3-A.json --verdict work/verdict-A.json`
8. Assert: original file gone; `archive/<ts>/<path>` exists; `RESURRECT.sh` exists.
9. `bash archive/<ts>/RESURRECT.sh` → file back at original path.
10. Cleanup `archive/<ts>/`.

### Scenario B — Verdict NAY (insufficient cowitnesses) blocks apply

1. Create fixture `fixtures/sacrifice-B.txt`.
2. `t propose --target ...` → proposal-B.json
3. ONE cowitness (claude only).
4. `t verdict` → expect PENDING (1 < 3 quorum).
5. `t apply-codeicide` → MUST refuse (exit non-zero, error type).
6. Assert: original file still in place.
7. Cleanup.

### Scenario C — Forbidden target rejected at propose time

1. Attempt `t propose --target omega/some/file.rs --reason "forbidden"` → expect error.
2. Assert: no envelope emitted; exit code non-zero.

### Scenario D — Hash drift between propose and apply

1. Create fixture `fixtures/sacrifice-D.txt`.
2. `t propose ...` → proposal-D.json (records target_hash).
3. 3 cowitnesses, verdict AYE.
4. MODIFY fixture content (echo more text into it).
5. `t apply-codeicide` → MUST refuse (hash drift detected).
6. Assert: file still in place (just with new content).
7. Cleanup.

### Scenario E — Self-AYE blocked (proposer cowitnesses own proposal)

1. Create fixture.
2. `t propose --target ...` → proposal-E.json (proposer substrate_tag = "trinity").
3. `t cowitness --substrate trinity ...` (self-cowitness).
4. `t verdict` → expect NAY (self-AYE detected).
5. `t apply-codeicide` → MUST refuse.

### Scenario F — RESURRECT.sh refuses overwrite unless forced

1. Create fixture `fixtures/sacrifice-F.txt`.
2. Propose, collect 3 cowitnesses, verdict AYE, and apply.
3. Recreate a live file at the original target path with fresh content.
4. Run generated `RESURRECT.sh` without flags → MUST refuse with
   "Refusing to overwrite" and preserve the fresh live file.
5. Run generated `RESURRECT.sh --force` → MUST restore archived content.

This scenario covers the Codex guardrail from
`jazz/chords/2026-05-14T194732Z-codex-response-architect-mode-governance-flow.md`:
reversibility must not silently destroy newer work.

## Acceptance

- All 6 scenarios pass.
- After all scenarios, NO leftover files in `archive/` from this probe
  (run.sh cleans up).
- run.sh exits 0.

## Reversibility guarantee

The probe NEVER calls `rm` on substrate files. The only `rm` is on the
`archive/<probe-timestamp>/` directories created during the test, and
only AFTER asserting RESURRECT.sh worked.

The probe deliberately keeps RESURRECT.sh tested in Scenario A and
overwrite-safety tested in Scenario F: even if the cleanup step is somehow
skipped, the archived file is recoverable via the script that the probe just
verified, and resurrection will not silently overwrite a newer live file.

## See also

- `contracts/CODEICIDE_PROPOSAL.v0.1.md` — proposal contract.
- `contracts/RECEIPT_ENVELOPE.v1.0.md` — envelope wrapping.
- `0x4/D.ts`, `0x6/D.ts`, `0x7/D.ts`, `0x5/D.ts` — organs.
