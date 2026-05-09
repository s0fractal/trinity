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
      "action": "Create one verified process object from intake/raw.",
      "rationale": "The repository has intake mass but low verified hash coverage.",
      "expected_receipt": "A reproducible command or report proving the transition.",
      "commands": ["deno task intake:ingest ..."]
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
