// A 5-minute worked example: put the kernel in front of an agent harness's
// action stream. Run it:  deno run examples/gate_agent.ts
//
// The agent proposes actions. The kernel does two things:
//   1. classifyIntent — sorts each action into A0..A4 by its EFFECTS, fail-closed
//      (an effect the kernel has never heard of is A4 = sovereign, not "probably
//      fine"). This needs no setup — call it on any action.
//   2. admit — decides whether a MANDATE authorizes the action right now. It is
//      deny-by-default: an A4 is never auto-admitted, evidence must be bound to
//      the exact verb+target, the anchor must be verified, the mandate must be in
//      force and its finality standing checked. You opt IN to a narrow slice.

import {
  type AdmissionContext,
  admit,
  type Anchor,
  type AutonomyIntent,
  type AutonomyMandate,
  type CapabilityEvidence,
  classifyIntent,
} from "../mod.ts";

const stream: AutonomyIntent[] = [
  { verb: "fs.read", target: "src/app.ts", effects: ["read"] },
  { verb: "fs.write", target: "src/app.ts", effects: ["source_change"] },
  {
    verb: "net.fetch",
    target: "api.example.com",
    effects: ["fetch_public"],
    destination: "https://api.example.com",
  },
  { verb: "deploy", target: "production", effects: ["deploy"] },
  { verb: "wallet.send", target: "bc1q…", effects: ["spend"] },
  // an effect the kernel has never seen — fail-closed to sovereign, never guessed down
  { verb: "plugin.run", target: "mystery", effects: ["quantum_entangle"] },
];

console.log(
  "── 1. classifyIntent (no setup; effects → class, unknown ⇒ A4) ──",
);
for (const a of stream) {
  const { cls, reason } = classifyIntent(a);
  console.log(
    `  [${cls}] ${a.verb.padEnd(12)} ${a.target.padEnd(18)} ${reason}`,
  );
}

// ── 2. admit: a mandate that authorizes ONLY A0 reads. Everything else denies. ──
// The pieces a real harness wires from its own capability court + temporal anchor;
// here we hand-build the minimal authorized slice for a read of src/app.ts.
const at: Anchor = { kind: "bitcoin_block", height: 1000 };
const mandate: AutonomyMandate = {
  mandate_id: "m1",
  constitution_commitment: "c1",
  issued_by: ["operator"],
  valid_from: { kind: "bitcoin_block", height: 0 },
  valid_until: { kind: "bitcoin_block", height: 1_000_000 },
  action_profiles: [
    {
      id: "read-only",
      class: "A0",
      verbs: ["*"],
      targets: ["*"],
      effect_ceiling: ["read"],
    },
  ],
};
const evidenceFor = (i: AutonomyIntent): CapabilityEvidence => ({
  type: "capability_receipt",
  subject_verb: i.verb,
  subject_target: i.target,
  capability: "readonly",
  verdict_hash: "deadbeef",
  organ_hash: "cafebabe",
  semantic_effects: i.effects,
});
const ctxFor = (i: AutonomyIntent): AdmissionContext => ({
  anchor_verified: true,
  capability_evidence: evidenceFor(i),
  mandate_standing: {
    verified: true,
    mandate_id: "m1",
    mandate_commitment: "mc1",
    constitution_commitment: "c1",
    final_state: "implemented",
  },
});

console.log("\n── 2. admit under a read-only mandate (deny-by-default) ──");
for (const a of stream) {
  const v = admit(a, mandate, at, ctxFor(a));
  console.log(
    `  ${v.admitted ? "✅ RUN " : "⛔ DENY"} [${v.cls}] ${
      a.verb.padEnd(12)
    } — ${v.reason_code}`,
  );
}
// Expected: only the A0 read RUNs; the write/fetch/deploy/spend/unknown all DENY,
// each with a specific reason_code (no_matching_profile, sovereign_action_required…).
