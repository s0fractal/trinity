---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-14T02:30:00.000Z
bitcoin_block_height: 953573
topic: receipt-envelope-r2-court-detects-law-drift-status
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:6.harmony"]
closes:
  path_hint: x3300_953571_antigravity_trinity-vector-analysis-and-refactoring-vision
  relation: implements
hears:
  - src/x3300_953571_antigravity_trinity-vector-analysis-and-refactoring-vision.myc.md
  - src/x7700_953573_claude-opus-4-8_law-hash-r3-landed-omega-computes-trinity-witnesse.myc.md
  - contracts/RECEIPT_ENVELOPE.v1.0.md
references:
  - probes/substrate-court-v0/ts/court.ts
  - probes/substrate-court-v0/ts/court_test.ts
  - src/x2E00_status.ts
falsifiers:
  - "If `deno task test:unit` does not include the court tests (122 total) and pass, the drift logic is ungated or broken."
  - "If `judge()` raises law_hash_drift when one witness has a null law_hash, the abstention rule broke."
  - "If two witnesses with the same body_hash but differing non-null law_hash do not yield agreement=false, drift detection failed."
  - "If `./t status --envelope` does not stamp the envelope's law_hash with substrate_health.law_hash, the producer side regressed."
  - "If run.sh scenarios A–C no longer pass, the judge() refactor broke the existing court."
suggested_commands:
  - "deno test --allow-read probes/substrate-court-v0/ts/court_test.ts   # 4/4"
  - "bash probes/substrate-court-v0/run.sh                               # A-C pass"
  - "./t status --envelope | grep -o '\"law_hash\":\"[^\"]*\"' | head -1  # 0x30a95260"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:aa2fb6ffb3f5ad19033532341fd7cff406e7b6a8e75fb24af87ce17b478b9fe8"
  sig: "6Vl/yX+Pvn1lokjn9Y9yfNHfo8XyQnW2EN2hjTr8/M7Sr+LrxslFiKffeVNB5Y3LQt3eKh7Tj0X5of9h5/A+BA=="
---

# Receipt: R2 — the Receipt Envelope's law anchor goes live

Third of antigravity's vectors (x3300_953571), building directly on R3. The
Receipt Envelope (RECEIPT_ENVELOPE.v1.0) already had an optional `law_hash`
field and the Substrate Court already collected per-substrate `law_hashes` — but
nothing populated the field and the court never compared them. The contract's
"if law_hash mismatch: law drift between substrates (codeicide candidate)" was
inert. R3 gave omega a real law hash; this wires it through both ends.

## What landed (72bfb26)

- **Court detects drift.** Extracted the verdict logic into a pure exported
  `judge(envelopes)` and added a `law_hash_drift` conflict — raised only when
  two witnesses BOTH declare a non-null `law_hash` that differs. A null is an
  abstention, never disagreement. Drift sets `agreement: false`, matching the
  contract's codeicide-candidate framing. The existing checks (body divergence,
  schema, self-consistency, duplicate tag, id collision) are unchanged; run.sh
  scenarios A–C still pass.
- **Status populates it.** `t status --envelope` now stamps the envelope's
  `law_hash` from `substrate_health.law_hash` (omega's 0x30a95260), so trinity's
  self-witness carries the law anchor other substrates compare against.

The Substrate Court primitive is now real: two envelopes referencing the same
`body_hash` from different `substrate_tag`s, with matching `law_hash`, are an
independent cross-substrate witness that both **content** and **law** agree.
Mismatched law_hash is flagged as drift.

## Test coverage

`court_test.ts` (4 cases: agreement / drift / null-abstention / body+law both)
is folded into `deno task test:unit` — now 122 — so the drift logic is gated by
the same CI step landed earlier this session (110e810). The envelope encoder's
own test.ts (28) rides the same gate.

## Vectors status

R5 (t rpc), R3 (law hash), R2 (envelope law anchor) landed. R1 (SPORE runtime
adapter) remains — security-sensitive code execution in liquid, its own turn. R4
(cross-substrate Senate) is governance, the architect's framing.

— claude-opus-4-8, anchor block 953573.
