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
| `capsule/SPEC.md` | the specification, **verbatim quotation** of Part 01 §5.1.1–§5.1.2.2 — machine-checked, 69% of the capsule's bytes |
| `capsule/INTERFACE.md` | the CLI/NDJSON contract and the closed rejection-category vocabulary |
| `capsule/EXAMPLES.ndjson` | three teaching examples, none of them corpus cases |
| `capsule/TASK.md` | the instruction and the file-emission protocol |

The capsule quotes rather than paraphrases on purpose. A paraphrase would test
whether the candidate agrees with the paraphraser, which is not the question —
and the claim is checkable, not asserted: `harness/build_capsule.py --check`
re-extracts every quoted region from Part 01 by byte range and fails on a
one-byte drift in either direction, with the source digest pinned in
`provenance/verbatim.json`. `harness/pack.py` refuses to build a pack that names
any implementation.

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
python3 harness/build_capsule.py --check               # the capsule is still verbatim
python3 harness/pack.py --write                        # pin what may be shown
python3 harness/round.py --workdir ~/cnp0-cleanroom     # rounds 1..3, no more
python3 harness/freeze.py --workdir ~/cnp0-cleanroom    # then commit, on its own
python3 harness/evaluate.py                            # scores the frozen tree only
```

### Isolation

Everything the candidate produces — its build, its tests, its binary — runs in a
container, defined once in `harness/sandbox.py`:

| | |
| --- | --- |
| image | `rust:1.88-slim@sha256:38bc5a86…` — pinned by digest, because a tag can be repointed |
| network | `--network none` |
| filesystem | one mount, the working directory; Trinity and the corpus are not mounted |
| privileges | `--read-only`, `--cap-drop ALL`, `--security-opt no-new-privileges` |
| limits | 2g memory, 256 pids, a `noexec` tmpfs, per-command timeout, output cap |

Running a model-generated Cargo project on the host was the first version of
this harness, and it was not a clean room at all: a `build.rs`, a test, or a
`.cargo/config.toml` can read whatever the proctor can read — including the
corpus this experiment exists to withhold.

The mount is checked before a build failure is believed. Docker Desktop shares
only configured paths and mounts an unshared one as an **empty** directory, which
produced "could not find Cargo.toml" — a harness fault that a careless proctor
would feed back to the model as its own compile error.

### The tree is a closed list

`harness/tree.py` holds it once, so `round.py` and `freeze.py` cannot disagree —
they used to: round accepted any relative path, freeze silently skipped
`.cargo`, so a `build.rs` or a `.cargo/config.toml` could shape the build and
never reach the frozen tree.

Allowed: `Cargo.toml`, optionally `Cargo.lock`, `NOTES.md`/`README.md`, and
`src/**/*.rs`, `tests/**/*.rs`. **Hard refusal** for `build.rs`, `.cargo/**`, a
path that escapes the directory, and a `FILE:` block emitted twice for one path
— two blocks mean the last one silently wins and which was meant is unknowable.
Nothing is skipped: a skipped file is one nobody records. Before any build, the
tree is checked again for build hooks whoever created them.

### The budget is three rounds, and it ends

Exactly three pre-freeze rounds. After the first `compiles=true` the only next
step is the freeze — a further prompt round would be tuning the candidate before
it is pinned. After a freeze, `round.py` refuses entirely.

If the third round does not compile, an outcome is recorded, once and
immutably:

> INCONCLUSIVE: no compiling candidate within the agreed three-round
> model/capsule/tooling budget; not evidence of RFC failure

That wording is deliberate. Nothing compiling inside a fixed budget says
something about the budget, the model, and the capsule — not about whether the
specification determines its bytes.

### The pack is re-derived, not trusted

Before every round and every freeze the capsule is re-hashed and compared with
`pack.json`. The prompt was built from the live files while the digest came from
the pin, and nothing compared them, so a future run could have recorded a pin
that described a pack it never sent.

### The feedback channel is closed, not merely narrow

Before the freeze the prompt is the pinned pack plus **the previous round's
cargo output and nothing else**, taken automatically and re-digested against
what that round recorded. There is no flag that accepts a file: an earlier
version had `--feedback <path>`, and a reviewer fed it a contract to prove the
point.

At most **three** rounds before the freeze. After round 1 the prompt changes only
by the appended machine output, and `pack_sha256` in every round record shows it.

### The proctor does not edit

`round.py` writes only blocks it extracted, byte for byte, digesting each before
anything else touches it. `cargo fmt` runs as `--check`; the earlier version ran
the rewriting form *after* digesting, so the digest recorded what the model wrote
and the tree held what the formatter produced.

The model is run with `--think high --hidethinking`, so draft `FILE:` blocks
inside reasoning cannot be mistaken for the answer, and the live ollama id is
checked against the recorded one before a round is attributed to that model.

### Scoring is strict

`evaluate.py` scores **the frozen tree, rebuilt clean**, never a working
directory: it requires `freeze.json`, re-digests `candidate/` against it, checks
the pack still matches the one the freeze was taken under, rebuilds from nothing
in a fresh directory, and runs the binary with the mount **read-only**. An
earlier version took a `--workdir` and scored whatever was in it, so a candidate
edited after seeing the corpus could have been presented as the clean-room
result.

The protocol is validated before anything is scored: exit status, one output
line per input in order, no duplicate or unknown ids, a schema per record — and
for `verify`, that the returned digest is the digest of the input bytes. An
earlier version counted any `ok: true` as correct there, which is the most
flattering possible bug.

### Negative controls, wired into `./t check`

`harness/selftest.py` (and `ts/harness_test.ts`, in `deno task test:unit`) makes
each guard refuse on demand — **24 controls**: a wrong `verify` digest, an encode
digest that is not of its own bytes, an out-of-order id, a rejection with no
category, an empty scope, an arbitrary feedback file, a second freeze, a symlink
in the frozen tree, an edited quotation, a pack naming an implementation, a
workdir inside Trinity, a `build.rs`, a `.cargo/config.toml`, a duplicated
`FILE:` block, a path escape, a stale pack at round and at freeze, a round after
something compiled, a round after the freeze, a fourth round, scoring without a
freeze, scoring a tree that no longer matches the freeze, and the isolation
itself.

The protocol refusals run **before** the sandbox is touched, on purpose: a budget
check that only works where Docker is installed is one that silently stops being
enforced. Tier-2 controls need Docker; where it is absent they
report **SKIPPED**, and a skipped control is never counted as a pass.

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
