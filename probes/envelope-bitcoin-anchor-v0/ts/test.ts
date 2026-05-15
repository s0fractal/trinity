// envelope-bitcoin-anchor-v0 tests — Scenarios A through F from SPEC.md.

import { assertEquals, assert, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { computeAnchor, verifyInclusion } from "./anchor.ts";
import { wrap } from "../../receipt-envelope-encoder-v0/ts/envelope.ts";

async function makeEnvelope(body: unknown, substrate_tag: "trinity" | "liquid" | "omega" | "myc" | "external" = "trinity") {
  // deno-lint-ignore no-explicit-any
  return await wrap(body as any, "substrate_health", substrate_tag);
}

Deno.test("Scenario A: single envelope, root == leaf hash", async () => {
  const env = await makeEnvelope({ a: 1 });
  const payload = await computeAnchor([env]);
  assertEquals(payload.leaf_count, 1);
  assertEquals(payload.inclusion_proofs.length, 1);
  assertEquals(payload.inclusion_proofs[0].siblings.length, 0);
  // Verify inclusion (trivial).
  const ok = await verifyInclusion(
    env.envelope_id,
    payload.inclusion_proofs[0].siblings,
    payload.inclusion_proofs[0].directions,
    payload.merkle_root,
  );
  assertEquals(ok, true);
});

Deno.test("Scenario B: two envelopes, both inclusion proofs verify", async () => {
  const e1 = await makeEnvelope({ a: 1 });
  const e2 = await makeEnvelope({ a: 2 });
  const payload = await computeAnchor([e1, e2]);
  assertEquals(payload.leaf_count, 2);
  for (const proof of payload.inclusion_proofs) {
    const ok = await verifyInclusion(
      proof.envelope_id,
      proof.siblings,
      proof.directions,
      payload.merkle_root,
    );
    assertEquals(ok, true, `proof for ${proof.envelope_id} should verify`);
  }
});

Deno.test("Scenario C: odd number (5) of envelopes, all proofs verify", async () => {
  const envs = await Promise.all([1, 2, 3, 4, 5].map((i) => makeEnvelope({ a: i })));
  const payload = await computeAnchor(envs);
  assertEquals(payload.leaf_count, 5);
  for (const proof of payload.inclusion_proofs) {
    const ok = await verifyInclusion(
      proof.envelope_id,
      proof.siblings,
      proof.directions,
      payload.merkle_root,
    );
    assertEquals(ok, true);
  }
});

Deno.test("Scenario D: tampered envelope_id fails inclusion proof", async () => {
  const envs = await Promise.all([1, 2, 3].map((i) => makeEnvelope({ a: i })));
  const payload = await computeAnchor(envs);
  // Pick first proof, tamper one byte of envelope_id.
  const proof = payload.inclusion_proofs[0];
  // Flip last hex char.
  const tamperedId = proof.envelope_id.slice(0, -1) +
    (proof.envelope_id.slice(-1) === "0" ? "1" : "0");
  const ok = await verifyInclusion(
    tamperedId,
    proof.siblings,
    proof.directions,
    payload.merkle_root,
  );
  assertEquals(ok, false, "tampered envelope_id MUST fail verification");
});

Deno.test("Scenario E: duplicate envelope_id rejected", async () => {
  const e1 = await makeEnvelope({ a: 1 });
  // Two with same body, same substrate_tag, same witness_chain → identical envelope_id.
  const e1_dup = await makeEnvelope({ a: 1 });
  assertEquals(e1.envelope_id, e1_dup.envelope_id);
  const e2 = await makeEnvelope({ a: 2 });

  const payload = await computeAnchor([e1, e1_dup, e2]);
  // Both copies of e1 rejected; only e2 accepted.
  assertEquals(payload.leaf_count, 1);
  assertEquals(payload.leaves[0].envelope_id, e2.envelope_id);
  assert(
    payload.rejected.some((r) => r.reason === "duplicate" && r.envelope_id === e1.envelope_id),
    "duplicate envelope_id should appear in rejected list",
  );
});

Deno.test("Scenario F: wrong schema rejected, others processed", async () => {
  const e1 = await makeEnvelope({ a: 1 });
  const e2 = await makeEnvelope({ a: 2 });
  // Synthetic forward-incompat envelope.
  const eBad = {
    schema: "trinity.receipt-envelope.v0.0",
    envelope_id: "1220" + "ab".repeat(32),
    body_hash: "1220" + "cd".repeat(32),
    substrate_tag: "external",
    body_kind: "substrate_health",
  };
  const payload = await computeAnchor([e1, eBad, e2]);
  assertEquals(payload.leaf_count, 2, "only e1 and e2 accepted");
  assert(
    payload.rejected.some((r) => r.reason === "wrong_schema"),
    "wrong-schema envelope should appear in rejected",
  );
});

Deno.test("Determinism: same envelope set produces same merkle_root across calls", async () => {
  const envs = await Promise.all([3, 1, 2].map((i) => makeEnvelope({ a: i })));
  const p1 = await computeAnchor(envs);
  // Reverse input order; canonical-sort should produce same root.
  const p2 = await computeAnchor([envs[2], envs[0], envs[1]]);
  assertEquals(p1.merkle_root, p2.merkle_root);
});

Deno.test("Empty input rejected", async () => {
  await assertRejects(() => computeAnchor([]), Error);
});

Deno.test("inscription_ready exposes merkle_root as payload", async () => {
  const e1 = await makeEnvelope({ a: 1 });
  const payload = await computeAnchor([e1]);
  assertEquals(payload.inscription_ready.method, "placeholder");
  assertEquals(payload.inscription_ready.anchor_target, "merkle_root");
  assertEquals(payload.inscription_ready.payload_hex, payload.merkle_root);
  assertEquals(payload.inscription_ready.payload_len_bytes, payload.merkle_root.length / 2);
});
