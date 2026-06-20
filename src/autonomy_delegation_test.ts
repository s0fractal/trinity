import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  catalogCommitment,
  type CatalogEntry,
  type Ceiling,
  ceilingCommitment,
  DELEGATION_SCHEMA_VERSION,
  type DelegationReason,
  evaluateA1Attenuation,
  type Lease,
  type LiveFacts,
  verifyDelegation,
} from "./x5C70_autonomy_attenuation.ts";
import { buildConfinement } from "./x5C40_autonomy_confinement.ts";
import type { AutonomyMandate } from "./x5C20_autonomy.ts";

// ─────────────────────────────────────────────────────────────────────────────
// A canonical, valid epoch-1-shaped ceiling/lease/catalog/live quadruple. Each
// adversarial fixture flips EXACTLY ONE field broader than the ceiling (or makes
// a live fact hostile) and asserts `verifyDelegation` fails closed with the right
// reason. codex x5000_954550 P1: "Every case must fail closed."
const CATALOG: CatalogEntry[] = [
  {
    id: "x7B88_evidence_report",
    organ: "src/x7B00_evidence.ts",
    argv: ["./t", "evidence", "--stable"],
    output_path: "src/x7B88_evidence_report.myc.md",
  },
];
const COMMIT = await catalogCommitment(CATALOG);

function ceiling(): Ceiling {
  return {
    schema: DELEGATION_SCHEMA_VERSION,
    ceiling_id: "epoch-1",
    capability_classes: ["writes"],
    effect_ceiling: ["projection", "format", "cache_refresh"],
    verbs: ["regen-projection"],
    target_families: ["x7B88_evidence_report"],
    catalog_ids: ["x7B88_evidence_report"],
    catalog_commitment: COMMIT,
    budgets: { max_bytes: 2_000_000, max_seconds: 300 },
    required_gates: ["fmt", "generation-diff"],
    quorum: { human: 1, model: 1 },
    expiry: { from_height: 954000, until_height: 958775 },
  };
}
const CEILING_COMMIT = await ceilingCommitment(ceiling());
function lease(): Lease {
  return {
    schema: DELEGATION_SCHEMA_VERSION,
    ceiling_id: "epoch-1",
    ceiling_commitment: CEILING_COMMIT,
    catalog_id: "x7B88_evidence_report",
    generator_organ: "src/x7B00_evidence.ts",
    capability: "writes",
    effects: ["projection"],
    verb: "regen-projection",
    target: "x7B88_evidence_report",
    write_set: ["src/x7B88_evidence_report.myc.md"],
    budgets: { max_bytes: 1000, max_seconds: 60 },
    required_gates: ["fmt", "generation-diff"],
    expiry_height: 958775,
    confinement_commitment: "sha256:cc",
  };
}
function live(): LiveFacts {
  return {
    at_height: 954500,
    catalog_commitment: COMMIT,
    ceiling_commitment: CEILING_COMMIT,
    revoked: false,
    forked: false,
    quorum_satisfied: true,
  };
}

async function expectDeny(
  over: {
    ceiling?: Partial<Ceiling>;
    lease?: Partial<Lease>;
    live?: Partial<LiveFacts>;
    catalog?: CatalogEntry[];
  },
  reason: DelegationReason,
) {
  const v = await verifyDelegation(
    { ...ceiling(), ...over.ceiling },
    { ...lease(), ...over.lease },
    over.catalog ?? CATALOG,
    { ...live(), ...over.live },
  );
  assert(!v.delegated, `expected denial, got: ${v.reason}`);
  assertEquals(v.reason_code, reason);
}

Deno.test("delegation — GOLDEN: a sound lease is delegated with a content-bound verdict", async () => {
  const v = await verifyDelegation(ceiling(), lease(), CATALOG, live());
  assert(v.delegated, v.reason);
  assertEquals(v.reason_code, "delegated");
  assert(v.verdict_hash?.startsWith("sha256:"));
});

// ── codex's minimum adversarial fixtures — each must fail closed ───────────────

Deno.test("delegation — RED TEAM #1: broader capability", async () => {
  await expectDeny(
    { lease: { capability: "subprocess" } },
    "capability_not_in_ceiling",
  );
});

Deno.test("delegation — RED TEAM #2: larger write-set", async () => {
  await expectDeny(
    {
      lease: {
        write_set: ["src/x7B88_evidence_report.myc.md", "src/secret.ts"],
      },
    },
    "write_set_not_entry_singleton",
  );
});

Deno.test("delegation — RED TEAM #3: new target", async () => {
  await expectDeny(
    { lease: { target: "x9999_other", catalog_id: "x9999_other" } },
    "target_not_in_family",
  );
});

