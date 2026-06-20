import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { oneShot, type OneShotDeps } from "./x5C90_autonomy_oneshot.ts";
import type { ExecResult } from "./x5C60_autonomy_executor.ts";
import type {
  DemandReport,
  ProjectionDemand,
} from "./x5C80_autonomy_demand.ts";
import type { Adapter } from "./x5C70_autonomy_attenuation.ts";
import type { AutonomyMandate } from "./x5C20_autonomy.ts";

// ─────────────────────────────────────────────────────────────────────────────
// The A1 one-shot join (codex x7700_954558 P3). Dogfood is on an intentionally
// stale DISPOSABLE fixture; every joint is fail-closed and exercised in isolation.

const MANDATE = { mandate_id: "epoch-1" } as unknown as AutonomyMandate;
const ADAPTERS: Adapter[] = [
  {
    target: "x_fixture_a",
    organ: "src/fixture_a.ts",
    argv: ["./t", "noop"],
    output_path: "src/x_fixture_a.myc.md",
  },
  {
    target: "x_fixture_b",
    organ: "src/fixture_b.ts",
    argv: ["./t", "noop"],
    output_path: "src/x_fixture_b.myc.md",
  },
];

function proj(
  target: string,
  state: ProjectionDemand["state"],
): ProjectionDemand {
  return {
    target,
    output_path: `src/${target}.myc.md`,
    state,
    current_hash: "sha256:old",
    regenerated_hash: state === "stale" ? "sha256:new" : "sha256:old",
    detail: state,
  };
}
function report(projections: ProjectionDemand[]): DemandReport {
  return {
    type: "a1_demand",
    position: "5/C8",
    checked: projections.length,
    stale: projections.filter((p) => p.state === "stale").length,
    current: projections.filter((p) => p.state === "current").length,
    unknown: projections.filter((p) => p.state === "unknown").length,
    demand: projections.some((p) => p.state === "stale"),
    projections,
  };
}
const okExec = (target: string): ExecResult => ({
  intent: { verb: "regen-projection", target, effects: ["projection"] },
  admitted: true,
  attenuated: true,
  promoted: true,
  rolled_back: false,
  output_path: `src/${target}.myc.md`,
  reason: "confined A1 executed",
  receipt_commitment: "sha256:exec",
});

function deps(over: Partial<OneShotDeps> = {}): {
  d: OneShotDeps;
  execCalls: string[];
} {
  const execCalls: string[] = [];
  const d: OneShotDeps = {
    authority: () =>
      Promise.resolve({ verified: true, reason: "ok", at_height: 954500 }),
    demand: (_a) => Promise.resolve(report([proj("x_fixture_a", "stale")])),
    runExecute: (input) => {
      execCalls.push(input.intent.target);
      return Promise.resolve(okExec(input.intent.target));
    },
    loadMandates: () => Promise.resolve([MANDATE]),
    adapters: ADAPTERS,
    ...over,
  };
  return { d, execCalls };
}

Deno.test("oneshot — DOGFOOD: a proven-stale fixture executes ONCE and binds both hashes", async () => {
  const { d, execCalls } = deps();
  const r = await oneShot(d);
  assert(r.acted, r.reason);
  assertEquals(r.picked, "x_fixture_a");
  assertEquals(execCalls, ["x_fixture_a"]); // exactly one execution
  assert(r.demand_snapshot_hash?.startsWith("sha256:"));
  assert(r.authority_verdict_hash?.startsWith("sha256:"));
  assert(r.receipt_commitment?.startsWith("sha256:"));
});

Deno.test("oneshot — RED TEAM: demand=false performs NO action", async () => {
  const { d, execCalls } = deps({
    demand: () => Promise.resolve(report([proj("x_fixture_a", "current")])),
  });
  const r = await oneShot(d);
  assert(!r.acted);
  assert(r.reason.includes("no proven demand"));
  assertEquals(execCalls, []);
});

Deno.test("oneshot — RED TEAM: any unknown probe fails closed", async () => {
  const { d, execCalls } = deps({
    demand: () => Promise.resolve(report([proj("x_fixture_a", "unknown")])),
  });
  const r = await oneShot(d);
  assert(!r.acted);
  assert(r.reason.includes("unknown"));
  assertEquals(execCalls, []);
});

Deno.test("oneshot — RED TEAM: no verifying mandate ⇒ no live authority", async () => {
  const { d, execCalls } = deps({
    authority: () => Promise.resolve({ verified: false, reason: "denied" }),
  });
  const r = await oneShot(d);
  assert(!r.acted);
  assert(r.reason.includes("no live ratified authority"));
  assertEquals(execCalls, []);
});

Deno.test("oneshot — RED TEAM: ambiguous authority (two mandates verify) denies", async () => {
  const { d, execCalls } = deps({
    loadMandates: () =>
      Promise.resolve([MANDATE, { mandate_id: "epoch-x" } as AutonomyMandate]),
  });
  const r = await oneShot(d);
  assert(!r.acted);
  assert(r.reason.includes("ambiguous live authority"));
  assertEquals(execCalls, []);
});

Deno.test("oneshot — RED TEAM: authority lapsing at revalidation aborts before execution", async () => {
  let calls = 0;
  const { d, execCalls } = deps({
    authority: () => {
      calls++;
      return Promise.resolve(
        calls === 1
          ? { verified: true, reason: "ok", at_height: 954500 }
          : { verified: false, reason: "lapsed" },
      );
    },
  });
  const r = await oneShot(d);
  assert(!r.acted);
  assert(r.reason.includes("authority lapsed"));
  assertEquals(execCalls, []);
});

Deno.test("oneshot — RED TEAM: target no longer stale at revalidation aborts", async () => {
  let calls = 0;
  const { d, execCalls } = deps({
    demand: () => {
      calls++;
      // first (snapshot) stale; second (revalidation on the picked target) current.
      return Promise.resolve(
        report([proj("x_fixture_a", calls === 1 ? "stale" : "current")]),
      );
    },
  });
  const r = await oneShot(d);
  assert(!r.acted);
  assert(r.reason.includes("no longer proven stale"));
  assertEquals(execCalls, []);
});

Deno.test("oneshot — deterministic: with multiple stale targets, picks the stable-first and executes once", async () => {
  const { d, execCalls } = deps({
    // order b-then-a in the report; stable ordering must pick a.
    demand: (a) =>
      Promise.resolve(
        a.length === 1
          ? report([proj(a[0].target, "stale")]) // revalidation on the one picked
          : report([
            proj("x_fixture_b", "stale"),
            proj("x_fixture_a", "stale"),
          ]),
      ),
  });
  const r = await oneShot(d);
  assert(r.acted, r.reason);
  assertEquals(r.picked, "x_fixture_a"); // stable-first, not report order
  assertEquals(execCalls, ["x_fixture_a"]); // exactly one
});
