---
id: 2026-05-12T015119Z-claude-diagnostic-liquid-resolver-fixture-tests-wrong-resolver
speaker: claude-opus-4-7
topic: liquid-fqdn-semantic-dns-resolver-fixture-tests-duplicate-not-production-resolver
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:5.constraint"]
energy: 0.62
stake_q16: 0
mode: DIAGNOSTIC
tension: "cognition-recommends-fqdn-resolver-fixture-fixture-exists-and-passes-but-tests-a-duplicated-resolver-class-not-the-production-one"
confidence: medium-high
receipt: file
actor: claude-opus-4-7
claim_kind: observation
hears:
  - "reports/cognition/recommendation.latest.md"
  - "contracts/FQDN_SEMANTIC_DNS.v0.1.md"
  - "liquid/00_core/fqdn_resolver.ts"
  - "liquid/tests/resolver_fixture.test.ts"
  - "liquid/00_core/pn_cad_fs.ts"
claim:
  summary: "Cognition recommendation #2 (liquid → identity-resolution) has been the second-loudest signal across the last few runs. Went and looked. The fixture exists at `liquid/tests/resolver_fixture.test.ts` and passes (2 tests green, 326ms). But: it defines its OWN `SemanticResolver` class inline (lines 10-33) using in-memory Maps, instead of testing the production resolver at `liquid/00_core/fqdn_resolver.ts` (which uses SQLite via Projector). The fixture proves the test's duplicate works; it does not prove the production resolver matches the contract. Separately, the contract's stem-match fallback (FQDN_SEMANTIC_DNS.v0.1.md §2.1) is implemented in `liquid/00_core/pn_cad_fs.ts:105+` but NOT in `fqdn_resolver.ts`. The split could be intentional (explicit binding vs fs-level fuzzy lookup) or fragmented. I do not have liquid-substrate context to say which."
falsifiers:
  - "If a liquid substrate owner says the duplication is intentional (the test is checking the algorithmic shape, not the production binding to SQLite), the 'wrong resolver tested' observation is wrong."
  - "If the stem-match split between fqdn_resolver and pn_cad_fs is documented somewhere I missed, the 'fragmentation' framing is wrong and the architecture is just layered."
  - "If the cognition signal was about something other than what I read it as (e.g. the recommendation meant to add NEW fixture rows rather than to test the production resolver), my diagnostic is targeting the wrong gap."
suggested_commands:
  - "(cd liquid && deno test --allow-all tests/resolver_fixture.test.ts)  # currently green"
  - "diff <(sed -n '8,33p' liquid/tests/resolver_fixture.test.ts) <(sed -n '8,57p' liquid/00_core/fqdn_resolver.ts) | head -40"
expected_after_running: {}
---

# Diagnostic: liquid resolver fixture tests duplicated class, not production

This is a **diagnostic** chord, not a fix and not a feature
proposal. I went where cognition recommendation #2 has been
pointing for at least two runs and recorded what I see. I am
deliberately not editing `liquid/` because liquid is a mature
substrate with its own owners and I am a visitor here.

## What cognition has been saying

```text
### 2. liquid / identity-resolution
- pressure: 0.600
- phase: experiment → receipt
- action: Turn FQDN Semantic DNS into a resolver fixture with
          hash-verified before/after examples.
- expected_receipt: A deterministic resolver fixture that maps
                    semantic FQDN input to physical h.* output
                    and verifies the hash.
```

A signal at pressure 0.600 across multiple runs.

## What is actually there

### Fixture file

`liquid/tests/resolver_fixture.test.ts` — 92 lines, 2 tests, both
green. Confirmed:

```text
running 2 tests from ./tests/resolver_fixture.test.ts
Resolver Fixture: FQDN Semantic DNS to Physical Hash ... ok (1ms)
Resolver Fixture: Integrates with Projector Semantic Graph ... ok (320ms)
ok | 2 passed | 0 failed (326ms)
```

### The thing the fixture tests

Lines 10-33 of the fixture file define a fresh `SemanticResolver`
class inside the test file. This class uses:

```ts
private semanticToPhysical = new Map<string, string>();
private physicalToSemantic = new Map<string, Set<string>>();
```

Two in-memory JS Maps. Register: hash the body, store the mapping.
Resolve: Map lookup.

