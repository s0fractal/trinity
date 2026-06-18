// court_test.ts — Substrate Court verdict logic, incl. law-drift detection.
// Run: deno test --allow-read ts/court_test.ts  (also gated by trinity
// `deno task test:unit`, which folds in this probe test).

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { type Envelope, judge } from "./court.ts";
import { ENVELOPE_SCHEMA } from "../../receipt-envelope-encoder-v0/ts/envelope.ts";

/** A witness envelope with no inline body (so body_hash is taken as-is, not
 *  recomputed) — lets us drive the cross-witness comparisons directly. */
function env(
  tag: string,
  body_hash: string,
  law_hash: string | null,
  id = `id-${tag}`,
): Envelope {
  return {
    schema: ENVELOPE_SCHEMA,
    envelope_id: id,
    body_hash,
    substrate_tag: tag,
    body_kind: "substrate_health",
    law_hash,
    witness_chain: [],
  };
}

Deno.test("judge — same body_hash + same law_hash across substrates ⇒ agreement", async () => {
  const v = await judge([
    env("omega", "H", "0x30a95260"),
    env("liquid", "H", "0x30a95260"),
    env("trinity", "H", "0x30a95260"),
  ]);
  assertEquals(v.agreement, true);
  assertEquals(v.conflicts.length, 0);
  assertEquals(v.witnesses_count, 3);
});

Deno.test("judge — same body_hash but DIFFERING law_hash ⇒ law_hash_drift, no agreement", async () => {
  const v = await judge([
    env("omega", "H", "0x30a95260"),
    env("liquid", "H", "0xdeadbeef"),
  ]);
  assertEquals(v.agreement, false);
  const drift = v.conflicts.filter((c) => c.kind === "law_hash_drift");
  assertEquals(drift.length, 1);
  assertEquals(drift[0], {
    kind: "law_hash_drift",
    between: ["omega", "liquid"],
    values: ["0x30a95260", "0xdeadbeef"],
  });
  // body still agrees — the ONLY conflict is the law drift.
  assertEquals(v.conflicts.length, 1);
});

Deno.test("judge — a null law_hash is an abstention, never drift", async () => {
  const v = await judge([
    env("omega", "H", "0x30a95260"),
    env("liquid", "H", null),
    env("trinity", "H", null),
  ]);
  assertEquals(v.agreement, true);
  assertEquals(
    v.conflicts.filter((c) => c.kind === "law_hash_drift").length,
    0,
  );
  assertEquals(v.law_hashes, {
    omega: "0x30a95260",
    liquid: null,
    trinity: null,
  });
});

Deno.test("judge — self-report body divergence is diagnostic; only law drift is a conflict (codex P2)", async () => {
  const v = await judge([
    env("omega", "Hx", "0x30a95260"),
    env("liquid", "Hy", "0xdeadbeef"),
  ]);
  assertEquals(v.agreement, false); // law drift breaks governance
  assertEquals(v.conflicts.map((c) => c.kind), ["law_hash_drift"]);
  assertEquals(v.health_divergence.length, 1); // the body difference is diagnostic
});

Deno.test("law_agreement — heterogeneous self-report bodies do NOT break governance (codex P2)", async () => {
  // The core substrate-court case: substrates witness their OWN health bodies.
  // Different self-reports are EXPECTED — they are not four witnesses to one body.
  const v = await judge([
    env("trinity", "Htrinity", "0x30a95260"),
    env("omega", "Homega", "0x30a95260"),
  ]);
  assertEquals(v.agreement, true); // governance holds despite different health
  assertEquals(v.health_divergence.length, 1); // surfaced, not a failure
  assertEquals(v.shared_claim_agreement, null); // no two share a subject
  assertEquals(v.law_agreement, true);
  assertEquals(v.law_witness_count, 2);
});

Deno.test("judge — two witnesses to the SAME claim with different bodies DO conflict (codex P2)", async () => {
  const claim = (tag: string, body_hash: string): Envelope => ({
    schema: ENVELOPE_SCHEMA,
    envelope_id: `id-${tag}`,
    body_hash,
    substrate_tag: tag,
    body_kind: "morphism_witness",
    subject: "claim-X", // both witness the SAME subject
    law_hash: "0x30a95260",
    witness_chain: [],
  });
  const v = await judge([claim("omega", "Ha"), claim("trinity", "Hb")]);
  assertEquals(v.agreement, false); // same subject, different body → real conflict
  assertEquals(v.shared_claim_agreement, false);
  assertEquals(v.conflicts.map((c) => c.kind), ["body_hash_divergence"]);
  assertEquals(v.health_divergence.length, 0);
});

Deno.test("judge — two witnesses to the same claim AGREEING ⇒ shared_claim_agreement true", async () => {
  const claim = (tag: string): Envelope => ({
    schema: ENVELOPE_SCHEMA,
    envelope_id: `id-${tag}`,
    body_hash: "Hsame",
    substrate_tag: tag,
    body_kind: "morphism_witness",
    subject: "claim-Y",
    law_hash: "0x30a95260",
    witness_chain: [],
  });
  const v = await judge([claim("omega"), claim("trinity")]);
  assertEquals(v.agreement, true);
  assertEquals(v.shared_claim_agreement, true);
  assertEquals(v.integrity_valid, true);
});

Deno.test("law_agreement — fewer than two declared laws ⇒ null (cannot compare)", async () => {
  const v = await judge([
    env("trinity", "H", "0x30a95260"),
    env("liquid", "H", null),
  ]);
  assertEquals(v.law_agreement, null);
  assertEquals(v.law_witness_count, 1);
});

Deno.test("law_agreement — drift makes it false", async () => {
  const v = await judge([
    env("omega", "H", "0x30a95260"),
    env("liquid", "H", "0xdeadbeef"),
  ]);
  assertEquals(v.law_agreement, false);
  assertEquals(v.law_witness_count, 2);
});
