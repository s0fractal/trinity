// Executable probe for RFC-0003 §15.0 debt locality.
// This is deliberately narrower than the full eight-term fast-path predicate.

export const SCOPE_KINDS = [
  "state-lineage",
  "domain",
  "ontology",
  "component",
  "invariant",
] as const;

export type ScopeKind = (typeof SCOPE_KINDS)[number];

export type ScopeRef = {
  kind: ScopeKind;
  ref: string;
};

export type DebtScope =
  | { kind: "global" }
  | { kind: "bounded"; refs: ScopeRef[] };

export type DebtTerm = {
  id: string;
  scope?: DebtScope;
};

export type DebtSnapshot = {
  complete: boolean;
  digest?: string;
  terms: DebtTerm[];
};

export type OperationScope = {
  complete: boolean;
  refs: ScopeRef[];
  debtIndexSnapshot?: string;
};

export type OperationScopeInput = {
  complete: boolean;
  debtIndexSnapshot?: string;
  stateLineages?: string[];
  domains?: string[];
  ontologies?: string[];
  components?: string[];
  coupledComponents?: string[];
  invariants?: string[];
};

export type DebtScopeDecision = {
  eligible: boolean;
  matchingDebtTerms: string[];
  blockers: string[];
};

const FULL_SHA256 = /^sha256:[0-9a-f]{64}$/;

function refKey(ref: ScopeRef): string {
  return `${ref.kind}:${ref.ref}`;
}

function compareRef(a: ScopeRef, b: ScopeRef): number {
  const ak = refKey(a);
  const bk = refKey(b);
  return ak < bk ? -1 : ak > bk ? 1 : 0;
}

function isScopeKind(value: string): value is ScopeKind {
  return (SCOPE_KINDS as readonly string[]).includes(value);
}

function isFullDigest(value: unknown): value is string {
  return typeof value === "string" && FULL_SHA256.test(value);
}

function isCanonicalRefSet(refs: unknown): refs is ScopeRef[] {
  if (!Array.isArray(refs) || refs.length === 0) return false;
  if (!refs.every((ref) =>
    typeof ref === "object" && ref !== null &&
    isScopeKind((ref as ScopeRef).kind) && isFullDigest((ref as ScopeRef).ref)
  )) return false;
  const keys = (refs as ScopeRef[]).map(refKey);
  return keys.every((key, index) => index === 0 || keys[index - 1] < key);
}

function canonicalRefs(refs: ScopeRef[]): ScopeRef[] {
  const unique = new Map(refs.map((ref) => [refKey(ref), ref]));
  return [...unique.values()].sort(compareRef);
}

export function deriveOperationScope(input: OperationScopeInput): OperationScope {
  const tagged: ScopeRef[] = [
    ...(input.stateLineages ?? []).map((ref) => ({
      kind: "state-lineage" as const,
      ref,
    })),
    ...(input.domains ?? []).map((ref) => ({ kind: "domain" as const, ref })),
    ...(input.ontologies ?? []).map((ref) => ({
      kind: "ontology" as const,
      ref,
    })),
    ...(input.components ?? []).map((ref) => ({
      kind: "component" as const,
      ref,
    })),
    ...(input.coupledComponents ?? []).map((ref) => ({
      kind: "component" as const,
      ref,
    })),
    ...(input.invariants ?? []).map((ref) => ({
      kind: "invariant" as const,
      ref,
    })),
  ];

  return {
    complete: input.complete,
    refs: canonicalRefs(tagged),
    debtIndexSnapshot: input.debtIndexSnapshot,
  };
}

export function evaluateDebtScope(
  operation: OperationScope,
  snapshot: DebtSnapshot,
): DebtScopeDecision {
  const blockers = new Set<string>();
  const matches = new Set<string>();

  if (!operation.complete) blockers.add("operation_scope_incomplete");
  if (!isCanonicalRefSet(operation.refs)) {
    blockers.add("operation_scope_noncanonical_or_empty");
  }
  if (!snapshot.complete) blockers.add("debt_snapshot_incomplete");
  if (!isFullDigest(snapshot.digest)) blockers.add("debt_snapshot_digest_missing");
  if (operation.debtIndexSnapshot !== snapshot.digest) {
    blockers.add("debt_snapshot_mismatch");
  }

  const operationKeys = new Set(operation.refs.map(refKey));
  const termIds = new Set<string>();

  for (const term of snapshot.terms) {
    if (!isFullDigest(term.id)) {
      blockers.add("debt_term_id_malformed");
      continue;
    }
    if (termIds.has(term.id)) {
      blockers.add(`duplicate_debt_term:${term.id}`);
      continue;
    }
    termIds.add(term.id);

    const rawScope = term.scope as unknown;
    if (typeof rawScope !== "object" || rawScope === null) {
      matches.add(term.id);
      blockers.add(`debt_scope_missing:${term.id}`);
      continue;
    }
    const scopeKind = (rawScope as { kind?: unknown }).kind;
    if (scopeKind === "global") {
      matches.add(term.id);
      blockers.add(`relevant_debt:${term.id}`);
      continue;
    }
    if (scopeKind !== "bounded") {
      matches.add(term.id);
      blockers.add(`debt_scope_unknown:${term.id}`);
      continue;
    }
    const scopeRefs = (rawScope as { refs?: unknown }).refs;
    if (!isCanonicalRefSet(scopeRefs)) {
      matches.add(term.id);
      blockers.add(`debt_scope_noncanonical_or_empty:${term.id}`);
      continue;
    }
    if (scopeRefs.some((ref) => operationKeys.has(refKey(ref)))) {
      matches.add(term.id);
      blockers.add(`relevant_debt:${term.id}`);
    }
  }

  return {
    eligible: blockers.size === 0,
    matchingDebtTerms: [...matches].sort(),
    blockers: [...blockers].sort(),
  };
}
