// src/x2F30_fqdn_resolver.ts — local-first FQDN resolution contract.
// position: 2/F30 → mirror(2) × frontier-pair(F) = FQDN resolver
// hex_dipole: "26 26 6C 26 26 26 26 26"
//   mirror_apex+0.85 (reflects FQDN resolution mirroring/mapping; bucket 2 MATCH)
// placement_policy: axis
// maturity: active
// horizon: none (graduation completed)
// skill_tag: resolve-fqdn
// skill_safe: yes
// intent: resolve an FQDN to candidate paths, check uniqueness/mirrors/conflicts
//
// Given an FQDN, report every place it lives across an ORDERED set of roots, and
// whether those hits are one identity or several things colliding on a name:
//
//   resolved : precedence winner — root order, then exact>handle>slug, then
//              shallowest, then lexicographic. Deterministic.
//   identity : unique | mirrored | conflict | absent
//       mirrored = N hits, ALL same sha256 → one true identity, copies; safe to
//                  collapse into a single node.
//       conflict = N hits, DIFFERING sha256 → different things sharing a name;
//                  precedence resolves it, content-addressing (blake3-fqdn-v0)
//                  removes it.
//
// A node is addressable three ways (matchForm):
//   exact  — full basename            x5510_myc_proxy.ts
//   handle — coordinate prefix gone   myc_proxy.ts
//   slug   — chord <slug> only        fqdn-unify-...segment.myc.md
//
// "Find anywhere" cannot mean "walk all of ~" per query, so resolution goes
// through an INDEX: walk the roots once (buildIndex), then resolve many queries
// against it (resolveFromIndex), hashing only the files a query actually hits.
// This is the filesystem generalisation of x5510_myc_proxy (the network case).

