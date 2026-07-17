import { assert, assertEquals } from "jsr:@std/assert@^1";
import { generateWitness, sha256, toHex } from "@s0fractal/witness";
import { seal, sealAdmitted, verifySeal } from "./agentseal.ts";
import { deserializeReceipt, sealToWarrant } from "./seal_to_warrant.ts";

const HEX64 = /^[0-9a-f]{64}$/;

Deno.test("bridge — an allowed action maps to an `accept` Warrant record", async () => {
  const [alice, bob] = await Promise.all([
    generateWitness(),
    generateWitness(),
  ]);
  const sealed = await seal(
    { verb: "fs.write", target: "README.md", effects: ["source_change"] },
    [alice, bob],
    { at: 955000 },
  );
  const rec = await sealToWarrant(sealed, { actor: "coding-agent@acme" });

  assertEquals(rec.decision, "accept");
  assertEquals(rec.actor, "coding-agent@acme");
  assertEquals(rec.ts, 955000, "the seal's anchor becomes the Warrant ts");
  assert(HEX64.test(rec.subject), "subject is a resolvable hash");
  assert(HEX64.test(rec.under), "under (basis) is a resolvable hash");
  assertEquals(rec.evidence.length, 1);
  assert(HEX64.test(rec.evidence[0]), "the receipt rides as evidence");
  assert(rec.reason.includes("A2"), "reason records the class");
  assert(rec.reason.includes("quorum 2"), "reason records the quorum size");
  assert(
    rec.reason.includes(sealed.receiptDigest),
    "reason cites the receipt digest",
  );
});

Deno.test("bridge — a refused (A4) action maps to a `reject` Warrant record", async () => {
  const alice = await generateWitness();
  const sealed = await seal(
    { verb: "shell", target: "rm -rf /", effects: ["destructive"] },
    [alice],
    { at: 1 },
  );
  assert(!sealed.allowed);
  const rec = await sealToWarrant(sealed, { actor: "agent@x" });
  assertEquals(rec.decision, "reject");
  assert(
    rec.reason.includes("refused"),
    "reason marks the fail-closed refusal",
  );
});

Deno.test("bridge — blobs are content-addressed (sha256(bytes) == hash)", async () => {
  const alice = await generateWitness();
  const sealed = await seal(
    { verb: "read", target: "x", effects: ["read"] },
    [alice],
    { at: 5 },
  );
  const rec = await sealToWarrant(sealed, { actor: "a@b" });
  for (const [name, b] of Object.entries(rec.blobs)) {
    assertEquals(
      toHex(await sha256(b.bytes)),
      b.hash,
      `${name} blob is content-addressed`,
    );
  }
  assertEquals(rec.blobs.receipt.hash, rec.evidence[0]);
  assertEquals(rec.blobs.subject.hash, rec.subject);
  assertEquals(rec.blobs.basis.hash, rec.under);
});

Deno.test("bridge — the quorum survives inside the evidence blob (agentseal re-verifies from the pack)", async () => {
  const [alice, bob] = await Promise.all([
    generateWitness(),
    generateWitness(),
  ]);
  const authorized = [alice.publicKey, bob.publicKey];
  const sealed = await seal(
    { verb: "fs.write", target: "a", effects: ["source_change"] },
    [alice, bob],
    { at: 10 },
  );
  const rec = await sealToWarrant(sealed, { actor: "a@b" });

  // A verifier extracts the receipt from the pack's evidence blob and re-checks
  // the m-of-n quorum with agentseal — no host, from the bytes alone.
  const receiptJson = JSON.parse(
    new TextDecoder().decode(rec.blobs.receipt.bytes),
  );
  const receipt = deserializeReceipt(receiptJson);
  const v = await verifySeal(receipt, authorized, 2);
  assert(v.receiptIntact, "the embedded receipt still hashes to its digest");
  assert(v.ok, "the 2-of-2 quorum re-verifies from the evidence blob");
});

Deno.test("bridge — a mandate-gated seal records the mandate binding in the basis + reason", async () => {
  const seat = await generateWitness();
  const at = { kind: "bitcoin_block", height: 1000 } as const;
  const mandate = {
    mandate_id: "m1",
    constitution_commitment: "c1",
    issued_by: ["operator"],
    valid_from: { kind: "bitcoin_block", height: 0 } as const,
    valid_until: { kind: "bitcoin_block", height: 1_000_000 } as const,
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
  const rec = await sealToWarrant(sealed, { actor: "reader@acme" });
  const basis = JSON.parse(new TextDecoder().decode(rec.blobs.basis.bytes));
  assertEquals(basis.kind, "agentseal-basis");
  assert(
    "mandate_commitment" in basis,
    "the basis pins the mandate commitment",
  );
  assert(rec.reason.includes("mandate"), "reason records the mandate binding");
});

Deno.test("bridge — refuses to fabricate a timestamp when the seal has none", async () => {
  const alice = await generateWitness();
  const sealed = await seal({ verb: "read", target: "x", effects: ["read"] }, [
    alice,
  ]);
  // `seal` without `at` leaves the receipt anchorless; the bridge must not invent one.
  let threw = false;
  try {
    await sealToWarrant(sealed, { actor: "a@b" });
  } catch {
    threw = true;
  }
  assert(threw, "no anchor and no opts.ts → error, not a fabricated timestamp");
});
