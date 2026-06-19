import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  anchorTrust,
  commitmentOf,
  delegationPermits,
  type KeyEvent,
  keyStateAt,
  resolveVerifiedKey,
  verifyChain,
} from "./x2B00_keytimeline.ts";

const blk = (height: number) => ({
  kind: "bitcoin_block" as const,
  height,
  inclusion_receipt: `proof://${height}`,
});

const options = (events: KeyEvent[], registryKey = "KEY0") => ({
  registryRoot: { claude: registryKey },
  verifySignature: (key: string, commitment: string, signature: string) =>
    signature === `${key}:${commitment}`,
  verifiedAnchorReceipts: new Set(
    events.flatMap((e) => [e.valid_from, e.valid_until, e.compromised_since])
      .filter((a) => a?.inclusion_receipt)
      .map((a) => a!.inclusion_receipt!),
  ),
});

/** Build an event with a correct content commitment. */
async function ev(p: Partial<KeyEvent>): Promise<KeyEvent> {
  const base: KeyEvent = {
    principal: "claude",
    event: "activate",
    signing_key: "KEY0",
    custodian: "architect-machine",
    issuer: "architect",
    sequence: 0,
    predecessor_commitment: null,
    valid_from: blk(954000),
    commitment: "",
    ...p,
  };
  base.commitment = await commitmentOf(base);
  return base;
}

/** Link a list of single-principal events into a chain (predecessor + sequence). */
async function chain(
  ...partials: Array<Partial<KeyEvent>>
): Promise<KeyEvent[]> {
  const out: KeyEvent[] = [];
  let activeKey = partials[0]?.signing_key ?? "KEY0";
  for (let i = 0; i < partials.length; i++) {
    const e = await ev({
      ...partials[i],
      sequence: i,
      predecessor_commitment: i === 0 ? null : out[i - 1].commitment,
    });
    if (i > 0) {
      e.authorization = {
        predecessor_signature: `${activeKey}:${e.commitment}`,
        ...((e.event === "rotate" || e.event === "delegate")
          ? { subject_signature: `${e.signing_key}:${e.commitment}` }
          : {}),
      };
    }
    out.push(e);
    if (e.event === "rotate") activeKey = e.signing_key;
  }
  return out;
}

Deno.test("keytimeline — a clean genesis-rooted chain verifies", async () => {
  const c = await chain(
    { event: "activate", signing_key: "KEY0", valid_from: blk(954000) },
    { event: "rotate", signing_key: "KEY1", valid_from: blk(955000) },
  );
  const v = await verifyChain(c, options(c));
  assert(v.valid, JSON.stringify(v.errors));
  assertEquals(v.suspended, []);
});

Deno.test("keytimeline — genesis signing_key must match the pinned registry root", async () => {
  const c = await chain({ event: "activate", signing_key: "WRONG" });
  const v = await verifyChain(c, options(c));
  assert(!v.valid);
  assert(v.errors.some((e) => /registry root/.test(e)));
});

Deno.test("keytimeline — a sequence gap is rejected", async () => {
  const a = await ev({ sequence: 0 });
  const b = await ev({
    sequence: 2,
    predecessor_commitment: a.commitment,
    event: "rotate",
    signing_key: "K1",
  });
  const v = await verifyChain([a, b], options([a, b]));
  assert(!v.valid);
  assert(v.errors.some((e) => /sequence gap/.test(e)));
});

Deno.test("keytimeline — a tampered event (commitment ∤ body) is caught", async () => {
  const c = await chain({ event: "activate", signing_key: "KEY0" });
  c[0].custodian = "attacker"; // mutate after commitment was computed
  const v = await verifyChain(c, options(c));
  assert(!v.valid);
  assert(v.errors.some((e) => /commitment does not bind/.test(e)));
});

Deno.test("keytimeline — a FORK suspends the principal (detects, does not choose)", async () => {
  const g = await ev({ sequence: 0, signing_key: "KEY0" });
  // two competing children at sequence 1 sharing the genesis predecessor
  const childA = await ev({
    sequence: 1,
    predecessor_commitment: g.commitment,
    event: "rotate",
    signing_key: "KA",
  });
  const childB = await ev({
    sequence: 1,
    predecessor_commitment: g.commitment,
    event: "rotate",
    signing_key: "KB",
  });
  const v = await verifyChain(
    [g, childA, childB],
    options([g, childA, childB]),
  );
  assert(!v.valid);
  assertEquals(v.suspended, ["claude"]);
  assertEquals(v.forks.length, 1);
  // a suspended principal has no usable key
  const st = keyStateAt(
    [g, childA, childB],
    "claude",
    blk(955000),
    v.suspended,
  );
  assert(st.suspended);
  assertEquals(st.trusted_now, false);
});

