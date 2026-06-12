// src/x2F32_fqdn_witness.ts — the content/receipt convergence.
// position: 2/F32 → mirror(2) × frontier-pair(F) = FQDN witness
// maturity: active
// horizon: none (graduation completed)
// skill_tag: resolve-fqdn
// skill_safe: yes
// intent: witness FQDN resolutions and generate content-pinned receipts
//
// The capstone of the FQDN-unify thread: {content, receipt} are the two sides of
// `apply` (f(context, lens)), and the two addressing models map onto the two
// kinds:
//   content = ROLE-addressed   — found by FQDN (resolver, role lens); identity
//                                is mutable at a stable address.
//   receipt = CONTENT-addressed — pins the exact BLAKE3 of the bytes witnessed +
//                                the bitcoin block height; identity IS the bytes.
//
// `witness()` turns a resolution into a receipt: it content-pins what the role
// lens found, and derives the receipt's own id with the frozen spore.apply.v0
// wrapper (the one hash regime). Edit the content and the role address (fqdn)
// stays the same while a NEW receipt appears with a NEW content hash — the
// append-only log the substrate already lives by.

import { type Resolution } from "./x2F30_fqdn_resolver.ts";
import {
  blake3Multihash,
  encodeApplyRecord,
  sporeId,
  toHex,
} from "./x2F34_fqdn_apply.ts";

export interface Receipt {
  fqdn: string; // the role address that was queried
  role: string | null; // the resolved node's path-relative coordinate (rel), or null
  matchForm: string | null;
  content_blake3: string | null; // content-pinned identity of the witnessed bytes
  bitcoin_block_height: number;
  receipt_id: string; // spore.apply.v0 wrapper id over the apply record
  identity: Resolution["identity"];
}

/**
 * Witness a resolution at a given block height. The receipt content-pins the
 * resolved bytes (BLAKE3, as a spore multihash) by making them the `f_hash` of
 * an apply record, then derives the receipt id with the frozen spore wrapper.
 */
export async function witness(
  res: Resolution,
  bitcoinBlockHeight: number,
): Promise<Receipt> {
  let contentBlake3: string | null = null;
  let record: Uint8Array;

  if (res.resolved) {
    const bytes = await Deno.readFile(res.resolved.path);
    const fHash = blake3Multihash(bytes);
    contentBlake3 = toHex(fHash.digest);
    record = encodeApplyRecord({ fHash });
  } else {
    // absent: witness the empty resolution (f = BLAKE3 of empty bytes)
    const fHash = blake3Multihash(new Uint8Array());
    record = encodeApplyRecord({ fHash });
  }

  return {
    fqdn: res.fqdn,
    role: res.resolved?.rel ?? null,
    matchForm: res.resolved?.matchForm ?? null,
    content_blake3: contentBlake3,
    bitcoin_block_height: bitcoinBlockHeight,
    receipt_id: toHex(sporeId(record)),
    identity: res.identity,
  };
}
