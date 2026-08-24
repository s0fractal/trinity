// Declared transformations at the CNP-0 boundary.
//
//   §5.1.2.5  quantization from approximate computation
//   §5.1.2.6  exact simplex renormalization (renormalize_largest_remainder@v0)
//   §5.1.2.4  optional discrete circle domains (circle2n@v0 / circle256)
//
// Every operation here is exact integer arithmetic over bigint. No float
// multiplication happens anywhere: a source f64 is decomposed into an exact
// rational from its bit pattern, so "x * radix^places" is computed in the
// integers and the rounding decision is a comparison, not a hope about the
// host's rounding mode (§5.1.2 rule 4).

import { INT_MAX, INT_MIN, type JValue, serializeText } from "./jcs.ts";

export type TransformRejection =
  | "circle-point-out-of-range"
  | "renormalize-duplicate-coordinate"
  | "quantization-not-representable"
  | "quantization-overflow"
  | "quantization-nan"
  | "quantization-infinite"
  | "renormalize-negative-weight"
  | "renormalize-zero-sum";

export class TransformError extends Error {
  constructor(readonly rejection: TransformRejection, message: string) {
    super(`${rejection}: ${message}`);
    this.name = "TransformError";
  }
}

/* ------------------------------------------------------------------ *
 * §5.1.2.5 quantization
 * ------------------------------------------------------------------ */

export type QuantizationMode = "trunc_toward_zero" | "round_ties_even" | "reject";

/** An IEEE binary64 decomposed exactly, from its bit pattern. */
export type ExactF64 =
  | { kind: "finite"; num: bigint; den: bigint }
  | { kind: "nan" }
  | { kind: "infinite"; negative: boolean };

/**
 * Decompose a binary64 from its 64 bits. The bit pattern is the source of
 * truth rather than a decimal spelling, because a decimal literal in a fixture
 * would have to be parsed identically by every implementation before the test
 * could even begin — which is the property under test.
 */
export function f64FromBits(bits: bigint): ExactF64 {
  const sign = (bits >> 63n) & 1n;
  const exp = (bits >> 52n) & 0x7ffn;
  const frac = bits & 0xfffffffffffffn;
  if (exp === 0x7ffn) {
    return frac === 0n ? { kind: "infinite", negative: sign === 1n } : { kind: "nan" };
  }
  let num: bigint;
  let shift: bigint;
  if (exp === 0n) {
    num = frac;
    shift = -1074n;
  } else {
    num = frac + (1n << 52n);
    shift = exp - 1075n;
  }
  if (sign === 1n) num = -num;
  // value = num * 2^shift, kept as an exact fraction
  return shift >= 0n
    ? { kind: "finite", num: num << shift, den: 1n }
    : { kind: "finite", num, den: 1n << -shift };
}

function truncDiv(n: bigint, d: bigint): bigint {
  const q = n / d; // bigint division already truncates toward zero
  return q;
}

function roundTiesEven(n: bigint, d: bigint): bigint {
  const negative = (n < 0n) !== (d < 0n);
  const an = n < 0n ? -n : n;
  const ad = d < 0n ? -d : d;
  const q = an / ad;
  const r = an % ad;
  const twice = r * 2n;
  let out = q;
  if (twice > ad || (twice === ad && (q & 1n) === 1n)) out = q + 1n;
  return negative ? -out : out;
}

export type QuantizeResult = {
  value: bigint;
  exact: boolean;
};

/**
 * Map an approximate f64 into the exact fixed-point domain `radix^places`.
 * `reject` accepts only values already representable there, and is the default
 * at an irreversible boundary.
 */
export function quantize(
  bits: bigint,
  mode: QuantizationMode,
  radix: bigint,
  places: bigint,
): QuantizeResult {
  const x = f64FromBits(bits);
  if (x.kind === "nan") {
    throw new TransformError("quantization-nan", "NaN is not a value a state may hold");
  }
  if (x.kind === "infinite") {
    throw new TransformError(
      "quantization-infinite",
      `${x.negative ? "-" : "+"}Infinity is not a value a state may hold`,
    );
  }
  const total = radix ** places;
  const num = x.num * total;
  const den = x.den;
  const exact = num % den === 0n;

  let value: bigint;
  if (mode === "reject") {
    if (!exact) {
      throw new TransformError(
        "quantization-not-representable",
        `value is not exactly representable at radix^places = ${total}`,
      );
    }
    value = num / den;
  } else if (mode === "trunc_toward_zero") {
    value = truncDiv(num, den);
  } else {
    value = roundTiesEven(num, den);
  }

  if (value > INT_MAX || value < INT_MIN) {
    throw new TransformError(
      "quantization-overflow",
      `quantized value ${value} is outside the cnp-0 integer range`,
    );
  }
  return { value, exact };
}

/* ------------------------------------------------------------------ *
 * §5.1.2.6 renormalize_largest_remainder@v0
 * ------------------------------------------------------------------ */

