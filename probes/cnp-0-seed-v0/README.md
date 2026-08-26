---
status: active
owner_voice: claude
next_verification: move adoption-evidenced — get a substrate computing real references under hsp-jcs@v0 on a path that matters. A3 was ratified 2026-08-26 (Part 07 §17); adoption-evidenced and interop-confirmed are separate states and both are false, so this probe still may not be cited as showing the encoding is in use or independently interoperable
graduation_target: null
---

# cnp-0-seed-v0

> **Status: the reference implementation for RFC-0003 Part 01 §5.1.2–§5.1.3.**
> Tranche A3 was ratified on 2026-08-26 and this encoder is one of the artifacts
> it required.
>
> That settles the specification and **nothing else**. `adoption-evidenced` is
> **false** — no substrate computes references under CNP-0-JCS today — and
> `interop-confirmed` is **false** — this probe contains one reference encoder
> plus code paths by the same author, which is not an independently maintained
> implementation. Neither state blocks A3, and A3 being closed moves neither.

## Question

Can the encoding Part 01 §5.1.2.1 selects be run, and does its red state mean
something?

Part 01 selects CNP-0-JCS and then says, in §5.1.3, that the artifacts A3 needs
do not exist — so "§5.1 is specified but not yet implementable as a conforming
cross-substrate protocol". This probe builds the executable part of that list and
reports exactly which part it did not build.

§5.1.3 was restated on 2026-08-26 into two levels. A3 now asks for the contract,
the corpus, a reference encoder, a verifier-only path sharing no code with it, a
reproducible conformance kit, and steward ratification — **all six exist, and the
steward ratified A3 on 2026-08-26** (Part 07 §17). Two independently
maintained encoders moved up to `interop-confirmed`, which does not block A3.
For this probe that changes one thing: the missing item is now the **conformance
kit**, which is packaging work over what is already here, rather than an outside
maintainer nobody could commission.

## What is here

| Path | Role |
| --- | --- |
| `ts/jcs.ts` | `hsp-jcs@v0` — the wire layer: strict I-JSON reader over raw bytes, RFC 8785 serializer |
| `ts/cnp0.ts` | `cnp-0` — the profile layer: root identifiers, tagged forms, scale descriptors, simplex sums |
| `ts/reject.ts` | the **verifier-only rejection path**: its own byte-level scanner and UTF-8 validator, importing nothing |
| `ts/transforms.ts` | `renormalize_largest_remainder@v0`, quantization modes, `circle2n@v0` |
| `ts/runner.ts` | the corpus runner — exact selected/pass/reject counts |
| `ts/mutate.ts` | negative controls: one mutation per protected class, each required to turn the gate red |
| `ts/parity_warrant.ts` | external Warrant parity, both directions, over a materialized pinned tree |
| `ts/cnp0_test.ts` | the gate, wired into `deno task test:unit` and therefore `./t check` |
| `corpus/manifest.json` | 115 cases across all eight §5.1.3 categories |
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
cases selected      115
  circle            8     encode          63    file            1
  fixed-simplex     3     quantize        20    ratio-simplex   3
  renormalize       9     scale           8
encoder  accepted   29      encoder  rejected   34
verifier accepted   25      verifier rejected   38
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

All eight categories of §5.1.3, 115 cases:

1. zero, one, minus one, both integer bounds, and both overflow directions;
2. `1/3`, `-1/3`, canonical zero, and rejection of `2/4`, `0/2`, a negative and
   a zero denominator, overflow, floats, exponent notation, `1.0`, and duplicate
   member names at the root and nested; plus the three cases the reserved
   discriminator makes testable — a map with `kind:"ratio"` **accepted** as an
   ordinary map (unreduced and all, because the profile reserves `cnp0`, not
   `kind`), an unrecognized `cnp0` value rejected, and a tagged form with an
   extra member rejected;
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

**1 unmutated control + 12 mutations**, each of which went red on a reported
expectation failure:

```text
control-unmutated                        the unmutated copy is green (a control,
                                         not a mutation, and counted separately)
corpus-byte                              one byte inside a pinned canonical string
expected-digest                          one pinned SHA-256 expectation
expected-rejection-class                 a negative case's expected class
encoder-drops-member-sort                the comparator stops ordering members
encoder-recognizes-kind-again            the encoder reads `kind` as the tag
verifier-drops-the-reservation           an unknown `cnp0` value stops failing
circle-accepts-out-of-range-point        an out-of-range index becomes a point
renormalize-allows-duplicate-coordinate  the unique-coordinate rule dropped
encoder-accepts-unreduced-ratio          the ratio reduction rule removed
verifier-tolerates-whitespace            the verifier accepts whitespace
lut-byte                                 one byte of the pinned circle256 LUT
empty-corpus                             zero cases selected
```

