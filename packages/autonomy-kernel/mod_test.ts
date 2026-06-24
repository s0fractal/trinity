import { assert, assertEquals } from "jsr:@std/assert@^1";
import {
  type AdmissionContext,
  admit,
  type Anchor,
  type AutonomyIntent,
  type AutonomyMandate,
  classifyIntent,
} from "./mod.ts";

const I = (effects: string[]): AutonomyIntent => ({
  verb: "v",
  target: "t",
  effects,
});

Deno.test("classifyIntent — the most-privileged effect sets the class", () => {
  assertEquals(classifyIntent(I(["read"])).cls, "A0");
  assertEquals(classifyIntent(I(["format"])).cls, "A1");
  assertEquals(classifyIntent(I(["source_change"])).cls, "A2");
  assertEquals(classifyIntent(I(["fetch_public"])).cls, "A3");
  assertEquals(classifyIntent(I(["deploy"])).cls, "A4");
  assertEquals(classifyIntent(I(["read", "deploy", "format"])).cls, "A4");
});

Deno.test("classifyIntent — an unknown effect is sovereign (fail-closed)", () => {
  const v = classifyIntent(I(["totally_made_up_effect"]));
  assertEquals(v.cls, "A4");
  assert(v.reason.includes("unknown"));
});

Deno.test("admit — deny-by-default: no mandate, no evidence ⇒ denied", () => {
  const at: Anchor = { kind: "bitcoin_block", height: 1 };
  assertEquals(admit(I(["read"]), null, at).admitted, false);
});

Deno.test("admit — A4 is sovereign and never auto-admitted", () => {
  const at: Anchor = { kind: "bitcoin_block", height: 1 };
  const v = admit(I(["deploy"]), null, at);
  assertEquals(v.admitted, false);
  assertEquals(v.reason_code, "sovereign_action_required");
});

Deno.test("admit — a read-only mandate admits an A0 read with bound evidence", () => {
  const at: Anchor = { kind: "bitcoin_block", height: 1000 };
  const intent: AutonomyIntent = {
    verb: "fs.read",
    target: "app.ts",
    effects: ["read"],
  };
  const mandate: AutonomyMandate = {
    mandate_id: "m1",
    constitution_commitment: "c1",
    issued_by: ["operator"],
    valid_from: { kind: "bitcoin_block", height: 0 },
    valid_until: { kind: "bitcoin_block", height: 1_000_000 },
    action_profiles: [
      {
        id: "ro",
        class: "A0",
        verbs: ["*"],
        targets: ["*"],
        effect_ceiling: ["read"],
      },
    ],
  };
  const context: AdmissionContext = {
    anchor_verified: true,
    capability_evidence: {
      type: "capability_receipt",
      subject_verb: "fs.read",
      subject_target: "app.ts",
      capability: "readonly",
      verdict_hash: "h",
      organ_hash: "o",
      semantic_effects: ["read"],
    },
    mandate_standing: {
      verified: true,
      mandate_id: "m1",
      mandate_commitment: "mc1",
      constitution_commitment: "c1",
      final_state: "implemented",
    },
  };
  const v = admit(intent, mandate, at, context);
  assertEquals(v.admitted, true);
  assertEquals(v.reason_code, "admitted");
  // …and the SAME mandate denies a write (A2 has no profile here)
  assertEquals(
    admit(
      { verb: "fs.write", target: "app.ts", effects: ["source_change"] },
      mandate,
      at,
      context,
    )
      .admitted,
    false,
  );
});
