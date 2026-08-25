---
status: closed
owner_voice: claude
next_verification: none. Closed 2026-08-26 as protocol-deviated / curator-terminated / no encoder / no evidence about RFC determinacy — see VERDICT.md. A second independently maintained encoder is no longer an A3 blocker (Part 01 §5.1.3, restated 2026-08-26); it sits at the higher interop-confirmed level, and that restatement is not a consequence of this probe. If the bridge-for-outsiders goal is picked up again, the artifact to build is the conformance kit A3 now requires — most of it already exists in probes/cnp-0-seed-v0
graduation_target: null
---

# cnp-0-qwen-cleanroom-v0

> **Closed 2026-08-26: `protocol-deviated / curator-terminated / no encoder /
> no evidence about RFC determinacy`.** Six rounds — 1–2 on `qwen3.8:27b-mlx`,
> 3–6 on `qwen3-coder:30b`. The protocol changed substantially after it was
> accepted at `2ddf4dad`, so this is a historical failed attempt rather than a
> run of the accepted protocol. The only candidate that compiled returns its
> input unchanged from `encode`, answers `ok:true` from `verify`, and computes
> "SHA-256" with `DefaultHasher`. Read **[VERDICT.md](VERDICT.md)** before
> anything else here — the size of this apparatus is not evidence that it
> produced anything.

> **Status fixed in advance, before the run, so the result could not be
> relabelled afterwards:** *implementation diversity candidate; maintenance
> independence false; A3 pending.* The run did not reach even that. It produced
> no encoder, so it supports no diversity claim at all, and A3 stays exactly
> where it was.

## What this is, and the one thing it is not

RFC-0003 Part 01 §5.1.3 required **two independent encoders** before Tranche A3
could close — the requirement this probe was built to help meet. It was restated
on 2026-08-26, after this probe closed: independent maintenance moved to a higher
`interop-confirmed` level that does not block A3. That restatement rests on an
argument about what A3 was conflating, **not** on this probe's failure, and this
probe contributes nothing to either level. The existing seed (`probes/cnp-0-seed-v0`) is one encoder plus
same-author code paths, and no amount of further writing by the same author
changes that. This probe asks a different question, which is answerable:

> Given the specification prose and nothing else, does a second implementation —
> written by a different model, in a different language, with no access to the
> reference — produce the same bytes?

**Answered 2026-08-26: unanswered.** The model never implemented the operation,
so the question was never put. A failed implementation cannot distinguish "the
specification is under-determined" from "the implementer could not do it", and
here the second is plainly the case. See [VERDICT.md](VERDICT.md).

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
| image | built from `harness/image/Dockerfile`, pinned by id `sha256:c96a2a4f…`, because a tag can be repointed |
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

### A freeze records a round, not a directory

`freeze.py` used to look at no transcript at all: it would freeze whatever was in
the working directory, and the harness's own `freeze-once` test proved it by
freezing an invalid `Cargo.toml` no model had written.

A freeze now requires the last transcript round to have `model_exit == 0` and
`freeze_ready == true`, where freeze-ready means **all four** of `fmt`, `check`,
`build`, `test` exited 0 **and the build rewrote nothing of the model's**. Each
round records the tree digest twice — as emitted, and again after cargo has run —
so a test that rewrites `src/main.rs` is visible. `Cargo.lock` is the one file
cargo may write, and it is attributed as such rather than counted as tampering.

Before anything is copied, the current tree is compared byte-for-byte against
the round's `final_tree_sha256`, so a file edited between the round and the
freeze stops it; then the sources are rebuilt **from nothing**, without the
round's `target/`, because a tree that only builds against an existing cache is
not a tree that builds.

### A round is a conversation; the budget bounds how many

**Turns.** Inside a round the model works across turns. Each turn it is shown the
files it has written so far, verbatim, and — once the set is buildable — the
compiler and test output for exactly those files. It says `DONE` when it believes
the set is complete.

An earlier version demanded the whole program — a strict byte-level JSON parser,
a JCS serializer, the numeric profile, and a hand-written SHA-256 — in one
uninterrupted generation. That measured stamina, not whether the specification
determines its bytes, and the steward judged it unreasonable for any model. What
the model is *given* did not change: the pack is the same closed capsule, and
between turns it sees only its own files and its own build output. Nothing about
the corpus, and nothing from a human, crosses into a turn.

