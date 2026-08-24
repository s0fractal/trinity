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
| `corpus/manifest.json` | 102 cases across all eight §5.1.3 categories |
| `corpus/circle256-lut.cnp0.json` | the pinned `circle256` sine table (§5.1.2.3 `pinned` strategy) |
| `tools/build_manifest.py` | the authoring tool: writes the manifest from an independent Python serializer |
| `tools/jcs_py.py` | that serializer |

The contract restatement lives at
[`contracts/CANONICAL_ENCODING.v0.1.md`](../../contracts/CANONICAL_ENCODING.v0.1.md),
including the implementation choices Part 01 does not state.

## Run

```sh
./probes/cnp-0-seed-v0/run.sh                                   # corpus + controls + parity
./probes/cnp-0-seed-v0/run.sh --warrant=/path/to/warrant        # with external parity
t cnp0                                                          # the same corpus, via the dispatcher
deno task test:unit                                             # the gate, as CI runs it
```

Expected counts from a clean checkout:

```text
cases selected      102
  circle            4     encode          60    file            1
  fixed-simplex     3     quantize        20    ratio-simplex   3
  renormalize       7     scale           4
encoder  accepted   28      encoder  rejected   32
verifier accepted   24      verifier rejected   36
transform accepted  26      transform rejected  16
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

All eight categories of §5.1.3, 102 cases:

1. zero, one, minus one, both integer bounds, and both overflow directions;
2. `1/3`, `-1/3`, canonical zero, and rejection of `2/4`, `0/2`, a negative and
   a zero denominator, overflow, floats, exponent notation, `1.0`, and duplicate
   member names at the root and nested;
3. one fixed integer under two scale descriptors producing different references,
   plus radix, places, and overflow rejections;
4. exact ratio and fixed-point simplexes, invalid sums, largest-remainder
   renormalization with a residual, a tie resolved by canonical coordinate
   identifier, the same components presented in a different order allocating
   identically, an anonymous vector using its integer index, zero-sum and
   negative-weight rejection;
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
7. `circle256` index equality, rotation, wrap, negative index, and a one-byte
   mutation of the pinned LUT;
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
checkout, and a mutation whose anchor has moved is reported as **UNTESTED**
rather than skipped — an unapplied mutation would otherwise look like a pass.

```text
control-unmutated                the unmutated copy is green
corpus-byte                      one byte inside a pinned canonical string  → red
expected-digest                  one pinned SHA-256 expectation             → red
expected-rejection-class         a negative case's expected class           → red
encoder-drops-member-sort        the encoder stops sorting members          → red
encoder-accepts-unreduced-ratio  the ratio reduction rule removed           → red
verifier-tolerates-whitespace    the verifier accepts whitespace            → red
lut-byte                         one byte of the pinned circle256 LUT       → red
empty-corpus                     zero cases selected                        → red
```

## External parity

`ts/parity_warrant.ts` feeds Warrant's own `examples/canon-vectors.json` through
this wire layer and requires byte-identical output and matching digests. It is
pinned to `s0fractal/warrant@ac63e4e9180c5878aa27159eebe1c4007909dce9`, reads
the checkout's actual revision, and discloses a mismatch rather than accepting
it silently.

Warrant is **not** a submodule and is not vendored. Without `--warrant=<path>`
the command reports `UNAVAILABLE` and says so in those words: a check that did
not run is not parity. The self-contained gate does not depend on it.

Observed at the pinned revision: **47 vectors selected, 47 byte-identical, 0
skipped**. That is evidence about `hsp-jcs@v0` only. Warrant's fixtures predate
CNP-0 and contain none of its profile members, ratios, fixed-point domains, or
rejection corpus — exactly as §5.1.2.1 warns.

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
