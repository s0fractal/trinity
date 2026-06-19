import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type ActionIntent,
  authorityRoot,
  intentCommitment,
} from "./x5E10_warrant.ts";

const prop = (id: string, state: string, detail = ""): {
  kind: string;
  id: string;
  state: string;
  detail: string;
} => ({ kind: "proposal", id, state, detail });

Deno.test("warrant — a final:implemented proposal grants authority", () => {
  const v = authorityRoot("h.abc123", [
    prop(
      "h.abc123.proposal.my",
      "implemented",
      "final: implemented — class quorum human:1/1, model:1/1 satisfied (principals: claude, s0fractal)",
    ),
  ]);
  assert(v.authorized);
  assertEquals(v.readiness, "pass");
  assertEquals(v.authority?.principals, ["claude", "s0fractal"]);
});

Deno.test("warrant — fail closed: a non-final proposal grants NO authority", () => {
  for (const state of ["proposed", "resolution_claimed", "evidence_verified"]) {
    const v = authorityRoot("h.abc123", [prop("h.abc123.proposal.my", state)]);
    assert(!v.authorized, `${state} must not authorize`);
  }
  // evidence_verified is `stale` (one signature short), not a hard fail
  assertEquals(
    authorityRoot("h.x", [prop("h.x.proposal", "evidence_verified")]).readiness,
    "stale",
  );
});

Deno.test("warrant — fail closed: a conflicted proposal is a hard fail", () => {
  const v = authorityRoot("h.abc123", [
    prop("h.abc123.proposal.my", "conflicted"),
  ]);
  assert(!v.authorized);
  assertEquals(v.readiness, "fail");
});

Deno.test("warrant — fail closed: a missing proposal grants no authority", () => {
  const v = authorityRoot("h.nope", [prop("h.other.proposal", "implemented")]);
  assert(!v.authorized);
  assertEquals(v.readiness, "not_applicable");
});

Deno.test("warrant — intent commitment is deterministic and order-independent", async () => {
  const a: ActionIntent = {
    verb: "apply",
    target_substrate: "myc",
    args_commitment: "c1",
    input_commitments: ["a", "b"],
    requested_effects: ["write", "receipt"],
  };
  const b: ActionIntent = {
    ...a,
    input_commitments: ["b", "a"],
    requested_effects: ["receipt", "write"],
  };
  assertEquals(await intentCommitment(a), await intentCommitment(b));
  // different args ⇒ different commitment (cannot reuse)
  assert(
    await intentCommitment(a) !==
      await intentCommitment({ ...a, args_commitment: "c2" }),
  );
});
