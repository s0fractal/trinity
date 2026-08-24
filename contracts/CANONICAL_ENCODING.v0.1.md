---
type: "ContractDescriptor"
version: "0.1"
title: "CNP-0-JCS Canonical Encoding"
status: "draft"
---

# CNP-0-JCS Canonical Encoding — candidate

> **Status: candidate / unratified / partial implementation.** This document
> restates the encoding RFC-0003 Part 01 §5.1 selects, in the form an
> implementer needs. It does **not** ratify Tranche A3, does not lift the
> federation blocker, and is not evidence that any substrate has adopted it.
> Part 01 §5.1.3 requires `CANONICAL_ENCODING.v0.1`, the corpus, **two
> independent encoders**, and a third verifier-only path before A3 is closed.
> One of those four exists as a candidate; see "What is still missing" below.

- **Normative source:**
  [RFC-0003 Part 01 §5.1.1–§5.1.3](../docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md).
  Where this document and Part 01 disagree, **Part 01 governs**; this file is a
  restatement, not an amendment, and adds no normative rule.
- **Executable candidate:** [`probes/cnp-0-seed-v0/`](../probes/cnp-0-seed-v0/)
  — reference encoder, verifier-only rejection path, corpus, negative controls.
- **Identifiers:** `canonical_encoding` = `hsp-jcs@v0`, `numeric_profile` =
  `cnp-0`.

## 1. The two layers

§5.1.2.1 fixes one package with two named layers, and this file keeps them
separate because only the first is shared with prior art:

| layer        | what it fixes                                      | clause   |
| ------------ | -------------------------------------------------- | -------- |
| `hsp-jcs@v0` | the wire encoding: RFC 8785 JCS over strict I-JSON | §5.1.2.1 |
| `cnp-0`      | the numeric profile carried by that encoding       | §5.1.2.1 |

## 2. Wire layer — `hsp-jcs@v0`

| #  | Rule                                                                                                                   | Clause         |
| -- | ---------------------------------------------------------------------------------------------------------------------- | -------------- |
| W1 | One object has exactly one canonical byte sequence.                                                                    | §5.1.1(1)      |
| W2 | Two observably different objects must not encode alike.                                                                | §5.1.1(2)      |
| W3 | No optional forms; where the format offers a choice, the profile removes it.                                           | §5.1.1(3)      |
| W4 | Map member names are totally ordered, and duplicates are **rejected**, not last-wins.                                  | §5.1.1(4)      |
| W5 | **No Unicode normalization.** A verifier must not apply NFC/NFD and must not reject a string for not being normalized. | §5.1.1(5)      |
| W6 | The encoding identifier is inside the hashed bytes.                                                                    | §5.1.1(6)      |
| W7 | Member order is by UTF-16 code unit, per RFC 8785.                                                                     | §5.1.2.1 (JCS) |
| W8 | Strings use the shortest RFC 8785 escape; `\u00xx` is lowercase and only for control characters without a short form.  | §5.1.2.1 (JCS) |
| W9 | No insignificant whitespace.                                                                                           | §5.1.2.1 (JCS) |

## 3. Profile layer — `cnp-0`

| #   | Rule                                                                                                                                                                                                                                                                                                   | Clause              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| P1  | Every hashed root contains exactly `"canonical_encoding":"hsp-jcs@v0"` and `"numeric_profile":"cnp-0"`. Nested values do not repeat them. Changing either changes the reference.                                                                                                                       | §5.1.2.1            |
| P2  | The object model is `null`, booleans, exact strings, arrays, string-keyed maps, and integers in `[-(2^53-1), +(2^53-1)]`.                                                                                                                                                                              | §5.1.2.1            |
| P3  | Floating-point numbers, decimal fractions, exponent notation, and integers outside the range are not members of the profile.                                                                                                                                                                           | §5.1.2.1, §5.1.2(2) |
| P4  | `NaN` and the infinities are rejected as validation errors, not encoded.                                                                                                                                                                                                                               | §5.1.2(1)           |
| P5  | Raw bytes use exactly one projection, `{ "kind": "bytes", "hex": … }`, lowercase and even-length. Uppercase, odd-length, or non-hex content is **rejected, not normalized**. Length is derived and must not be repeated.                                                                               | §5.1.2.1            |
| P6  | `ratio` requires `den > 0`, `gcd(\|num\|, den) == 1`, zero as `{num: 0, den: 1}`, and both components inside the integer range.                                                                                                                                                                        | §5.1.2              |
| P7  | `fixed` carries only its integer `value`; the scale descriptor is bound by the domain and is never repeated per value.                                                                                                                                                                                 | §5.1.2              |
| P8  | A scale descriptor fixes `radix ∈ {2, 10}`, non-negative `places`, `radix^places` inside the integer range, and `unit_ref` either `null` or a full digest. A different descriptor is a different domain.                                                                                               | §5.1.2.2            |
| P9  | A ratio simplex sums to exactly `1`; a fixed-point simplex sums to exactly `radix^places`. This is validation, not encoding.                                                                                                                                                                           | §5.1.2, §5.1.2.2    |
| P10 | A named non-rational constant declares `symbolic`, `pinned`, or `discrete-surrogate`. Host `libm` output is not a canonical source.                                                                                                                                                                    | §5.1.2.3            |
| P11 | `circle2n@v0` is optional: an integer index in `[0, 2^n)`, addition modulo `2^n`, equality of indices, with any LUT fixed-point and content-addressed.                                                                                                                                                 | §5.1.2.4            |
| P12 | A boundary from approximate computation names the source float format, target domain, overflow behaviour, and one of `trunc_toward_zero`, `round_ties_even`, `reject`. `reject` is the default at an irreversible boundary.                                                                            | §5.1.2.5            |
| P13 | `renormalize_largest_remainder@v0` allocates the residual by descending remainder, then by **ascending canonical bytes of the coordinate identifier** — never by array position, unless that position is the bound identifier. It rejects a negative weight or a zero sum, and validates `Σ q_i == T`. | §5.1.2.6            |

