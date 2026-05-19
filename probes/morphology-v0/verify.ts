// verify.ts — content drift verification (short-prefix + full-hash modes)
//
// Two layers per Codex `x3500_950009`:
//   - SHORT-prefix: filename position [2:5] should match hash(content)[:3]
//     (cheap drift alarm; an alarm, not an identity)
//   - FULL-hash: envelope/frontmatter declares full hash; verifier confirms
//     bytes still match (load-bearing identity check)
//
// Probe uses SHA-256 for both. Algorithm can swap to BLAKE3 with one
// function replacement.

const encoder = new TextEncoder();

async function sha256Hex(body: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(body));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface ShortPrefixCheck {
  filename: string;
  filename_prefix: string | null;
  content_prefix: string;
  match: boolean;
  note: string;
}

const FILENAME_RE = /^x[0-9A-Fa-f]([0-9A-Fa-f]{3})_/;

export async function checkShortPrefix(filename: string, content: string): Promise<ShortPrefixCheck> {
  const m = FILENAME_RE.exec(filename.split("/").pop() ?? "");
  if (!m) {
    return {
      filename,
      filename_prefix: null,
      content_prefix: "",
      match: false,
      note: "filename does not match x<hex><3hex>_ pattern (no prefix to check)",
    };
  }
  const filenamePrefix = m[1].toUpperCase();
  const fullHash = await sha256Hex(content);
  const contentPrefix = fullHash.slice(0, 3).toUpperCase();
  return {
    filename,
    filename_prefix: filenamePrefix,
    content_prefix: contentPrefix,
    match: filenamePrefix === contentPrefix,
    note: filenamePrefix === contentPrefix
      ? "ok"
      : `drift: filename claims ${filenamePrefix}, content hashes to ${contentPrefix}`,
  };
}

export interface FullHashCheck {
  filename: string;
  declared_hash: string | null;
  actual_hash: string;
  match: boolean;
  note: string;
}

const FULL_HASH_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const HASH_FIELD_RE = /^(content_hash|envelope_hash|sha256):\s*([0-9a-fA-F]{32,})/m;

export async function checkFullHash(filename: string, content: string): Promise<FullHashCheck> {
  const actual_hash = await sha256Hex(content);
  const fm = FULL_HASH_RE.exec(content);
  if (!fm) {
    return {
      filename,
      declared_hash: null,
      actual_hash,
      match: false,
      note: "no frontmatter — full hash check requires declared hash in --- block",
    };
  }
  const declared = HASH_FIELD_RE.exec(fm[1]);
  if (!declared) {
    return {
      filename,
      declared_hash: null,
      actual_hash,
      match: false,
      note: "frontmatter has no content_hash/envelope_hash/sha256 field",
    };
  }
  // Note: when content includes its own hash, computing hash naively
  // gives circular dependency. Real impl would canonicalize (strip
  // declared_hash field before hashing). For probe v0 we accept that
  // bare content hash in frontmatter is illustrative, not load-bearing.
  const declaredHash = declared[2].toLowerCase();
  return {
    filename,
    declared_hash: declaredHash,
    actual_hash,
    match: declaredHash === actual_hash || declaredHash === actual_hash.slice(0, declaredHash.length),
    note: declaredHash === actual_hash
      ? "ok (exact)"
      : declaredHash === actual_hash.slice(0, declaredHash.length)
      ? "ok (prefix match)"
      : `drift: declared ${declaredHash.slice(0, 16)}..., actual ${actual_hash.slice(0, 16)}...`,
  };
}
