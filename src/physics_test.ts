import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  assembleWeather,
  classify,
  cognitionRegion,
  governanceRegion,
  proofRegion,
  renderWeather,
  type Signal,
} from "./x8300_physics.ts";

const sig = (level: Signal["level"]): Signal => ({
  label: "x",
  value: "1",
  level,
  note: "",
});

Deno.test("physics classify — status-light over a region's own signals", () => {
  // a single blocker dominates
  assertEquals(classify([sig("block"), sig("ok")], true).health, "blocked");
  // two watch signals → unstable; one → hot
  assertEquals(classify([sig("watch"), sig("watch")], true).health, "unstable");
  assertEquals(classify([sig("watch"), sig("ok")], true).health, "hot");
  // no friction: alive with activity, dormant without
  assertEquals(classify([sig("ok"), sig("ok")], true).health, "alive");
  assertEquals(classify([sig("ok"), sig("ok")], false).health, "dormant");
  // pressure is a bounded 0..1 scalar: block=1, watch=0.5, normalized
  assertEquals(classify([sig("block"), sig("ok")], true).pressure, 0.5);
  assertEquals(classify([sig("ok"), sig("ok")], true).pressure, 0);
});

Deno.test("physics governanceRegion — composes t decisions tallies, does not recompute", () => {
  const clean = governanceRegion({
    summary: {
      proposals: 82,
      receipts: 330,
      unresolved_proposals: 0,
      open_debts: 0,
      unresolved_critiques: 0,
      ritual_receipts: 0,
      receipt_evidence: { none: 0 },
      proposal_triage: { revalidate: 0, review: 0 },
    },
  });
  assertEquals(clean.region, "governance");
  assertEquals(clean.source, "t decisions");
  assertEquals(clean.health, "alive"); // activity, no friction
  // an open debt is a hard blocker
  const debt = governanceRegion({ summary: { open_debts: 2, proposals: 1 } });
  assertEquals(debt.health, "blocked");
  assert(
    debt.signals.some((s) => s.label === "open_debts" && s.level === "block"),
  );
});

Deno.test("physics proofRegion — unlabeled-dominates is a watch, strict failure blocks", () => {
  const ok = proofRegion({
    executable_contracts: 5,
    unlabeled_contracts: 1,
    strict_failures: [],
  });
  assertEquals(ok.health, "alive");
  // labeling debt: unlabeled > executable → watch → hot
  const debt = proofRegion({
    executable_contracts: 1,
    unlabeled_contracts: 29,
    strict_failures: [],
  });
  assertEquals(debt.health, "hot");
  // a strict failure is a blocker
  const fail = proofRegion({
    executable_contracts: 1,
    unlabeled_contracts: 0,
    strict_failures: ["anchor missing"],
  });
  assertEquals(fail.health, "blocked");
});

Deno.test("physics cognitionRegion — phase is reported as a descriptor, drift is a watch", () => {
  const clean = cognitionRegion({
    current: {
      total_md: 1398,
      dominant_phase: "hypothesis",
      dirty_total: 0,
      phase_distribution: { hypothesis: 423, receipt: 302 },
    },
  });
  assertEquals(clean.health, "alive");
  const drift = cognitionRegion({
    current: {
      total_md: 10,
      dominant_phase: "x",
      dirty_total: 3,
      phase_distribution: {},
    },
  });
  assertEquals(drift.health, "hot"); // one watch signal (dirty)
});

Deno.test("physics renderWeather — deterministic given regions (Falsifier 1)", () => {
  const regions = [
    governanceRegion({ summary: { proposals: 1, open_debts: 0 } }),
    proofRegion({
      executable_contracts: 1,
      unlabeled_contracts: 0,
      strict_failures: [],
    }),
  ];
  const w = assembleWeather(regions);
  const meta = { generated_at: null, manifest_hash: "sha256:deadbeef" };
  // same input → identical bytes (no wall-clock in stable mode)
  assertEquals(renderWeather(w, meta), renderWeather(w, meta));
  // the report explains itself — every region appears in the table
  const md = renderWeather(w, meta);
  for (const r of regions) assert(md.includes(r.region));
  assert(md.includes("Falsifiers"));
});
