# RFC-0003 / Part 01: Canonical Identity and Encoding

- **Status:** Draft
- **Draft steward:** s0fractal; stewardship is distinct from prose authorship
  and ratification authority (Part 00 §0.1).
- **Text provenance:** predominantly model-generated and model-revised; exact
  source authentication is preserved where available in relays and signed chords
  (Part 07).
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md`
- **Parent:**
  [Part 00 — Architecture and Ratification
  Map](00-architecture-and-ratification-map.md), which holds the theses,
  non-goals, terminology, dependency graph, failure-mode catalogue, and open
  problems this document depends on.
- **Ratifies:** Tranche A (A1–A4), Tranche J (J1–J3)
- **Depends on:** nothing — this is the root of the dependency graph
- **Created:** 2026-08-03 (extracted from the original single-file draft after
  four rounds of external critique; see [Part 07](07-revision-history.md))

> **Section numbers are inherited and stable.** This document keeps the section
> numbers it carried inside RFC-0003. They are not renumbered from 1, because
> ledger chords and prior receipts cite them, and a cross-reference that
> silently changes meaning is the failure this protocol exists to prevent. A
> reference of the form §N.M is resolvable through Part 00's §22 map.

---

### 5.1 Reference identity is content-addressed

Every `Ref` in this document (`DomainRef`, `OntologyRef`, `InvariantRef`,
`EvidenceRef`, `TransformationRef`, `TranslatorRef`) is a **reference to an
immutable object**, not a mutable name. The protocol's audit guarantees depend
on it: a receipt that records "translated under translator T" is worthless if
`T` can be edited afterwards.

References MUST therefore be content-addressed:

1. Every referenced object MUST have a canonical byte encoding. For domain
   points this is the `serialize` method of §6; for descriptors, ontologies,
   translators, and invariant definitions it is the object's canonical
   serialization.
2. The reference MUST be derived from a cryptographic digest of those canonical
   bytes.
3. The federation's existing identity primitive is
   `contracts/CANONICAL_HASH.v0.1.md` (`h.` || first 12 hex of SHA-256). New
   references SHOULD reuse it so that this RFC does not fork the substrate's
   naming. **It is a digest over a text body and performs no structural
   canonicalization** — it never parses what it hashes. A structural
   canonicalizer therefore does not compete with it; it feeds it (§5.1.4).
4. **The 12-hex form is a handle, not a security binding.** Forty-eight bits is
   adequate for human-readable addressing and accidental-collision avoidance,
   and inadequate against an adversary who can grind for a collision. Any
   reference that gates an irreversible boundary, an admission decision, an
   identity amendment, or a trust computation MUST carry the full digest
   alongside the short handle.
5. **Shared reference is a protocol requirement; shared storage is not.** Two
   states under the same domain and ontology MUST resolve to the same reference
   bytes — that is a property of the encoding and this document requires it. It
   does **not** follow that the descriptor is physically stored once: §5.1.0
   lists deduplication as an _opportunity_ content addressing creates, and
   whether a store takes it belongs to the store layer, which rule 7 puts out of
   scope. The protocol guarantee is that a million states in one domain carry
   one reference each rather than one descriptor each; making that cheap on disk
   is a backend's business. A descriptor that is itself large — an ontology, a
   complex invariant set — MAY be composed of content-addressed parts, so that a
   consumer needing one invariant resolves that part rather than the whole
   object. That too is a protocol affordance, not a storage mandate.
6. External content-addressing systems (IPLD/CID, and similar) MAY be used as a
   transport or storage projection. Doing so MUST NOT redefine the canonical
   digest — the CID is then a second encoding of the same identity, and receipts
   MUST record which encoding they used.
7. **The store is out of scope.** Files, git objects, an object store, or an
   IPLD graph are all conforming backends, and this RFC names none of them. The
   properties it depends on — immutability, resolution by digest, structural
   sharing — follow from content addressing itself, not from any one store.
   Mandating a store would re-open the identity decision §5.1 settled, for a
   benefit already obtained.

Because `lineage` is a list of content-addressed transformation references, and
each transformation references its input states, the derivation history of any
state forms a DAG whose **integrity** is verifiable.

#### 5.1.0 What content addressing does and does not give

Content addressing is often credited with more than it delivers, and the
overstatement is the kind that gets designed against rather than noticed. These
properties are distinct and MUST NOT be conflated:

| Property                    | Given by content addressing? | What actually establishes it                                                                       |
| --------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| **Content integrity**       | yes                          | the digest                                                                                         |
| **Stable byte identity**    | yes                          | canonical encoding (§5.1.1)                                                                        |
| **Tamper evidence**         | yes                          | any edit changes the address                                                                       |
| **Deduplication**           | opportunity only             | a store that chooses to share                                                                      |
| **Authorship**              | no                           | signatures over the reference (§19.10)                                                             |
| **Provenance completeness** | **no**                       | attestation that the input set is total                                                            |
| **Provenance truthfulness** | **no**                       | independent re-derivation, witnesses                                                               |
| **Availability**            | **no**                       | a store commitment, and someone to hold it                                                         |
| **Semantic identity**       | **no**                       | the encoding rules; different bytes may mean the same thing and this is deliberate (§5.1.1 rule 5) |

The consequential gaps:

1. **A transformation can omit an input.** Nothing in the digest reveals that a
   fourth evidence blob was consulted and left out of `evidence[]`. The DAG is
   intact and the account is incomplete. Only an attestation that the declared
   input set is exhaustive — or an independent re-derivation reaching the same
   output — establishes completeness, and both are outside the hash.
2. **A reference can be unresolvable.** An address proves what the bytes _were_
   if you find them; it does not produce them. A lineage of addresses nobody
   retains is a chain of names. Availability MUST be a declared commitment where
   receipts depend on it, and §14's verifier questions are unanswerable without
   one.
3. **Equal meaning is not equal bytes.** Two encodings may denote the same value
   — this is why §5.1.1 rule 5 refuses normalization — so equal addresses imply
   equal content, and unequal addresses imply nothing about meaning.

Content addressing is load-bearing here and it is load-bearing for exactly one
thing: it makes tampering detectable and identity stable, so that everything
built on top — signatures, attestations, re-derivation — has something fixed to
be about. Treating it as also delivering honesty or completeness is how a system
ends up with an unfalsifiable audit trail.

#### 5.1.1 Canonical encoding is normative, not an implementation detail

Everything in §5.1 rests on an unstated assumption: that `trinity` and `omega`,
handed the same object, compute the same digest. Nothing so far requires it. Two
substrates that serialize the same probability vector differently produce
different references for the same state, so their receipts never reconcile — and
they fail silently, at exactly the federation boundary the content addressing
existed to protect.

A conforming federation MUST therefore fix **one** canonical encoding. Multiple
encodings MAY exist for transport or display; exactly one is admissible as
digest input.

The encoding MUST satisfy:

1. **Determinism.** One object has exactly one canonical byte sequence. The
   encoder is a function, not a policy.
2. **Injectivity.** Two objects that differ observably MUST NOT encode to the
   same bytes. Encodings that permit indistinguishable framing of distinct
   values are inadmissible.
3. **No optional forms.** No alternative integer widths, no optional length
   prefixes, no permitted-but-discouraged variants. Where a format offers a
   choice, the profile MUST remove it.
4. **Total ordering of map keys**, with duplicate keys rejected rather than
   last-wins.
5. **No Unicode normalization (MUST NOT).** Strings are hashed as their exact
   sequence of code points. A verifier MUST NOT apply NFC, NFD, or any other
   normalization, and MUST NOT reject a string for not being normalized.
   Producers SHOULD emit NFC so that content mangled by an external editor,
   database, or filesystem still resolves — but that is producer discipline, not
   a verifier rule.
6. **A self-describing encoding identifier**, included in the digest input. A
   digest binds an object _under an encoding_; changing the encoding MUST change
   the reference rather than silently rehoming it.

Rule 5 reverses an obvious-looking requirement, and the reasoning is in
[Part 07: Revision History](07-revision-history.md) §1.

#### 5.1.2 Floating point

Floating point is where content-addressed systems usually die, and this RFC
proposes a probability simplex as a first-class domain (§6.4), so it walks
directly into the problem.

In canonical form:

1. `NaN` and the infinities MUST be rejected. They are not values a state may
   hold; a computation producing one has failed and MUST surface as a validation
   error, not as bytes.
2. IEEE floating-point values, including `-0.0` and `+0.0`, MUST NOT enter the
   selected canonical object model. An exact integral result MAY be converted to
   the integer `0` before that boundary; an encoder MUST NOT accept a float and
   silently canonicalize it.
3. Byte order and width MUST be fixed by the profile, not inherited from the
   host.
4. **Where equality of a value is load-bearing — simplex points, thresholds,
   budget terms, invariant boundaries — IEEE binary floating point MUST NOT be
   the canonical representation.** Such values MUST use exact rationals or
   fixed-point with a declared precision. A probability vector whose components
   were produced by different summation orders on different substrates is not
   the same vector under any digest, and rounding mode is not part of any wire
   format.
5. A state domain MAY use floating point internally. The obligation is at the
   canonical-encoding boundary, not inside the computation.

##### Non-integer values inside an integers-only domain

Rule 4 says what MUST NOT be used and leaves open how a non-integer value is
actually written when the canonical encoding admits only integers — which is the
case for the ratified Tranche A3 encoding (§17.1.1) and the one place §6.4's
probability simplex collides with it.

Two patterns are admissible. Both keep every number in the integer domain and
both are exact. Each is a **tagged form**, carrying the reserved discriminator
member `cnp0` that §5.1.2.1 fixes:

```json
{ "cnp0": "ratio", "num": <int>, "den": <int> }
{ "cnp0": "fixed", "value": <int> }
```

For `ratio`, the canonical form MUST satisfy:

1. `den > 0` — sign lives in `num` only, so `-1/3` has exactly one encoding;
2. `gcd(|num|, den) == 1` — reduced to lowest terms, so `2/6` is not a second
   encoding of `1/3`;
3. zero is `{ num: 0, den: 1 }` and nothing else;
4. both components lie inside the encoding's integer domain.

For `fixed`, a content-addressed scale descriptor MUST be declared by the state
domain rather than repeated per value, and all values in one domain MUST share
it — otherwise comparing two points means rescaling, and rescaling reintroduces
the rounding the rule exists to remove. The domain reference already binds the
point to that descriptor; repeating `scale` or `scale_id` in each value would
create two sources of truth.

**Reduction rules are not optional decoration.** Without them the encoding is
deterministic but not injective in the direction that matters: two byte
sequences would denote one value, so two states that are equal would carry
different references, and every equality check downstream would silently be
comparing encodings rather than values.

**The simplex additionally constrains the sum.** A probability vector MUST sum
to exactly one under exact arithmetic — `Σ num_i / den_i == 1` for ratios, or
`Σ value_i == radix^places` for fixed-point under the domain's scale descriptor.
This is a validation rule (§6), not an encoding rule, and it is the reason the
simplex cannot use floats: "sums to one after rounding" is not a property two
independent implementations will agree on.

A string form such as `"1/3"` is a third option, and RFC 7493 §2.2 does
recommend strings for numeric values outside the safe integer range. It is not
recommended here: it moves the reduction rules into a string grammar that every
implementation must parse identically, which is more surface for the second
independent implementation to diverge on, and divergence there is exactly what
canonical encoding exists to prevent.

##### 5.1.2.1 CNP-0-JCS: the ratified selection

This document selects **CNP-0-JCS**, ratified as Tranche A3 on 2026-08-26
(§5.1.3, Part 07 §17). The selection is one package with two named layers:

- `hsp-jcs@v0` is the wire encoding: RFC 8785 JCS over strict I-JSON;
- `cnp-0` is the numeric profile carried by that encoding.

A profile identifier without a byte encoding does not determine a digest, and a
choice between “binary or JCS” is not a choice. CNP-0-JCS therefore fixes both.
Every root object MUST contain the exact members
`"canonical_encoding":"hsp-jcs@v0"` and `"numeric_profile":"cnp-0"` inside the
bytes being hashed; changing either member MUST change the reference. Nested
values do not repeat them.

The admissible object model is `null`, booleans, exact strings, arrays,
string-keyed maps, and integers in the inclusive range
`[-(2^53 - 1), +(2^53 - 1)]`. Map member names MUST be unique in the raw input.
Strings follow §5.1.1 rule 5. Floating-point numbers, decimal fractions,
exponent notation, CBOR tags, and integers outside the range are not members of
this profile.

Raw bytes, exact ratios, and fixed-point values are written as **tagged forms**.
A tagged form is a map carrying the member name `cnp0`, whose value is exactly
one of `"bytes"`, `"ratio"`, or `"fixed"`, and whose remaining members are
exactly the ones that form defines and no others:

```json
{ "cnp0": "bytes", "hex": "<even-length lowercase hexadecimal>" }
{ "cnp0": "ratio", "num": <int>, "den": <int> }
{ "cnp0": "fixed", "value": <int> }
```

The member name `cnp0` is **reserved in every position** of a `cnp-0` document
and MUST NOT be used for any other purpose. **Recognition is therefore a
property of the bytes alone**: a reader decides whether a value is a tagged
form, and whether that form is canonical, without resolving a domain descriptor.
This is what makes §5.1.3's verifier-only path able to do what that section asks
of it — reject a non-canonical ratio — while holding nothing but the raw input.

A map carrying `cnp0` with any other value, or with a member the form does not
define, MUST be rejected rather than reinterpreted as an ordinary map. A map
that does not carry `cnp0` **is** an ordinary map, whatever its other member
names are, **including `kind`** — which this document uses as an ordinary
discriminator in at least a dozen other types and which the numeric profile does
not claim.

Length is derived from `hex` and MUST NOT be repeated. A decoder MUST reject
uppercase, odd-length, or non-hexadecimal content rather than normalize it.
Ratio and fixed-point values additionally satisfy the reduction and scale rules
of §5.1.2. A domain MUST declare which numeric form it admits; it MUST NOT
accept both forms for one semantic value and treat them as equal. The domain
decides _which form is admissible_; the bytes decide _what form a value is_.

The alternative considered was schema-directed recognition: no reserved name,
and a value is a ratio only because a domain descriptor types that position as
one. It is not adopted, and the reason is a property this section chooses rather
than one the earlier draft implied. Under schema-directed recognition "these
bytes are valid CNP-0" stops being answerable by anyone holding the bytes: a
document that carries no domain reference — which this profile permits, since
only the two identifiers of §5.1.2.1 are required at the root — becomes
verifiable at the wire layer only. If a later revision prefers that trade, it
MUST state §5.1.3's input contract explicitly, because "verifier-only" says what
the path does not do and not what it is given.

CNP-0-JCS reuses the already implemented Warrant JCS profile because its
canonical bytes are pinned by a normative fixture artifact and independently
reproduced by Python, Go, and Rust. That is prior evidence, not proof of CNP-0
conformance: those fixtures do not contain the profile identifiers, ratios,
fixed-point domains, or the rejection corpus required below.

The proposal that motivated this selection recommended an abstract `i128`
domain. It is not adopted in v0. JCS interoperates without integer rounding only
inside the I-JSON safe range; claiming `i128` while leaving its byte form to a
later binary choice would restore the ambiguity this section removes. A future
larger-integer profile MUST use a new identifier and references.

##### 5.1.2.2 Fixed-point scale identity

A fixed-point domain MUST bind one content-addressed scale descriptor of this
shape:

```json
{
  "canonical_encoding": "hsp-jcs@v0",
  "numeric_profile": "cnp-0",
  "scale": "hsp-scale@v0",
  "radix": 10,
  "places": 6,
  "unit_ref": null
}
```

`radix` MUST be `2` or `10`; `places` MUST be a non-negative integer; and
`radix^places` MUST lie inside the CNP-0 integer range. The represented value is
`value / radix^places`. `unit_ref` is either `null` or a full content digest of
a unit descriptor. A different scale descriptor produces a different domain
reference. Changing scale is therefore a new domain plus a declared translation,
never an in-place rewrite.

Equality inside the domain compares integer `value`. Cross-scale comparison is
available only through a declared translation. For a fixed-point probability
simplex, `Σ value_i` MUST equal `radix^places` exactly.

##### 5.1.2.3 Named constants and transcendental sinks

Host `libm` output is not a canonical constant source. If a domain's canonical
point, invariant, or transition depends on a named non-rational constant, its
descriptor MUST declare exactly one strategy:

1. `symbolic` — the rule is expressed without materializing the constant, such
   as comparing non-negative `x²` with `2` instead of `x` with `√2`;
2. `pinned` — the descriptor contains a full content digest of canonical bytes
   holding the required digits or lookup table, plus their numeric scale;
3. `discrete-surrogate` — the domain uses an exact discrete representation and
   declares translation loss when exporting to a continuous one.

Changing pinned bytes changes the domain reference. Omitting the strategy when
the constant reaches canonical state is a validation failure. This does not
claim to canonicalize real numbers generally; it makes the finite approximation
and its authority inspectable.

##### 5.1.2.4 Optional discrete circle domains

`circle2n@v0` is an optional discrete-surrogate family, not part of the scalar
profile. If implemented, a domain descriptor MUST fix an integer `1 <= n <= 52`;
a point is an integer index in `[0, 2^n)`, addition is exact modulo `2^n`, and
equality is equality of indices. A `sin` or `cos` lookup table MUST be
fixed-point, content-addressed, and bound into the domain descriptor. Lookup
output MUST NOT redefine point identity.

The first fixture domain SHOULD use `n = 8` (`circle256`). Export to radians or
to a continuous circle is a translation with a loss profile. A discrete circle
MUST NOT claim continuous, Riemannian, or information-geometric capabilities
merely because its points are conventionally drawn on a circle.

##### 5.1.2.5 Quantization from approximate computation

Internal floating-point computation remains permitted by rule 5. Any boundary
that maps it into CNP-0 MUST name the source float format, target exact domain,
overflow behavior, and one quantization mode:

- `trunc_toward_zero`;
- `round_ties_even`;
- `reject`.

The mode and its parameters are part of the domain or transformation descriptor.
`reject` accepts only values exactly representable in the target domain. At an
irreversible boundary, `reject` is the default unless a different mode is
explicitly warranted. Positive and negative ties, just-inside and just-outside
boundaries, overflow, `NaN`, infinities, and signed zero MUST appear in the
negative or positive fixtures as appropriate. Quantization is a declared lossy
transformation, not invisible serialization cleanup.

##### 5.1.2.6 Exact simplex renormalization

An integer computation over a fixed-point probability simplex can produce
non-negative weights whose sum is not `radix^places`, even though no float was
used. Choosing which component receives the residual unit is part of the state
transition, not an encoder convenience. An implementation MUST either reject
such a vector or use a mode named by the domain or transformation descriptor.
The v0 canonical mode is `renormalize_largest_remainder@v0`.

For canonical non-negative integer weights `w_i`, let `T = radix^places` and
`S = Σ w_i`. If any weight is negative, `S == 0`, or exact intermediate
arithmetic is unavailable, the transform MUST reject. If `S == T`, it returns
the weights unchanged. Otherwise it computes, using exact integer arithmetic:

```text
q_i = floor(w_i * T / S)
r_i = (w_i * T) mod S
R   = T - Σ q_i
```

It then adds one to exactly `R` components, ordered first by descending `r_i`
and then by ascending canonical bytes of the component's coordinate identifier.
A simplex domain MUST bind one unique canonical coordinate identifier to every
component; an ordered anonymous vector uses its CNP-0 integer index. Input array
position is not a tie-breaker unless that position is the bound coordinate
identifier. The output MUST validate `Σ q_i == T` exactly.

The descriptor MUST record the mode, source vector reference, target scale, and
whether renormalization occurred. Renormalization is a declared quantization
transformation and MUST appear in the loss profile; it MUST NOT be reported as
an identity serialization. A different allocation method requires a different
mode identifier and therefore different transformation references.

#### 5.1.3 Parity is proven, not assumed

Every substrate implementing the encoding MUST verify against a shared fixture
set, in the manner `warrant/examples/canon-vectors.json` establishes for JCS.
The CNP-0 corpus MUST pin canonical bytes and full SHA-256 digests for:

1. zero, one, minus one, and both CNP-0 integer bounds;
2. `1/3`, `-1/3`, canonical zero, and rejection of `2/4`, `0/2`, a negative
   denominator, overflow, floats, exponent notation, and duplicate map names;
3. the same fixed integer under two scale descriptors producing different domain
   references;
4. exact ratio and fixed-point simplexes, including invalid sums; largest-
   remainder renormalization with a residual, a tie resolved by canonical
   coordinate identifier, permutation of input presentation, zero-sum rejection,
   and negative-weight rejection;
5. profile-identifier mutation and one-byte pinned-constant mutation changing
   the full digest;
6. byte strings, normalization-distinct strings, key-order permutations, and
   nested empty containers;
7. `circle256` index equality and rotation, with LUT mutation if a LUT is
   implemented;
8. every quantization boundary named in §5.1.2.5–§5.1.2.6.

Cross-substrate parity that has not been measured is a hope, and this document
does not accept hopes as evidence anywhere else.

**Tranche A3 is RATIFIED (2026-08-26).** `s0fractal`, as steward, ratified
Tranche A3 and CNP-0-JCS. The statement, verbatim:

> Ратифікую Tranche A3 RFC-0003 і CNP-0-JCS як steward. Це не є
> adoption-evidenced або interop-confirmed.
>
> _(I ratify Tranche A3 of RFC-0003 and CNP-0-JCS as steward. This is not
> adoption-evidenced or interop-confirmed.)_

The steward drew the boundary in the same breath as the ratification, and that
half is as normative as the first. Ratification settles that the encoding is
determined and checkable, and lifts the specification-side federation blocker.
It licenses **no** claim that the encoding is in use, that a second
implementation exists, that interoperability has been demonstrated, or that any
federation evidence has been produced.

Two levels were separated here on 2026-08-26, because an earlier version of this
paragraph conflated them and thereby made the whole tranche wait on a party this
project cannot create.

**A3 ratification** required artifacts the project can produce and anyone can
check, and all six exist at the ratified revision:

1. `CANONICAL_ENCODING.v0.1` as a normative contract;
2. the normative corpus above;
3. one reference encoder that reproduces its bytes and digests;
4. a verifier-only path that rejects non-canonical ratios and malformed raw
   input, sharing no code with the encoder — the property that matters is that
   it cannot repair what it is asked to judge, and that is a code-path property,
   not an authorship one;
5. a **reproducible conformance kit** — the contract, the corpus, the expected
   bytes and digests, and a runner — such that a party outside this project can
   implement §5.1 and check itself without consulting or trusting this project.
   It exists at `conformance/cnp-0-jcs-v0/`. It ships no implementation: a kit
   that scored an implementer by agreement with this project's encoder would be
   asking them to trust that encoder, which is the thing the kit exists to make
   unnecessary;
6. steward ratification.

That list is the whole of A3. Two further states sit outside it, and neither
blocks it, because ratifying a specification, running it, and having someone
else run it are three different acts:

**Adoption-evidenced — TRUE since 2026-08-27.** `ActionIntent.intentCommitment`
computes its commitment over CNP-0-JCS canonical bytes in both Trinity
(`src/x5E10_warrant.ts`) and MYC (`myc/src/x5820_action_intent.ts`), and that
commitment is the authority gate: `actionBoundAuthority` permits actuation only
when a committed proposal's `action_grant.intent_commitment` equals it exactly.
A live end-to-end test authorizes the proposal MYC actually wrote to disk. This
is one path, not the whole substrate, and it is named rather than generalised.

**Interop-confirmed** — at least two independently _maintained_ implementations,
or adoption by a party outside this project, with parity evidence in both
directions. Until it holds, no document in this RFC may describe §5.1 as
"independently interoperable", "multi-implementation confirmed", or as having
demonstrated implementation diversity. A single-implementation encoding that a
second party _could_ verify is a different and weaker claim than one a second
party _has_ verified, and the difference is exactly what this level names.

§5.1 is now specified **and** ratified as a conforming cross-substrate protocol.
That is a statement about the specification, not about the world it is meant to
run in. The honest status is:

> **A3: RATIFIED. adoption-evidenced: true (one authority path — ActionIntent).
> interop-confirmed: false.**

One authority path computes real references under `hsp-jcs@v0`; nothing else in
either substrate does. `adoption-evidenced` says the encoding is in use, not
that it is used everywhere, and no document may read it as the latter.
`interop-confirmed` remains **false**: both implementations are under one
maintainer, which is exactly what that level exists to distinguish.

#### 5.1.4 The selection is narrower than it looks

An inventory of what actually exists (`probes/canonical-forms-inventory-v0`, run
2026-08-03) found **ten** canonical forms across the ecosystem, over three hash
functions and three kinds of input, with four different truncations. Six are
unavailable to comparison for stated reasons; four were executed. The relevant
results:

1. **`CANONICAL_HASH.v0.1` and a structural canonicalizer are layers, not
   rivals.** The probe's testable prediction — trinity's text hash equals the
   structural digest _exactly when_ the body text is already canonical, and
   differs otherwise — holds across the corpus. So Tranche A3 selects a
   canonicalizer that produces the bytes `CANONICAL_HASH` already digests.
   Existing `h.` handles stay valid inside their owning protocols; they are not
   retroactively relabelled as CNP-0 objects. New HSP objects carry the encoding
   and numeric-profile identifiers required by §5.1.2.1, so adopting CNP-0 does
   not silently change the meaning of an old handle.
2. **Trinity already ships a second structural canonicalizer.**
   `packages/canonical-receipt` is live on jsr and implements RFC 8949 canonical
   CBOR, forbidding floats by throwing. It remains canonical for receipt
   envelopes and is not the selected HSP state-object encoding: its live strict
   subset has a different integer domain and no CNP-0 ratio/fixed corpus. The
   encoding identifier keeps the two families disjoint instead of pretending one
   set of bytes is the other.
3. **`RECEIPT_ENVELOPE.v1.0` fixes its encoding, and models the pattern this RFC
   asks for.** An earlier revision of this section claimed the contract left its
   encoding unfixed. That was a misreading, corrected here: the contract's
   "Canonical serialization" section states that for `envelope_id` and
   `body_hash` the canonical form is **CBOR with deterministic encoding (RFC
   8949 §4.2.1)**, forbids floats, sorts map keys by encoded form, and rules
   that "JSON form is the human/debug projection, NOT the canonical form —
   verifiers MUST hash CBOR." Two implementations (TypeScript and Python, in
   `probes/receipt-envelope-encoder-v0/`) were verified byte-identical on
   2026-05-14.

   What the misread comment actually says is that **body bytes** are serialized
   by whichever schema the `body_kind` declares — the envelope is opaque to its
   body by design and does not own the body's protocol. That is delegation, not
   ambiguity, and it is precisely the per-family declaration §5.1.1 rule 6 calls
   for: the envelope fixes its own form, the body declares its own, and the
   reference records which. Prior art for this RFC rather than a defect in it.

4. **No live form normalizes Unicode.** Rule 5 above was written as a correction
   and turns out to describe existing behavior everywhere, which downgrades it
   from a change to a codification.

The inventory is a probe, not authority. Its own falsifiers are in its README —
most importantly that its JCS implementation is a reimplementation rather than
`warrant`'s, so agreement is weaker evidence than running `warrant`'s harness
directly. CNP-0's own acceptance and rejection corpus remains unimplemented.

#### 5.1.5 Profile transition without reference rewriting

Section 5.1.2.1 says a future larger-integer or otherwise changed profile uses a
new identifier and therefore new references. That prevents silent
reinterpretation but is not yet a migration contract. Without one, an
implementation is tempted either to alias old and new digests as “the same
object” or to rewrite old receipts. Both destroy the byte identity §5.1 exists
to preserve.

Exactly one encoding/numeric-profile pair is active for **new HSP authoring**
under one ratification subject. A deployment MAY continue resolving historical
profiles, but it MUST declare a content-addressed transition policy:

```ts
type ProfileTransitionPolicy = {
  fromProfile: ContentAddress; // exact prior profile contract
  toProfile: ContentAddress; // exact successor profile contract
  mode: "reencode" | "clean-break";
  migration: ContentAddress | null; // required exactly for reencode
  acceptedLegacyProfiles: ContentAddress[];
};

