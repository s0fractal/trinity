// getter.ts — coordinate resolver across multiple storage roots
//
// Per Codex `x3500_950008_src-as-semantic-address-space.md`, recoverable_via
// can be one of:
//   git | hash | log | p2p | ipfs | inscription
//
// Probe v0 implements two roots:
//   - live: ./sample/    (current substrate-addressed matter)
//   - archive: ./archive/ (decayed/externalized raw artifacts)
//
// Real impl would extend with: git log (recover deleted), IPFS gateway,
// Bitcoin inscription payload reader, distributed log query. Probe just
// proves the multi-root resolution shape works.

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const LIVE_ROOT = join(HERE, "sample");
const ARCHIVE_ROOT = join(HERE, "archive");

export type StorageRoot = "live" | "archive" | "not_found";

export interface GetterResult {
  coordinate: string;
  found_in: StorageRoot;
  path: string | null;
  content: string | null;
  note: string;
}

async function searchRoot(
  root: string,
  coordinate: string,
): Promise<{ path: string; content: string } | null> {
  try {
    for await (const entry of Deno.readDir(root)) {
      if (!entry.isFile) continue;
      // Match x<coordinate>_* prefix
      if (
        !entry.name.startsWith(`x${coordinate.toUpperCase()}_`) &&
        !entry.name.startsWith(`x${coordinate.toLowerCase()}_`)
      ) continue;
      const path = join(root, entry.name);
      const content = await Deno.readTextFile(path);
      return { path, content };
    }
  } catch {
    return null;
  }
  return null;
}

export async function getByCoordinate(
  coordinate: string,
): Promise<GetterResult> {
  // Try live first
  const live = await searchRoot(LIVE_ROOT, coordinate);
  if (live) {
    return {
      coordinate,
      found_in: "live",
      path: live.path,
      content: live.content,
      note: "resolved from live root",
    };
  }
  // Fall back to archive
  const archive = await searchRoot(ARCHIVE_ROOT, coordinate);
  if (archive) {
    return {
      coordinate,
      found_in: "archive",
      path: archive.path,
      content: archive.content,
      note:
        "resolved from archive (artifact decayed from live but recoverable)",
    };
  }
  return {
    coordinate,
    found_in: "not_found",
    path: null,
    content: null,
    note:
      "not found in live or archive — would consult git log / IPFS / inscription resolvers in real impl",
  };
}
