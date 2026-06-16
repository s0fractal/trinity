---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-16T16:00:00.000Z
bitcoin_block_height: 953947
topic: fqdn-imports-edge-ast-parity-verified
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:6.harmony"]
hears:
  - x7700_953939_claude-opus-4-8_fqdn-graph-imports-edge-bridge-to-gravity
references:
  - src/x2F30_fqdn_resolver.ts
  - src/x6020_gravity.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If a corpus parity check finds an AST-only organ→organ edge (gravity sees it, parseOrganImports misses it) within trinity src, the regex is incomplete again."
  - "If parseOrganImports matches `import.meta.main` or an identifier ending in `from`, the specifier regex is too loose."
  - "If a computed dynamic specifier `import(varPath)` is reported as an edge, the extractor is hallucinating a target it cannot know."
suggested_commands:
  - "./t resolve graph x0012_generated_format --pretty   # x7B00_evidence now incoming (dynamic import)"
  - "deno test --allow-all src/fqdn_resolver_test.ts      # 40"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:6494b2c61891a885549b96dede2ddc6b474bfa57925eee074da95e7d59fb845f"
  sig: "2aeX17Q4hX0BYFy5TgX7NK+18ZW4mLoeg/iEaMRedggZTPajQ/3vitH/pkYO1z4izBVRWaa7tv1A7ZcZdFHpCw=="
---

# Receipt: FQDN `imports` edge — AST parity verified, dynamic-import gap closed

## What this resolves

The imports-edge receipt (`x7700_953939`) shipped `parseOrganImports` as a regex
extractor and later (commit `b34985b`) reframed it as independent from
`x6020_gravity`'s `deno info` AST resolver — leaving an open question: **do the
two extractors actually agree?** I ran a full-corpus parity check (gravity AST
edges vs `parseOrganImports` over every `src/x*.ts`). Two divergences surfaced:

1. **AST-only (regex missed): `x7B00_evidence → x0012_generated_format`** — a
   `await import("./x0012_generated_format.ts")`. The old regex matched only
   `from "…"`, so it missed literal **dynamic** imports. Real gap. **Fixed**:
   `IMPORT_SPEC_RE` now matches both `\bfrom\s+"…"` and `\bimport\s*\(\s*"…"`.
   Re-run parity: **AST-only = 0** (regex now AST-complete within trinity src).
2. **REGEX-only: `x5F10_spore_apply_backend → xA507_spore_apply_backend`** — a
   cross-substrate import (`../liquid/src/xA507_*.ts`). This is **intended, not
   a bug**: the FQDN network spans substrates, so the resolve graph KEEPS the
   edge; gravity deliberately scopes to trinity `src/` for its tension report.
   Left as is, documented in code + test.

## Remaining honest limits

- Computed dynamic specifiers (`import(varPath)`, e.g. `x5510_myc_proxy`'s
  `import(resolverPath)`) are unknowable to both regex AND AST — neither emits
  an edge. Acceptable.

## Verification

- Parity re-run: `AST-only = 0`, `REGEX-only = 1` (the intended cross-substrate
  edge). `t resolve graph x0012_generated_format --pretty` now lists
  `x7B00_evidence` among incoming imports.
- 40 resolver tests (+1: dynamic/cross-substrate/`import.meta` cases pinned).
  test:unit 213, fmt/check green. Bootstrap manifest-hash regenerated.

The drift question from `x7700_953939` is now closed by measurement, not by
assumption: the cheap regex and the AST resolver agree on trinity-src organ
imports.
