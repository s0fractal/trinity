// hash.ts — content hash utility for probe
//
// Uses SHA-256 (matching trinity/src/x4010_hash.ts canonical impl) for
// portability. Algorithm choice is secondary per Codex tweak — the
// pattern is "filename position 2:5 must match hash[:3]". BLAKE3 (architect's
// preference) can drop in via one function swap if/when probe graduates.

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(body: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(body));
  return bytesToHex(new Uint8Array(buf));
}

/** 3-hex content_check_prefix: first 3 hex chars of SHA-256(content), uppercase.
 *  Per Codex cowitness 2026-05-18: this is an ALARM (drift detector), not an ADDRESS. */
export async function contentCheckPrefix(body: string): Promise<string> {
  const full = await sha256Hex(body);
  return full.slice(0, 3).toUpperCase();
}
