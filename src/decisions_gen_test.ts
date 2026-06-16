import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  blockHeightToISO,
  daysSinceTimestamp,
  timestampFromFilename,
  triageProposal,
} from "./x8B00_decisions_gen.ts";

// Coverage for the decisions ledger's pure governance logic — the risk→stance
// classifier and timestamp resolution that feed the `next action` signal
// (consumed by roadmap/recommend). The CI diff-gate catches projection drift,
// not a wrong classifier; these guard correctness.

Deno.test("blockHeightToISO - anchors at block 950000 and advances 1 day / 144 blocks", () => {
  // anchor block maps to its epoch (950000 @ 1779148800s)
  assertEquals(
    blockHeightToISO(950000),
    new Date(1779148800 * 1000).toISOString(),
  );
  // 144 blocks × 600s = 86400s = exactly one day later
  const a = Date.parse(blockHeightToISO(950000));
  const b = Date.parse(blockHeightToISO(950144));
  assertEquals(b - a, 86_400_000);
});

Deno.test("timestampFromFilename - resolves ISO / legacy / topological / hex-block forms", () => {
  assertEquals(
    timestampFromFilename("2026-06-16T130000Z-claude-foo.md"),
    "2026-06-16T13:00:00Z",
  );
  assertEquals(
    timestampFromFilename("20260616-130000-claude-foo.md"),
    "2026-06-16T13:00:00Z",
  );
  assertEquals(
    timestampFromFilename("x7700_t20260616130000_claude_foo.myc.md"),
    "2026-06-16T13:00:00Z",
  );
  // hex-block name falls back to block→time conversion
  assertEquals(
    timestampFromFilename("x7700_953952_claude_foo.myc.md"),
    blockHeightToISO(953952),
  );
  // no time signal in the name
  assertEquals(timestampFromFilename("x2F30_fqdn_resolver.ts"), null);
});

Deno.test("daysSinceTimestamp - explicit now, invalid → null, future → clamped to 0", () => {
  const now = Date.parse("2026-06-16T00:00:00Z");
  assertEquals(daysSinceTimestamp("2026-06-02T00:00:00Z", now), 14);
  assertEquals(daysSinceTimestamp("2026-06-15T12:00:00Z", now), 0);
  assertEquals(daysSinceTimestamp("2026-07-01T00:00:00Z", now), 0); // future clamped
  assertEquals(daysSinceTimestamp("not a date", now), null);
});

// triageProposal: keep date-dependent branches hermetic — an empty timestamp is
// never stale, an ancient one is always stale, regardless of when the test runs.
const proposal = (over: Record<string, unknown> = {}) => ({
  category: "proposal" as const,
  is_unresolved: true,
  filename: "x4d00_953000_claude_some-proposal.myc.md",
  title: "some proposal",
  timestamp: "", // unparseable → never contributes a stale risk
  has_falsifier: true,
  has_suggested_commands: true,
  ...over,
});

Deno.test("triageProposal - only fires on unresolved proposals", () => {
  assertEquals(triageProposal(proposal({ category: "receipt" })), null);
  assertEquals(triageProposal(proposal({ is_unresolved: false })), null);
});

Deno.test("triageProposal - well-shaped recent proposal is a candidate", () => {
  const t = triageProposal(proposal())!;
  assertEquals(t.stance, "candidate");
  assertEquals(t.risks, []);
});

Deno.test("triageProposal - missing falsifier/commands → revalidate", () => {
  const t = triageProposal(
    proposal({ has_falsifier: false, has_suggested_commands: false }),
  )!;
  assertEquals(t.stance, "revalidate");
  assert(t.risks.includes("missing_falsifier"));
  assert(t.risks.includes("missing_suggested_commands"));
});

Deno.test("triageProposal - ancient proposal is stale → revalidate", () => {
  const t = triageProposal(proposal({ timestamp: "2000-01-01T00:00:00Z" }))!;
  assertEquals(t.stance, "revalidate");
  assert(t.risks.some((r) => r.startsWith("stale_")));
});

Deno.test("triageProposal - destructive/topology keyword → review (overrides)", () => {
  const t = triageProposal(
    proposal({ title: "codeicide the scattered overlay" }),
  )!;
  assertEquals(t.stance, "review");
  assert(t.risks.includes("topology_or_destructive_risk"));
});
