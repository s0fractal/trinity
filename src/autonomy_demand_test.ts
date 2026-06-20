import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { demand, type DemandHooks } from "./x5C80_autonomy_demand.ts";
import type { Adapter } from "./x5C70_autonomy_attenuation.ts";

const ADAPTERS: Adapter[] = [
  {
    target: "x7B88_evidence_report",
    organ: "src/x7B00_evidence.ts",
    argv: ["gen1"],
    output_path: "src/x7B88_evidence_report.myc.md",
  },
  {
    target: "x8788_network",
    organ: "src/x8700_network.ts",
    argv: ["gen2"],
    output_path: "src/x8788_network.myc.md",
  },
];

function hooks(
  opts: {
    regen: Record<string, string>;
    main: Record<string, string>;
    genFail?: string;
  },
): DemandHooks {
  return {
    run: (cmd) => {
      if (cmd[0] === "git" || cmd[0] === "deno") {
        return Promise.resolve({ code: 0, out: "", err: "" });
      }
      const argv0 = cmd[0];
      if (opts.genFail && argv0 === opts.genFail) {
        return Promise.resolve({ code: 1, out: "", err: "boom" });
      }
      return Promise.resolve({ code: 0, out: "", err: "" });
    },
    readWorktree: (_wt, rel) => Promise.resolve(opts.regen[rel] ?? null),
    readMain: (rel) => Promise.resolve(opts.main[rel] ?? null),
  };
}

Deno.test("demand — all projections current ⇒ no demand", async () => {
  const r = await demand(
    ADAPTERS,
    hooks({
      regen: {
        "src/x7B88_evidence_report.myc.md": "A",
        "src/x8788_network.myc.md": "B",
      },
      main: {
        "src/x7B88_evidence_report.myc.md": "A",
        "src/x8788_network.myc.md": "B",
      },
    }),
  );
  assertEquals(r.demand, false);
  assertEquals(r.current, 2);
  assertEquals(r.stale, 0);
});

Deno.test("demand — a divergent regeneration is PROVEN stale ⇒ demand", async () => {
  const r = await demand(
    ADAPTERS,
    hooks({
      regen: {
        "src/x7B88_evidence_report.myc.md": "A",
        "src/x8788_network.myc.md": "CHANGED",
      },
      main: {
        "src/x7B88_evidence_report.myc.md": "A",
        "src/x8788_network.myc.md": "B",
      },
    }),
  );
  assertEquals(r.demand, true);
  assertEquals(r.stale, 1);
  assertEquals(
    r.projections.find((p) => p.target === "x8788_network")?.state,
    "stale",
  );
});

Deno.test("demand — RED TEAM: a generator failure is `unknown`, never `current`", async () => {
  const r = await demand(
    ADAPTERS,
    hooks({
      regen: { "src/x7B88_evidence_report.myc.md": "A" },
      main: {
        "src/x7B88_evidence_report.myc.md": "A",
        "src/x8788_network.myc.md": "B",
      },
      genFail: "gen2",
    }),
  );
  assertEquals(r.unknown, 1);
  assertEquals(
    r.projections.find((p) => p.target === "x8788_network")?.state,
    "unknown",
  );
});
