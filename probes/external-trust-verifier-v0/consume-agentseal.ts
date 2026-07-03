// Prove the PUBLISHED product, not the local source. This imports
// @s0fractal/agentseal straight from the jsr registry (pinned to 0.2.0) with
// --no-config, so it resolves nothing from this workspace — exactly what a
// stranger on their own machine gets. It seals an action, verifies it locally,
// and asserts the 0.2.0-only `sealAdmitted` surface exists (0.1.0 had neither
// sealAdmitted nor verifyAdmittedSeal — so this doubles as a version proof).
//
// Run:  deno run --no-config --allow-net probes/external-trust-verifier-v0/consume-agentseal.ts
import {
  seal,
  sealAdmitted,
  verifyAdmittedSeal,
  verifySeal,
} from "jsr:@s0fractal/agentseal@0.2.0";
import { generateWitness } from "jsr:@s0fractal/witness";

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  Deno.exit(1);
}

const seat = await generateWitness();

// seal → verify roundtrips from the published artifact
const receipt = await seal(
  { verb: "fs.write", target: "summary.md", effects: ["source_change"] },
  [seat],
);
const v = await verifySeal(receipt, [seat.publicKey], 1);
if (!(v.receiptIntact && v.ok)) fail("published seal/verify did not roundtrip");

// tamper is caught from the published artifact
const forged = { ...receipt, intent: { ...receipt.intent, target: "secrets.env" } };
if ((await verifySeal(forged, [seat.publicKey], 1)).receiptIntact) {
  fail("published verifySeal accepted a tampered receipt");
}

// the 0.2.0 mandate-gated surface exists and is callable (version proof)
if (
  typeof sealAdmitted !== "function" || typeof verifyAdmittedSeal !== "function"
) {
  fail("0.2.0 surface (sealAdmitted / verifyAdmittedSeal) missing — stale publish");
}

console.log(
  "OK: jsr:@s0fractal/agentseal@0.2.0 — seals, verifies, catches tampering, exposes the mandate-gated API. Consumed from the registry, no local source.",
);
