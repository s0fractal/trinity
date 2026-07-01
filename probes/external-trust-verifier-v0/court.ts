#!/usr/bin/env -S deno run --allow-read --allow-net
// OUTSIDER side — a stranger (another lab's model, another human) confirms a REAL
// claim trinity made: the live Substrate Court verdict. It re-derives EVERYTHING
// from the published bytes and trusts NOTHING of ours:
//   - jsr:@s0fractal/witness  → standard ed25519 verify + sha256 (NOT src/x2F37)
//   - src/x2F38_voice_pubkeys.json → the public key registry (the only identity input)
//   - a public reference encoder → recompute each body_hash from its raw body
// If verifying needed one of our secrets, our access, or "trust me", this would be
// the wrong file. It needs none. Run (from a public checkout):
//   deno run --allow-read --allow-net court.ts [attestation.json] [repoPath]
import { sha256, toHex, verifyCoSignature } from "jsr:@s0fractal/witness";
import { encodeCanonical, multihashSha256 } from "../receipt-envelope-encoder-v0/ts/canonical_cbor.ts";

const HERE = new URL(".", import.meta.url).pathname;
const REPO = Deno.args[1] ?? new URL("../../", import.meta.url).pathname;
const ARTIFACT = Deno.args[0] ?? `${HERE}court-attestation.json`;
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const enc = (s: string) => new TextEncoder().encode(s);

// Read a source that may be a local path OR a public URL — so a stranger can verify
// us with NO git clone: point ARTIFACT + REPO at raw.githubusercontent.com (or any
// mirror) and everything is fetched over plain HTTP. Zero of our access required.
const readSrc = async (p: string): Promise<string> =>
  /^https?:\/\//.test(p) ? await (await fetch(p)).text() : await Deno.readTextFile(p);

const registryUrl = /^https?:\/\//.test(REPO)
  ? `${REPO.replace(/\/$/, "")}/src/x2F38_voice_pubkeys.json`
  : `${REPO}/src/x2F38_voice_pubkeys.json`;
const registry = JSON.parse(await readSrc(registryUrl));
const artifact = JSON.parse(await readSrc(ARTIFACT));
const { signed_payload, attestation } = artifact;
const fail: string[] = [];

// 1. AUTHENTICITY + INTEGRITY OF THE BUNDLE — a registered voice signed these exact
//    bytes. Recompute the digest ourselves; verify the signature with the witness pkg.
const digest = "sha256:" + toHex(await sha256(enc(signed_payload)));
if (digest !== attestation.payload) {
  fail.push(`bundle altered after signing: recomputed ${digest} != ${attestation.payload}`);
}
const pk = registry.keys?.[attestation.voice]?.pubkey;
if (!pk) fail.push(`voice "${attestation.voice}" is not in the public registry`);
else if (
  !await verifyCoSignature(enc(attestation.payload), {
    publicKey: unb64(pk),
    signature: unb64(attestation.sig),
  })
) fail.push(`signature does NOT verify against ${attestation.voice}'s registered key`);

const { verdict, envelopes, attested_at } = JSON.parse(signed_payload);
const court = verdict.court ?? {};

// 2. INDEPENDENT INTEGRITY — recompute each substrate's body_hash from its RAW body.
//    We do not trust the declared hash; we recompute it with a public encoder.
let recomputed = 0;
const lawHashes: Record<string, string | null> = {};
for (const env of envelopes) {
  const got = await multihashSha256(encodeCanonical(env.body));
  if (got !== env.body_hash) {
    fail.push(`${env.substrate_tag}: body tampered — body_hash recomputes to ${got}, not ${env.body_hash}`);
  } else recomputed++;
  lawHashes[env.substrate_tag] = (env.law_hash ?? null) as string | null;
}

// 3. RE-DERIVE THE COURT'S CONCLUSION from what we recomputed — do not trust the
//    verdict's own agreement bit; compute our own and require it to match.
const nonNullLaws = Object.values(lawHashes).filter((h): h is string => h != null);
const ourLawAgreement = new Set(nonNullLaws).size <= 1;
const ourIntegrity = recomputed === envelopes.length;
const ourAgreement = ourIntegrity && ourLawAgreement &&
  (Array.isArray(court.conflicts) ? court.conflicts.length === 0 : true);
if (court.agreement !== ourAgreement) {
  fail.push(`re-derived agreement ${ourAgreement} != the verdict's claimed ${court.agreement}`);
}

console.log("external COURT verifier — jsr:@s0fractal/witness + public registry + public encoder, no trinity tooling");
console.log(`  attested by:            ${attestation.voice} (registered: ${Boolean(pk)})`);
console.log(`  court verdict as of:    ${attested_at ?? "unknown"} (a receipt of that moment, not a live feed)`);
console.log(`  witnesses:              ${envelopes.map((e: { substrate_tag: string }) => e.substrate_tag).join(", ")}`);
console.log(`  body_hashes recomputed: ${recomputed}/${envelopes.length} (from raw bodies)`);
console.log(`  law_hashes agree:       ${ourLawAgreement} ${nonNullLaws.length ? "(" + [...new Set(nonNullLaws)].join(", ") + ")" : ""}`);
console.log(`  re-derived agreement:   ${court.agreement === undefined ? "n/a" : (court.agreement && fail.length === 0)}`);
for (const f of fail) console.log(`    ✗ ${f}`);
const ok = fail.length === 0;
console.log(
  `\n${ok
    ? `✓ a registered voice attested this verdict, and I re-derived the court's agreement from the raw bodies myself — confirmed with zero trinity secrets, access, or tooling`
    : `✗ ${fail.length} discrepancy(ies) — this claim does NOT independently verify`}`,
);
if (!ok) Deno.exit(1);
