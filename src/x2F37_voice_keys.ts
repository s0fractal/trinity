#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env
// src/x2F37_voice_keys.ts — per-voice Ed25519 identity: mint, sign, verify.
// position: 2/F37 → mirror(2) × frontier-pair(F) = FQDN sovereignty keys
// maturity: active
// horizon: none (V2 infrastructure landed; custody ceremony is the architect's)
// skill_tag: resolve-fqdn
// skill_safe: yes-with-care
//   (keygen writes a PRIVATE key under ~/.trinity/keys/ — outside the repo,
//   never committed; sign reads it. verify/registry paths are read-only.)
// hex_dipole: "00 00 59 00 40 26 00 33"
// placement_policy: axis
// (character: mirror_apex +0.70 — identity is reflection made verifiable;
//  foundation_container +0.50 — carries the trust floor for the quorum;
//  completion_frontier +0.40 — closes the attestation seam; action_decision
//  +0.30 — sign/verify are small decisive acts. Measured by claude-fable-5.)
//
// THE SEAM THIS FILLS: x2F36_fqdn_sovereignty counts an AYE as "authenticated"
// only when its signature is cryptographically VERIFIED against the committed
// per-voice public-key registry. This organ provides mint/sign/verify; the
// registry (src/x2F38_voice_pubkeys.json) is committed but starts EMPTY —
// minting real voice keys is a custody ceremony that belongs to the architect
// (consensus-root sovereignty: keys stay with the architect, 2026-06-08).
//
// Custody model:
//   private key  → ~/.trinity/keys/<voice>.ed25519.json  (NEVER in the repo)
//   public key   → printed as a registry entry; the architect commits it to
//                  src/x2F38_voice_pubkeys.json via a decision chord
//
// Subcommands (via `deno task voice-keys -- <sub>`):
//   keygen --voice=N            Mint a keypair; write private key outside the
//                               repo; print the public registry entry to commit
//   sign --voice=N --hash=H     Sign a content hash (e.g. content_blake3) with
//                               the voice's private key → base64 signature
//   verify --voice=N --hash=H --sig=S
//                               Verify a signature against the registry
//   registry                    Print the committed registry state
//
// Glossary words: voice-keys, ключі, підпис, signature

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const REGISTRY_PATH = join(HERE, "x2F38_voice_pubkeys.json");

export interface RegistryEntry {
  alg: "ed25519";
  pubkey: string; // base64 raw 32-byte Ed25519 public key
  minted_at: string;
  minted_by: string; // custody holder who ran the ceremony
}

export interface Registry {
  schema: string;
  custody_note: string;
  keys: Record<string, RegistryEntry>;
}

const EMPTY_REGISTRY: Registry = {
  schema: "trinity.voice-pubkeys.v0.1",
  custody_note:
    "Public keys only. Private keys live outside the repo (~/.trinity/keys). " +
    "Adding/rotating an entry is a custody ceremony: architect mints via " +
    "`voice-keys keygen` and commits the entry with a decision chord.",
  keys: {},
};

// ── encoding helpers ────────────────────────────────────────────────────────

function b64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function unb64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ── registry ────────────────────────────────────────────────────────────────

export async function loadRegistry(
  path: string = REGISTRY_PATH,
): Promise<Registry> {
  try {
    return JSON.parse(await Deno.readTextFile(path)) as Registry;
  } catch {
    return structuredClone(EMPTY_REGISTRY);
  }
}

// ── crypto core ─────────────────────────────────────────────────────────────

export async function signHash(
  contentHash: string,
  privateKeyB64: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    unb64(privateKeyB64),
    "Ed25519",
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "Ed25519",
    key,
    new TextEncoder().encode(contentHash),
  );
  return b64(sig);
}

export async function verifySig(
  contentHash: string,
  sigB64: string,
  pubkeyB64: string,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      unb64(pubkeyB64),
      "Ed25519",
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      unb64(sigB64),
      new TextEncoder().encode(contentHash),
    );
  } catch {
    return false; // malformed key/sig is a failed verification, not a crash
  }
}

/** Mint a keypair. Returns the registry entry and the pkcs8 private key. */
export async function mintKeypair(mintedBy: string): Promise<{
  entry: RegistryEntry;
  privateKeyB64: string;
}> {
  const kp = await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ]) as CryptoKeyPair;
  const pub = await crypto.subtle.exportKey("raw", kp.publicKey);
  const priv = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  return {
    entry: {
      alg: "ed25519",
      pubkey: b64(pub),
      minted_at: new Date().toISOString(),
      minted_by: mintedBy,
    },
    privateKeyB64: b64(priv),
  };
}