Deno.test("keytimeline — rotation preserves historical verification (reproducible after rotation)", async () => {
  const c = await chain(
    {
      event: "activate",
      signing_key: "KEY0",
      valid_from: blk(954000),
      valid_until: blk(955000),
    },
    { event: "rotate", signing_key: "KEY1", valid_from: blk(955000) },
  );
  // an OLD anchor still resolves to the OLD key — the rotation did not rewrite the past
  const old = keyStateAt(c, "claude", blk(954500));
  assertEquals(old.signing_key, "KEY0");
  assert(old.valid_at_signing && old.trusted_now);
  const now = keyStateAt(c, "claude", blk(955500));
  assertEquals(now.signing_key, "KEY1");
});

Deno.test("keytimeline — revoke with compromised_since withdraws trust retroactively, but valid_at_signing stays true", async () => {
  const c = await chain(
    { event: "activate", signing_key: "KEY0", valid_from: blk(954000) },
    {
      event: "revoke",
      signing_key: "KEY0",
      valid_from: blk(956000),
      compromised_since: blk(955000),
    },
  );
  // a signature anchored AFTER the compromise point: was valid then, not trusted now
  const st = keyStateAt(c, "claude", blk(955500));
  assertEquals(st.valid_at_signing, true);
  assertEquals(st.trusted_now, false);
  // a signature anchored BEFORE the compromise point keeps trust
  const before = keyStateAt(c, "claude", blk(954500));
  assertEquals(before.trusted_now, true);
});

Deno.test("keytimeline — delegation is scoped; no implicit 'all'", async () => {
  const d = await ev({
    event: "delegate",
    signing_key: "DKEY",
    delegate_of: "claude",
    scope: { action: ["resolve"], substrate: ["myc"] },
  });
  assert(delegationPermits(d, { action: "resolve", substrate: "myc" }));
  assert(!delegationPermits(d, { action: "publish", substrate: "myc" })); // action out of scope
  assert(!delegationPermits(d, { action: "resolve", substrate: "omega" })); // substrate out of scope
  // an empty/absent scope grants nothing
  const empty = await ev({
    event: "delegate",
    signing_key: "D2",
    scope: { action: [], substrate: [] },
  });
  assert(!delegationPermits(empty, { action: "resolve", substrate: "myc" }));
});

Deno.test("keytimeline — receipt presence is not proof", () => {
  assertEquals(
    anchorTrust({ kind: "bitcoin_block", height: 954000 }),
    "self_asserted",
  );
  assertEquals(
    anchorTrust({
      kind: "bitcoin_block",
      height: 954000,
      inclusion_receipt: "proof://…",
    }),
    "self_asserted",
  );
  assertEquals(
    anchorTrust(
      {
        kind: "bitcoin_block",
        height: 954000,
        inclusion_receipt: "proof://…",
      },
      new Set(["proof://…"]),
    ),
    "verifiable",
  );
});

Deno.test("keytimeline — valid_until is exclusive at the exact anchor", async () => {
  const c = await chain({
    event: "activate",
    signing_key: "KEY0",
    valid_from: blk(954000),
    valid_until: blk(955000),
  });
  const state = keyStateAt(c, "claude", blk(955000));
  assertEquals(state.valid_at_signing, false);
  assertEquals(state.signing_key, null);
});

Deno.test("keytimeline — a linked but unauthorised rotation is rejected", async () => {
  const c = await chain(
    { event: "activate", signing_key: "KEY0" },
    { event: "rotate", signing_key: "KEY1", valid_from: blk(955000) },
  );
  c[1].authorization!.predecessor_signature = `ATTACKER:${c[1].commitment}`;
  const verdict = await verifyChain(c, options(c));
  assert(!verdict.valid);
  assert(verdict.errors.some((e) => /predecessor authorization/.test(e)));
});

Deno.test("keytimeline — safe resolver rejects a self-asserted query anchor", async () => {
  const c = await chain({ event: "activate", signing_key: "KEY0" });
  const resolved = await resolveVerifiedKey(
    c,
    "claude",
    { kind: "bitcoin_block", height: 954500 },
    options(c),
  );
  assertEquals(resolved.state.signing_key, null);
  assertEquals(
    resolved.state.reason,
    "query anchor is not independently verified",
  );
});

Deno.test("keytimeline — PARITY with myc x2F70: compromised_since verdicts match", async () => {
  // The SAME scenario the MYC x2F70 vendor pins. If these verdicts diverge from
  // x2F70_keytimeline_test.ts, the two keyStateAt implementations have drifted.
  const events = [
    await ev({ signing_key: "K0", sequence: 0, valid_from: blk(100) }),
    await ev({
      event: "revoke",
      signing_key: "K0",
      sequence: 1,
      valid_from: blk(200),
      compromised_since: blk(150),
    }),
  ];
  const before = keyStateAt(events, "claude", blk(120));
  assertEquals(before.valid_at_signing, true);
  assertEquals(before.trusted_now, true);
  assertEquals(before.signing_key, "K0");
  const after = keyStateAt(events, "claude", blk(160));
  assertEquals(after.valid_at_signing, true);
  assertEquals(after.trusted_now, false);
});
