// src/x4012_receipt_envelope.ts — local receipt-envelope adapter
// maturity: active
// skill_safe: yes-readonly
// boundary_adapter: probes/receipt-envelope-encoder-v0
//
// Centralizes the only Trinity runtime dependency on the receipt-envelope
// probe implementation. Runtime organs import this local ABI instead of
// reaching into ../probes directly, so audit can report one explicit boundary.

export {
  coWitness,
  ENVELOPE_SCHEMA,
  unwrap,
  wrap,
} from "../probes/receipt-envelope-encoder-v0/ts/envelope.ts";

export type {
  BitcoinAnchor,
  BodyKind,
  ClockEntry,
  Envelope,
  SubstrateTag,
  UnwrapResult,
  WitnessEntry,
  WrapOptions,
} from "../probes/receipt-envelope-encoder-v0/ts/envelope.ts";

export {
  decodeCanonical,
  encodeCanonical,
  multihashSha256,
} from "../probes/receipt-envelope-encoder-v0/ts/canonical_cbor.ts";

export type {
  CborValue,
} from "../probes/receipt-envelope-encoder-v0/ts/canonical_cbor.ts";
