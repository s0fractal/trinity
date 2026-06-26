import { assert, assertEquals } from "jsr:@std/assert@^1";
import {
  coSign,
  type CoSignature,
  generateWitness,
  sha256,
  verifyCoSignature,
  verifyQuorum,
} from "./witness.ts";

Deno.test("witness — a valid co-signature verifies; a tampered digest does not", async () => {
  const w = await generateWitness();
  const digest = await sha256(new TextEncoder().encode("deploy v2 to prod"));
  const cs = await coSign(w, digest);
  assertEquals(await verifyCoSignature(digest, cs), true);

  const otherDigest = await sha256(
    new TextEncoder().encode("deploy v3 to prod"),
  );
  assertEquals(
    await verifyCoSignature(otherDigest, cs),
    false,
    "a signature does not cover a different digest",
  );
});

Deno.test("witness — m-of-n quorum counts distinct authorized signers", async () => {
  const [alice, bob, carol] = await Promise.all([
    generateWitness(),
    generateWitness(),
    generateWitness(),
  ]);
  const authorized = [alice.publicKey, bob.publicKey, carol.publicKey];
  const digest = await sha256(new TextEncoder().encode("ratify proposal #7"));

  const sigs = await Promise.all([
    coSign(alice, digest),
    coSign(bob, digest),
  ]);

  const q = await verifyQuorum(digest, sigs, authorized, 2);
  assertEquals(q.valid, 2);
  assert(q.ok, "2 of 3 reaches a threshold of 2");

  const q3 = await verifyQuorum(digest, sigs, authorized, 3);
  assert(!q3.ok, "2 valid signatures cannot reach a threshold of 3");
});

Deno.test("witness — THE FIX: a single actor cannot forge an m-of-n quorum", async () => {
  // omega's hole: an identity was a dipole of the public name+salt, so one actor
  // could compute all five and 'vote' as all of them. Here an identity is a public
  // key, and signing needs the private key — which the attacker does not have.
  const [alice, bob, carol] = await Promise.all([
    generateWitness(),
    generateWitness(),
    generateWitness(),
  ]);
  const authorized = [alice.publicKey, bob.publicKey, carol.publicKey];
  const digest = await sha256(
    new TextEncoder().encode("terminate protected agent X"),
  );

  const attacker = await generateWitness();

  // 1. The attacker's own key is not an authorized seat → it does not count.
  const ownSig = await coSign(attacker, digest);
  const qOwn = await verifyQuorum(digest, [ownSig], authorized, 3);
  assertEquals(qOwn.valid, 0, "the attacker's own key is not a seat");

  // 2. The attacker copies alice's PUBLIC key onto a signature they made — but the
  //    signature was produced by the attacker's key, so it does not verify as alice.
  const forged: CoSignature = {
    publicKey: alice.publicKey,
    signature: ownSig.signature,
  };
  assertEquals(
    await verifyCoSignature(digest, forged),
    false,
    "cannot sign as alice without alice's private key",
  );

  // 3. So a forged '3-of-3' built from one key reaches a real count of 0.
  const qForged = await verifyQuorum(
    digest,
    [
      forged,
      { publicKey: bob.publicKey, signature: ownSig.signature },
      { publicKey: carol.publicKey, signature: ownSig.signature },
    ],
    authorized,
    3,
  );
  assertEquals(qForged.valid, 0, "no real private keys → no real quorum");
  assert(!qForged.ok);
});

Deno.test("witness — duplicate signatures from one seat count once", async () => {
  const alice = await generateWitness();
  const authorized = [alice.publicKey];
  const digest = await sha256(new TextEncoder().encode("x"));
  const cs = await coSign(alice, digest);
  const q = await verifyQuorum(digest, [cs, cs, cs], authorized, 2);
  assertEquals(q.valid, 1, "the same seat cannot be counted three times");
});
