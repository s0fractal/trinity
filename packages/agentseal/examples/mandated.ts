// Who-did-what-UNDER-WHICH-MANDATE, in 40 lines. `seal` says what CLASS an action
// is; `sealAdmitted` proves a specific ratified MANDATE authorized it, and binds
// that mandate into the receipt so it can't be re-pointed later.
//
// Run it:  deno run packages/agentseal/examples/mandated.ts
import { generateWitness } from "@s0fractal/witness";
import { sealAdmitted, verifyAdmittedSeal } from "../mod.ts";

const at = { kind: "bitcoin_block", height: 1000 } as const;
const seat = await generateWitness();

// A read-only mandate: it authorizes A0 reads and nothing more.
const mandate = {
  mandate_id: "m1",
  constitution_commitment: "c1",
  issued_by: ["operator"],
  valid_from: { kind: "bitcoin_block", height: 0 } as const,
  valid_until: { kind: "bitcoin_block", height: 1_000_000 } as const,
  action_profiles: [
    {
      id: "ro",
      class: "A0" as const,
      verbs: ["*"],
      targets: ["*"],
      effect_ceiling: ["read"],
    },
  ],
};
// The standing that proves the mandate is real (verified, final, on-chain anchor).
const context = {
  anchor_verified: true,
  capability_evidence: {
    type: "capability_receipt" as const,
    subject_verb: "fs.read",
    subject_target: "report.md",
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
    final_state: "implemented" as const,
  },
};

// 1. A read the mandate covers → admitted, witnessed, and stamped with WHICH mandate.
const read = await sealAdmitted(
  { verb: "fs.read", target: "report.md", effects: ["read"] },
  mandate,
  at,
  [seat],
  context,
);
console.log(
  "read admitted:      ",
  read.allowed,
  " under mandate:",
  read.mandateCommitment,
);
const v = await verifyAdmittedSeal(read, [seat.publicKey], 1);
console.log("read verifies:      ", v.receiptIntact && v.ok);

// 2. A write the read-only mandate does NOT cover → refused, not witnessed.
const write = await sealAdmitted(
  { verb: "fs.write", target: "report.md", effects: ["source_change"] },
  mandate,
  at,
  [seat],
  context,
);
console.log("write admitted:     ", write.allowed, " (", write.reasonCode, ")");

// 3. Re-point the receipt at a different mandate → the content address breaks.
const forged = {
  ...read,
  mandateCommitment: "a-mandate-that-never-authorized-this",
};
const vf = await verifyAdmittedSeal(forged, [seat.publicKey], 1);
console.log("mandate swap caught:", !vf.receiptIntact);