**Rounds.** Three by default, and after a freeze `round.py` refuses entirely.
Rounds end when a candidate is **freeze-ready** — not when one merely compiles.
That distinction was a real deadlock: the next round was blocked on `compiles`,
the freeze required `freeze_ready`, so a candidate whose `cargo check` passed and
whose `test` failed could do neither.

Every way a round can end goes through one place, including the ones that never
reach cargo — a failed generation, or output with no usable `FILE:` blocks. Those
leave the next round available with no feedback to carry, rather than stalling
the budget on a missing `cargo.txt`.

If the budget ends without a freeze-ready candidate — for any reason — an outcome
is recorded, once, with the digests of every counted round's output. The outcome
is a function of the rounds, so if the process dies between recording the last
round and writing it, the next invocation reconstructs it before refusing another
round: a crash must not erase the experiment's conclusion.

> INCONCLUSIVE: no freeze-ready candidate within the agreed N-round
> model/capsule/tooling budget; not evidence of RFC failure

That wording is deliberate. Nothing arriving inside a fixed budget says something
about the budget, the model, and the capsule — not about whether the
specification determines its bytes. `outcome.json` and the transcript are
committed together, in their own commit, so git makes a later deletion or rewrite
visible; there is no filesystem defence and none is claimed.

### A changed budget is a committed decision, and it cannot excuse a bad round

The default lives in code. Changing it is `provenance/budget.json`, a committed
artifact naming who decided and why — because a budget quietly raised by the
party it benefits is not a budget. `round.py` prints that decision every time it
runs.

Discounting a round is the sharper risk, so the file cannot simply assert one. A
round may be excused only if the **invocation itself failed and the model
produced nothing** — a non-zero exit with zero bytes, which is what a proctor's
bad flag looks like. Round 1 was exactly that: `--think high` written as two
arguments, so ollama read `high` as a model name and exited in about a second. A
round the model actually ran, and a round it ran out of time on, cannot be
excused however the file is written; three controls hold that line, including one
that tries to excuse a round with output and is refused.

### The model is called over the API, because `ollama run` is a display

Round 3 came back with 118 cursor-movement and erase-line sequences spliced into
the model's Rust — `"ratio-non-positive-denominat\x1b[29D\x1b[K"` recorded as the
model's own bytes. `ollama run` draws to a terminal even when its stdout is a
pipe. Re-deriving the intended text would mean emulating a terminal, which is
exactly the quiet repair that makes a transcript worthless, so nothing is
repaired: the round is recorded as it came back, and the transport was replaced.

`http://127.0.0.1:11434/api/generate` has no display layer and reports how many
tokens the prompt and the reply actually used, which is a better record than
scraping a column out of `ollama ps`. No `options` are sent, so the server's own
defaults govern and the result stays attributable to the model as configured
rather than to the proctor.

Three states the API makes visible, each of which now ends a round loudly rather
than being recorded as an answer: a reply containing any control sequence at all;
`done_reason: "length"`, which means the reply stops mid-token; and a prompt
whose token count reaches the served context, because ollama truncates an
over-long prompt at the **front** — where the specification sits.

### A malformed reply costs a turn — and a revision is not malformed

Round 3 ended on turn 2 because the model emitted `src/main.rs` six times in one
reply. The refusal now costs the turn, not the round: the model is shown,
verbatim, the transport rule it broke, under a heading saying this is about the
format of the reply and not its content. A control asserts that channel carries
nothing about the specification, the corpus, or the design. If the last turn of a
round is refused, the round ends there.

That rule changed **after** a round failed on it, which is the shape of a
self-serving change, so it is recorded as one: round 3 still counts, and the rule
forbidding a round the model actually ran from being excused was written before
round 3 started.

**Then the refusal itself turned out to be wrong.** It rested on "the last block
silently wins and which was meant is unknowable" — but the harness already
resolves a path emitted in turn 3 and again in turn 5 that way, silently, in
favour of the later one. Refusing within a reply what is accepted across replies
is an inconsistency, not a principle. And nothing was unknowable: between the
blocks the model said which it meant, every time —

> Wait, I realize that I've made a significant error in my implementation
> approach. … Let me correct this:

Rounds 3, 4 and 5 lost fourteen turns between them to it, six of round 5's eight.
What the original worry deserved was a record, not a refusal. Last wins
everywhere now, and `round.py` digests **every** block including the superseded
ones, so the transcript shows how many blocks a path got and which was taken.
Round 5 counts.

### A cap must bind where the files actually accumulate