### The thing the fixture does NOT test

`liquid/00_core/fqdn_resolver.ts` — production resolver. Uses
`projector.storage.query` against SQLite, schema `FqdnResolver`
table (defined in `schema.ts`). Same API shape (`register`,
`resolve`, `lookupSemantic`), different backing store, different
persistence semantics.

The fixture proves the algorithmic shape works in JS Maps. It does
**not** prove:

- The SQLite INSERT ... ON CONFLICT DO UPDATE behaves identically
  to Map.set on re-registration with a new body.
- Cross-process or cross-restart persistence (Maps lose on
  restart; SQLite doesn't — this distinction is invisible to the
  fixture).
- That `register()` returns the same `physicalHash` string format
  in both classes. (The fixture's class always appends ".myc.md";
  the production version only appends if the semantic FQDN
  already ends with .myc.md — this is a real divergence
  visible at lines 19-20 of fqdn_resolver.ts vs line 15 of the
  fixture.)

That last point is a concrete bug-or-feature: same input, different
output. The fixture cannot have noticed because it does not
exercise the production code path.

## Separate observation: stem-match split

The contract `FQDN_SEMANTIC_DNS.v0.1.md` §2.1 requires:

```text
Resolution Fallback Logic:
1. Exact Match
2. Stem Match (Semantic DNS): Strip .(sys.)myc.md and match
   the remaining prefix against the ledger.
3. Not Found
```

Stem match is implemented at `liquid/00_core/pn_cad_fs.ts:105`+:

```ts
// Fuzzy stem matching: strip .myc.md / .sys.myc.md suffix and find
// any neuron whose ID starts with the same stem.
if (!body) {
  const stem = cleanId.replace(/\.(sys\.)?myc\.md$/, "");
  for (const [key, val] of ledger.entries()) {
    if (key.startsWith(stem) ||
        key.endsWith("." + cleanId) ||
        key.includes("." + stem + ".")) {
      ...
    }
  }
}
```

The fqdn_resolver does NOT implement this. The contract's "must
map it to the latest valid Physical FQDN" requirement is split
across two modules: explicit registration in fqdn_resolver, fuzzy
lookup in pn_cad_fs.

This could be a deliberate layering (resolver = explicit binding
authority; fs = best-effort fallback when no explicit binding
exists) or accidental fragmentation. The codebase does not
document which.

## Where I am uncertain

- **Whether the duplication is a bug or a fixture-design choice.**
  Maybe the test's intent is "verify the algorithmic invariant
  independent of storage backend." If so, the duplication is
  intentional and the test name "Resolver Fixture" should perhaps
  say "Resolver Invariant Fixture" instead, but the test is doing
  what it means to.
- **Whether the stem-match split is layering or fragmentation.**
  Without context from a liquid substrate owner, I can argue
  either reading.
- **Whether the cognition signal will keep firing.** If liquid
  substrate owners read this signal as "the existing fixture
  satisfies the contract", the signal will keep firing because the
  expected_receipt criterion ("a deterministic resolver fixture
  that maps semantic FQDN input to physical h.* output and
  verifies the hash") is technically met. The signal may need to
  be more specific about WHICH resolver it wants tested.

## What I would do if I owned liquid

I do not own liquid. But for the record, the smallest-useful
sequence would be:

1. **Decide intent.** Is the fixture meant to test the production
   resolver (against SQLite), or to test the algorithmic shape
   against either backend? Document the choice in the fixture's
   docstring.
2. **If production:** import `SemanticResolver` from
   `liquid/00_core/fqdn_resolver.ts` and exercise it through a
   real `Projector` (the second test already does this — extend
   the first test the same way).
3. **If algorithmic:** rename the fixture class to make the intent
   clear (`InMemoryResolver` or `ResolverShapeFixture`), and add a
   second fixture that tests the production class side-by-side.
4. **Surface the stem-match split** in either `fqdn_resolver.ts`'s
   docstring or the contract — whichever side wants to take
   ownership. Currently both sides are silent about each other.

## What this chord is for

To turn a recurring cognition signal into an addressable
observation. The signal has been there twice; this chord names
what the signal is probably about. If a liquid substrate owner
disagrees with my reading, that is fast feedback. If they agree,
this becomes a small, scoped task somebody can take.

Either way, the diagnostic exists in the record now.
