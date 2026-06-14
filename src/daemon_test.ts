// src/daemon_test.ts — the daemon's safety-critical law-drift decision, which
// gates autonomous `--act`. PURE interpretation of a SubstrateCourtLiveVerdict;
// the live orchestration is integration-exercised by `t daemon tick --act`.
// Gated by `deno task test:unit` so the autonomy guard cannot silently regress.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { interpretCourtVerdict } from "./x7F00_daemon.ts";

Deno.test("interpretCourtVerdict - agreement, no drift → act allowed", () => {
  const w = interpretCourtVerdict({
    witnesses: ["trinity", "omega", "liquid", "myc"],
    law_bridge: { consistent: true },
    court: { law_agreement: true, law_witness_count: 2, conflicts: [] },
  });
  assertEquals(w.drift, false);
  assertEquals(w.law_agreement, true);
  assertEquals(w.law_witness_count, 2);
  assertEquals(w.witnesses.length, 4);
});

Deno.test("interpretCourtVerdict - law_hash_drift conflict → drift (act refused)", () => {
  const w = interpretCourtVerdict({
    witnesses: ["omega", "liquid"],
    court: {
      law_agreement: false,
      conflicts: [{ kind: "law_hash_drift", between: ["omega", "liquid"] }],
    },
  });
  assertEquals(w.drift, true);
});

Deno.test("interpretCourtVerdict - law_bridge inconsistent → drift", () => {
  const w = interpretCourtVerdict({
    witnesses: ["trinity"],
    law_bridge: { consistent: false },
    court: { conflicts: [] },
  });
  assertEquals(w.drift, true);
});

Deno.test("interpretCourtVerdict - bridge null (unverifiable) is NOT drift", () => {
  // omega absent ⇒ bridge consistent=null ⇒ must not false-block the daemon.
  const w = interpretCourtVerdict({
    witnesses: ["trinity"],
    law_bridge: { consistent: null },
    court: { law_agreement: null, conflicts: [] },
  });
  assertEquals(w.drift, false);
});

Deno.test("interpretCourtVerdict - body_hash_divergence alone is NOT law drift", () => {
  // Substrates witnessing different health bodies is expected; only LAW drift gates.
  const w = interpretCourtVerdict({
    witnesses: ["trinity", "omega"],
    law_bridge: { consistent: true },
    court: {
      law_agreement: true,
      conflicts: [{
        kind: "body_hash_divergence",
        between: ["trinity", "omega"],
      }],
    },
  });
  assertEquals(w.drift, false);
});

Deno.test("interpretCourtVerdict - garbage input is inert (never a false alarm)", () => {
  assertEquals(interpretCourtVerdict(null).drift, false);
  assertEquals(interpretCourtVerdict("nope").ran, false);
  assertEquals(interpretCourtVerdict({}).drift, false);
});
