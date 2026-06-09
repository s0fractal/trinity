import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ALGO_SHA256,
  encodeApplyRecord,
  FLAG_HAS_DEPENDS,
  FLAG_HAS_EXPECT,
  mh,
  sporeId,
  toHex,
} from "./x2F34_fqdn_apply.ts";

// Canonical vectors captured from probes/spore-apply-v0/ts/probe.ts (the frozen
// contract). If these match, this is a conformant independent implementation of
// the same wire format — the resolver and SPORE apply share one hash regime.
const f32 = (b: number) => new Uint8Array(32).fill(b);

Deno.test("apply — case 1 (argc=0) matches canonical record + spore_id", () => {
  const rec = encodeApplyRecord({ fHash: mh(f32(0x01)) });
  assertEquals(
    toHex(rec),
    "53504f5200010000001e20" + "01".repeat(32),
  );
  assertEquals(
    toHex(sporeId(rec)),
    "02850775038dd71044cc0d74c167f2cd82da3a174c3707cfc7dd1018f76c10cb",
  );
});

Deno.test("apply — case 2 (argc=1) matches canonical spore_id", () => {
  const rec = encodeApplyRecord({ fHash: mh(f32(0x01)), argHashes: [mh(f32(0x02))] });
  assertEquals(
    toHex(sporeId(rec)),
    "3a9d95a28c2c6b267461a87c6e7e3ef4cb1e19d09b1423e9a35fbf8913982e41",
  );
});

Deno.test("apply — case 3 (argc=2) matches canonical spore_id", () => {
  const rec = encodeApplyRecord({
    fHash: mh(f32(0x01)),
    argHashes: [mh(f32(0x02)), mh(f32(0x03))],
  });
  assertEquals(
    toHex(sporeId(rec)),
    "dcd79355f8f962b29abfe626359bd57d6dc81df3f840657fc41ebd3e587f0959",
  );
});

Deno.test("apply — case 4 (argc=3) matches canonical spore_id", () => {
  const rec = encodeApplyRecord({
    fHash: mh(f32(0x01)),
    argHashes: [mh(f32(0x02)), mh(f32(0x03)), mh(f32(0x04))],
  });
  assertEquals(
    toHex(sporeId(rec)),
    "e23c6f42999bd198e2cf2791353a243e1c8dc195fcffffd744989d838277e553",
  );
});

Deno.test("apply — reserved flag is rejected", () => {
  let rejected = false;
  try {
    encodeApplyRecord({ fHash: mh(f32(0x01)), flags: 0x0010 });
  } catch (e) {
    rejected = (e as Error).message === "reserved_flag_set";
  }
  assertEquals(rejected, true);
});

// sanity: the optional-field flags are exercised so the encoder path is covered
Deno.test("apply — HAS_EXPECT | HAS_DEPENDS encodes without error", () => {
  const rec = encodeApplyRecord({
    fHash: mh(f32(0x01)),
    argHashes: [mh(f32(0x02), ALGO_SHA256)],
    flags: FLAG_HAS_EXPECT | FLAG_HAS_DEPENDS,
    expectHash: mh(f32(0x05)),
    dependsHash: mh(f32(0x06)),
  });
  assertEquals(rec.length > 9, true);
});
