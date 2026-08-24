---
status: active
owner_voice: claude
next_verification: obtain a genuinely independent second encoder — different implementer, different maintenance and custody boundary — reproduce this corpus with it, and measure a substrate computing real references under hsp-jcs@v0
graduation_target: null
---

# cnp-0-seed-v0

> **Status: active probe, non-authoritative.** This is the first executable
> candidate for RFC-0003 Part 01 §5.1.2–§5.1.3. It does **not** close Tranche
> A3, does not establish conformance, and is not evidence that any substrate has
> adopted CNP-0-JCS. Part 01 §5.1.3 requires two **independent** encoders; this
> probe contains one reference encoder plus code paths by the same author.

## Question

Can the encoding Part 01 §5.1.2.1 selects be run, and does its red state mean
something?

Part 01 selects CNP-0-JCS and then says, in §5.1.3, that
`CANONICAL_ENCODING.v0.1`, the corpus, two independent encoders, and a third
verifier-only path do not exist — so "§5.1 is specified but not yet
implementable as a conforming cross-substrate protocol". This probe builds the
executable part of that list and reports exactly which part it did not build.

## What is here

| Path | Role |
| --- | --- |
| `ts/jcs.ts` | `hsp-jcs@v0` — the wire layer: strict I-JSON reader over raw bytes, RFC 8785 serializer |
| `ts/cnp0.ts` | `cnp-0` — the profile layer: root identifiers, tagged forms, scale descriptors, simplex sums |
| `ts/reject.ts` | the **verifier-only rejection path**: its own byte-level scanner and UTF-8 validator, importing nothing |
| `ts/transforms.ts` | `renormalize_largest_remainder@v0`, quantization modes, `circle2n@v0` |
| `ts/runner.ts` | the corpus runner — exact selected/pass/reject counts |
| `ts/mutate.ts` | negative controls: one mutation per protected class, each required to turn the gate red |
| `ts/parity_warrant.ts` | external Warrant JCS parity, pinned, `UNAVAILABLE` when not attempted |
| `ts/cnp0_test.ts` | the gate, wired into `deno task test:unit` and therefore `./t check` |
| `corpus/manifest.json` | 112 cases across all eight §5.1.3 categories |
| `corpus/circle256-lut.cnp0.json` | the pinned `circle256` sine table (§5.1.2.3 `pinned` strategy) |
| `tools/build_manifest.py` | the authoring tool: writes the manifest from an independent Python serializer |
| `tools/jcs_py.py` | that serializer |
| `tools/warrant_bridge.py` | runs Warrant's own `canon()` over this corpus |

The contract restatement lives at
[`contracts/CANONICAL_ENCODING.v0.1.md`](../../contracts/CANONICAL_ENCODING.v0.1.md),
including the implementation choices Part 01 does not state.

## Run

```sh
./probes/cnp-0-seed-v0/run.sh                              # corpus + controls + parity
./probes/cnp-0-seed-v0/run.sh --warrant=/path/to/warrant   # with external parity
./t cnp0                                                   # the corpus, via the dispatcher
deno task test:unit                                        # the gate, as CI runs it
```

Every `deno` invocation in `run.sh` passes `--no-config`. The probe imports
nothing outside itself, and resolving trinity's root workspace would drag in
submodule members that are absent from a fresh clone.

Expected counts from a clean checkout:

```text
cases selected      112
  circle            8     encode          60    file            1
  fixed-simplex     3     quantize        20    ratio-simplex   3
  renormalize       9     scale           8
encoder  accepted   28      encoder  rejected   32
verifier accepted   24      verifier rejected   36
transform accepted  28      transform rejected  24
digest groups       4
```

Every count must be non-zero: a green run that selected nothing is reported as a
failure, not a pass.

## Why the corpus is not the encoder's own output

`corpus/manifest.json` pins canonical bytes and SHA-256 digests produced by
`tools/build_manifest.py` — a **Python** serializer and `hashlib` — not by the
TypeScript encoder the gate exercises. The runner additionally re-hashes each
pinned canonical string and fails if the manifest disagrees with itself, so a
typo in either field surfaces instead of being confirmed.

That makes the gate a comparison between two code paths rather than a comparison
of the encoder with itself. It does **not** make them independent
implementations: same author, same repository, same maintenance boundary. §5.1.3
means something stronger, and this probe does not supply it.

## What the corpus covers

All eight categories of §5.1.3, 112 cases:

1. zero, one, minus one, both integer bounds, and both overflow directions;
2. `1/3`, `-1/3`, canonical zero, and rejection of `2/4`, `0/2`, a negative and
   a zero denominator, overflow, floats, exponent notation, `1.0`, and duplicate
   member names at the root and nested;
3. one fixed integer under two scale descriptors producing different references,
   plus radix, places, and overflow rejections, and `unit_ref` accepted as a
   full digest but rejected when it is an opaque handle, a truncated digest, or
   uppercase;
4. exact ratio and fixed-point simplexes, invalid sums, largest-remainder
   renormalization with a residual, a tie resolved by canonical coordinate
   identifier, the same components presented in a different order allocating
   identically, an anonymous vector using its integer index, zero-sum and
   negative-weight rejection, and rejection of a coordinate identifier bound to
   two components (named or anonymous) — without uniqueness the tie-break is not
   a function of the input;
5. profile-identifier mutation, encoding-identifier mutation, an absent
   identifier, and a one-digit pinned-constant mutation changing the digest;