`check_emitted` bounds one reply. Adding turns meant nothing bounded the tree the
turns built up: sixty-four files per reply, eight replies, and `tree.collect`
counted bytes per file and never counted files. The accumulated set is now
checked before every build, and `collect` enforces the cap on the whole tree —
the check existed, it was just pointed at the set that could not exceed it.

### The sandbox must be able to run the protocol's own checks

`cargo fmt -- --check` has to exit 0 before a candidate can be frozen. No
official rust image ships rustfmt — `rust:1.88-slim` and `rust:1.88` both install
the minimal rustup profile, and `cargo fmt` in either resolves to a shim that
reports the component missing and exits 1 for every input. So **no candidate
could ever have been freeze-ready**, in any round, whatever it wrote. The
harness had checked that the image was present and never that it could do the
work.

Round 4's own cargo output said so, and the round was stopped there. It counts
against the budget anyway: the model ran and produced work, and the rule
forbidding such a round from being excused was written before it started. That
the fault was the proctor's does not change what the rule says.

The image is now built from `harness/image/Dockerfile` and pinned by id, and
`preflight` asks each required tool for its version, offline, before a round can
start. A check that can never pass decides the experiment in the harness rather
than in the model.

### The pack is re-derived, not trusted

Before every round and every freeze the capsule is re-hashed and compared with
`pack.json`. The prompt was built from the live files while the digest came from
the pin, and nothing compared them, so a future run could have recorded a pin
that described a pack it never sent.

### The feedback channel is closed, not merely narrow

Before the freeze the prompt is the pinned pack plus **the model's own files, the
cargo output for them, and nothing else**, taken automatically and re-digested against
what that round recorded. There is no flag that accepts a file: an earlier
version had `--feedback <path>`, and a reviewer fed it a contract to prove the
point.

**Absence is not evidence of a pre-cargo failure.** Treating it that way was the
last bypass found: a recorded `cargo.txt` could be deleted and the next round ran
with no feedback and no complaint. A missing file is now legal only when the
round record itself says cargo never ran — no digest, no exits, and a recorded
error. A file that exists must have been pinned when it was produced, and must
still match.

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
each guard refuse on demand: a wrong `verify` digest, an encode
digest that is not of its own bytes, an out-of-order id, a rejection with no
category, an empty scope, an arbitrary feedback file, a second freeze, a symlink
in the frozen tree, an edited quotation, a pack naming an implementation, a
workdir inside Trinity, a `build.rs`, a `.cargo/config.toml`, a duplicated
`FILE:` block, a path escape, a stale pack at round and at freeze, a round after
something compiled, a round after a freeze-ready candidate, a compiling-but-failing round still
having a next round, a third non-ready round being the last, a failed generation
not deadlocking the budget, deleted feedback, feedback that was never pinned, an
unexplained missing feedback file, an outcome actually written with three round
digests, an outcome reconstructed after a crash, a round after the freeze, a fourth round, a freeze with no
transcript, a freeze on a round that was not freeze-ready, a freeze on a failed
generation, a tree edited between the round and the freeze, a build that rewrites
a source, scoring without a freeze, scoring a tree that no longer matches the
freeze, and the isolation itself.

**How many, exactly, is not written here.** Three documents carried three
hand-maintained totals — 37, 44, and 45 — and all three drifted apart because
nothing checked them. The count lives in `harness/controls.lock.json`, which
names every control and is compared for exact set equality against a live run;
`python3 harness/controls.lock.py --check` prints it. A floor was worse than a
stale number: `harness_test.ts` asserted `tier1.length >= 41`, so a control could
be deleted and every test stayed green.

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
cargo exit codes, elapsed time, the served context window, and the full
prompt and output text of every turn. `freeze.json`
records the tree digest of the first compiling candidate and asserts
`corpus_seen: false` at that moment.

| | |
| --- | --- |
| model | `qwen3-coder:30b` — ollama id `06c1097efce0`, qwen3moe, 30.5B, 262144 advertised context, Q4_K_M |
| also attempted | `qwen3.8:27b-mlx` — ollama id `5642e97495e1`, round 2, no output within an hour |
| served context | read from `ollama ps` while the model is resident and recorded per round; the server's `num_ctx` can be far below the card's number, and an over-long prompt is truncated at the front |
| toolchain | cargo 1.88.0 |
| specification | RFC-0003 Part 01 §5.1.1–§5.1.3 at trinity `main@937d61f` |
