# RFC-0004: Canonical Identity and Encoding

- **Status:** Draft
- **Authors:** s0fractal + model collaborators
- **Home:** https://github.com/s0fractal/trinity —
  `docs/rfc/0004-canonical-identity-and-encoding.md`
- **Parent:**
  [RFC-0003 — Heterogeneous State Protocol: Architecture and
  Ratification Map](0003-heterogeneous-state-geometries.md), which holds the
  theses, non-goals, terminology, dependency graph, failure-mode catalogue, and
  open problems this document depends on.
- **Ratifies:** Tranche A (A1–A4), Tranche J (J1–J3)
- **Depends on:** nothing — this is the root of the dependency graph
- **Created:** 2026-08-03 (split from RFC-0003 after four rounds of external
  critique; see [REVISION HISTORY](0003-REVISION-HISTORY.md))

> **Section numbers are inherited and stable.** This document keeps the section
> numbers it carried inside RFC-0003. They are not renumbered from 1, because
> ledger chords and prior receipts cite them, and a cross-reference that
> silently changes meaning is the failure this protocol exists to prevent. A
> reference of the form §N.M is resolvable through RFC-0003's §22 map.

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
[REVISION HISTORY](0003-REVISION-HISTORY.md) §1.

#### 5.1.2 Floating point

Floating point is where content-addressed systems usually die, and this RFC
proposes a probability simplex as a first-class domain (§6.4), so it walks
directly into the problem.

In canonical form:

1. `NaN` and the infinities MUST be rejected. They are not values a state may
   hold; a computation producing one has failed and MUST surface as a validation
   error, not as bytes.
2. Negative zero MUST be normalized to positive zero before encoding. `-0.0` and
   `+0.0` compare equal and MUST NOT produce different references.
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
case for the leading Tranche A3 candidate (§17.1.1) and the one place §6.4's
probability simplex collides with it.

Two patterns are admissible. Both keep every number in the integer domain and
both are exact:

```json
{ "kind": "ratio", "num": <int>, "den": <int> }
{ "kind": "fixed", "value": <int>, "scale": <int> }
```

For `ratio`, the canonical form MUST satisfy:

1. `den > 0` — sign lives in `num` only, so `-1/3` has exactly one encoding;
2. `gcd(|num|, den) == 1` — reduced to lowest terms, so `2/6` is not a second
   encoding of `1/3`;
3. zero is `{ num: 0, den: 1 }` and nothing else;
4. both components lie inside the encoding's integer domain.

For `fixed`, `scale` MUST be declared by the state domain rather than per value,
and all values in one domain MUST share it — otherwise comparing two points
means rescaling, and rescaling reintroduces the rounding the rule exists to
remove.

**Reduction rules are not optional decoration.** Without them the encoding is
deterministic but not injective in the direction that matters: two byte
sequences would denote one value, so two states that are equal would carry
different references, and every equality check downstream would silently be
comparing encodings rather than values.

**The simplex additionally constrains the sum.** A probability vector MUST sum
to exactly one under exact arithmetic — `Σ num_i / den_i == 1` for ratios, or
`Σ value_i == scale` for fixed-point with a shared scale. This is a validation
rule (§6), not an encoding rule, and it is the reason the simplex cannot use
floats: "sums to one after rounding" is not a property two independent
implementations will agree on.

A string form such as `"1/3"` is a third option, and RFC 7493 §2.2 does
recommend strings for numeric values outside the safe integer range. It is not
recommended here: it moves the reduction rules into a string grammar that every
implementation must parse identically, which is more surface for the second
independent implementation to diverge on, and divergence there is exactly what
canonical encoding exists to prevent.

Selecting between these remains Tranche A3's decision. This section states what
any selection must satisfy.

#### 5.1.3 Parity is proven, not assumed

Every substrate implementing the encoding MUST verify against a shared fixture
set, in the manner `fixtures/canon-vectors.json` already establishes for the
canonical hash. The fixtures MUST include the adversarial cases — `-0.0`,
denormals, non-normalized equivalent strings, key-order permutations, nested
empty containers, and the largest and smallest representable values.

Cross-substrate parity that has not been measured is a hope, and this document
does not accept hopes as evidence anywhere else.

**Encoding selection is deferred.** This RFC states the requirements above but
does **not** select the encoding. That selection is a federation-wide commitment
affecting substrates that are not parties to this RFC, and it deserves its own
contract with its own test vectors rather than a clause inside a state domain
proposal. It is filed as decision request §22 Tranche A3 and open problem
§20.15.

Until that contract exists, §5.1 is specified but not yet implementable across
substrate boundaries, and this document does not pretend otherwise.

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
   **Every existing `h.` handle over an already-canonical body stays valid
   unchanged.** This is a substantially cheaper decision than choosing between
   two identity schemes, which is how it was framed before the inventory.
2. **Trinity already ships a second structural canonicalizer.**
   `packages/canonical-receipt` is live on jsr and implements RFC 8949 canonical
   CBOR, forbidding floats by throwing. It is not a rival to JCS either — it
   targets binary receipts rather than JSON documents — but a federation with
   two live structural canonicalizers MUST say which applies where, and this RFC
   previously did not know the second one existed.
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
directly, and that the float cases §5.1.2 most cares about are not yet in the
corpus.

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
