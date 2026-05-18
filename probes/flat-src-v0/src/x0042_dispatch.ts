// 0042 = 0 (void/primitives) → 0 → 4 → 2 (recursive archetype refinement)
// "primitive dispatching by name" — entry-level void operation.
//
// coordinate: 0042
// handles: [dispatch, dispatchPrimitive]
// rationale: living at void/primitives bucket; refines to action-mirror-pair (4-2)
//            because dispatch is action-bound but reflective (knows its own name).

export function dispatchPrimitive(name: string): string {
  return `[dispatch:0042] ${name}`;
}
