import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildReport,
  coordOf,
  type Edge,
  gravityLaw,
} from "./x6020_gravity.ts";

Deno.test("gravityLaw - states the law and points to where archetypes/denies/enforcement live", () => {
  const l = gravityLaw();
  assert(l.law.includes("HIGHER bucket"));
  assert(l.rules.some((r) => r.includes("callT"))); // the composition escape hatch
  assert(l.rules.some((r) => r.toLowerCase().includes("librar"))); // the lib exemption
  assert(l.enforced_by.includes("audit"));
  assert(l.archetypes.includes("coordinates"));
  assert(l.hard_denies.includes("skill"));
});

// Pure-function coverage for x6020_gravity (the edge-tension / AST-import report
// the resolver's imports-edge parity check depends on). buildEdges itself spawns
// `deno info` and is not unit-tested here — these cover the deterministic core.

Deno.test("coordOf - extracts the 4-hex bucket coordinate, uppercased; null for non-organs", () => {
  assertEquals(coordOf("x6020_gravity.ts"), "6020");
  assertEquals(coordOf("xa0b1_foo.ts"), "A0B1"); // uppercased
  assertEquals(coordOf("x0030_compose.ts"), "0030");
  assertEquals(coordOf("README.md"), null);
  assertEquals(coordOf("not_an_organ.txt"), null);
  assertEquals(coordOf("x12_too_short.ts"), null); // needs exactly 4 hex
});

const edge = (
  source: string,
  target: string,
  delta_primary: number,
  delta_hamming: number,
  target_is_library: boolean,
): Edge => ({
  source,
  target,
  source_file: `x${source}_a.ts`,
  target_file: `./x${target}_b.ts`,
  delta_primary,
  delta_hamming,
  target_is_library,
});

Deno.test("buildReport - empty edge set yields zeroed summary and empty heatmap", () => {
  const r = buildReport([]);
  assertEquals(r.type, "gravity");
  assertEquals(r.total_edges, 0);
  assertEquals(r.mean_delta_primary, 0);
  assertEquals(r.max_delta_primary, 0);
  assertEquals(r.summary.library_edges, 0);
  assertEquals(r.heatmap, {});
});

Deno.test("buildReport - summary, tension sort, library split, and first-digit heatmap", () => {
  const edges = [
    edge("6020", "0030", 6, 2, true),
    edge("2200", "0030", 2, 2, true),
    edge("7700", "6020", 1, 3, false),
  ];
  const r = buildReport(edges);
  assertEquals(r.total_edges, 3);
  assertEquals(r.mean_delta_primary, 3); // (6+2+1)/3, rounded to 3dp
  assertEquals(r.max_delta_primary, 6);
  assertEquals(r.summary.library_edges, 2);
  assertEquals(r.summary.non_library_edges, 1);
  // edges_by_tension: descending delta_primary
  assertEquals(r.edges_by_tension.map((e) => e.delta_primary), [6, 2, 1]);
  // heatmap buckets by the FIRST coordinate digit of source → target
  assertEquals(r.heatmap, {
    "6": { "0": 1 },
    "2": { "0": 1 },
    "7": { "6": 1 },
  });
});

Deno.test("buildReport - tension sort breaks ties by delta_hamming", () => {
  const edges = [
    edge("1000", "2000", 2, 1, false),
    edge("3000", "4000", 2, 4, false), // same dp, higher dh → ranks first
  ];
  const r = buildReport(edges);
  assertEquals(r.edges_by_tension.map((e) => e.delta_hamming), [4, 1]);
  assert(r.mean_delta_primary === 2);
});
