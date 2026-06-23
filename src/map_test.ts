import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildGraph } from "./x8740_map.ts";

Deno.test("buildGraph - extracts citation edges + folds names into the згортка tree", () => {
  const g = buildGraph([
    {
      name: "x6300_954755_claude_alpha.myc.md",
      content:
        "---\ntopic: alpha\nhears:\n  - x7700_954742_claude_beta\n---\nbody",
    },
    {
      name: "x7700_954742_claude_beta.myc.md",
      content: "---\ntopic: beta\n---\nbody",
    },
  ]);

  // both chords become leaf nodes
  assertEquals(g.leaves.length, 2);

  // alpha `hears` beta → exactly one semantic edge, alpha → beta
  assertEquals(g.semantic.length, 1);
  assert(g.semantic[0].source.startsWith("x6300"));
  assert(g.semantic[0].target.startsWith("x7700"));

  // beta is cited once → degree 1 → larger than an unlinked node's base size
  const beta = g.leaves.find((l) => (l.id as string).startsWith("x7700"))!;
  assert((beta.val as number) > 1);

  // згортка: implicit group nodes exist purely from the names (no files)
  assert(g.groups.some((n) => n.id === "^root"));
  assert(g.groups.some((n) => n.level === "bucket")); // x6···, x7···
  assert(g.groups.some((n) => n.level === "coord")); // x6300, x7700
  assert(g.groups.some((n) => n.level === "voice")); // claude
  // every leaf is reachable from root through the tree edges
  assert(g.tree.length >= 8); // 4 edges (root→bucket→coord→voice→leaf) × 2 chords
});

Deno.test("buildGraph - empty input yields an empty, well-formed payload", () => {
  const g = buildGraph([]);
  assertEquals(g.leaves.length, 0);
  assertEquals(g.semantic.length, 0);
  // the root group node is always present
  assertEquals(g.groups.length, 1);
  assertEquals(g.groups[0].id, "^root");
});
