import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mintKeypair, type Registry, signHash } from "./x2F37_voice_keys.ts";
import {
  type Amendment,
  amendmentDigest,
  applyAmendment,
  checkIntegrity,
  registryHash,
  verifyAmendmentQuorum,
  type Vote,
} from "./x2F3B_registry_amend.ts";

// A 5-voice ephemeral registry. NEVER the live x2F38 — these keys exist only
// for this test, so a real quorum can never be manufactured from here.
async function fixture() {
  const names = ["v1", "v2", "v3", "v4", "v5"];
  const priv: Record<string, string> = {};
  const reg: Registry = {
    schema: "test",
    custody_note: "ephemeral",
    keys: {},
  };
  for (const n of names) {
    const { entry, privateKeyB64 } = await mintKeypair("test");
    reg.keys[n] = entry;
    priv[n] = privateKeyB64;
  }
  return { reg, priv };
}

async function vote(
  voice: string,
  stance: "AYE" | "NAY",
  digest: string,
  priv: string,
): Promise<Vote> {
  return {
    voice,
    stance,
    content_blake3: digest,
    sig: await signHash(digest, priv),
  };
}

async function revokeV5(reg: Registry): Promise<Amendment> {
  return {
    op: "revoke",
    voice: "v5",
    reason: "key rotation drill",
    base_registry_hash: await registryHash(reg),
  };
}

Deno.test("registry-amend — 3 valid AYE from distinct voices authorizes", async () => {
  const { reg, priv } = await fixture();
  const a = await revokeV5(reg);
  const d = await amendmentDigest(a);
  const votes = [
    await vote("v1", "AYE", d, priv.v1),
    await vote("v2", "AYE", d, priv.v2),
    await vote("v3", "AYE", d, priv.v3),
  ];
  const q = await verifyAmendmentQuorum(a, votes, reg);
  assert(q.authorized, q.reasons.join("; "));
  assertEquals(q.ayes, ["v1", "v2", "v3"]);
  // and it applies: v5 is gone
  const next = applyAmendment(reg, a);
  assert(!("v5" in next.keys));
  assert("v1" in next.keys);
});

Deno.test("registry-amend — 2 AYE is below quorum, REFUSED", async () => {
  const { reg, priv } = await fixture();
  const a = await revokeV5(reg);
  const d = await amendmentDigest(a);
  const votes = [
    await vote("v1", "AYE", d, priv.v1),
    await vote("v2", "AYE", d, priv.v2),
  ];
  const q = await verifyAmendmentQuorum(a, votes, reg);
  assert(!q.authorized);
  assert(q.reasons.some((r) => r.includes("insufficient quorum")));
});

Deno.test("registry-amend — a single NAY vetoes even with 3 AYE", async () => {
  const { reg, priv } = await fixture();
  const a = await revokeV5(reg);
  const d = await amendmentDigest(a);
  const votes = [
    await vote("v1", "AYE", d, priv.v1),
    await vote("v2", "AYE", d, priv.v2),
    await vote("v3", "AYE", d, priv.v3),
    await vote("v4", "NAY", d, priv.v4),
  ];
  const q = await verifyAmendmentQuorum(a, votes, reg);
  assert(!q.authorized);
  assertEquals(q.nays, ["v4"]);
});

Deno.test("registry-amend — the SUBJECT cannot self-authorize or self-veto its own key", async () => {
  const { reg, priv } = await fixture();
  const a = await revokeV5(reg);
  const d = await amendmentDigest(a);
  // v5 (the subject) tries to both AYE and NAY its own revocation — both ignored
  const withSelfAye = [
    await vote("v1", "AYE", d, priv.v1),
    await vote("v2", "AYE", d, priv.v2),
    await vote("v5", "AYE", d, priv.v5), // excluded — only 2 real AYE
  ];
  assert(!(await verifyAmendmentQuorum(a, withSelfAye, reg)).authorized);

  const withSelfNay = [
    await vote("v1", "AYE", d, priv.v1),
    await vote("v2", "AYE", d, priv.v2),
    await vote("v3", "AYE", d, priv.v3),
    await vote("v5", "NAY", d, priv.v5), // a compromised key cannot block its revoke
  ];
  const q = await verifyAmendmentQuorum(a, withSelfNay, reg);
  assert(q.authorized, q.reasons.join("; "));
  assertEquals(q.nays, []); // v5's NAY was excluded, not a veto
});

