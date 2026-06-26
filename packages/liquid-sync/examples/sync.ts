// A 5-minute worked example: covenant-bound, clock-independent conflict resolution.
// Run it:  deno run packages/liquid-sync/examples/sync.ts
//
// Copying this out? Change the import to "jsr:@s0fractal/liquid-sync".
import {
  calculateResonance,
  covenantSeeds,
  floatToPhase,
  initCovenant,
  PayloadType,
  type PnCadBlock,
  resolveConflict,
} from "../mod.ts";

function block(phi: number, rho: number, rootByte: number): PnCadBlock {
  return {
    covenantSeed: 0,
    version: 1,
    payloadType: PayloadType.STATE_SYNC,
    phi,
    rho,
    delta: 0,
    timestamp: 0n,
    payloadMerkleRoot: new Uint8Array(32).fill(rootByte),
    payload: new Uint8Array(0),
    signature: new Uint8Array(64),
  };
}

// Bind this network to a covenant — its governance becomes its physics.
initCovenant({ covenant: "our community charter v1" });

// 1. Two writers disagree about the same key. Neither is "newer" — they conflict.
//    The winner is chosen by resonance with the target (ρ·cos), not by a clock.
const target = 1.0; // radians
const alice = block(/*phi*/ 1.0, /*rho*/ 0.9, /*root*/ 1); // on target
const bob = block(/*phi*/ 1.0 + Math.PI, /*rho*/ 0.9, /*root*/ 2); // opposite
const winner = resolveConflict(alice, bob, target);
console.log("conflict winner: ", winner === alice ? "alice" : "bob");

// 2. The winner is clock-independent: swap the timestamps, same winner.
const w2 = resolveConflict(
  { ...alice, timestamp: 999n },
  { ...bob, timestamp: 1n },
  target,
);
// compare by content — the spreads break reference equality, not the logic.
console.log(
  "clock-independent: ",
  winner.payloadMerkleRoot[0] === w2.payloadMerkleRoot[0],
);

// 3. Your governance is your physics. A fork that changes the covenant computes
//    different resonance for the SAME inputs — so it cannot silently merge back.
initCovenant({ covenant: "our community charter v1" });
const seedV1 = covenantSeeds().combined;
const resV1 = calculateResonance(floatToPhase(1.0), floatToPhase(1.2), 65535);

initCovenant({ covenant: "a forked charter that stripped a rule" });
const seedV2 = covenantSeeds().combined;
const resV2 = calculateResonance(floatToPhase(1.0), floatToPhase(1.2), 65535);

console.log("covenant changed: ", seedV1 !== seedV2);
console.log("different physics: ", resV1 !== resV2);
