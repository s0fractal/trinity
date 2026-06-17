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
// the further a height is from an anchor the larger the error.
//
// DUAL-LENS (codex x6d00 §5 / x7d00; architect-chosen 2026-06-17):
//   - "compat" (DEFAULT): the stable historical anchor. A chord's displayed date
//     is reproducible and never shifts as time passes — at the cost of being
//     ~1 day early near the present. Use for historical/chord dates.
//   - "live": re-anchored to a recent objective block→time pair, so dates NEAR
//     the present are accurate. Use for current-distance / live-status displays,
//     NOT for stamping historical chord dates.
// Every caller that surfaces a block-derived date SHOULD label its lens
// (`describeLens`) so a reader knows which anchor produced it. Default stays
// compat so nothing shifts unless a caller opts in.

export type BlockLens = "compat" | "live";

// COMPAT anchor: block 950000 ≈ epoch 1779148800s (2026-05-19T00Z). Identical to
// the original consolidated anchor — the stable, reproducible historical lens.
export const BTC_ANCHOR_BLOCK = 950000;
export const BTC_ANCHOR_EPOCH_SEC = 1779148800;
export const BTC_SEC_PER_BLOCK = 600;

// LIVE anchor: block 954029 at epoch 1781658514 (observed via blockstream
// 2026-06-17). Near the present this is accurate; the compat anchor is ~25.6h
// early at this height. Refresh this pair when the live lens drifts.
export const BTC_LIVE_ANCHOR_BLOCK = 954029;
export const BTC_LIVE_ANCHOR_EPOCH_SEC = 1781658514;

function anchorOf(lens: BlockLens): { block: number; epochSec: number } {
  return lens === "live"
    ? { block: BTC_LIVE_ANCHOR_BLOCK, epochSec: BTC_LIVE_ANCHOR_EPOCH_SEC }
    : { block: BTC_ANCHOR_BLOCK, epochSec: BTC_ANCHOR_EPOCH_SEC };
}

/** Approximate UNIX epoch (seconds) for a bitcoin block height. The base
 *  primitive — most organs reason in seconds. Lens defaults to the stable
 *  compat anchor (no date shift unless a caller opts into "live"). */
export function epochSecOfBlock(
  block: number,
  lens: BlockLens = "compat",
): number {
  const a = anchorOf(lens);
  return a.epochSec + (block - a.block) * BTC_SEC_PER_BLOCK;
}

/** Approximate UNIX epoch (milliseconds) for a bitcoin block height. */
export function epochMsOfBlock(
  block: number,
  lens: BlockLens = "compat",
): number {
  return epochSecOfBlock(block, lens) * 1000;
}

/** Approximate ISO-8601 (UTC) wall time for a bitcoin block height. */
export function isoOfBlock(block: number, lens: BlockLens = "compat"): string {
  return new Date(epochMsOfBlock(block, lens)).toISOString();
}

/** Approximate bitcoin block height for a UNIX epoch (seconds) — the inverse of
 *  the anchor, floored to a whole block. */
export function blockOfEpochSec(
  epochSec: number,
  lens: BlockLens = "compat",
): number {
  const a = anchorOf(lens);
  return a.block + Math.floor((epochSec - a.epochSec) / BTC_SEC_PER_BLOCK);
}

/** Human label for which lens produced a date — for callers that surface one. */
export function describeLens(lens: BlockLens): string {
  return lens === "live"
    ? "live (recent anchor; accurate near the present)"
    : "compat (stable historical anchor; reproducible, ~1d early near present)";
}