## External parity — both directions, and what "PASS" does not mean

`ts/parity_warrant.ts` measures agreement with Warrant's JCS implementation in
both directions, because one direction only proves we can reproduce inputs
*they* chose:

- **A — our encoder over their vectors.** Their published
  `examples/canon-vectors.json` must come back byte-identical with matching
  digests. Observed: **47 selected, 47 byte-identical, 0 skipped.**
- **B — their canonicalizer, executed, over our corpus.**
  `tools/warrant_bridge.py` imports `impl/warrant.py` and calls `warrant.canon()`
  on every positive case here. Observed: **29 selected, 28 byte-identical, 1
  recorded divergence.**

Two statements, reported separately, because collapsing them into one word would
hide the finding:

| field | meaning |
| --- | --- |
| `status` — the **regression gate** | is the measurement exactly what is pinned? |
| `parityState` — the **finding** | `IDENTICAL`, `BOUNDED`, `DIVERGENT`, or `UNMEASURED` |

The current result is `status: PASS` with `parityState: BOUNDED`. **28 of 29 is
not parity.** It is agreement outside one recorded, byte-pinned disagreement.

### What is measured, and what cannot reach it

The pinned revision is **materialized** with `git archive` into a temporary tree,
and that tree is what runs. Checking `git rev-parse HEAD` was not enough: HEAD
says nothing about uncommitted edits, so a modified `impl/warrant.py` at the
pinned commit was being measured while the report said the revision matched
(found by codex against `e628382`). Local modifications under `impl/` or
`examples/` are now reported and **not** measured.

The revision must be present in the checkout. If it is not — or git or python3 is
missing — the result is `UNAVAILABLE` with `parityState: UNMEASURED`, never
`PASS`: a check that did not run is not parity.

To measure a revision other than the pin, the caller states it with
`--warrant-sha=<full 40-hex commit id>`. **A name is not a pin.** `HEAD`, a
branch, a tag, an abbreviated id, and an uppercase spelling are all refused as
`UNAVAILABLE`/`UNMEASURED`: each of them resolves in git and `git archive` would
produce a tree, but what they name can change, so recording one as the measured
revision would be recording a promise nobody made (`--warrant-sha=HEAD` did
exactly that until codex found it in `21af739`). A full 40-hex id is additionally
resolved with `git rev-parse --verify <id>^{commit}` and required to resolve to
itself, which also refuses an annotated tag object's own id.

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

`KNOWN_DIVERGENCES` pins the **exact byte pair**, both sides. Recording only the
case id would have made the entry an allowlist for arbitrary output: any bytes
for that id would have counted as "the expected divergence" (codex demonstrated
exactly this against `e628382` by altering `canon()` for that one case at the
pinned commit). Now four things fail — a new divergence, a *changed* divergence,
a recorded one that stops reproducing, and a change to **our** side of the pair.
Three tests cover it, including one that builds a git repository whose committed
canonicalizer is tampered for precisely that case.

This is a finding about the external implementation, not a defect here, and it is
narrow: it needs a non-BMP member name. It matters for §5.1.2.1, which leans on
Warrant's implementation as prior evidence — that evidence covers the
`hsp-jcs@v0` wire layer **for BMP member names**.

## What this probe does not establish

- **Not adoption, and not independent interoperability.** A3 is ratified; both
  of those are separate states and both are false. The kit A3 required is at
  `conformance/cnp-0-jcs-v0/`, projected from this corpus.
  `ts/conformance_cli.ts` exposes this encoder behind the kit's interface and
  scores 126/126, which shows the corpus is satisfiable by a real program — but
  the encoder and the corpus were written by the same hand, so agreement there
  is not evidence of anything except internal consistency.
- **Not independently maintained implementations.** One reference encoder, plus
  same-author code paths. That is no longer an A3 blocker, but it is exactly what
  `interop-confirmed` asks for, so this probe may not be cited as showing
  implementation diversity or independent interoperability.
- **Not conformance, adoption, or ratification.** No substrate computes
  references under `hsp-jcs@v0` today; nothing here is signed or accepted by the
  steward.
- **Not federation evidence.** No cross-substrate agreement has been measured.
- **Not a proof of the encoder.** The corpus is finite. It is evidence that a
  specific set of failures is caught, and the negative controls are evidence
  that catching them is what makes the gate green.
