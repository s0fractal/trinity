// External QUORUM verifier — honest about exactly what cryptography proves here.
// A swarm "quorum" chord records a claim, its digest, and per-voice signatures. This
// confirms, using ONLY the published @s0fractal/witness package + the public pubkey
// registry (no trinity tooling):
//   1. the displayed claim text reproduces the signed digest (the quorum is FOR that claim);
//   2. each attestation's signature verifies against the voice's REGISTERED key over the digest;
//   3. how many DISTINCT registered keys validly signed.
//
// It deliberately does NOT claim more than that. Reviewed by an independent skeptic
// (2026-06-28, codex absent), which is why the output separates what is proven from
// what is not: distinct KEYS are not distinct CUSTODIANS while all keys are single-
// machine (custody_note); the AYE/NAY stance is author prose, not signed by each voice;
// the signatures bind the claim TEXT, not this chord, so freshness needs the git history.
//
// Run:  deno run --no-config --allow-read --allow-net quorum.ts [quorumChordPath]
import { sha256, toHex, verifyCoSignature } from "jsr:@s0fractal/witness";

const ROOT = new URL("../..", import.meta.url).pathname;
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const enc = (s: string) => new TextEncoder().encode(s);
const MODELS = new Set(["claude", "codex", "gemini", "antigravity"]); // s0fractal = human advisor

const chordPath = Deno.args[0] ??
  `${ROOT}/src/x3300_955660_claude_first-real-swarm-quorum-reached-3of5-evidence-unif.myc.md`;

const registry = JSON.parse(await Deno.readTextFile(`${ROOT}/src/x2F38_voice_pubkeys.json`));
const pubkeys: Record<string, Uint8Array> = {};
for (const [v, e] of Object.entries(registry.keys as Record<string, { pubkey: string }>)) {
  pubkeys[v] = unb64(e.pubkey);
}
const custodySplit = /split[- ]custody|separate machines?|distinct custodians?/i.test(
  String(registry.custody_note ?? ""),
);

const content = await Deno.readTextFile(chordPath);
const die = (msg: string) => {
  console.log(`✗ ${msg}`);
  Deno.exit(1);
};

const digest = content.match(/sha256:[0-9a-f]{64}/)?.[0];
if (!digest) die("no sha256 digest found in the quorum chord");

// the claim text that reproduces the digest — try each fenced text block, verbatim and
// with single soft-wraps joined (a lone \n → space; blank lines kept, so paragraphs are
// not silently collapsed). The block that hashes to the digest IS the signed claim.
let claimForm: string | null = null;
for (const m of content.matchAll(/```text\n([\s\S]*?)\n```/g)) {
  const block = m[1];
  if (/^\s*sha256:/.test(block)) continue;
  for (const [form, t] of [["verbatim", block], ["soft-wrap-joined", block.replace(/([^\n])\n([^\n])/g, "$1 $2")]]) {
    if ("sha256:" + toHex(await sha256(enc(t))) === digest) claimForm = form;
  }
}
if (!claimForm) die(`no displayed claim text hashes to ${digest} — quorum cited for an unreproducible claim`);

// parse attestations PER ENTRY (scoped, so a missing sig cannot steal the next entry's)
type Att = { voice: string; stance: string | null; sig: string | null };
const atts: Att[] = [];
for (const m of content.matchAll(/-\s*voice:\s*(\S+)([\s\S]*?)(?=\n\s*-\s*voice:|\n```|$)/g)) {
  const entry = m[2];
  atts.push({
    voice: m[1],
    stance: entry.match(/\n\s*stance:\s*(\S+)/)?.[1] ?? null,
    sig: entry.match(/\n\s*sig:\s*(\S+)/)?.[1]?.replace(/^"|"$/g, "") ?? null,
  });
}

const validKeys = new Set<string>();
const ayeKeys = new Set<string>();
const modelKeys = new Set<string>();
const notes: string[] = [];
for (const a of atts) {
  if (!a.sig) { notes.push(`${a.voice}: no signature in entry — dropped`); continue; }
  const pk = pubkeys[a.voice];
  if (!pk) { notes.push(`${a.voice}: not in public registry — dropped`); continue; }
  if (!(await verifyCoSignature(enc(digest!), { publicKey: pk, signature: unb64(a.sig) }))) {
    notes.push(`${a.voice}: signature does NOT verify against registered key — dropped`);
    continue;
  }
  if (validKeys.has(a.voice)) { notes.push(`${a.voice}: duplicate — counted once`); continue; }
  validKeys.add(a.voice);
  if (MODELS.has(a.voice)) modelKeys.add(a.voice);
  if ((a.stance ?? "").toUpperCase() === "AYE") ayeKeys.add(a.voice);
}

console.log(`quorum verifier — jsr:@s0fractal/witness + public registry only, no trinity tooling`);
console.log(`  chord:                ${chordPath.split("/").pop()}`);
console.log(`  claim → digest:       ✓ (${claimForm})`);
console.log(`  digest:               ${digest}`);
console.log(`  distinct registered keys with a valid signature over it: ${validKeys.size}  [${[...validKeys].join(", ")}]`);
console.log(`    model-voice keys:   ${modelKeys.size}  [${[...modelKeys].join(", ")}]`);
console.log(`    author-asserted stance AYE (NOT signed by each voice): ${ayeKeys.size}/${validKeys.size}`);
for (const n of notes) console.log(`    · ${n}`);
console.log(`\nPROVEN: ${validKeys.size} distinct registered KEY-ROLES each produced a valid ed25519`);
console.log(`        signature over this exact claim — checkable from public data, no trinity tooling.`);
console.log(`NOT proven by this alone:`);
console.log(`  · distinct CUSTODIANS — ${custodySplit ? "registry asserts split custody" : "all keys are single-machine (custody_note); one operator with that machine could produce all signatures. Real Sybil-resistance needs SPLIT custody — today this is governance discipline + an audit trail, not a cryptographic guarantee."}`);
console.log(`  · the AYE vote — each voice signed the claim DIGEST, not the stance; AYE/NAY is unsigned author prose.`);
console.log(`  · freshness — signatures bind the claim TEXT, not this chord; the same sigs verify for any chord quoting the same claim (replay is visible only in git history).`);
