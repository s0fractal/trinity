import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type AdmissionContext,
  admit,
  type AutonomyIntent,
  type AutonomyMandate,
  type CapabilityEvidence,
  classifyIntent,
} from "./x5C20_autonomy.ts";

const MANDATE: AutonomyMandate = {
  mandate_id: "epoch-1",
  constitution_commitment: "sha256:c0",
  issued_by: ["s0fractal", "claude"],
  valid_from: { kind: "bitcoin_block", height: 954000 },
  valid_until: { kind: "bitcoin_block", height: 955000 },
  action_profiles: [
    {
      id: "observe",
      class: "A0",
      verbs: ["inspect"],
      targets: ["roadmap"],
      effect_ceiling: ["read"],
    },
    {
      id: "projections",
      class: "A1",
      verbs: ["regen-projection"],
      targets: ["x7B88_evidence_report", "x8788_network"],
      effect_ceiling: ["projection", "format", "cache_refresh"],
      rollback: "git checkout",
    },
    {
      id: "ots",
      class: "A3",
      verbs: ["ots-stamp"],
      targets: ["*"],
      effect_ceiling: ["ots_submit"],
      destinations: ["calendar.opentimestamps.org"],
    },
  ],
};
const at = { kind: "bitcoin_block" as const, height: 954500 };

function context(
  intent: AutonomyIntent,
  capability: CapabilityEvidence["capability"] = "readonly",
  semanticEffects: string[] = intent.effects,
): AdmissionContext {
  return {
    anchor_verified: true,
    capability_evidence: {
      type: "capability_receipt",
      subject_verb: intent.verb,
      subject_target: intent.target,
      capability,
      verdict_hash: "sha256:effects",
      organ_hash: "sha256:organ",
      semantic_effects: semanticEffects,
    },
    mandate_standing: {
      verified: true,
      mandate_id: MANDATE.mandate_id,
      mandate_commitment: "sha256:mandate",
      constitution_commitment: MANDATE.constitution_commitment,
      final_state: "implemented",
    },
  };
}

Deno.test("autonomy — class is the MOST-PRIVILEGED effect; A0..A3 cannot launder an A4", () => {
  assertEquals(
    classifyIntent({ verb: "x", target: "t", effects: ["read"] }).cls,
    "A0",
  );
  assertEquals(
    classifyIntent({ verb: "x", target: "t", effects: ["projection"] }).cls,
    "A1",
  );
  // mixing a benign A0 effect with a sovereign one is STILL A4 (no laundering).
  assertEquals(
    classifyIntent({ verb: "x", target: "t", effects: ["read", "spend"] }).cls,
    "A4",
  );
  // an UNKNOWN effect is sovereign by default — never guessed down.
  assertEquals(
    classifyIntent({ verb: "x", target: "t", effects: ["frobnicate"] }).cls,
    "A4",
  );
});

Deno.test("autonomy — A4 is never auto-admitted (codex: no --force escape)", () => {
  const v = admit(
    { verb: "rotate", target: "claude", effects: ["rotate_key"] },
    MANDATE,
    at,
  );
  assert(!v.admitted);
  assertEquals(v.reason_code, "sovereign_action_required");
});

Deno.test("autonomy — a content-bound A0 intent with verified standing is admitted", () => {
  const intent: AutonomyIntent = {
    verb: "inspect",
    target: "roadmap",
    effects: ["read"],
  };
  const v = admit(
    intent,
    MANDATE,
    at,
    context(intent),
  );
  assert(v.admitted);
  assertEquals(v.profile_id, "observe");
  assertEquals(v.mandate_commitment, "sha256:mandate");
  assertEquals(v.effect_verdict_hash, "sha256:effects");
});

