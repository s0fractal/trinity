import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  actionBoundAuthority,
  type ActionIntent,
  intentCommitment,
  type ProposalDescriptor,
} from "./x5E10_warrant.ts";

const desc = (over: Partial<ProposalDescriptor> = {}): ProposalDescriptor => ({
  fqdn: "h.aaaa.proposal.myc.md",
  commitment: "c0ffee",
  ...over,
});

const IC = "deadbeef"; // a stand-in intent commitment

Deno.test("warrant — terminal state is NOT a capability: final without action_grant is denied", () => {
  // codex acceptance #1: a ratified governance proposal (no action_grant) grants
  // NO actuation authority, even though it is final:implemented.
  const v = actionBoundAuthority(IC, desc(), "implemented");
  assert(!v.authorized);
  assertEquals(v.reason_code, "missing_action_grant");
});

Deno.test("warrant — final proposal committing the EXACT intent is admitted", () => {
  // codex acceptance #2
  const v = actionBoundAuthority(
    IC,
    desc({ action_grant: { intent_commitment: IC } }),
    "implemented",
  );
  assert(v.authorized);
  assertEquals(v.reason_code, "action_authorized");
  assertEquals(v.bound?.intent_commitment, IC);
});

Deno.test("warrant — action_grant for a DIFFERENT intent is denied (intent_mismatch)", () => {
  const v = actionBoundAuthority(
    IC,
    desc({ action_grant: { intent_commitment: "other" } }),
    "implemented",
  );
  assert(!v.authorized);
  assertEquals(v.reason_code, "intent_mismatch");
});

Deno.test("warrant — fail closed with distinct reason codes for every non-final state", () => {
  const g = desc({ action_grant: { intent_commitment: IC } });
  assertEquals(
    actionBoundAuthority(IC, g, "evidence_verified").reason_code,
    "pending_quorum",
  );
  assertEquals(
    actionBoundAuthority(IC, g, "proposed").reason_code,
    "not_final",
  );
  assertEquals(
    actionBoundAuthority(IC, g, "conflicted").reason_code,
    "conflict",
  );
  assertEquals(
    actionBoundAuthority(IC, null, "implemented").reason_code,
    "no_proposal",
  );
  // none of them authorize
  for (const s of ["evidence_verified", "proposed", "conflicted", null]) {
    assert(!actionBoundAuthority(IC, s === null ? null : g, s).authorized);
  }
});

Deno.test("warrant — intent identity preserves input order, treats effects as a set", async () => {
  const base: ActionIntent = {
    verb: "apply",
    target_substrate: "myc",
    args_commitment: "c1",
    input_commitments: ["a", "b"],
    requested_effects: ["write", "receipt"],
  };
  // effects are a set: reordering does NOT change identity
  assertEquals(
    await intentCommitment(base),
    await intentCommitment({
      ...base,
      requested_effects: ["receipt", "write"],
    }),
  );
  // input order IS significant (codex §5): [a,b] != [b,a]
  assert(
    await intentCommitment(base) !==
      await intentCommitment({ ...base, input_commitments: ["b", "a"] }),
  );
});
