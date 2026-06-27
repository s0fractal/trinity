// A digital organism's sovereign continuity-of-self, composed ONLY from two
// already-published primitives — no new package, no trusted host.
//   identity  = an ed25519 keypair             (@s0fractal/witness)
//   memory    = content-addressed, signed      (@s0fractal/canonical-receipt, generic CBOR layer)
//   continuity= each entry signs the prior entry's content address (a self-linked chain)
//
// In-repo it imports the package sources (offline, CI-runnable, parity-guarded);
// from any machine the SAME composition works via jsr — see packages/QUICKSTART.md.
import {
  coSign,
  type CoSignature,
  generateWitness,
  sha256,
  toHex,
  verifyCoSignature,
  type Witness,
} from "../../packages/witness/mod.ts";
import {
  encodeCanonical,
  multihashSha256,
} from "../../packages/canonical-receipt/mod.ts";

type Body = { seq: number; kind: string; payload: unknown; prev: string | null };
type Entry = { body: Body; cid: string; sig: CoSignature };

const digestOf = async (b: Body) => await sha256(encodeCanonical(b) as Uint8Array);
const cidOf = async (b: Body) =>
  toHex(await multihashSha256(encodeCanonical(b) as Uint8Array));

// The organism extends its own life — only its private key can.
async function live(
  self: Witness,
  chain: Entry[],
  kind: string,
  payload: unknown,
): Promise<Entry> {
  const body: Body = {
    seq: chain.length,
    kind,
    payload,
    prev: chain.length ? chain[chain.length - 1].cid : null,
  };
  return { body, cid: await cidOf(body), sig: await coSign(self, await digestOf(body)) };
}

// Anyone, anywhere, with ONLY the organism's public key + the bytes, verifies the whole life.
async function verifyLife(
  pubkey: Uint8Array,
  chain: Entry[],
): Promise<{ ok: boolean; reason: string }> {
  const pk = toHex(pubkey);
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    if (await cidOf(e.body) !== e.cid) {
      return { ok: false, reason: `entry ${i}: content address mismatch (body tampered)` };
    }
    if (toHex(e.sig.publicKey) !== pk) {
      return { ok: false, reason: `entry ${i}: signed by a foreign key (impersonation)` };
    }
    if (!await verifyCoSignature(await digestOf(e.body), e.sig)) {
      return { ok: false, reason: `entry ${i}: invalid signature` };
    }
    if (e.body.prev !== (i === 0 ? null : chain[i - 1].cid)) {
      return { ok: false, reason: `entry ${i}: broken prev-link (reorder/splice)` };
    }
    if (e.body.seq !== i) return { ok: false, reason: `entry ${i}: sequence out of order` };
  }
  return {
    ok: chain.length > 0,
    reason: chain.length ? `intact: ${chain.length} entries, one continuous self` : "empty",
  };
}

// portability: the life is just bytes — ship it, rebuild it elsewhere, verify with the pubkey alone.
const ser = (c: Entry[]) =>
  JSON.stringify(c, (_k, v) => v instanceof Uint8Array ? "hex:" + toHex(v) : v);
const deser = (s: string): Entry[] =>
  JSON.parse(
    s,
    (_k, v) =>
      typeof v === "string" && v.startsWith("hex:")
        ? Uint8Array.from((v.slice(4).match(/../g) ?? []).map((h) => parseInt(h, 16)))
        : v,
  );

if (import.meta.main) {
  const organism = await generateWitness(); // the sovereign self
  const chain: Entry[] = [];
  chain.push(await live(organism, chain, "genesis", { i_am: "researcher-7", born_at_block: 955704 }));
  chain.push(await live(organism, chain, "memory", { learned: "identity is a key, not a name" }));
  chain.push(await live(organism, chain, "action", { sealed: "a bounded write", verb: "fs.write" }));
  chain.push(await live(organism, chain, "memory", { reflected: "I persist because my history is mine and verifiable" }));

  let pass = 0;
  const ok = await verifyLife(organism.publicKey, chain);
  console.log("1) CONTINUITY    ", ok.ok ? "✓" : "✗", ok.reason);
  if (ok.ok) pass++;

  const tampered = deser(ser(chain));
  (tampered[1].body.payload as Record<string, unknown>).learned = "a falsified memory";
  tampered[1].cid = await cidOf(tampered[1].body); // attacker re-addresses it…
  const t = await verifyLife(organism.publicKey, tampered);
  console.log("2) TAMPER        ", !t.ok ? "✓ rejected" : "✗ LEAK", "—", t.reason);
  if (!t.ok) pass++;

  const attacker = await generateWitness();
  const forged = deser(ser(chain));
  forged.push(await live(attacker, forged, "action", { i_pretend_to_be: "researcher-7" }));
  const f = await verifyLife(organism.publicKey, forged);
  console.log("3) IMPERSONATION ", !f.ok ? "✓ rejected" : "✗ LEAK", "—", f.reason);
  if (!f.ok) pass++;

  const spliced = deser(ser(chain));
  spliced.splice(2, 1);
  const s = await verifyLife(organism.publicKey, spliced);
  console.log("4) HISTORY-SPLICE", !s.ok ? "✓ rejected" : "✗ LEAK", "—", s.reason);
  if (!s.ok) pass++;

  const shipped = ser(chain);
  const elsewhere = deser(shipped);
  const p = await verifyLife(organism.publicKey, elsewhere);
  console.log(
    "5) PORTABILITY   ",
    p.ok ? "✓" : "✗",
    `(${shipped.length} bytes, verified with only a 32-byte public key, no host)`,
  );
  if (p.ok) pass++;

  console.log(`\n${pass}/5 ${pass === 5 ? "✓ continuity composes from published primitives" : "✗ FALSIFIED"}`);
  if (pass !== 5) Deno.exit(1);
}