6. byte projections and their uppercase/odd-length/non-hex/extra-member
   rejections, NFC and NFD spellings of the same character kept **distinct**
   (§5.1.1(5) forbids normalizing), the full short-escape set, a `\u00xx`
   control escape, a non-BMP character, key-order permutation, whitespace, an
   escaped solidus, nested empty containers, UTF-16 member ordering, raw control
   characters, malformed and truncated escapes, both unpaired surrogate
   directions, a lone `0xff`, an overlong encoding, a surrogate half encoded as
   UTF-8, trailing bytes, trailing garbage, and a non-object root;
7. `circle256` index equality both ways, rotation, wrap at the modulus, and a
   one-byte mutation of the pinned LUT — with `-1`, `2^n`, and an out-of-range
   addition operand **rejected rather than normalized**: §5.1.2.4 says a point
   *is* an index in `[0, 2^n)`, so normalizing a non-point would silently make
   two distinct inputs equal;
8. every quantization boundary of §5.1.2.5–§5.1.2.6: positive and negative ties
   under all three modes, just-inside and just-outside the integer range,
   overflow by scale, `NaN`, both infinities, signed zero, a binary radix, and
   the case where a value that looks exact in decimal is not a binary64 value.

Floating-point fixtures pin the **f64 bit pattern**, not a decimal spelling: a
decimal literal would have to be parsed identically by every implementation
before the test could begin, which is the property under test. No float
multiplication occurs anywhere — a source f64 is decomposed into an exact
rational and the rounding decision is an integer comparison.

## Negative controls

`ts/mutate.ts` copies the probe to a temporary tree, applies exactly one
mutation, and requires the corpus to fail. It touches nothing in the live
checkout; a mutation whose anchor has moved is reported **UNTESTED** rather than
skipped; and red is not enough — the run must reach the runner's own reporting
path and print a `FAIL` line, because a mutation that merely crashes the process
proves nothing about the property it was meant to test.

**1 unmutated control + 10 mutations**, each of which went red on a reported
expectation failure:

```text
control-unmutated                        the unmutated copy is green (a control,
                                         not a mutation, and counted separately)
corpus-byte                              one byte inside a pinned canonical string
expected-digest                          one pinned SHA-256 expectation
expected-rejection-class                 a negative case's expected class
encoder-drops-member-sort                the comparator stops ordering members
circle-accepts-out-of-range-point        an out-of-range index becomes a point
renormalize-allows-duplicate-coordinate  the unique-coordinate rule dropped
encoder-accepts-unreduced-ratio          the ratio reduction rule removed
verifier-tolerates-whitespace            the verifier accepts whitespace
lut-byte                                 one byte of the pinned circle256 LUT
empty-corpus                             zero cases selected
```

## External parity — both directions

`ts/parity_warrant.ts` measures agreement with Warrant's JCS implementation in
both directions, because one direction only proves we can reproduce inputs
*they* chose:

- **A — our encoder over their vectors.** Their published
  `examples/canon-vectors.json` must come back byte-identical with matching
  digests. Observed at the pin: **47 selected, 47 byte-identical, 0 skipped.**
- **B — their canonicalizer, executed, over our corpus.**
  `tools/warrant_bridge.py` imports `<warrant>/impl/warrant.py` and calls
  `warrant.canon()` on every positive case here. Observed: **28 selected, 27
  byte-identical, 1 recorded divergence.**

**The revision is checked, not assumed.** `git rev-parse` establishes it (and
`--show-toplevel` confirms the directory is the work-tree root, so a stray
directory inside another repository cannot inherit that repository's revision).
A checkout that is not the pinned `ac63e4e9…` **FAILS**; to measure a different
revision the caller must state it with `--warrant-sha=<exact>`, which is
recorded in the report as disclosed. A revision that cannot be established also
fails: an unpinned parity claim is not evidence.

Warrant is **not** a submodule and is not vendored. Without `--warrant=<path>`
the command reports `UNAVAILABLE` in those words: a check that did not run is
not parity. If `python3` is unavailable, direction B reports `UNAVAILABLE` and
the overall status is `UNAVAILABLE` rather than `PASS` — half a measurement is
not a measurement. The self-contained gate does not depend on any of this.

### The divergence direction B found

`c6-utf16-order` is a member-name ordering case with a non-BMP key:

```text
ours    {"canonical_encoding":…,"numeric_profile":…,"𝄞":1,"\ufffd":2}
warrant {"canonical_encoding":…,"numeric_profile":…,"\ufffd":2,"𝄞":1}
```

RFC 8785 §3.2.3 orders member names by their **UTF-16 code units**: U+1D11E is
the surrogate pair `D834 DD1E`, so it sorts *before* U+FFFD. Warrant's Python
`canon()` uses `json.dumps(sort_keys=True)`, which orders by **code point**, so
it sorts *after*. The two agree on every name inside the BMP, and Warrant's own
vectors are all BMP — which is why their Python/Go/Rust parity never exercised
it.

This is a finding about the external implementation, not a defect here, and it
is narrow: it needs a non-BMP member name to appear. It is recorded in
`KNOWN_DIVERGENCES` rather than filtered away, and the pin cuts both ways — a
**new** divergence fails, and a recorded divergence that stops reproducing also
fails, because either means the file is out of date.

It matters for §5.1.2.1, which leans on Warrant's implementation as prior
evidence: that evidence covers the `hsp-jcs@v0` wire layer *for BMP member
names*.

## What this probe does not establish

- **Not two independent encoders.** One reference encoder, plus same-author code
  paths. §5.1.3's requirement is unmet and this is the main open item.
- **Not conformance, adoption, or ratification.** No substrate computes
  references under `hsp-jcs@v0` today; nothing here is signed or accepted by the
  steward.
- **Not federation evidence.** No cross-substrate agreement has been measured.
- **Not a proof of the encoder.** The corpus is finite. It is evidence that a
  specific set of failures is caught, and the negative controls are evidence
  that catching them is what makes the gate green.
