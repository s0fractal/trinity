# Provenance

What must be recorded for the result to mean anything, and where it lives.

| item | where | status |
| --- | --- | --- |
| pack digest and per-file digests | `pack.json` | recorded |
| withheld-file list | `pack.json` → `withheld` | recorded |
| model identity | below, and in each round record | recorded |
| per-round prompt digest, output digest, written-file digests, cargo exits | `transcript/round-NN.json` | pending the run |
| full prompt and output text | `transcript/round-NN/` | pending the run |
| first compiling tree digest, before the corpus | `freeze.json` | pending the run |
| scoring, full | `evaluation/proctor-report.json` | pending the run |
| scoring, redacted for the model | `evaluation/feedback.json` | pending the run |

## Model

| | |
| --- | --- |
| name | `qwen3.8:27b-mlx` |
| ollama id | `5642e97495e1` |
| architecture | qwen3_5, 27.8B parameters |
| context length | 262144 |
| quantization | nvfp4 |
| fallback | `qwen3-coder:30b`, ollama id `06c1097efce0` |

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
