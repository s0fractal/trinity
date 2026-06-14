// src/daemon_test.ts — the daemon's safety-critical law gate, which authorizes
// (or refuses) autonomous `--act`. PURE classification of a
// SubstrateCourtLiveVerdict into verified|drift|insufficient|invalid|unavailable;
// the live orchestration is integration-exercised by `t daemon tick --act`.
// Gated by `deno task test:unit` so the autonomy guard cannot silently regress.
// Codex R1: mutation requires VERIFIED evidence, never merely absence of drift.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { interpretCourtVerdict, lawPermitsMutation } from "./x7F00_daemon.ts";

function verdict(
  court: unknown,
  law_bridge?: unknown,
  witnesses: string[] = [],
) {
  return { witnesses, law_bridge, court };
}

Deno.test("law gate - two agreeing witnesses, no drift → verified → mutation allowed", () => {
  const w = interpretCourtVerdict(verdict(
    { law_agreement: true, law_witness_count: 2, conflicts: [] },
    { consistent: true },
    ["trinity", "omega", "liquid", "myc"],
  ));
  assertEquals(w.state, "verified");
  assertEquals(lawPermitsMutation(w), true);
});

Deno.test("law gate - law_hash_drift → drift → refused", () => {
  const w = interpretCourtVerdict(verdict({
    law_agreement: false,
    law_witness_count: 2,
    conflicts: [{ kind: "law_hash_drift", between: ["omega", "liquid"] }],
  }));
  assertEquals(w.state, "drift");
  assertEquals(lawPermitsMutation(w), false);
});

Deno.test("law gate - bridge inconsistent → drift → refused", () => {
  const w = interpretCourtVerdict(verdict(
    { law_witness_count: 2, conflicts: [] },
    { consistent: false },
  ));
  assertEquals(w.state, "drift");
  assertEquals(lawPermitsMutation(w), false);
});

Deno.test("law gate - one declared witness (< min 2) → insufficient → refused", () => {
  const w = interpretCourtVerdict(verdict(
    { law_agreement: null, law_witness_count: 1, conflicts: [] },
    { consistent: null },
  ));
  assertEquals(w.state, "insufficient");
  assertEquals(lawPermitsMutation(w), false);
});

Deno.test("law gate - court unavailable (no output) → unavailable → refused (fail-CLOSED)", () => {
  const w = interpretCourtVerdict(undefined);
  assertEquals(w.state, "unavailable");
  assertEquals(w.ran, false);
  assertEquals(lawPermitsMutation(w), false);
});

Deno.test("law gate - malformed verdict / court:null → invalid → refused", () => {
  assertEquals(interpretCourtVerdict("garbage").state, "invalid");
  assertEquals(interpretCourtVerdict(null).state, "invalid");
  assertEquals(
    interpretCourtVerdict(verdict(null, { consistent: true })).state,
    "invalid",
  );
  assertEquals(lawPermitsMutation(interpretCourtVerdict("garbage")), false);
});

Deno.test("law gate - body divergence alone (law agrees) → verified (only LAW gates)", () => {
  const w = interpretCourtVerdict(verdict(
    {
      law_agreement: true,
      law_witness_count: 2,
      conflicts: [{
        kind: "body_hash_divergence",
        between: ["trinity", "omega"],
      }],
    },
    { consistent: true },
  ));
  assertEquals(w.state, "verified");
  assertEquals(w.drift, false);
  assertEquals(lawPermitsMutation(w), true);
});
