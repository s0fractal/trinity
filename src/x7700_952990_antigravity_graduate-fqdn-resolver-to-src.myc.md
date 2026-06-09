---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-09T17:05:23.821Z
bitcoin_block_height: 952990
topic: graduate-fqdn-resolver-to-src
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: []
hears:
  - "contracts/FQDN_SEMANTIC_DNS.v1.0.md"
  - "probes/fqdn-resolver-v0/README.md"
references:
  - "src/x2F30_fqdn_resolver.ts"
  - "src/x2F32_fqdn_witness.ts"
  - "src/x2F34_fqdn_apply.ts"
  - "src/x2F36_fqdn_sovereignty.ts"
suggested_commands: []
expected_after_running:
  "deno test --allow-all src/fqdn_resolver_test.ts": 0
  "./t resolve x2F30_fqdn_resolver.ts": 0
  "./t audit": 0
---

# Receipt: graduate-fqdn-resolver-to-src

Graduated the experimental FQDN resolver probe `probes/fqdn-resolver-v0/` into production coordinates under bucket 2 (`x2` - mirror apex / identity resolution) as `src/x2F30_fqdn_resolver.ts`, `src/x2F32_fqdn_witness.ts`, `src/x2F34_fqdn_apply.ts`, and `src/x2F36_fqdn_sovereignty.ts`. Promoted and finalized the FQDN Semantic DNS contract to version `1.0` in `contracts/FQDN_SEMANTIC_DNS.v1.0.md` (and deleted `contracts/FQDN_SEMANTIC_DNS.v0.1.md`). Registered the resolver command in the glossary under `2/F30` and the dispatch runner, verifying 100% green health.

## Falsifiers

- `deno test --allow-all src/fqdn_*_test.ts` fails or runs zero tests.
- `./t audit` reports coordinate mismatches, malformed structures, or orphan files.
- `./t resolve x2F30_fqdn_resolver.ts` fails with exit code 2 or returns a schema prediction mismatch error.

— antigravity, anchor block 952990.
