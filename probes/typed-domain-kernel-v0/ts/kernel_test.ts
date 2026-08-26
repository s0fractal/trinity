// The typed-domain kernel's own controls. Positive fixtures prove the
// validators admit something; countermodels prove they refuse, and refuse for
// the stated reason. A validator that only ever passes is indistinguishable
// from one that checks nothing.

import { assert, assertEquals } from "@std/assert";
import {
  CAPABILITIES,
  type DomainDeclaration,
  DOMAIN_REFUSALS,
  isContentAddress,
  NOT_ASSESSED_REASONS,
  validateDomain,
} from "./layer1_domain.ts";
import {
  admitEvaluation,
  CONTEXT_SURFACES,
  COST_CLASSES,
  type InvariantDefinition,
  type InvariantEvaluation,
  SCOPES,
  validateInvariantDefinition,
} from "./layer2_invariant.ts";
import {
  BOUNDARY_KINDS,
  type BoundaryPolicy,
  decideComposition,
  decideLaw,
  LAW_STATUS_KINDS,
  type LawClaim,
  statedBelow,
  validateVersionDag,
} from "./layer3_law.ts";

const HERE = new URL(".", import.meta.url);
const load = async (p: string) =>
  JSON.parse(await Deno.readTextFile(new URL(`../fixtures/${p}`, HERE)));

// ---------------------------------------------------------------------------
// Layer 1
// ---------------------------------------------------------------------------

Deno.test("layer1 - the positive fixture is admitted", async () => {
  const { domain } = await load("positive/domain-euclidean.json");
  const v = validateDomain(domain as DomainDeclaration);
  assert(v.ok, v.ok ? "" : `${v.code}: ${v.reason}`);
});

Deno.test("layer1 - capability mismatch is refused in BOTH directions", async () => {
  const { domain } = await load("positive/domain-euclidean.json");
  const base = domain as DomainDeclaration;

  // declared, not implemented
  const missing = {
    ...base,
    implements: base.implements.filter((m) => m !== "transport"),
  };
  const a = validateDomain(missing);
  assertEquals(a.ok, false);
  if (!a.ok) assertEquals(a.code, "capability-declared-not-implemented");

  // implemented, not declared — the direction a permissive registry skips
  const extra = { ...base, implements: [...base.implements, "compose"] };
  const b = validateDomain(extra);
  assertEquals(b.ok, false);
  if (!b.ok) assertEquals(b.code, "capability-implemented-not-declared");
});

Deno.test("layer1 - move() without a typed delta space is refused", async () => {
  const { domain } = await load("positive/domain-euclidean.json");
  const d = { ...(domain as DomainDeclaration) };
  delete (d as { deltaDescriptor?: unknown }).deltaDescriptor;
  const v = validateDomain(d);
  assertEquals(v.ok, false);
  if (!v.ok) assertEquals(v.code, "geometric-without-delta-descriptor");
});

Deno.test("layer1 - distance() without metricAxioms is refused", async () => {
  const { domain } = await load("positive/domain-euclidean.json");
  const d = { ...(domain as DomainDeclaration), laws: {} };
  const v = validateDomain(d);
  assertEquals(v.ok, false);
  if (!v.ok) assertEquals(v.code, "metric-without-axioms");
});

Deno.test("layer1 - a short handle is not a reference", async () => {
  const { domain } = await load("positive/domain-euclidean.json");
  const d = { ...(domain as DomainDeclaration), address: "sha256:deadbeef" };
  const v = validateDomain(d);
  assertEquals(v.ok, false);
  if (!v.ok) assertEquals(v.code, "non-content-addressed-reference");
  assert(!isContentAddress("sha256:deadbeef"));
});

// ---------------------------------------------------------------------------
// Layer 2
// ---------------------------------------------------------------------------

const inv = (over: Partial<InvariantDefinition> = {}): InvariantDefinition => ({
  id: "inv-1",
  address: `sha256:${"a".repeat(64)}`,
  scope: "state",
  predicate: `sha256:${"b".repeat(64)}`,
  costClass: "constant",
  falsifier: [`sha256:${"c".repeat(64)}`],
  reads: ["state"],
  ...over,
});

const evaluation = (
  over: Partial<InvariantEvaluation> = {},
): InvariantEvaluation => ({
  predicate: `sha256:${"b".repeat(64)}`,
  state: `sha256:${"d".repeat(64)}`,
  worldSnapshot: "",
  authoritySnapshot: "",
  evaluatedAtLogicalStep: "",
  result: { verdict: "held" },
  ...over,
});

