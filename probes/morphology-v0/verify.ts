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

export async function checkShortPrefix(
  filename: string,
  content: string,
): Promise<ShortPrefixCheck> {
  const m = FILENAME_RE.exec(filename.split("/").pop() ?? "");
  if (!m) {
    return {
      filename,
      filename_prefix: null,
      content_prefix: "",
      match: false,
      note:
        "filename does not match x<hex><3hex>_ pattern (no prefix to check)",
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
const HASH_FIELD_RE =
  /^(content_hash|envelope_hash|sha256):\s*([0-9a-fA-F]{32,})/m;
// Strip the declared hash field from content before re-hashing to avoid
// the circular self-reference. Replaces "<key>: <hex>" with empty content
// while preserving the line so other byte-offset-dependent invariants
// (rare) remain stable; the line content itself becomes a fixed marker.
const HASH_FIELD_STRIP_RE =
  /^(content_hash|envelope_hash|sha256):\s*[0-9a-fA-F]{32,}\s*$/m;

function canonicalizeForHash(content: string): string {
  // Replace the declared hash field with a fixed placeholder so the
  // content hashes to a deterministic value regardless of what hash was
  // claimed. The placeholder preserves the field name to keep the YAML
  // structurally valid for parsing.
  return content.replace(
    HASH_FIELD_STRIP_RE,
    (_match, field) => `${field}: <stripped-for-hash>`,
  );
}

export async function checkFullHash(
  filename: string,
  content: string,
): Promise<FullHashCheck> {
  const fm = FULL_HASH_RE.exec(content);
  if (!fm) {
    const actual_hash = await sha256Hex(content);
    return {
      filename,
      declared_hash: null,
      actual_hash,
      match: false,
      note:
        "no frontmatter — full hash check requires declared hash in --- block",
    };
  }
  const declared = HASH_FIELD_RE.exec(fm[1]);
  if (!declared) {
    const actual_hash = await sha256Hex(content);
    return {
      filename,
      declared_hash: null,
      actual_hash,
      match: false,
      note: "frontmatter has no content_hash/envelope_hash/sha256 field",
    };
  }
  // Canonicalize content for hashing by stripping the declared hash field.
  // This avoids the circular self-reference (where the file contains the
  // hash of itself, so naive recomputation can never match).
  const canonical = canonicalizeForHash(content);
  const actual_hash = await sha256Hex(canonical);
  const declaredHash = declared[2].toLowerCase();
  const exactMatch = declaredHash === actual_hash;
  const prefixMatch = declaredHash.length < actual_hash.length &&
    actual_hash.startsWith(declaredHash);
  return {
    filename,
    declared_hash: declaredHash,
    actual_hash,
    match: exactMatch || prefixMatch,
    note: exactMatch
      ? "ok (exact, canonicalized)"
      : prefixMatch
      ? "ok (declared is prefix of canonical hash)"
      : `drift: declared ${
        declaredHash.slice(0, 16)
      }..., actual (canonicalized) ${actual_hash.slice(0, 16)}...`,
  };
}
