// cnp-0 — the numeric profile carried by hsp-jcs@v0 (RFC-0003 Part 01 §5.1.2.1).
//
// The wire layer (jcs.ts) fixes the bytes. This layer fixes what may be said in
// them: the root profile members, the three tagged forms, the fixed-point scale
// descriptor, and the simplex sum rule.
//
// Clause map:
//   §5.1.2.1  root members, object model, bytes projection
//   §5.1.2    ratio reduction rules (den > 0, gcd == 1, zero is 0/1)
//   §5.1.2.2  scale descriptor shape and identity
//   §5.1.2.6  simplex sum, non-negative weights

import {
  INT_MAX,
  INT_MIN,
  isMap,
  type JMap,
  type JValue,
  readStrict,
  RejectError,
  serialize,
  sha256Hex,
} from "./jcs.ts";

export type ProfileRejection =
  | "profile-identifier-invalid"
  | "bytes-hex-invalid"
  | "ratio-not-reduced"
  | "ratio-non-positive-denominator"
  | "ratio-zero-not-canonical"
  | "fixed-scale-in-value"
  | "tagged-form-invalid"
  | "scale-descriptor-invalid"
  | "simplex-sum-invalid"
  | "simplex-negative-weight"
  | "simplex-zero-sum";

export class ProfileError extends Error {
  constructor(readonly rejection: ProfileRejection, message: string) {
    super(`${rejection}: ${message}`);
    this.name = "ProfileError";
  }
}

export const CANONICAL_ENCODING = "hsp-jcs@v0";
export const NUMERIC_PROFILE = "cnp-0";
export const SCALE_TAG = "hsp-scale@v0";

function get(m: JMap, name: string): JValue | undefined {
  const hit = m.entries.find(([k]) => k === name);
  return hit?.[1];
}

function names(m: JMap): string[] {
  return m.entries.map(([k]) => k);
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x;
}

const HEX_LOWER = /^[0-9a-f]*$/;

/** §5.1.2.1: the tagged forms. Extra members are a second source of truth. */
function validateTagged(m: JMap): void {
  const kind = get(m, "kind");
  if (typeof kind !== "string") return;

  if (kind === "bytes") {
    const expected = ["hex", "kind"];
    const got = [...names(m)].sort();
    if (got.length !== 2 || got[0] !== expected[0] || got[1] !== expected[1]) {
      throw new ProfileError(
        "tagged-form-invalid",
        `bytes takes exactly {kind, hex}, got {${got.join(", ")}}`,
      );
    }
    const hex = get(m, "hex");
    if (typeof hex !== "string") {
      throw new ProfileError("bytes-hex-invalid", "hex must be a string");
    }
    if (hex.length % 2 !== 0) {
      throw new ProfileError("bytes-hex-invalid", "hex must have even length");
    }
    if (!HEX_LOWER.test(hex)) {
      throw new ProfileError(
        "bytes-hex-invalid",
        "hex must be lowercase hexadecimal; uppercase is rejected, not normalized",
      );
    }
    return;
  }

  if (kind === "ratio") {
    const got = [...names(m)].sort();
    if (got.length !== 3 || got[0] !== "den" || got[1] !== "kind" || got[2] !== "num") {
      throw new ProfileError(
        "tagged-form-invalid",
        `ratio takes exactly {kind, num, den}, got {${got.join(", ")}}`,
      );
    }
    const num = get(m, "num");
    const den = get(m, "den");
    if (typeof num !== "bigint" || typeof den !== "bigint") {
      throw new ProfileError("tagged-form-invalid", "ratio components must be integers");
    }
    if (den <= 0n) {
      throw new ProfileError(
        "ratio-non-positive-denominator",
        `den must be > 0 so that sign lives in num only; got ${den}`,
      );
    }
    if (num === 0n && den !== 1n) {
      throw new ProfileError(
        "ratio-zero-not-canonical",
        `zero is {num: 0, den: 1} and nothing else; got den ${den}`,
      );
    }
    if (num !== 0n && gcd(num, den) !== 1n) {
      throw new ProfileError(
        "ratio-not-reduced",
        `${num}/${den} is not in lowest terms`,
      );
    }
    return;
  }

  if (kind === "fixed") {
    const got = [...names(m)].sort();
    if (got.includes("scale") || got.includes("scale_id")) {
      throw new ProfileError(
        "fixed-scale-in-value",
        "the scale descriptor is bound by the domain, never repeated per value",
      );
    }
    if (got.length !== 2 || got[0] !== "kind" || got[1] !== "value") {
      throw new ProfileError(
        "tagged-form-invalid",
        `fixed takes exactly {kind, value}, got {${got.join(", ")}}`,
      );
    }
    if (typeof get(m, "value") !== "bigint") {
      throw new ProfileError("tagged-form-invalid", "fixed value must be an integer");
    }
    return;
  }
}

