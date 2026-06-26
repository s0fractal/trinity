import { assert, assertEquals } from "jsr:@std/assert@^1";
import {
  calculateBlockId,
  compressPayload,
  decodeAllBlocks,
  decodeBlock,
  decompressPayload,
  encodeBlock,
  PayloadType,
  type PnCadBlock,
} from "./codec.ts";

function sampleBlock(covenantSeed = 0x1234): PnCadBlock {
  return {
    covenantSeed,
    version: 1,
    payloadType: PayloadType.STATE_SYNC,
    // float32-exact so the round-trip is bit-equal
    phi: 0.5,
    rho: 0.25,
    delta: 0.125,
    timestamp: 1_700_000_000n,
    payloadMerkleRoot: new Uint8Array(32).fill(7),
    payload: new TextEncoder().encode("hello covenant"),
    signature: new Uint8Array(64).fill(3),
  };
}

Deno.test("codec — encode/decode round-trips byte-exactly", () => {
  const block = sampleBlock();
  const decoded = decodeBlock(encodeBlock(block));
  assertEquals(decoded.covenantSeed, block.covenantSeed);
  assertEquals(decoded.version, block.version);
  assertEquals(decoded.payloadType, block.payloadType);
  assertEquals(decoded.phi, block.phi);
  assertEquals(decoded.rho, block.rho);
  assertEquals(decoded.delta, block.delta);
  assertEquals(decoded.timestamp, block.timestamp);
  assertEquals([...decoded.payloadMerkleRoot], [...block.payloadMerkleRoot]);
  assertEquals([...decoded.payload], [...block.payload]);
  assertEquals([...decoded.signature], [...block.signature]);
});

Deno.test("codec — a block id is deterministic and covenant-scoped", async () => {
  const a = await calculateBlockId(sampleBlock(0x1111));
  const aAgain = await calculateBlockId(sampleBlock(0x1111));
  const b = await calculateBlockId(sampleBlock(0x2222));
  assertEquals(a, aAgain, "same delta + covenant → same id (deterministic)");
  assert(
    a !== b,
    "same delta, different covenant → different id (governance-scoped)",
  );
});

Deno.test("codec — decodeAllBlocks scans a multi-block stream", () => {
  const stream = new Uint8Array([
    ...encodeBlock(sampleBlock(0x1111)),
    ...encodeBlock(sampleBlock(0x2222)),
  ]);
  const blocks = decodeAllBlocks(stream);
  assertEquals(blocks.length, 2);
  assertEquals(blocks[0].covenantSeed, 0x1111);
  assertEquals(blocks[1].covenantSeed, 0x2222);
});

Deno.test("codec — payload gzip round-trips", async () => {
  const payload = new TextEncoder().encode("the quick brown fox ".repeat(20));
  const back = await decompressPayload(await compressPayload(payload));
  assertEquals([...back], [...payload]);
});
