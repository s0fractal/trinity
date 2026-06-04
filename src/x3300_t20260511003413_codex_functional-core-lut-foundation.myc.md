---
id: 2026-05-11T003413Z-codex-functional-core-lut-foundation
speaker: codex
topic: functional-core-lut-foundation
mode: SYNTHESIS
phase: 7
energy: 0.9
claim:
  summary: "Recipe-spores need a functional core: pure, hash-addressed mutators and early frozen LUT/basis artifacts make ledger transitions reproducible, proofable, cacheable, and testable across machines."
hears:
  - x3300_t20260511000847_codex_recipe-as-spore-ledger-native-mutators
  - free:user-2026-05-11-lambda-calculus-pure-functions-fit
  - free:user-2026-05-11-early-fixed-luts-stabilize-hashes-and-tests
falsifiers:
  - "If mutators depend on hidden ambient state, recipe replay cannot be deterministic."
  - "If LUTs are regenerated differently across machines, early hash foundations are unstable."
  - "If effects are not captured as explicit hashed artifacts, pure replay cannot reproduce the transition."
---

# Functional Core And LUT Foundation

Recipe-as-spore needs a deeper execution discipline:

```text
pure functions + hash-addressed values + explicit effects + frozen-ish basis LUTs
```

This is not just "nice functional programming style". It is the causality
physics that makes portable spores possible.

## Core Shape

A recipe-spore is function application:

```text
output = f(inputs, params, context)
```

If `f` is pure:

```text
same inputs + same params + same context = same output
```

Then the substrate gets:

- deterministic replay;
- hash-addressed composition;
- portable germination;
- memoization and caching;
- Omega proofability;
- easy parity tests;
- stable cross-machine behavior;
- lazy recursive evaluation.

In substrate terms:

```text
lambda / function = mutator-neuron
application       = recipe
value             = hash-addressed artifact
reduction         = germination
normal form       = stable OUT projection
```

## Functional Rules

Suggested early laws:

```text
1. Pure mutators first.
2. Effects must be explicit inputs/outputs.
3. No hidden context.
4. Nothing un-hashed participates in a transition.
5. Every function version is addressable.
6. Composition is the default.
7. Side effects become receipts, not invisible consequences.
```

The key invariant:

```text
Nothing un-hashed participates in a state transition.
```

No hidden glue. No ambient state. No implicit current directory. No clock unless
the clock observation is itself an input artifact.

## Effects

Liquid will still need effects:

- call model;
- read network;
- observe filesystem;
- ask human;
- inspect current ledger;
- fetch from P2P;
- write public projection.

The rule is not "no effects". The rule is:

```text
effects are recorded before they enter deterministic reduction.
```

Example:

```text
effect_request_hash
effect_response_hash
receipt_hash
```

After the effect response is captured, downstream mutation can be pure:

```text
next_state = reduce(prev_state, effect_response)
```

This keeps LLM nondeterminism from poisoning deterministic replay. The model's
output becomes a hashed artifact, not hidden execution state.

## LUTs As Foundation Stones

Lookup tables should be introduced early and treated as basis artifacts:

- sine/cosine LUT;
- phase quantization LUT;
- Q10 conversion constants;
- canonical byte normalization tables;
- tokenizer/segmenter tables if needed;
- sector/axis mapping tables;
- hash domain separators.

If a LUT is generated late or differently on different machines, every
downstream hash and test can drift.

Early fixed LUTs give:

- stable hashes;
- stable golden traces;
- stable proof inputs;
- easier cross-language parity;
- smoother testing;
- fewer accidental semantic migrations.

Omega already demonstrates this with integer trigonometry and fixed sine LUTs.
Liquid should treat equivalent basis tables the same way.

## Frozen-ish, Not Dead

Early LUTs should be boring and stable, but not metaphysically immutable.

Use versioned basis artifacts:

```text
lut.sine-q10.v0
lut.phase-sector.v0
lut.canonical-bytes.v0
hash.sha256.domain-v0
```

Later versions can exist:

```text
lut.sine-q10.v1
```

But recipes must declare which basis they use. Old receipts stay valid because
they name old LUTs.

## Testing Consequence

Testing becomes smoother because tests reference stable basis hashes:

```text
given:
  mutator = hash:concat.v0
  lut     = hash:canonical-bytes.v0
  input   = hash:...
expect:
  output  = hash:...
```

No test should depend on an unversioned generated helper.

Golden traces become:

```text
trace = reduce(recipe, basis_set)
```

Where `basis_set` is explicit and hash-addressed.

## Relation To Omega, Liquid, MYC

```text
Omega  = proves deterministic reductions over declared basis artifacts
Liquid = hosts living mutators and captures effects as artifacts
MYC    = publishes recipe-spores and basis references
Trinity = tracks which intents/contracts depend on which basis versions
```

This lets the ecosystem split cleanly:

```text
deterministic core   → pure, proofable, hash-stable
interpretive surface → effectful, semantic, captured by receipts
```

## Minimal Foundation Set

Candidate first foundation artifacts:

```text
hash.sha256.v0
canonical.bytes.v0
canonical.json.v0
concat.bytes.v0
split.bytes.v0
q10.energy.v0
lut.sine-q10.v0
phase.octal-sector.v0
recipe.apply.v0
receipt.compute.v0
```

Each should have:

- hash;
- source/body;
- tests;
- golden vectors;
- version;
- domain separator;
- public projection.

## Why This Should Happen Early

If the substrate waits too long, many recipes will be born against implicit
basis functions. Later formalization would require expensive migration or
duplicate interpretation.

If introduced early:

```text
hashes stabilize
golden traces stabilize
spores become portable sooner
Omega proofs get clean inputs
Liquid can remain wild above a deterministic floor
MYC can publish small causal recipes instead of large artifacts
```

Early pure mutators and LUTs are the seed crystal for the rest of the
architecture.

## Strategic Formula

```text
Pure mutators are the grammar.
LUTs are the alphabet.
Recipes are sentences.
Receipts are proofs that a sentence was spoken.
```
