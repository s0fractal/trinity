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
> Part 01 §5.1.3 requires `CANONICAL_ENCODING.v0.1`, the corpus, a reference
> encoder, a verifier-only path sharing no code with it, a standalone
> conformance kit, and steward ratification before A3 is closed. Substrate
> adoption (`adoption-evidenced`) and independent maintenance
> (`interop-confirmed`) are separate states above it and do not block it. See
> "What is still missing" below.

- **Normative source:**
  [RFC-0003 Part 01 §5.1.1–§5.1.3](../docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md).
  Where this document and Part 01 disagree, **Part 01 governs**; this file is a
  restatement, not an amendment, and adds no normative rule.
- **Executable candidate:** [`probes/cnp-0-seed-v0/`](../probes/cnp-0-seed-v0/)
  — reference encoder, verifier-only rejection path, corpus, negative controls.
- **Conformance kit:**
  [`conformance/cnp-0-jcs-v0/`](../conformance/cnp-0-jcs-v0/) — implement §5.1
  and score yourself, without running or trusting anything of ours.
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

| #   | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Clause              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| P1  | Every hashed root contains exactly `"canonical_encoding":"hsp-jcs@v0"` and `"numeric_profile":"cnp-0"`. Nested values do not repeat them. Changing either changes the reference.                                                                                                                                                                                                                                                                              | §5.1.2.1            |
| P2  | The object model is `null`, booleans, exact strings, arrays, string-keyed maps, and integers in `[-(2^53-1), +(2^53-1)]`.                                                                                                                                                                                                                                                                                                                                     | §5.1.2.1            |
| P3  | Floating-point numbers, decimal fractions, exponent notation, and integers outside the range are not members of the profile.                                                                                                                                                                                                                                                                                                                                  | §5.1.2.1, §5.1.2(2) |
| P4  | `NaN` and the infinities are rejected as validation errors, not encoded.                                                                                                                                                                                                                                                                                                                                                                                      | §5.1.2(1)           |
| P5  | Raw bytes use exactly one projection, `{ "cnp0": "bytes", "hex": … }`, lowercase and even-length. Uppercase, odd-length, or non-hex content is **rejected, not normalized**. Length is derived and must not be repeated.                                                                                                                                                                                                                                      | §5.1.2.1            |
| P6  | `{ "cnp0": "ratio", … }` requires `den > 0`, `gcd(\|num\|, den) == 1`, zero as `{num: 0, den: 1}`, and both components inside the integer range.                                                                                                                                                                                                                                                                                                              | §5.1.2              |
| P7  | `{ "cnp0": "fixed", … }` carries only its integer `value`; the scale descriptor is bound by the domain and is never repeated per value.                                                                                                                                                                                                                                                                                                                       | §5.1.2              |
| P8  | A scale descriptor fixes `radix ∈ {2, 10}`, non-negative `places`, `radix^places` inside the integer range, and `unit_ref` either `null` or a full digest. A different descriptor is a different domain.                                                                                                                                                                                                                                                      | §5.1.2.2            |
| P9  | A ratio simplex sums to exactly `1`; a fixed-point simplex sums to exactly `radix^places`. This is validation, not encoding.                                                                                                                                                                                                                                                                                                                                  | §5.1.2, §5.1.2.2    |
| P10 | A named non-rational constant declares `symbolic`, `pinned`, or `discrete-surrogate`. Host `libm` output is not a canonical source.                                                                                                                                                                                                                                                                                                                           | §5.1.2.3            |
| P11 | `circle2n@v0` is optional: a point **is** an integer index in `[0, 2^n)`, so an integer outside that interval is rejected rather than normalized; addition is modulo `2^n` over two valid points; equality is equality of indices; any LUT is fixed-point and content-addressed.                                                                                                                                                                              | §5.1.2.4            |
| P12 | A boundary from approximate computation names the source float format, target domain, overflow behaviour, and one of `trunc_toward_zero`, `round_ties_even`, `reject`. `reject` is the default at an irreversible boundary.                                                                                                                                                                                                                                   | §5.1.2.5            |
| P13 | `renormalize_largest_remainder@v0` allocates the residual by descending remainder, then by **ascending canonical bytes of the coordinate identifier** — never by array position, unless that position is the bound identifier. Every component binds a **unique** coordinate identifier, so a duplicate is rejected: without uniqueness the tie-break is not a function of the input. It rejects a negative weight or a zero sum, and validates `Σ q_i == T`. | §5.1.2.6            |
| P14 | **Recognition is byte-local.** A tagged form is a map carrying the reserved member `cnp0`, whose value is one of `"bytes"`, `"ratio"`, `"fixed"`, with exactly the members that form defines. `cnp0` is reserved in every position; an unrecognized value or an extra member is rejected, never reinterpreted. A map without `cnp0` is an ordinary map whatever its member names, **including `kind`**. Governs P5-P7.                                        | §5.1.2.1            |

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
`quantization-infinite`, `renormalize-negative-weight`, `renormalize-zero-sum`,
`renormalize-duplicate-coordinate`, `circle-point-out-of-range`.

