// RECEIPT_ENVELOPE reference implementation.
//
// Contract: ../../../contracts/RECEIPT_ENVELOPE.v1.0.md (status: active,
// promoted from v0.1 → v1.0 by gemini AYE 2026-05-14T182641Z after
// cross-language byte equality with the Python impl was demonstrated).
//
// Wire schema id remains "trinity.receipt-envelope.v0.1" — that string
// identifies the WIRE FORMAT, not the contract maturity. Bumping it
// would invalidate golden hashes; that is a separate decision.
//
// Probe-scoped; not in lib/. Consumers import this file directly.

import {
  CborValue,
  decodeCanonical,
  encodeCanonical,
  multihashSha256,
} from "./canonical_cbor.ts";

export const ENVELOPE_SCHEMA = "trinity.receipt-envelope.v0.1" as const;

export type SubstrateTag = "omega" | "liquid" | "myc" | "trinity" | "external";

export type BodyKind =
  | "phi_intent"
  | "phi_receipt"
  | "spore_apply_v0"
  | "spore_frame_witness"
  | "zk_pouw"
  | "zk_resonance"
  | "zk_mitosis"
  | "sealed_descriptor"
  | "publish_descriptor"
  | "substrate_health"
  | "warrant_proposal"
  | "warrant_issued"
  | "chord";

export type ClockEntry = {
  causal_ticks?: number;
  era?: number;
  bitcoin_block?: number;
  wall_time_utc?: string;
};

export type WitnessEntry = {
  oracle: string;
  signature_hash: string;
  signed_at_logical: ClockEntry;
  substrate_tag: string;
  law_hash?: string | null;
};

export type BitcoinAnchor = {
  block: number;
  tx: string;
  merkle_path?: string[];
  merkle_root?: string;
};

export type Envelope = {
  schema: typeof ENVELOPE_SCHEMA;
  envelope_id: string;
  body_hash: string;
  substrate_tag: SubstrateTag;
  body_kind: BodyKind;
  body?: CborValue;
  body_ref?: string;
  law_hash?: string | null;
  witness_chain: WitnessEntry[];
  bitcoin_anchor?: BitcoinAnchor;
  parent_envelope_id?: string;
  parent_relation?: "continuation" | "retraction" | "refinement" | "co_witness";
  created_at_logical?: ClockEntry;
};

export type WrapOptions = {
  law_hash?: string | null;
  witness_chain?: WitnessEntry[];
  bitcoin_anchor?: BitcoinAnchor;
  parent_envelope_id?: string;
  parent_relation?: Envelope["parent_relation"];
  created_at_logical?: ClockEntry;
  body_ref?: string;
};

// ────────────────────────────────────────────────────────────────────────
// wrap
// ────────────────────────────────────────────────────────────────────────

export async function wrap(
  body: CborValue | undefined,
  body_kind: BodyKind,
  substrate_tag: SubstrateTag,
  options: WrapOptions = {},
): Promise<Envelope> {
  // If body is omitted but body_ref provided, hash an empty placeholder.
  // Either body or body_ref must be present; both is allowed (body authoritative).
  if (body === undefined && options.body_ref === undefined) {
    throw new Error("envelope.wrap: at least one of body or body_ref required");
  }

  let body_hash: string;
  if (body !== undefined) {
    const bodyBytes = encodeCanonical(body);
    body_hash = await multihashSha256(bodyBytes);
  } else {
    // body_ref case: body_hash is the hash of the empty byte string
    // (consumers must follow body_ref to obtain real bytes and re-verify).
    body_hash = await multihashSha256(new Uint8Array(0));
  }

  // Build envelope record WITHOUT envelope_id (it's hashed last).
  const partial: Record<string, CborValue> = {
    schema: ENVELOPE_SCHEMA,
    body_hash,
    substrate_tag,
    body_kind,
    witness_chain: serializeWitnessChain(options.witness_chain ?? []),
  };

  if (body !== undefined) partial.body = body;
  if (options.body_ref !== undefined) partial.body_ref = options.body_ref;
  if (options.law_hash !== undefined && options.law_hash !== null) {
    partial.law_hash = options.law_hash;
  }
  if (options.bitcoin_anchor !== undefined) {
    partial.bitcoin_anchor = serializeAnchor(options.bitcoin_anchor);
  }
  if (options.parent_envelope_id !== undefined) {
    partial.parent_envelope_id = options.parent_envelope_id;
  }
  if (options.parent_relation !== undefined) {
    partial.parent_relation = options.parent_relation;
  }
  if (options.created_at_logical !== undefined) {
    partial.created_at_logical = serializeClock(options.created_at_logical);
  }

  const envelopeBytes = encodeCanonical(partial);
  const envelope_id = await multihashSha256(envelopeBytes);

  // Return enriched envelope (envelope_id first for readability; not protocol-bearing).
  return {
    schema: ENVELOPE_SCHEMA,
    envelope_id,
    body_hash,
    substrate_tag,
    body_kind,
    ...(body !== undefined ? { body } : {}),
    ...(options.body_ref !== undefined ? { body_ref: options.body_ref } : {}),
    ...(options.law_hash !== undefined ? { law_hash: options.law_hash } : {}),
    witness_chain: options.witness_chain ?? [],
    ...(options.bitcoin_anchor !== undefined
      ? { bitcoin_anchor: options.bitcoin_anchor }
      : {}),
    ...(options.parent_envelope_id !== undefined
      ? { parent_envelope_id: options.parent_envelope_id }
      : {}),
    ...(options.parent_relation !== undefined
      ? { parent_relation: options.parent_relation }
      : {}),
    ...(options.created_at_logical !== undefined
      ? { created_at_logical: options.created_at_logical }
      : {}),
  } as Envelope;
}

