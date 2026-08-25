# Provenance

What must be recorded for the result to mean anything, and where it lives.

| item | where | status |
| --- | --- | --- |
| pack digest and per-file digests | `pack.json` | recorded |
| capsule quoted ranges, source digest | `verbatim.json` | recorded |
| sandbox image, pinned by digest | `harness/sandbox.py` | `rust:1.88-slim@sha256:38bc5a86…` |
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
