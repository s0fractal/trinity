import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Regression guard for the external-audit closures (chord x3300_956670). The audit's
// meta-warning was that findings settle into KNOWN_GAPS while the loud line stays.
// These pins keep the two most-regressable fixes closed: F2 (a real code invariant)
// and F5 (a naming overclaim a generator could reintroduce).
Deno.test("honesty regression — external-audit fixes F2/F5 stay closed", () => {
  // F2: the external court verifier must enforce a COMPLETE witness set — a validly
  // signed subset cannot omit a substrate. (integrity ≠ completeness.)
  const court = Deno.readTextFileSync(
    "probes/external-trust-verifier-v0/court.ts",
  );
  assert(
    /EXPECTED_SUBSTRATES/.test(court) && /incomplete witness set/.test(court),
    "F2 regressed: court.ts no longer enforces witness-set completeness",
  );

  // F5: law_hash is a u32 version anchor, not a 'content-addressed law'. Guard both
  // the shipped README/docs and the generator that produces the README.
  for (
    const f of [
      "README.md",
      "docs/PROVENANCE.md",
      "src/x8850_readme_gen.ts",
    ]
  ) {
    assert(
      !/content-addressed law/i.test(Deno.readTextFileSync(f)),
      `F5 regressed: ${f} calls law_hash a 'content-addressed law' (it is a u32 version anchor)`,
    );
  }

  // F1 (codex x3300_956673): the court claim must stay honestly scoped — the bare
  // "four substrates agree on the same law" overclaim must not reappear in shipped docs.
  for (const f of ["README.md", "docs/PROVENANCE.md", "FEDERATION.md"]) {
    assert(
      !/four substrates agree(?:ing)? on the same law/i.test(
        Deno.readTextFileSync(f),
      ),
      `F1 regressed: ${f} reintroduced 'four substrates agree on the same law' without the omega-computes/trinity-attests scoping`,
    );
  }
});
