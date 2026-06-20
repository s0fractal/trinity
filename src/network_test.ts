import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { networkResolverArgs, renderNetwork } from "./x8700_network.ts";

const atlas = {
  total_nodes: 1743,
  members: [
    { member: "trinity", nodes: 720, chords: 479 },
    { member: "liquid", nodes: 673, chords: 0 },
  ],
  by_kind: { organ: 555, chord: 479, doc: 468 },
  top_cited: [{ stem: "x2F30_fqdn_resolver", in: 20 }],
  recent: [],
  recent_total: 479,
  index: { source_hash: "deadbeef" },
};
const lineage = {
  total_closed: 41,
  total_receipts: 65,
  arcs: [
    {
      proposal: "x5d00_953682_codex_effect-court",
      resolved: true,
      proposal_voice: "codex",
      depth: 7,
      span_blocks: 116,
      voices: ["claude-opus-4-8"],
    },
    {
      proposal: "fqdn-resolver-v0",
      resolved: false,
      proposal_voice: null,
      depth: 2,
      span_blocks: null,
      voices: ["claude", "antigravity"],
    },
  ],
};

Deno.test("renderNetwork - composes atlas shape + lineage becoming into markdown", () => {
  const md = renderNetwork(atlas, lineage, {
    generated_at: null,
    manifest_hash: "sha256:deadbeef",
  });
  assertStringIncludes(md, "# The FQDN network");
  assertStringIncludes(md, "1743 nodes across 2 substrates");
  // substrate table
  assertStringIncludes(md, "| trinity | 720 | 479 |");
  // most-cited
  assertStringIncludes(md, "`x2F30_fqdn_resolver` — cited 20×");
  // lineage arc with depth + span + proposer
  assertStringIncludes(md, "7 phases, ~116 blocks; closed by claude-opus-4-8");
  // unresolved proposal flagged logical
  assertStringIncludes(md, "*(logical)*");
  // the doorways
  assertStringIncludes(md, "t resolve-fqdn atlas");
});

Deno.test("renderNetwork - --stable omits the generated_at stamp (byte-deterministic)", () => {
  const stable = renderNetwork(atlas, lineage, {
    generated_at: null,
    manifest_hash: "sha256:deadbeef",
  });
  const stamped = renderNetwork(atlas, lineage, {
    generated_at: "2026-06-17T00:00:00.000Z",
    manifest_hash: "sha256:deadbeef",
  });
  assert(!stable.includes("generated_at"));
  assertStringIncludes(stamped, "generated_at: 2026-06-17");
  // the manifest hash is always pinned (it is the freshness key)
  assertStringIncludes(stable, "source_manifest_hash: sha256:deadbeef");
  // stable output is identical across calls (no wall-clock, no randomness)
  assertEquals(
    stable,
    renderNetwork(atlas, lineage, {
      generated_at: null,
      manifest_hash: "sha256:deadbeef",
    }),
  );
});

Deno.test("network --stable bypasses machine-local resolver cache", () => {
  assertEquals(networkResolverArgs(true, "atlas"), [
    "resolve-fqdn",
    "atlas",
    "--no-cache",
    "--json",
  ]);
  assert(!networkResolverArgs(false, "lineage").includes("--no-cache"));
});
