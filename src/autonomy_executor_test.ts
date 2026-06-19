import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { type ExecHooks, execute } from "./x5C60_autonomy_executor.ts";
import type { Adapter } from "./x5C70_autonomy_attenuation.ts";
import type { AutonomyMandate } from "./x5C20_autonomy.ts";

// a real `writes` organ (x7B00) gives the capability; argv is mock-intercepted.
const ADAPTER: Adapter = {
  target: "x7B88_evidence_report",
  organ: "src/x7B00_evidence.ts",
  argv: ["gen"],
  output_path: "src/x7B88_evidence_report.myc.md",
};
const MANDATE: AutonomyMandate = {
  mandate_id: "epoch-1",
  constitution_commitment: "sha256:c0",
  issued_by: ["s0fractal", "claude"],
  valid_from: { kind: "bitcoin_block", height: 954000 },
  valid_until: { kind: "bitcoin_block", height: 958775 },
  action_profiles: [{
    id: "projections",
    class: "A1",
    verbs: ["regen-projection"],
    targets: ["x7B88_evidence_report"],
    effect_ceiling: ["projection"],
    required_gates: ["fmt", "generation-diff"],
  }],
  global_budgets: { max_bytes: 2_000_000, max_seconds: 300 },
};
const INTENT = {
  verb: "regen-projection",
  target: "x7B88_evidence_report",
  effects: ["projection"],
};
const input = {
  intent: INTENT,
  mandate: MANDATE,
  mandate_final: true,
  at_height: 954500,
  adapters: [ADAPTER],
};

function hooks(
  opts: {
    status: string;
    wtOut: string;
    main: string;
    genCode?: number;
    fmtCode?: number;
    driftOnRecheck?: string;
  },
): { hooks: ExecHooks; state: { main: string } } {
  const state = { main: opts.main };
  let mainReads = 0;
  return {
    state,
    hooks: {
      run: (cmd) => {
        if (cmd[0] === "git" && cmd[1] === "status") {
          return Promise.resolve({ code: 0, out: opts.status, err: "" });
        }
        if (cmd[0] === "deno" && cmd[1] === "fmt") {
          return Promise.resolve({ code: opts.fmtCode ?? 0, out: "", err: "" });
        }
        if (cmd[0] === "git") {
          return Promise.resolve({ code: 0, out: "", err: "" }); // worktree add/remove
        }
        return Promise.resolve({ code: opts.genCode ?? 0, out: "", err: "" }); // generator
      },
      readWorktree: () => Promise.resolve(opts.wtOut),
      readMain: () => {
        mainReads++;
        if (opts.driftOnRecheck && mainReads === 2) {
          return Promise.resolve(opts.driftOnRecheck);
        }
        return Promise.resolve(state.main);
      },
      writeMain: (_rel, bytes) => {
        state.main = bytes;
        return Promise.resolve();
      },
    },
  };
}

Deno.test("executor — confined run PROMOTES the exact verified bytes to the main tree", async () => {
  const { hooks: h, state } = hooks({
    status: " M src/x7B88_evidence_report.myc.md",
    wtOut: "NEW",
    main: "OLD",
  });
  const r = await execute(input, h);
  assert(r.promoted, r.reason);
  assertEquals(r.attenuated, true);
  assertEquals(state.main, "NEW"); // promoted
  assertEquals(r.warrant?.no_op, false);
  assert(r.receipt_commitment?.startsWith("sha256:"));
});

Deno.test("executor — an already-current projection is a confined NO-OP promotion", async () => {
  const { hooks: h, state } = hooks({
    status: "",
    wtOut: "SAME",
    main: "SAME",
  });
  const r = await execute(input, h);
  assert(r.promoted, r.reason);
  assertEquals(r.warrant?.no_op, true);
  assertEquals(state.main, "SAME");
});

Deno.test("executor — RED TEAM: a write OUTSIDE the set is NOT promoted", async () => {
  const { hooks: h, state } = hooks({
    status: " M src/x7B88_evidence_report.myc.md\n?? src/secret.ts",
    wtOut: "NEW",
    main: "OLD",
  });
  const r = await execute(input, h);
  assert(!r.promoted);
  assertEquals(state.main, "OLD"); // untouched
});

Deno.test("executor — RED TEAM: main-tree drift before promotion ABORTS (no write)", async () => {
  const { hooks: h, state } = hooks({
    status: " M src/x7B88_evidence_report.myc.md",
    wtOut: "NEW",
    main: "OLD",
    driftOnRecheck: "CHANGED-UNDERNEATH",
  });
  const r = await execute(input, h);
  assert(!r.promoted);
  assert(r.reason.includes("drift"));
  assertEquals(state.main, "OLD"); // executor never called writeMain — aborted on drift
});

Deno.test("executor — RED TEAM: a failed fmt gate is not promoted", async () => {
  const { hooks: h, state } = hooks({
    status: " M src/x7B88_evidence_report.myc.md",
    wtOut: "NEW",
    main: "OLD",
    fmtCode: 1,
  });
  const r = await execute(input, h);
  assert(!r.promoted);
  assertEquals(state.main, "OLD");
});
