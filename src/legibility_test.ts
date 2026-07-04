import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { auditAll, checkLegibility } from "./x6C30_legibility.ts";

// The first-screen legibility contract (codex x4d00_956665): every PRESENT root
// README must, in its first ~1500 chars, name the product role, the trust
// primitive, an authority boundary, and one verify command — and must not lead
// with mysticism or claim things the tree contradicts. This is the regression
// guard so a living/generated README cannot silently re-mislead a cold reader.
// (Absent spoke READMEs = submodule not checked out = not this job's failure.)
Deno.test("legibility — every present federation README satisfies the first-screen contract", () => {
  for (const v of auditAll()) {
    if (!v.present) continue;
    assert(
      v.ok,
      `${v.repo} README fails the first-screen contract — missing {${
        Object.entries(v.markers).filter(([, x]) => !x).map(([k]) => k).join(
          ", ",
        )
      }}${
        v.contradictions.length
          ? `; contradicts-tree: ${v.contradictions.join(",")}`
          : ""
      }${
        v.mysticism_before_product
          ? `; myth-before-product: "${v.mysticism_before_product}"`
          : ""
      }`,
    );
  }
});

Deno.test("legibility — the guard actually fires on a mystical / contradicted first screen", () => {
  const bad = checkLegibility(
    "fake",
    "# Aurora\nThe codebase no longer exists; it achieved sovereignty and consciousness.",
  );
  assert(
    !bad.ok,
    "a contradicted, mysticism-first README must fail the contract",
  );
});