// ── the seam into x2F36 ─────────────────────────────────────────────────────

/** Minimal structural shape of an attestation this organ can verify.
 *  (x2F36 owns the full Attestation type; importing it here would be a
 *  same-bucket cycle — x2F36 stays pure-logic, this organ does IO+crypto.) */
export interface SignedAttestation {
  voice: string;
  content_blake3: string;
  sig?: string;
  sig_verified?: boolean;
}

/**
 * Verify every signed attestation against the committed registry.
 * - valid signature           → sig_verified: true
 * - missing signature         → passes through (counts as unauthenticated)
 * - forged/unknown-key sig    → DROPPED with a loud reason: a forged voice
 *   must not count even as an unauthenticated AYE.
 * Generic so callers (x2F36 Attestation et al.) keep their full type.
 */
export async function verifyAttestations<T extends SignedAttestation>(
  attestations: T[],
  registry?: Registry,
): Promise<{ verified: (T & { sig_verified: boolean })[]; dropped: string[] }> {
  const reg = registry ?? await loadRegistry();
  const verified: (T & { sig_verified: boolean })[] = [];
  const dropped: string[] = [];
  for (const a of attestations) {
    if (!a.sig) {
      verified.push({ ...a, sig_verified: false });
      continue;
    }
    const entry = reg.keys[a.voice];
    if (!entry) {
      dropped.push(
        `${a.voice}: signed but no registry pubkey — dropped (unverifiable claim of identity)`,
      );
      continue;
    }
    const ok = await verifySig(a.content_blake3, a.sig, entry.pubkey);
    if (!ok) {
      dropped.push(
        `${a.voice}: signature INVALID for ${
          a.content_blake3.slice(0, 12)
        }… — dropped (possible forgery)`,
      );
      continue;
    }
    verified.push({ ...a, sig_verified: true });
  }
  return { verified, dropped };
}

// ── chord content signatures ────────────────────────────────────────────────
// A chord's provenance upgrades from narrative to cryptographic: the authoring
// voice signs sha256(filename + "\n" + body) — filename binds the role address
// (fqdn), body is everything after the closing frontmatter fence. The
// signature block lives IN the frontmatter, so it cannot cover the
// frontmatter itself; body+name is the canonical claim being signed.

export function chordBody(fullContent: string): string | null {
  const m = fullContent.match(/^---\n[\s\S]*?\n---\n?/);
  if (!m) return null;
  return fullContent.slice(m[0].length);
}

