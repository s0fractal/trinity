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

Deno.test("judge — body divergence AND law drift both reported", async () => {
  const v = await judge([
    env("omega", "Hx", "0x30a95260"),
    env("liquid", "Hy", "0xdeadbeef"),
  ]);
  assertEquals(v.agreement, false);
  const kinds = v.conflicts.map((c) => c.kind).sort();
  assertEquals(kinds, ["body_hash_divergence", "law_hash_drift"]);
});
