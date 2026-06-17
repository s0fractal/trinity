import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  blockOfEpochSec,
  BTC_ANCHOR_BLOCK,
  BTC_ANCHOR_EPOCH_SEC,
  BTC_SEC_PER_BLOCK,
  epochMsOfBlock,
  isoOfBlock,
} from "./x0014_blocktime.ts";

Deno.test("epochMsOfBlock - anchor block maps to its epoch; advances 600s/block", () => {
  assertEquals(epochMsOfBlock(BTC_ANCHOR_BLOCK), BTC_ANCHOR_EPOCH_SEC * 1000);
  // one block later = +600s
  assertEquals(
    epochMsOfBlock(BTC_ANCHOR_BLOCK + 1) - epochMsOfBlock(BTC_ANCHOR_BLOCK),
    BTC_SEC_PER_BLOCK * 1000,
  );
  // 144 blocks ≈ one day
  assertEquals(
    epochMsOfBlock(BTC_ANCHOR_BLOCK + 144) - epochMsOfBlock(BTC_ANCHOR_BLOCK),
    144 * BTC_SEC_PER_BLOCK * 1000,
  );
});

Deno.test("isoOfBlock - anchor renders as its UTC instant", () => {
  assertEquals(
    isoOfBlock(BTC_ANCHOR_BLOCK),
    new Date(BTC_ANCHOR_EPOCH_SEC * 1000).toISOString(),
  );
  // later block sorts later as an ISO string (monotonic)
  assert(isoOfBlock(BTC_ANCHOR_BLOCK) < isoOfBlock(BTC_ANCHOR_BLOCK + 1000));
});

Deno.test("blockOfEpochSec - round-trips the anchor and inverts epochMsOfBlock", () => {
  assertEquals(blockOfEpochSec(BTC_ANCHOR_EPOCH_SEC), BTC_ANCHOR_BLOCK);
  const block = BTC_ANCHOR_BLOCK + 4029;
  const epochSec = epochMsOfBlock(block) / 1000;
  assertEquals(blockOfEpochSec(epochSec), block);
});