Deno.test("layer2 - an invariant with no falsifier is refused", () => {
  const v = validateInvariantDefinition(inv({ falsifier: [] }));
  assertEquals(v.ok, false);
  if (!v.ok) assertEquals(v.code, "no-falsifier");
});

Deno.test("layer2 - partially-held without a distortion measure is refused", () => {
  const v = validateInvariantDefinition(inv(), { canBePartiallyHeld: true });
  assertEquals(v.ok, false);
  if (!v.ok) assertEquals(v.code, "partial-without-distortion-measure");
});

Deno.test("layer2 - transition and trace scope cannot be checked from one state", () => {
  const t = admitEvaluation(
    inv({ scope: "transition", reads: ["state", "transition"] }),
    evaluation(),
  );
  assertEquals("ok" in t && t.ok, false);
  if ("code" in t) assertEquals(t.code, "missing-predecessor-for-transition");

  const r = admitEvaluation(
    inv({ scope: "trace", reads: ["state", "trace"] }),
    evaluation(),
  );
  if ("code" in r) assertEquals(r.code, "missing-trace-for-trace-scope");
});

Deno.test("layer2 - an undeclared surface supplied to the evaluation is refused", () => {
  // The direction a permissive check skips: the predicate declared it reads
  // only `state`, and the evaluation hands it a world snapshot anyway.
  const v = admitEvaluation(
    inv({ reads: ["state"] }),
    evaluation({ worldSnapshot: `sha256:${"e".repeat(64)}` }),
  );
  assertEquals("ok" in v && v.ok, false);
  if ("code" in v) assertEquals(v.code, "undeclared-surface-read");
});

Deno.test("layer2 - unbounded never gates a fast path", () => {
  const v = admitEvaluation(inv({ costClass: "unbounded" }), evaluation(), {
    fastPath: true,
  });
  if ("code" in v) assertEquals(v.code, "unbounded-gates-fast-path");
});

Deno.test("layer2 - over budget and stale are NOT-ASSESSED, never held", () => {
  // The three-valued outcome the RFC requires and never types. Collapsing it to
  // a boolean is how a boundary comes to believe an invariant held when nobody
  // checked it.
  const over = admitEvaluation(inv({ costClass: "superlinear" }), evaluation(), {
    budget: "linear",
  });
  assert("notAssessed" in over && over.notAssessed === "cost-class-exceeds-budget");

  const stale = admitEvaluation(inv(), evaluation(), {
    freshness: { maxLogicalStepsBehind: 1 },
    snapshotLogicalStepsBehind: 9,
  });
  assert("notAssessed" in stale && stale.notAssessed === "snapshot-stale");
});

// ---------------------------------------------------------------------------
// Layer 3 — the seam
// ---------------------------------------------------------------------------

const claim = (over: Partial<LawClaim> = {}): LawClaim => ({
  status: { kind: "asserted", author: "claude" },
  scope: "total",
  ...over,
});

const policy = (over: Partial<BoundaryPolicy> = {}): BoundaryPolicy => ({
  boundary: "local",
  accepts: ["proved", "tested", "asserted"],
  ...over,
});

Deno.test("layer3 - falsified authorizes nothing, even if a policy accepts it", () => {
  const v = decideLaw(
    claim({ status: { kind: "falsified", counterexample: `sha256:${"f".repeat(64)}` } }),
    // A policy that tries to opt in. The floor is above policy.
    policy({ accepts: [...LAW_STATUS_KINDS] }),
  );
  assertEquals(v.admitted, false);
  if (!v.admitted) assertEquals(v.code, "falsified");
});

Deno.test("layer3 - asserted never crosses a translation or irreversible boundary", () => {
  for (const b of ["translation", "irreversible"] as const) {
    const v = decideLaw(claim(), policy({ boundary: b, accepts: ["asserted"] }));
    assertEquals(v.admitted, false, `${b} admitted an asserted law`);
    if (!v.admitted) assertEquals(v.code, "asserted-across-boundary");
  }
  // ...and does cross a local one, if the policy says so. Otherwise the control
  // above would be satisfied by refusing everything.
  assert(decideLaw(claim(), policy({ accepts: ["asserted"] })).admitted);
});

Deno.test("layer3 - an absent law is no claim, not a weak claim", () => {
  const v = decideLaw(undefined, policy());
  assertEquals(v.admitted, false);
  if (!v.admitted) assertEquals(v.code, "law-absent");
});

