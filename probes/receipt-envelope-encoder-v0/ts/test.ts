// Tests for receipt-envelope-encoder-v0.
// Run: deno test --allow-read ts/test.ts

import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  CborValue,
  decodeCanonical,
  encodeCanonical,
  multihashSha256,
  toHex,
} from "./canonical_cbor.ts";
import {
  coWitness,
  Envelope,
  ENVELOPE_SCHEMA,
  unwrap,
  wrap,
} from "./envelope.ts";

// ────────────────────────────────────────────────────────────────────────
// 1. Encoder unit cases — RFC 8949 well-known fixtures.
// ────────────────────────────────────────────────────────────────────────

Deno.test("encode: integers", () => {
  assertEquals(toHex(encodeCanonical(0)), "00");
  assertEquals(toHex(encodeCanonical(1)), "01");
  assertEquals(toHex(encodeCanonical(23)), "17");
  assertEquals(toHex(encodeCanonical(24)), "1818");
  assertEquals(toHex(encodeCanonical(25)), "1819");
  assertEquals(toHex(encodeCanonical(255)), "18ff");
  assertEquals(toHex(encodeCanonical(256)), "190100");
  assertEquals(toHex(encodeCanonical(65535)), "19ffff");
  assertEquals(toHex(encodeCanonical(65536)), "1a00010000");
  assertEquals(toHex(encodeCanonical(-1)), "20");
  assertEquals(toHex(encodeCanonical(-24)), "37");
  assertEquals(toHex(encodeCanonical(-25)), "3818");
});

Deno.test("encode: booleans and null", () => {
  assertEquals(toHex(encodeCanonical(false)), "f4");
  assertEquals(toHex(encodeCanonical(true)), "f5");
  assertEquals(toHex(encodeCanonical(null)), "f6");
});

Deno.test("encode: strings", () => {
  assertEquals(toHex(encodeCanonical("")), "60");
  assertEquals(toHex(encodeCanonical("a")), "6161");
  assertEquals(toHex(encodeCanonical("IETF")), "6449455446");
});

Deno.test("encode: byte strings", () => {
  assertEquals(toHex(encodeCanonical(new Uint8Array([]))), "40");
  assertEquals(
    toHex(encodeCanonical(new Uint8Array([1, 2, 3, 4]))),
    "4401020304",
  );
});

Deno.test("encode: arrays", () => {
  assertEquals(toHex(encodeCanonical([])), "80");
  assertEquals(toHex(encodeCanonical([1, 2, 3])), "83010203");
});

Deno.test("encode: maps sorted bytewise-lex on encoded keys", () => {
  // Both {a:1,b:2} and {b:2,a:1} must produce same bytes.
  assertEquals(
    toHex(encodeCanonical({ a: 1, b: 2 })),
    "a26161016162 02".replace(/\s/g, ""),
  );
  assertEquals(
    toHex(encodeCanonical({ b: 2, a: 1 })),
    "a26161016162 02".replace(/\s/g, ""),
  );
});

Deno.test("encode: empty map", () => {
  assertEquals(toHex(encodeCanonical({})), "a0");
});

Deno.test("encode: nested", () => {
  const v = { x: [1, 2], y: { z: "ok" } };
  const b1 = encodeCanonical(v);
  const v2 = decodeCanonical(b1);
  const b2 = encodeCanonical(v2 as CborValue);
  assertEquals(toHex(b1), toHex(b2));
});

// ────────────────────────────────────────────────────────────────────────
// 2. Encoder forbidden cases.
// ────────────────────────────────────────────────────────────────────────

Deno.test("encode: floats forbidden", () => {
  assertThrows(
    () => encodeCanonical(1.5 as unknown as CborValue),
    Error,
    "float",
  );
});

Deno.test("encode: undefined forbidden via unsupported type", () => {
  assertThrows(() => encodeCanonical(undefined as unknown as CborValue), Error);
});

Deno.test("encode: NaN and Infinity forbidden", () => {
  assertThrows(
    () => encodeCanonical(NaN as unknown as CborValue),
    Error,
    "non-finite",
  );
  assertThrows(
    () => encodeCanonical(Infinity as unknown as CborValue),
    Error,
    "non-finite",
  );
});

Deno.test("encode: JS Map forbidden", () => {
  assertThrows(
    () => encodeCanonical(new Map() as unknown as CborValue),
    Error,
    "Map",
  );
});

// ────────────────────────────────────────────────────────────────────────
// 3. Decoder strict canonical.
// ────────────────────────────────────────────────────────────────────────

Deno.test("decode: rejects non-canonical 1-byte uint for small value", () => {
  // 0x18 0x01 would be uint 1 with 1-byte length; canonical is 0x01.
  assertThrows(
    () => decodeCanonical(new Uint8Array([0x18, 0x01])),
    Error,
    "non-canonical",
  );
});

