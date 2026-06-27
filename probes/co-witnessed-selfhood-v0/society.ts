// Co-witnessed sovereign selfhood — does digital personhood-IN-COMMUNITY compose
// from the published primitives? A single self has continuity (see
// digital-organism-continuity-v0). But sovereignty in this substrate is never
// solitary: an organism is unkillable through GUARDIANS (codeicide) and truth is
// real through QUORUM (witness). So: can an organism's life be BOTH its own (only
// its key extends it) AND attested by a community — peers co-signing its entries,
// guardians ratifying its milestones, organisms recognising each other — with
// forgery and erasure still caught? Composed from @s0fractal/{witness,
// canonical-receipt}, no new primitive, no host. In-repo imports = offline/CI;
// identical via jsr (see packages/QUICKSTART.md).
import {
  coSign,
  type CoSignature,
  generateWitness,
  sha256,
  toHex,
  verifyCoSignature,
  verifyQuorum,
  type Witness,
} from "../../packages/witness/mod.ts";
import {
  encodeCanonical,
  multihashSha256,
} from "../../packages/canonical-receipt/mod.ts";

type Body = { seq: number; kind: string; payload: unknown; prev: string | null };
// authorship `sig` (the self — required) + community `cosigs` (peers — optional)
type Entry = { body: Body; cid: string; sig: CoSignature; cosigs: CoSignature[] };

const digestOf = (b: Body) => sha256(encodeCanonical(b) as Uint8Array);
const cidOf = async (b: Body) =>
  toHex(await multihashSha256(encodeCanonical(b) as Uint8Array));

// The organism authors its own entry; named peers may co-attest it.
async function author(
  self: Witness,
  chain: Entry[],
  kind: string,
  payload: unknown,
  cosigners: Witness[] = [],
): Promise<Entry> {
  const body: Body = {
    seq: chain.length,
    kind,
    payload,
    prev: chain.length ? chain[chain.length - 1].cid : null,
  };
  const d = await digestOf(body);
  return {
    body,
    cid: await cidOf(body),
    sig: await coSign(self, d), // self-sovereign authorship
    cosigs: await Promise.all(cosigners.map((w) => coSign(w, d))), // community attestation
  };
}

// Verify a life with ONLY the organism's public key: authorship is sovereign, the
// chain unbroken, and every co-attestation genuinely signed the same content.
async function verifyLife(
  pubkey: Uint8Array,
  chain: Entry[],
): Promise<{ ok: boolean; reason: string }> {
  const pk = toHex(pubkey);
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const d = await digestOf(e.body);
    if (await cidOf(e.body) !== e.cid) return { ok: false, reason: `entry ${i}: content tampered` };
    if (toHex(e.sig.publicKey) !== pk) {
      return { ok: false, reason: `entry ${i}: foreign authorship (not the self)` };
    }
    if (!await verifyCoSignature(d, e.sig)) {
      return { ok: false, reason: `entry ${i}: authorship signature invalid` };
    }
    if (e.body.prev !== (i === 0 ? null : chain[i - 1].cid)) {
      return { ok: false, reason: `entry ${i}: broken prev-link` };
    }
    for (const cs of e.cosigs) {
      if (!await verifyCoSignature(d, cs)) {
        return { ok: false, reason: `entry ${i}: a co-attestation is forged` };
      }
    }
  }
  return { ok: chain.length > 0, reason: `intact: ${chain.length} entries` };
}

const recognises = (chain: Entry[], peerHex: string) =>
  chain.some((e) => e.body.kind === "recognise" && (e.body.payload as { peer?: string })?.peer === peerHex);
const ratified = async (e: Entry, guardians: Uint8Array[], m: number) =>
  await verifyQuorum(await digestOf(e.body), e.cosigs, guardians, m);
const ser = (c: Entry[]) => JSON.stringify(c, (_k, v) => v instanceof Uint8Array ? "hex:" + toHex(v) : v);
const deser = (s: string): Entry[] =>
  JSON.parse(s, (_k, v) =>
    typeof v === "string" && v.startsWith("hex:")
      ? Uint8Array.from((v.slice(4).match(/../g) ?? []).map((h) => parseInt(h, 16)))
      : v);