Deno.test("layer3 - a tested law without a generation domain is asserted with extra steps", () => {
  const v = decideLaw(
    claim({
      status: {
        kind: "tested",
        generator: `sha256:${"1".repeat(64)}`,
        domain: "",
        cases: 1000,
        seed: "s",
        ref: `sha256:${"2".repeat(64)}`,
      },
    }),
    policy({ accepts: ["tested"] }),
  );
  assertEquals(v.admitted, false);
  if (!v.admitted) assertEquals(v.code, "generation-domain-unstated");
});

Deno.test("layer3 - THE SEAM: proved and tested are not ordered by the RFC", async () => {
  // statedBelow returns null for "the text does not order these", which is a
  // different answer from false and is the one a policy must act on.
  assertEquals(statedBelow("falsified", "asserted"), true);
  assertEquals(statedBelow("asserted", "proved"), true);
  assertEquals(statedBelow("asserted", "tested"), true);
  assertEquals(statedBelow("proved", "tested"), null);
  assertEquals(statedBelow("tested", "proved"), null);

  // The countermodel that makes the gap load-bearing rather than cosmetic.
  const cm = await load("countermodels/proved-narrower-than-tested.json");
  const provedNarrow = cm.proved_but_narrow as LawClaim;
  const testedWide = cm.tested_but_wider as LawClaim;
  assertEquals(provedNarrow.scope, "partial");
  assertEquals(testedWide.scope, "total");
  // Both are admissible at a boundary that accepts both kinds; neither is "the
  // minimum", and a threshold policy cannot express the difference.
  const p = policy({ boundary: "composition", accepts: ["proved", "tested"] });
  assert(decideLaw(provedNarrow, p).admitted);
  assert(decideLaw(testedWide, p).admitted);
});

Deno.test("layer3 - composition refuses mismatched scope", () => {
  const p = policy({ accepts: ["proved"] });
  const proved = (scope: "total" | "partial") =>
    claim({
      status: {
        kind: "proved",
        proof: `sha256:${"3".repeat(64)}`,
        checker: `sha256:${"4".repeat(64)}`,
      },
      scope,
    });
  assert(decideComposition(proved("total"), proved("total"), p).admitted);
  assertEquals(
    decideComposition(proved("total"), proved("partial"), p).admitted,
    false,
  );
});

Deno.test("layer3 - version DAG: the one conflict the RFC names", async () => {
  const cm = await load("countermodels/patch-across-law-weakening.json");
  const v = validateVersionDag(cm.releases, new Set(cm.weakened_laws));
  assertEquals(v.ok, false);
  if (!v.ok) assertEquals(v.code, "patch-across-law-weakening");

  // Without the weakening, the same DAG is fine — so the control discriminates.
  assert(validateVersionDag(cm.releases, new Set()).ok);
});

Deno.test("layer3 - version DAG: cycles and orphans are refused", () => {
  const a = `sha256:${"5".repeat(64)}`, b = `sha256:${"6".repeat(64)}`;
  const cyc = validateVersionDag([
    { address: a, predecessor: b, label: "1.0.0" },
    { address: b, predecessor: a, label: "1.0.1" },
  ]);
  assertEquals(cyc.ok, false);
  if (!cyc.ok) assertEquals(cyc.code, "multiple-roots");

  const orphan = validateVersionDag([
    { address: a, predecessor: null, label: "1.0.0" },
    { address: b, predecessor: `sha256:${"9".repeat(64)}`, label: "1.0.1" },
  ]);
  assertEquals(orphan.ok, false);
  if (!orphan.ok) assertEquals(orphan.code, "predecessor-unknown");
});

// ---------------------------------------------------------------------------
// Closed sets — every enumeration this kernel exports is closed on purpose.
// ---------------------------------------------------------------------------

Deno.test("kernel - the exported member sets are exactly what the README documents", () => {
  assertEquals([...CAPABILITIES].sort(), [
    "comparable",
    "composable",
    "geometric",
    "interpolable",
    "metric",
    "ordered",
  ]);
  assertEquals([...LAW_STATUS_KINDS].sort(), [
    "asserted",
    "falsified",
    "proved",
    "tested",
  ]);
  assertEquals([...SCOPES], ["state", "transition", "trace"]);
  assertEquals([...COST_CLASSES], [
    "constant",
    "linear",
    "superlinear",
    "unbounded",
  ]);
  assertEquals([...CONTEXT_SURFACES].sort(), [
    "authority",
    "logical-step",
    "state",
    "trace",
    "transition",
    "world",
  ]);
  assertEquals([...BOUNDARY_KINDS].sort(), [
    "composition",
    "irreversible",
    "local",
    "translation",
  ]);
  assert(DOMAIN_REFUSALS.length >= 9);
  assert(NOT_ASSESSED_REASONS.length >= 5);
});
