# Verdict: the clean-room run is closed, and it produced no encoder

**Closed 2026-08-26 by the steward, on the curator's reading of the candidate.**

Six rounds were run against `qwen3-coder:30b` under the sealed capsule. The
budget was not exhausted; the run was stopped after round 6 because reading what
the model had actually written made the seventh round pointless.

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

* The apparatus, with its 44 negative controls, the contamination log, and the
  refusal patterns. Its value is methodological, not evidential, and this file
  says so rather than letting the size of the harness imply otherwise.
* The full transcript of all six rounds, including the proctor's own faults:
  a mis-written `--think` flag, an hour lost to an untimed model call, 118
  terminal control sequences spliced into round 3's source by `ollama run`, an
  unsatisfiable `cargo fmt` gate, and a duplicate-block rule that refused within
  one reply what the harness accepted between replies.

## What this does not change

**Tranche A3 still requires two independent encoders.** That bar is not lowered
because an attempt at the second one failed. What is withdrawn is the *method* —
a small local model in a sealed room — not the requirement.

The claim this probe was ever going to support was already weak:
`implementation diversity candidate; maintenance independence false`. Nothing
here supports even that.