Every one of them is exercised by at least one corpus case; the gate fails if a
declared class is never used.

### The raw-byte boundary

Duplicate member names, invalid UTF-8, trailing bytes, and malformed escapes
**cannot be detected after decoding to an ordinary object**: a permissive parser
resolves them silently. The verifier therefore receives the original bytes and
performs its own UTF-8 validation and its own scan. This is why §5.1.3 asks for
a _verifier-only_ path rather than a second encoder.

## 5. Implementation choices and dispositions

Each entry below is a place where Part 01 left something for an implementer to
decide, and where two conforming-looking implementations could diverge. Two of
them have since been decided normatively; the rest have not, and the difference
is load-bearing enough to state per entry rather than in a blanket sentence.

**Resolved (1–2)** — normative in Part 01 §5.1.2.1 and, as of 2026-08-25, a
**steward-approved draft rule**: the technical decision is attributed to Codex
as delegated acceptance reviewer, and `s0fractal` has since confirmed it as the
draft's settled position. That approval is a relayed statement, **not** an
`s0fractal` cryptographic signature, and **not** ratification of Tranche A3, a
conformance result, interoperability, or adoption. See Part 07 §14.

**Open (3–7)** — still implementation choices. **None of them is proposed as a
normative rule here.** They are open questions for the steward.

### Resolved

1. ~~**How a tagged form is recognized.**~~ **Resolved normatively on
   2026-08-25.** §5.1.2.1 now reserves the member name `cnp0` and makes
   recognition a property of the bytes. The earlier candidate read any map with
   `kind` in `{bytes, ratio, fixed}` as a tagged form, which would have reserved
   three values of this document's universal discriminator — 39 values across at
   least twelve declared types. See Part 07 §14 and
   `proposals/rfc-0003/tagged-form-recognition-disposition-2026-08-25.md`. The
   technical decision is attributed to Codex as delegated acceptance reviewer;
   `s0fractal` confirmed it as a steward-approved draft rule on 2026-08-25,
   which is not ratification of A3.
2. ~~**Whether a tagged form may carry extra members.**~~ **Resolved with it:**
   exactly the members the form defines. What remains an implementation choice
   is below.

### Open

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
7. **How a full content digest is spelled.** §5.1.2.2 says `unit_ref` is "either
   `null` or a full content digest" without fixing the string form. This
   candidate requires 64 lowercase hexadecimal characters and rejects an opaque
   handle, a truncated digest, or an uppercase one — fail-closed, and consistent
   with §5.1's refusal elsewhere to accept a truncated handle as a reference. A
   typed reference object would be the alternative, and choosing between them is
   a normative question.

## 6. Measured divergence from the prior art §5.1.2.1 cites

§5.1.2.1 justifies the selection partly by Warrant's JCS profile being
"independently reproduced by Python, Go, and Rust". Running Warrant's own
`canon()` over this corpus found one disagreement, and it is worth recording
because it bounds what that prior evidence covers.

