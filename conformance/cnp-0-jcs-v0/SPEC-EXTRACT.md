# CNP-0-JCS — normative extract

Everything below between the `quoted` markers is **verbatim** from RFC-0003
Part 01, and that is machine-checked: each region carries the clause it comes
from, its byte range in the source, and its own digest, and
`tools/build_kit.py --check` re-extracts and fails on a one-byte drift.

This extract is a convenience, not an authority. Where it and Part 01 disagree,
**Part 01 governs**. It is included so the kit can be read without fetching the
RFC, not so it can replace it.

---

## §5.1.1 — Canonical encoding is normative, not an implementation detail

<!-- quoted §5.1.1 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:474ffd5c40eceb59… bytes 8911..10131 region-sha256:f4b3f491e7c94a51… -->

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

<!-- end quoted §5.1.1 -->

---

## §5.1.2 — Floating point

<!-- quoted §5.1.2 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:474ffd5c40eceb59… bytes 10468..11642 region-sha256:223959e79c0a546e… -->

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

<!-- end quoted §5.1.2 -->

---

## §5.1.2 — Non-integer values inside an integers-only domain

<!-- quoted §5.1.2 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:474ffd5c40eceb59… bytes 11975..13806 region-sha256:8fab8eaf939924bd… -->

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

<!-- end quoted §5.1.2 -->

---

## §5.1.2.1 — CNP-0-JCS: the ratified selection

<!-- quoted §5.1.2.1 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:474ffd5c40eceb59… bytes 14233..17860 region-sha256:40b14adf274f9acf… -->

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

<!-- end quoted §5.1.2.1 -->

---

## §5.1.2.2 — Fixed-point scale identity

<!-- quoted §5.1.2.2 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:474ffd5c40eceb59… bytes 18650..19528 region-sha256:142acb574999e19c… -->

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

<!-- end quoted §5.1.2.2 -->

---

## §5.1.3 — Parity is proven, not assumed

<!-- quoted §5.1.3 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:474ffd5c40eceb59… bytes 23833..28604 region-sha256:f37dce7dae936ef3… -->

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

**Adoption-evidenced** — at least one substrate computing real references under
`hsp-jcs@v0` on a path that matters. Until it holds, no document may claim the
encoding is in use.

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

> **A3: RATIFIED. adoption-evidenced: false. interop-confirmed: false.**

Anything depending on cross-substrate reference _equality_ still depends on
`adoption-evidenced`, which is false: no substrate computes references under
`hsp-jcs@v0` today. Ratification removed the specification-side blocker and
nothing else.

<!-- end quoted §5.1.3 -->

---
