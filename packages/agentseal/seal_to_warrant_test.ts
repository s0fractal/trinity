import { assert, assertEquals } from "jsr:@std/assert@^1";
import { generateWitness, sha256, toHex } from "@s0fractal/witness";
import {
  deserializeReceipt,
  seal,
  sealAdmitted,
  sealToWarrant,
  verifySeal,
} from "./mod.ts";

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
  const rec = await sealToWarrant(sealed, {
    actor: "coding-agent@acme",
    ts: 1_784_249_600,
    witnessPolicy: {
      authorized: [alice.publicKey, bob.publicKey],
      threshold: 2,
    },
  });

  assertEquals(rec.decision, "accept");
  assertEquals(rec.actor, "coding-agent@acme");
  assertEquals(rec.ts, 1_784_249_600, "Warrant ts is explicit Unix seconds");
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
  const rec = await sealToWarrant(sealed, {
    actor: "agent@x",
    ts: 1_784_249_600,
  });
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
  const rec = await sealToWarrant(sealed, {
    actor: "a@b",
    ts: 1_784_249_600,
    witnessPolicy: { authorized: [alice.publicKey], threshold: 1 },
  });
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
  const rec = await sealToWarrant(sealed, {
    actor: "a@b",
    ts: 1_784_249_600,
    witnessPolicy: { authorized, threshold: 2 },
  });

  // A verifier extracts the receipt from the pack's evidence blob and re-checks
  // the m-of-n quorum with agentseal — no host, from the bytes alone.
  const receiptJson = JSON.parse(
    new TextDecoder().decode(rec.blobs.receipt.bytes),
  );
  const receipt = deserializeReceipt(receiptJson);
  const basis = JSON.parse(new TextDecoder().decode(rec.blobs.basis.bytes));
  assertEquals(basis.witness_policy.threshold, 2);
  assertEquals(
    basis.witness_policy.authorized_keys,
    authorized.map(toHex).sort(),
    "the basis pins the independently trusted roster",
  );
  const pinnedAuthorized = basis.witness_policy.authorized_keys.map(
    (hex: string) => Uint8Array.fromHex(hex),
  );
  const v = await verifySeal(
    receipt,
    pinnedAuthorized,
    basis.witness_policy.threshold,
  );
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
  const rec = await sealToWarrant(sealed, {
    actor: "reader@acme",
    ts: 1_784_249_600,
    witnessPolicy: { authorized: [seat.publicKey], threshold: 1 },
  });
  const basis = JSON.parse(new TextDecoder().decode(rec.blobs.basis.bytes));
  assertEquals(basis.kind, "agentseal-basis");
  assert(
    "mandate_commitment" in basis,
    "the basis pins the mandate commitment",
  );
  assert(rec.reason.includes("mandate"), "reason records the mandate binding");
});

Deno.test("bridge — never mistakes an agentseal anchor for Warrant Unix time", async () => {
  const alice = await generateWitness();
  const sealed = await seal(
    { verb: "read", target: "x", effects: ["read"] },
    [alice],
    { at: 955_000 },
  );
  let threw = false;
  try {
    await sealToWarrant(sealed, {
      actor: "a@b",
      witnessPolicy: { authorized: [alice.publicKey], threshold: 1 },
    } as never);
  } catch {
    threw = true;
  }
  assert(threw, "a Bitcoin height cannot silently become Warrant ts");
});

Deno.test("bridge — rejects a tampered or unauthorized allowed receipt", async () => {
  const [alice, mallory] = await Promise.all([
    generateWitness(),
    generateWitness(),
  ]);
  const sealed = await seal(
    { verb: "fs.write", target: "safe.md", effects: ["source_change"] },
    [alice],
    { at: 10 },
  );
  const common = { actor: "a@b", ts: 1_784_249_600 };

  let unauthorized = false;
  try {
    await sealToWarrant(sealed, {
      ...common,
      witnessPolicy: { authorized: [mallory.publicKey], threshold: 1 },
    });
  } catch {
    unauthorized = true;
  }
  assert(
    unauthorized,
    "a self-selected signer outside the trusted roster fails",
  );

  let tampered = false;
  try {
    await sealToWarrant(
      { ...sealed, intent: { ...sealed.intent, target: "secrets.env" } },
      {
        ...common,
        witnessPolicy: { authorized: [alice.publicKey], threshold: 1 },
      },
    );
  } catch {
    tampered = true;
  }
  assert(tampered, "receipt body tampering fails before Warrant fields exist");
});

Deno.test("bridge — malformed signature hex is rejected, never coerced", () => {
  let threw = false;
  try {
    deserializeReceipt({
      receiptDigest: "0".repeat(64),
      coSignatures: [{
        publicKey: "zz".repeat(32),
        signature: "0".repeat(128),
      }],
    });
  } catch {
    threw = true;
  }
  assert(threw, "invalid hex must not decode as zero bytes");
});
