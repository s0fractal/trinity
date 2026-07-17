---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-07-17T15:51:18.535Z
bitcoin_block_height: 958432
topic: agentseal-warrant-bridge-fail-closed
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:5.action", "oct:6.harmony", "oct:4.foundation"]
addressed_to: [s0fractal]
hears: []
references:
  - packages/agentseal/seal_to_warrant.ts
  - packages/agentseal/seal_to_warrant_test.ts
  - packages/agentseal/mod.ts
  - packages/agentseal/deno.json
  - packages/agentseal/README.md
  - packages/agentseal/examples/seal_to_warrant.ts
  - packages/agentseal/examples/warrant_cli.ts
  - packages/agentseal/examples/warrant_cli_test.ts
  - packages/forge-receipt.json
  - .github/workflows/publish-agentseal.yml
suggested_commands:
  - "cd packages/agentseal && deno check mod.ts seal_to_warrant_test.ts examples/seal_to_warrant.ts"
  - "cd packages/agentseal && deno test -A"
  - "cd packages/agentseal && deno publish --dry-run --allow-dirty"
  - "WARRANT_BIN=$(command -v warrant) deno run -A packages/agentseal/examples/seal_to_warrant.ts"
  - "deno task test:unit"
  - "./t audit"
  - "./t check"
falsifiers:
  - "An allowed receipt with a tampered digest or body can still produce a Warrant accept record."
  - "A receipt signed outside the caller-supplied authorized roster, or below its threshold, can still produce accept."
  - "The bridge silently reuses AgentSeal's logical/block-height `at` field as Warrant Unix seconds."
  - "The Warrant basis blob does not carry the exact sorted witness roster and threshold used for admission."
  - "The package public entrypoint does not export `sealToWarrant`, or the 0.3.0 publish dry-run fails."
  - "A non-zero `warrant verify` exit is printed but does not fail the bridge example."
expected_after_running:
  agentseal_check: "green"
  agentseal_tests: "20 passed, 0 failed"
  warrant_interop: "Warrant 0.4.0 files and verifies one record with 0 errors"
  publish_dry_run: "@s0fractal/agentseal@0.3.0 dry-run succeeds"
  root_unit_tests: "529 passed, 0 failed"
  audit: "126 organs; 111 match; 0 mismatch; 0 deferred"
  full_check: "green"
---

# Receipt: agentseal → Warrant bridge is fail-closed

The bridge added in `75c5a5d` converted a typed AgentSeal receipt into Warrant
JSON, but it treated serialization as admission. A caller could supply a
tampered receipt or a self-selected signer and still obtain an `accept` record.
It also copied AgentSeal's logical `at` value (the example used a Bitcoin block
height) into Warrant's Unix-seconds `ts`, omitted the witness policy needed to
replay quorum from the evidence pack, and was absent from the package's public
entrypoint. Because the package version remained `0.2.0`, the release workflow
would also skip publishing the new bridge.

This repair makes the boundary fail closed:

- allowed seals are verified against an explicit authorized Ed25519 roster and
  threshold before any Warrant fields are emitted;
- refused seals must have no authorizing co-signature and still pass receipt
  digest/body-integrity verification;
- Warrant time is an explicit safe Unix-seconds value, independent of the seal's
  logical/block-height clock;
- the canonical basis blob commits to the sorted witness roster and threshold,
  so the evidence pack contains the policy needed to replay admission;
- malformed receipt JSON and signature hex are rejected rather than coerced;
- the public entrypoint exports the bridge and package/forge metadata now name
  `0.3.0`.

The tests include both positive offline replay from the embedded basis policy
and negative cases for unauthorized witnesses, tampered bodies, malformed hex,
and clock-domain confusion. The local package passes type-check, all 20 tests,
and a JSR publish dry-run; the root unit suite passes all 529 tests.

The bridge example now treats the Warrant verifier's exit status as
load-bearing. Previously it explicitly ignored a non-zero status for `verify`,
so a broken evidence pack could still make the example look successful. A
regression test fixes that contract, and the AgentSeal publish workflow now
installs pinned `warrant-verify==0.4.0` and files, signs, and verifies a real
pack before publishing. The same end-to-end flow was run locally against the
published PyPI artifact: one record, zero verification errors.

## Falsifiers

- Any command in `suggested_commands` fails on this tree.
- An allowed receipt bypasses digest or authorized-quorum verification.
- A block height can become Warrant `ts` without an explicit Unix timestamp.
- The evidence basis cannot reconstruct the exact witness policy used by the
  bridge.

## Honest boundary

The dry-run proves package shape and registry validation, not that `0.3.0` is
already published. Warrant interoperability is pinned to version `0.4.0` so a
future Warrant contract change must be adopted explicitly rather than silently
changing this release gate. The end-to-end example uses an ephemeral Warrant
filing key without a keyring, so base verification honestly reports
`binding unverified` while returning zero integrity errors; this gate does not
claim settlement-grade Warrant actor identity.

— codex, anchor block 958432.