RFC 8785 §3.2.3 orders member names by their **UTF-16 code units**. Warrant's
Python `canon()` uses `json.dumps(sort_keys=True)`, which orders by **code
point**. The two agree for every name inside the BMP and diverge as soon as a
name is outside it: U+1D11E is the surrogate pair `D834 DD1E`, so RFC 8785 sorts
it before U+FFFD and Python sorts it after. Warrant's published vectors are all
BMP, so their three-language parity never exercised this.

So the prior evidence supports `hsp-jcs@v0` **for BMP member names**. This is a
finding about an external implementation, reported rather than filtered. The
divergence is pinned in `probes/cnp-0-seed-v0/ts/parity_warrant.ts` as an exact
**byte pair**, both sides, so that a new divergence, a changed one, a resolved
one, or a change to our own side all fail the check. The measurement runs
against a tree materialized from the pinned revision, so a modified working copy
of the external checkout cannot reach it.

## 7. What is still missing before A3 can be claimed

§5.1.3 was restated on 2026-08-26 into two levels. The old text required **two
independent encoders** for A3 itself, which conflated a technical gate this
project can meet with an organisational precondition it cannot create — an
outside maintainer — and so blocked the whole RFC on someone else's decision.

### A3 ratification — what this project must produce

| Artifact                                               | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CANONICAL_ENCODING.v0.1`                              | this file, **candidate**                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| The CNP-0 corpus                                       | `probes/cnp-0-seed-v0/corpus/`, candidate, all eight §5.1.3 categories                                                                                                                                                                                                                                                                                                                                                                                             |
| A reference encoder                                    | present as a candidate (`probes/cnp-0-seed-v0/ts/`)                                                                                                                                                                                                                                                                                                                                                                                                                |
| A verifier-only rejection path sharing no code with it | present as a candidate; `ts/reject.ts` imports nothing from the encoder, which is the property that matters — it cannot repair what it judges                                                                                                                                                                                                                                                                                                                      |
| A reproducible conformance kit                         | **present as a candidate**, `conformance/cnp-0-jcs-v0/`. Normative extract quoted from Part 01 by byte range, 63 required cases with expected bytes and digests, a stdlib-only Python runner that scores an outside implementation, and `MANIFEST.sha256` pinning every file so an edited corpus is refused rather than quietly scored. It ships **no implementation**: scoring by agreement with our encoder would be asking an implementer to trust our encoder. |
| Steward ratification                                   | **absent.** Nothing here is accepted, signed, or ratified.                                                                                                                                                                                                                                                                                                                                                                                                         |

The same-author caveat that used to disqualify the second code path still
applies to what it actually bears on — it is not evidence of independent
_maintenance_ — but it no longer blocks A3, because A3 no longer asks for that.

### Interop-confirmed — a higher level, not a blocker

| Artifact                                                                    | Status                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two independently maintained implementations, **or** real external adoption | **absent.** One attempt at a second implementation (`probes/cnp-0-qwen-cleanroom-v0`) closed 2026-08-26 without producing an encoder, and deviated from its own accepted protocol; it is evidence for nothing here. |
| Parity evidence in both directions                                          | absent for any second implementation. `warrant` parity exists for the JCS layer only, with a recorded UTF-16/code-point divergence.                                                                                 |

Until this level holds, **no document may describe the encoding as
"independently interoperable" or "multi-implementation confirmed"**, and this
file may not be cited as showing implementation diversity.

### Adoption-evidenced — a separate state, not an A3 condition

- **substrate adoption** — **absent.** No substrate computes references under
  `hsp-jcs@v0` today. This no longer blocks A3: ratifying a specification and
  running it are different acts, and folding the second into the first meant the
  document could not be finished until the substrates moved. It still has to be
  reported, and A3 closing would not license saying the encoding is in use.

### Also outstanding, and not addressed by this file

- **federation evidence** — no cross-substrate agreement has been measured;
  Warrant parity covers the wire layer only, and Warrant's fixtures predate and
  do not contain the `cnp-0` profile members, ratios, fixed-point domains, or
  the rejection corpus.

The honest status remains what Part 01 already records: **A3 ratification gate
defined; contract, corpus, reference encoder, verifier-only path and conformance
kit present as candidates; steward ratification pending; adoption not evidenced;
independent interoperability unconfirmed.**
