// phase.ts — the covenant-perturbed phase engine: "your governance is your physics."
//
// A 256-entry integer cosine/sine lookup table drives all resonance math. The
// table is perturbed per-slot by a covenant seed, so two networks bound to
// different covenants compute different resonance for the same inputs and cannot
// silently converge. Pure integer math, no imports, runs anywhere.
//
// Honest scope: the perturbation is ±~1.5% and the seed is FNV-1a of public
// covenant text — so it is deterministic governance-scoping, not a cryptographic
// barrier (a determined fork can recompute the seed). What it guarantees is that
// forks do not *accidentally* converge and that every resonance is replayable
// under a stated covenant.

export type PhaseInt = number; // uint16: 0..65535 represents 0..2π
export type EnergyInt = number; // 0..65535
export type ResonanceInt = number; // 0..65535

export const PHASE_MASK = 0xFFFF;
export const PI_INT = 32768;
export const TWO_PI_INT = 65536;

const Q = 15;
const ONE_Q = 1 << Q; // 32768
const LUT_SIZE = 256;
const LUT_SHIFT = 8;
const LUT_MASK = 0xFF;

const cosTable = new Int16Array(LUT_SIZE);
const sinTable = new Int16Array(LUT_SIZE);

let covenantSeed = 0;
let axiomSeed = 0;
let combinedSeed = 0;

/** FNV-1a 32-bit, the seed hash. */
function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function buildLut(seed: number): void {
  for (let i = 0; i < LUT_SIZE; i++) {
    const angle = (i / LUT_SIZE) * Math.PI * 2;
    let cosValue = Math.round(Math.cos(angle) * ONE_Q);
    let sinValue = Math.round(Math.sin(angle) * ONE_Q);
    // Covenant perturbation: fold the seed to a small per-slot offset (±~1.5%),
    // so rankings stay similar for nearby covenants but bit-level determinism
    // breaks across covenant boundaries.
    if (seed !== 0) {
      const slotSeed = (seed ^ (seed >>> (i % 24))) & 0x1F;
      const perturbation = (slotSeed & 0xF) - 8;
      cosValue += perturbation * 64;
      sinValue += perturbation * 64;
    }
    // avoid Int16 wrap (32768 → -32768)
    cosTable[i] = Math.max(-32767, Math.min(32767, cosValue));
    sinTable[i] = Math.max(-32767, Math.min(32767, sinValue));
  }
}

// default: unperturbed LUT (no covenant) — backwards compatible.
buildLut(0);

/**
 * Bind the phase space to a covenant (and optional immutable axioms). Rebuilds
 * the LUT with a per-slot perturbation from the covenant text. Networks under
 * different covenants then compute different resonance and cannot silently merge.
 * Returns the combined seed (for verification). Call with no args to reset.
 */
export function initCovenant(
  opts: { covenant?: string; axioms?: string } = {},
): number {
  covenantSeed = opts.covenant ? fnv1a(opts.covenant) : 0;
  axiomSeed = opts.axioms ? fnv1a(opts.axioms) : 0;
  combinedSeed = (covenantSeed ^ axiomSeed) >>> 0;
  buildLut(combinedSeed);
  return combinedSeed;
}

/** The current covenant seeds (read-only snapshot, for verification/audit). */
export function covenantSeeds(): {
  covenant: number;
  axioms: number;
  combined: number;
} {
  return { covenant: covenantSeed, axioms: axiomSeed, combined: combinedSeed };
}

/** Map a radian angle to a uint16 phase. */
export function floatToPhase(rad: number): PhaseInt {
  return Math.floor((rad / (Math.PI * 2)) * TWO_PI_INT) & PHASE_MASK;
}

/** Map a uint16 phase back to radians. */
export function phaseToFloat(phi: PhaseInt): number {
  return (phi / TWO_PI_INT) * Math.PI * 2;
}

/** Direct (nearest-slot) cosine lookup, Q15. */
export function lookupCosDirect(phi: PhaseInt): number {
  return cosTable[(phi & PHASE_MASK) >>> LUT_SHIFT];
}

/** Second-order (Taylor) cosine lookup, Q15 — smooth between LUT slots. */
export function lookupCos(phi: PhaseInt): number {
  const wrapped = phi & PHASE_MASK;
  const index = wrapped >>> LUT_SHIFT;
  const frac = wrapped & LUT_MASK; // 0..255

  const c_base = cosTable[index];
  const s_base = sinTable[index];

  // cos(x+dx) ≈ cos(x) - dx·sin(x) - (dx²/2)·cos(x)
  const d1 = (s_base * 804) >> 15; // 804 ≈ normalized scaling for π/128
  const term1 = (d1 * frac) >> 8;
  const d2 = (c_base * 10) >> 15;
  const term2 = (d2 * frac * frac) >> 16;
  return c_base - term1 - term2;
}

/** Shortest absolute angular distance between two phases (0..π). */
export function calculateDelta(
  targetPhi: PhaseInt,
  candPhi: PhaseInt,
): PhaseInt {
  let diff = targetPhi - candPhi;
  if (diff < 0) diff += TWO_PI_INT;
  if (diff > PI_INT) diff = TWO_PI_INT - diff;
  return diff;
}

/** Should a datum at `dataPhi` propagate to a peer at `peerPhi`? (cos ≥ threshold) */
export function shouldPropagate(
  dataPhi: PhaseInt,
  peerPhi: PhaseInt,
  threshold = 0.5,
): boolean {
  const diff = calculateDelta(dataPhi, peerPhi);
  return lookupCos(diff) / ONE_Q >= threshold;
}

/**
 * Resonance score in [0, 65535]: how strongly a candidate phase aligns with a
 * target, weighted by energy. This is the conflict-resolution metric — the
 * winner of a write conflict is the one whose phase resonates most with the
 * target, not the one with the newest clock.
 */
export function calculateResonance(
  targetPhi: PhaseInt,
  candPhi: PhaseInt,
  energy: EnergyInt,
  dispersionScalar = 1.0,
): ResonanceInt {
  if (energy <= 0) return 0;
  const diff = calculateDelta(targetPhi, candPhi);
  let cosVal = lookupCos(diff); // -32767..32767
  cosVal = Math.round(cosVal * dispersionScalar);

  // Vaswani-2017 variance preservation: τ ≈ 0.58, so energy·19005 in Q15.
  const energyQ15 = Math.floor((energy / 65535) * 19005);
  const result = (cosVal * energyQ15) >> 15; // -19005..19005
  const finalVal = Math.floor(((result + 19005) / 38010) * 65535);
  return Math.max(0, Math.min(65535, finalVal));
}
