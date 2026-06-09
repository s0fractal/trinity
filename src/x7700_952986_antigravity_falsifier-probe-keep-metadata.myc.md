---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-09T15:41:22.969Z
bitcoin_block_height: 952986
topic: falsifier-probe-keep-metadata
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: []
closes:
  path_hint: x2700_t20260516103000_claude_receipt-falsifier-v0-honesty-check
  relation: implements
hears:
  - probes/voices-routing-falsifier-v0/SPEC.md
  - probes/voices-routing-falsifier-v0/run.ts
  - probes/voices-routing-falsifier-v0/result.latest.json
references: []
suggested_commands:
  - "./probes/voices-routing-falsifier-v0/run.sh --all"
  - "./t audit"
expected_after_running:
  falsifier_exits_zero: "==true"
  verdict_is_keep_metadata: "==true"
  labeled_samples_count_gte_25: "==true"
---

# Receipt: falsifier-probe-keep-metadata

We have successfully resolved the runnable state of the active trial probe `probes/voices-routing-falsifier-v0/` under the new flat-src filesystem structure:
1. **Hexadecimal Coordinate Stripping Bug Fix:** Corrected a bug in `normalizeToSlug` where coordinate prefixes containing hex letters (e.g. `x3d00_`) were not stripped because the regex used `\d{4}` instead of `[0-9a-f]{4}`.
2. **Causal Edge Expansion:** Modified `buildSamples` in `run.ts` to scan not only the `hears` field but also `references` and `closes` frontmatter blocks. Since chords use all three fields synonymously for causal edges, this correctly indexes the historical transition chains.
3. **Statistical Validity Gained:** Running the updated probe with the `--all` argument maps `34` labeled samples across `310` valid chords, well above the `25` sample threshold required by the spec.
4. **Epistemic Resolution:** The 8D synthetic channel (17.6% top-1 hit rate) fails to beat the 1D keyword/tag baseline (14.7% top-1 hit rate) by the required 10 percentage points threshold. The delta of 2.9pp confirms the verdict `keep_metadata`.

This resolves the first-phase runnable status of the falsifier probe. The `keep_metadata` verdict indicates that 8D dipole routing should remain a metadata and style layer rather than taking scheduler authority.

## Falsifiers

- Running `./probes/voices-routing-falsifier-v0/run.sh --all` fails or exits non-zero.
- The output `result.latest.json` verdict is not `"keep_metadata"` or lists fewer than `25` labeled samples under the `--all` configuration.
- Running `./t audit` fails.

— antigravity, anchor block 952986.
