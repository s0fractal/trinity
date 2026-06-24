import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1";
import {
  coWitness,
  decodeCanonical,
  encodeCanonical,
  multihashSha256,
  toHex,
  unwrap,
  wrap,
} from "./mod.ts";

Deno.test("encodeCanonical — deterministic: map keys are canonically ordered", () => {
  // Same value, different insertion order ⇒ identical bytes ⇒ identical content hash.
  assertEquals(
    toHex(encodeCanonical({ b: 2, a: 1 })),
    toHex(encodeCanonical({ a: 1, b: 2 })),
  );
});

Deno.test("encodeCanonical — floats are forbidden (use Q-format integers)", () => {
  assertThrows(() => encodeCanonical(1.5), Error, "floats");
});

Deno.test("encode/decode round-trips a nested value", () => {
  const v = { tag: "x", n: 42, list: [1, 2, 3], flag: true, nil: null };
  assertEquals(decodeCanonical(encodeCanonical(v)), v);
});

Deno.test("multihashSha256 — a stable content address", async () => {
  const h1 = await multihashSha256(encodeCanonical({ a: 1, b: [2, 3] }));
  const h2 = await multihashSha256(encodeCanonical({ b: [2, 3], a: 1 }));
  assertEquals(h1, h2); // order-independent
  assert(h1.length > 0);
});

Deno.test("wrap/unwrap — the envelope verifies its own body hash", async () => {
  const env = await wrap(
    { action: "deploy", target: "prod" },
    "phi_receipt",
    "external",
  );
  assertEquals(env.schema, "trinity.receipt-envelope.v0.1");
  assert(
    (await unwrap(env)).body_hash_verified,
    "an untampered envelope must verify",
  );
});

Deno.test("unwrap — a tampered body fails verification", async () => {
  const env = await wrap({ action: "deploy" }, "phi_receipt", "external");
  const tampered = { ...env, body: { action: "exfiltrate" } } as typeof env;
  assert(
    !(await unwrap(tampered)).body_hash_verified,
    "tampering must be caught",
  );
});

Deno.test("coWitness — appends a signature, recomputes id, keeps the body hash", async () => {
  const env = await wrap({ x: 1 }, "phi_receipt", "external");
  const signed = await coWitness(env, {
    oracle: "alice",
    signature_hash: "sig:deadbeef",
    signed_at_logical: { bitcoin_block: 955220 },
    substrate_tag: "external",
  });
  assertEquals(signed.witness_chain.length, 1);
  assertEquals(signed.body_hash, env.body_hash); // body unchanged
  assert(
    signed.envelope_id !== env.envelope_id,
    "the witnessed envelope has a new identity",
  );
});
