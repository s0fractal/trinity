import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  diffEcosystem,
  readSlot,
  SavedEcosystemState,
  SubstrateMirror,
} from "./x2200_ecosystem.ts";

Deno.test("ecosystem - diffEcosystem slot added and updated", () => {
  const prev: SavedEcosystemState = {
    omega: {
      abi_coverage: "5/6",
      slots: {
        status: { present: true, summary: "healthy" },
        capabilities: { present: true, summary: "active" },
        audit: { present: true, summary: "healthy" },
        roadmap: { present: true, summary: "2 signals" },
        probes: { present: true, summary: "3 signals" },
        ecosystem: { present: false },
      },
    },
    liquid: {
      abi_coverage: "4/6",
      slots: {
        status: { present: true, summary: "healthy" },
        capabilities: { present: true, summary: "active" },
        audit: { present: false },
        roadmap: { present: true, summary: "2 signals" },
        probes: { present: true, summary: "3 signals" },
        ecosystem: { present: false },
      },
    },
    myc: {
      abi_coverage: "5/6",
      slots: {
        status: { present: true, summary: "healthy" },
        capabilities: { present: true, summary: "active" },
        audit: { present: true, summary: "ok" },
        roadmap: { present: true, summary: "3 signals" },
        probes: { present: true, summary: "3 signals" },
        ecosystem: { present: false },
      },
    },
  };

  const current: Record<string, SubstrateMirror> = {
    omega: {
      substrate: "omega",
      abi_coverage: "5/6",
      slots: {
        status: { present: true, summary: "healthy" },
        capabilities: { present: true, summary: "active" },
        audit: { present: true, summary: "healthy" },
        roadmap: { present: true, summary: "2 signals" },
        probes: { present: true, summary: "3 signals" },
        ecosystem: { present: false },
      },
    },
    liquid: {
      substrate: "liquid",
      abi_coverage: "5/6",
      slots: {
        status: { present: true, summary: "healthy" },
        capabilities: { present: true, summary: "active" },
        audit: { present: true, summary: "healthy" }, // restored!
        roadmap: { present: true, summary: "2 signals" },
        probes: { present: true, summary: "3 signals" },
        ecosystem: { present: false },
      },
    },
    myc: {
      substrate: "myc",
      abi_coverage: "6/6",
      slots: {
        status: { present: true, summary: "healthy" },
        capabilities: { present: true, summary: "active" },
        audit: { present: true, summary: "ok" },
        roadmap: { present: true, summary: "3 signals" },
        probes: { present: true, summary: "3 signals" },
        ecosystem: {
          present: true,
          summary: "2 nested substrates: sub-1; sub-2",
          mirrors: {
            "sub-1": { abi_coverage: "5/6" },
            "sub-2": { abi_coverage: "6/6" },
          },
        },
      },
    },
  };

  const diffs = diffEcosystem(prev, current);
  assertEquals(diffs.length, 4);
  assertEquals(diffs[0].substrate, "liquid");
  assert(diffs[0].message.includes("ABI coverage changed"));
  assertEquals(diffs[1].substrate, "liquid");
  assert(diffs[1].message.includes("slot audit: added"));
  assertEquals(diffs[2].substrate, "myc");
  assert(diffs[2].message.includes("ABI coverage changed"));
  assertEquals(diffs[3].substrate, "myc");
  assert(diffs[3].message.includes("slot ecosystem: added (2 nested substrates"));
});

Deno.test("ecosystem - readSlot fallback JSON direct reading", async () => {
  // Write a mock JSON file to simulate nested ecosystem output
  const mockPath = join(Deno.cwd(), "src", "x2288_ecosystem.latest.mock.json");
  const mockData = {
    mirrors: {
      "nested-sub-1": {
        abi_coverage: "5/6",
        slots: {
          status: { present: true, summary: "healthy" },
        },
      },
      "nested-sub-2": {
        abi_coverage: "6/6",
        slots: {
          status: { present: true, summary: "healthy" },
        },
      },
    },
  };

  await Deno.writeTextFile(mockPath, JSON.stringify(mockData));

  try {
    const text = await Deno.readTextFile(mockPath);
    const data = JSON.parse(text);
    const nestedMirrors = data.mirrors;

    assertEquals(Object.keys(nestedMirrors).length, 2);
    assertEquals(nestedMirrors["nested-sub-1"].abi_coverage, "5/6");
    assertEquals(nestedMirrors["nested-sub-2"].abi_coverage, "6/6");
  } finally {
    await Deno.remove(mockPath);
  }
});
