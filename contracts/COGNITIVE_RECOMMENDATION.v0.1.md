---
type: "ContractDescriptor"
version: "0.1"
title: "Cognitive Recommendation Signal"
status: "active"
---

# Cognitive Recommendation Signal

This contract defines a small control layer that turns repository state into an
actionable development signal.

The signal is intentionally conservative. It does not decide truth. It ranks
where the next unit of engineering effort should go so the ecosystem can move
from lower-certainty thought phases toward reproducible receipts, formulas, and
crystals.

## 1. Input Surface

A recommendation signal MAY use:

- current ontology coverage from the shared scanner
- current thought-phase distribution
- recent cognition snapshots and deltas
- git status and submodule status
- intake projections and public-candidate queues

It MUST NOT treat raw counts as proof. Counts are pressure indicators only.

## 2. Output Shape

```json
{
  "type": "CognitiveRecommendationDescriptor",
  "version": "0.1",
  "timestamp": "ISO-8601",
  "basis": {
    "scanner": "tools/scanner_core.ts",
    "git_status": "observed",
    "snapshot": "optional"
  },
  "recommendations": [
    {
      "rank": 1,
      "repo": "trinity",
      "vector": "metacognition",
      "phase_from": "hypothesis",
      "phase_to": "receipt",
      "pressure": 0.73,
      "action": "Create one verified process receipt from current substrate state.",
      "rationale": "The repository has intake mass but low verified hash coverage.",
      "expected_receipt": "A reproducible command or report proving the transition.",
      "commands": ["deno task cognition:recommend"]
    }
  ]
}
```

## 3. Repo Vectors

- `trinity`: metacognition, orchestration, contracts, cross-repo receipts.
- `myc`: publication surface, semantic objects, public process trace.
- `liquid`: FQDN/hash mechanics, resolver boundary, ledger discipline.
- `omega`: deterministic execution, fixtures, test receipts, replay.

## 4. Control Rule

Prefer the recommendation that increases verified reality without starving
imagination:

1. raw or hypothesis pressure should move toward proposal or experiment
2. experiment pressure should move toward receipt
3. receipt pressure should move toward formula
4. formula pressure should move toward crystal only after hash verification
5. stale, duplicated, or rejected material should move toward compost

The target state is not maximum crystal. The target state is balanced
circulation with enough crystal to make future speculation cheaper and safer.

## 5. Closure Feedback

Pressure is a phase-ratio indicator; it does not know whether a specific
recommended action has already been done. Without feedback, a one-shot action
("turn FQDN DNS into a hash-verified fixture") keeps re-surfacing every run for
as long as the underlying ratio holds — even after the fixture exists. A
recommendation that repeats after it has been satisfied trains voices to ignore
the signal.

Each recommendation therefore carries a stable `signal_key` of the form
`<repo>/<vector>` (e.g. `liquid/identity-resolution`). A receipt MAY declare it
has satisfied that signal by carrying `satisfies_signal: <signal_key>` in its
frontmatter. Closure is **explicit and voice-declared** — it MUST NOT be
inferred by fuzzy-matching a receipt's topic against an action string.

When a satisfying receipt exists in the ledger, the recommendation:

- keeps its honest phase-ratio `pressure` (the structural state is still real),
- is annotated with `satisfied`, `satisfied_by`, and `satisfied_at_block`,
- is **tier-sorted below all unsatisfied signals**, so consumers that take the
  top recommendation (the daemon, recommend-to-chord) act on live work.

Suppression is tied to the receipt's existence, which makes it self-correcting:
if the proof is removed (e.g. the fixture is deleted), the receipt's falsifier
fires, the receipt is retracted, and the signal returns to the top tier.
