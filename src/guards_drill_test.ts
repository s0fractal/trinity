import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { runDrills } from "./x6C10_guards_drill.ts";

// The drill IS the falsifier for the guards themselves: every trust-root guard is
// fed the exact violation it exists to reject, and MUST reject it. A guard that
// accepts its attack (fired === false) is a hole — this reds CI until it is fixed.
// "A guard never seen firing is decoration" (x5d00_956417).
Deno.test("guards drill — every trust-root guard rejects its attack", async () => {
  const results = await runDrills();
  assert(results.length >= 5, "expected at least the 5 core drills");
  for (const r of results) {
    assert(
      r.fired,
      `HOLE: the "${r.guard}" guard (${r.protects}) accepted its attack [${r.attack}] — ${r.detail}`,
    );
  }
});