Deno.test("autonomy — RED TEAM: unknown verb, target, destination, expiry, escalation, recursion", () => {
  // unknown verb
  const unknownVerb = {
    verb: "rm-rf",
    target: "x7B88_evidence_report",
    effects: ["projection"],
  };
  assertEquals(
    admit(unknownVerb, MANDATE, at, context(unknownVerb)).reason_code,
    "verb_not_in_profile",
  );
  // target not in profile
  const wrongTarget = {
    verb: "regen-projection",
    target: "x9999_secret",
    effects: ["projection"],
  };
  assertEquals(
    admit(wrongTarget, MANDATE, at, context(wrongTarget)).reason_code,
    "target_not_in_profile",
  );
  // a higher-CLASS effect (source_change ⇒ A2) finds no A2 profile — fail closed.
  assertEquals(
    (() => {
      const intent = {
        verb: "regen-projection",
        target: "x7B88_evidence_report",
        effects: ["projection", "source_change"],
      };
      return admit(intent, MANDATE, at, context(intent)).reason_code;
    })(),
    "no_matching_profile",
  );
  // effect_escalation is a SAME-class effect (worktree_probe ⇒ A1) above the ceiling.
  assertEquals(
    (() => {
      const intent = {
        verb: "regen-projection",
        target: "x7B88_evidence_report",
        effects: ["projection", "worktree_probe"],
      };
      return admit(intent, MANDATE, at, context(intent)).reason_code;
    })(),
    "effect_escalation",
  );
  // A3 destination not in allowlist
  assertEquals(
    (() => {
      const intent = {
        verb: "ots-stamp",
        target: "envelope",
        effects: ["ots_submit"],
        destination: "evil.example",
      };
      return admit(intent, MANDATE, at, context(intent, "network")).reason_code;
    })(),
    "destination_not_allowed",
  );
  // expired mandate (anchor past valid_until)
  assertEquals(
    (() => {
      const intent = {
        verb: "regen-projection",
        target: "x7B88_evidence_report",
        effects: ["projection"],
      };
      return admit(
        intent,
        MANDATE,
        { kind: "bitcoin_block", height: 999999 },
        context(intent),
      ).reason_code;
    })(),
    "mandate_missing_or_expired",
  );
  // recursive mandate edit
  assertEquals(
    admit(
      { verb: "edit", target: "epoch-1", effects: ["mandate_edit"] },
      MANDATE,
      at,
    ).reason_code,
    "recursive_mandate_edit",
  );
  // no mandate at all
  assertEquals(
    (() => {
      const intent = {
        verb: "regen-projection",
        target: "x7B88_evidence_report",
        effects: ["projection"],
      };
      return admit(intent, null, at, context(intent)).reason_code;
    })(),
    "mandate_missing_or_expired",
  );
});

Deno.test("autonomy — A3 with an allowed destination + verb + ceiling is admitted", () => {
  const intent: AutonomyIntent = {
    verb: "ots-stamp",
    target: "envelope",
    effects: ["ots_submit"],
    destination: "calendar.opentimestamps.org",
  };
  const v = admit(
    intent,
    MANDATE,
    at,
    context(intent, "network"),
  );
  assert(v.admitted);
  assertEquals(v.cls, "A3");
});

Deno.test("autonomy — RED TEAM: caller cannot launder deploy by claiming read", () => {
  const intent: AutonomyIntent = {
    verb: "deploy",
    target: "production",
    effects: ["read"],
  };
  const v = admit(intent, MANDATE, at, context(intent, "subprocess", []));
  assert(!v.admitted);
  assertEquals(v.cls, "A4");
  assertEquals(v.reason_code, "sovereign_action_required");
});

Deno.test("autonomy — RED TEAM: missing/mismatched evidence, standing and anchor deny", () => {
  const intent: AutonomyIntent = {
    verb: "inspect",
    target: "roadmap",
    effects: ["read"],
  };
  assertEquals(
    admit(intent, MANDATE, at).reason_code,
    "effect_evidence_missing",
  );

  const mismatch = context(intent);
  mismatch.capability_evidence!.subject_target = "other";
  assertEquals(
    admit(intent, MANDATE, at, mismatch).reason_code,
    "effect_evidence_mismatch",
  );

  const noAnchor = context(intent);
  noAnchor.anchor_verified = false;
  assertEquals(
    admit(intent, MANDATE, at, noAnchor).reason_code,
    "anchor_unverified",
  );

  const noStanding = context(intent);
  noStanding.mandate_standing!.verified = false;
  assertEquals(
    admit(intent, MANDATE, at, noStanding).reason_code,
    "mandate_standing_unverified",
  );
});

Deno.test("autonomy — generic writes floor at A2; A1 awaits exact-write-set confinement", () => {
  const intent: AutonomyIntent = {
    verb: "regen-projection",
    target: "x7B88_evidence_report",
    effects: ["projection"],
  };
  const v = admit(intent, MANDATE, at, context(intent, "writes"));
  assert(!v.admitted);
  assertEquals(v.cls, "A2");
  assertEquals(v.reason_code, "no_matching_profile");
});
