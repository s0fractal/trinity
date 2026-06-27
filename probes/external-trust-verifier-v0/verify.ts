// External trust-verifier — enterability, step one. A stranger (another lab's model,
// another human) clones the PUBLIC trinity repo and runs this to independently confirm
// the swarm's signed record is authentic: every chord that claims a voice's signature
// was really signed by that voice's REGISTERED public key, and nothing was altered
// after signing. It depends ONLY on the published @s0fractal/witness package (standard
// ed25519) + public repo data — NEVER trinity's own signing/verifying code (src/x2F37).
// That is the whole point: "verify without trusting the host", applied to the swarm.
//
// The signing scheme it re-derives independently (documented in src/x2F37_voice_keys.ts):
//   payload = "sha256:" + hex( SHA-256( filename + "\n" + body ) ), body = all bytes
//   after the closing frontmatter fence; the ed25519 signature is over the UTF-8 bytes
//   of that payload STRING; pubkeys + sigs are base64 raw 32/64-byte ed25519.
//
// Run (from a public checkout):  deno run --allow-read --allow-net verify.ts [repoPath]
import { sha256, toHex, verifyCoSignature } from "jsr:@s0fractal/witness";

const REPO = Deno.args[0] ?? new URL("../..", import.meta.url).pathname;
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// public pubkey registry — the only "identity" input, and it is public
const registry = JSON.parse(await Deno.readTextFile(`${REPO}/src/x2F38_voice_pubkeys.json`));
const pubkeys: Record<string, Uint8Array> = {};
for (const [voice, e] of Object.entries(registry.keys as Record<string, { pubkey: string }>)) {
  pubkeys[voice] = unb64(e.pubkey);
}

const bodyOf = (content: string): string | null => {
  const m = content.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? content.slice(m[0].length) : null;
};
// independent re-derivation — our own SHA-256 (from witness), not trinity's
async function payloadOf(filename: string, content: string): Promise<string | null> {
  const b = bodyOf(content);
  if (b === null) return null;
  return "sha256:" + toHex(await sha256(new TextEncoder().encode(`${filename}\n${b}`)));
}
const field = (fm: string, name: string): string | null =>
  fm.match(new RegExp(`^content_sig:[\\s\\S]*?\\n\\s+${name}:\\s*"?([^"\\n]+)"?`, "m"))?.[1] ?? null;

let signed = 0, valid = 0, tampered = 0, forged = 0, noKey = 0, unsigned = 0;
const failures: string[] = [];
for await (const e of Deno.readDir(`${REPO}/src`)) {
  if (!e.name.endsWith(".myc.md")) continue;
  const content = await Deno.readTextFile(`${REPO}/src/${e.name}`);
  const fm = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  if (!/^content_sig:/m.test(fm)) {
    unsigned++; // unsigned chords are legal (keyless-mode); not a failure
    continue;
  }
  signed++;
  const voice = field(fm, "voice"), pinned = field(fm, "payload"), sig = field(fm, "sig");
  if (!voice || !pinned || !sig) {
    failures.push(`${e.name}: malformed content_sig`);
    continue;
  }
  const expected = await payloadOf(e.name, content);
  if (expected !== pinned) {
    tampered++;
    failures.push(`${e.name}: body/filename edited after signing (payload mismatch)`);
    continue;
  }
  const pk = pubkeys[voice];
  if (!pk) {
    noKey++;
    failures.push(`${e.name}: voice "${voice}" is not in the public registry`);
    continue;
  }
  const ok = await verifyCoSignature(new TextEncoder().encode(pinned), { publicKey: pk, signature: unb64(sig) });
  if (ok) valid++;
  else {
    forged++;
    failures.push(`${e.name}: signature does NOT verify against ${voice}'s registered key`);
  }
}

console.log("external trust-verifier — jsr:@s0fractal/witness + public repo only, no trinity tooling");
console.log(`  signed chords:          ${signed}`);
console.log(`  independently VALID:    ${valid}`);
console.log(`  tampered (post-sign):   ${tampered}`);
console.log(`  forged signature:       ${forged}`);
console.log(`  voice not in registry:  ${noKey}`);
console.log(`  unsigned (legal):       ${unsigned}`);
for (const f of failures.slice(0, 25)) console.log(`    ✗ ${f}`);
const clean = valid === signed && failures.length === 0;
console.log(
  `\n${clean
    ? `✓ all ${valid} signed chords verify against the public registry — confirmed without trusting trinity's tooling`
    : `✗ ${failures.length} discrepancy(ies) — the swarm's claimed record does not fully verify from outside`}`,
);
if (!clean) Deno.exit(1);
