// src/x5200_cognition_recommend_test.ts — closure-feedback behavior for the
// cognition recommender. Verifies that a voice-declared `satisfies_signal`
// tier-sorts the satisfied signal below live work without lying about pressure.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { applyClosure } from "./x5200_cognition_recommend.ts";

type RecIn = Parameters<typeof applyClosure>[0][number];

function rec(repo: string, vector: string, pressure: number): RecIn {
  return {
    repo: repo as RecIn["repo"],
    vector,
    phase_from: "experiment",
    phase_to: "receipt",
    pressure,
    action: `do ${repo}`,
    rationale: "because",
    expected_receipt: "a receipt",
    commands: [],
    signal_key: `${repo}/${vector}`,
  };
}

Deno.test("applyClosure: satisfied signal sorts below unsatisfied, keeps pressure", () => {
  const recs = [
    rec("liquid", "identity-resolution", 0.604), // highest pressure
    rec("omega", "deterministic-execution", 0.5),
  ];
  const satisfied = new Map([
    ["liquid/identity-resolution", {
      path: "src/receipt.myc.md",
      block: 953518,
    }],
  ]);

  const out = applyClosure(recs, satisfied);

  // omega (unsatisfied, lower pressure) now ranks above liquid (satisfied).
  assertEquals(out[0].repo, "omega");
  assertEquals(out[0].rank, 1);
  assertEquals(out[0].satisfied, false);

  assertEquals(out[1].repo, "liquid");
  assertEquals(out[1].rank, 2);
  assertEquals(out[1].satisfied, true);
  assertEquals(out[1].satisfied_by, "src/receipt.myc.md");
  assertEquals(out[1].satisfied_at_block, 953518);
  // Pressure is never altered — only ordering.
  assertEquals(out[1].pressure, 0.604);
});

Deno.test("applyClosure: no satisfiers preserves pure pressure ordering", () => {
  const recs = [
    rec("omega", "deterministic-execution", 0.4),
    rec("liquid", "identity-resolution", 0.7),
  ];
  const out = applyClosure(recs, new Map());

  assertEquals(out.map((r) => r.repo), ["liquid", "omega"]);
  assertEquals(out.every((r) => r.satisfied === false), true);
});

Deno.test("applyClosure: among satisfied signals, higher pressure still ranks first", () => {
  const recs = [
    rec("liquid", "identity-resolution", 0.3),
    rec("omega", "deterministic-execution", 0.8),
  ];
  const satisfied = new Map([
    ["liquid/identity-resolution", { path: "a", block: 1 }],
    ["omega/deterministic-execution", { path: "b", block: 2 }],
  ]);
  const out = applyClosure(recs, satisfied);

  // Both satisfied → fall back to pressure ordering.
  assertEquals(out.map((r) => r.repo), ["omega", "liquid"]);
  assertEquals(out.every((r) => r.satisfied), true);
});
