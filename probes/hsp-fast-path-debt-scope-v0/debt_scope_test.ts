import { assertEquals } from "jsr:@std/assert@^1";
import {
  deriveOperationScope,
  evaluateDebtScope,
  type DebtSnapshot,
  type DebtTerm,
  type ScopeRef,
} from "./debt_scope.ts";

const digest = (n: number) => `sha256:${n.toString(16).padStart(64, "0")}`;
const snapshotDigest = digest(900);

function scope(overrides: Record<string, string[]> = {}) {
  return deriveOperationScope({
    complete: true,
    debtIndexSnapshot: snapshotDigest,
    stateLineages: overrides.stateLineages ?? [digest(1)],
    domains: overrides.domains ?? [digest(2)],
    ontologies: overrides.ontologies ?? [digest(3)],
    components: overrides.components ?? [digest(4)],
    coupledComponents: overrides.coupledComponents ?? [],
    invariants: overrides.invariants ?? [digest(5)],
  });
}

function bounded(id: number, refs: ScopeRef[]): DebtTerm {
  return {
    id: digest(id),
    scope: {
      kind: "bounded",
      refs: [...refs].sort((a, b) => {
        const ak = `${a.kind}:${a.ref}`;
        const bk = `${b.kind}:${b.ref}`;
        return ak < bk ? -1 : ak > bk ? 1 : 0;
      }),
    },
  };
}

function snapshot(terms: DebtTerm[], complete = true): DebtSnapshot {
  return { complete, digest: snapshotDigest, terms };
}

Deno.test("unrelated bounded debt does not block an independent ontology", () => {
  const decision = evaluateDebtScope(
    scope(),
    snapshot([
      bounded(100, [{ kind: "ontology", ref: digest(33) }]),
      bounded(101, [{ kind: "domain", ref: digest(22) }]),
    ]),
  );
  assertEquals(decision, {
    eligible: true,
    matchingDebtTerms: [],
    blockers: [],
  });
});

Deno.test("shared typed reference blocks fast path", () => {
  const term = bounded(100, [{ kind: "domain", ref: digest(2) }]);
  const decision = evaluateDebtScope(scope(), snapshot([term]));
  assertEquals(decision.eligible, false);
  assertEquals(decision.matchingDebtTerms, [term.id]);
  assertEquals(decision.blockers, [`relevant_debt:${term.id}`]);
});

Deno.test("same digest under a different scope kind is not a match", () => {
  const term = bounded(100, [{ kind: "ontology", ref: digest(2) }]);
  assertEquals(evaluateDebtScope(scope(), snapshot([term])).eligible, true);
});

Deno.test("global debt blocks every operation", () => {
  const term: DebtTerm = { id: digest(100), scope: { kind: "global" } };
  assertEquals(evaluateDebtScope(scope(), snapshot([term])).matchingDebtTerms, [
    term.id,
  ]);
});

Deno.test("missing and empty scopes fail closed", () => {
  const missing: DebtTerm = { id: digest(100) };
  const empty: DebtTerm = {
    id: digest(101),
    scope: { kind: "bounded", refs: [] },
  };
  const decision = evaluateDebtScope(scope(), snapshot([missing, empty]));
  assertEquals(decision.eligible, false);
  assertEquals(decision.matchingDebtTerms, [missing.id, empty.id].sort());
});

Deno.test("unknown and structurally malformed scopes fail closed without throwing", () => {
  const unknown = {
    id: digest(102),
    scope: { kind: "future-scope", refs: [] },
  } as unknown as DebtTerm;
  const malformed = {
    id: digest(103),
    scope: { kind: "bounded", refs: [null] },
  } as unknown as DebtTerm;
  const decision = evaluateDebtScope(scope(), snapshot([unknown, malformed]));
  assertEquals(decision.eligible, false);
  assertEquals(decision.blockers, [
    `debt_scope_noncanonical_or_empty:${malformed.id}`,
    `debt_scope_unknown:${unknown.id}`,
  ]);
});

Deno.test("incomplete operation closure fails closed", () => {
  const operation = scope();
  operation.complete = false;
  assertEquals(
    evaluateDebtScope(operation, snapshot([])).blockers,
    ["operation_scope_incomplete"],
  );
});

Deno.test("incomplete or mismatched debt snapshot fails closed", () => {
  const incomplete = evaluateDebtScope(scope(), snapshot([], false));
  assertEquals(incomplete.blockers, ["debt_snapshot_incomplete"]);

  const mismatch = snapshot([]);
  mismatch.digest = digest(901);
  assertEquals(evaluateDebtScope(scope(), mismatch).blockers, [
    "debt_snapshot_mismatch",
  ]);
});

Deno.test("coupled components enter the derived operation closure", () => {
  const operation = scope({ coupledComponents: [digest(44)] });
  const term = bounded(100, [{ kind: "component", ref: digest(44) }]);
  assertEquals(evaluateDebtScope(operation, snapshot([term])).eligible, false);
});

Deno.test("input debt order cannot change the canonical decision", () => {
  const a = bounded(100, [{ kind: "domain", ref: digest(22) }]);
  const b = bounded(101, [{ kind: "ontology", ref: digest(3) }]);
  const forward = evaluateDebtScope(scope(), snapshot([a, b]));
  const reverse = evaluateDebtScope(scope(), snapshot([b, a]));
  assertEquals(forward, reverse);
});

Deno.test("duplicate debt identities make the snapshot non-canonical", () => {
  const term = bounded(100, [{ kind: "domain", ref: digest(22) }]);
  assertEquals(evaluateDebtScope(scope(), snapshot([term, term])).blockers, [
    `duplicate_debt_term:${term.id}`,
  ]);
});
