# 0042 — dispatch primitive

Demonstrates code/doc/test triplet co-located by filename prefix.

## Coordinate

`0042` — primary archetype `0` (void/primitives). Recursive refinement: `0→0→4→2`
= "primitive of primitives, action-bound, mirror-aware". Function returns its own
identity tag — a self-reflective primitive operation.

## Handles

- `dispatch` (canonical short)
- `dispatchPrimitive` (canonical long, matches export name)

## Exports

- `dispatchPrimitive(name: string): string`

## Why here

Lives in the `0` bucket because it's a void-level primitive — minimal, no state,
self-describing. Cross-bucket consumers reach it via `@x0` alias.
