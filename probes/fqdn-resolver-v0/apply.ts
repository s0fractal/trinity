// probes/fqdn-resolver-v0/apply.ts — independent implementation of the FROZEN
// `spore.apply.v0` wire format (see probes/spore-apply-v0/SPEC.md). The whole
// point of that contract is that independent implementations agree byte-for-byte
// (rust + ts + python already do); this is a 4th, verified against the canonical
// vectors in apply_test.ts. Using the one regime — not a fresh hash — is the
// "bridge, not reinvent" seam between the resolver and SPORE apply.

import { blake3 } from "npm:@noble/hashes@1.4.0/blake3";

const MAGIC = new Uint8Array([0x53, 0x50, 0x4f, 0x52]); // "SPOR"
const VERSION = 0x00;
const KIND_APPLY = 0x01;
export const ALGO_BLAKE3_256 = 0x1e;
export const ALGO_SHA256 = 0x12;
const DIGEST_LEN = 0x20;
const DOMAIN = "spore.apply.v0";

export const FLAG_HAS_EXPECT = 0x0001;
export const FLAG_HAS_CAPS = 0x0002;
export const FLAG_HAS_SIG = 0x0004;
export const FLAG_HAS_DEPENDS = 0x0008;
const FLAG_RESERVED_MASK = 0xfff0;

export interface Multihash {
  algoTag: number;
  digest: Uint8Array;
}

/** Wrap a 32-byte digest as a multihash (defaults to BLAKE3-256). */
export function mh(digest: Uint8Array, algoTag = ALGO_BLAKE3_256): Multihash {
  if (digest.length !== DIGEST_LEN) throw new Error("digest must be 32 bytes");
  return { algoTag, digest };
}

/** BLAKE3-256 of bytes, as a multihash. */
export function blake3Multihash(bytes: Uint8Array): Multihash {
  return mh(blake3(bytes));
}

function encodeMultihash(m: Multihash): Uint8Array {
  const out = new Uint8Array(2 + m.digest.length);
  out[0] = m.algoTag;
  out[1] = m.digest.length;
  out.set(m.digest, 2);
  return out;
}

export interface ApplyRecord {
  fHash: Multihash;
  argHashes?: Multihash[];
  flags?: number;
  expectHash?: Multihash;
  capsHash?: Multihash;
  dependsHash?: Multihash;
}

/** Encode an apply record to its canonical bytes (frozen wire format). */
export function encodeApplyRecord(r: ApplyRecord): Uint8Array {
  const argHashes = r.argHashes ?? [];
  const flags = r.flags ?? 0x0000;
  if ((flags & FLAG_RESERVED_MASK) !== 0) throw new Error("reserved_flag_set");
  if (argHashes.length > 0xff) throw new Error("argc must fit in one byte");

  const header = new Uint8Array(9);
  header.set(MAGIC, 0);
  header[4] = VERSION;
  header[5] = KIND_APPLY;
  header[6] = (flags >>> 8) & 0xff;
  header[7] = flags & 0xff;
  header[8] = argHashes.length;

  const fields: Uint8Array[] = [encodeMultihash(r.fHash)];
  for (const a of argHashes) fields.push(encodeMultihash(a));
  if (flags & FLAG_HAS_EXPECT) {
    if (!r.expectHash) throw new Error("HAS_EXPECT set but no expectHash");
    fields.push(encodeMultihash(r.expectHash));
  }
  if (flags & FLAG_HAS_CAPS) {
    if (!r.capsHash) throw new Error("HAS_CAPS set but no capsHash");
    fields.push(encodeMultihash(r.capsHash));
  }
  if (flags & FLAG_HAS_DEPENDS) {
    if (!r.dependsHash) throw new Error("HAS_DEPENDS set but no dependsHash");
    fields.push(encodeMultihash(r.dependsHash));
  }

  const total = header.length + fields.reduce((s, f) => s + f.length, 0);
  const out = new Uint8Array(total);
  out.set(header, 0);
  let off = header.length;
  for (const f of fields) {
    out.set(f, off);
    off += f.length;
  }
  return out;
}

/** spore_id = BLAKE3.derive_key("spore.apply.v0", record_bytes). Always BLAKE3 in v0. */
export function sporeId(record: Uint8Array): Uint8Array {
  return blake3(record, { context: DOMAIN, dkLen: 32 });
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
