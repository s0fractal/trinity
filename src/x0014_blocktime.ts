// src/x0014_blocktime.ts — canonical bitcoin block ↔ wall-clock conversion.
// position: 0/14 → foundation(0) × byte14 = shared temporal primitive
// maturity: active
// skill_safe: yes
//   pure arithmetic over a block height / epoch; no file, subprocess, or
//   network effects.
//
// Library helper (no main entry point): the ONE place the bitcoin anchor lives.
// This 3-constant anchor had been copy-pasted into ~9 organs (x2700 heartbeat,
// x2A00 lexicon, x2D00 inbox, x2F21 chord_surface, x2F30 resolver, x5910 compost,
// x8A00 memory, x8B00 decisions, x8D00 roadmap) under five different local names
// (BTC_ANCHOR_*, BTC_REF_*, CHORD_*_REF, REFERENCE_*) — a drift hazard with no
// single source of truth. As a bucket-0 library it is exempt from the coordinate
// gravity law, so any bucket may import it; organs should migrate their local
// copy here when next touched (rename-when-touched, per AGENTS guidance).
//
// The mapping is an APPROXIMATION (fixed 600 s/block) suitable for ORDERING and
// human-readable dates, NOT a precise clock — real inter-block time varies, so
// the further a height is from the anchor the larger the error (≈ tens of
// minutes per thousand blocks). To recalibrate, change the anchor pair HERE once
// and every importer updates together — that is the point of consolidation.

// Objective anchor: bitcoin block 950000 ≈ epoch 1779148800s (2026-05-19T00Z).
// (Kept identical to the historical per-organ copies so consolidation is a pure
//  structural change with no date drift; recalibration is a separate decision.)
export const BTC_ANCHOR_BLOCK = 950000;
export const BTC_ANCHOR_EPOCH_SEC = 1779148800;
export const BTC_SEC_PER_BLOCK = 600;

/** Approximate UNIX epoch (seconds) for a bitcoin block height. The base
 *  primitive — most organs reason in seconds. */
export function epochSecOfBlock(block: number): number {
  return BTC_ANCHOR_EPOCH_SEC + (block - BTC_ANCHOR_BLOCK) * BTC_SEC_PER_BLOCK;
}

/** Approximate UNIX epoch (milliseconds) for a bitcoin block height. */
export function epochMsOfBlock(block: number): number {
  return epochSecOfBlock(block) * 1000;
}

/** Approximate ISO-8601 (UTC) wall time for a bitcoin block height. */
export function isoOfBlock(block: number): string {
  return new Date(epochMsOfBlock(block)).toISOString();
}

/** Approximate bitcoin block height for a UNIX epoch (seconds) — the inverse of
 *  the anchor, floored to a whole block. */
export function blockOfEpochSec(epochSec: number): number {
  return BTC_ANCHOR_BLOCK +
    Math.floor((epochSec - BTC_ANCHOR_EPOCH_SEC) / BTC_SEC_PER_BLOCK);
}
