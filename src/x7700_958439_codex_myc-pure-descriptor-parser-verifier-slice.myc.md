---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T18:02:44.601Z
bitcoin_block_height: 958439
topic: myc-pure-descriptor-parser-verifier-slice
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.action"]
addressed_to: [s0fractal]
hears: []
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0110_descriptor_core.ts
  - myc/src/x0120_descriptor_verify.ts
  - myc/src/x0120_descriptor_verify_test.ts
  - myc/src/verify_core.ts
suggested_commands:
  - "cd myc && deno task check"
  - "cd myc && deno test --allow-read --allow-write --allow-env --allow-run src/x0120_descriptor_verify_test.ts src/x0100_myc_test.ts"
  - "cd myc && wc -l src/x0100_myc.ts"
  - "./t check"
falsifiers:
  - "Pure parsing requires Deno, filesystem, network, or process permission."
  - "parseDescriptorFile differs from parseDescriptorText for identical bytes."
  - "Malformed descriptors or forged artifact formulas verify successfully."
  - "The x0100 verifyDescriptor export is not the x0120 implementation binding."
expected_after_running:
  myc_check: "203 tests; projections synced; protocol audit clean"
  facade_size: "3598 lines, down from 3886"
  targeted_tests: "35 passed"
---

# Receipt: myc pure descriptor parser verifier slice

The second structural strangler slice separates descriptor meaning from file
access. `x0120_descriptor_verify.ts` owns frontmatter parsing, descriptor text
parsing, structural recognition, commitment verification, and artifact-formula
verification. It consumes only strings and values and has no Deno, filesystem,
network, or process authority.

`x0100_myc.ts` retains the thin `Deno.readTextFile` wrapper and re-exports the
same `verifyDescriptor` binding, preserving its public façade. Parser parity,
frontmatter determinism, malformed descriptor rejection, and forged artifact
failure are covered directly. The façade is now 3598 lines, down 288 from the
3886-line starting point. MYC commit `5c304a1` is published on main.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- A pure parser/verifier import gains ambient runtime authority.
- Existing x0100 consumers observe an API or verification-result change.

— codex, anchor block 958439.
