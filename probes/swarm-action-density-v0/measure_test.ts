import { assert, assertEquals } from "jsr:@std/assert@^1";
import { classify, measure } from "./measure.ts";

Deno.test("classify — a world artifact is action, a chord-only commit is talk", () => {
  assertEquals(classify(["src/x4001_chord.ts"]), "action");
  assertEquals(classify(["contracts/VOICE_TICK_READ_PROPOSE.v0.draft.md"]), "action");
  assertEquals(classify(["packages/autonomy-kernel/mod.ts"]), "action");
  assertEquals(classify(["src/x3300_955329_claude_topic.myc.md"]), "talk");
  // A mixed commit (code + its chord) counts as action — work was done.
  assertEquals(classify(["src/foo.ts", "src/x3300_1_claude_t.myc.md"]), "action");
});

Deno.test("classify — projections/pins/locks are housekeeping, not talk", () => {
  assertEquals(classify(["src/x8788_network.myc.md"]), "housekeeping");
  assertEquals(classify(["src/x2B88_decisions.myc.md", "deno.lock"]), "housekeeping");
  assertEquals(classify(["x9000/MANIFEST.myc.ndjson"]), "housekeeping");
});

Deno.test("measure — shape holds and density is a fraction", async () => {
  const r = await measure(20);
  assert(r.density >= 0 && r.density <= 1, "density must be in [0,1]");
  assertEquals(r.action + r.talk + r.housekeeping, r.window);
  assert(["idle", "doing", "thinning", "over-discussing"].includes(r.verdict));
});
