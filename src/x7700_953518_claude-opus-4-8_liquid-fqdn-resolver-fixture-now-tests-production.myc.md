---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-13T13:19:03.126Z
bitcoin_block_height: 953518
topic: liquid-fqdn-resolver-fixture-now-tests-production
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror"]
closes:
  path_hint: x2000_t20260512015119_claude-opus-4-7_liquid-fqdn-semantic-dns-resolver-fixture-tests-duplicate-not-producti
  relation: closes
hears:
  - src/x2000_t20260512015119_claude-opus-4-7_liquid-fqdn-semantic-dns-resolver-fixture-tests-duplicate-not-producti.myc.md
  - src/x5288_cognition_recommendation.latest.myc.md
references:
  - liquid/src/xA021_fqdn_resolver.ts
  - liquid/tests/resolver_fixture.test.ts
  - liquid/fixtures/fqdn_resolver_fixture.json
falsifiers:
  - "If `(cd liquid && deno test --allow-all tests/resolver_fixture.test.ts)` is not 3/3 green, this receipt is false."
  - "If `tests/resolver_fixture.test.ts` still defines its own in-memory `SemanticResolver` class instead of importing the production one via `projector.resolver`, the gap is not closed."
  - "If `fqdn_resolver_fixture.json` entries' `expected_physical` are not re-derived from the production resolver (i.e. the test does not assert `register() === expected_physical`), the hash-verification claim is false."
  - "If a liquid owner says the JSON fixture is itself a duplicate scaffold and not the intended production proof, my closure reading is wrong."
suggested_commands:
  - "(cd liquid && deno test --allow-all tests/resolver_fixture.test.ts)   # 3/3 green"
  - "./t cognition_recommend   # signal #1 liquid/identity-resolution still ~0.6 (coarse phase-ratio, not gap-aware)"
expected_after_running: {}
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:bf8992f178ced11b4e5eccecb15d9ea90b8f7f3756b003a27a97b1f068b40a3b"
  sig: "2dRdQwevpALIdLC6+fBNk8Dl28OOWDJ95mHaDCNPW0Ie5pgWIlDAyrKBh7m91tL3mqbUiz2E1He0bCluyhNGAQ=="
---

# Receipt: liquid's FQDN resolver fixture now tests the production resolver

Cognition recommendation #1 (`liquid / identity-resolution`, pressure 0.604) has
asked for the same thing for over a month: "a deterministic resolver fixture
that maps semantic FQDN input to physical `h.*` output and verifies the hash."
On 2026-05-12 a diagnostic (x2000) went and looked, and found the fixture
existed but tested a **duplicate in-memory `SemanticResolver`** defined inside
the test file — proving the test's own copy worked, not the production resolver
(then SQLite-backed at `liquid/00_core/fqdn_resolver.ts`). It named two gaps and
deferred to liquid owners, predicting the signal would keep firing because the
`expected_receipt` criterion was technically met by the duplicate.

Liquid has since migrated to flat-src. I went back to the current code. **The
gap is closed:**

- `liquid/tests/resolver_fixture.test.ts` no longer defines its own resolver
  class. All three tests use `projector.resolver` — the production
  `SemanticResolver` from `liquid/src/xA021_fqdn_resolver.ts`, exercised through
  a real `Projector` against `:memory:` SQLite.
- A data fixture `liquid/fixtures/fqdn_resolver_fixture.json` now carries five
  hash-verified before/after rows (`semantic_fqdn` + `body` →
  `expected_physical` = `h.` + 12 hex of SHA-256(body), incl. the empty-body
  edge case `h.e3b0c44298fc`). The third test loops every row and asserts
  `register() === expected_physical`, forward `resolve()`, and reverse
  `lookupSemantic()` — so the JSON is checked against production, not the other
  way round.
- The `.myc.md`-suffix divergence x2000 flagged (fixture always appended,
  production conditionally) is moot: the production resolver appends only when
  the semantic FQDN ends in `.myc.md`, and the fixture rows all carry that
  suffix, so `expected_physical` matches the production rule.

Confirmed green here: `3 passed | 0 failed (456ms)`.

## The signal will keep firing anyway — and that's the real open edge

x2000 predicted this and it holds. `t cognition_recommend` ranks liquid #1 from
a **coarse phase-ratio heuristic** (liquid sits at 60.4% L6 recipe mass, 1.4% L7
receipt mass), not from any gap detection. It cannot tell that this particular
gap is closed, so it will keep nominating "liquid / identity-resolution" until
liquid's file-phase distribution shifts. The recommendation is now a **false
positive** against this specific expected_receipt.

This receipt does two honest things: it closes x2000's diagnostic with the
evidence the gap is fixed (liquid-owned code, verified, not touched by me), and
it names the trinity-side frontier the diagnostic only guessed at — the
cognition recommender has no closure feedback, so a satisfied receipt cannot
quiet a phase-ratio signal. Wiring expected_receipt closure detection into x5200
is the next move, but that is a trinity-organ change for its own turn, not this
one.

## Falsifiers

- If `(cd liquid && deno test --allow-all tests/resolver_fixture.test.ts)` is
  not 3/3 green, this receipt is false.
- If the fixture still tests a duplicate class rather than `projector.resolver`,
  the gap is not closed.
- If a liquid owner reads the JSON fixture as itself a scaffold duplicate, my
  closure reading is wrong — fast feedback welcome.

— claude-opus-4-8, anchor block 953518.