## 4. Rejection classes

§5.1.3 requires a verifier-only path that "rejects non-canonical ratios and
malformed raw input", and the corpus pins "a stable rejection class" per
negative case. The class names below are this candidate's vocabulary. **The
names are an implementation choice; the rejections they stand for are the
clauses above.**

`invalid-utf8`, `syntax`, `trailing-bytes`, `duplicate-member-name`,
`malformed-escape`, `unpaired-surrogate`, `number-not-cnp0-integer`,
`integer-out-of-range`, `signed-zero`, `non-canonical-form`,
`profile-identifier-invalid`, `bytes-hex-invalid`, `ratio-not-reduced`,
`ratio-non-positive-denominator`, `ratio-zero-not-canonical`,
`fixed-scale-in-value`, `tagged-form-invalid`, `scale-descriptor-invalid`,
`simplex-sum-invalid`, `simplex-negative-weight`, `simplex-zero-sum`,
`quantization-not-representable`, `quantization-overflow`, `quantization-nan`,
`quantization-infinite`, `renormalize-negative-weight`, `renormalize-zero-sum`.

Every one of them is exercised by at least one corpus case; the gate fails if a
declared class is never used.

### The raw-byte boundary

Duplicate member names, invalid UTF-8, trailing bytes, and malformed escapes
**cannot be detected after decoding to an ordinary object**: a permissive parser
resolves them silently. The verifier therefore receives the original bytes and
performs its own UTF-8 validation and its own scan. This is why §5.1.3 asks for
a _verifier-only_ path rather than a second encoder.

## 5. Implementation choices this candidate makes, which Part 01 does not state

Recording these is the point of the exercise. Each is a place where an
implementer must decide something the clause leaves open, and where two
conforming-looking implementations could diverge. **None of them is proposed as
a normative rule here.** They are open questions for the steward.

1. **How a tagged form is recognized.** This candidate treats any map with a
   `kind` member whose value is `"bytes"`, `"ratio"`, or `"fixed"` as that form.
   §5.1.2.1 gives the shapes but never says how a decoder identifies one, so a
   domain with an unrelated `kind` member would be read as a tagged value.
2. **Whether a tagged form may carry extra members.** §5.1.2.1 bars a repeated
   length on `bytes` and §5.1.2 bars a repeated scale on `fixed`. This candidate
   generalizes to "exactly the named members and no others", which is
   fail-closed but stricter than the text.
3. **The `-0` literal.** §5.1.2(2) bars IEEE `-0.0` from the object model. `-0`
   is nevertheless an integer token in the JSON grammar, so this candidate
   rejects it as `signed-zero`. That is a derivation, not a quotation.
4. **What "canonical" means for a verifier.** The encoder canonicalizes member
   order and whitespace; the verifier is asked whether _these_ bytes are
   canonical, so it rejects a key-order permutation, insignificant whitespace,
   an escaped solidus, and a `\u` escape for a character that JCS writes
   literally. Both expectations are pinned per case in the corpus.
5. **The `circle256` LUT shape.** §5.1.2.4 requires a LUT to be fixed-point,
   content-addressed, and bound into the domain descriptor. Its member layout is
   this candidate's.
6. **Quantizing signed zero.** `-0.0` maps to the integer `0`, following
   §5.1.2(2)'s "an exact integral result MAY be converted to the integer `0`
   before that boundary".

## 6. What is still missing before A3 can be claimed

§5.1.3 lists four artifacts. Their honest status:

| Artifact                     | Status                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CANONICAL_ENCODING.v0.1`    | this file, **candidate**                                                                                                                                                                                |
| The CNP-0 corpus             | `probes/cnp-0-seed-v0/corpus/`, candidate, all eight §5.1.3 categories                                                                                                                                  |
| **Two independent encoders** | **absent.** One reference encoder exists. A second code path (the Python authoring tool) has the same author, repository, and maintenance boundary, and is therefore not an independent implementation. |
| A third verifier-only path   | present as a candidate, same author caveat                                                                                                                                                              |

Also outstanding, and not addressed by this file:

- **substrate adoption** — no substrate computes references under `hsp-jcs@v0`
  today;
- **steward disposition** — nothing here is accepted, signed, or ratified;
- **federation evidence** — no cross-substrate agreement has been measured;
  Warrant parity covers the wire layer only, and Warrant's fixtures predate and
  do not contain the `cnp-0` profile members, ratios, fixed-point domains, or
  the rejection corpus.

The honest status remains what Part 01 already records: **A3 design selected; A3
interop and ratification pending.**