function walk(v: JValue, fn: (m: JMap) => void): void {
  if (Array.isArray(v)) {
    for (const x of v) walk(x, fn);
    return;
  }
  if (isMap(v)) {
    fn(v);
    for (const [, x] of v.entries) walk(x, fn);
  }
}

/** §5.1.2.1: the root carries both identifiers; nested values do not repeat them. */
function validateRoot(v: JValue): void {
  if (!isMap(v)) {
    throw new ProfileError(
      "profile-identifier-invalid",
      "the hashed root must be an object carrying both profile members",
    );
  }
  const enc = get(v, "canonical_encoding");
  const prof = get(v, "numeric_profile");
  if (enc !== CANONICAL_ENCODING) {
    throw new ProfileError(
      "profile-identifier-invalid",
      `canonical_encoding must be ${JSON.stringify(CANONICAL_ENCODING)}, got ${JSON.stringify(enc)}`,
    );
  }
  if (prof !== NUMERIC_PROFILE) {
    throw new ProfileError(
      "profile-identifier-invalid",
      `numeric_profile must be ${JSON.stringify(NUMERIC_PROFILE)}, got ${JSON.stringify(prof)}`,
    );
  }
}

/** Full cnp-0 validation of a value already read under hsp-jcs@v0. */
export function validate(v: JValue): void {
  validateRoot(v);
  walk(v, validateTagged);
}

export type Canonical = {
  bytes: Uint8Array;
  text: string;
  sha256: string;
};

/**
 * The reference encoder candidate: raw input bytes to canonical bytes and the
 * full digest. Rejects rather than repairs.
 */
export async function canonicalize(raw: Uint8Array): Promise<Canonical> {
  const value = readStrict(raw);
  validate(value);
  const bytes = serialize(value);
  return {
    bytes,
    text: new TextDecoder().decode(bytes),
    sha256: await sha256Hex(bytes),
  };
}

/** The rejection class of any error this module or the wire layer raises. */
export function rejectionOf(e: unknown): string | undefined {
  if (e instanceof RejectError) return e.rejection;
  if (e instanceof ProfileError) return e.rejection;
  return undefined;
}

/** §5.1.2.2: the fixed-point scale descriptor. */
export function validateScaleDescriptor(v: JValue): void {
  if (!isMap(v)) {
    throw new ProfileError("scale-descriptor-invalid", "descriptor must be an object");
  }
  validateRoot(v);
  if (get(v, "scale") !== SCALE_TAG) {
    throw new ProfileError("scale-descriptor-invalid", `scale must be ${SCALE_TAG}`);
  }
  const radix = get(v, "radix");
  const places = get(v, "places");
  if (radix !== 2n && radix !== 10n) {
    throw new ProfileError("scale-descriptor-invalid", "radix must be 2 or 10");
  }
  if (typeof places !== "bigint" || places < 0n) {
    throw new ProfileError("scale-descriptor-invalid", "places must be a non-negative integer");
  }
  const unitRef = get(v, "unit_ref");
  if (unitRef !== null && typeof unitRef !== "string") {
    throw new ProfileError(
      "scale-descriptor-invalid",
      "unit_ref is null or a full content digest",
    );
  }
  const total = radix ** places;
  if (total > INT_MAX || total < INT_MIN) {
    throw new ProfileError(
      "scale-descriptor-invalid",
      `radix^places = ${total} is outside the cnp-0 integer range`,
    );
  }
}

/** radix^places for a validated descriptor. */
export function scaleTotal(v: JMap): bigint {
  return (get(v, "radix") as bigint) ** (get(v, "places") as bigint);
}

/**
 * §5.1.2.6 / §6.4: a fixed-point simplex sums to radix^places exactly, with no
 * negative weight. This is validation, not encoding — which is why it is a
 * separate entry point rather than part of `validate`.
 */
export function validateFixedSimplex(weights: bigint[], total: bigint): void {
  if (weights.some((w) => w < 0n)) {
    throw new ProfileError("simplex-negative-weight", "a weight is negative");
  }
  const sum = weights.reduce((a, b) => a + b, 0n);
  if (sum === 0n) {
    throw new ProfileError("simplex-zero-sum", "the weights sum to zero");
  }
  if (sum !== total) {
    throw new ProfileError(
      "simplex-sum-invalid",
      `weights sum to ${sum}, not radix^places = ${total}`,
    );
  }
}

/** §5.1.2: a ratio simplex sums to exactly one under exact arithmetic. */
export function validateRatioSimplex(parts: { num: bigint; den: bigint }[]): void {
  if (parts.some((p) => p.num < 0n)) {
    throw new ProfileError("simplex-negative-weight", "a component is negative");
  }
  let num = 0n;
  let den = 1n;
  for (const p of parts) {
    num = num * p.den + p.num * den;
    den = den * p.den;
  }
  if (num === 0n) {
    throw new ProfileError("simplex-zero-sum", "the components sum to zero");
  }
  if (num !== den) {
    throw new ProfileError(
      "simplex-sum-invalid",
      `components sum to ${num}/${den}, not 1`,
    );
  }
}