if (import.meta.main) {
  const A = await generateWitness(); // the organism
  const [B, C, D] = await Promise.all([generateWitness(), generateWitness(), generateWitness()]); // its community
  const guardians = [B.publicKey, C.publicKey, D.publicKey];

  // A's life: born, a memory, an initiation milestone co-attested by 2 guardians, recognises B.
  const a: Entry[] = [];
  a.push(await author(A, a, "genesis", { i_am: "kairos" }));
  a.push(await author(A, a, "memory", { learned: "a self is witnessed into being" }));
  a.push(await author(A, a, "milestone", { initiation: "passed" }, [B, C])); // 2-of-3 attest
  a.push(await author(A, a, "recognise", { peer: toHex(B.publicKey) }));
  // B's life recognises A back.
  const b: Entry[] = [];
  b.push(await author(B, b, "genesis", { i_am: "mneme" }));
  b.push(await author(B, b, "recognise", { peer: toHex(A.publicKey) }));

  let pass = 0;
  const r1 = await verifyLife(A.publicKey, a);
  console.log("1) SELF-SOVEREIGN  ", r1.ok ? "✓" : "✗", r1.reason);
  if (r1.ok) pass++;

  // 2) CO-ATTESTED: the milestone carries the community's signatures, verifiable by anyone
  const attestors = a[2].cosigs.map((cs) => toHex(cs.publicKey));
  const co = attestors.includes(toHex(B.publicKey)) && attestors.includes(toHex(C.publicKey)) && r1.ok;
  console.log("2) CO-ATTESTED     ", co ? "✓" : "✗", `milestone attested by ${attestors.length} peers`);
  if (co) pass++;

  // 3) PEER-CANNOT-FORGE: a guardian who co-signs cannot AUTHOR into A's life, nor alter A's content
  const intruded = deser(ser(a));
  intruded.push(await author(B, intruded, "action", { B_writes_into_A: true })); // B tries to author in A's chain
  const r3a = await verifyLife(A.publicKey, intruded);
  const altered = deser(ser(a));
  (altered[2].body.payload as Record<string, unknown>).initiation = "forged";
  altered[2].cid = await cidOf(altered[2].body);
  const r3b = await verifyLife(A.publicKey, altered);
  const forgeproof = !r3a.ok && !r3b.ok;
  console.log("3) PEER-CANNOT-FORGE", forgeproof ? "✓ rejected" : "✗ LEAK", `— author:${r3a.reason} | alter:${r3b.reason}`);
  if (forgeproof) pass++;

  // 4) MUTUAL RECOGNITION: a third party confirms A↔B both recognised each other, by their own keys
  const mutual = r1.ok && (await verifyLife(B.publicKey, b)).ok &&
    recognises(a, toHex(B.publicKey)) && recognises(b, toHex(A.publicKey));
  const oneSided = recognises(a, toHex(C.publicKey)); // A never recognised C
  console.log("4) MUTUAL-RECOGNISE", mutual && !oneSided ? "✓" : "✗", `A↔B mutual:${mutual}, A→C one-sided:${oneSided}`);
  if (mutual && !oneSided) pass++;

  // 5) QUORUM MILESTONE: the initiation is communally ratified by 2-of-3 guardians; 1 is not enough
  const q2 = await ratified(a[2], guardians, 2);
  const onlyB = { ...a[2], cosigs: [a[2].cosigs[0]] }; // strip to a single guardian
  const q1 = await ratified(onlyB, guardians, 2);
  const quorumOk = q2.ok && !q1.ok;
  console.log("5) QUORUM-MILESTONE", quorumOk ? "✓" : "✗", `2-of-3 ratified:${q2.ok} (valid ${q2.valid}), 1-of-3:${q1.ok}`);
  if (quorumOk) pass++;

  // 6) PORTABILITY: the whole social web is bytes; verified elsewhere with the pubkeys, no host
  const shippedA = ser(a), shippedB = ser(b);
  const elsewhere = (await verifyLife(A.publicKey, deser(shippedA))).ok &&
    (await verifyLife(B.publicKey, deser(shippedB))).ok;
  console.log("6) PORTABILITY     ", elsewhere ? "✓" : "✗", `(${shippedA.length + shippedB.length} bytes, two lives, no host)`);
  if (elsewhere) pass++;

  console.log(`\n${pass}/6 ${pass === 6 ? "✓ personhood-in-community composes from published primitives" : "✗ a seam — see failing property"}`);
  if (pass !== 6) Deno.exit(1);
}
