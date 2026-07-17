// The two halves of the s0fractal stack, joined end to end.
//
//   agentseal:  admit + classify (A0–A4) + m-of-n quorum   →  a witnessed receipt
//   bridge:     sealToWarrant(receipt)                      →  Warrant record fields
//   warrant:    file + sign + verify                        →  a verifiable evidence pack
//
// The receipt rides inside the pack as evidence, so a third party verifies the
// Warrant record with `warrant` AND re-checks the quorum with agentseal — from
// the bytes, no host. Run it (needs the `warrant` CLI: `pipx install warrant-verify`):
//
//   WARRANT_BIN="warrant" deno run -A packages/agentseal/examples/seal_to_warrant.ts
//
// Set WARRANT_BIN to a specific binary/venv if `warrant` isn't on PATH.

import { generateWitness } from "@s0fractal/witness";
import { sealAdmitted } from "../mod.ts";
import { sealToWarrant } from "../seal_to_warrant.ts";
import { runWarrant } from "./warrant_cli.ts";

const WARRANT = Deno.env.get("WARRANT_BIN") ?? "warrant";
const warrant = (store: string, args: string[]) =>
  runWarrant(WARRANT, store, args);

// 1) An agent, under a read-only mandate, reads a file — admitted, classified, witnessed.
const seat = await generateWitness();
const at = { kind: "bitcoin_block", height: 955_000 } as const;
const mandate = {
  mandate_id: "m1",
  constitution_commitment: "c1",
  issued_by: ["operator"],
  valid_from: { kind: "bitcoin_block", height: 0 } as const,
  valid_until: { kind: "bitcoin_block", height: 2_000_000 } as const,
  action_profiles: [{
    id: "ro",
    class: "A0" as const,
    verbs: ["*"],
    targets: ["*"],
    effect_ceiling: ["read"],
  }],
};
const context = {
  anchor_verified: true,
  capability_evidence: {
    type: "capability_receipt" as const,
    subject_verb: "fs.read",
    subject_target: "report.md",
    capability: "readonly" as const,
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
const sealed = await sealAdmitted(
  { verb: "fs.read", target: "report.md", effects: ["read"] },
  mandate,
  at,
  [seat],
  context,
);
console.log(
  `agentseal: ${sealed.cls} ${sealed.allowed ? "admitted" : "refused"}, ` +
    `receipt ${
      sealed.receiptDigest.slice(0, 12)
    }…, ${sealed.coSignatures.length} witness`,
);

// 2) Bridge the receipt into Warrant record fields + content-addressed blobs.
const rec = await sealToWarrant(sealed, {
  actor: "reader-agent@acme",
  // Warrant `ts` is Unix seconds. The receipt separately retains Bitcoin block
  // 955_000 as its causal anchor; conflating those clocks would lie to Warrant.
  ts: 1_784_249_600,
  witnessPolicy: { authorized: [seat.publicKey], threshold: 1 },
});

// 3) Build a Warrant evidence pack: init the store, drop the blobs, file the record.
const pack = await Deno.makeTempDir({ prefix: "agentseal-warrant-" });
const store = `${pack}/.warrants`;
await warrant(store, ["init"]);
for (const b of Object.values(rec.blobs)) {
  await Deno.writeFile(`${store}/blobs/${b.hash}`, b.bytes);
}
const keyPath = `${pack}/agent.key`;
await warrant(store, ["keygen", "--out", keyPath]);
const wid = await warrant(store, [
  rec.decision,
  "--subject",
  rec.subject,
  "--under",
  rec.under,
  "--evidence",
  rec.evidence[0],
  "--reason",
  rec.reason,
  "--actor",
  rec.actor,
  "--key",
  keyPath,
  "--ts",
  String(rec.ts),
]);
console.log(`bridge → warrant: filed ${rec.decision} ${wid.slice(0, 12)}…`);

// 4) Verify the pack (integrity + links + the receipt resolves as evidence).
console.log("\n$ warrant verify");
console.log(await warrant(store, ["verify"]));
console.log(`\npack: ${pack}`);
console.log(
  "the agentseal receipt is evidence in the pack; re-check its quorum " +
    "with agentseal's verifySeal (see seal_to_warrant_test.ts).",
);
