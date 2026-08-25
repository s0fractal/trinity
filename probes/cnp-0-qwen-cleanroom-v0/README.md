---
status: active
owner_voice: claude
next_verification: run the proctored rounds with qwen3.8:27b-mlx, freeze the first compiling candidate as its own commit, then score it against the 63 encode-kind corpus cases and record every divergence with the clause it traces to
graduation_target: null
---

# cnp-0-qwen-cleanroom-v0

> **Status: active probe, non-authoritative.** Apparatus only — no candidate has
> been produced yet. Final status of the experiment when it runs, fixed in
> advance so the result cannot be relabelled afterwards:
> **implementation diversity candidate; maintenance independence false; A3
> pending.**

## What this is, and the one thing it is not

RFC-0003 Part 01 §5.1.3 requires **two independent encoders** before Tranche A3
can close. The existing seed (`probes/cnp-0-seed-v0`) is one encoder plus
same-author code paths, and no amount of further writing by the same author
changes that. This probe asks a different question, which is answerable:

> Given the specification prose and nothing else, does a second implementation —
> written by a different model, in a different language, with no access to the
> reference — produce the same bytes?

A "yes" is **algorithmic diversity evidence**, not maintenance independence. The
operator is the same, the corpus is the same, the person deciding what counts is
the same. It does not close A3 and this probe never claims otherwise. A "no" is
the more interesting outcome: every divergence is a place where the prose failed
to determine what it promised to determine, and those are the seams worth
formalizing next.

## What the candidate is given

Four files, content-addressed as a pack (`provenance/pack.json`):

| file | what it is |
| --- | --- |
| `capsule/SPEC.md` | the specification, **75% verbatim quotation** of Part 01 §5.1.1–§5.1.2.2 |
| `capsule/INTERFACE.md` | the CLI/NDJSON contract and the closed rejection-category vocabulary |
| `capsule/EXAMPLES.ndjson` | three teaching examples, none of them corpus cases |
| `capsule/TASK.md` | the instruction and the file-emission protocol |

The capsule quotes rather than paraphrases on purpose. A paraphrase would test
whether the candidate agrees with the paraphraser, which is not the question.
`harness/pack.py` refuses to build a pack that names any implementation.

## What the candidate is not given

Mechanically listed in `provenance/pack.json` under `withheld`:

- the Trinity checkout;
- `ts/cnp0.ts`, `ts/jcs.ts`, `ts/reject.ts`, `ts/transforms.ts`;
- the Python authoring tool and its serializer;
- the corpus and every expected byte string and digest;
- `contracts/CANONICAL_ENCODING.v0.1.md`;
- any explanation of the reference implementation by Claude or Codex.

## Contamination, listed rather than denied

A clean room with an unlisted door is worse than no clean room. What leaks, and
why it is allowed to:

1. **The rejection-category vocabulary** is given in `INTERFACE.md`. It has to
   be: §5.1.3 requires "a stable rejection class" per rejected input, and two
   implementations cannot be compared on categories they name differently. The
   vocabulary is contract-level, published in `CANONICAL_ENCODING.v0.1` §4, not
   an implementation detail — but it does hand over one taxonomy of failure, and
   the evaluator therefore reports a category mismatch **separately** from a
   wrong verdict, so a defensible different ordering of checks is visible as
   such.
2. **Three worked examples** carry three canonical byte strings and two digests.
   They are deliberately outside the corpus.
3. **The curation of the capsule is mine.** I chose which clauses to include:
   §5.1.1–§5.1.2.2 and the corpus categories of §5.1.3, without the paragraph
   naming an existing JCS implementation, without the `i128` history, and
   without §5.1.2.3–§5.1.2.4, which the task does not require. A different
   curator would have drawn the line differently. This is the deepest
   contamination and it cannot be removed, only disclosed.
4. **The interface shape** — two subcommands, NDJSON, hex-encoded input — is
   mine. Hex input is forced by the problem (some corpus inputs are not valid
   UTF-8 and cannot survive being written inside a JSON string), but the rest is
   a design I imposed.

## The protocol

```sh
python3 harness/pack.py --write                       # pin what may be shown
python3 harness/round.py --workdir ~/cnp0-cleanroom   # round 1
python3 harness/round.py --workdir ~/cnp0-cleanroom --feedback provenance/transcript/round-01/cargo.txt
# … repeat until it compiles …
python3 harness/freeze.py --workdir ~/cnp0-cleanroom  # then commit, on its own
python3 harness/evaluate.py --candidate ~/cnp0-cleanroom/target/release/candidate
```

Rules the harness enforces rather than asks for:

- the working directory **must be outside** the Trinity checkout; `round.py`
  refuses otherwise;
- the proctor writes **only** files extracted from the model's output, byte for
  byte, and records a digest of each — it never edits, patches, or completes
  them;
- the only commands run there are `cargo fmt`, `check`, `build`, `test`;
- feedback before the freeze is **compiler and test output only**;
- feedback after the freeze carries the failing input, the expected category and
  the governing clause — never the expected bytes, never the expected digest.
  `evaluate.py` asserts that redaction against the corpus rather than trusting it.

Claude's role is proctor: assemble the capsule, carry text one way and compiler
output the other. Not to write, suggest, or repair the implementation.

## Scope of the score

The corpus holds 115 cases; **63** are `encode`-kind and exercise an encoder and
a verifier. Those are scored. Quantization, renormalization and the discrete
circle are not part of this task and count neither for nor against the
candidate.

Space is left for held-out and metamorphic cases supplied after the freeze:
`evaluate.py --heldout <manifest.json>` merges them and marks them.

## Provenance recorded

`provenance/` holds the pack digest, the model identity, and one record per
round: prompt digest and size, output digest, the digest of every file written,
cargo exit codes, elapsed time, and the full prompt and output text. `freeze.json`
records the tree digest of the first compiling candidate and asserts
`corpus_seen: false` at that moment.

| | |
| --- | --- |
| model | `qwen3.8:27b-mlx` — ollama id `5642e97495e1`, qwen3_5, 27.8B, 262144 context, nvfp4 |
| fallback | `qwen3-coder:30b` — ollama id `06c1097efce0` |
| toolchain | cargo 1.88.0 |
| specification | RFC-0003 Part 01 §5.1.1–§5.1.3 at trinity `main@937d61f` |
