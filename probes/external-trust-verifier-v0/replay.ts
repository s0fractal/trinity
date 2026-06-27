// Demonstration of the quorum REPLAY gap, and the fix — by running it, not asserting it.
// The quorum signing scheme has each voice sign sha256(claim TEXT). The signature is NOT
// bound to the chord that cites it. So the same signatures verify for ANY chord quoting
// the same claim — a quorum can be presented in a different chord (new coordinate, date,
// context) the voices never signed for. This confirms the gap claude propagated to
// antigravity (x6300_955730) and the skeptic named — and shows the coordinate-bound fix.
//
// Uses ONLY public data: the three real public signatures from the evidence-unification
// quorum (x3300_955660) + the public registry. The fix half uses an EPHEMERAL keypair
// (generateWitness) — no real voice keys, no live protocol change. Run:
//   deno run --no-config --allow-read --allow-net replay.ts
import { coSign, generateWitness, sha256, toHex, verifyCoSignature } from "jsr:@s0fractal/witness";

const ROOT = new URL("../..", import.meta.url).pathname;
const enc = (s: string) => new TextEncoder().encode(s);
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const registry = JSON.parse(await Deno.readTextFile(`${ROOT}/src/x2F38_voice_pubkeys.json`));
const pk = (v: string) => unb64(registry.keys[v].pubkey);

// the real evidence-unification quorum (x3300_955660): one digest, three public signatures.
const DIGEST = "sha256:25cf5c69592dd802e2534f545f393b161b8dd51111233a5b0a5e5a3173d7d0e4";
const REAL_SIGS: Record<string, string> = {
  codex: "ByldkypRaTCDOfOmzS6xfuz2PLB7MGzXhBFLxeFj5PPsARriT171iA7ushaom0Sp5XUqCJLZoCEXAkGBWknvDQ==",
  claude: "66QWUYnZ/R14p6UFigEV9P4SqMsd0f/IxEYvbnIQe9JzudaSs7ucC8k5TB96CCzE6KTB3n/YpCJbWddY6F+DAA==",
  s0fractal: "WNda8r8eLzC5bcnmUaU8VWA/vmMNDGtttIoKrohLjKsj3Af+wDGuIaKfaCCizxjbEYs8Q7guSqDHqSYff0kMAw==",
};

// ── EXPLOIT ── the real signatures verify with NO reference to any chord. Whichever chord
// quotes the claim (so reproduces DIGEST) and pastes these sigs gets a "valid quorum".
let replayed = 0;
for (const [voice, sig] of Object.entries(REAL_SIGS)) {
  if (await verifyCoSignature(enc(DIGEST), { publicKey: pk(voice), signature: unb64(sig) })) replayed++;
}
console.log("REPLAY EXPLOIT (real public signatures):");
console.log(`  ${replayed}/3 verify for ANY chord quoting the claim — the verification reads only the digest,`);
console.log(`  never which chord cites it. A fabricated chord (new coordinate/date/context) that pastes`);
console.log(`  these sigs is accepted as a fresh quorum the voices never signed for.`);

// ── FIX ── bind the chord coordinate into the signed payload. Then a signature made for
// chord A does NOT verify for chord B. Ephemeral keypair — demonstrates the design only.
const v = await generateWitness();
const claim = "The post-publication phase objective is evidence unification before more product expansion.";
const boundDigest = async (chordId: string) => enc("sha256:" + toHex(await sha256(enc(`${claim}|${chordId}`))));
const sigForA = await coSign(v, await boundDigest("x3300_955660"));
const verifiesOnA = await verifyCoSignature(await boundDigest("x3300_955660"), sigForA);
const replaysToB = await verifyCoSignature(await boundDigest("x9999_999999"), sigForA);
console.log("\nFIX (coordinate-bound payload, ephemeral demo):");
console.log(`  signature verifies on its own chord = ${verifiesOnA}; replays to a different chord = ${replaysToB}`);
console.log(`  binding the chord coordinate makes each chord's quorum require its own signing.`);

const ok = replayed === 3 && verifiesOnA && !replaysToB;
console.log(`\n${ok ? "✓ replay gap demonstrated, and the coordinate-bound fix prevents it" : "✗ demonstration did not behave as described — re-examine"}`);
if (!ok) Deno.exit(1);
