import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type ExecHooks,
  execute,
  verifyExecutionAuthority,
} from "./x5C60_autonomy_executor.ts";
import type { AutonomyMandate } from "./x5C20_autonomy.ts";

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
      authorize: () =>
        Promise.resolve({
          verified: true,
          reason: "test authority",
          at_height: 954500,
          mandate_body_commitment: "sha256:mandate",
          mandate_finality_commitment: "sha256:mandate-finality",
          attenuation_finality_commitment: "sha256:attenuation-finality",
        }),
      mainPathContained: () => Promise.resolve(true),
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

const MANDATE_KEY =
  "31b0013dc85509f4b5386fcecb16d97ef996c0a4fe457a2ad40c824d2b2e04d9";
const ATTENUATION_KEY =
  "1bd456e1f3be933aa755cd64c851bee3d3c9b35a37ac8c112d3d23ccfe61e044";
const bothFinal = () =>
  Promise.resolve({
    mutations: [
      { key: MANDATE_KEY, state: "implemented" },
      { key: ATTENUATION_KEY, state: "implemented" },
    ],
  });

Deno.test("executor authority — caller cannot substitute the mandate body of a live epoch", async () => {
  // epoch-1 is discoverable as live, but the SUBSTITUTED MANDATE (a different body)
  // is rejected: discovery selects the epoch, the exact-body check refuses the swap.
  const denied = await verifyExecutionAuthority(MANDATE, {
    lifecycle: bothFinal,
    currentBlock: () => Promise.resolve(954500),
  });
  assertEquals(denied.verified, false);
  assert(denied.reason.includes("mandate body"), denied.reason);
});

Deno.test("executor authority — discovery requires both live finalities and the anchor", async () => {
  const epoch = JSON.parse(
    await Deno.readTextFile("contracts/mandates/epoch-1.mandate.json"),
  ) as AutonomyMandate;

  // only one finality implemented ⇒ no epoch is final ⇒ no live ratified epoch.
  const oneFinal = await verifyExecutionAuthority(epoch, {
    lifecycle: () =>
      Promise.resolve({
        mutations: [{ key: MANDATE_KEY, state: "implemented" }],
      }),
    currentBlock: () => Promise.resolve(954500),
  });
  assertEquals(oneFinal.verified, false);
  assert(oneFinal.reason.includes("no live ratified epoch"), oneFinal.reason);

  // both finalities + the real epoch-1 body + an in-window anchor ⇒ verified.
  const verified = await verifyExecutionAuthority(epoch, {
    lifecycle: bothFinal,
    currentBlock: () => Promise.resolve(954500),
  });
  assert(verified.verified, verified.reason);
  assertEquals(verified.at_height, 954500);
  // byte-for-byte: the warrant binds exactly the discovered epoch's finality keys.
  assertEquals(verified.mandate_finality_commitment, MANDATE_KEY);
  assertEquals(verified.attenuation_finality_commitment, ATTENUATION_KEY);
});

Deno.test("executor — RED TEAM: path containment is rechecked before any promotion", async () => {
  const { hooks: h, state } = hooks({
    status: " M src/x7B88_evidence_report.myc.md",
    wtOut: "NEW",
    main: "OLD",
  });
  let checks = 0;
  h.mainPathContained = () => Promise.resolve(++checks === 1);
  const r = await execute(input, h);
  assert(!r.promoted);
  assert(r.reason.includes("containment changed"));
  assertEquals(state.main, "OLD");
});
