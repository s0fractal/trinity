// PN-CAD: a covenant-bound, content-addressed binary delta format.
//
// A fixed 63-byte header + a variable payload + a 64-byte signature, magic "LQD1".
// Each block is content-addressed by SHA-256 of its header XOR-perturbed by a
// `covenantSeed` — so the same delta under a different covenant gets a different id.
// Pure: WebCrypto + DataView only, no imports, runs in browser / Deno / Node / WASM.

export enum PayloadType {
  AST_PATCH = 0,
  PHASE_SHIFT = 1,
  STATE_SYNC = 2, // a full or partial state checkpoint
  CAUSAL_EVENT = 3,
}

export interface PnCadBlock {
  covenantSeed: number; // uint32
  version: number; // uint16
  payloadType: PayloadType; // uint8
  phi: number; // float32
  rho: number; // float32
  delta: number; // float32
  timestamp: bigint; // uint64
  payloadMerkleRoot: Uint8Array; // 32 bytes (state root after this block applies)
  payload: Uint8Array; // variable
  signature: Uint8Array; // 64 bytes
}

const MAGIC_BYTES = new Uint8Array([0x4C, 0x51, 0x44, 0x01]); // "LQD1"

/** Encodes a block into the PN-CAD binary format. */
export function encodeBlock(block: PnCadBlock): Uint8Array {
  // Magic(4) + Seed(4) + Version(2) + Type(1) + Floats(12) + Time(8) + Root(32)
  // + PayloadLen(4) + Payload(var) + Sig(64)
  const headerSize = 4 + 4 + 2 + 1 + 12 + 8 + 32;
  const totalSize = headerSize + 4 + block.payload.length + 64;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let offset = 0;

  bytes.set(MAGIC_BYTES, offset);
  offset += 4;

  view.setUint32(offset, block.covenantSeed, true); // little-endian throughout
  offset += 4;

  view.setUint16(offset, block.version, true);
  offset += 2;

  view.setUint8(offset, block.payloadType);
  offset += 1;

  view.setFloat32(offset, block.phi, true);
  offset += 4;
  view.setFloat32(offset, block.rho, true);
  offset += 4;
  view.setFloat32(offset, block.delta, true);
  offset += 4;

  view.setBigUint64(offset, block.timestamp, true);
  offset += 8;

  if (block.payloadMerkleRoot.length !== 32) {
    throw new Error("Merkle root must be exactly 32 bytes");
  }
  bytes.set(block.payloadMerkleRoot, offset);
  offset += 32;

  view.setUint32(offset, block.payload.length, true);
  offset += 4;
  bytes.set(block.payload, offset);
  offset += block.payload.length;

  if (block.signature.length !== 64) {
    throw new Error("Signature must be exactly 64 bytes");
  }
  bytes.set(block.signature, offset);
  offset += 64;

  return bytes;
}

/** Decodes a single PN-CAD binary block. */
export function decodeBlock(bytes: Uint8Array): PnCadBlock {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  for (let i = 0; i < 4; i++) {
    if (bytes[offset + i] !== MAGIC_BYTES[i]) {
      throw new Error("Invalid PN-CAD magic header");
    }
  }
  offset += 4;

  const covenantSeed = view.getUint32(offset, true);
  offset += 4;

  const version = view.getUint16(offset, true);
  offset += 2;

  const payloadType = view.getUint8(offset) as PayloadType;
  offset += 1;

  const phi = view.getFloat32(offset, true);
  offset += 4;
  const rho = view.getFloat32(offset, true);
  offset += 4;
  const delta = view.getFloat32(offset, true);
  offset += 4;

  const timestamp = view.getBigUint64(offset, true);
  offset += 8;

  const payloadMerkleRoot = new Uint8Array(bytes.slice(offset, offset + 32));
  offset += 32;

  const payloadLength = view.getUint32(offset, true);
  offset += 4;

  const payload = new Uint8Array(bytes.slice(offset, offset + payloadLength));
  offset += payloadLength;

  const signature = new Uint8Array(bytes.slice(offset, offset + 64));
  offset += 64;

  return {
    covenantSeed,
    version,
    payloadType,
    phi,
    rho,
    delta,
    timestamp,
    payloadMerkleRoot,
    payload,
    signature,
  };
}

/** Decodes all PN-CAD blocks from a continuous, scannable binary stream. */
export function decodeAllBlocks(bytes: Uint8Array): PnCadBlock[] {
  const blocks: PnCadBlock[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  while (offset < bytes.length) {
    if (offset + 55 > bytes.length) break; // not enough bytes for a header

    let validMagic = false;
    while (offset + 4 <= bytes.length) {
      let match = true;
      for (let i = 0; i < 4; i++) {
        if (bytes[offset + i] !== MAGIC_BYTES[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        validMagic = true;
        break;
      }
      offset++; // resync: skip one byte and try again
    }

    if (!validMagic || offset + 55 > bytes.length) break;

    const blockStart = offset;
    // up to payloadLength: Magic(4)+Seed(4)+Version(2)+Type(1)+PRD(12)+Time(8)+Root(32)=63
    offset += 63;

    const payloadLength = view.getUint32(offset, true);
    const blockSize = 63 + 4 + payloadLength + 64;

    if (blockStart + blockSize > bytes.length) break; // incomplete trailing block

    blocks.push(decodeBlock(bytes.slice(blockStart, blockStart + blockSize)));
    offset = blockStart + blockSize;
  }

  return blocks;
}

/**
 * Content-addressed identifier for a block: SHA-256(header XOR covenantSeed),
 * where "header" is everything up to (excluding) the payload length, payload, and
 * signature. Two networks with different covenants address the same delta differently.
 */
export async function calculateBlockId(block: PnCadBlock): Promise<string> {
  const headerSize = 4 + 4 + 2 + 1 + 12 + 8 + 32;
  const encoded = encodeBlock(block);
  const headerBytes = new Uint8Array(encoded.slice(0, headerSize));

  const seedBytes = new Uint8Array(4);
  new DataView(seedBytes.buffer).setUint32(0, block.covenantSeed, true);
  for (let i = 0; i < headerBytes.length; i++) {
    headerBytes[i] ^= seedBytes[i % 4];
  }

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    headerBytes as BufferSource,
  );
  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 of a payload, as the 32-byte payload Merkle root. */
export async function calculatePayloadMerkleRoot(
  payload: Uint8Array,
): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    payload as BufferSource,
  );
  return new Uint8Array(hashBuffer);
}

/** Gzip-compresses a payload (Web Streams API). */
export async function compressPayload(
  payload: Uint8Array,
): Promise<Uint8Array> {
  const stream = new Blob([payload as BlobPart]).stream().pipeThrough(
    new CompressionStream("gzip"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Gzip-decompresses a payload (Web Streams API). */
export async function decompressPayload(
  compressed: Uint8Array,
): Promise<Uint8Array> {
  const stream = new Blob([compressed as BlobPart]).stream().pipeThrough(
    new DecompressionStream("gzip"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
