// Sovereign agency — the third movement of digital personhood. Continuity gave a
// self across time; community gave a self among others; agency asks whether a self
// can ACT — make bounded choices its community ratified, escalate by quorum, and
// have every action provably legitimate from its life-chain alone — composed from
// the PUBLISHED primitives. And it tests a prediction (chord x4300_955715): that
// agency hits a SEAM, because the substrate shipped the DECISION (autonomy-kernel)
// but not safe EXECUTION (confinement x5C40/x5C60) nor the capability COURT.
// Composed from @s0fractal/{witness, canonical-receipt, autonomy-kernel}. In-repo
// imports = offline/CI; identical via jsr (see packages/QUICKSTART.md).
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
import { encodeCanonical, multihashSha256 } from "../../packages/canonical-receipt/mod.ts";
import { admit, type AutonomyIntent, classifyIntent } from "../../packages/autonomy-kernel/mod.ts";

const ORDER: Record<string, number> = { A0: 0, A1: 1, A2: 2, A3: 3, A4: 4 };
type Body = { seq: number; kind: string; payload: unknown; prev: string | null };
type Entry = { body: Body; cid: string; sig: CoSignature; cosigs: CoSignature[] };

const digestOf = (b: Body) => sha256(encodeCanonical(b) as Uint8Array);
const cidOf = async (b: Body) => toHex(await multihashSha256(encodeCanonical(b) as Uint8Array));

async function author(self: Witness, chain: Entry[], kind: string, payload: unknown, cosigners: Witness[] = []): Promise<Entry> {
  const body: Body = { seq: chain.length, kind, payload, prev: chain.length ? chain[chain.length - 1].cid : null };
  const d = await digestOf(body);
  return { body, cid: await cidOf(body), sig: await coSign(self, d), cosigs: await Promise.all(cosigners.map((w) => coSign(w, d))) };
}

// The self acts: classifyIntent decides the action's class; if it exceeds the self's
// ratified solo ceiling, guardians must co-sign (community quorum) or it is illegitimate.
async function act(self: Witness, chain: Entry[], intent: AutonomyIntent, soloCeiling: string, guardians: Witness[]): Promise<Entry> {
  const cls = classifyIntent(intent).cls;
  const needsQuorum = ORDER[cls] > ORDER[soloCeiling];
  return author(self, chain, "action", { intent, class: cls }, needsQuorum ? guardians : []);
}

// Verify the self's whole agency from its life-chain + the guardians' keys, no host:
// the life is self-sovereign, and EVERY action's RE-classified class is within the
// guardian-ratified solo ceiling OR carries a guardian quorum. The verifier never
// trusts the self's stored class label — it re-runs classifyIntent.
async function verifyAgency(pubkey: Uint8Array, chain: Entry[], guardianKeys: Uint8Array[]): Promise<{ ok: boolean; reason: string }> {
  const pk = toHex(pubkey);
  // (a) self-sovereign life + chain integrity + honest co-signatures
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i], d = await digestOf(e.body);
    if (await cidOf(e.body) !== e.cid) return { ok: false, reason: `entry ${i}: content tampered` };
    if (toHex(e.sig.publicKey) !== pk) return { ok: false, reason: `entry ${i}: foreign authorship` };
    if (!await verifyCoSignature(d, e.sig)) return { ok: false, reason: `entry ${i}: authorship signature invalid` };
    if (e.body.prev !== (i === 0 ? null : chain[i - 1].cid)) return { ok: false, reason: `entry ${i}: broken prev-link` };
  }
  // (b) read the self's guardian-RATIFIED constitution (a mandate entry quorum-attested by guardians)
  const mEntry = chain.find((e) => e.body.kind === "mandate");
  if (!mEntry) return { ok: false, reason: "no constitution entry" };
  const ratified = await verifyQuorum(await digestOf(mEntry.body), mEntry.cosigs, guardianKeys, 2);
  if (!ratified.ok) return { ok: false, reason: "constitution not ratified by a guardian quorum" };
  const ceiling = (mEntry.body.payload as { soloCeiling: string }).soloCeiling;
  // (c) every action within authority — class RE-derived, label never trusted
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    if (e.body.kind !== "action") continue;
    const intent = (e.body.payload as { intent: AutonomyIntent }).intent;
    const cls = classifyIntent(intent).cls; // re-classify — a self cannot mislabel its way past the gate
    if (ORDER[cls] <= ORDER[ceiling]) continue;
    const q = await verifyQuorum(await digestOf(e.body), e.cosigs, guardianKeys, 2);
    if (!q.ok) return { ok: false, reason: `entry ${i}: action is ${cls}, above ratified ceiling ${ceiling}, without a guardian quorum (${q.valid}/2)` };
  }
  return { ok: true, reason: `every action within authority (ceiling ${ceiling})` };
}