import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import {
  basename,
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { blake3 } from "npm:@noble/hashes@1.4.0/blake3";

export type MatchForm = "exact" | "handle" | "slug";

export interface Candidate {
  root: string;
  rootIndex: number;
  path: string;
  rel: string;
  depth: number;
  size: number;
  hash: string; // BLAKE3-256 hex — same regime as SPORE apply (not a fresh sha256)
  matchForm: MatchForm;
}

export type Identity = "unique" | "mirrored" | "conflict" | "absent";

export interface Resolution {
  fqdn: string;
  resolved: Candidate | null;
  identity: Identity;
  candidates: Candidate[]; // all hits, in precedence order
}

// Skip dependency/build-output dirs and any HIDDEN directory: they are
// gitignored or infra, hold no meaningful FQDN content, and otherwise drown the
// namespace — omega's Rust `target/` alone adds ~19k `.o` artifacts, and
// liquid's `.liquid/` runtime dir adds ~59 `.sqlite`/`.bin` state files. The
// hidden-dir clause (`/.<name>/`) generalizes the old `.git` skip to `.liquid`,
// `.github`, `.vscode`, `.cargo`, etc. Matched as full path components, so a
// file named `target.md` — and a hidden FILE like `.gitignore` — are kept.
// IMPORTANT: callers test the path RELATIVE to the root, never the absolute
// path, so a root that itself lives under a hidden dir (e.g. the cloud memory
// root `~/.claude/.../memory`) is not wrongly skipped.
const SKIP = /(^|\/)(node_modules|target)(\/|$)|(^|\/)\.[^/]+\//;

/** True if a (root-relative) path lies in a dependency/build/hidden directory
 *  the index skips. Matches only full path components — `target.md` and the
 *  hidden file `.gitignore` are content; `target/x.o` and `.liquid/db.sqlite`
 *  are not. Exported for the test. */
export function isSkippedPath(path: string): boolean {
  return SKIP.test(path);
}

// The coordinate prefix `x<hex>_` that names an organ/doc by its hex position.
const COORD_PREFIX = /^x[0-9A-Fa-f]+_/;

// Chord filenames carry `x<hex>_<block>_<voice>_<slug>`, where <block> is a
// bitcoin height (digits) or legacy `t<timestamp>`, and <voice> is a model
// handle (lowercase, hyphens/dots, no underscores). Organs do not match — their
// first post-coordinate segment is not digits — so this never mis-fires.
const CHORD_BODY = /^(?:t?\d+)_[a-z0-9.-]+_(.+)$/;

const RANK: Record<MatchForm, number> = { exact: 0, handle: 1, slug: 2 };

// BLAKE3-256 hex — deliberately the SAME hash regime SPORE apply uses for its
// multihash fields, so a resolved node's content identity is spore-compatible
// (one substrate, not two). See ./apply.ts and probes/spore-apply-v0.
function blake3Hex(bytes: Uint8Array): string {
  return Array.from(blake3(bytes), (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** The address forms a basename answers to, each with its matchForm. */
function formsOf(base: string): Array<{ key: string; form: MatchForm }> {
  const out: Array<{ key: string; form: MatchForm }> = [
    { key: base, form: "exact" },
  ];
  const handle = base.replace(COORD_PREFIX, "");
  if (handle !== base) out.push({ key: handle, form: "handle" });
  const slugMatch = handle.match(CHORD_BODY);
  const slug = slugMatch ? slugMatch[1] : null;
  if (slug !== null && slug !== handle && slug !== base) {
    out.push({ key: slug, form: "slug" });
  }
  return out;
}

interface Stored {
  root: string;
  rootIndex: number;
  path: string;
  rel: string;
  depth: number;
  matchForm: MatchForm;
}

// A root is a path, optionally depth-bounded (bound large/cloud roots, leave
// substrate roots unbounded — never walk all of ~).
export type Root = string | { path: string; maxDepth?: number };

export interface Index {
  roots: string[];
  byKey: Map<string, Stored[]>;
  files: number; // files indexed
}

/**
 * Walk the roots ONCE and index every file under each address form it answers
 * to. Missing/unreadable roots are skipped — local-first means "wherever it
 * happens to be", not "every root must exist".
 */
export async function buildIndex(roots: Root[]): Promise<Index> {
  const byKey = new Map<string, Stored[]>();
  const paths: string[] = [];
  let files = 0;
  for (let i = 0; i < roots.length; i++) {
    const r = roots[i];
    const root = typeof r === "string" ? r : r.path;
    const maxDepth = typeof r === "string"
      ? Infinity
      : (r.maxDepth ?? Infinity);
    paths.push(root);
    try {
      for await (
        const e of walk(root, {
          includeDirs: false,
          followSymlinks: false,
          maxDepth,
        })
      ) {
        const rel = relative(root, e.path);
        // Test the ROOT-RELATIVE path: a root under a hidden dir (e.g. the
        // cloud memory root) must not be skipped wholesale.
        if (isSkippedPath(rel)) continue;
        files++;
        const base = basename(e.path);
        for (const { key, form } of formsOf(base)) {
          const arr = byKey.get(key) ?? [];
          arr.push({
            root,
            rootIndex: i,
            path: e.path,
            rel,
            depth: rel.split("/").length,
            matchForm: form,
          });
          byKey.set(key, arr);
        }
      }
    } catch {
      continue; // missing/unreadable root — skip, stay local-first
    }
  }
  return { roots: paths, byKey, files };
}

// What KIND of thing a name addresses — derived from the name alone (cheap, no
// file read), so discovery can tell a function from knowledge from a record:
//   organ  — .ts code (a runnable/importable function)
//   test   — .ts test
//   chord  — .myc.md whose name carries a chord body (block_voice_slug): a record
//   doc    — .myc.md / .md prose (knowledge)
//   data   — .json
//   script — .sh   |   rust — .rs   |   other — anything else
export type NameKind =
  | "organ"
  | "test"
  | "chord"
  | "doc"
  | "data"
  | "script"
  | "rust"
  | "other";

export function kindOf(name: string): NameKind {
  if (name.endsWith("_test.ts")) return "test";
  if (name.endsWith(".ts")) return "organ";
  if (name.endsWith(".myc.md") || name.endsWith(".md")) {
    const handle = name.replace(COORD_PREFIX, "");
    return CHORD_BODY.test(handle) ? "chord" : "doc";
  }
  if (name.endsWith(".json")) return "data";
  if (name.endsWith(".sh")) return "script";
  if (name.endsWith(".rs")) return "rust";
  return "other";
}

export interface NameEntry {
  name: string; // canonical (exact-form) address
  kind: NameKind; // function / knowledge / record, from the name alone
  candidates: number; // how many files answer to it exactly
  roots: string[]; // distinct root names (src, liquid, omega, myc) carrying it
}

/**
 * Discovery: enumerate the resolvable namespace from a prebuilt index without
 * hashing anything (cheap structural view — the complement of resolveFromIndex,
 * which hashes a single query). Canonical names are the exact-form keys; handle
 * and slug aliases are folded out so the list is the set of addresses a name
 * actually IS, not the aliases it also answers to. Optional substring filter,
 * bounded with an explicit truncation count (no silent caps).
 */
export function listNames(
  index: Index,
  opts: { substring?: string; limit?: number; kind?: NameKind } = {},
): {
  total: number;
  shown: NameEntry[];
  truncated: number;
  by_kind: Record<string, number>;
} {
  const sub = opts.substring?.toLowerCase();
  const limit = opts.limit ?? 50;
  const entries: NameEntry[] = [];
  const by_kind: Record<string, number> = {};
  for (const [key, stored] of index.byKey) {
    const exact = stored.filter((s) => s.matchForm === "exact");
    if (exact.length === 0) continue; // alias-only key — not a canonical name
    if (sub && !key.toLowerCase().includes(sub)) continue;
    const kind = kindOf(key);
    if (opts.kind && kind !== opts.kind) continue;
    const roots = [...new Set(exact.map((s) => basename(s.root)))].sort();
    entries.push({ name: key, kind, candidates: exact.length, roots });
    by_kind[kind] = (by_kind[kind] ?? 0) + 1;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const total = entries.length;
  const shown = entries.slice(0, limit);
  return {
    total,
    shown,
    truncated: Math.max(0, total - shown.length),
    by_kind,
  };
}

/** Resolve one query against a prebuilt index, hashing only the files it hits. */
export async function resolveFromIndex(
  index: Index,
  query: string,
): Promise<Resolution> {
  const stored = index.byKey.get(query) ?? [];
  const candidates: Candidate[] = [];
  for (const s of stored) {
    const bytes = await Deno.readFile(s.path);
    candidates.push({ ...s, size: bytes.byteLength, hash: blake3Hex(bytes) });
  }
  candidates.sort((a, b) =>
    a.rootIndex - b.rootIndex ||
    RANK[a.matchForm] - RANK[b.matchForm] ||
    a.depth - b.depth ||
    a.rel.localeCompare(b.rel)
  );

  let identity: Identity;
  if (candidates.length === 0) identity = "absent";
  else if (candidates.length === 1) identity = "unique";
  else {
    identity = candidates.every((c) => c.hash === candidates[0].hash)
      ? "mirrored"
      : "conflict";
  }
  return { fqdn: query, resolved: candidates[0] ?? null, identity, candidates };
}

/** Single-shot convenience: build an index over `roots` and resolve one query. */
export async function resolveFqdn(
  fqdn: string,
  roots: Root[],
): Promise<Resolution> {
  return await resolveFromIndex(await buildIndex(roots), fqdn);
}

/** Largest content `--show` will dump inline; above this, header-only with a
 *  pointer to the path (no silent truncation of what people see). */
const MAX_SHOW_BYTES = 1_000_000;

/** A content-addressed name: basename of the form `h.<hex>.….myc.md`, where the
 *  `h.<hex>` segment is the owning substrate's content-address. The resolver
 *  locates these but does not (and should not) re-derive that address — regimes
 *  are substrate-specific. Used only to caption `--show` honestly. */
export function isContentAddressed(relOrName: string): boolean {
  const base = relOrName.split("/").pop() ?? relOrName;
  return /^h\.[0-9a-f]{6,}\./i.test(base);
}

/** Pure provenance header for `--show`: the #-comment lines printed above the
 *  content. Empty array means absent (nothing to show). Surfaces mirrored copies
 *  and — for conflict — warns the winner is one of several differing things and
 *  lists the others. Pure so it can be tested without stdout/fs. */
export function showHeader(res: Resolution): string[] {
  if (!res.resolved) return [];
  const r = res.resolved;
  const lines = [
    `# resolve --show: ${res.fqdn}`,
    `# resolved: ${r.rel} @ ${r.root}  (${r.matchForm}, identity=${res.identity})`,
    `# hash: blake3:${r.hash}  size: ${r.size}B`,
  ];
  // A content-addressed name (h.<hash>.…) embeds the OWNING SUBSTRATE's
  // content-address, computed in that substrate's regime — not the resolver's
  // blake3. Say so, so the blake3 above is never mistaken for a check of the
  // name's hash. Verifying name == content is the substrate resolver's job.
  if (isContentAddressed(r.rel)) {
    lines.push(
      `# note: this name is content-addressed; the blake3 above is the resolver's federation-identity hash, NOT a check of the name's embedded address — verify that with the owning substrate's resolver.`,
    );
  }
  if (res.identity === "mirrored") {
    lines.push(
      `# mirrored: ${res.candidates.length} identical copies — showing the precedence winner.`,
    );
  }
  if (res.identity === "conflict") {
    lines.push(
      `# CONFLICT: ${res.candidates.length} files share this name with DIFFERING content.`,
    );
    lines.push(`# showing the precedence winner above; others:`);
    for (const c of res.candidates.slice(1)) {
      lines.push(`#   - ${c.rel} @ ${c.root}  blake3:${c.hash.slice(0, 12)}`);
    }
  }
  lines.push("# ──────");
  return lines;
}

/** `--show`: deliver the addressed content, not just its location — the last
 *  verb of the read side ("resolve one to its content"). Prints the provenance
 *  header then the raw bytes, so it stays pipeable. Returns the exit code. */
export async function renderShow(res: Resolution): Promise<number> {
  if (!res.resolved) {
    console.error(
      `# resolve --show: '${res.fqdn}' is absent — nothing to show. Try 't resolve list ${res.fqdn}'.`,
    );
    return 1;
  }
  const r = res.resolved;
  console.log(showHeader(res).join("\n"));
  if (r.size > MAX_SHOW_BYTES) {
    console.log(
      `# (content omitted: ${r.size}B exceeds the ${MAX_SHOW_BYTES}B show limit — open ${r.path})`,
    );
    return 0;
  }
  try {
    console.log(await Deno.readTextFile(r.path));
  } catch {
    console.log(`# (non-text or unreadable content — open ${r.path})`);
  }
  return 0;
}

/** Default trinity roots, precedence order: own substrate first, then federated submodules. */
export function defaultRoots(): string[] {
  // resolver.ts lives at <trinity>/src/x2F30_fqdn_resolver.ts
  const trinity = dirname(dirname(fromFileUrl(import.meta.url)));
  return ["src", "liquid", "omega", "myc"].map((r) => join(trinity, r));
}

/**
 * Designated, BOUNDED cloud/home roots that actually exist — never all of `~`.
 * These sit at lower precedence than the substrate: a node may live outside any
 * repo (here: the architect's memory dir) and still resolve.
 */
export function cloudRoots(home: string): string[] {
  const candidates = [
    join(home, ".claude/projects/-Users-s0fractal-trinity/memory"),
    join(home, "mycelium"),
    join(home, "Library/CloudStorage"),
  ];
  return candidates.filter((d) => {
    try {
      return Deno.statSync(d).isDirectory;
    } catch {
      return false;
    }
  });
}

if (import.meta.main) {
  const args = [...Deno.args];
  const useCloud = args.includes("--cloud");
  const roots: Root[] = [...defaultRoots()];
  if (useCloud) {
    const home = Deno.env.get("HOME");
    // cloud roots are depth-bounded; substrate roots stay unbounded above
    if (home) {
      for (const c of cloudRoots(home)) roots.push({ path: c, maxDepth: 6 });
    }
  }

  // `list [substring] [--kind=K]` — discover the resolvable namespace
  // (read-only, no hash). `--kind=organ` answers "what functions exist?".
  if (args[0] === "list") {
    const positional = args.slice(1).filter((a) => !a.startsWith("--"));
    const substring = positional[0];
    const limitArg = args.find((a) => a.startsWith("--limit="));
    const limit = limitArg ? Number(limitArg.split("=")[1]) : 50;
    const kindArg = args.find((a) => a.startsWith("--kind="))?.split("=")[1];
    const index = await buildIndex(roots);
    const { total, shown, truncated, by_kind } = listNames(index, {
      substring,
      limit,
      kind: kindArg as NameKind | undefined,
    });
    console.log(JSON.stringify(
      {
        type: "fqdn_namespace",
        query: substring ?? null,
        kind: kindArg ?? null,
        files_indexed: index.files,
        canonical_names: total,
        by_kind,
        shown: shown.length,
        truncated,
        names: shown,
      },
      null,
      2,
    ));
    Deno.exit(0);
  }

  const fqdn = args.find((a) => !a.startsWith("--"));
  if (!fqdn) {
    console.error(
      "usage: resolver.ts [--cloud] <fqdn-or-handle-or-slug>\n" +
        "       resolver.ts --show <fqdn>                   (resolve AND print its content)\n" +
        "       resolver.ts list [substring] [--limit=N]   (discover the namespace)",
    );
    Deno.exit(1);
  }
  const res = await resolveFqdn(fqdn, roots);
  if (args.includes("--show")) {
    Deno.exit(await renderShow(res));
  }
  console.log(JSON.stringify({ type: "fqdn_resolution", ...res }, null, 2));
}
