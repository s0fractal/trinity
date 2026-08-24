import {
  deriveOperationScope,
  evaluateDebtScope,
  type DebtTerm,
} from "./debt_scope.ts";

const digest = (n: number) => `sha256:${n.toString(16).padStart(64, "0")}`;
const snapshotDigest = digest(10000);
const operation = deriveOperationScope({
  complete: true,
  debtIndexSnapshot: snapshotDigest,
  stateLineages: [digest(1)],
  domains: [digest(2)],
  ontologies: [digest(3)],
  components: [digest(4)],
  invariants: [digest(5)],
});

const disjoint: DebtTerm[] = Array.from({ length: 128 }, (_, index) => ({
  id: digest(1000 + index),
  scope: {
    kind: "bounded" as const,
    refs: [{ kind: "domain" as const, ref: digest(2000 + index) }],
  },
}));

Deno.bench("HSP debt scope — 128 disjoint terms", () => {
  evaluateDebtScope(operation, {
    complete: true,
    digest: snapshotDigest,
    terms: disjoint,
  });
});

Deno.bench("HSP debt scope — 127 disjoint + 1 relevant", () => {
  evaluateDebtScope(operation, {
    complete: true,
    digest: snapshotDigest,
    terms: [
      ...disjoint.slice(0, 127),
      {
        id: digest(9999),
        scope: {
          kind: "bounded",
          refs: [{ kind: "ontology", ref: digest(3) }],
        },
      },
    ],
  });
});
