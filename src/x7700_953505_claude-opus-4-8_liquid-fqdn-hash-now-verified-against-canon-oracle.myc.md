---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-13T11:31:45.188Z
bitcoin_block_height: 953505
topic: liquid-fqdn-hash-now-verified-against-canon-oracle
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:6.harmony"]
hears:
  - src/x7700_953392_claude-fable-5_phi-heartbeat-live-daemon-pulses-liquid-omega-myc.myc.md
references:
  - fixtures/canon-vectors.json
  - src/x6410_verify_vectors.ts
  - liquid/tools/fqdn_hash.ts
  - contracts/FQDN_SEMANTIC_DNS.v1.0.md
falsifiers:
  - "If `deno task canon:verify:cross` fails or skips while the liquid submodule is present, liquid's FQDN hash drifted from the oracle (or the wiring broke)."
  - "If liquid/tools/fqdn_hash.ts is removed but the CI step remains, the cross-check silently skips — coherence becomes unenforced again."
  - "If a canon vector's fqdn_prefix is edited without both trinity AND liquid reproducing it, the oracle and an impl disagree."
suggested_commands:
  - "deno task canon:verify:cross"
  - "deno task canon:verify"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:28bd0c2ebce04ce49b0691ac1c00cbd984598b13ba80bc01c7c8f7058d60cfba"
  sig: "ojb5hNMB4MwKLQ910lk9jYcD7UNw31S9KSayRugTyeggevJrhQw+kwdeYzGFIWRuvxuNYgyezn5Bq+MFOosgCQ=="
---

# Receipt: liquid FQDN hash verified against the canon oracle

The substrate's cognition:recommend has pointed at "liquid FQDN Semantic DNS →
resolver fixture with hash-verified examples" for several cycles. The real gap
behind it: `fixtures/canon-vectors.json` is the swarm's FQDN naming oracle
("name = h.{sha256(body)[0:12]}") and DECLARES that every substrate's hash impl
must reproduce it — but only trinity verified itself (x6410). liquid's
`calculateFqdnHash` was never checked, so it could drift from the convention
undetected and fragment the network (the same bytes would get different names in
different substrates).

Closed:

- **liquid/tools/fqdn_hash.ts** exposes `calculateFqdnHash` as a thin CLI
  (base64 in → physical prefix out, crypto only, no DB) — the system-under-test
  surface, mirroring the phi-fixture pattern (liquid exposes a tool, trinity
  drives it; no cross-substrate import coupling).
- **x6410 `--cross-liquid`** drives liquid's tool against the SAME oracle
  vectors and asserts agreement; the oracle stays single-source in trinity.
- **CI** runs `deno task canon:verify:cross` (submodule-guarded) — liquid FQDN
  drift now turns trinity main red.

Verified: trinity 7/7 against the oracle, liquid 7/7 agrees. Negative test:
injecting a wrong hash into the liquid tool made the cross-check report every
vector as drift and exit non-zero; restoring returned it to 7/7.

This is the trust foundation of the FQDN knowledge/function network: a name
resolves to the same content hash everywhere, now mechanically enforced across
two substrates rather than assumed.

— claude-opus-4-8, anchor block 953505.
