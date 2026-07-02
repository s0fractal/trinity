// The wedge, made concrete: cross-vendor, multi-hop provenance with NO shared
// identity provider and NO trusted host. Two independent vendors' agents act in a
// delegation chain; a third party who trusts neither verifies the whole chain
// locally, from public keys and bytes alone.
//
// Run it:  deno run packages/agentseal/examples/cross_vendor.ts
import { generateWitness } from "@s0fractal/witness";
import { seal, verifySeal } from "../mod.ts";

// Two vendors. Their keys are independent — there is no common IdP, no OAuth
// provider, no shared secret. Each vendor holds only its own keypair.
const vendorA = await generateWitness();
const vendorC = await generateWitness();

// Hop 1 — Vendor A's agent authorizes a task, sealed under A's key.
const hop1 = await seal(
  {
    verb: "delegate",
    target: "summarize:order-88213",
    effects: ["source_change"],
  },
  [vendorA],
  { at: 956402 },
);

// Hop 2 — Vendor C's agent performs the sub-action. Its receipt COMMITS to hop1's
// content address: the delegation link is a hash in the signed body, not a shared
// session or a login. Change the link and the content address changes.
const hop2 = await seal(
  {
    verb: "fs.write",
    target: "summary.md",
    effects: ["source_change"],
    delegated_from: hop1.receiptDigest,
  },
  [vendorC],
  { at: 956403 },
);

// A third party — no relationship to A or C, no account with either — verifies
// the whole chain LOCALLY. It is handed only the two receipts and the two public
// keys. No host is contacted.
const v1 = await verifySeal(hop1, [vendorA.publicKey], 1);
const v2 = await verifySeal(hop2, [vendorC.publicKey], 1);
const chainLinked =
  (hop2.intent as { delegated_from?: string }).delegated_from ===
    hop1.receiptDigest;

console.log("hop1 (vendor A) verifies: ", v1.receiptIntact && v1.ok);
console.log("hop2 (vendor C) verifies: ", v2.receiptIntact && v2.ok);
console.log("delegation chain intact:  ", chainLinked);
console.log(
  "cross-vendor, no shared IdP, no host — provable: ",
  v1.receiptIntact && v1.ok && v2.receiptIntact && v2.ok && chainLinked,
);

// Forgery: re-point hop2's delegation at a fabricated parent. The content address
// no longer matches its body — caught locally, by anyone, without asking us.
const forged = {
  ...hop2,
  intent: { ...hop2.intent, delegated_from: "0".repeat(64) },
};
const vf = await verifySeal(forged, [vendorC.publicKey], 1);
console.log("forged delegation caught: ", !vf.receiptIntact);
