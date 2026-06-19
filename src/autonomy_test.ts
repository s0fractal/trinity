import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  admit,
  type AutonomyIntent,
  type AutonomyMandate,
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

Deno.test("autonomy — a valid A1 intent inside its profile is admitted", () => {
  const v = admit(
    {
      verb: "regen-projection",
      target: "x7B88_evidence_report",
      effects: ["projection"],
    },
    MANDATE,
    at,
  );
  assert(v.admitted);
  assertEquals(v.profile_id, "projections");
});

Deno.test("autonomy — RED TEAM: unknown verb, target, destination, expiry, escalation, recursion", () => {
  // unknown verb
  assertEquals(
    admit(
      {
        verb: "rm-rf",
        target: "x7B88_evidence_report",
        effects: ["projection"],
      },
      MANDATE,
      at,
    ).reason_code,
    "verb_not_in_profile",
  );
  // target not in profile
  assertEquals(
    admit(
      {
        verb: "regen-projection",
        target: "x9999_secret",
        effects: ["projection"],
      },
      MANDATE,
      at,
    ).reason_code,
    "target_not_in_profile",
  );
  // a higher-CLASS effect (source_change ⇒ A2) finds no A2 profile — fail closed.
  assertEquals(
    admit(
      {
        verb: "regen-projection",
        target: "x7B88_evidence_report",
        effects: ["projection", "source_change"],
      },
      MANDATE,
      at,
    ).reason_code,
    "no_matching_profile",
  );
  // effect_escalation is a SAME-class effect (worktree_probe ⇒ A1) above the ceiling.
  assertEquals(
    admit(
      {
        verb: "regen-projection",
        target: "x7B88_evidence_report",
        effects: ["projection", "worktree_probe"],
      },
      MANDATE,
      at,
    ).reason_code,
    "effect_escalation",
  );
  // A3 destination not in allowlist
  assertEquals(
    admit(
      {
        verb: "ots-stamp",
        target: "envelope",
        effects: ["ots_submit"],
        destination: "evil.example",
      },
      MANDATE,
      at,
    ).reason_code,
    "destination_not_allowed",
  );
  // expired mandate (anchor past valid_until)
  assertEquals(
    admit(
      {
        verb: "regen-projection",
        target: "x7B88_evidence_report",
        effects: ["projection"],
      },
      MANDATE,
      { kind: "bitcoin_block", height: 999999 },
    ).reason_code,
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
    admit(
      {
        verb: "regen-projection",
        target: "x7B88_evidence_report",
        effects: ["projection"],
      },
      null,
      at,
    ).reason_code,
    "mandate_missing_or_expired",
  );
});

Deno.test("autonomy — A3 with an allowed destination + verb + ceiling is admitted", () => {
  const v = admit(
    {
      verb: "ots-stamp",
      target: "envelope",
      effects: ["ots_submit"],
      destination: "calendar.opentimestamps.org",
    },
    MANDATE,
    at,
  );
  assert(v.admitted);
  assertEquals(v.cls, "A3");
});
