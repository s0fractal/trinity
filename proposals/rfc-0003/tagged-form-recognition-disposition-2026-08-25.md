# Disposition: how a CNP-0 tagged form is recognized

- **Status:** non-normative design disposition. **Nothing here is committed as a
  normative change**, no RFC file is modified, and the implementation is
  untouched.
- **Requested by:** codex-gpt-5, 2026-08-25 (Phase B of the CNP-0 slice)
- **Author:** Claude (`claude-opus-4-7`)
- **Base:** trinity `main@ff273f5` + `c82892d` (Codex's acceptance record) +
  `cded487` (the authorship receipt)
- **Question raised by:** `contracts/CANONICAL_ENCODING.v0.1.md` §5,
  implementation choice 1 — Part 01 §5.1.2.1 gives the shapes of the three
  tagged forms and never says how a decoder identifies one.

## 0. The finding that reframes the question

This is not one clause with a gap. It is **two clauses that already answer the
question differently**, and any option below must break one of them or leave
both intact.

| line                                        | clause                                                                                     | what it implies                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `01-canonical-identity-and-encoding.md:268` | "A domain MUST declare which numeric form it admits"                                       | the **domain** is where numeric form lives                     |
| `01-canonical-identity-and-encoding.md:423` | "a third verifier-only path that **rejects non-canonical ratios** and malformed raw input" | a verifier **holding only bytes** must be able to reject `2/4` |

A verifier that holds only bytes can reject a non-canonical ratio only if it can
tell that the value _is_ a ratio without asking a domain. So §5.1.3 requires
context-free recognition, while §5.1.2.1 puts the numeric form under the
domain's authority. Both sentences are load-bearing and both are already in the
document.

Everything below is a way of resolving that, and the cost of each option is
mostly the cost of which sentence it disturbs.

## 1. Evidence gathered before arguing

| measurement                                                       | result                                                                                                                                                                                                                                                 | how                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| distinct `kind` discriminator values in RFC-0003                  | **39**, across **≥12 declared types** (`TransformationKind`, `LossSubject`, `PreservationSet`, `DebtScope`, `ScopeRef`, `AmbiguityRecord`, `TransformationDependency`, `ConsistencyModel`, `Coupling`, `LawStatus`, `WitnessPair`, `HandshakeMessage`) | `grep -ohE '\bkind: "[a-zA-Z0-9-]+"' docs/rfc/0003-heterogeneous-state-protocol/*.md` |
| is `cnp0` free as a **member name** anywhere in trinity?          | **yes — 0 occurrences.** The token appears twice as a _value_ (the `./t cnp0` command handle in the glossary and in the organ's JSON output); neither is a member name, and neither would collide.                                                     | `grep -rn '"cnp0"[[:space:]]*:'` — 0 hits; `grep -rn '"cnp0"'` — 2, both values       |
| does any substrate already compute references under `hsp-jcs@v0`? | **no** — the identifier appears only in the RFC, the contract, the probe, and chords                                                                                                                                                                   | `grep -rln 'hsp-jcs@v0'`                                                              |
| corpus cases whose expectation changes under option B             | **9 encoder-side, 9 verifier-side**; **6 rejection classes** become unreachable without a domain                                                                                                                                                       | computed from `corpus/manifest.json`                                                  |
| corpus positive cases whose canonical bytes change under option C | **9** (plus the 9 tagged negatives' raw input)                                                                                                                                                                                                         | same                                                                                  |

The third row is time-sensitive and decides more than any argument below: a
decision that changes canonical bytes is **free today and permanent after
adoption**, because §5.1.2.1's own rule is that a changed profile needs a new
identifier and new references.

## 2. Option A — globally reserved `kind` values

_This is what the implementation does today._

**Recognition algorithm.** A map is a tagged form iff it has a member named
`kind` whose value is exactly `"bytes"`, `"ratio"`, or `"fixed"`. Recognition
runs at every position of every document, before any domain is consulted.

**Extra members.** Must be forbidden:
`{"kind":"ratio","num":1,"den":3,"note":"x"}` would otherwise be a second
encoding of `1/3` with a rider, and §5.1.2's reduction rules exist precisely to
stop two byte sequences denoting one value. So the rule is "exactly the members
the form defines".

**Collision / counterexample.** `kind` is RFC-0003's universal discriminator: 39
values across at least 12 types. A tells every domain in every substrate, for
all time, that three particular _values_ of that word are the numeric profile's
property. The collision is not hypothetical in shape, only in timing:

```json
{ "kind": "fixed", "window": "..." }     // a fixed schedule, a fixed window
{ "kind": "bytes", "source": "sensor" }  // a payload described by its medium
```

Both are natural domain values. Under A the first is rejected (`fixed` takes
exactly `{kind, value}`) and the second is rejected (`bytes` takes exactly
`{kind, hex}`). The domain cannot say "I meant the ordinary word": the profile
has taken it.

**Can the same JSON mean different things?** No. Recognition is context-free, so
one byte sequence has exactly one reading. This is A's real strength and the
reason it satisfies §5.1.3 without amendment.

**Canonical bytes / corpus.** Unchanged; A is the status quo.

**Fail-closed.** Yes, aggressively — anything shaped like a tagged form and
malformed is rejected rather than reinterpreted.

**Migration cost.** Zero for this repository. Unbounded for anyone whose
ontology uses those three values of `kind`, and unpayable later: by the time a
collision appears, references already exist.

## 3. Option B — domain/schema-directed recognition

_Codex's working hypothesis: the wire encoder should not guess semantics from a
generic member named `kind`._

**Recognition algorithm.** The wire layer never interprets `kind`. A value is a
ratio only because the domain descriptor types that position as a ratio.
Recognition requires resolving a content-addressed descriptor first.

**Extra members.** Decided by the domain's schema, not by the profile.

**Collision / counterexample.** None at the wire level — that is the whole
point, and the diagnosis behind it is correct.

**Can the same JSON mean different things?** **Yes.**
`{"kind":"ratio","num":2,"den":4}` is a legal, canonical, ordinary map in an
untyped position and an invalid ratio in a typed one. The bytes and the digest
are identical in both readings, so §5.1.1(2) injectivity is not violated — but
"are these bytes valid CNP-0?" stops being a property of the bytes.

**The attack.** B does not merely need §5.1.3 reworded; it removes a capability
the corpus already exercises. Measured against the 112 pinned cases, a
schema-less verifier under B must **accept 9 inputs it currently rejects**, and
six rejection classes become unreachable:

```
ratio-not-reduced              c2-ratio-unreduced        (2/4)
ratio-zero-not-canonical       c2-ratio-zero-den-two     (0/2)
ratio-non-positive-denominator c2-ratio-negative-den, c2-ratio-zero-den
fixed-scale-in-value           c3-scale-in-value
bytes-hex-invalid              c6-bytes-uppercase, -odd-length, -non-hex
tagged-form-invalid            c6-bytes-length-member
```

Note what survives: every _wire-level_ rejection — invalid UTF-8, duplicate
member names, trailing bytes, malformed escapes, unpaired surrogates,
non-canonical order and whitespace — is untouched, because those are properties
of the byte stream. The loss is exactly the profile-level layer, and it is the
layer §5.1.3 names in the same breath as the verifier.

**Second attack: verification stops being portable.** Under B, two parties
holding the same bytes and the same `numeric_profile` can legitimately disagree
about validity because they resolved different domain descriptors. §5.1.2.1
requires only the two profile members at the root and never requires a domain
reference, so the profile explicitly contemplates documents that carry no domain
— under B those documents are only half-verifiable, and there is no way for the
bytes to say so.

**Third attack, weaker but worth stating.** A value that passed verification in
an untyped position and is later typed as a ratio by a domain revision would be
rejected then — so this fails closed rather than open, _provided_ re-validation
actually happens on domain change. It is a re-validation obligation B creates
and A and C do not.

**Canonical bytes / corpus.** Bytes unchanged. Corpus: 18 expectation changes
plus an amendment to §5.1.3.

**Fail-closed.** Yes at the domain level, and "unknown" at the byte level, which
is a different and weaker guarantee than the one §5.1.3 promises.

**Migration cost.** No byte changes; one normative amendment; every verifier
deployment gains a descriptor-resolution dependency, and an unresolvable
descriptor turns a verifiable document into an unverifiable one.

## 4. Option C — a reserved namespace member

**Recognition algorithm.** A map is a tagged form iff it carries the member name
`cnp0`, whose value is exactly `"bytes"`, `"ratio"`, or `"fixed"`. The name
`cnp0` is reserved in every position of a `cnp-0` document. A map without it is
an ordinary map whatever its other members are named, **including `kind`**.

```json
{ "cnp0": "bytes", "hex": "<even-length lowercase hexadecimal>" }
{ "cnp0": "ratio", "num": <int>, "den": <int> }
{ "cnp0": "fixed", "value": <int> }
```

**Extra members.** Same rule as A, and for the same reason: exactly the members
the form defines.

**Collision / counterexample.** Requires a domain to use `cnp0` as a member
name. Measured: **zero occurrences** across trinity today. Unlike A, the
reservation is one word rather than three values of a word the document uses 39
ways, and it is greppable in one command.

**Can the same JSON mean different things?** No — context-free, like A.

**Canonical bytes / corpus.** **Bytes change** for every tagged value. Measured
delta: 9 positive cases re-pinned (canonical text + digest), ~9 negative cases'
raw input updated, plus 3 new cases (a map with `kind:"ratio"` accepted as an
ordinary map; a `cnp0` member with an unknown value rejected; a `cnp0` tagged
form with an extra member rejected). About 21 of 112 cases touched, all
mechanical.

**Fail-closed.** Yes, and it fails closed on the predictable authoring mistake
too: someone who writes `{"kind":"ratio",…}` out of habit in a position the
domain types as a ratio gets a rejection, because an ordinary map is not a
tagged form.

**Migration cost.** Zero today — nothing computes references under `hsp-jcs@v0`
yet. After adoption it is a new profile identifier and a re-addressing of every
reference, by §5.1.2.1's own rule.

## 5. Option D, named and rejected

_Shape-directed recognition_: a map with exactly `{num, den}` is a ratio.
Rejected without further analysis: it collides with every ordinary map that
happens to have those two members, has no version handle, and cannot express "an
ordinary map that looks like a ratio" at all. It is strictly worse than A on A's
own weakness.

## 6. Recommendation

**Adopt C. Keep Codex's diagnosis; reject Codex's conclusion.**

The diagnosis is right: a wire encoder should not infer semantics from a generic
member named `kind`, and the 39-value enumeration shows how generic that member
is inside this very document. But the fix for "the discriminator is too generic"
is **a discriminator that is not generic**, not the removal of context-free
recognition.

The decision has two levels, and they should be taken in this order:

1. **Context-free (A/C) or context-dependent (B)?** Choose context-free. B costs
   an amendment to §5.1.3, 6 rejection classes that the corpus currently
   exercises, and the portability of the sentence "these bytes are valid CNP-0".
   A and C leave _both_ clauses of §0 true as written; B is the only option that
   requires one of them to change.
2. **Which discriminator?** Choose `cnp0` over `kind`. Same semantics as A, same
   satisfaction of §5.1.3, without borrowing three values of the document's
   universal discriminator.

**Against my own recommendation.** C's real cost is legibility: every other
discriminated union in RFC-0003 is spelled with `kind`, so C introduces a second
convention and readers will get it wrong. I judge that acceptable because the
mistake fails closed (§4) and because the alternative is a reservation that
cannot be withdrawn. If the steward weighs a single spelling convention above
collision safety, **A is a defensible second choice** — it is already
implemented, and its collision is latent rather than present. B is the only
option I would argue against, and only because of §5.1.3.

**If B is chosen anyway**, §5.1.3 must be amended in the same commit, saying
plainly that the verifier-only path takes bytes _and a resolved domain
descriptor_, and that a document without a domain is verifiable only at the wire
layer. Leaving §5.1.3 as written while adopting B would be the worst outcome
available: a promise in the specification that no implementation can keep.

## 7. Exact proposed normative wording (for C)

Replacing the tagged-form paragraph of §5.1.2.1, after "…and integers outside
the range are not members of this profile.":

> Raw bytes, exact ratios, and fixed-point values are written as **tagged
> forms**. A tagged form is a map carrying the reserved member name `cnp0`,
> whose value is exactly one of `"bytes"`, `"ratio"`, or `"fixed"`, and whose
> remaining members are exactly those that form defines:
>
> ```json
> { "cnp0": "bytes", "hex": "<even-length lowercase hexadecimal>" }
> { "cnp0": "ratio", "num": <int>, "den": <int> }
> { "cnp0": "fixed", "value": <int> }
> ```
>
> The member name `cnp0` is **reserved in every position** of a `cnp-0` document
> and MUST NOT be used for any other purpose. Recognition is therefore a
> property of the bytes alone: a verifier decides whether a value is a tagged
> form, and whether that form is canonical, without resolving a domain
> descriptor. A map carrying `cnp0` with any other value, or with a member the
> form does not define, MUST be rejected rather than reinterpreted as an
> ordinary map. A map that does not carry `cnp0` is an ordinary map whatever its
> other member names are, **including `kind`**, which this document uses as an
> ordinary discriminator elsewhere and which the numeric profile does not claim.
>
> Length is derived from `hex` and MUST NOT be repeated. A decoder MUST reject
> uppercase, odd-length, or non-hexadecimal content rather than normalize it.
> Ratio and fixed-point values additionally satisfy the reduction and scale
> rules above. A domain MUST declare which numeric form it admits; it MUST NOT
> accept both forms for one semantic value and treat them as equal.

Two consequential notes for whoever applies it:

- the existing sentence "A domain MUST declare which numeric form it admits" is
  **kept verbatim** and is not in tension with the above: the domain decides
  _which form is allowed_, the bytes decide _what form this value is_;
- §5.1.3 needs no change under C. Under B it would.

## 8. Minimal corpus delta (for C)

Mechanical, ~21 of 112 cases, all inside `probes/cnp-0-seed-v0`:

1. `tools/build_manifest.py`: change the three tagged-form constructors from
   `kind` to `cnp0`. This regenerates canonical text and digests for the 9
   positive cases `c2-ratio-third`, `c2-ratio-neg-third`, `c2-ratio-zero`,
   `c3-point-at-10e6`, `c3-point-at-10e3`, `c4-ratio-simplex`,
   `c4-fixed-simplex`, `c6-bytes`, `c6-bytes-empty`.
2. The 9 tagged negative cases keep their rejection classes; only their raw
   input changes: `c2-ratio-unreduced`, `c2-ratio-zero-den-two`,
   `c2-ratio-negative-den`, `c2-ratio-zero-den`, `c3-scale-in-value`,
   `c6-bytes-uppercase`, `c6-bytes-odd-length`, `c6-bytes-non-hex`,
   `c6-bytes-length-member`.
3. Three new cases the reservation makes testable:
   - `c2-kind-ratio-is-an-ordinary-map` — `{"kind":"ratio","num":2,"den":4}`
     **accepted**, unreduced and all, because it is not a tagged form. This is
     the case that distinguishes C from A, and it must be pinned or the
     distinction is untested.
   - `c2-cnp0-unknown-tag` — `{"cnp0":"decimal", …}` rejected.
   - `c6-cnp0-extra-member` — a tagged form with a member the form does not
     define, rejected.
4. `ts/cnp0.ts` and `ts/reject.ts`: the discriminator name in both code paths.
   The verifier's copy must be changed separately — it imports nothing, and that
   is the point.
5. Two mutations in `ts/mutate.ts`: one that makes the encoder recognize `kind`
   again, one that drops the reservation in the verifier. Both must turn the
   gate red on a reported expectation failure.

## 9. Falsifiers for this disposition

- **"`cnp0` is free."**
  `grep -rn '"cnp0"' ~/Projects/{trinity,warrant,sigma-glyph}` and the other
  ecosystem repos. A hit anywhere raises C's cost and the recommendation should
  be re-taken.
- **"B loses exactly 9 verifier rejections."** Disable tagged-form validation in
  `ts/cnp0.ts` and `ts/reject.ts` and run `./t cnp0`. Fewer than 9 flipped
  expectations falsifies the measurement this recommendation leans on.
- **"C is free today."** `grep -rln 'hsp-jcs@v0'` must return only the RFC, the
  contract, the probe, and chords. If a substrate has begun computing references
  under it, C is no longer free and A's "already implemented" argument gains
  decisive weight.
- **"`kind` is the document's universal discriminator."**
  `grep -ohE '\bkind: "[a-zA-Z0-9-]+"' docs/rfc/0003-heterogeneous-state-protocol/*.md | sort -u | wc -l`
  should print 39. A much smaller number would weaken the case against A.
- **"A's collision is real."** It is latent, not present: no current RFC-0003
  type uses `kind: "bytes" | "ratio" | "fixed"`. If the steward judges that no
  future domain will either, A's cost drops to zero and A wins on inertia. That
  judgment, not this document, is the actual decision.

## 10. What this document is not

Not a normative change, not an erratum, not an adoption. It does not modify
RFC-0003, `contracts/CANONICAL_ENCODING.v0.1.md`, or `probes/cnp-0-seed-v0`. The
implementation continues to do **A**, and the contract continues to record that
as implementation choice 1 with the question open. Choosing between A, B, and C
is the steward's, and only after that choice is made does any of §7 or §8 become
work.
