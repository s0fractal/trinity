// probes/fqdn-resolver-v0/resolver.ts — local-first FQDN resolution contract.
//
// Given an FQDN (for v0: a filename like `x9999_canon_demo.myc.md`), search an
// ORDERED set of roots and report every place it lives. The point is not just
// "find a file" — it is to make identity-vs-location explicit:
//
//   - resolved   : the precedence winner (first root, then shallowest, then lex)
//   - identity   : unique | mirrored | conflict | absent
//       mirrored = same name in N roots, ALL same content-hash → one true
//                  identity, copies; safe to dedup into a single node.
//       conflict = same name, DIFFERING hashes → different things colliding on a
//                  name; precedence resolves it, but this is the exact ambiguity
//                  that content-addressed naming (probes/blake3-fqdn-v0) removes.
//
// This is the filesystem generalisation of x5510_myc_proxy (the network case).

import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import {
  basename,
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";

export type MatchForm = "exact" | "handle";

export interface Candidate {
  root: string;
  rootIndex: number;
  path: string;
  rel: string;
  depth: number;
  size: number;
  hash: string; // sha256 hex of the bytes
  matchForm: MatchForm; // exact basename, or handle (coordinate prefix stripped)
}

export type Identity = "unique" | "mirrored" | "conflict" | "absent";

export interface Resolution {
  fqdn: string;
  resolved: Candidate | null;
  identity: Identity;
  candidates: Candidate[]; // all hits, in precedence order
}

const SKIP = /(^|\/)(node_modules|\.git)(\/|$)/;

// The coordinate prefix `x<hex>_` that names an organ/doc by its hex position.
// Stripping it turns `x5510_myc_proxy.ts` into the handle `myc_proxy.ts`, so a
// query may address a node WITH the prefix (exact) or WITHOUT it (handle).
const COORD_PREFIX = /^x[0-9A-Fa-f]+_/;

/** How a candidate basename matches a query, or null if it does not. */
function matchForm(base: string, query: string): MatchForm | null {
  if (base === query) return "exact";
  if (base.replace(COORD_PREFIX, "") === query) return "handle";
  return null;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // Copy into a fresh ArrayBuffer-backed view so the type is BufferSource-clean
  // regardless of how Deno.readFile typed its backing buffer.
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Resolve an FQDN (filename) across an ordered list of roots. Missing or
 * unreadable roots are skipped silently — local-first means "find it wherever it
 * happens to be", not "every root must exist".
 */
export async function resolveFqdn(
  fqdn: string,
  roots: string[],
): Promise<Resolution> {
  const candidates: Candidate[] = [];

  for (let i = 0; i < roots.length; i++) {
    const root = roots[i];
    const found: Candidate[] = [];
    try {
      for await (
        const e of walk(root, { includeDirs: false, followSymlinks: false })
      ) {
        if (SKIP.test(e.path)) continue;
        const form = matchForm(basename(e.path), fqdn);
        if (form === null) continue;
        const bytes = await Deno.readFile(e.path);
        const rel = relative(root, e.path);
        found.push({
          root,
          rootIndex: i,
          path: e.path,
          rel,
          depth: rel.split("/").length,
          size: bytes.byteLength,
          hash: await sha256Hex(bytes),
          matchForm: form,
        });
      }
    } catch {
      continue; // missing/unreadable root — skip, stay local-first
    }
    // Deterministic within-root order: exact match beats handle match, then
    // shallowest, then lexicographic.
    const rank = (c: Candidate) => (c.matchForm === "exact" ? 0 : 1);
    found.sort((a, b) =>
      rank(a) - rank(b) || a.depth - b.depth || a.rel.localeCompare(b.rel)
    );
    candidates.push(...found);
  }

  let identity: Identity;
  if (candidates.length === 0) identity = "absent";
  else if (candidates.length === 1) identity = "unique";
  else {
    identity = candidates.every((c) => c.hash === candidates[0].hash)
      ? "mirrored"
      : "conflict";
  }

  return { fqdn, resolved: candidates[0] ?? null, identity, candidates };
}

/** Default trinity roots, in precedence order: own substrate first, then federated submodules. */
export function defaultRoots(): string[] {
  // resolver.ts lives at <trinity>/probes/fqdn-resolver-v0/resolver.ts
  const trinity = dirname(dirname(dirname(fromFileUrl(import.meta.url))));
  return ["src", "liquid", "omega", "myc"].map((r) => join(trinity, r));
}

if (import.meta.main) {
  const fqdn = Deno.args[0];
  if (!fqdn) {
    console.error("usage: resolver.ts <fqdn-or-filename>");
    Deno.exit(1);
  }
  const res = await resolveFqdn(fqdn, defaultRoots());
  console.log(JSON.stringify(res, null, 2));
}
