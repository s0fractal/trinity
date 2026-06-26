// A 5-minute worked example: an action no single party can authorize alone.
// Run it:  deno run packages/witness/examples/quorum.ts
//
// Copying this out? Change the import to "jsr:@s0fractal/witness".
import {
  coSign,
  type CoSignature,
  generateWitness,
  sha256,
  verifyQuorum,
} from "../mod.ts";

// Three oracles, each holding a real keypair (in production: their own custody).
const [alice, bob, carol] = await Promise.all([
  generateWitness(),
  generateWitness(),
  generateWitness(),
]);
const seats = [alice.publicKey, bob.publicKey, carol.publicKey];

// A consequential action, content-addressed.
const digest = await sha256(
  new TextEncoder().encode("terminate protected agent X"),
);

// 1. Two of the three co-sign → a 2-of-3 quorum is reached.
const sigs = [await coSign(alice, digest), await coSign(bob, digest)];
const q = await verifyQuorum(digest, sigs, seats, 2);
console.log("quorum reached: ", q.ok, `(${q.valid} of 3)`);

// 2. A lone attacker, holding only their own key, cannot fake the other two —
//    pasting their public keys onto one signature produces zero valid seats.
const attacker = await generateWitness();
const attackerSig = await coSign(attacker, digest);
const forged: CoSignature[] = [
  { publicKey: alice.publicKey, signature: attackerSig.signature },
  { publicKey: bob.publicKey, signature: attackerSig.signature },
  { publicKey: carol.publicKey, signature: attackerSig.signature },
];
const qForged = await verifyQuorum(digest, forged, seats, 3);
console.log("forged quorum valid: ", qForged.valid);

// 3. Every check above was local — no server was contacted.
console.log("verified locally: ", true);
