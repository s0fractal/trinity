// A 5-minute worked example: a deterministic, verifiable, co-witnessed receipt.
// Run it:  deno run examples/receipt.ts
//
// Copying this out? Change the import to "jsr:@s0fractal/canonical-receipt".
import {
  coWitness,
  encodeCanonical,
  multihashSha256,
  toHex,
  unwrap,
  wrap,
} from "../mod.ts";

// 1. Canonical bytes → a stable content address. Map keys are sorted and floats are
//    forbidden, so the SAME value yields the SAME bytes (and hash) in every runtime.
const body = { action: "deploy", target: "prod", at_block: 955220 };
const addr = await multihashSha256(encodeCanonical(body));
console.log("content address: ", addr.slice(0, 28), "…");

// Insertion order does not matter — same address:
const reordered = encodeCanonical({
  at_block: 955220,
  target: "prod",
  action: "deploy",
});
console.log(
  "order-independent:",
  toHex(reordered) === toHex(encodeCanonical(body)),
);

// 2. Wrap it in a receipt envelope (hashes the body, computes an envelope id).
const env = await wrap(body, "phi_receipt", "external");
console.log("envelope_id:     ", env.envelope_id.slice(0, 28), "…");

// 3. Co-witness: append a signature YOU computed over the canonical bytes (any
//    scheme — the package stays pure, you bring the crypto).
const signed = await coWitness(env, {
  oracle: "alice",
  signature_hash: "ed25519:<your signature over encodeCanonical(body)>",
  signed_at_logical: { bitcoin_block: 955220 },
  substrate_tag: "external",
});
console.log(
  "witnesses:       ",
  signed.witness_chain.length,
  "| body_hash stable:",
  signed.body_hash === env.body_hash,
);

// 4. Unwrap verifies the body hash; a tampered body is caught.
console.log("verifies:        ", (await unwrap(signed)).body_hash_verified);
const tampered = { ...signed, body: { action: "exfiltrate" } } as typeof signed;
console.log("tamper caught:   ", !(await unwrap(tampered)).body_hash_verified);
