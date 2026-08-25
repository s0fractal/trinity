# CNP-0-JCS — specification capsule

**This document is the whole of what you are given.** It is self-contained: it
does not refer to any existing implementation, and there is nothing else to
consult.

The quoted regions below are **verbatim** from the normative specification, and
that is machine-checked: each is delimited by a marker naming its clause and its
byte range in the source, and `harness/build_capsule.py --check` re-extracts them
and fails on a one-byte drift. The only text that is not quoted is this framing.
A paraphrase would test whether an implementation agrees with the paraphraser,
which is not the question.

---

## §5.1.1 — Canonical encoding is normative, not an implementation detail

<!-- quoted §5.1.1 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:0783fe57a13f7442… bytes 8911..10131 region-sha256:f4b3f491e7c94a51… -->

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

<!-- quoted §5.1.2 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:0783fe57a13f7442… bytes 10468..11642 region-sha256:223959e79c0a546e… -->

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

<!-- quoted §5.1.2 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:0783fe57a13f7442… bytes 11975..13806 region-sha256:8fab8eaf939924bd… -->

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

## §5.1.2.1 — CNP-0-JCS

<!-- quoted §5.1.2.1 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:0783fe57a13f7442… bytes 14275..17818 region-sha256:4aedeb88d753b78e… -->

This draft selects **CNP-0-JCS** as the Tranche A3 candidate. The selection is
one package with two named layers:

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

<!-- quoted §5.1.2.2 from docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md sha256:0783fe57a13f7442… bytes 18608..19486 region-sha256:142acb574999e19c… -->

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

## What "canonical" means for each of the two operations

The specification defines one canonical byte sequence per value. The two
operations you implement differ in what they are asked about those bytes.

**encode** is given input bytes that may or may not already be canonical. It
either produces the canonical byte sequence for the value they denote, or
rejects them. It never repairs a value that the rules forbid.

**verify** is given input bytes and asked whether *those exact bytes* are the
canonical encoding. It never produces bytes. Input that denotes a legal value
but is not written canonically — different member order, insignificant
whitespace, an escape the canonical form does not use — is a rejection for
`verify` and ordinary input for `encode`.

Three consequences of §5.1.1 rule 4 and §5.1.2.1 that are easy to lose if the
input is decoded before it is examined: duplicate member names, ill-formed
UTF-8, and bytes after the end of the value cannot be detected once a permissive
parser has resolved them. Both operations receive the original bytes.

## What will be measured

A corpus of positive and negative cases drawn from the categories §5.1.3 of the
specification requires: the integer bounds; ratios and their rejections; one
fixed value under two scale descriptors; simplex sums; profile-identifier and
pinned-constant mutation; byte strings, normalization-distinct strings, member
order, and nested empty containers; and quantization boundaries.

Only the encode/verify behaviour described here is measured. You are not asked
to implement quantization, renormalization, or the optional discrete circle
family.

You will not be shown the corpus, the expected bytes, or the expected digests.