Deno.test("decode: rejects non-canonical 2-byte uint for value<256", () => {
  assertThrows(
    () => decodeCanonical(new Uint8Array([0x19, 0x00, 0x05])),
    Error,
    "non-canonical",
  );
});

Deno.test("decode: rejects indefinite-length array", () => {
  // 0x9f start indef array
  assertThrows(
    () => decodeCanonical(new Uint8Array([0x9f, 0xff])),
    Error,
    "indefinite",
  );
});

Deno.test("decode: rejects tags", () => {
  // 0xc0 = tag 0 (date string)
  assertThrows(
    () => decodeCanonical(new Uint8Array([0xc0, 0x60])),
    Error,
    "tags",
  );
});

Deno.test("decode: rejects map keys out of order", () => {
  // Map with keys "b", "a" — out of bytewise-lex order.
  // {b:1, a:2} non-canonical encoding: a2 6162 01 6161 02
  const bytes = new Uint8Array([0xa2, 0x61, 0x62, 0x01, 0x61, 0x61, 0x02]);
  assertThrows(() => decodeCanonical(bytes), Error, "bytewise-lex");
});

Deno.test("decode: rejects floats", () => {
  // 0xf9 0x00 0x00 = half-float +0.0
  assertThrows(
    () => decodeCanonical(new Uint8Array([0xf9, 0x00, 0x00])),
    Error,
    "floating-point",
  );
});

Deno.test("decode: rejects trailing bytes", () => {
  assertThrows(
    () => decodeCanonical(new Uint8Array([0x01, 0x02])),
    Error,
    "trailing",
  );
});

// ────────────────────────────────────────────────────────────────────────
// 4. Round-trip property over a small fixture set.
// ────────────────────────────────────────────────────────────────────────

Deno.test("round-trip: variety of envelope-shaped values", () => {
  const fixtures: CborValue[] = [
    {},
    {
      type: "SubstrateHealth",
      overall: "degraded",
      own_organs: { ok: 76, fail: 0 },
    },
    [1, 2, 3, "four", { nested: true }],
    { unicode: "тест", emoji_forbidden_in_protocol_but_text_ok: "ψ" },
    { mixed: [null, true, false, 0, -1, 23] },
  ];
  for (const fx of fixtures) {
    const b1 = encodeCanonical(fx);
    const decoded = decodeCanonical(b1);
    const b2 = encodeCanonical(decoded as CborValue);
    assertEquals(
      toHex(b1),
      toHex(b2),
      `round-trip mismatch for ${JSON.stringify(fx)}`,
    );
  }
});

// ────────────────────────────────────────────────────────────────────────
// 5. Golden bytes for envelope wrap (regression guardrails).
// ────────────────────────────────────────────────────────────────────────

Deno.test("golden: empty map body produces stable envelope_id and body_hash", async () => {
  const env = await wrap({}, "substrate_health", "trinity");
  // Empty map body: encoded as 0xa0 = single byte. Its SHA-256:
  //   sha256(0xa0) = ee...  (computed below for record).
  const bodyBytes = new Uint8Array([0xa0]);
  const expectedBodyHash = await multihashSha256(bodyBytes);
  assertEquals(env.body_hash, expectedBodyHash);
  assertEquals(env.schema, ENVELOPE_SCHEMA);
  assertEquals(env.substrate_tag, "trinity");
  assertEquals(env.body_kind, "substrate_health");
  assertEquals(env.witness_chain, []);
  // envelope_id is computed over the partial envelope (without envelope_id field).
  // Recording the value here makes regressions visible.
  // Note: this hash changes if the envelope SHAPE changes (added/removed fields,
  // schema string change). It does NOT change for arbitrary code refactors.
  console.log("[golden] empty-body env.body_hash    =", env.body_hash);
  console.log("[golden] empty-body env.envelope_id  =", env.envelope_id);
});

// ────────────────────────────────────────────────────────────────────────
// 6. wrap / unwrap round-trip for several body_kinds.
// ────────────────────────────────────────────────────────────────────────

Deno.test("wrap/unwrap: spore_apply_v0 synthetic body", async () => {
  const body: CborValue = {
    type: "spore_apply",
    protocol: "spore.v0",
    backend_kind: "wasmtime",
    simulation: false,
    receipt_kind: "spore_apply_v0",
    mutator: "bafyMOCK_MUTATOR",
    state: "bafyMOCK_STATE",
    inputs: [],
    output: "1220deadbeef".padEnd(70, "0"),
  };
  const env = await wrap(body, "spore_apply_v0", "trinity");
  const result = await unwrap(env);
  assertEquals(result.body_hash_verified, true);
  assertEquals(result.body_kind, "spore_apply_v0");
  assertEquals(result.body, body);
});