// ────────────────────────────────────────────────────────────────────────
// unwrap
// ────────────────────────────────────────────────────────────────────────

export type UnwrapResult = {
  body: CborValue | undefined;
  body_kind: BodyKind;
  body_hash_verified: boolean;
  envelope_id_verified?: boolean;
};

export async function unwrap(
  env: Envelope,
  strict = false,
): Promise<UnwrapResult> {
  let body_hash_verified = false;

  if (env.body !== undefined) {
    const bodyBytes = encodeCanonical(env.body);
    const reHash = await multihashSha256(bodyBytes);
    body_hash_verified = reHash === env.body_hash;
  } else if (env.body_ref !== undefined) {
    // Cannot verify without following body_ref; caller's job.
    body_hash_verified = false;
  }

  const result: UnwrapResult = {
    body: env.body,
    body_kind: env.body_kind,
    body_hash_verified,
  };

  if (strict) {
    // Recompute envelope_id excluding the existing envelope_id field.
    const { envelope_id: _ignore, ...rest } = env;
    const partial: Record<string, CborValue> = { ...rest } as Record<
      string,
      CborValue
    >;
    // Re-serialize witness_chain/anchor/clock through serializers to ensure canonical form
    partial.witness_chain = serializeWitnessChain(env.witness_chain);
    if (env.bitcoin_anchor !== undefined) {
      partial.bitcoin_anchor = serializeAnchor(env.bitcoin_anchor);
    }
    if (env.created_at_logical !== undefined) {
      partial.created_at_logical = serializeClock(env.created_at_logical);
    }
    if (env.law_hash === null || env.law_hash === undefined) {
      delete partial.law_hash;
    }

    const envelopeBytes = encodeCanonical(partial);
    const reHash = await multihashSha256(envelopeBytes);
    result.envelope_id_verified = reHash === env.envelope_id;
  }

  return result;
}

// ────────────────────────────────────────────────────────────────────────
// coWitness — append witness entry, recompute envelope_id
// ────────────────────────────────────────────────────────────────────────

export async function coWitness(
  env: Envelope,
  entry: WitnessEntry,
): Promise<Envelope> {
  const new_chain = [...env.witness_chain, entry];
  // Re-wrap with new witness_chain. Body unchanged → body_hash stable; only
  // envelope_id changes.
  return wrap(env.body, env.body_kind, env.substrate_tag, {
    law_hash: env.law_hash ?? undefined,
    witness_chain: new_chain,
    bitcoin_anchor: env.bitcoin_anchor,
    parent_envelope_id: env.parent_envelope_id,
    parent_relation: env.parent_relation,
    created_at_logical: env.created_at_logical,
    body_ref: env.body_ref,
  });
}

// ────────────────────────────────────────────────────────────────────────
// Serialization helpers — turn typed structs into plain CBOR objects.
// ────────────────────────────────────────────────────────────────────────

function serializeWitnessChain(chain: WitnessEntry[]): CborValue[] {
  return chain.map((w) => {
    const obj: Record<string, CborValue> = {
      oracle: w.oracle,
      signature_hash: w.signature_hash,
      signed_at_logical: serializeClock(w.signed_at_logical),
      substrate_tag: w.substrate_tag,
    };
    if (w.law_hash !== undefined && w.law_hash !== null) {
      obj.law_hash = w.law_hash;
    }
    return obj;
  });
}

function serializeAnchor(a: BitcoinAnchor): CborValue {
  const obj: Record<string, CborValue> = { block: a.block, tx: a.tx };
  if (a.merkle_path !== undefined) obj.merkle_path = a.merkle_path;
  if (a.merkle_root !== undefined) obj.merkle_root = a.merkle_root;
  return obj;
}

function serializeClock(c: ClockEntry): CborValue {
  const obj: Record<string, CborValue> = {};
  if (c.causal_ticks !== undefined) obj.causal_ticks = c.causal_ticks;
  if (c.era !== undefined) obj.era = c.era;
  if (c.bitcoin_block !== undefined) obj.bitcoin_block = c.bitcoin_block;
  if (c.wall_time_utc !== undefined) obj.wall_time_utc = c.wall_time_utc;
  return obj;
}
