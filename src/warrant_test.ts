import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  actionBoundAuthority,
  type ActionIntent,
  canonicalIntentBytes,
  intentCommitment,
  type ProposalDescriptor,
} from "./x5E10_warrant.ts";

const desc = (over: Partial<ProposalDescriptor> = {}): ProposalDescriptor => ({
  fqdn: "h.aaaa.proposal.myc.md",
  commitment: "c0ffee",
  ...over,
});

const IC = "deadbeef"; // a stand-in intent commitment

const VECTOR_INTENT = {
  verb: "apply",
  target_substrate: "myc" as const,
  args_commitment: "c1",
  input_commitments: ["a", "b"],
  requested_effects: ["receipt", "write"],
};

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

Deno.test("warrant — pending_quorum is readiness 'pending', not 'stale' (codex P0.5)", () => {
  const g = {
    fqdn: "h.aaaa.proposal.myc.md",
    commitment: "c",
    action_grant: { intent_commitment: "deadbeef" },
  };
  const v = actionBoundAuthority("deadbeef", g, "evidence_verified");
  assertEquals(v.reason_code, "pending_quorum");
  assertEquals(v.readiness, "pending"); // evidence is current, just a signature short — never 'stale'
  assert(!v.authorized);
});

Deno.test("warrant — intent commitment matches the SHARED cross-substrate vector (parity with MYC x5820)", async () => {
  // Trinity x5E10 and MYC x5820 vendor the same algorithm; this pins both to one
  // value. If this fails but MYC's x5820 vector test passes (or vice versa), the
  // two implementations have drifted and must be reconciled.
  const commitment = await intentCommitment({
    verb: "apply",
    target_substrate: "myc",
    args_commitment: "c1",
    input_commitments: ["a", "b"],
    requested_effects: ["receipt", "write"],
  });
  assertEquals(
    commitment,
    "ccc26b8b460fe2debf0ad069d55ec170a78b7b70861f1f54c03e401e4576c3be",
  );
});

// ADOPTION checks (RFC-0003 Part 01 5.1, Tranche A3). The commitment now runs
// over CNP-0-JCS canonical bytes; these guard what that must mean at the
// authority boundary rather than at the encoder.
Deno.test("warrant - the superseded digest is an intent_mismatch, not a near miss", () => {
  // A grant minted under the pre-adoption algorithm must not authorize the same
  // intent. There is no dual-hash path, so this is the shape a stale grant takes
  // when it reaches the gate: denied, with a reason an actor can act on.
  const SUPERSEDED =
    "d02d75adca7e0dbbd10244c7ea1e9aeafa7b6d019a0f570bcad471a38d997552";
  const CURRENT =
    "ccc26b8b460fe2debf0ad069d55ec170a78b7b70861f1f54c03e401e4576c3be";
  const v = actionBoundAuthority(CURRENT, {
    fqdn: "h.deadbeef0000.proposal.myc.md",
    commitment: "deadbeef0000",
    action_grant: { intent_commitment: SUPERSEDED },
  }, "implemented");
  assertEquals(v.authorized, false);
  assertEquals(v.reason_code, "intent_mismatch");
});

Deno.test("warrant - the canonical bytes pass the ratified verifier-only path", async () => {
  // The bytes this commitment hashes must be canonical under the encoding that
  // was ratified, judged by the path that CANNOT repair what it reads. Asserting
  // this against our own encoder would only say the encoder agrees with itself.
  const { verifyRaw } = await import(
    "../probes/cnp-0-seed-v0/ts/reject.ts"
  );
  const bytes = canonicalIntentBytes(VECTOR_INTENT);
  const out = await verifyRaw(bytes);
  assertEquals(
    out.ok,
    true,
    "the verifier-only path rejected our canonical bytes: " +
      (out.ok ? "" : out.rejection + " - " + out.detail),
  );

  // And it is discriminating: a non-canonical spelling of the same value is
  // rejected, so the pass above is not vacuous.
  const reordered = new TextEncoder().encode(
    '{"verb":"apply","args_commitment":"c1","canonical_encoding":"hsp-jcs@v0",' +
      '"input_commitments":["a","b"],"numeric_profile":"cnp-0",' +
      '"requested_effects":["receipt","write"],"target_substrate":"myc"}',
  );
  const bad = await verifyRaw(reordered);
  assertEquals(bad.ok, false, "member order was not enforced");
});