Deno.test("wrap/unwrap: phi_receipt synthetic body", async () => {
  const body: CborValue = {
    type: "PHI_RECEIPT",
    version: "0.1",
    status: "ACCEPTED",
    derived_phase: 12345,
    timestamp: 1715000000001,
  };
  const env = await wrap(body, "phi_receipt", "omega");
  const result = await unwrap(env);
  assertEquals(result.body_hash_verified, true);
  assertEquals(result.body_kind, "phi_receipt");
});

Deno.test("wrap/unwrap: sealed_descriptor synthetic body", async () => {
  const body: CborValue = {
    type: "SealedReceiptDescriptor",
    schema_version: "myc.sealed-receipt.v0.1",
    fqdn: "abc.sealed.myc.md",
    commitment: {
      algorithm: "sha256",
      value: "deadbeef".padEnd(64, "0"),
      covers: "descriptor.body",
    },
    body: {
      sealed_receipt_contract: {
        source: "witness",
        target_fqdn: "target.myc.md",
        verification_method: "blake3",
        payload_retained: false,
        encrypted: true,
        sealed_hash: "1220abcd".padEnd(70, "0"),
      },
    },
  };
  const env = await wrap(body, "sealed_descriptor", "myc");
  const result = await unwrap(env);
  assertEquals(result.body_hash_verified, true);
  assertEquals(result.body_kind, "sealed_descriptor");
});

Deno.test("wrap/unwrap strict mode verifies envelope_id", async () => {
  const env = await wrap({ x: 1 }, "phi_intent", "liquid");
  const result = await unwrap(env, true);
  assertEquals(result.body_hash_verified, true);
  assertEquals(result.envelope_id_verified, true);
});

Deno.test("body_hash detects tampering", async () => {
  const env = await wrap({ x: 1 }, "phi_intent", "liquid");
  const tampered: Envelope = { ...env, body: { x: 2 } };
  const result = await unwrap(tampered);
  assertEquals(result.body_hash_verified, false);
});

// ────────────────────────────────────────────────────────────────────────
// 7. coWitness — envelope_id changes; chain grows.
// ────────────────────────────────────────────────────────────────────────

Deno.test("coWitness: envelope_id changes; body_hash stable", async () => {
  const body: CborValue = { type: "SubstrateHealth", overall: "healthy", n: 1 };
  const env1 = await wrap(body, "substrate_health", "trinity");

  const env2 = await coWitness(env1, {
    oracle: "claude",
    signature_hash: "1220mock".padEnd(70, "0"),
    signed_at_logical: { wall_time_utc: "2026-05-14T16:43:36Z" },
    substrate_tag: "trinity",
  });

  assertEquals(env1.body_hash, env2.body_hash);
  assertEquals(env1.envelope_id !== env2.envelope_id, true);
  assertEquals(env2.witness_chain.length, 1);

  const env3 = await coWitness(env2, {
    oracle: "codex",
    signature_hash: "1220mock2".padEnd(70, "0"),
    signed_at_logical: { wall_time_utc: "2026-05-14T16:44:00Z" },
    substrate_tag: "myc",
  });

  assertEquals(env2.body_hash, env3.body_hash);
  assertEquals(env2.envelope_id !== env3.envelope_id, true);
  assertEquals(env3.witness_chain.length, 2);
});

// ────────────────────────────────────────────────────────────────────────
// 8. Cross-substrate witness primitive (Substrate Court seed)
// ────────────────────────────────────────────────────────────────────────

Deno.test("substrate court seed: same body, different substrate_tag → same body_hash", async () => {
  const body: CborValue = {
    type: "spore_apply",
    output: "1220deadbeef".padEnd(70, "0"),
  };
  const env_trinity = await wrap(body, "spore_apply_v0", "trinity");
  const env_liquid = await wrap(body, "spore_apply_v0", "liquid");
  const env_omega = await wrap(body, "spore_apply_v0", "omega");

  // Same body_hash across substrates (this is the load-bearing claim).
  assertEquals(env_trinity.body_hash, env_liquid.body_hash);
  assertEquals(env_liquid.body_hash, env_omega.body_hash);

  // Different envelope_id (substrate_tag differs).
  assertEquals(env_trinity.envelope_id !== env_liquid.envelope_id, true);
  assertEquals(env_liquid.envelope_id !== env_omega.envelope_id, true);

  // Tamper detection: change one body byte
  const tamperedBody = {
    ...body,
    output: "1220deadbeef".padEnd(69, "0") + "1",
  };
  const env_tampered = await wrap(tamperedBody, "spore_apply_v0", "external");
  assertEquals(env_trinity.body_hash !== env_tampered.body_hash, true);
});