type CanonicalProfileMigration = {
  sourceProfile: ContentAddress;
  targetProfile: ContentAddress;
  objectFamily: ContentAddress;
  rule: ContentAddress; // deterministic, bounded, no ambient authority
  equivalence: PredicateRef; // equality of decoded abstract objects
};

type ReencodingReceipt = {
  source: ContentAddress; // full historical digest
  target: ContentAddress; // full successor digest
  migration: ContentAddress;
  executor: KeyRef;
  evidence: EvidenceRef[];
};
```

Rules:

1. The transition policy, migration, and receipt MUST use the selected canonical
   carrier and full-digest identity. `acceptedLegacyProfiles` and receipt
   `evidence` are canonical sets: full references sorted by canonical bytes,
   with duplicates rejected. `reencode` requires a non-null `migration`;
   `clean-break` requires `migration: null`. The successor ratification record
   binds the transition policy from outside it, avoiding a cyclic pair of
   content addresses.
2. **A historical reference is immutable.** Migration creates a target object
   and receipt; it never edits, aliases, redirects, or re-hashes the source. Old
   receipts continue to verify under the profile they actually named.
3. `reencode` is legal only when source bytes validate under `sourceProfile`,
   target bytes validate under `targetProfile`, and the pinned `equivalence`
   predicate establishes that both decode to the same abstract object in the
   declared `objectFamily`. Profile tags themselves remain part of digest input,
   so source and target references are expected to differ.
4. A rule that changes the abstract object is **not re-encoding**. It is a Part
   03 transformation and owes a transformation kind, loss profile, suitability,
   and separate receipt. Calling it migration MUST NOT erase those obligations.
5. A `clean-break` transition has `migration: null`. It makes no cross-profile
   identity claim. Legacy objects MAY remain resolvable for historical audit but
   MUST be translated or rejected at a boundary requiring the successor profile.
6. Every boundary policy MUST name accepted profile contracts and the transition
   policy it applies. An unknown profile, missing transition, invalid receipt,
   or unsupported chain fails closed; a consumer MUST NOT choose a migration by
   mutable version label.
7. A batch manifest MAY aggregate re-encoding receipts by content address. Its
   scope and completeness are separate claims with evidence; a Merkle or list
   root proves membership, not that every legacy object was migrated.
8. Migration chains compose as receipt chains. A verifier checking a historical
   decision uses the original reference directly; it MUST NOT substitute the
   newest target and retroactively evaluate the old decision under new bytes.

A successor profile's corpus MUST include positive same-object re-encodings;
profile-tag mutation producing distinct references; rejection of malformed
source and target bytes; rejection when the equivalence predicate fails; clean
break behavior; mixed-profile boundary rejection; and a batch manifest whose
membership is valid while its deliberately incomplete scope is not reported as
complete.

## 14. Ledger requirements

The ledger MUST preserve more than state changes. It MUST preserve changes to
the space in which state changes were interpreted.

Each relevant receipt SHOULD record:

- source and target domain versions;
- source and target ontology versions;
- translator identity and version;
- loss profile;
- preserved and violated invariants;
- mutation cost and budget state;
- admission stage;
- warrants and authority;
- falsifiers;
- rollback plan and result;
- identity continuity decision;
- federation participants;
- irreversible-boundary decision;
- runtime path taken and the predicate evaluation that admitted it;
- state profiles at each boundary crossing.

A future verifier must be able to answer:

1. Which representation was used?
2. Why was it considered sufficient?
3. What was lost during translation?
4. Why was a representation change proposed?
5. Who accepted it and under which authority?
6. What evidence survived independently?
7. Could the action have been reversed?

### 14.1 Disclosure

Everything above is written as though the ledger is public and the parties have
nothing to withhold. For a federation of agents acting on behalf of principals
that is false, and the omission forces a choice the document never states:
**auditability or confidentiality, pick one.**

That framing is wrong, and treating disclosure as a later concern would bake it
in. What a receipt must prove and what it must reveal are different questions,
and the machinery this RFC already relies on — content addressing, canonical
encoding, attestation — separates them if it is asked to.

#### 14.1.1 The layering

```text
public receipt envelope     — structure, addresses, verdicts, authority
private referenced payload  — the state, evidence, or policy body itself
selective disclosure        — proofs about the payload, without the payload
availability commitment     — who holds it, and what they owe
```

A receipt is an envelope of **references and verdicts**. Whether the referenced
bytes are public is a separate decision from whether the receipt is verifiable.
A verifier can already check that the structure is well-formed, the signatures
bind, the lineage connects, and the authority was held, without reading a single
payload.

#### 14.1.2 Requirements

1. **A confidential payload MUST still be committed to.** Withholding bytes is
   legitimate; not committing to them is not. A reference whose target was never
   fixed cannot be shown later to be the thing that was used.
2. **Dictionary attacks on content addresses are real and MUST be considered.**
   A digest over a low-entropy payload — a boolean verdict, a small enum, a name
   from a known set — reveals the payload to anyone who can enumerate the space.
   Commitments to low-entropy values MUST be salted or otherwise blinded, and
   the salt is part of the payload, not of the receipt.
3. **Redaction MUST be visible.** A redacted field MUST be distinguishable from
   an absent one and from an unassessed one. §19.15's rule against confusing
   `absent` with `not assessed` extends here: a third state, `withheld`, with a
   commitment attached.
4. **Selective disclosure MUST NOT be simulated by trust.** "The verifier was
   told the invariant held" is not a proof that it held. Where a party must
   establish a property of a payload without revealing it, that MUST be an
   attestation by an identified party or a cryptographic proof — and which one
   MUST be recorded, because they have very different strength.
5. **Availability is a commitment, not a hope** (§5.1.0). A receipt depending on
   a payload someone must retain MUST name who owes it and for how long. An
   unavailable payload makes the receipt unverifiable, and a system that cannot
   distinguish "withheld" from "lost" cannot be audited.
6. **Disclosure decisions are themselves ledgered.** Who was granted resolution
   of what, under which authority, is exactly the kind of thing that must not be
   reconstructible only from someone's memory.

#### 14.1.3 What this section does not do

It does not select a scheme. Commitment construction, blinding, proof systems,
and capability-controlled resolution are cryptographic engineering with failure
modes this document is not equipped to adjudicate, and naming a scheme here
would be §19.7's failure mode in the one area where getting it wrong is silent.

What it does is refuse the framing that privacy is optional decoration for a
federation of agents, and state the properties any scheme must deliver. The
scheme selection is open problem §20.20; whether an irreversible boundary can be
crossed on a withheld payload at all — as against merely being decided on one —
is §20.21, and the conservative default until then is that it cannot.

---
