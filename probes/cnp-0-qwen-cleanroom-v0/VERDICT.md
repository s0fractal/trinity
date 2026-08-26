# Verdict: the clean-room run is closed, and it produced no encoder

**Closed 2026-08-26 by the steward, on the curator's reading of the candidate.**

    protocol-deviated / curator-terminated / no encoder /
    no evidence about RFC determinacy

Each term is load-bearing, and the first is the one a reader should see before
the rest.

## This is not a run of the protocol that was accepted

The apparatus was reviewed and accepted at `2ddf4dad`. What ran afterwards was
not it. The changes were made at the steward's direction and each is recorded in
its own commit, but their sum is that **this probe is a useful historical failed
attempt, not an execution of the accepted protocol**, and no conclusion here may
be read as one.

| what changed | accepted at `2ddf4dad` | what ran |
| --- | --- | --- |
| capsule `TASK.md` | one uninterrupted generation | work proceeds across turns |
| pack digest | `fac360f6…` | `ec6a6aee…` (rounds 3–6) |
| model | `qwen3.8:27b-mlx` | `qwen3-coder:30b` (rounds 3–6) |
| transport | `ollama run` | `127.0.0.1:11434/api/generate` (rounds 4–6) |
| round budget | 3 | 6, with round 1 discounted |
| duplicate `FILE:` blocks | refused | last wins, all blocks digested |
| sandbox image | `rust:1.88-slim@sha256:38bc5a86…` | locally built with rustfmt (rounds 5–6) |

The **withheld boundary did not change**: the model never saw the corpus, the
seed implementation, the expected bytes or digests, and the feedback channel
stayed machine-output-only throughout. What changed is the task instructions and
the exact pack — which is a different thing from a leak, and is why the pack
digest is pinned per round rather than once.

## Which model ran which round

| round | model | outcome |
| --- | --- | --- |
| 1 | `qwen3.8:27b-mlx` | model never invoked — proctor wrote `--think high` as two arguments |
| 2 | `qwen3.8:27b-mlx` | no output within 3600s |
| 3 | `qwen3-coder:30b` | ended on a duplicate-block refusal; output corrupted by `ollama run` |
| 4 | `qwen3-coder:30b` | terminated by the proctor: `cargo fmt` unsatisfiable in that image |
| 5 | `qwen3-coder:30b` | 8 turns, six lost to the duplicate-block rule; not freeze-ready |
| 6 | `qwen3-coder:30b` | 8 turns; compiled on turns 4–6, regressed on 7–8 |

An earlier draft of this file said all six rounds used `qwen3-coder:30b`. That
was wrong.

## What the candidate is

Round 6 produced the only candidate that compiled — turns 4, 5 and 6, source
digests `a62b3e77`, `88bd4e8d`, `d37cd10e`. Reconstructed from the transcript,
it is 212 lines of Rust that compiles because it does not do the work.

**`encode` does not canonicalise.** In the model's own words:

```rust
// For now, just return the input as canonical (placeholder)
let sha256 = sha256_hex(bytes);
format!(r#"{{"id":"{}","ok":true,"canonical_hex":"{}","sha256":"{}"}}"#,
        id, hex_encode(bytes), sha256)
```

It returns the input unchanged. Canonicalisation is the operation being tested.

**`verify` does not verify.** The same placeholder: `ok: true` for any input
containing the two profile strings, whatever its bytes.

**SHA-256 is not SHA-256.** `sha256_hex` calls `DefaultHasher` — SipHash-1-3,
64 bits — formatted into a 64-character field:

```
"abc" produces  000000000000000000000000000000000000000000000000c03bc3a0042630f2
SHA-256 is      ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
```

The capsule required FIPS 180-4 implemented from scratch. The model's comment on
the line reads `// This is a placeholder`.

**There is no JSON parser.** `extract_field` is a substring search;
`determine_command` is `s.contains(r#""canonical_encoding":"hsp-jcs@v0""#)`.
No tokeniser, no value model, no member ordering, no duplicate-name detection,
no escape handling — the byte-level questions §5.1.1 rule 4 exists for cannot be
asked of a program that never parses.

**`cargo test` exited 0 because there are no tests.** `grep -c '#\[test\]'`
returns 0. An earlier note in this session called that "passes its own tests";
that was wrong.

The `ParseError` enum lists seventeen rejection categories, of which the code
constructs exactly one (`InvalidUtf8`). About forty percent of the file is the
enum-to-string table for categories nothing ever raises.

Scored against the 63 encode-kind corpus cases this would fail essentially all
of them, and the failures would be uninformative.

## Why the run was stopped rather than finished

The seventh round was about to be spent arguing over `cargo fmt -- --check` — a
style gate — on a program that does not implement the specification. The
proctor spent six rounds hardening the measuring instrument and only then read
what it was measuring. That is the honest summary of this probe's cost.

## What this does and does not show

It shows nothing about RFC-0003. A failed implementation cannot distinguish "the
specification is under-determined" from "the implementer could not do it", and
here the second is plainly true. **This is not evidence against the
specification, and it is not evidence for it.**

Nor is it evidence about clean-room methodology in general. The apparatus worked:
the sandbox held, the pack stayed pinned, the feedback channel stayed closed, and
the guards caught the proctor twice — once for a deleted `cargo.txt` the proctor
had itself failed to write, once for a freeze criterion nothing could satisfy.

## What is kept

* The apparatus, with its negative controls (named exactly in
  `harness/controls.lock.json`), the contamination log, and the
  refusal patterns. Its value is methodological, not evidential, and this file
  says so rather than letting the size of the harness imply otherwise.
* The full transcript of all six rounds, including the proctor's own faults:
  a mis-written `--think` flag, an hour lost to an untimed model call, 118
  terminal control sequences spliced into round 3's source by `ollama run`, an
  unsatisfiable `cargo fmt` gate, and a duplicate-block rule that refused within
  one reply what the harness accepted between replies.

## What this does not change — recorded at closing

**Tranche A3 still requires two independent encoders.** That bar is not lowered
because an attempt at the second one failed. What is withdrawn is the *method* —
a small local model in a sealed room — not the requirement.

The claim this probe was ever going to support was already weak:
`implementation diversity candidate; maintenance independence false`. Nothing
here supports even that.

## Subsequent steward disposition

*Recorded after the above, and deliberately not folded into it. The verdict is
what was concluded from the run; this is a separate decision taken afterwards,
and reading the two as one would let a later ruling look like a finding.*

The steward directed, and the reviewer concurred, that a second independently
maintained encoder is **no longer a hard blocker on Tranche A3**. The reasoning
is not that this probe failed — a failed attempt is no argument about a
requirement — but that A3 as written conflated four separable things: normative
determinacy of the bytes, the existence of an implementation, independently
confirmed interoperability, and actual adoption. The third and fourth depend on
an external maintainer the project cannot create, so the whole RFC sat blocked
on someone else's decision.

A3 is being restated as two levels: a technical gate the project can meet and
verify, and an `interop-confirmed` level above it that requires independently
maintained implementations or real external adoption. The second does not block
A3 or anything downstream, but without it no document may claim "independently
interoperable" or "multi-implementation confirmed".

That change lives in its own normative commit against Part 00, Part 01 §5.1.3,
`CANONICAL_ENCODING.v0.1` §7 and Part 07. **A3 is not ratified by it.** Its
status after that commit is:

> A3 ratification gate defined; single-implementation evidence present;
> conformance kit and steward ratification pending; independent interoperability
> unconfirmed.

Nothing in this probe contributes to meeting that gate.
