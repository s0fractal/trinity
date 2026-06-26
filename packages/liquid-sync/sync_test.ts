import { assert, assertEquals } from "jsr:@std/assert@^1";
import { PayloadType, type PnCadBlock } from "./codec.ts";
import { initCovenant } from "./phase.ts";
import { generateFrontier, missingHashes, resolveConflict } from "./sync.ts";

function block(opts: {
  phi: number;
  rho: number;
  root?: Uint8Array;
  ts?: bigint;
}): PnCadBlock {
  return {
    covenantSeed: 0,
    version: 1,
    payloadType: PayloadType.STATE_SYNC,
    phi: opts.phi,
    rho: opts.rho,
    delta: 0,
    timestamp: opts.ts ?? 0n,
    payloadMerkleRoot: opts.root ?? new Uint8Array(32),
    payload: new Uint8Array(0),
    signature: new Uint8Array(64),
  };
}

Deno.test("sync — resolveConflict picks the block resonating most with the target", () => {
  initCovenant();
  const target = 1.0; // radians
  const near = block({ phi: 1.0, rho: 1.0 }); // on target
  const far = block({ phi: 1.0 + Math.PI, rho: 1.0 }); // opposite
  assertEquals(resolveConflict(near, far, target).phi, near.phi);
  assertEquals(resolveConflict(far, near, target).phi, near.phi); // order-independent
});

Deno.test("sync — higher energy (ρ) wins when phases are equally aligned", () => {
  initCovenant();
  const weak = block({ phi: 1.0, rho: 0.3 });
  const strong = block({ phi: 1.0, rho: 0.9 });
  assertEquals(resolveConflict(weak, strong, 1.0).rho, 0.9);
});

Deno.test("sync — ties break on content hash, NOT the clock", () => {
  initCovenant();
  // identical phase + ρ → equal score → a tie. Different payload roots.
  const a = block({
    phi: 0.5,
    rho: 1.0,
    root: new Uint8Array(32).fill(1),
    ts: 100n,
  });
  const b = block({
    phi: 0.5,
    rho: 1.0,
    root: new Uint8Array(32).fill(2),
    ts: 999n,
  });

  const w1 = resolveConflict(a, b, 0.5);
  // swap the clocks — a clock-immune resolver must pick the SAME winner.
  const w2 = resolveConflict({ ...a, timestamp: 999n }, {
    ...b,
    timestamp: 100n,
  }, 0.5);

  assertEquals(w1.payloadMerkleRoot[0], 1, "lower content hash wins the tie");
  assertEquals(
    w1.payloadMerkleRoot[0],
    w2.payloadMerkleRoot[0],
    "winner is clock-independent",
  );
});

Deno.test("sync — frontier and missing-hash diff", () => {
  const blocks = [
    block({ phi: 0, rho: 1, root: new Uint8Array(32).fill(9) }),
  ];
  assertEquals(generateFrontier(blocks).length, 1);
  const missing = missingHashes(new Set(["have"]), ["have", "need"]);
  assertEquals(missing, ["need"]);
});
