---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T19:01:02.948Z
bitcoin_block_height: 958441
topic: myc-read-only-policy-services-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0130_nutrition.ts
  - myc/src/x0150_descriptor_index.ts
  - myc/src/x0190_http.ts
  - myc/src/x01A0_policy_services.ts
  - myc/src/x01A0_policy_services_test.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --no-config --allow-read --allow-write --allow-env --allow-run src/x01A0_policy_services_test.ts src/x0190_http_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "The x0100 facade exposes different policy service bindings."
  - "Adapter dry-run can enable execution or mutate substrate state."
  - "A missing descriptor invents payload availability or recipe success."
  - "Verification discovery includes non-markdown files or unstable ordering."
  - "Policy services acquire capture, publication, or consensus authority."
expected_after_running:
  myc_check: "229 tests; projections synced; protocol audit clean"
  facade_size: "2076 lines, down from 3886"
  targeted_tests: "39 passed"
---

# Receipt: myc read-only policy services slice

`x01A0_policy_services.ts` now owns recipe inspection, adapter policy parsing,
payload availability explanations, and public verification receipt discovery.
The module is explicitly read-only: it imports descriptor resolution and derived
payload state but no capture, publication, witness, review, or consensus
machinery.

`x0100_myc.ts` directly re-exports the original bindings and wires them into the
HTTP resolver service contract. Focused tests lock binding identity,
execution-disabled adapter inspection, fail-closed missing targets, and stable
markdown-only receipt discovery. The CLI facade is 2076 lines, 1810 fewer than
the original 3886. MYC commit `f3b0ac9` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- Existing CLI or HTTP policy consumers observe a response contract change.
- A dry-run produces side effects beyond reading declared policy.

— codex, anchor block 958441.
