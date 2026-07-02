import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type ContractEntry,
  lacksImplEvidence,
  normalizeImplStatus,
  parseImplEvidence,
} from "./x4F00_contracts.ts";

Deno.test("contracts — a missing implementation_status is 'unlabeled', never silently 'aspirational'", () => {
  // The downward-lie regression guard: an unlabeled contract must NOT be
  // reported as a declared aspiration (29 shipped contracts had no field).
  assertEquals(normalizeImplStatus(undefined), "unlabeled");
  assertEquals(normalizeImplStatus(""), "unlabeled");
  assertEquals(normalizeImplStatus("nonsense"), "unlabeled");
  // declared statuses pass through, case/space-insensitive
  assertEquals(normalizeImplStatus("aspirational"), "aspirational");
  assertEquals(normalizeImplStatus(" Implemented "), "implemented");
  // ratified is a recognized status (2 Bitcoin-anchored contracts use it)
  assertEquals(normalizeImplStatus("ratified"), "ratified");
});

Deno.test("contracts P3 — parseImplEvidence reads the nested impl_evidence block", () => {
  const withEvidence = `---
type: "ContractDescriptor"
implementation_status: "implemented"
impl_evidence:
  commands:
    - "t check"
  files:
    - "src/x.ts"
  tests:
    - "src/x_test.ts"
  caveats:
    - "partial"
---
body`;
  const ie = parseImplEvidence(withEvidence);
  assert(ie);
  assertEquals(ie!.commands, ["t check"]);
  assertEquals(ie!.files, ["src/x.ts"]);
  assertEquals(ie!.tests, ["src/x_test.ts"]);
  assertEquals(ie!.caveats, ["partial"]);
  // a contract with no impl_evidence block → null
  assertEquals(
    parseImplEvidence(`---\nimplementation_status: "implemented"\n---\nbody`),
    null,
  );
});

Deno.test("contracts P3 — lacksImplEvidence: a (partial) implementation claim needs >=1 command/file/test", () => {
  const mk = (status: string, ev: unknown) =>
    ({
      implementation_status: status,
      impl_evidence: ev,
    }) as unknown as ContractEntry;
  // claims implementation, no evidence → prose promotion
  assertEquals(lacksImplEvidence(mk("implemented", null)), true);
  // only caveats do NOT count as evidence
  assertEquals(
    lacksImplEvidence(
      mk("partially_implemented", {
        commands: [],
        files: [],
        tests: [],
        caveats: ["x"],
      }),
    ),
    true,
  );
  // one runnable command is enough
  assertEquals(
    lacksImplEvidence(
      mk("implemented", {
        commands: ["t check"],
        files: [],
        tests: [],
        caveats: [],
      }),
    ),
    false,
  );
  // aspirational / prototype need not carry evidence
  assertEquals(lacksImplEvidence(mk("aspirational", null)), false);
  assertEquals(lacksImplEvidence(mk("prototype", null)), false);
});
