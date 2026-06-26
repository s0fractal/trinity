// witness.ts — keyed multi-party co-signing. The keystone fix for the simulated
// quorum found across the federation: an identity is an ed25519 PUBLIC KEY, not a
// derivable function of a public name (omega's dipole) nor a bare signature_hash
// string (the receipt witness chain). A co-signature requires the matching PRIVATE
// key, so an m-of-n quorum genuinely needs m distinct key-holders — Sybil-resistant.
//
// Keyless by design: this module never persists a private key. The caller supplies a
// Witness (a public key + a sign() capability wired to their OWN custody — a file, an
// HSM, a KMS, anything). Custody stays entirely outside this package.

const ED = { name: "Ed25519" } as const;

/** An identity that can co-sign. The public key IS the identity. */
export interface Witness {
  publicKey: Uint8Array; // 32-byte ed25519 public key
  sign(digest: Uint8Array): Promise<Uint8Array>; // → 64-byte signature
}

/** A single party's signature over a content digest. */
export interface CoSignature {
  publicKey: Uint8Array; // who signed
  signature: Uint8Array; // 64-byte ed25519 over the digest
}

export interface QuorumResult {
  ok: boolean; // did distinct authorized signers reach the threshold?
  valid: number; // count of distinct authorized seats with a valid signature
  threshold: number;
  signers: string[]; // hex public keys that counted
}

export function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 of bytes — the content address a witness signs. */
export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", bytes as BufferSource),
  );
}

/** Adapt a WebCrypto Ed25519 keypair (held in YOUR custody) into a Witness. */
export async function witnessFromKeyPair(
  keyPair: CryptoKeyPair,
): Promise<Witness> {
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey),
  );
  return {
    publicKey,
    sign: async (digest) =>
      new Uint8Array(
        await crypto.subtle.sign(
          ED,
          keyPair.privateKey,
          digest as BufferSource,
        ),
      ),
  };
}

/**
 * Generate an EPHEMERAL witness keypair for the caller. This package persists
 * nothing; for production, hold keys in your own custody and use
 * `witnessFromKeyPair`. Returned `keyPair` is the caller's to store or discard.
 */
export async function generateWitness(): Promise<
  Witness & { keyPair: CryptoKeyPair }
> {
  const keyPair = await crypto.subtle.generateKey(ED, true, [
    "sign",
    "verify",
  ]) as CryptoKeyPair;
  return { ...(await witnessFromKeyPair(keyPair)), keyPair };
}

/** One party co-signs a content digest. */
export async function coSign(
  witness: Witness,
  digest: Uint8Array,
): Promise<CoSignature> {
  return {
    publicKey: witness.publicKey,
    signature: await witness.sign(digest),
  };
}

/** Verify a single co-signature locally — no host, just the signature math. */
export async function verifyCoSignature(
  digest: Uint8Array,
  coSig: CoSignature,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      coSig.publicKey as BufferSource,
      ED,
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      ED,
      key,
      coSig.signature as BufferSource,
      digest as BufferSource,
    );
  } catch {
    return false;
  }
}

/**
 * m-of-n quorum: how many DISTINCT authorized public keys validly signed the
 * digest? Only keys in `authorized` count, and each counts at most once — so a
 * single actor cannot reach the threshold without that many real private keys.
 */
export async function verifyQuorum(
  digest: Uint8Array,
  coSignatures: CoSignature[],
  authorized: Uint8Array[],
  threshold: number,
): Promise<QuorumResult> {
  const authSet = new Set(authorized.map(toHex));
  const counted = new Set<string>();
  for (const cs of coSignatures) {
    const pk = toHex(cs.publicKey);
    if (!authSet.has(pk) || counted.has(pk)) continue; // unauthorized or duplicate
    if (await verifyCoSignature(digest, cs)) counted.add(pk);
  }
  return {
    ok: counted.size >= threshold,
    valid: counted.size,
    threshold,
    signers: [...counted],
  };
}
