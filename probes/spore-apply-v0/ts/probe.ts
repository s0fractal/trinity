// spore-apply-v0 probe — TypeScript / Deno implementation.
// Iterates the 9-case test matrix from ../SPEC.md.

import { blake3 } from "npm:@noble/hashes@1.4.0/blake3";

const MAGIC = new Uint8Array([0x53, 0x50, 0x4f, 0x52]);
const VERSION = 0x00;
const KIND_APPLY = 0x01;
const ALGO_BLAKE3_256 = 0x1e;
const ALGO_SHA256 = 0x12;
const DIGEST_LEN = 0x20;
const DOMAIN = "spore.apply.v0";

const FLAG_HAS_EXPECT = 0x0001;
const FLAG_HAS_CAPS = 0x0002;
const FLAG_HAS_SIG = 0x0004;
const FLAG_HAS_DEPENDS = 0x0008;
const FLAG_RESERVED_MASK = 0xfff0;

type Multihash = { algoTag: number; digest: Uint8Array };

const fixed32 = (byte: number): Uint8Array => new Uint8Array(32).fill(byte);

const mh = (digest: Uint8Array, algoTag = ALGO_BLAKE3_256): Multihash => {
  if (digest.length !== DIGEST_LEN) throw new Error("digest must be 32 bytes");
  return { algoTag, digest };
};

const encodeMultihash = (m: Multihash): Uint8Array => {
  const out = new Uint8Array(2 + m.digest.length);
  out[0] = m.algoTag;
  out[1] = m.digest.length;
  out.set(m.digest, 2);
  return out;
};

const buildApplyRecord = (
  fHash: Multihash,
  argHashes: Multihash[],
  flags: number,
  expectHash?: Multihash,
  capsHash?: Multihash,
  dependsHash?: Multihash,
): Uint8Array => {
  if ((flags & FLAG_RESERVED_MASK) !== 0) {
    throw new Error("reserved_flag_set");
  }

  const argc = argHashes.length;
  if (argc > 0xff) throw new Error("argc must fit in one byte");

  const header = new Uint8Array(9);
  header.set(MAGIC, 0);
  header[4] = VERSION;
  header[5] = KIND_APPLY;
  header[6] = (flags >>> 8) & 0xff;
  header[7] = flags & 0xff;
  header[8] = argc;

  const fields: Uint8Array[] = [encodeMultihash(fHash)];
  for (const a of argHashes) fields.push(encodeMultihash(a));
  if (flags & FLAG_HAS_EXPECT) {
    if (!expectHash) throw new Error("HAS_EXPECT set but no expectHash");
    fields.push(encodeMultihash(expectHash));
  }
  if (flags & FLAG_HAS_CAPS) {
    if (!capsHash) throw new Error("HAS_CAPS set but no capsHash");
    fields.push(encodeMultihash(capsHash));
  }
  if (flags & FLAG_HAS_DEPENDS) {
    if (!dependsHash) throw new Error("HAS_DEPENDS set but no dependsHash");
    fields.push(encodeMultihash(dependsHash));
  }

  const totalLen = header.length + fields.reduce((s, f) => s + f.length, 0);
  const out = new Uint8Array(totalLen);
  out.set(header, 0);
  let off = header.length;
  for (const f of fields) {
    out.set(f, off);
    off += f.length;
  }
  return out;
};

const sporeId = (record: Uint8Array): Uint8Array =>
  blake3(record, { context: DOMAIN, dkLen: 32 });

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

const printCase = (n: number, record: Uint8Array) => {
  console.log(
    `case=${n} record_hex=${toHex(record)} spore_id=${toHex(sporeId(record))}`,
  );
};

const tryCase = (n: number, fn: () => Uint8Array) => {
  try {
    printCase(n, fn());
  } catch (e) {
    console.log(`case=${n} reject=${(e as Error).message}`);
  }
};

// Case 1: argc=0
tryCase(1, () => buildApplyRecord(mh(fixed32(0x01)), [], 0x0000));

// Case 2: argc=1
tryCase(2, () =>
  buildApplyRecord(mh(fixed32(0x01)), [mh(fixed32(0x02))], 0x0000));

// Case 3: argc=2 (original)
tryCase(3, () =>
  buildApplyRecord(
    mh(fixed32(0x01)),
    [mh(fixed32(0x02)), mh(fixed32(0x03))],
    0x0000,
  ));

// Case 4: argc=3
tryCase(4, () =>
  buildApplyRecord(
    mh(fixed32(0x01)),
    [mh(fixed32(0x02)), mh(fixed32(0x03)), mh(fixed32(0x04))],
    0x0000,
  ));

// Case 5: HAS_EXPECT
tryCase(5, () =>
  buildApplyRecord(
    mh(fixed32(0x01)),
    [mh(fixed32(0x02))],
    FLAG_HAS_EXPECT,
    mh(fixed32(0x05)),
  ));

// Case 6: HAS_DEPENDS
tryCase(6, () =>
  buildApplyRecord(
    mh(fixed32(0x01)),
    [mh(fixed32(0x02))],
    FLAG_HAS_DEPENDS,
    undefined,
    undefined,
    mh(fixed32(0x06)),
  ));

// Case 7: mixed algo tags (f = BLAKE3, arg0 = SHA-256 digest, same byte width)
tryCase(7, () =>
  buildApplyRecord(
    mh(fixed32(0x01), ALGO_BLAKE3_256),
    [mh(fixed32(0x07), ALGO_SHA256)],
    0x0000,
  ));

// Case 8: HAS_EXPECT | HAS_DEPENDS
tryCase(8, () =>
  buildApplyRecord(
    mh(fixed32(0x01)),
    [mh(fixed32(0x02))],
    FLAG_HAS_EXPECT | FLAG_HAS_DEPENDS,
    mh(fixed32(0x05)),
    undefined,
    mh(fixed32(0x06)),
  ));

// Case 9: reserved flag → reject
tryCase(9, () =>
  buildApplyRecord(
    mh(fixed32(0x01)),
    [mh(fixed32(0x02))],
    0x0010,
  ));
