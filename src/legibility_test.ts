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

Deno.test("legibility — the guard catches ritual/underselling before the product (codex x3300_956673)", () => {
  const ritualFirst = checkLegibility(
    "fake",
    '---\nchord:\n  primary: "oct:3.7"\nmode: OBSERVE\n---\n# x\n`x` is a local draft space. trust the hash, Ed25519 witnesses, verify with deno task verify. This is not a data lake.',
  );
  assert(
    !ritualFirst.ok,
    "a README opening with chord: frontmatter / 'local draft space' before the product must fail",
  );
});

Deno.test("legibility — a dead verify command fails (codex P1b, x3300_956673)", () => {
  const v = checkLegibility(
    "liquid",
    "> liquid — latent-intent substrate; trust the hash, Ed25519 signatures. **This is not** a conscious organism. Verify: `deno task nonexistent`.",
    "/tmp/no-such-root",
  );
  assert(
    !v.verify_command_real,
    "a declared verify command with no real target must be flagged",
  );
  assert(
    !v.ok,
    "a README whose solo-verify path is dead must fail the contract",
  );
});
