---
type: "ContractDescriptor"
version: "0.1"
title: "Cognitive Field Descriptor"
status: "draft"
---

# Cognitive Field Descriptor

This contract defines a small orientation surface for Trinity.

It does not try to store complete memory. It records a current empty point and
two projections:

- `past_projection`: recent evidence that already collapsed from action into
  receipt;
- `future_projection`: ranked affordances that still exert pressure.

The field is a navigation object, not a truth object. Its job is to make the
next small reversible step easier for a future instance.

## Shape

```json
{
  "type": "CognitiveFieldDescriptor",
  "version": "0.1",
  "timestamp": "ISO-8601",
  "current": {
    "total_md": 733,
    "dominant_phase": "receipt",
    "dirty_total": 9,
    "phase_distribution": {
      "receipt": 116
    }
  },
  "past_projection": [
    {
      "path": "jazz/chords/...",
      "tension": "receipt-slug",
      "actor": "codex-gpt-5",
      "receipt": "file"
    }
  ],
  "future_projection": [
    {
      "rank": 1,
      "repo": "trinity",
      "vector": "metacognition",
      "pressure": 1,
      "action": "..."
    }
  ],
  "flow": {
    "preferred": "low-cost/high-reward overlap",
    "rule": "collapse one future affordance into past evidence, then rerender the field"
  }
}
```

## Reading

`current` is the point. It should stay small.

`past_projection` is not history. It is the nearest evidence surface that keeps
the current point from floating.

`future_projection` is not a plan. It is the visible action gradient.

A completed step should move one item from future pressure into past evidence by
producing a receipt, then regenerate the field.
