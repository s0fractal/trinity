// src/x4010_hash.ts — hash / identity / fqdn
// position: 4/01 → foundation(4) × first-singular(01) = base identity primitive
// hex_dipole: "00 00 00 00 6C 00 00 00"
//   foundation_container+0.85 (PRIMARY)
// placement_policy: axis
// intent: compute canonical FQDN hashes and signatures
// maturity: active
// horizon: none (schema verification implemented)
// skill_tag: hash
// skill_safe: yes
//

/**
 * Canonical hash kit for Trinity.
 *
 * The 12-hex FQDN prefix is the load-bearing identity primitive across
 * substrates. This module is the *single* TypeScript reference impl.
 *
 * Spec: contracts/CANONICAL_HASH.v0.1.md
 * Vectors: fixtures/canon-vectors.json
 *
 * Substrate parity:
 * - liquid TS: liquid/00_core/liquid_codec.ts MUST agree with this impl;
 *   verified by canon-vectors.json.
 * - omega Rust/WGSL: separate native impl; verified by canon-vectors.json.
 * - myc TS: SHOULD import from here when it consumes trinity.
 */

const encoder = new TextEncoder();

/** Lowercase hex of bytes. */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Full SHA-256 of a UTF-8 string, lowercase hex. */
export async function sha256Hex(body: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(body));
  return bytesToHex(new Uint8Array(buf));
}

/**
 * Full SHA-256 of a raw byte sequence, lowercase hex — the byte-shaped sibling
 * of {@link sha256Hex}. Copies the input first so a subarray VIEW hashes only
 * its own bytes (not the whole backing buffer). Byte-identical to the copies
 * the projection generators previously hand-rolled, so manifest hashes are
 * preserved bit-for-bit. sha256HexBytes(new TextEncoder().encode(s)) === sha256Hex(s).
 */
export async function sha256HexBytes(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", copy.buffer);
  return bytesToHex(new Uint8Array(buf));
}

/**
 * Canonical FQDN prefix: "h." + first 12 lowercase hex chars of SHA-256(body).
 *
 * Body is treated as a raw UTF-8 byte sequence; no whitespace stripping or
 * BOM removal. Canonicalization, if any, must happen *before* this call.
 */
export async function fqdnPrefix(body: string): Promise<string> {
  const full = await sha256Hex(body);
  return `h.${full.slice(0, 12)}`;
}

/** Verifies that a claimed prefix matches the body. Returns true on match. */
export async function verifyFqdnPrefix(
  body: string,
  claimed: string,
): Promise<boolean> {
  const expected = await fqdnPrefix(body);
  return expected === claimed;
}

/** Regular expression for validating canonical FQDN prefixes.
 *  Matches exactly "h." followed by 12 lowercase hexadecimal characters. */
export const FQDN_PREFIX_REGEX = /^h\.[0-9a-f]{12}$/;

/** Regular expression for validating standard SHA-256 hashes in hexadecimal format.
 *  Matches exactly 64 lowercase hexadecimal characters. */
export const SHA256_HEX_REGEX = /^[0-9a-f]{64}$/;

/** Validates that a string matches the FQDN prefix syntax. */
export function isValidFqdnPrefix(str: string): boolean {
  return FQDN_PREFIX_REGEX.test(str);
}

/** Validates that a string matches the SHA-256 hex syntax. */
export function isValidSha256Hex(str: string): boolean {
  return SHA256_HEX_REGEX.test(str);
}
