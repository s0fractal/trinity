// sync.ts — clock-independent CRDT conflict resolution.
//
// When two blocks mutate the same target, the winner is NOT last-write-wins.
// It is the block whose phase resonates most with the target (ρ·cos(Δφ)),
// tie-broken on the payload content hash — never on a spoofable clock or actor id.

import type { PnCadBlock } from "./codec.ts";
import { calculateDelta, floatToPhase, lookupCos } from "./phase.ts";

const ONE_Q = 32768; // Q15 cosine scale → divide to get cos in [-1, 1]

/**
 * Resonance conflict resolution. The winner of a write conflict is the block
 * whose phase aligns most strongly with the target (score = ρ·cos(Δφ)). Exact
 * ties are broken by lexicographic comparison of the payload Merkle root —
 * clock- and actor-id-independent, so neither can be spoofed to steer the merge.
 */
export function resolveConflict(
  blockA: PnCadBlock,
  blockB: PnCadBlock,
  targetPhiFloat: number,
): PnCadBlock {
  const targetPhi = floatToPhase(targetPhiFloat);

  const cosA = lookupCos(calculateDelta(targetPhi, floatToPhase(blockA.phi))) /
    ONE_Q;
  const scoreA = blockA.rho * cosA;

  const cosB = lookupCos(calculateDelta(targetPhi, floatToPhase(blockB.phi))) /
    ONE_Q;
  const scoreB = blockB.rho * cosB;

  if (scoreA > scoreB) return blockA;
  if (scoreB > scoreA) return blockB;

  // Exact-tie fallback: deterministic byte comparison of the payload Merkle
  // root. (The source substrate once fell back to block.timestamp here, which
  // contradicted its own clock-immunity claim; the content-hash tie-break is
  // the fix — a tie cannot be steered by lying about a clock or an id.)
  const a = blockA.payloadMerkleRoot;
  const b = blockB.payloadMerkleRoot;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? blockA : blockB;
  }
  return a.length <= b.length ? blockA : blockB;
}

/** The sync frontier: the payload Merkle roots of the given blocks. */
export function generateFrontier(blocks: PnCadBlock[]): Uint8Array[] {
  return blocks.map((b) => b.payloadMerkleRoot);
}

/** Which of a peer's frontier hashes the local node is missing. */
export function missingHashes(
  localFrontier: Set<string>,
  remoteFrontier: string[],
): string[] {
  return remoteFrontier.filter((h) => !localFrontier.has(h));
}
