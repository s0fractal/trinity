import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildGraph, insights, renderHtml } from "./x8740_map.ts";

Deno.test("buildGraph - draws supersession lineage (kind:proposal evidence)", () => {
  const g = buildGraph(
    [],
    [
      {
        name: "h.old.proposal.myc.md",
        content:
          '---\n---\n```json myc\n{"fqdn":"h.old.proposal.myc.md","commitment":{"value":"old1"},"body":{"proposal":"v1"}}\n```\n',
      },
      {
        name: "h.new.proposal.myc.md",
        content:
          '---\n---\n```json myc\n{"fqdn":"h.new.proposal.myc.md","commitment":{"value":"new1"},"body":{"proposal":"v2"}}\n```\n',
      },
    ],
    [{
      name: "h.r.resolution.myc.md",
      content:
        '---\n---\n```json myc\n{"body":{"outcome":"superseded","proposal_commitment":"old1","evidence_refs":[{"kind":"proposal","ref":"h.new.proposal.myc.md"}]}}\n```\n',
    }],
  );
  // old proposal is terminal, and points at its successor (lineage edge)
  const old = g.ledger.find((n) =>
    (n.id as string) === "P|h.old.proposal.myc.md"
  )!;
  assertEquals(old.state, "terminal");
  assert(g.semantic.some((e) =>
    e.source === "P|h.old.proposal.myc.md" &&
    e.target === "P|h.new.proposal.myc.md"
  ));
  // insights renders a governance section over this graph
  const text = insights(g);
  assert(text.includes("governance"));
  assert(text.includes("proposals"));
});

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
  assertEquals(g.ledger.length, 0);
  // the root group node is always present
  assertEquals(g.groups.length, 1);
  assertEquals(g.groups[0].id, "^root");
});

Deno.test("buildGraph - weaves the MYC ledger: proposal node, derived state, cross-links", () => {
  const g = buildGraph(
    [
      {
        name: "x5300_954749_claude_ratify.myc.md",
        content:
          "---\ntopic: ratify\nreferences:\n  - public/proposals/h.abc123.proposal.myc.md\n---\nb",
      },
      {
        name: "x5700_954397_claude_evidence.myc.md",
        content: "---\ntopic: evidence\n---\nb",
      },
    ],
    [{
      name: "h.abc123.proposal.myc.md",
      content:
        '---\n---\n```json myc\n{"fqdn":"h.abc123.proposal.myc.md","commitment":{"value":"abc123"},"body":{"proposal":"a rule"}}\n```\n',
    }],
    [{
      name: "h.def.resolution.myc.md",
      content:
        '---\n---\n```json myc\n{"body":{"outcome":"implemented","proposal_commitment":"abc123","evidence_refs":[{"kind":"chord","ref":"x5700_954397_claude_evidence"}]}}\n```\n',
    }],
  );

  // the proposal becomes a ledger node, state derived from its resolution
  const prop = g.ledger.find((n) =>
    (n.id as string) === "P|h.abc123.proposal.myc.md"
  )!;
  assert(prop, "proposal node exists");
  assertEquals(prop.state, "implemented");

  // cross-links both ways: chord cites the proposal, proposal points at its evidence
  assert(
    g.semantic.some((e) =>
      e.source.startsWith("x5300") && e.target === "P|h.abc123.proposal.myc.md"
    ),
  );
  assert(
    g.semantic.some((e) =>
      e.source === "P|h.abc123.proposal.myc.md" && e.target.startsWith("x5700")
    ),
  );
});

Deno.test("renderHtml - the generated in-page script is syntactically valid JS (no template-escaping breakage)", () => {
  // Regression for antigravity x3d00_956685: a Ukrainian apostrophe written as \'
  // inside the renderHtml backtick template collapsed to a bare ' in a single-quoted
  // JS string, breaking the WHOLE <script> parse — invisible to buildGraph tests.
  // Feed data that exercises the string-building paths (apostrophes, quotes, unicode).
  const g = buildGraph([
    {
      name: "x3d00_956685_antigravity_mycelium-map.myc.md",
      content:
        '---\nvoice: "antigravity"\ntopic: зв\'язки та "лапки"\ncontent_sig:\n  sig: "x"\n---\nbody',
    },
    {
      name: "x0001_955000_claude_plain.myc.md",
      content: '---\nvoice: "claude"\ntopic: plain\n---\nbody',
    },
  ]);
  const html = renderHtml(g);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).filter((s) => s.includes("ForceGraph3D"));
  const app = scripts[scripts.length - 1];
  assert(app, "the app <script> block must be present in the generated HTML");
  // new Function parses the full body — throws on any syntax/escaping error.
  new Function(app);
});
