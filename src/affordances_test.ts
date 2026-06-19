import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { affordances } from "./x5B00_affordances.ts";

Deno.test("affordances — the proof-bearing loop is the stable 6-step contract", async () => {
  const a = await affordances();
  assertEquals(a.proof_bearing_loop.length, 6);
  // the loop names the non-negotiables: independent quorum + evidence-resolves
  const text = JSON.stringify(a.proof_bearing_loop);
  assert(/one voice is not a quorum/.test(text));
  assert(/presence is never proof/.test(text));
});

Deno.test("affordances — finality policies include the human-model class quorum", async () => {
  const a = await affordances();
  assert(a.finality_policies.trinity.includes("distinct"));
  assert(
    a.finality_policies["finality_policy.classes"].note.includes("human"),
  );
});

Deno.test("affordances — proof-bearing verbs are flagged; undocumented is honest", async () => {
  const a = await affordances();
  // when the myc surface is present, propose/resolve-proposal must be proof-bearing
  const propose = a.actions.find((x) => x.verb === "propose");
  if (propose) {
    assert(propose.proof_bearing);
    assert(!!propose.produces);
    // a flagged-undocumented verb must be effect-class without annotation
    for (const v of a.undocumented) {
      const act = a.actions.find((x) => x.verb === v)!;
      assertEquals(act.class, "effect");
      assertEquals(act.proof_bearing, false);
    }
  }
});
