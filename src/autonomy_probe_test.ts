import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildConfinement } from "./x5C40_autonomy_confinement.ts";
import { probe } from "./x5C50_autonomy_probe.ts";

// a mock runner: scripted git/generator/gate outputs, no real subprocess or worktree.
function mockRunner(
  opts: { status: string; genCode?: number; fmtCode?: number },
) {
  return (cmd: string[], _cwd: string) => {
    if (cmd[0] === "git" && cmd[1] === "worktree" && cmd[2] === "add") {
      return Promise.resolve({ code: 0, out: "", err: "" });
    }
    if (cmd[0] === "git" && cmd[1] === "status") {
      return Promise.resolve({ code: 0, out: opts.status, err: "" });
    }
    if (cmd[0] === "git" && cmd[1] === "worktree" && cmd[2] === "remove") {
      return Promise.resolve({ code: 0, out: "", err: "" });
    }
    if (cmd[0] === "deno" && cmd[1] === "fmt") {
      return Promise.resolve({ code: opts.fmtCode ?? 0, out: "", err: "" });
    }
    return Promise.resolve({ code: opts.genCode ?? 0, out: "", err: "" }); // generator
  };
}

async function receipt() {
  // a file that doesn't exist on disk → pre/post state null, matching the (absent) worktree.
  return await buildConfinement({
    action_profile: "projections",
    verb: "regen",
    target: "t.md",
    pre_state: [{ path: "nonexistent-probe-fixture.md", hash: null }],
    allowed_write_set: ["nonexistent-probe-fixture.md"],
    generator: "echo noop",
    required_gates: ["fmt"],
    rollback: "git checkout",
    output_budget: { max_bytes: 1_000_000, max_seconds: 120 },
  });
}

Deno.test("probe — a confined run reports confined and always cleans the worktree", async () => {
  const r = await probe(await receipt(), {
    runner: mockRunner({ status: " M nonexistent-probe-fixture.md" }),
    tmpName: "test-confined",
  });
  assert(r.verdict?.confined, JSON.stringify(r.verdict?.violations));
});

Deno.test("probe — RED TEAM: a write OUTSIDE the box is caught and not confined", async () => {
  const r = await probe(await receipt(), {
    runner: mockRunner({
      status: " M nonexistent-probe-fixture.md\n?? src/secret.ts",
    }),
    tmpName: "test-escape",
  });
  assert(!r.verdict?.confined);
  assert(r.verdict?.violations.some((v) => v.kind === "write_outside_set"));
});

Deno.test("probe — RED TEAM: a failed gate is not confined", async () => {
  const r = await probe(await receipt(), {
    runner: mockRunner({
      status: " M nonexistent-probe-fixture.md",
      fmtCode: 1,
    }),
    tmpName: "test-gate",
  });
  assert(!r.verdict?.confined);
  assert(r.verdict?.violations.some((v) => v.kind === "gate_failed"));
});

Deno.test("probe — RED TEAM: a tampered receipt is rejected before generator execution", async () => {
  const tampered = await receipt();
  tampered.allowed_write_set.push("src/secret.ts");
  let calls = 0;
  const r = await probe(tampered, {
    runner: (..._args) => {
      calls++;
      return Promise.resolve({ code: 0, out: "", err: "" });
    },
  });
  assertEquals(r.ran, false);
  assertEquals(calls, 0);
  assert(
    r.verdict?.violations.some((v) => v.kind === "commitment_mismatch"),
  );
});
