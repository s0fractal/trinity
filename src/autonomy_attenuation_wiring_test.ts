import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type AdmissionContext,
  admit,
  type AutonomyMandate,
} from "./x5C20_autonomy.ts";

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
const AT = { kind: "bitcoin_block" as const, height: 954500 };
const intent = {
  verb: "regen-projection",
  target: "x7B88_evidence_report",
  effects: ["projection"],
};

function ctx(
  over: Partial<AdmissionContext> = {},
  capability = "writes",
): AdmissionContext {
  return {
    anchor_verified: true,
    capability_evidence: {
      type: "capability_receipt",
      subject_verb: intent.verb,
      subject_target: intent.target,
      capability: capability as never,
      verdict_hash: "sha256:v",
      organ_hash: "sha256:o",
      semantic_effects: [],
    },
    mandate_standing: {
      verified: true,
      mandate_id: "epoch-1",
      mandate_commitment: "sha256:m",
      constitution_commitment: "sha256:c0",
      final_state: "implemented",
    },
    attenuation: {
      eligible: true,
      execution_class: "A1",
      attenuation_hash: "sha256:att",
    },
    ...over,
  };
}

Deno.test("admit — a writes generator with a ratified attenuation executes as A1", () => {
  const v = admit(intent, MANDATE, AT, ctx());
  assert(v.admitted, v.reason);
  assertEquals(v.cls, "A1");
  assertEquals(v.intrinsic_class, "A2");
  assertEquals(v.attenuated, true);
  assertEquals(v.attenuation_hash, "sha256:att");
});

Deno.test("admit — WITHOUT attenuation the same writes generator is denied (A2, no profile)", () => {
  const v = admit(intent, MANDATE, AT, ctx({ attenuation: undefined }));
  assert(!v.admitted);
  assertEquals(v.cls, "A2");
  assertEquals(v.reason_code, "no_matching_profile");
});

Deno.test("admit — RED TEAM: attenuation can NEVER rescue a subprocess capability (stays A4)", () => {
  const v = admit(intent, MANDATE, AT, ctx({}, "subprocess"));
  assert(!v.admitted);
  assertEquals(v.cls, "A4");
  assertEquals(v.reason_code, "sovereign_action_required");
});

Deno.test("admit — RED TEAM: a genuine A2 effect is not attenuated even with a verdict", () => {
  const v = admit(
    { ...intent, effects: ["source_change"] },
    MANDATE,
    AT,
    ctx(),
  );
  assert(!v.admitted);
  assertEquals(v.cls, "A2"); // effects alone demand A2 → not attenuable
  assertEquals(v.attenuated, false);
});