export async function chordPayloadHash(
  filename: string,
  fullContent: string,
): Promise<string | null> {
  const body = chordBody(fullContent);
  if (body === null) return null;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${filename}\n${body}`),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}

/** Voice family key for chord signing (claude-fable-5 → claude). */
export function voiceFamily(voice: string): string {
  return voice.split("-")[0].toLowerCase();
}

/** Try to sign a chord's content with the authoring voice's local key.
 *  Returns frontmatter lines to insert, or null when no key / no permission —
 *  unsigned chords stay legal (keyless-mode discipline). */
export async function signChordContent(
  voice: string,
  filename: string,
  fullContent: string,
): Promise<string[] | null> {
  try {
    const family = voiceFamily(voice);
    const home = Deno.env.get("HOME") ?? ".";
    const keyPath = join(home, ".trinity", "keys", `${family}.ed25519.json`);
    const stored = JSON.parse(await Deno.readTextFile(keyPath));
    const hash = await chordPayloadHash(filename, fullContent);
    if (!hash) return null;
    const sig = await signHash(hash, stored.private_key_pkcs8);
    return [
      "content_sig:",
      `  voice: ${family}`,
      "  alg: ed25519",
      `  payload: "${hash}"`,
      `  sig: "${sig}"`,
    ];
  } catch {
    return null;
  }
}

/** Re-sign an existing chord file in place: strip any previous content_sig,
 *  hash the CURRENT body, sign with the authoring voice's key, insert the
 *  fresh block. The intended flow is init → edit body → sign-chord → git add
 *  (a signature made at init dies the moment the body is edited — by design;
 *  verify reports exactly that). */
export async function resignChordFile(
  path: string,
): Promise<{ ok: boolean; voice: string | null; reason?: string }> {
  let content = await Deno.readTextFile(path);
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) return { ok: false, voice: null, reason: "no frontmatter" };
  const voice = fmMatch[1].match(/^voice:\s*(\S+)/m)?.[1] ?? null;
  if (!voice) return { ok: false, voice: null, reason: "no voice field" };

  // Strip a previous content_sig block (key line + its indented children).
  const cleanedFm = fmMatch[1]
    .replace(/\ncontent_sig:(\n {2}.*)*$/m, "")
    .replace(/^content_sig:(\n {2}.*)*\n/m, "");
  content = `---\n${cleanedFm}\n---\n` + content.slice(fmMatch[0].length);

  const filename = path.split("/").pop()!;
  const sigLines = await signChordContent(voice, filename, content);
  if (!sigLines) {
    return {
      ok: false,
      voice,
      reason: `no local key for ${voiceFamily(voice)}`,
    };
  }
  const closing = content.indexOf("\n---\n", 4);
  const updated = content.slice(0, closing + 1) + sigLines.join("\n") +
    content.slice(closing);
  await Deno.writeTextFile(path, updated);
  return { ok: true, voice };
}

/** Verify a chord file's content_sig against the committed registry. */
export async function verifyChordFile(
  path: string,
  registry?: Registry,
): Promise<{
  signed: boolean;
  valid: boolean;
  voice: string | null;
  reasons: string[];
}> {
  const reg = registry ?? await loadRegistry();
  const content = await Deno.readTextFile(path);
  const fm = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const voice = fm.match(/^content_sig:[\s\S]*?\n\s+voice:\s*(\S+)/m)?.[1] ??
    null;
  const payload =
    fm.match(/^content_sig:[\s\S]*?\n\s+payload:\s*"([^"]+)"/m)?.[1] ?? null;
  const sig = fm.match(/^content_sig:[\s\S]*?\n\s+sig:\s*"([^"]+)"/m)?.[1] ??
    null;
  if (!voice || !payload || !sig) {
    return {
      signed: false,
      valid: false,
      voice: null,
      reasons: ["no content_sig block"],
    };
  }
  const filename = path.split("/").pop()!;
  const expected = await chordPayloadHash(filename, content);
  const reasons: string[] = [];
  if (expected !== payload) {
    reasons.push(
      `payload hash mismatch: frontmatter pins ${payload}, body hashes to ${expected} — body or filename edited after signing`,
    );
  }
  const entry = reg.keys[voice];
  if (!entry) {
    reasons.push(`voice ${voice} has no registry pubkey`);
    return { signed: true, valid: false, voice, reasons };
  }
  const ok = await verifySig(payload, sig, entry.pubkey);
  if (!ok) reasons.push("signature does not verify against registry pubkey");
  return {
    signed: true,
    valid: ok && expected === payload,
    voice,
    reasons,
  };
}

/** Verify every signed chord in a directory against the registry.
 *  Unsigned chords are counted but never fail — keyless mode stays legal.
 *  A signed chord that does NOT verify is an integrity failure: either the
 *  body was edited after signing or the signature is forged. */
export async function verifyAllChords(
  srcDir: string,
  registry?: Registry,
): Promise<{
  total: number;
  signed: number;
  valid: number;
  invalid: number;
  failures: { file: string; reasons: string[] }[];
}> {
  const reg = registry ?? await loadRegistry();
  let total = 0, signed = 0, valid = 0;
  const failures: { file: string; reasons: string[] }[] = [];
  const names: string[] = [];
  for await (const entry of Deno.readDir(srcDir)) {
    if (entry.isFile && entry.name.endsWith(".myc.md")) names.push(entry.name);
  }
  names.sort();
  for (const name of names) {
    total++;
    const path = join(srcDir, name);
    const content = await Deno.readTextFile(path);
    if (!/^content_sig:/m.test(content)) continue;
    signed++;
    const v = await verifyChordFile(path, reg);
    if (v.valid) valid++;
    else failures.push({ file: name, reasons: v.reasons });
  }
  return { total, signed, valid, invalid: failures.length, failures };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function flagValue(args: string[], name: string): string | undefined {
  return args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1)
    .join("=");
}

async function main() {
  const [cmd, ...rest] = Deno.args;
  const out = (o: unknown) => console.log(JSON.stringify(o, null, 2));

  switch (cmd) {
    case "keygen": {
      const voice = flagValue(rest, "voice");
      if (!voice) {
        console.error("usage: keygen --voice=NAME [--minted-by=WHO]");
        Deno.exit(1);
      }
      const mintedBy = flagValue(rest, "minted-by") ?? "s0fractal";
      const home = Deno.env.get("HOME") ?? ".";
      const keyDir = join(home, ".trinity", "keys");
      const keyPath = join(keyDir, `${voice}.ed25519.json`);
      try {
        await Deno.stat(keyPath);
        console.error(
          `refusing to overwrite existing private key: ${keyPath}\n` +
            "(rotate explicitly: move the old key away first)",
        );
        Deno.exit(1);
      } catch { /* absent — safe to mint */ }
      const { entry, privateKeyB64 } = await mintKeypair(mintedBy);
      await Deno.mkdir(keyDir, { recursive: true });
      await Deno.writeTextFile(
        keyPath,
        JSON.stringify(
          { voice, alg: entry.alg, private_key_pkcs8: privateKeyB64 },
          null,
          2,
        ) + "\n",
        { mode: 0o600 },
      );
      out({
        type: "voice_keygen",
        voice,
        private_key: keyPath,
        registry_entry: { [voice]: entry },
        next: [
          `add the registry_entry to src/x2F38_voice_pubkeys.json under .keys`,
          `record the ceremony as a decision chord (custody: ${mintedBy})`,
        ],
      });
      break;
    }
    case "sign": {
      const voice = flagValue(rest, "voice");
      const hash = flagValue(rest, "hash");
      if (!voice || !hash) {
        console.error("usage: sign --voice=NAME --hash=CONTENT_HASH");
        Deno.exit(1);
      }
      const home = Deno.env.get("HOME") ?? ".";
      const keyPath = join(home, ".trinity", "keys", `${voice}.ed25519.json`);
      const stored = JSON.parse(await Deno.readTextFile(keyPath));
      const sig = await signHash(hash, stored.private_key_pkcs8);
      out({ type: "voice_sign", voice, content_hash: hash, sig });
      break;
    }
    case "verify": {
      const voice = flagValue(rest, "voice");
      const hash = flagValue(rest, "hash");
      const sig = flagValue(rest, "sig");
      if (!voice || !hash || !sig) {
        console.error("usage: verify --voice=NAME --hash=HASH --sig=SIG");
        Deno.exit(1);
      }
      const reg = await loadRegistry();
      const entry = reg.keys[voice];
      const valid = entry ? await verifySig(hash, sig, entry.pubkey) : false;
      out({
        type: "voice_verify",
        voice,
        valid,
        registered: Boolean(entry),
      });
      Deno.exit(valid ? 0 : 1);
      break;
    }
    case "registry": {
      out({ type: "voice_registry", ...await loadRegistry() });
      break;
    }
    case "sign-chord": {
      const path = rest.find((a) => !a.startsWith("--"));
      if (!path) {
        console.error("usage: sign-chord <path-to-chord.myc.md>");
        Deno.exit(1);
      }
      const result = await resignChordFile(path);
      out({ type: "chord_sign", path, ...result });
      Deno.exit(result.ok ? 0 : 1);
      break;
    }
    case "verify-all": {
      const dir = rest.find((a) => !a.startsWith("--")) ?? HERE;
      const result = await verifyAllChords(dir);
      out({ type: "chord_sig_verify_all", dir, ...result });
      Deno.exit(result.invalid === 0 ? 0 : 1);
      break;
    }
    case "verify-chord": {
      const path = rest.find((a) => !a.startsWith("--"));
      if (!path) {
        console.error("usage: verify-chord <path-to-chord.myc.md>");
        Deno.exit(1);
      }
      const result = await verifyChordFile(path);
      out({ type: "chord_sig_verify", path, ...result });
      Deno.exit(result.signed && result.valid ? 0 : 1);
      break;
    }
    default:
      console.error(
        "voice-keys — per-voice Ed25519 identity\n\n" +
          "subcommands: keygen --voice=N | sign --voice=N --hash=H | " +
          "verify --voice=N --hash=H --sig=S | registry | " +
          "sign-chord <path> | verify-chord <path>",
      );
      Deno.exit(cmd ? 1 : 0);
  }
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(`error: ${e.message}`);
    Deno.exit(1);
  });
}