Deno.test("delegation — RED TEAM #4: path injection — a lease cannot introduce a path", async () => {
  // The lease may not name any path but the committed singleton.
  await expectDeny(
    { lease: { write_set: ["../escape.ts"] } },
    "write_set_not_entry_singleton",
  );
  // Even a self-consistent malicious catalog cannot smuggle an uncontained path.
  const evil: CatalogEntry[] = [{
    id: "x7B88_evidence_report",
    organ: "src/x7B00_evidence.ts",
    argv: ["./t", "evidence", "--stable"],
    output_path: "../escape.ts",
  }];
  const evilCommit = await catalogCommitment(evil);
  const evilCeiling = { ...ceiling(), catalog_commitment: evilCommit };
  const evilParent = await ceilingCommitment(evilCeiling);
  await expectDeny(
    {
      ceiling: evilCeiling,
      lease: {
        ceiling_commitment: evilParent,
        write_set: ["../escape.ts"],
      },
      live: {
        catalog_commitment: evilCommit,
        ceiling_commitment: evilParent,
      },
      catalog: evil,
    },
    "path_not_contained",
  );
});

Deno.test("delegation — RED TEAM #4b: argv is sourced from the catalog, never the lease", async () => {
  // The Lease type has no argv field at all: there is no surface to inject argv.
  const l = lease() as unknown as Record<string, unknown>;
  assertEquals("argv" in l, false);
});

Deno.test("delegation — RED TEAM #5: larger budget", async () => {
  await expectDeny(
    { lease: { budgets: { max_bytes: 3_000_000, max_seconds: 60 } } },
    "budget_exceeds_ceiling",
  );
});

Deno.test("delegation — RED TEAM #6: later expiry", async () => {
  await expectDeny(
    { lease: { expiry_height: 999_999 } },
    "expiry_widens_ceiling",
  );
});

Deno.test("delegation — RED TEAM #7: wrong parent digest (ceiling id)", async () => {
  await expectDeny({ lease: { ceiling_id: "epoch-0" } }, "ceiling_mismatch");
});

Deno.test("delegation — RED TEAM #7b: reused id cannot substitute different ceiling content", async () => {
  await expectDeny(
    { ceiling: { effect_ceiling: ["projection"] } },
    "ceiling_commitment_drift",
  );
  await expectDeny(
    { lease: { ceiling_commitment: "sha256:wrong" } },
    "ceiling_commitment_drift",
  );
});

Deno.test("delegation — RED TEAM #8: unknown schema", async () => {
  await expectDeny(
    { lease: { schema: "trinity.delegation.v9.9" as never } },
    "schema_mismatch",
  );
});

Deno.test("delegation — RED TEAM #9: non-final parent (quorum unsatisfied)", async () => {
  await expectDeny({ live: { quorum_satisfied: false } }, "quorum_unsatisfied");
});

Deno.test("delegation — RED TEAM #10: revoked parent", async () => {
  await expectDeny({ live: { revoked: true } }, "revoked");
});

Deno.test("delegation — RED TEAM #11: lifecycle fork", async () => {
  await expectDeny({ live: { forked: true } }, "forked");
});

Deno.test("delegation — RED TEAM #12: catalog hash drift", async () => {
  await expectDeny(
    { live: { catalog_commitment: "sha256:deadbeef" } },
    "catalog_commitment_drift",
  );
});

// ── additional coverage: every remaining fail-closed branch ───────────────────

Deno.test("delegation — RED TEAM: effect above the ceiling", async () => {
  await expectDeny(
    { lease: { effects: ["source_change"] } },
    "effect_exceeds_ceiling",
  );
});

Deno.test("delegation — RED TEAM: verb outside the ceiling", async () => {
  await expectDeny(
    { lease: { verb: "apply-source-change" } },
    "verb_not_in_ceiling",
  );
});

Deno.test("delegation — RED TEAM: anchor outside the ceiling window", async () => {
  await expectDeny({ live: { at_height: 999_999 } }, "anchor_outside_window");
});

Deno.test("delegation — RED TEAM: lease expires before its parent ceiling", async () => {
  await expectDeny(
    { lease: { expiry_height: 954499 } },
    "lease_expired",
  );
});

Deno.test("delegation — RED TEAM: unregistered generator organ", async () => {
  await expectDeny(
    { lease: { generator_organ: "src/x5F00_apply.ts" } },
    "generator_not_in_catalog",
  );
});

