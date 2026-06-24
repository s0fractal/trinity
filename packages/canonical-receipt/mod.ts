/**
 * @s0fractal/canonical-receipt — deterministic, language-agnostic receipts.
 *
 * Two pure layers, zero dependencies:
 *   - canonical CBOR (RFC 8949 §4.2.1 deterministic encoding, a strict subset:
 *     floats, indefinite-length, tags, and non-canonical forms are forbidden, so
 *     the same value always produces the same bytes — and the same content hash);
 *   - a receipt envelope that wraps an opaque body, carries an ordered witness
 *     chain (multi-party co-signing), an optional clock and Bitcoin anchor, and
 *     verifies its own body hash on unwrap.
 *
 * Signing is yours: `coWitness` appends a signature you computed (any scheme), so
 * this package stays pure and portable (no crypto, no IO) — it gives you the exact
 * canonical bytes to sign and the structure to carry the signatures.
 *
 * Extracted verbatim from the trinity substrate's receipt-envelope encoder
 * (probes/receipt-envelope-encoder-v0), already vendored + parity-guarded by the
 * omega substrate. A parity test in this package holds the copy byte-faithful.
 *
 * @example
 * ```ts
 * import { encodeCanonical, toHex } from "@s0fractal/canonical-receipt";
 * const bytes = encodeCanonical({ b: 2, a: 1 });   // map keys sorted canonically
 * toHex(bytes); // stable across Deno/Node/Bun/browser → a content address
 * ```
 *
 * @module
 */
export {
  type CborValue,
  decodeCanonical,
  encodeCanonical,
  multihashSha256,
  toHex,
} from "./canonical_cbor.ts";
export {
  type BitcoinAnchor,
  type BodyKind,
  type ClockEntry,
  coWitness,
  type Envelope,
  ENVELOPE_SCHEMA,
  type SubstrateTag,
  unwrap,
  type UnwrapResult,
  type WitnessEntry,
  wrap,
  type WrapOptions,
} from "./envelope.ts";
