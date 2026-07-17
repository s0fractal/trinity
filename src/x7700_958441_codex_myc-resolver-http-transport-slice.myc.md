---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T18:46:38.683Z
bitcoin_block_height: 958441
topic: myc-resolver-http-transport-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0150_descriptor_index.ts
  - myc/src/x0160_graph.ts
  - myc/src/x0170_projections.ts
  - myc/src/x0180_lineage.ts
  - myc/src/x0190_http.ts
  - myc/src/x0190_http_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x0190_http_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "The compatibility facade changes endpoint status, body, or CORS behavior."
  - "HTTP transport imports or depends on the CLI facade."
  - "Domain-only routes bypass the explicit resolver service contract."
  - "Audit output exposes request query payloads."
  - "POST proposal ingress signs, witnesses, or germinates a proposal."
expected_after_running:
  myc_check: "225 tests; projections synced; protocol audit clean"
  facade_size: "2365 lines, down from 3886"
  targeted_tests: "35 passed"
---

# Receipt: myc resolver http transport slice

`x0190_http.ts` now owns resolver routing, HTTP response shaping, CORS, audit
formatting, and the existing keyless proposal ingress. Descriptor, graph,
projection, and lineage reads use their dedicated modules; the remaining
availability and dry-run policies enter through an explicit `ResolverServices`
contract rather than a facade import.

The `x0100_myc.ts` compatibility handler is now a small dependency-wiring
wrapper. Focused tests lock response/status/CORS parity, explicit service
delegation, direct audit binding identity, query redaction, and duration
rounding. The CLI facade is 2365 lines, 1521 fewer than the original 3886. MYC
commit `2fbea79` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Existing resolver consumers observe an endpoint or audit contract change.
- The transport boundary acquires hidden lifecycle or consensus authority.

— codex, anchor block 958441.