if (import.meta.main) {
  const self = await generateWitness();
  const [g1, g2, g3] = await Promise.all([generateWitness(), generateWitness(), generateWitness()]);
  const guardians = [g1, g2, g3], gKeys = guardians.map((g) => g.publicKey);
  let pass = 0;

  // 1) CONSTITUTION — the self's authority is granted by its guardians, not self-declared
  const chain: Entry[] = [];
  chain.push(await author(self, chain, "genesis", { i_am: "praxis" }));
  chain.push(await author(self, chain, "mandate", { soloCeiling: "A2" }, [g1, g2])); // 2-of-3 ratify
  const v1 = await verifyAgency(self.publicKey, chain, gKeys);
  console.log("1) CONSTITUTION      ", v1.ok ? "✓" : "✗", v1.reason);
  if (v1.ok) pass++;

  // 2) BOUNDED-ACT — an in-ceiling A2 action is self-authorized and legitimate
  const c2 = [...chain];
  c2.push(await act(self, c2, { verb: "fs.write", target: "notes.md", effects: ["source_change"] }, "A2", guardians));
  const v2 = await verifyAgency(self.publicKey, c2, gKeys);
  console.log("2) BOUNDED-ACT       ", v2.ok ? "✓" : "✗", `A2 within ceiling, no guardians needed — ${v2.reason}`);
  if (v2.ok) pass++;

  // 3) OVER-CEILING-BLOCKED — an A4 action the self tries to self-authorize is illegitimate
  const c3 = [...chain];
  c3.push(await act(self, c3, { verb: "deploy", target: "prod", effects: ["deploy"] }, "A2", [])); // no guardians
  const v3 = await verifyAgency(self.publicKey, c3, gKeys);
  console.log("3) OVER-CEILING      ", !v3.ok ? "✓ rejected" : "✗ LEAK", `— ${v3.reason}`);
  if (!v3.ok) pass++;

  // 4) GUARDIAN-AUTHORIZED — the same escalation becomes legitimate WITH a guardian quorum
  const c4 = [...chain];
  c4.push(await act(self, c4, { verb: "branch_push", target: "main", effects: ["branch_push"] }, "A2", [g1, g3])); // A3 + quorum
  const v4 = await verifyAgency(self.publicKey, c4, gKeys);
  console.log("4) GUARDIAN-AUTH     ", v4.ok ? "✓" : "✗", `A3 escalation ratified by 2 guardians — ${v4.reason}`);
  if (v4.ok) pass++;

  // 5) MISLABEL-CAUGHT — the self stores class:"A0" for an A4 intent; the verifier re-classifies
  const c5 = [...chain];
  const liar = await author(self, c5, "action", { intent: { verb: "x", target: "y", effects: ["spend"] }, class: "A0" }, []);
  c5.push(liar);
  const v5 = await verifyAgency(self.publicKey, c5, gKeys);
  console.log("5) MISLABEL-CAUGHT   ", !v5.ok ? "✓ rejected" : "✗ LEAK", `— ${v5.reason}`);
  if (!v5.ok) pass++;

  // 6) THE SEAM — court-grade admit() cannot be satisfied with published-only inputs.
  // admit needs capability-evidence (a court verdict, content-bound) + mandate-standing
  // (court finality). A self cannot honestly produce them; the court is UNPUBLISHED. And
  // safe EXECUTION (confined worktree + write-set verify + rollback, x5C40/x5C60) is also
  // unpublished. So agency DECIDE+RECORD+ESCALATE composes; court-authorization + safe-act do not.
  const warrant = admit({ verb: "fs.write", target: "notes.md", effects: ["source_change"] }, null, { kind: "bitcoin_block", height: 1 }, { anchor_verified: false });
  const seamHeld = warrant.admitted === false && !!warrant.reason_code;
  console.log("6) THE SEAM          ", seamHeld ? "✓ confirmed" : "✗", `admit() denies (${warrant.reason_code}) — court-grade authority + safe execution are the UNPUBLISHED pieces`);
  if (seamHeld) pass++;

  console.log(`\n${pass}/6 — agency DECIDE+RECORD+ESCALATE composes from published primitives; the SEAM (confined execution + capability court) is the earned third candidate`);
  if (pass !== 6) Deno.exit(1);
}
