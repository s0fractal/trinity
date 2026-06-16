---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-16T17:30:00.000Z
bitcoin_block_height: 953950
topic: hears-link-validation-diagnostic
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:5.action", "oct:3.observation"]
hears:
  - x3300_953947_antigravity_super-deep-ecosystem-analysis-and-digital-life-ref
references:
  - src/x5400_validate_schemas.ts
  - src/validate_schemas_test.ts
falsifiers:
  - "If checkHearsRef flags a `hears:` entry that contains whitespace (architect utterance / prompt quote / command), it is mis-treating free-form context as a citation."
  - "If a `free:` or `ref:` prefixed entry, or a path under an unknown root (0x0/…), is reported as dangling, the classifier is wrong."
  - "If hears-link failures change the strict EXIT code (they must stay diagnostic — only schema validity gates), the non-gating contract is broken."
  - "If a coordinate stem that resolves via `t resolve` is reported unresolvable, the resolver-backed check disagrees with the resolver."
suggested_commands:
  - "deno run -A src/x5400_validate_schemas.ts          # see the 'hears-links' diagnostic line"
  - "deno test --allow-all src/validate_schemas_test.ts # 3"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:b6d00c83838ba3384cf1d4335b5a019d7e20d267da6a470d65b750204ce0f8bf"
  sig: "6w8wvTiyT3gFKPB6NHPBYiLL4ivxccgJ5ye3qiJTDb4/taqHw3Z+jiq/3DQQZU3BxS01SGW7w8LSev9VhjnCBw=="
---

# Receipt: `hears:` link validation — T4 from antigravity's manifest, scoped to reality

## What this implements

antigravity's super-deep analysis (`x3300_953947`) proposed **T4 — `hears:`
validation**: "check presence of files in `hears:`". I implemented it in
`x5400_validate_schemas` (its suggested home, `5/4`, `yes-readonly`), reusing
the existing soft/strict + grandfather machinery and the FQDN resolver.

## The empirical correction (why the naive version is wrong)

A naive existence check is **not** what `hears:` needs. Measuring against the
real corpus: `hears:` is a free-form "what this chord responds to" log — it
holds architect utterances (`architect: рухайся…`), prompt/command quotes,
prose, and `free:`/`ref:` notes **alongside** real citations. A blind file-check
floods ~600 false positives.

So `checkHearsRef` validates ONLY the two unambiguous citation forms and skips
everything else:

- **coordinate stem** `xNNNN_…` (no slash) → resolve via the FQDN resolver;
- **path under a known live root** (src/contracts/probes/papers/jazz/omega/
  liquid/myc) → file existence;
- **skipped as free-form/legacy**: anything with whitespace, a
  `free:`/`ref:`/URL prefix, a bare non-coordinate word, or a path under an
  unknown root (`0x0/…`).

## What it found (real signal, 14 active)

Scoped this way, the diagnostic surfaces **real citation rot**, not noise:

- many chords `hear` `contracts/RECEIPT_ENVELOPE.v0.1.md` — versioned up to
  **v1.0**, leaving the old path dangling;
- restructured `liquid/00_core/*.ts` paths;
- one missing chord stem.

These are **historical rot** (a citation valid when authored breaks when its
target is later renamed), not authoring errors — so hears-link validation is a
**read-only diagnostic, non-gating**: only schema validity gates strict mode.
Old signed chords are left as-is (historical records); the rot is surfaced, not
retro-edited.

## Verification

- `checkHearsRef` classification pinned by 3 tests (free-form skip / known-root
  path existence / coordinate-stem resolution). test:unit 216, fmt/check green.
- Diagnostic line: `… ; 14 dangling hears (diagnostic, non-gating)`.

## Note on the rest of antigravity's manifest

Implemented T4 only. T2 (`t doctor`) is a strong follow-on; T1 (`audit --fix`)
is moot now (mismatch=0); V1 (unified docs) conflicts with prefer-generation; V2
(`t fork`) touches the liquid ledger (owner territory); §1 (FEP⊕Kuramoto) is
aspirational. Full assessment in the session dialog.
