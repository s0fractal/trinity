import { assert, assertEquals } from "jsr:@std/assert@^1";
import { loadGaps, verify } from "./verify.ts";

const SOURCES = new Set([
  "failing_gate",
  "stale_projection",
  "unresolved_critique",
  "external_consumer",
  "human_discomfort",
  "voice_review",
  "other",
]);
const STATUS = new Set(["open", "claimed", "closed", "refuted", "composted"]);

Deno.test("gap records — identity, valid source/status, and closed gaps carry runnable evidence", async () => {
  const gaps = await loadGaps();
  assert(gaps.length > 0, "expected at least one gap record");
  for (const g of gaps) {
    assert(g.gap_id, "gap_id required");
    assert(SOURCES.has(g.gap_source), `bad gap_source: ${g.gap_source}`);
    assert(STATUS.has(g.status), `bad status: ${g.status}`);
    if (g.status === "closed") {
      // codex's core demand: a closure is not a closure without runnable evidence + stated residual.
      assert(g.closure_check && g.closure_check.length > 0, `${g.gap_id}: closed gap needs a closure_check`);
      assert(g.residual_risk !== undefined, `${g.gap_id}: closed gap must state residual_risk`);
    }
  }
});

Deno.test("verify — report shape holds and stays non-authoritative (structural, no checks run)", async () => {
  const r = await verify(false); // --no-run: CI-safe, no heavy/cross-submodule checks
  assertEquals(r.type, "gap_closure_report");
  assertEquals(r.authoritative, false);
  assert(r.total >= r.closed);
});
