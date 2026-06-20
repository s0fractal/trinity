import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type AttenuationInput,
  EPOCH1_ADAPTERS,
  evaluateA1Attenuation,
  pathContained,
} from "./x5C70_autonomy_attenuation.ts";
import { buildConfinement } from "./x5C40_autonomy_confinement.ts";
import type { AutonomyMandate } from "./x5C20_autonomy.ts";

const MANDATE: AutonomyMandate = {
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

async function input(
  over: Partial<AttenuationInput> = {},
  writeSet = ["src/x7B88_evidence_report.myc.md"],
): Promise<AttenuationInput> {
  const confinement = await buildConfinement({
    action_profile: "projections",
    verb: "regen-projection",
    target: "x7B88_evidence_report",
    pre_state: writeSet.map((p) => ({ path: p, hash: "sha256:a" })),
    allowed_write_set: writeSet,
    generator: "./t evidence --stable",
    required_gates: ["fmt", "generation-diff"],
    rollback: "git checkout",
    output_budget: { max_bytes: 1000, max_seconds: 60 },
  });
  return {
    capability: "writes",
    generator_organ: "src/x7B00_evidence.ts",
    intent: {
      verb: "regen-projection",
      target: "x7B88_evidence_report",
      effects: ["projection"],
    },
    mandate: MANDATE,
    mandate_final: true,
    at_height: 954500,
    confinement,
    ...over,
  };
}

Deno.test("attenuation — a fully-confined writes generator is eligible for A1 execution", async () => {
  const v = await evaluateA1Attenuation(await input());
  assert(v.eligible, v.reason);
  assertEquals(v.execution_class, "A1");
  assert(v.attenuation_hash?.startsWith("sha256:"));
});

Deno.test("attenuation — RED TEAM: ONLY `writes` is attenuable; never git/network/subprocess/unknown", async () => {
  for (const cap of ["git", "network", "subprocess", "unknown", "readonly"]) {
    const v = await evaluateA1Attenuation(await input({ capability: cap }));
    assert(!v.eligible, `${cap} must not attenuate`);
    assertEquals(v.reason_code, "non_attenuable_capability");
  }
});

Deno.test("attenuation — RED TEAM: a widened write-set is denied (not the registry singleton)", async () => {
  const v = await evaluateA1Attenuation(
    await input({}, ["src/x7B88_evidence_report.myc.md", "src/secret.ts"]),
  );
  assert(!v.eligible);
  assertEquals(v.reason_code, "write_set_not_registry_singleton");
});

Deno.test("attenuation — RED TEAM: an unregistered generator organ is denied", async () => {
  const v = await evaluateA1Attenuation(
    await input({ generator_organ: "src/x5F00_apply.ts" }),
  );
  assert(!v.eligible);
  assertEquals(v.reason_code, "generator_not_registered");
});

Deno.test("attenuation — RED TEAM: a non-final or expired mandate is denied", async () => {
  assertEquals(
    (await evaluateA1Attenuation(await input({ mandate_final: false })))
      .reason_code,
    "mandate_not_final_or_expired",
  );
  assertEquals(
    (await evaluateA1Attenuation(await input({ at_height: 999999 })))
      .reason_code,
    "mandate_not_final_or_expired",
  );
});

Deno.test("attenuation — RED TEAM: an effect outside the A1 set is denied", async () => {
  const v = await evaluateA1Attenuation(
    await input({
      intent: {
        verb: "regen-projection",
        target: "x7B88_evidence_report",
        effects: ["source_change"],
      },
    }),
  );
  assert(!v.eligible);
  assertEquals(v.reason_code, "not_semantic_a1");
});

Deno.test("attenuation — path containment rejects escapes/absolutes/symlinks", () => {
  assert(pathContained("src/x7B88_evidence_report.myc.md"));
  assert(!pathContained("../escape.ts"));
  assert(!pathContained("/etc/passwd"));
  assert(!pathContained("src/../../x"));
});

Deno.test("attenuation registry — skills adapter uses the canonical dispatch handle", () => {
  const skills = EPOCH1_ADAPTERS.find((a) =>
    a.target === "x8CF0_skills_bootstrap"
  );
  assertEquals(skills?.argv, ["./t", "skill", "--stable"]);
});
