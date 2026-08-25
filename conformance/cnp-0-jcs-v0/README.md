# CNP-0-JCS conformance kit v0

**Implement RFC-0003 Part 01 §5.1 and check yourself, without asking us
anything.**

That is the whole purpose. Everything needed is in this directory: the normative
clauses, the interface your program must present, 63 cases with the exact bytes
and digests each one expects, and a runner that scores _your_ program.

```sh
python3 run_conformance.py --cmd './my-impl'
```

Python 3, standard library only. No network, no build step, no dependency on the
repository this kit was cut from.

## What is here

| file                     | what it is                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SPEC-EXTRACT.md`        | the normative clauses, verbatim from Part 01, each region carrying its byte range and its own digest                                                              |
| `INTERFACE.md`           | the CLI and NDJSON contract, and the closed rejection vocabulary                                                                                                  |
| `corpus/required.ndjson` | 63 cases; each line carries the input bytes and what `encode` and `verify` must answer                                                                            |
| `corpus/extended.ndjson` | 52 further cases — quantization, renormalization, scale descriptors, discrete circles — outside the required profile, shipped for implementations that go further |
| `run_conformance.py`     | the runner                                                                                                                                                        |
| `selftest.py`            | proves the runner actually fails a wrong implementation                                                                                                           |
| `MANIFEST.sha256`        | pins every file above                                                                                                                                             |
| `tools/build_kit.py`     | re-derives the corpus and the extract from the normative sources                                                                                                  |

## There is no reference implementation in this kit, on purpose

A kit that scored you by agreement with our encoder would be asking you to trust
our encoder. This one scores you against expected bytes and digests that are
written down, and every case carries the clause it comes from — so a
disagreement is a place in the specification you can go and read, not a verdict
you have to accept.

If you conclude an expected value is wrong, that is a finding about the
specification or about our corpus, and it is worth more to us than a passing
score. See **Disagreeing with this kit** below.

## The kit checks itself before it checks you

`MANIFEST.sha256` pins every shipped file, and the runner verifies all of them
before running a single case — and refuses any file the manifest does **not**
list, anywhere in the kit. There is no exempt path: `__pycache__` was one, and a
file hidden in it was unpinned, unnoticed, and scored a perfect run. Symlinks
and non-regular files are refused too, since a digest taken through a link
describes whatever the link pointed at when it was taken. A corpus that has been
edited — by anyone, including us — produces a score that means nothing, and a
runner that carried on regardless would report that meaningless score as a
result.

`--skip-kit-check` exists for working on the kit itself. It prints that the
result is not a conformance result, and the JSON report records
`kit_verified: false`.

## The runner is checked too

A runner that passes everything is indistinguishable from a runner that checks
nothing. `python3 selftest.py` runs deliberately wrong implementations past it —
20 controls — and asserts each is caught, and caught as the right _kind_ of
failure. It also runs a correct implementation, so "fails everything" cannot
masquerade as rigour.

Half of those controls answer every case **correctly** and get the shape of the
reply wrong: reversed order, a repeated id, an id nobody asked about, a wrong
answer followed by a right one, a blank record, a whitespace record, a JSON
object with `"id"` twice. Every one of them scored a perfect run against an
earlier version of this runner, which keyed replies by id and let the last write
win. They are here because that is how the interface was found not to be
enforced.

## How a failure is reported

Failures are separated by kind, because they are different findings:

| kind              | meaning                                            |
| ----------------- | -------------------------------------------------- |
| `verdict`         | accepted what must be rejected, or the reverse     |
| `category`        | rejected correctly, but named a different category |
| `canonical-bytes` | accepted, but produced different canonical bytes   |
| `digest`          | right bytes, wrong digest                          |

A reply that does not match `INTERFACE.md` at all is not scored. It is reported
as a **protocol violation** and the run ends there: a number computed from a
reply stream whose shape is unknown is a number that means nothing. The reply
schema is closed — exactly the fields the interface defines for that verdict, no
others — and diagnostics belong on stderr.

`category` is deliberately not counted as a wrong verdict. When more than one
category applies to an input, a different but defensible ordering of checks is a
disagreement about reporting, not about whether the input is canonical.

## What passing does and does not establish

**Does:** your implementation reproduces this corpus.

**Does not:**

- **Correctness.** The corpus is finite. It is evidence that a specific set of
  failures is caught, and nothing about the ones nobody thought of.
- **Ratification.** Tranche A3 additionally needs the contract, this kit, and
  steward ratification. See Part 01 §5.1.3.
- **Independent interoperability.** That is a higher level — `interop-confirmed`
  — needing two independently _maintained_ implementations or real external
  adoption, with parity evidence both ways. Passing here does not reach it, and
  until it holds no document may describe the encoding as independently
  interoperable or multi-implementation confirmed.

If you build an implementation you maintain yourself and it passes, that is
exactly the evidence the higher level is missing.

## Scope of the required profile

The 63 required cases cover the encode/verify contract: the integer bounds,
ratios and their rejections, one fixed value under two scale descriptors,
simplex sums, profile-identifier and pinned-constant mutation, byte strings,
normalization-distinct strings, member order, nested empty containers, and the
byte-level rejections a permissive parser cannot see.

Quantization, renormalization and the optional discrete circle family are
**not** in the required profile. They are different operations with a different
interface, not part of the canonical-encoding contract A3 names, and they ship
in `corpus/extended.ndjson` in the corpus's own format for implementations that
go further.

## Disagreeing with this kit

The honest limit of the no-trust claim: you can check your implementation
against written-down bytes without consulting us, but those bytes were computed
by us. If you believe one is wrong, the clause on every case is where to look —
Part 01 governs, and this extract does not.

A case where the specification and the corpus disagree is a defect in one of
them. Report it against RFC-0003 Part 01 §5.1.3; a corpus correction is a
normative change and is recorded as one.

## Provenance

The corpus is projected from `probes/cnp-0-seed-v0/corpus/manifest.json` and the
extract is quoted from Part 01 by byte range. `tools/build_kit.py --check`
re-derives both and fails on a one-byte drift in either direction, so this kit
cannot silently diverge from the specification it claims to carry.

Status: **candidate**. This kit is itself an A3 ratification requirement and is
not yet ratified.