Deno.test("registry-amend — forged and unregistered votes are DROPPED, not counted", async () => {
  const { reg, priv } = await fixture();
  const a = await revokeV5(reg);
  const d = await amendmentDigest(a);
  const stranger = await mintKeypair("attacker");
  const votes = [
    await vote("v1", "AYE", d, priv.v1),
    await vote("v2", "AYE", d, priv.v2),
    // v3's slot signed with v4's key → forgery, dropped
    {
      voice: "v3",
      stance: "AYE" as const,
      content_blake3: d,
      sig: await signHash(d, priv.v4),
    },
    // an unregistered voice, validly self-signed but unknown to the registry
    {
      voice: "mallory",
      stance: "AYE" as const,
      content_blake3: d,
      sig: await signHash(d, stranger.privateKeyB64),
    },
  ];
  const q = await verifyAmendmentQuorum(a, votes, reg);
  assert(!q.authorized); // only v1,v2 real → 2/3
  assertEquals(q.ayes, ["v1", "v2"]);
  assert(q.dropped.some((x) => x.includes("v3")));
  assert(q.dropped.some((x) => x.includes("mallory")));
});

Deno.test("registry-amend — replay onto a different registry state is rejected", async () => {
  const { reg, priv } = await fixture();
  const a = await revokeV5(reg);
  const d = await amendmentDigest(a);
  const votes = [
    await vote("v1", "AYE", d, priv.v1),
    await vote("v2", "AYE", d, priv.v2),
    await vote("v3", "AYE", d, priv.v3),
  ];
  // mutate the registry after the amendment pinned its hash
  const mutated = structuredClone(reg);
  delete mutated.keys.v4;
  const q = await verifyAmendmentQuorum(a, votes, mutated);
  assert(!q.authorized);
  assert(q.reasons.some((r) => r.includes("base_registry_hash mismatch")));
});

Deno.test("registry-amend — a vote cast over a DIFFERENT amendment digest is dropped", async () => {
  const { reg, priv } = await fixture();
  const a = await revokeV5(reg);
  const d = await amendmentDigest(a);
  const otherDigest = await amendmentDigest({ ...a, reason: "something else" });
  const votes = [
    await vote("v1", "AYE", d, priv.v1),
    await vote("v2", "AYE", d, priv.v2),
    await vote("v3", "AYE", otherDigest, priv.v3), // signed a different amendment
  ];
  const q = await verifyAmendmentQuorum(a, votes, reg);
  assert(!q.authorized);
  assert(
    q.dropped.some((x) =>
      x.includes("v3") && x.includes("not over this amendment")
    ),
  );
});

Deno.test("registry-amend — checkIntegrity: an untouched registry folds from empty provenance", async () => {
  const { reg } = await fixture();
  const prov = { genesis: structuredClone(reg), amendments: [] };
  const r = await checkIntegrity(reg, prov);
  assert(r.ok, r.errors.join("; "));
});

Deno.test("registry-amend — checkIntegrity: an out-of-band edit breaks the fold (CI turns red)", async () => {
  const { reg } = await fixture();
  const prov = { genesis: structuredClone(reg), amendments: [] };
  // attacker adds a key directly to the live registry, no proof appended
  const tampered = structuredClone(reg);
  tampered.keys.mallory = {
    alg: "ed25519" as const,
    pubkey: "AAAA",
    minted_at: "",
    minted_by: "attacker",
  };
  const r = await checkIntegrity(tampered, prov);
  assert(!r.ok);
  assert(r.errors.some((e) => e.includes("out-of-band")));
});

Deno.test("registry-amend — checkIntegrity: a valid proven amendment folds; an unproven one in the chain fails", async () => {
  const { reg, priv } = await fixture();
  const a = await revokeV5(reg);
  const d = await amendmentDigest(a);
  const votes = [
    await vote("v1", "AYE", d, priv.v1),
    await vote("v2", "AYE", d, priv.v2),
    await vote("v3", "AYE", d, priv.v3),
  ];
  const live = applyAmendment(reg, a); // v5 removed, as the proof authorizes
  const good = {
    genesis: structuredClone(reg),
    amendments: [{ amendment: a, votes }],
  };
  assert((await checkIntegrity(live, good)).ok);

  // same live state, but the chain carries only 2 AYE → not authorized → fold fails
  const bad = {
    genesis: structuredClone(reg),
    amendments: [{ amendment: a, votes: votes.slice(0, 2) }],
  };
  const r = await checkIntegrity(live, bad);
  assert(!r.ok);
  assert(r.errors.some((e) => e.includes("insufficient quorum")));
});

// THE CI ENFORCEMENT: this test reads the REAL committed registry + provenance.
// It reds the moment anyone edits x2F38 without appending a quorum-proven
// amendment to x2F3C — closing the out-of-band bypass at the test/CI gate.
Deno.test("registry-amend — LIVE x2F38 folds from the committed provenance chain", async () => {
  const HERE = new URL(".", import.meta.url).pathname;
  const live = JSON.parse(
    await Deno.readTextFile(HERE + "x2F38_voice_pubkeys.json"),
  );
  const prov = JSON.parse(
    await Deno.readTextFile(HERE + "x2F3C_registry_provenance.json"),
  );
  const r = await checkIntegrity(live, prov);
  assert(
    r.ok,
    "the live key registry does not fold from its quorum-proven provenance " +
      "chain — an out-of-band change was made without a 3-of-5 proof: " +
      r.errors.join("; "),
  );
});