export type Component = {
  /** The bound canonical coordinate identifier — a string, or the integer index
   *  of an ordered anonymous vector. Input array position is not a tie-breaker
   *  unless that position IS the bound identifier. */
  id: JValue;
  weight: bigint;
};

export type Renormalization = {
  mode: "renormalize_largest_remainder@v0";
  weights: bigint[];
  renormalized: boolean;
};

/** Byte-wise ascending comparison of two canonical encodings. */
function compareCanonicalBytes(a: JValue, b: JValue): number {
  const ta = new TextEncoder().encode(serializeText(a));
  const tb = new TextEncoder().encode(serializeText(b));
  const n = Math.min(ta.length, tb.length);
  for (let i = 0; i < n; i++) {
    if (ta[i] !== tb[i]) return ta[i] - tb[i];
  }
  return ta.length - tb.length;
}

/**
 * §5.1.2.6. Returns the weights in INPUT ORDER; the ordering used to allocate
 * the residual is over coordinate identifiers, never over array position.
 */
export function renormalizeLargestRemainder(
  components: Component[],
  total: bigint,
): Renormalization {
  // §5.1.2.6: "A simplex domain MUST bind one unique canonical coordinate
  // identifier to every component." Without uniqueness the tie-break is not a
  // function of the input, so two implementations can allocate the residual
  // differently and still look conforming.
  const seen = new Set<string>();
  for (const c of components) {
    const key = serializeText(c.id);
    if (seen.has(key)) {
      throw new TransformError(
        "renormalize-duplicate-coordinate",
        `coordinate identifier ${key} is bound to more than one component`,
      );
    }
    seen.add(key);
  }
  if (components.some((c) => c.weight < 0n)) {
    throw new TransformError("renormalize-negative-weight", "a weight is negative");
  }
  const S = components.reduce((a, c) => a + c.weight, 0n);
  if (S === 0n) {
    throw new TransformError("renormalize-zero-sum", "the weights sum to zero");
  }
  if (S === total) {
    return {
      mode: "renormalize_largest_remainder@v0",
      weights: components.map((c) => c.weight),
      renormalized: false,
    };
  }

  const rows = components.map((c, index) => ({
    index,
    id: c.id,
    q: (c.weight * total) / S,
    r: (c.weight * total) % S,
  }));

  const allocated = rows.reduce((a, row) => a + row.q, 0n);
  let residual = total - allocated;

  const order = [...rows].sort((a, b) => {
    if (a.r !== b.r) return a.r > b.r ? -1 : 1; // descending remainder
    return compareCanonicalBytes(a.id, b.id); // then ascending canonical bytes
  });

  const bump = new Set<number>();
  for (const row of order) {
    if (residual <= 0n) break;
    bump.add(row.index);
    residual -= 1n;
  }
  if (residual !== 0n) {
    throw new TransformError(
      "renormalize-zero-sum",
      `residual ${residual} could not be allocated over ${rows.length} components`,
    );
  }

  const weights = rows.map((row) => row.q + (bump.has(row.index) ? 1n : 0n));
  const check = weights.reduce((a, b) => a + b, 0n);
  if (check !== total) {
    throw new TransformError(
      "renormalize-zero-sum",
      `post-condition failed: ${check} != ${total}`,
    );
  }
  return { mode: "renormalize_largest_remainder@v0", weights, renormalized: true };
}

/* ------------------------------------------------------------------ *
 * §5.1.2.4 circle2n@v0 — optional discrete circle family
 * ------------------------------------------------------------------ */

export const CIRCLE_N = 8n;
export const CIRCLE_MODULUS = 1n << CIRCLE_N; // 256

/**
 * §5.1.2.4: "a point is an integer index in `[0, 2^n)`". An integer outside
 * that interval is NOT a point, so it is rejected rather than normalized —
 * normalizing it would accept a non-point as a point and quietly make two
 * distinct inputs equal, which is the failure canonical encoding exists to
 * prevent.
 */
export function circlePoint(index: bigint): bigint {
  if (index < 0n || index >= CIRCLE_MODULUS) {
    throw new TransformError(
      "circle-point-out-of-range",
      `${index} is not an index in [0, ${CIRCLE_MODULUS})`,
    );
  }
  return index;
}

/** §5.1.2.4: equality is equality of indices, over validated points. */
export function circleEqual(a: bigint, b: bigint): boolean {
  return circlePoint(a) === circlePoint(b);
}

/**
 * §5.1.2.4: "addition is exact modulo 2^n". The modulus applies to the RESULT
 * of adding two points; it is not a way to admit an out-of-range operand.
 */
export function circleAdd(a: bigint, b: bigint): bigint {
  const sum = circlePoint(a) + circlePoint(b);
  const m = sum % CIRCLE_MODULUS;
  return m < 0n ? m + CIRCLE_MODULUS : m;
}
