# blake3-fqdn-v0

Probe of filename content_check_prefix convention. File's positions [2:5]
(three hex chars after `x<archetype>`) must match `hash(content)[:3]`.
Tunable via `mining_nonce` field in YAML frontmatter.

## Trigger

- Architect 2026-05-18: "FQDN — це ж в нас вимальовується краще ніж те що
  було в ліквід (точніше поєднати крутість) — по суті — все починається з
  4+ 16ричного кодування (потім можна буде підібрати через blake3 і
  фейкове поле, щоб перші 3 цифри співпадали з хешем контенту)."
- Claude proposal chord
  `2026-05-18T195420Z-claude-fqdn-content-addressed-naming.md`
- Codex cowitness `x2600_949982_codex_coordinate-naming-cowitness.md`:
  HARD_TWEAK — probe-only first, not default law. Hash prefix is
  **alarm, not address**. Rename "content_address" → "content_check_prefix".

## Convention demonstrated

Filename form:
```
x<archetype-digit><check-prefix-3-hex>_<handle>.myc.md
```

Example: `xA000_handle.myc.md`
- `A` = apex archetype (author-chosen semantic position)
- `000` = content_check_prefix slot. Author claims this value in
  filename; content must hash to this prefix or file is in drift.

YAML frontmatter MUST contain `mining_nonce: <integer>`. Mining adjusts
this integer until `SHA-256(content)[:3]` matches the claimed prefix.

```yaml
---
mining_nonce: 9232
handles: [unmined_test, тест-незмайнаний]
archetype: A
intent: ...
---
```

## What this probe demonstrates

1. **Drift detection.** `verify.ts` reads filename's claimed prefix and
   compares to `SHA-256(content)[:3]`. Reports drift with exit code 1.
2. **Mining tunes prefix to match.** `mine.ts` iterates `mining_nonce`
   from 0 upward until hash lands on target. Average ~4096 attempts for
   3-hex (12-bit) target.
3. **Verification after mining.** Re-running verify on mined file
   reports ✓ match.
4. **Edit creates drift.** Any content change recomputes hash; filename
   no longer matches. Either re-mine the nonce OR rename the file to
   the new content's hash prefix. Friction is feature — content drift
   becomes visible at filesystem level.

## What this probe does NOT demonstrate

- BLAKE3 specifically. Probe uses SHA-256 (matching trinity's existing
  canonical hash `src/x4010_hash.ts`). Algorithm choice is secondary
  per Codex tweak — the pattern is "filename position 2:5 matches
  hash[:3]". BLAKE3 can drop in via one function swap if architect
  decides it matters.
- Auto-rename on edit. Workflow today: edit → verify reports drift →
  manually re-mine OR rename. A `t mine --watch` style tool could
  auto-run, but that's deferred until pattern resonates.
- Apply to `.ts` organs. Codex tweak: opt-in for `.myc.md` neurons and
  sealed artifacts first; not for ordinary TS organs where every edit
  becoming a rename is too much friction.
- 4-digit content prefix (collision-resistant for >4K files per
  archetype). Probe uses 3-digit for parity with chord proposal;
  extension to 4 is one parameter change in hash.ts.
- Liquid PN-CAD compatibility. If liquid's binary ledger references
  neurons by FQDN like `system.macrophage.sys.myc.md`, those references
  break under coordinate FQDN. Out of scope for this probe; would need
  LegacyPathResolver per Kimi's 2026-05-18 concern.

## Workflow

```sh
cd probes/blake3-fqdn-v0

# 1. Inspect drift
deno task --config=probe.jsonc verify sample/xA000_unmined_test.myc.md
# → ✗ drift: filename claims 000, content hashes to B9D

# 2. Mine to match
deno task --config=probe.jsonc mine sample/xA000_unmined_test.myc.md
# → mined nonce: 9232 (attempts: 9233, final prefix: 000)

# 3. Re-verify
deno task --config=probe.jsonc verify sample/xA000_unmined_test.myc.md
# → ✓ ok
```

## Tweaks landed in this probe

- **From Codex:** filename prefix is **content_check_prefix**, not
  "content_address". This is a drift alarm, not a primary identity
  primitive. Trinity's `x4010_hash.ts` (12-hex SHA-256 prefix) remains
  the identity address; this is a complementary check at filename level.
- **From Codex:** opt-in scope. `.myc.md` neurons and sealed artifacts
  first. Ordinary `.ts` organs out of scope until edit-rename loop is
  smooth.
- **Algorithm pragmatism:** SHA-256 for parity with existing trinity
  hash; BLAKE3 swap is one-line change in hash.ts if architect prefers.

## Falsifiers

1. **Mining cost > 1 second average** — friction too high. Mitigation:
   move to faster runtime (Rust binary) or accept 4-hex (16x cost) only
   for sealed artifacts.
2. **Manual rename-after-edit required > once per session** — workflow
   broken. Mitigation: auto-mine on save via git hook or watcher.
3. **3-hex collisions appear in first 100 mined files** — 4096 buckets
   inadequate. Mitigation: jump to 4-hex (65K buckets) without dynamic
   negotiation.
4. **YAML `mining_nonce` field confuses other tools parsing
   frontmatter** — move nonce to hidden HTML comment at end of file.
5. **Authors game prefixes for vanity** (`A123`, `BEEF`, `FACE`) and
   spend disproportionate compute mining — accept as feature OR add
   max-attempts cap in mining tool with warning.

## Next moves (if probe resonates)

1. **Liquid compatibility audit.** Before extending to liquid neurons:
   `strings .liquid/liquid_projection_pn_cad.bin | grep "\.myc\.md"` to
   confirm whether PN-CAD ledger references old FQDN format.
   LegacyPathResolver if yes.
2. **Decision on algorithm.** SHA-256 (existing) vs BLAKE3 (architect
   preferred). If BLAKE3 — single function swap in `hash.ts`.
3. **Decision on nonce placement.** YAML frontmatter (current) vs
   HTML comment (less intrusive). Pick after observing real neurons.
4. **Apply to one real trinity contract** as second-tier test
   (sealed artifact, infrequently edited, low PN-CAD coupling). E.g.,
   one entry in `contracts/`.
5. **Integration with t audit.** New mode `t audit --content-hash`
   checks all `xN<XXX>_*.myc.md` files in substrate for drift.

## Sample state

The single sample neuron `sample/xA000_unmined_test.myc.md` has been
**mined** during probe construction (nonce 9232). To re-demonstrate the
drift→mine workflow, reset `mining_nonce: 9232` back to `mining_nonce: 0`
and re-run the steps above.