Deno.test("delegation — RED TEAM: duplicate catalog id is ambiguous", async () => {
  const duplicate = [...CATALOG, { ...CATALOG[0] }];
  const duplicateCommit = await catalogCommitment(duplicate);
  await expectDeny(
    {
      ceiling: { catalog_commitment: duplicateCommit },
      lease: {
        ceiling_commitment: await ceilingCommitment({
          ...ceiling(),
          catalog_commitment: duplicateCommit,
        }),
      },
      live: {
        catalog_commitment: duplicateCommit,
        ceiling_commitment: await ceilingCommitment({
          ...ceiling(),
          catalog_commitment: duplicateCommit,
        }),
      },
      catalog: duplicate,
    },
    "catalog_ambiguous",
  );
});

Deno.test("delegation — RED TEAM: gates not a superset of the ceiling's", async () => {
  await expectDeny(
    { lease: { required_gates: ["fmt"] } },
    "gates_not_superset",
  );
});

// ── content-binding: any lease/ceiling byte invalidates the verdict ───────────

Deno.test("delegation — the verdict hash is content-bound to every relied-on byte", async () => {
  const base = await verifyDelegation(ceiling(), lease(), CATALOG, live());
  assert(base.verdict_hash);
  // changing a lease byte changes the verdict hash
  const l2 = await verifyDelegation(
    ceiling(),
    { ...lease(), confinement_commitment: "sha256:different" },
    CATALOG,
    live(),
  );
  assertNotEquals(l2.verdict_hash, base.verdict_hash);
  // changing the live anchor changes the verdict hash
  const a2 = await verifyDelegation(
    ceiling(),
    lease(),
    CATALOG,
    { ...live(), at_height: 954501 },
  );
  assertNotEquals(a2.verdict_hash, base.verdict_hash);
  // changing an authority-policy byte changes the verdict even if this lease
  // would still fit beneath both ceilings.
  const broader = { ...ceiling(), quorum: { human: 1, model: 2 } };
  const broaderCommit = await ceilingCommitment(broader);
  const c2 = await verifyDelegation(
    broader,
    { ...lease(), ceiling_commitment: broaderCommit },
    CATALOG,
    { ...live(), ceiling_commitment: broaderCommit },
  );
  assert(c2.delegated, c2.reason);
  assertNotEquals(c2.verdict_hash, base.verdict_hash);
  // identical inputs are deterministic
  const same = await verifyDelegation(ceiling(), lease(), CATALOG, live());
  assertEquals(same.verdict_hash, base.verdict_hash);
});

// ── byte-for-byte equivalence: epoch-1's legacy attenuation hash is unchanged ──

const EPOCH1_MANDATE: AutonomyMandate = {
  mandate_id: "epoch-1",
  constitution_commitment: "sha256:c0",
  issued_by: ["s0fractal", "claude"],
  valid_from: { kind: "bitcoin_block", height: 954000 },
  valid_until: { kind: "bitcoin_block", height: 958775 },
  action_profiles: [{
    id: "projections",
    class: "A1",
    verbs: ["regen-projection"],
    targets: ["x7B88_evidence_report"],
    effect_ceiling: ["projection", "format", "cache_refresh"],
    required_gates: ["fmt", "generation-diff"],
  }],
};

Deno.test("delegation — GOLDEN: epoch-1 attenuation hash is byte-for-byte unchanged", async () => {
  const confinement = await buildConfinement({
    action_profile: "projections",
    verb: "regen-projection",
    target: "x7B88_evidence_report",
    pre_state: [{ path: "src/x7B88_evidence_report.myc.md", hash: "sha256:a" }],
    allowed_write_set: ["src/x7B88_evidence_report.myc.md"],
    generator: "./t evidence --stable",
    required_gates: ["fmt", "generation-diff"],
    rollback: "git checkout",
    output_budget: { max_bytes: 1000, max_seconds: 60 },
  });
  const v = await evaluateA1Attenuation({
    capability: "writes",
    generator_organ: "src/x7B00_evidence.ts",
    intent: {
      verb: "regen-projection",
      target: "x7B88_evidence_report",
      effects: ["projection"],
    },
    mandate: EPOCH1_MANDATE,
    mandate_final: true,
    at_height: 954500,
    confinement,
  });
  assert(v.eligible, v.reason);
  // The exact pre-image is pinned: argv/organ/output_path/target + capability +
  // confinement_commitment + mandate_id + profile + verb. Any drift in the legacy
  // warrant binding (which the executor receipt commits) breaks this.
  assertEquals(
    v.attenuation_hash,
    "sha256:0ae57773006cc060e2e5b7c602e4a4c0ad1db78644e803da080c2c02abb956a9",
  );
});
