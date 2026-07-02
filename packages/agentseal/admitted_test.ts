import { assert, assertEquals } from "jsr:@std/assert@^1";
import type {
  AdmissionContext,
  Anchor,
  AutonomyIntent,
  AutonomyMandate,
} from "@s0fractal/autonomy-kernel";
import { generateWitness } from "@s0fractal/witness";
import { sealAdmitted, verifyAdmittedSeal } from "./mod.ts";

const at: Anchor = { kind: "bitcoin_block", height: 1000 };

// A read-only mandate: it authorizes A0 reads, nothing more.
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

const readIntent: AutonomyIntent = {
  verb: "fs.read",
  target: "app.ts",
  effects: ["read"],
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

Deno.test("agentseal admitted — a mandated action is sealed, bound to its mandate, and verifies", async () => {
  const seat = await generateWitness();
  const sealed = await sealAdmitted(readIntent, mandate, at, [seat], context);
  assert(sealed.allowed, `should be admitted: ${sealed.reason}`);
  assertEquals(sealed.mandateCommitment, "mc1"); // WHICH mandate is on the receipt
  const v = await verifyAdmittedSeal(sealed, [seat.publicKey], 1);
  assert(v.receiptIntact && v.ok, "the mandated, witnessed action verifies");
});

Deno.test("agentseal admitted — an action the mandate does not cover is refused, not witnessed", async () => {
  const seat = await generateWitness();
  // a write is above the read-only ceiling → not admitted
  const write: AutonomyIntent = {
    verb: "fs.write",
    target: "app.ts",
    effects: ["source_change"],
  };
  const sealed = await sealAdmitted(write, mandate, at, [seat], context);
  assert(!sealed.allowed, "a write under a read-only mandate must be refused");
  assertEquals(
    sealed.coSignatures.length,
    0,
    "a refused action is not witnessed",
  );
  // no mandate → also refused (fail-closed)
  const noMandate = await sealAdmitted(readIntent, null, at, [seat]);
  assert(!noMandate.allowed, "no mandate is denial, not permission");
});

Deno.test("agentseal admitted — tampering with the action OR the mandate binding is caught", async () => {
  const seat = await generateWitness();
  const sealed = await sealAdmitted(readIntent, mandate, at, [seat], context);

  // tamper the action
  const forgedAction = {
    ...sealed,
    intent: { ...sealed.intent, target: "secrets.env" },
  };
  assert(
    !(await verifyAdmittedSeal(forgedAction, [seat.publicKey], 1))
      .receiptIntact,
  );

  // tamper the mandate binding — re-point the receipt at a different mandate.
  // Because the mandate commitment is IN the content address, this breaks it too.
  const forgedMandate = { ...sealed, mandateCommitment: "some-other-mandate" };
  assert(
    !(await verifyAdmittedSeal(forgedMandate, [seat.publicKey], 1))
      .receiptIntact,
    "re-pointing the receipt at a different mandate must be caught",
  );
});
