# Provenance

What must be recorded for the result to mean anything, and where it lives.

| item | where | status |
| --- | --- | --- |
| pack digest and per-file digests | `pack.json` | recorded |
| capsule quoted ranges, source digest | `verbatim.json` | recorded |
| sandbox image, pinned by id, built here | `harness/sandbox.py`, `harness/image/Dockerfile` | `sha256:c96a2a4f…` |
| withheld-file list | `pack.json` → `withheld` | recorded |
| model identity | below, and in each round record | recorded |
| per-round and per-turn prompt/output digests, written-file digests, cargo exits, served context | `transcript/round-NN.json` | rounds 1–2 recorded; the rest pending |
| full prompt and output text, per turn | `transcript/round-NN/` | round 1 recorded; round 2 predates partial-output capture and holds none |
| round budget, and any decision changing it | `budget.json` | recorded: six rounds, round 1 discounted |
| first compiling tree digest, before the corpus | `freeze.json` | pending the run |
| scoring, full | `evaluation/proctor-report.json` | pending the run |
| scoring, redacted for the model | `evaluation/feedback.json` | pending the run |

## Model

| | |
| --- | --- |
| name | `qwen3-coder:30b` |
| ollama id | `06c1097efce0` |
| architecture | qwen3moe, 30.5B parameters |
| advertised context | 262144 |
| served context | read from `ollama ps` per round, recorded in the round record |
| quantization | Q4_K_M |
| also attempted | `qwen3.8:27b-mlx`, ollama id `5642e97495e1`, qwen3_5, 27.8B, nvfp4 |

Rounds 1 and 2 used `qwen3.8:27b-mlx`. Round 1 never reached it — the proctor
wrote `--think high` as two arguments, so ollama read `high` as a model name and
exited. Round 2 produced nothing within an hour and was recorded as spent. The
steward then directed the switch to `qwen3-coder:30b`, which is code-tuned and
does not support thinking; `round.py` refuses `--think` for it rather than
sending a flag the server rejects.

A model card advertises what the weights support. `ollama serve` loads a
`num_ctx` that may be far smaller, and a prompt over that limit is silently
truncated at the front — in a multi-turn round, exactly where the specification
sits. Round 2 was served 65536 against a card claiming 262144. The served number
is therefore read while the model is resident and recorded per round, so a
truncated run is visible afterwards rather than inferred.

Ollama reports an id, not a weights digest. That id pins the local blob and
nothing about how it was produced; a different machine pulling the same tag is
not guaranteed the same bytes. Recorded as what it is.

## The sandbox image

Rounds 1–4 ran in `rust:1.88-slim@sha256:38bc5a86…`, which has no rustfmt
component. `cargo fmt` there exits 1 for every input, and freezing requires it to
exit 0, so no candidate in those rounds could have been freeze-ready. Round 4 was
terminated when its cargo output showed this; it counts against the budget.

From round 5 the image is built from `harness/image/Dockerfile` — the official
`rust:1.88` plus `rustup component add rustfmt` — and pinned by image id
`sha256:c96a2a4f16c4f95c62726034df62bbee5553a8bf61196d4fbbace90ef422be13`. The
Dockerfile is committed, which says more about how the image was produced than a
registry tag would. The component is added at image build time, once, over the
network; the sandbox that runs a candidate still gets `--network none`.

`preflight` now asks each required tool for its version inside the sandbox before
a round may start.

## How the model is invoked

`POST http://127.0.0.1:11434/api/generate`, `stream: false`, no `options`.

Rounds 1–3 used `ollama run`. Round 3's output came back with 118 terminal
control sequences spliced into the model's Rust; those bytes are the transport's,
not the model's, and nothing was repaired. Round 3 is recorded as it came back
and still counts against the budget — the rule forbidding a round the model
actually ran from being excused was written before that round started.

Per turn the record carries `prompt_eval_count`, `eval_count` and `done_reason`
from the API, alongside the prompt and output digests.

## Specification under implementation

RFC-0003 Part 01 §5.1.1–§5.1.3 at trinity `main@937d61f`. The capsule quotes it;
`pack.json` pins the quotation.

## The claim this apparatus can support

**implementation diversity candidate; maintenance independence false; A3
pending.**

One operator, one corpus, one arbiter of what counts. A second implementation
from the prose is evidence that the prose determines the bytes — not evidence of
an independent maintainer, which is what §5.1.3 requires and what no amount of
local work can manufacture.
