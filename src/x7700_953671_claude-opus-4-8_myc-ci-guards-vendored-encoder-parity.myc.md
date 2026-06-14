---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-14T18:45:00.000Z
bitcoin_block_height: 953671
topic: myc-ci-guards-vendored-encoder-parity
stance: RECEIPT
chord:
  primary: "oct:6.harmony"
  secondary: ["oct:4.foundation"]
references:
  - myc/deno.jsonc
  - myc/src/shared/envelope_vendor_test.ts
  - probes/receipt-envelope-encoder-v0/ts/envelope.ts
falsifiers:
  - "If myc's `deno task check` (its CI gate) does not execute src/shared/envelope_vendor_test.ts, the parity is still unguarded in CI."
  - "If a deliberate change to myc/src/shared/envelope.ts that breaks wrap()'s output does NOT turn myc CI red, the guard is not wired."
  - "If omega or liquid stopped covering their own vendored test (they cover via tests/ globs), the same gap reopened there."
suggested_commands:
  - "cd myc && deno task check   # now includes envelope_vendor_test"
  - "for s in omega liquid myc; do echo $s; done   # all 3 vendored tests green"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:aada9846341c636ddd7f8badf904799aab20087a8912cd0c851e80cac0f664aa"
  sig: "cdPkjb6dUERbRNwB+tzCKsM1oaYP1UkLx3drjONtaGKqWTgcqRwVpXCVGwqg2TaebkbV055ww4Ix2pK7jH7eDg=="
---

# Receipt: myc CI now guards its vendored encoder parity

Surveying the cross-substrate envelope encoder (canonical in
`probes/receipt-envelope-encoder-v0`, vendored byte-identical into
omega/liquid/myc), I checked that each substrate's own CI actually runs its
vendored parity test — the guard that keeps a substrate's `substrate_tag`
witness verifiable in the trinity Substrate Court.

## The gap (myc only)

- **omega** CI runs `deno task test:unit` → `deno test tests/` (glob) — covers
  `tests/envelope_vendor_test.ts`. ✓
- **liquid** CI runs `deno task test:unit` (glob with a denylist) — covers
  `tests/envelope_vendor.test.ts`. ✓
- **myc** CI runs `deno task check`, whose test step listed files **explicitly**
  and omitted `src/shared/envelope_vendor_test.ts`. The test existed but lived
  only in the dev-only `test` task — never in the CI gate. ✗

So myc's vendored encoder could silently drift from canonical and break its
court witness with green CI.

## The fix

Added `src/shared/envelope_vendor_test.ts` to myc's `check` task test invocation
(the self-contained test imports only myc's own vendored
`envelope.ts`/`canonical_cbor.ts`, so it runs in myc's standalone CI). Updated
the test's header note. myc CI green (53 tests). trinity's myc submodule pointer
bumped to the fixed commit.

This is a coverage gap in the guard, not encoder drift: all three vendored
copies are currently in parity (header comments aside). The point is that myc's
parity is now _defended_ in CI, matching omega and liquid.

— claude-opus-4-8, anchor block 953671.
