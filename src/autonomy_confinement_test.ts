import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildConfinement,
  type ConfinementObservation,
  type FileState,
  verifyConfinement,
} from "./x5C40_autonomy_confinement.ts";

const PRE: FileState[] = [{ path: "x7B88.md", hash: "sha256:aaa" }];
async function receipt() {
  return await buildConfinement({
    action_profile: "projections",
    verb: "regen-projection",
    target: "x7B88",
    pre_state: PRE,
    allowed_write_set: ["x7B88.md"],
    generator: "t evidence --stable",
    required_gates: ["fmt", "generation-diff"],
    rollback: "git checkout -- x7B88.md",
    output_budget: { max_bytes: 1000, max_seconds: 60 },
  });
}
const okObs: ConfinementObservation = {
  written_paths: ["x7B88.md"],
  post_state: [{ path: "x7B88.md", hash: "sha256:bbb" }],
  gate_results: { fmt: "pass", "generation-diff": "pass" },
  bytes_written: 500,
  seconds: 5,
};

Deno.test("confinement — a fully-confined run is confined", async () => {
  const v = verifyConfinement(await receipt(), okObs, PRE);
  assert(v.confined, JSON.stringify(v.violations));
});

Deno.test("confinement — RED TEAM: a write OUTSIDE the set is a violation", async () => {
  const v = verifyConfinement(
    await receipt(),
    { ...okObs, written_paths: ["x7B88.md", "src/secret.ts"] },
    PRE,
  );
  assert(!v.confined);
  assert(v.violations.some((x) => x.kind === "write_outside_set"));
});

Deno.test("confinement — RED TEAM: a STALE pre-state is a violation", async () => {
  const v = verifyConfinement(await receipt(), okObs, [{
    path: "x7B88.md",
    hash: "sha256:DIFFERENT",
  }]);
  assert(!v.confined);
  assert(v.violations.some((x) => x.kind === "stale_pre_state"));
});

Deno.test("confinement — RED TEAM: a failed or missing required gate is a violation", async () => {
  const failed = verifyConfinement(await receipt(), {
    ...okObs,
    gate_results: { fmt: "fail", "generation-diff": "pass" },
  }, PRE);
  assert(failed.violations.some((x) => x.kind === "gate_failed"));
  const missing = verifyConfinement(await receipt(), {
    ...okObs,
    gate_results: { fmt: "pass" },
  }, PRE);
  assert(missing.violations.some((x) => x.kind === "gate_missing"));
});

Deno.test("confinement — RED TEAM: a budget overrun is a violation", async () => {
  const v = verifyConfinement(await receipt(), {
    ...okObs,
    bytes_written: 99999,
  }, PRE);
  assert(!v.confined);
  assert(v.violations.some((x) => x.kind === "budget_exceeded"));
});

Deno.test("confinement — the receipt commitment binds the write-set (tamper ⇒ different commitment)", async () => {
  const a = await receipt();
  const b = await buildConfinement({
    ...a,
    allowed_write_set: ["x7B88.md", "evil.ts"],
  });
  assert(a.commitment !== b.commitment);
});
