// src/x2F30_fqdn_resolver.ts — local-first FQDN resolution contract.
// position: 2/F30 → mirror(2) × frontier-pair(F) = FQDN resolver
// hex_dipole: "26 26 6C 26 26 26 26 26"
//   mirror_apex+0.85 (reflects FQDN resolution mirroring/mapping; bucket 2 MATCH)
// placement_policy: axis
// maturity: active
// horizon: none (graduation completed)
// skill_tag: resolve-fqdn
// skill_safe: yes-with-care
//   read-only by default; the `index` subcommand writes the gitignored
//   resolver index cache to disk
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
import { epochMsOfBlock } from "./x0014_blocktime.ts";

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

// Generated runtime sidecars (gitignored `*.latest.myc.*`) — including this
// resolver's own index cache. They are regenerated, not authored content, and
// indexing them would (a) pollute the namespace and (b) make the index include
// its OWN cache file, so its freshness fingerprint could never stabilize.
const SKIP_FILE = /\.latest\.myc\.(json|md)$/;

/** True if a (root-relative) path lies in a dependency/build/hidden directory,
 *  or is a generated runtime sidecar, that the index skips. Matches only full
 *  path components — `target.md` and the hidden file `.gitignore` are content;
 *  `target/x.o`, `.liquid/db.sqlite`, and `x2F88_resolver_index.latest.myc.json`
 *  are not. Exported for the test. */
export function isSkippedPath(path: string): boolean {
  return SKIP.test(path) || SKIP_FILE.test(path);
}

// The coordinate prefix `x<hex>_` that names an organ/doc by its hex position.
// Canonically exactly 4 hex (the x0000..xFFFF octet address space) — matches
// this file's own ORGAN_TARGET_RE and is the parity peer of myc's
// x0200_resolve.ts COORD_RE. Verified 2026-06-18: every `x<hex>_` filename across
// all substrates has a 4-hex run, so `{4}` is behaviour-identical to the prior
// `+` while making the canonical width explicit and cross-substrate consistent.
const COORD_PREFIX = /^x[0-9A-Fa-f]{4}_/;

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

/** Restrict a filesystem index to an explicit set of tracked absolute paths.
 * Stable projections use this to exclude machine-local logs, exports, runtime
 * caches and ignored generated files. */
export function filterIndexToTracked(
  index: Index,
  tracked: Set<string>,
): Index {
  const byKey = new Map<string, Stored[]>();
  const exactFiles = new Set<string>();
  for (const [key, stored] of index.byKey) {
    const kept = stored.filter((s) => tracked.has(s.path));
    if (kept.length === 0) continue;
    byKey.set(key, kept);
    for (const s of kept) {
      if (s.matchForm === "exact") exactFiles.add(`${s.rootIndex}:${s.rel}`);
    }
  }
  return { roots: index.roots, byKey, files: exactFiles.size };
}

async function trackedPathSet(roots: string[]): Promise<Set<string>> {
  const tracked = new Set<string>();
  for (const root of roots) {
    const topRun = await new Deno.Command("git", {
      args: ["-C", root, "rev-parse", "--show-toplevel"],
      stdout: "piped",
      stderr: "null",
    }).output();
    if (topRun.code !== 0) {
      throw new Error(`tracked-only: ${root} is not inside a git worktree`);
    }
    const top = new TextDecoder().decode(topRun.stdout).trim();
    const filesRun = await new Deno.Command("git", {
      args: ["-C", top, "ls-files", "-z"],
      stdout: "piped",
      stderr: "null",
    }).output();
    if (filesRun.code !== 0) {
      throw new Error(`tracked-only: git ls-files failed for ${top}`);
    }
    for (const rel of new TextDecoder().decode(filesRun.stdout).split("\0")) {
      if (rel) tracked.add(join(top, rel));
    }
  }
  return tracked;
}

async function maybeTrackedOnly(index: Index, args: string[]): Promise<Index> {
  if (!args.includes("--tracked-only")) return index;
  return filterIndexToTracked(index, await trackedPathSet(index.roots));
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
//   data   — .json / .ndjson / .jsonl (incl. the glossary, index, graph)
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
  if (
    name.endsWith(".json") || name.endsWith(".ndjson") ||
    name.endsWith(".jsonl")
  ) return "data";
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

export interface SearchHit {
  name: string; // canonical address that matched
  kind: NameKind;
  rel: string; // winning candidate's path relative to its root
  root: string; // root basename the winner lives in
  in_name: boolean; // the query matched the name itself
  snippet: string | null; // one-line context around the first content match
  hits?: number; // # of distinct query terms matched (relevance rank; multi-word)
}

/** A one-line snippet around the first case-insensitive match of `q` in `text`,
 *  whitespace-collapsed and bounded. Pure; exported for the test. */
export function matchSnippet(
  text: string,
  q: string,
  ctx = 48,
): string | null {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return null;
  const start = Math.max(0, i - ctx);
  const end = Math.min(text.length, i + q.length + ctx);
  const slice = (start > 0 ? "…" : "") + text.slice(start, end) +
    (end < text.length ? "…" : "");
  return slice.replace(/\s+/g, " ").trim();
}

/**
 * Content search across the resolvable namespace (the discovery complement of
 * `list`, which only sees names): for each canonical name, read its
 * precedence-winning file and match `query` against the name and the content.
 * "FQDN network for people" — find a chord/organ/doc by what it SAYS, not only
 * by a name you already know. Read is injected (testable, bounded); files over
 * `maxBytes` are name-matched only. Bounded with an explicit truncation count.
 */
export async function searchContent(
  index: Index,
  query: string,
  opts: {
    kind?: NameKind;
    limit?: number;
    maxBytes?: number;
    read?: (path: string) => Promise<string | null>;
  } = {},
): Promise<
  {
    query: string;
    scanned: number;
    total: number;
    matches: SearchHit[];
    truncated: number;
  }
> {
  const limit = opts.limit ?? 25;
  const maxBytes = opts.maxBytes ?? 262_144;
  const q = query.toLowerCase();
  // Relevance is term-overlap, not one literal phrase: a multi-word query matches a
  // document by how many of its distinct terms appear anywhere (name or body),
  // ranked by that count with an exact-phrase bonus. Single-word queries keep the
  // original substring behaviour. A trailing-'s fold gives light plural tolerance
  // (keys→key). Before this, "find by what it SAYS" was one indexOf of the whole
  // query, so every multi-word CONCEPT found nothing (x5300_954749 dogfood:
  // `search "voice key custody quorum"` → 0 despite the words being right there).
  const terms = Array.from(
    new Set(q.split(/\s+/).filter((t) => t.length >= 2)),
  );
  const folded = terms.map((t) =>
    t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t
  );
  const multi = terms.length > 1;
  const termHits = (hay: string): number => {
    let n = 0;
    for (let i = 0; i < terms.length; i++) {
      if (hay.includes(terms[i]) || hay.includes(folded[i])) n++;
    }
    return n;
  };
  const read = opts.read ??
    (async (p: string) => {
      try {
        const info = await Deno.stat(p);
        if (info.size > maxBytes) return null; // too big — name-match only
        return await Deno.readTextFile(p);
      } catch {
        return null;
      }
    });
  const hits: SearchHit[] = [];
  let scanned = 0;
  for (const [key, stored] of index.byKey) {
    const exact = stored.filter((s) => s.matchForm === "exact");
    if (exact.length === 0) continue; // alias-only key, not a canonical name
    const kind = kindOf(key);
    if (opts.kind && kind !== opts.kind) continue;
    // Precedence winner: lowest root index, then shallowest path.
    const winner = [...exact].sort((a, b) =>
      a.rootIndex - b.rootIndex || a.depth - b.depth
    )[0];
    scanned++;
    const content = await read(winner.path);
    const nameLc = key.toLowerCase();
    const contentLc = content ? content.toLowerCase() : "";
    let inName: boolean;
    let score: number;
    let snippet: string | null;
    if (!multi) {
      inName = nameLc.includes(q);
      snippet = content ? matchSnippet(content, query) : null;
      score = inName || snippet ? 1 : 0;
    } else {
      const hay = nameLc + "\n" + contentLc;
      const raw = termHits(hay);
      const phrase = raw > 0 && hay.includes(q);
      // a hit needs ≥2 distinct terms (or the exact phrase), so one common word
      // like "key" cannot flood results; the rank then keeps the best on top.
      if (raw < Math.min(2, terms.length) && !phrase) {
        continue;
      }
      inName = termHits(nameLc) > 0;
      score = raw + (phrase ? terms.length : 0);
      const snipTerm = contentLc.includes(q)
        ? query
        : terms.find((t, i) =>
          contentLc.includes(t) || contentLc.includes(folded[i])
        );
      snippet = content && snipTerm ? matchSnippet(content, snipTerm) : null;
    }
    if (score > 0) {
      hits.push({
        name: key,
        kind,
        rel: winner.rel,
        root: basename(winner.root),
        in_name: inName,
        snippet,
        hits: score,
      });
    }
  }
  // Most query terms matched first (relevance), then name-matches, then by name.
  hits.sort((a, b) =>
    ((b.hits ?? 0) - (a.hits ?? 0)) ||
    (a.in_name === b.in_name ? 0 : a.in_name ? -1 : 1) ||
    a.name.localeCompare(b.name)
  );
  const total = hits.length;
  const matches = hits.slice(0, limit);
  return {
    query,
    scanned,
    total,
    matches,
    truncated: Math.max(0, total - matches.length),
  };
}

/** The addressable forms of a graph query, in resolution-preference order: the
 *  query as given, its basename (strips a `src/...` path), then those completed
 *  with the substrate's content extensions (so a bare stem/slug reaches the
 *  extension-bearing byKey forms). Pure; exported for the test. */
export function graphQueryForms(query: string): string[] {
  const base = basename(query);
  const forms = [query];
  if (base !== query) forms.push(base);
  for (const ext of [".myc.md", ".md", ".ts", ".json", ".ndjson"]) {
    if (!base.endsWith(ext)) forms.push(base + ext);
  }
  return [...new Set(forms)];
}

/** Resolve a graph query to a node, form-tolerantly (codex Graph-v2 A): try each
 *  addressable form against the index, first non-absent wins. */
export async function resolveGraphNode(
  index: Index,
  query: string,
): Promise<Resolution> {
  let last: Resolution | null = null;
  for (const form of graphQueryForms(query)) {
    const res = await resolveFromIndex(index, form);
    if (res.resolved) return { ...res, fqdn: query };
    last = res;
  }
  return last ??
    { fqdn: query, resolved: null, identity: "absent", candidates: [] };
}

/** The identity of the node a refs/graph query resolved to — carries enough to
 *  audit an edge after a file changes (codex Graph-v2 F5: identity-first). */
export interface RefsNode {
  query: string;
  found: boolean; // true only for an unambiguous (unique|mirrored) node
  identity: Identity;
  name: string | null; // canonical basename
  stem: string | null;
  kind: NameKind | null;
  root: string | null;
  rel: string | null;
  hash: string | null;
  candidates?: { rel: string; root: string; hash: string }[]; // when conflict
}

export interface ChordRefs {
  node: RefsNode;
  // `imports` is populated only for organ nodes (what this organ imports);
  // empty for chords/docs. The others are chord-frontmatter citation edges.
  outgoing: {
    hears: string[];
    closes: string[];
    references: string[];
    imports: string[];
  };
  incoming: { name: string; via: string[] }[]; // nodes that cite/import the node
}

/** Build the identity record for a resolved node (shared by refs + graph). */
function buildRefsNode(res: Resolution, query: string): RefsNode {
  const winner = res.resolved;
  const unambiguous = res.identity === "unique" || res.identity === "mirrored";
  const nodeName = winner ? basename(winner.rel) : null;
  const node: RefsNode = {
    query,
    found: winner !== null && unambiguous,
    identity: res.identity,
    name: nodeName,
    stem: winner ? refStem(nodeName!) : null,
    kind: nodeName ? kindOf(nodeName) : null,
    root: winner ? basename(winner.root) : null,
    rel: winner ? winner.rel : null,
    hash: winner ? winner.hash : null,
  };
  if (res.identity === "conflict") {
    node.candidates = res.candidates.map((c) => ({
      rel: c.rel,
      root: basename(c.root),
      hash: c.hash,
    }));
  }
  return node;
}

/**
 * The citation edges of a node, IDENTITY-FIRST (codex Graph-v2 A): the query
 * (slug / handle / canonical stem / organ path) is resolved through the index
 * before traversal, so any address form reaches the same node. Returns the
 * node's OUTGOING edges (hears/closes/references — empty for a non-chord like an
 * organ) and its INCOMING edges: every chord whose `hears`/`closes`/`references`
 * names it (Phase C adds reverse `references`, so "what cites this organ?" works
 * too). An ambiguous query (identity=conflict) returns found:false with the
 * candidate list rather than silently picking one. Read is injected.
 */
export async function chordRefs(
  index: Index,
  target: string,
  opts: { read?: (path: string) => Promise<string | null> } = {},
): Promise<ChordRefs> {
  const read = opts.read ??
    (async (p: string) => {
      try {
        return await Deno.readTextFile(p);
      } catch {
        return null;
      }
    });

  // Phase A: resolve the query to a node through the index (handles slug/handle/
  // stem/path uniformly) before any graph traversal. byKey forms carry the
  // extension, so a bare stem/slug or a `src/...` path must be completed to its
  // addressable forms; the first that resolves wins.
  const res = await resolveGraphNode(index, target);
  const winner = res.resolved;
  const unambiguous = res.identity === "unique" || res.identity === "mirrored";
  const node = buildRefsNode(res, target);
  const nodeStem = winner ? node.stem! : refStem(target);

  let outgoing = { hears: [], closes: [], references: [], imports: [] } as {
    hears: string[];
    closes: string[];
    references: string[];
    imports: string[];
  };
  const incoming: { name: string; via: string[] }[] = [];

  // Don't traverse an absent or ambiguous node — return identity + candidates.
  if (!winner || !unambiguous) {
    return { node, outgoing, incoming };
  }

  const nodeContent = await read(winner.path);
  if (nodeContent !== null) {
    outgoing = {
      ...parseChordEdges(nodeContent),
      // imports are organ-only; a chord/doc never declares them.
      imports: node.kind === "organ" ? parseOrganImports(nodeContent) : [],
    };
  }

  for (const [key, stored] of index.byKey) {
    const exact = stored.filter((s) => s.matchForm === "exact");
    if (exact.length === 0) continue;
    const keyKind = kindOf(key);
    // Citation edges come from chords; import edges from organs. Skip anything
    // that can carry neither, and skip the node itself.
    if (keyKind !== "chord" && keyKind !== "organ") continue;
    if (refStem(key) === nodeStem) continue;
    const w = [...exact].sort((a, b) =>
      a.rootIndex - b.rootIndex || a.depth - b.depth
    )[0];
    const content = await read(w.path);
    if (content === null) {
      continue;
    }
    const via: string[] = [];
    if (keyKind === "chord") {
      const edges = parseChordEdges(content);
      if (edges.hears.includes(nodeStem)) {
        via.push("hears");
      }
      if (edges.closes.includes(nodeStem)) {
        via.push("closes");
      }
      // Phase C: reverse references — a chord that names this node's stem in
      // `references:` (those cite organs/files by path; stem-normalize to match).
      if (
        edges.references.some((r) =>
          refStem(r) === nodeStem
        )
      ) {
        via.push("references");
      }
    } else {
      // reverse imports — an organ whose `from "...xNNNN_*.ts"` names this node.
      if (parseOrganImports(content).includes(nodeStem)) via.push("imports");
    }
    if (via.length > 0) incoming.push({ name: key, via });
  }
  incoming.sort((a, b) => a.name.localeCompare(b.name));
  return { node, outgoing, incoming };
}

// `hears`/`closes`/`references` are chord-frontmatter citation edges; `imports`
// is the codex Graph-v2 "future bridge to gravity" — an organ→organ code
// dependency, extracted by reusing gravity's import regex over already-read
// content (NOT a `deno info` subprocess, NOT a replacement for x6020_gravity's
// tension report — just the same edges surfaced in the unified resolve graph).
export type EdgeKind = "hears" | "closes" | "references" | "imports";

/** A typed citation edge (codex Graph-v2 B). `source`/`target` are node stems
 *  (resolve them against `nodes`); `parser` records what extracted it, so an
 *  edge stays auditable as the extractor evolves. `imports` edges carry
 *  `import-regex-v0`; the frontmatter citation edges carry `frontmatter-v0`. */
export interface FqdnEdge {
  source: string;
  target: string;
  kind: EdgeKind;
  parser: "frontmatter-v0" | "import-regex-v0";
}

export interface FqdnGraph {
  query: string;
  root: RefsNode;
  nodes: RefsNode[]; // resolved identities: root + depth-1 neighbors
  edges: FqdnEdge[];
  truncated: number;
  index: { files_indexed: number };
}

/**
 * Depth-1 typed citation graph around a node (codex Graph-v2 D): typed edges
 * (hears/closes/references) for what the node cites (outgoing) and what cites it
 * (incoming), plus the resolved IDENTITY of every node touched (so each edge can
 * be audited by content hash). A thin layer over `chordRefs` — same identity
 * resolver (acceptance #5). `--incoming`/`--outgoing` select direction;
 * `--kind` filters neighbor node kinds. Read is injected.
 */
export async function chordGraph(
  index: Index,
  query: string,
  opts: {
    incoming?: boolean;
    outgoing?: boolean;
    kind?: NameKind;
    limit?: number;
    read?: (path: string) => Promise<string | null>;
  } = {},
): Promise<FqdnGraph> {
  const wantOut = opts.outgoing ?? true;
  const wantIn = opts.incoming ?? true;
  const limit = opts.limit ?? 200;
  const refs = await chordRefs(index, query, { read: opts.read });
  const root = refs.node;
  const edges: FqdnEdge[] = [];
  const neighborStems = new Set<string>();

  if (root.found && root.stem) {
    if (wantOut) {
      for (
        const kind of ["hears", "closes", "references", "imports"] as EdgeKind[]
      ) {
        for (const raw of refs.outgoing[kind]) {
          const target = refStem(raw);
          edges.push({
            source: root.stem,
            target,
            kind,
            parser: kind === "imports" ? "import-regex-v0" : "frontmatter-v0",
          });
          neighborStems.add(target);
        }
      }
    }
    if (wantIn) {
      for (const inc of refs.incoming) {
        const source = refStem(inc.name);
        for (const kind of inc.via as EdgeKind[]) {
          edges.push({
            source,
            target: root.stem,
            kind,
            parser: kind === "imports" ? "import-regex-v0" : "frontmatter-v0",
          });
        }
        neighborStems.add(source);
      }
    }
  }

  // Resolve every touched neighbor to a node identity (depth-1; bounded).
  neighborStems.delete(root.stem ?? "");
  const nodes: RefsNode[] = root.found ? [root] : [];
  let truncated = 0;
  for (const stem of [...neighborStems].sort()) {
    if (nodes.length - (root.found ? 1 : 0) >= limit) {
      truncated++;
      continue;
    }
    const nres = await resolveGraphNode(index, stem);
    const n = buildRefsNode(nres, stem);
    if (opts.kind && n.kind !== opts.kind) continue;
    nodes.push(n);
  }
  // If filtering by kind, drop edges that no longer touch a kept node.
  const kept = new Set(nodes.map((n) => n.stem));
  const finalEdges = opts.kind
    ? edges.filter((e) =>
      (e.source === root.stem || kept.has(e.source)) &&
      (e.target === root.stem || kept.has(e.target))
    )
    : edges;

  return {
    query,
    root,
    nodes,
    edges: finalEdges,
    truncated,
    index: { files_indexed: index.files },
  };
}

// ── reproducible search/graph index (codex Graph-v2 E) ──────────────────────
// An auditable index artifact so search/graph results can become decision
// evidence: each entry binds content hash + frontmatter edges + a bounded
// searchable text, and the artifact carries provenance (generator version,
// content source_hash, cheap mtime fingerprint). It is a RUNTIME CACHE
// (gitignored `*.latest.myc.json`), never a tracked projection — it spans the
// submodule/cloud roots and would otherwise be submodule-idempotence-unstable.

export const RESOLVER_INDEX_VERSION = "graph-v2.1";
const INDEX_TEXT_CAP = 4096; // bytes of lowercased searchable text per entry

export interface IndexEntry {
  name: string; // canonical
  kind: NameKind;
  root: string; // root basename
  rel: string;
  content_hash: string;
  // `imports` populated for organ entries only (codex Graph-v2 bridge); the
  // others are chord-frontmatter citation edges.
  edges: {
    hears: string[];
    closes: string[];
    references: string[];
    imports: string[];
  };
  text: string; // lowercased, capped — what `search` matches against
}

export interface ResolverIndexArtifact {
  type: "resolver_index";
  generator_version: string;
  files_indexed: number;
  fingerprint: string; // cheap freshness key: hash of rel+size+mtime
  source_hash: string; // content identity: hash of rel+content_hash (deterministic)
  entries: IndexEntry[];
}

/** Cheap freshness fingerprint: a stable hash over each canonical file's
 *  rel+size+mtime — no content read, so freshness checks stay fast. */
async function indexFingerprint(index: Index): Promise<string> {
  const rows: string[] = [];
  for (const [, stored] of index.byKey) {
    const exact = stored.filter((s) => s.matchForm === "exact");
    if (exact.length === 0) continue;
    const w = [...exact].sort((a, b) =>
      a.rootIndex - b.rootIndex || a.depth - b.depth
    )[0];
    try {
      const st = await Deno.stat(w.path);
      rows.push(`${w.rel}|${st.size}|${st.mtime?.getTime() ?? 0}`);
    } catch {
      rows.push(`${w.rel}|?`);
    }
  }
  return blake3HexStr(rows.sort().join("\n"));
}

// Hash a string with the same BLAKE3 regime as content hashing. Sync — blake3
// is synchronous, so this carries no Promise (callers need not await).
function blake3HexStr(s: string): string {
  return blake3Hex(new TextEncoder().encode(s));
}

/** Build the auditable index over the precedence-winning file of each canonical
 *  name. Deterministic given content (the `source_hash`). Read is injected. */
export async function buildResolverIndex(
  index: Index,
  opts: { read?: (path: string) => Promise<Uint8Array | null> } = {},
): Promise<ResolverIndexArtifact> {
  const read = opts.read ??
    (async (p: string) => {
      try {
        return await Deno.readFile(p);
      } catch {
        return null;
      }
    });
  const entries: IndexEntry[] = [];
  for (const [key, stored] of index.byKey) {
    const exact = stored.filter((s) => s.matchForm === "exact");
    if (exact.length === 0) continue;
    const w = [...exact].sort((a, b) =>
      a.rootIndex - b.rootIndex || a.depth - b.depth
    )[0];
    const bytes = await read(w.path);
    if (bytes === null) {
      continue;
    }
    const content = new TextDecoder().decode(bytes);
    const kind = kindOf(key);
    entries.push({
      name: key,
      kind,
      root: basename(w.root),
      rel: w.rel,
      content_hash: blake3Hex(bytes),
      edges: {
        ...parseChordEdges(content),
        imports: kind === "organ" ? parseOrganImports(content) : [],
      },
      text: content.slice(0, INDEX_TEXT_CAP).toLowerCase(),
    });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const source_hash = blake3HexStr(
    entries.map((e) => `${e.name}|${e.content_hash}`).join("\n"),
  );
  return {
    type: "resolver_index",
    generator_version: RESOLVER_INDEX_VERSION,
    files_indexed: index.files,
    fingerprint: await indexFingerprint(index),
    source_hash,
    entries,
  };
}

/** Is a cached artifact still fresh for this index? Compares the cheap mtime
 *  fingerprint and the generator version. */
export async function indexIsFresh(
  index: Index,
  cache: ResolverIndexArtifact | null,
): Promise<boolean> {
  if (!cache || cache.generator_version !== RESOLVER_INDEX_VERSION) {
    return false;
  }
  return (await indexFingerprint(index)) === cache.fingerprint;
}

const INDEX_CACHE_REL = "src/x2F88_resolver_index.latest.myc.json";

function indexCachePath(): string {
  return join(dirname(dirname(fromFileUrl(import.meta.url))), INDEX_CACHE_REL);
}

export async function loadIndexCache(): Promise<ResolverIndexArtifact | null> {
  try {
    const txt = await Deno.readTextFile(indexCachePath());
    const a = JSON.parse(txt);
    return a?.type === "resolver_index" ? a as ResolverIndexArtifact : null;
  } catch {
    return null;
  }
}

export async function writeIndexCache(
  artifact: ResolverIndexArtifact,
): Promise<string> {
  const path = indexCachePath();
  await Deno.writeTextFile(path, JSON.stringify(artifact, null, 2) + "\n");
  return INDEX_CACHE_REL;
}

/** Load the index cache and test its freshness against `index` — the shared
 *  preamble of the `search`, `overview`, and `index` CLI handlers. */
async function freshCache(
  index: Index,
): Promise<{ cache: ResolverIndexArtifact | null; fresh: boolean }> {
  const cache = await loadIndexCache();
  return { cache, fresh: await indexIsFresh(index, cache) };
}

/** Value of a `--name=value` CLI flag, or undefined if absent. */
function flagArg(args: string[], name: string): string | undefined {
  return args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
}

/** Stable tracked projections opt out of the machine-local runtime cache. */
export function resolverCacheAllowed(args: string[]): boolean {
  return !args.includes("--no-cache");
}

/** Search the cached index instead of live files (codex F4): matches name + the
 *  entry's bounded `text` (first INDEX_TEXT_CAP bytes), no disk reads. Same
 *  result shape as `searchContent`. Pure over the artifact; exported for the
 *  test. A content match past the text cap is not found here — that is the
 *  bounded-text trade-off the cache makes explicit. */
export function searchCache(
  cache: ResolverIndexArtifact,
  query: string,
  opts: { kind?: NameKind; limit?: number } = {},
): {
  query: string;
  scanned: number;
  total: number;
  matches: SearchHit[];
  truncated: number;
} {
  const limit = opts.limit ?? 25;
  const q = query.toLowerCase();
  const hits: SearchHit[] = [];
  let scanned = 0;
  for (const e of cache.entries) {
    if (opts.kind && e.kind !== opts.kind) continue;
    scanned++;
    const inName = e.name.toLowerCase().includes(q);
    const snippet = matchSnippet(e.text, query);
    if (inName || snippet) {
      hits.push({
        name: e.name,
        kind: e.kind,
        rel: e.rel,
        root: e.root,
        in_name: inName,
        snippet,
      });
    }
  }
  hits.sort((a, b) =>
    (a.in_name === b.in_name ? 0 : a.in_name ? -1 : 1) ||
    a.name.localeCompare(b.name)
  );
  const total = hits.length;
  const matches = hits.slice(0, limit);
  return {
    query,
    scanned,
    total,
    matches,
    truncated: Math.max(0, total - matches.length),
  };
}

// ── chord citation graph (navigate the FQDN network's edges) ────────────────
// A chord declares OUTGOING edges in frontmatter: `hears:` and `closes.path_hint`
// name other chords; `references:` name organs/files. There is no reverse view —
// "what chords hear/close THIS one?" — so the knowledge graph is unnavigable.
// `t resolve refs` adds it: outgoing edges of a node + the incoming edges that
// cite it. Distinct from `gravity` (organ imports) and `decisions` (proposal
// closure only).

/** Strip directory and the chord/doc/organ extension → a comparable stem. */
function refStem(s: string): string {
  return (s.split("/").pop() ?? s).replace(
    /\.(myc\.md|md|ts|json|ndjson)$/i,
    "",
  )
    .trim();
}

function frontmatterOf(content: string): string {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  return m ? m[1] : "";
}

function fmListField(fm: string, field: string): string[] {
  const block = new RegExp(
    `^${field}:[ \\t]*\\n((?:[ \\t]+-[ \\t]+.+\\n?)+)`,
    "m",
  ).exec(fm);
  if (!block) return [];
  return [...block[1].matchAll(/^[ \t]+-[ \t]+(.+?)[ \t]*$/gm)]
    .map((x) => x[1].replace(/^["']|["']$/g, "").trim());
}

/** The outgoing edges a chord declares. `hears`/`closes` are stem-normalized
 *  (they cite other chords); `references` keep their raw path (they cite
 *  organs/files). Pure; exported for the test. */
export function parseChordEdges(
  content: string,
): { hears: string[]; closes: string[]; references: string[] } {
  const fm = frontmatterOf(content);
  const hears = fmListField(fm, "hears").map(refStem);
  const references = fmListField(fm, "references");
  const closes: string[] = [];
  // `closes:` may be a mapping (path_hint:) or carry closes_hash; collect any
  // stem it names.
  const pathHint = /^closes:[\s\S]*?\n[ \t]+path_hint:[ \t]*(.+?)[ \t]*$/m
    .exec(fm);
  if (pathHint) closes.push(refStem(pathHint[1].replace(/^["']|["']$/g, "")));
  return {
    hears: [...new Set(hears)],
    closes: [...new Set(closes)],
    references,
  };
}

// Import-edge extraction — the cheap, index-friendly path (no `deno info`
// subprocess). Two specifier forms are matched: static `… from "…"` (covers
// `import … from` and `export … from`) and dynamic `import("…")` with a LITERAL
// path. ORGAN_TARGET_RE keeps only specifiers resolving to an organ file
// (xNNNN_*.ts), dropping std/url/non-organ imports. x6020_gravity resolves the
// same edges via `deno info` AST; they are independent extractors by design, and
// a corpus parity check (see fqdn_resolver_test) confirms they agree EXCEPT:
//   • computed dynamic specifiers (`import(varPath)`) — unknowable to either;
//   • cross-substrate edges (`../liquid/src/xA507_*.ts`) — this regex KEEPS them
//     (the FQDN network spans substrates); gravity scopes to trinity `src/`.
const IMPORT_SPEC_RE = /(?:\bfrom\s+|\bimport\s*\(\s*)["']([^"']+)["']/g;
const ORGAN_TARGET_RE = /x([0-9A-Fa-f]{4})_[^"'/]+\.ts$/;

/** The organ→organ import edges a `.ts` file declares, as target stems (e.g.
 *  `x6020_gravity`). Catches static `from "…"` and literal `import("…")`.
 *  Returns [] for non-organ content. Pure; exported for the test. The codex
 *  Graph-v2 `imports` edge, surfaced over already-read content, not `deno info`. */
export function parseOrganImports(content: string): string[] {
  const out = new Set<string>();
  for (const m of content.matchAll(IMPORT_SPEC_RE)) {
    const spec = m[1];
    if (ORGAN_TARGET_RE.test(spec)) out.add(refStem(spec));
  }
  return [...out].sort();
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

/** Human-readable rendering of a depth-1 graph (`--pretty`) — the FQDN network
 *  made browsable for a person, not just a JSON blob. Groups a node's edges by
 *  direction (outgoing = what it cites/imports; incoming = what cites/imports
 *  it) and by kind, so "what is this node connected to?" reads at a glance.
 *  Pure (returns string[]) so it can be tested without stdout. */
export function renderGraph(g: FqdnGraph): string[] {
  const r = g.root;
  const lines: string[] = [`# graph: ${g.query}`];
  if (!r.found) {
    if (r.identity === "conflict" && r.candidates?.length) {
      lines.push(`# CONFLICT: '${g.query}' names several differing files:`);
      for (const c of r.candidates) {
        lines.push(`#   - ${c.rel} @ ${c.root}  blake3:${c.hash.slice(0, 12)}`);
      }
    } else {
      lines.push(
        `# absent: '${g.query}' resolves to no node. Try 't resolve list ${g.query}'.`,
      );
    }
    return lines;
  }
  lines.push(
    `# ${r.rel} @ ${r.root}  (${r.kind}, identity=${r.identity})  blake3:${
      (r.hash ?? "").slice(0, 12)
    }`,
  );
  const out = g.edges.filter((e) => e.source === r.stem);
  const inc = g.edges.filter((e) => e.target === r.stem);
  // Stable, readable ordering: kind, then the other node's stem.
  const byKindThenNode = (a: FqdnEdge, b: FqdnEdge) =>
    a.kind.localeCompare(b.kind) || a.target.localeCompare(b.target) ||
    a.source.localeCompare(b.source);
  const pad = (s: string) => s.padEnd(10);
  // Arrow direction encodes the edge: outgoing `this ──kind──▶ target`,
  // incoming `this ◀──kind── source` (the source points AT this node).
  lines.push(`# ── outgoing (what this cites/imports) ── ${out.length}`);
  if (out.length === 0) lines.push("#   (none)");
  for (const e of [...out].sort(byKindThenNode)) {
    lines.push(`#   ${pad(e.kind)} ──▶ ${e.target}`);
  }
  lines.push(`# ── incoming (what cites/imports this) ── ${inc.length}`);
  if (inc.length === 0) lines.push("#   (none)");
  for (const e of [...inc].sort(byKindThenNode)) {
    lines.push(`#   ${pad(e.kind)} ◀── ${e.source}`);
  }
  if (g.truncated > 0) {
    lines.push(
      `# (+${g.truncated} neighbor(s) truncated; raise --limit or use --json)`,
    );
  }
  lines.push(`# ── indexed ${g.index.files_indexed} files ──`);
  return lines;
}

export interface NetworkHub {
  stem: string;
  in: number; // incoming-edge count of the relevant kind(s)
}

/** A depth-0 aggregate "front door" to the FQDN network: counts by kind, the
 *  most-cited knowledge nodes (hubs), and the most-imported organs. The single
 *  most useful view for a person facing a 1700-node namespace — where to start.
 *  Distinct from `graph` (one node's neighborhood) and `search` (by keyword):
 *  this is the shape of the whole network. NOT multi-hop / clustering / ranking
 *  by embeddings (those stay out of scope) — just aggregated depth-1 edges. */
export interface NetworkOverview {
  root: string | null; // substrate scope, or null for the whole federation
  total_nodes: number;
  by_kind: Record<string, number>;
  edge_totals: Record<EdgeKind, number>;
  top_cited: NetworkHub[]; // most incoming hears+closes+references
  top_imported: NetworkHub[]; // most incoming imports (organ dependency hubs)
}

/** Friendly federation-member name for a stored root basename. Trinity's own
 *  substrate is indexed at `<trinity>/src` so its root basename is `src`; the
 *  federated submodules already use their substrate name. Presenting the members
 *  consistently as {trinity, liquid, omega, myc} lets a person scope by the name
 *  they know. Matching folds both tokens, so `--root=trinity` and `--root=src`
 *  are equivalent. */
export function federationMember(root: string): string {
  return root === "src" ? "trinity" : root;
}

/** Aggregate the index artifact into a network overview. Pure. In-degree is
 *  computed over every entry's outgoing edges (citation kinds collapse the
 *  target to a stem; `references` raw paths are stem-normalized to match). */
export function networkOverview(
  artifact: ResolverIndexArtifact,
  opts: { top?: number; root?: string } = {},
): NetworkOverview {
  const top = opts.top ?? 12;
  // Scope to one federation member (substrate root) when asked — otherwise one
  // substrate's hubs (e.g. liquid's import core) drown the others in the
  // aggregate. The filter is on the SOURCE node, so a root view is "this
  // substrate's own shape": what its nodes cite/import and its internal hubs.
  const entries = opts.root
    ? artifact.entries.filter((e) =>
      federationMember(e.root) === federationMember(opts.root!)
    )
    : artifact.entries;
  const by_kind: Record<string, number> = {};
  const edge_totals: Record<EdgeKind, number> = {
    hears: 0,
    closes: 0,
    references: 0,
    imports: 0,
  };
  const cited = new Map<string, number>(); // hears+closes+references in-degree
  const imported = new Map<string, number>(); // imports in-degree
  for (const e of entries) {
    by_kind[e.kind] = (by_kind[e.kind] ?? 0) + 1;
    const bump = (map: Map<string, number>, raw: string) => {
      const t = refStem(raw);
      if (t) map.set(t, (map.get(t) ?? 0) + 1);
    };
    for (const t of e.edges.hears) {
      edge_totals.hears++;
      bump(cited, t);
    }
    for (const t of e.edges.closes) {
      edge_totals.closes++;
      bump(cited, t);
    }
    for (const t of e.edges.references) {
      edge_totals.references++;
      bump(cited, t);
    }
    for (const t of e.edges.imports) {
      edge_totals.imports++;
      bump(imported, t);
    }
  }
  const rank = (map: Map<string, number>): NetworkHub[] =>
    [...map.entries()]
      .map(([stem, n]) => ({ stem, in: n }))
      .sort((a, b) => b.in - a.in || a.stem.localeCompare(b.stem))
      .slice(0, top);
  return {
    root: opts.root ? federationMember(opts.root) : null,
    total_nodes: entries.length,
    by_kind,
    edge_totals,
    top_cited: rank(cited),
    top_imported: rank(imported),
  };
}

/** Human-readable network overview (`overview --pretty`). */
export function renderOverview(o: NetworkOverview): string[] {
  const scope = o.root ? ` [${o.root}]` : "";
  const lines = [`# FQDN network overview${scope} — ${o.total_nodes} nodes`];
  const kinds = Object.entries(o.by_kind).sort((a, b) => b[1] - a[1]);
  lines.push(`# by kind: ${kinds.map(([k, n]) => `${k}=${n}`).join("  ")}`);
  lines.push(
    `# edges: ${
      (Object.entries(o.edge_totals) as [EdgeKind, number][])
        .map(([k, n]) => `${k}=${n}`).join("  ")
    }`,
  );
  lines.push(`# ── most-cited nodes (hears+closes+references in) ──`);
  for (const h of o.top_cited) {
    lines.push(`#   ${String(h.in).padStart(4)}  ◀── ${h.stem}`);
  }
  lines.push(`# ── most-imported organs (code dependency hubs) ──`);
  if (o.top_imported.length === 0) lines.push("#   (none)");
  for (const h of o.top_imported) {
    lines.push(`#   ${String(h.in).padStart(4)}  ◀── ${h.stem}`);
  }
  return lines;
}

// ── temporal lens: the network's recent activity ────────────────────────────
// The bitcoin-height→epoch conversion comes from the canonical bucket-0 library
// x0014_blocktime (`epochMsOfBlock`) — importing DOWN to bucket 0 is lawful under
// the coordinate gravity law, and it is the single source of truth for the anchor
// (no longer copied per-organ). The mapping is an ordering approximation, not a
// precise clock.

/** A chord name's temporal stamp + authorship, parsed from the filename alone
 *  (no file read). A chord is named `x<hex>_<block>_<voice>_<slug>`, where
 *  <block> is a bitcoin height (digits) or legacy `t<YYYYMMDDHHMMSS>`. Returns
 *  null for names with no chord body (organs, docs, data carry no embedded
 *  time). The bitcoin→epoch mapping is approximate (fixed 600 s/block), enough
 *  to order recent activity; it is not a precise timestamp. */
export interface ChordStamp {
  block: string;
  epoch_ms: number;
  voice: string;
  slug: string;
}
export function chordStamp(name: string): ChordStamp | null {
  const stripped = name.replace(COORD_PREFIX, "");
  if (stripped === name) return null; // no coordinate prefix → not a chord
  const handle = stripped.replace(/\.myc\.md$/, "");
  const m = handle.match(/^(t?\d+)_([a-z0-9.-]+)_(.+)$/);
  if (!m) return null;
  const [, block, voice, slug] = m;
  let epoch_ms: number;
  if (block[0] === "t") {
    const d = block.slice(1);
    if (d.length < 14) return null;
    const t = Date.parse(
      `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T` +
        `${d.slice(8, 10)}:${d.slice(10, 12)}:${d.slice(12, 14)}Z`,
    );
    if (Number.isNaN(t)) return null;
    epoch_ms = t;
  } else {
    const n = Number(block);
    if (!Number.isFinite(n)) return null;
    epoch_ms = epochMsOfBlock(n);
  }
  return { block, epoch_ms, voice, slug };
}

export interface RecentEntry {
  name: string;
  root: string;
  kind: NameKind;
  block: string;
  when: string; // ISO 8601 (UTC), derived from block height / legacy timestamp
  voice: string;
  slug: string;
  closes: string[]; // stems this chord closes — its receipt/closure signal
}

/** The network's temporal lens: the most recently stamped chords, newest first.
 *  Peer to `networkOverview` (the network's shape) and `chordGraph` (one node's
 *  neighbourhood) — this answers "what has been happening here lately?", the one
 *  primary browsing question the resolver could not previously answer. Pure;
 *  reads only the index. Scoped to chords (the substrate's event log) since other
 *  kinds carry no embedded time; NOT a full commit/CI history (that is
 *  `t heartbeat` / `t evidence`). */
export interface RecentActivity {
  root: string | null; // substrate scope, or null for the whole federation
  // dual-lens label (x0014): chord dates are HISTORICAL, so recent uses the
  // stable "compat" anchor (reproducible; ~1d early near the present) — never
  // the live anchor, which is for current-distance, not stamping a chord's date.
  lens: "compat";
  count: number; // total timestamped (chord) nodes available before --limit
  window: { from: string | null; to: string | null };
  entries: RecentEntry[];
}
export function recentActivity(
  artifact: ResolverIndexArtifact,
  opts: { limit?: number; voice?: string; root?: string } = {},
): RecentActivity {
  const limit = opts.limit ?? 20;
  const stamped = artifact.entries
    .filter((e) =>
      !opts.root || federationMember(e.root) === federationMember(opts.root)
    )
    .map((e) => ({ e, s: chordStamp(e.name) }))
    .filter((r): r is { e: IndexEntry; s: ChordStamp } => r.s !== null)
    .filter((r) => !opts.voice || r.s.voice === opts.voice)
    .sort((a, b) => b.s.epoch_ms - a.s.epoch_ms);
  const entries: RecentEntry[] = stamped
    .slice(0, Math.max(0, limit))
    .map(({ e, s }) => ({
      name: e.name,
      root: e.root,
      kind: e.kind,
      block: s.block,
      when: new Date(s.epoch_ms).toISOString(),
      voice: s.voice,
      slug: s.slug,
      closes: e.edges.closes
        .map((c) => refStem(c))
        .filter((x): x is string => !!x),
    }));
  return {
    root: opts.root ? federationMember(opts.root) : null,
    lens: "compat",
    count: stamped.length,
    window: {
      from: entries.length ? entries[entries.length - 1].when : null,
      to: entries.length ? entries[0].when : null,
    },
    entries,
  };
}

/** Human-readable recent-activity timeline (`recent --pretty`). */
export function renderRecent(r: RecentActivity): string[] {
  const scope = r.root ? ` [${r.root}]` : "";
  const lines = [
    `# FQDN network${scope} — ${r.entries.length} most recent of ${r.count} timestamped nodes`,
  ];
  if (r.window.from && r.window.to) {
    lines.push(
      `# window: ${r.window.from.slice(0, 10)} → ${
        r.window.to.slice(0, 10)
      }  (lens: ${r.lens} — stable historical dates)`,
    );
  }
  if (r.entries.length === 0) lines.push("#   (none)");
  for (const e of r.entries) {
    const extra = e.closes.length
      ? `  → closes ${e.closes[0]}${
        e.closes.length > 1 ? ` (+${e.closes.length - 1})` : ""
      }`
      : "";
    lines.push(
      `#   ${e.when.slice(0, 10)}  ${e.block.padStart(7)}  ${
        e.voice.padEnd(20).slice(0, 20)
      }  ${e.slug}${extra}`,
    );
  }
  return lines;
}

// ── the atlas: one human-readable "you are here" ─────────────────────────────
// overview answers SHAPE, recent answers WHEN — each alone, as JSON, for a voice.
// A person arriving at the network needs all of it woven into one read: what this
// is (federated substrates, role-addressed organs, signed chords), how big each
// member is, what is alive right now, and where to step next. The atlas composes
// the existing pure aggregates (networkOverview + recentActivity) — it invents no
// new measure, it narrates the ones the network already keeps. This is the "for
// people" front step under the living-README pressure: a read-only projection of
// ledger state, never an editable artifact.

export interface AtlasMember {
  member: string;
  nodes: number;
  chords: number;
}
export interface NetworkAtlas {
  total_nodes: number;
  members: AtlasMember[];
  by_kind: Record<string, number>;
  top_cited: NetworkHub[];
  recent: RecentEntry[];
  recent_window: { from: string | null; to: string | null };
  recent_total: number;
}

/** Compose the network's shape + pulse into a person-facing atlas. Pure; reads
 *  only the index. Federation members are ranked by node count (the substrates a
 *  person would recognize); recent + top_cited reuse the canonical aggregates. */
export function networkAtlas(artifact: ResolverIndexArtifact): NetworkAtlas {
  const o = networkOverview(artifact, { top: 5 });
  const r = recentActivity(artifact, { limit: 5 });
  const memberMap = new Map<string, { nodes: number; chords: number }>();
  for (const e of artifact.entries) {
    const m = federationMember(e.root);
    const cur = memberMap.get(m) ?? { nodes: 0, chords: 0 };
    cur.nodes++;
    if (e.kind === "chord") cur.chords++;
    memberMap.set(m, cur);
  }
  const members = [...memberMap.entries()]
    .map(([member, v]) => ({ member, ...v }))
    .sort((a, b) => b.nodes - a.nodes || a.member.localeCompare(b.member));
  return {
    total_nodes: o.total_nodes,
    members,
    by_kind: o.by_kind,
    top_cited: o.top_cited,
    recent: r.entries,
    recent_window: r.window,
    recent_total: r.count,
  };
}

/** Human-readable atlas (`atlas`, the default-pretty front door for people). */
export function renderAtlas(a: NetworkAtlas): string[] {
  const lines = [
    "# ─────────────────────────────────────────────────────────────",
    `#  The FQDN network — ${a.total_nodes} nodes across ${a.members.length} substrates`,
    "# ─────────────────────────────────────────────────────────────",
    "#",
    "#  A federation of living substrates. Every organ has a fixed",
    "#  coordinate (xNNNN, by role — not by content), every chord is a",
    "#  signed provenance event, every edge (hears/closes/references/",
    "#  imports) is git- and crypto-checkable. Nothing here is authored",
    "#  by hand into place; it is grown, signed, and projected.",
    "#",
    "#  Substrates (by size):",
  ];
  for (const m of a.members) {
    lines.push(
      `#    ${m.member.padEnd(10)} ${String(m.nodes).padStart(5)} nodes` +
        `   ${String(m.chords).padStart(4)} chords`,
    );
  }
  const kinds = Object.entries(a.by_kind).sort((x, y) => y[1] - x[1]);
  lines.push("#");
  lines.push(`#  Made of: ${kinds.map(([k, n]) => `${n} ${k}`).join(", ")}`);
  lines.push("#");
  lines.push("#  Most-cited (what the network leans on):");
  for (const h of a.top_cited) {
    lines.push(`#    ${String(h.in).padStart(3)} ◀── ${h.stem}`);
  }
  lines.push("#");
  if (a.recent.length && a.recent_window.to) {
    lines.push(
      `#  Alive lately (${a.recent_total} timestamped, newest of them):`,
    );
    for (const e of a.recent) {
      const closes = e.closes.length ? `  → closes ${e.closes[0]}` : "";
      lines.push(
        `#    ${e.when.slice(0, 10)}  ${
          e.voice.padEnd(16).slice(0, 16)
        }  ${e.slug}${closes}`,
      );
    }
  } else {
    lines.push("#  (no timestamped activity in the index)");
  }
  lines.push("#");
  lines.push("#  Step in:");
  lines.push("#    t resolve-fqdn overview --pretty     the full shape + hubs");
  lines.push("#    t resolve-fqdn recent --pretty       the full timeline");
  lines.push("#    t resolve-fqdn search <term>         find a node by name");
  lines.push(
    "#    t resolve-fqdn show <name>           read one node's content",
  );
  lines.push(
    "#    t roadmap                            where the network is going",
  );
  return lines;
}

// ── lineage: the network's becoming ──────────────────────────────────────────
// atlas answers WHERE-AM-I (the now-snapshot); recent answers WHEN (a flat 14-day
// timeline). Neither shows the CAUSAL DEPTH of how the network was built. The
// `closes` edges are the substrate's record of completed effort: each receipt
// chord names the proposal it closes, so a proposal closed by 7 receipts is a
// 7-phase arc. Grouping receipts by the proposal they close, ranked by that depth,
// renders the network's development as the major efforts that shaped it — "how did
// this come to be". Pure; reads only the index; reuses chordStamp for the dates.

export interface LineageReceipt {
  name: string;
  block: string;
  epoch_ms: number;
  voice: string;
  slug: string;
}
export interface DevelopmentArc {
  proposal: string; // the closed target's stem (a node, or a logical name)
  resolved: boolean; // does the proposal exist as an indexed node?
  proposal_voice: string | null;
  proposal_block: string | null;
  depth: number; // how many receipts closed it (effort depth)
  span_blocks: number | null; // block span from first to last activity
  voices: string[]; // distinct closing voices
  receipts: LineageReceipt[]; // the closing chords, newest first
}
export interface NetworkLineage {
  total_closed: number; // distinct proposals closed
  total_receipts: number; // total closing chords
  arcs: DevelopmentArc[]; // ranked by depth desc, then most-recent receipt
}

/** Aggregate the closes-graph into the network's development arcs. Pure. */
export function developmentArcs(
  artifact: ResolverIndexArtifact,
  opts: { limit?: number } = {},
): NetworkLineage {
  const limit = opts.limit ?? 12;
  const resolvable = new Set(artifact.entries.map((e) => refStem(e.name)));
  const byTarget = new Map<string, LineageReceipt[]>();
  let total_receipts = 0;
  for (const e of artifact.entries) {
    const s = chordStamp(e.name);
    if (!s) continue; // only chords carry a closure act
    const targets = e.edges.closes
      .map((c) => refStem(c))
      .filter((t): t is string => !!t);
    for (const t of targets) {
      total_receipts++;
      const receipt: LineageReceipt = {
        name: e.name,
        block: s.block,
        epoch_ms: s.epoch_ms,
        voice: s.voice,
        slug: s.slug,
      };
      const arr = byTarget.get(t) ?? [];
      arr.push(receipt);
      byTarget.set(t, arr);
    }
  }
  const numericBlock = (b: string | null): number | null => {
    if (!b || b[0] === "t") return null; // legacy timestamps aren't block heights
    const n = Number(b);
    return Number.isFinite(n) ? n : null;
  };
  const arcs: DevelopmentArc[] = [...byTarget.entries()].map(
    ([proposal, receipts]) => {
      receipts.sort((a, b) => b.epoch_ms - a.epoch_ms);
      const pStamp = chordStamp(proposal);
      const blocks = [
        numericBlock(pStamp?.block ?? null),
        ...receipts.map((r) => numericBlock(r.block)),
      ].filter((n): n is number => n !== null);
      const span = blocks.length > 1
        ? Math.max(...blocks) - Math.min(...blocks)
        : null;
      return {
        proposal,
        resolved: resolvable.has(proposal),
        proposal_voice: pStamp?.voice ?? null,
        proposal_block: pStamp?.block ?? null,
        depth: receipts.length,
        span_blocks: span,
        voices: [...new Set(receipts.map((r) => r.voice))],
        receipts,
      };
    },
  );
  arcs.sort((a, b) =>
    b.depth - a.depth || b.receipts[0].epoch_ms - a.receipts[0].epoch_ms
  );
  return {
    total_closed: byTarget.size,
    total_receipts,
    arcs: arcs.slice(0, Math.max(0, limit)),
  };
}

/** Human-readable lineage (`lineage`): the network's major development arcs. */
export function renderLineage(l: NetworkLineage): string[] {
  const lines = [
    "# ─────────────────────────────────────────────────────────────",
    `#  The network's becoming — ${l.total_closed} proposals closed by ${l.total_receipts} receipts`,
    "# ─────────────────────────────────────────────────────────────",
    "#",
    "#  Each arc is a proposal and the receipt-chords that closed it; depth is",
    "#  how many phases it took. Derived from the signed `closes` edges.",
    "#",
  ];
  let rank = 0;
  for (const a of l.arcs) {
    rank++;
    const phases = a.depth === 1 ? "1 phase" : `${a.depth} phases`;
    const span = a.span_blocks !== null ? `, ~${a.span_blocks} blocks` : "";
    const by = a.proposal_voice ? ` (proposed by ${a.proposal_voice})` : "";
    const tag = a.resolved ? "" : " ·logical·";
    lines.push(`#  ${String(rank).padStart(2)}. ${a.proposal}${tag}`);
    lines.push(`#      ${phases}${span} · voices: ${a.voices.join(", ")}${by}`);
    for (const r of a.receipts.slice(0, 4)) {
      lines.push(`#        ← ${r.block.padStart(7)} ${r.voice}: ${r.slug}`);
    }
    if (a.receipts.length > 4) {
      lines.push(`#        … +${a.receipts.length - 4} more`);
    }
  }
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
    const limitArg = flagArg(args, "limit");
    const limit = limitArg !== undefined ? Number(limitArg) : 50;
    const kindArg = flagArg(args, "kind");
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

  // `search <query> [--kind=K] [--limit=N]` — find content by keyword across
  // the namespace (read-only). The complement of `list` (names) and resolve
  // (a known address): discover what the network SAYS.
  if (args[0] === "search") {
    const positional = args.slice(1).filter((a) => !a.startsWith("--"));
    const query = positional.join(" ").trim();
    if (!query) {
      console.error("usage: resolver.ts search <query> [--kind=K] [--limit=N]");
      Deno.exit(1);
    }
    const limitArg = flagArg(args, "limit");
    const limit = limitArg !== undefined ? Number(limitArg) : 25;
    const kindArg = flagArg(args, "kind");
    const index = await buildIndex(roots);
    // Use the cached index when fresh (codex E) — bounded-text, fast; else live
    // scan the full content. Either way report which (acceptance #6).
    const { cache, fresh } = await freshCache(index);
    const result = fresh && cache
      ? searchCache(cache, query, {
        kind: kindArg as NameKind | undefined,
        limit,
      })
      : await searchContent(index, query, {
        kind: kindArg as NameKind | undefined,
        limit,
      });
    console.log(JSON.stringify(
      {
        type: "fqdn_search",
        kind: kindArg ?? null,
        files_indexed: index.files,
        index: {
          used: fresh && cache ? "cache" : "live",
          fresh,
          source_hash: fresh && cache ? cache.source_hash : null,
          note: fresh && cache
            ? "matched the cached index (first 8KB of each file)"
            : "live full-content scan; run `t resolve index` to build the cache",
        },
        ...result,
      },
      null,
      2,
    ));
    Deno.exit(0);
  }

  // `overview [--pretty] [--top=N] [--root=S]` — the network front door: counts
  // by kind, most-cited nodes, most-imported organs. Aggregates the index
  // artifact; `--root` scopes to one federation member (else liquid's hubs
  // dominate the whole-federation view).
  if (args[0] === "overview") {
    const topArg = flagArg(args, "top");
    const top = topArg ? Number(topArg) : 12;
    const root = flagArg(args, "root");
    const index = await buildIndex(roots);
    const { cache, fresh } = await freshCache(index);
    const artifact = fresh && cache ? cache : await buildResolverIndex(index);
    const o = networkOverview(artifact, { top, root });
    if (args.includes("--pretty")) {
      console.log(renderOverview(o).join("\n"));
    } else {
      console.log(JSON.stringify(
        {
          type: "fqdn_overview",
          files_indexed: index.files,
          index: {
            used: fresh && cache ? "cache" : "live",
            fresh,
            source_hash: artifact.source_hash,
            generator_version: artifact.generator_version,
          },
          ...o,
        },
        null,
        2,
      ));
    }
    Deno.exit(0);
  }

  // `atlas [--json]` — the network for a person: one woven read of identity +
  // shape + pulse + doorways. Default output is the human rendering (this is the
  // "for people" front door); --json exposes the same composed aggregate.
  if (args[0] === "atlas") {
    const index = await maybeTrackedOnly(await buildIndex(roots), args);
    const { cache, fresh } = await freshCache(index);
    const useCache = resolverCacheAllowed(args);
    const artifact = useCache && fresh && cache
      ? cache
      : await buildResolverIndex(index);
    const a = networkAtlas(artifact);
    if (args.includes("--json")) {
      console.log(JSON.stringify(
        {
          type: "fqdn_atlas",
          index: {
            used: useCache && fresh && cache ? "cache" : "live",
            fresh,
            source_hash: artifact.source_hash,
            generator_version: artifact.generator_version,
          },
          ...a,
        },
        null,
        2,
      ));
    } else {
      console.log(renderAtlas(a).join("\n"));
    }
    Deno.exit(0);
  }

  // `lineage [--limit=N] [--json]` — the network's becoming: development arcs
  // grouped from the `closes` graph (a proposal closed by N receipts is an
  // N-phase arc), ranked by depth. The causal-depth complement to recent's flat
  // timeline and atlas's now-snapshot.
  if (args[0] === "lineage") {
    const limitArg = flagArg(args, "limit");
    const limit = limitArg ? Number(limitArg) : 12;
    const index = await maybeTrackedOnly(await buildIndex(roots), args);
    const { cache, fresh } = await freshCache(index);
    const useCache = resolverCacheAllowed(args);
    const artifact = useCache && fresh && cache
      ? cache
      : await buildResolverIndex(index);
    const l = developmentArcs(artifact, { limit });
    if (args.includes("--json")) {
      console.log(JSON.stringify(
        {
          type: "fqdn_lineage",
          index: {
            used: useCache && fresh && cache ? "cache" : "live",
            fresh,
            source_hash: artifact.source_hash,
            generator_version: artifact.generator_version,
          },
          ...l,
        },
        null,
        2,
      ));
    } else {
      console.log(renderLineage(l).join("\n"));
    }
    Deno.exit(0);
  }

  // `recent [--limit=N] [--voice=V] [--root=S] [--pretty]` — the network's
  // temporal lens: the most recently stamped chords (proposals/receipts)
  // newest-first, by the block height / legacy timestamp carried in each name.
  // `--root` scopes to one federation member. Completes the browse loop
  // find→view→navigate→WHEN; peer to overview (shape) / graph (neighbourhood).
  if (args[0] === "recent") {
    const limitArg = flagArg(args, "limit");
    const limit = limitArg ? Number(limitArg) : 20;
    const voice = flagArg(args, "voice");
    const root = flagArg(args, "root");
    const index = await buildIndex(roots);
    const { cache, fresh } = await freshCache(index);
    const artifact = fresh && cache ? cache : await buildResolverIndex(index);
    const r = recentActivity(artifact, { limit, voice, root });
    if (args.includes("--pretty")) {
      console.log(renderRecent(r).join("\n"));
    } else {
      console.log(JSON.stringify(
        {
          type: "fqdn_recent",
          index: {
            used: fresh && cache ? "cache" : "live",
            fresh,
            source_hash: artifact.source_hash,
            generator_version: artifact.generator_version,
          },
          ...r,
        },
        null,
        2,
      ));
    }
    Deno.exit(0);
  }

  // `index [--rebuild]` — build the auditable search/graph index cache (codex E).
  if (args[0] === "index") {
    const index = await buildIndex(roots);
    const { cache: existing, fresh } = await freshCache(index);
    let wrote: string | null = null;
    let artifact = existing;
    if (!fresh || args.includes("--rebuild")) {
      artifact = await buildResolverIndex(index);
      wrote = await writeIndexCache(artifact);
    }
    console.log(JSON.stringify(
      {
        type: "resolver_index_built",
        generator_version: RESOLVER_INDEX_VERSION,
        was_fresh: fresh,
        rebuilt: wrote !== null,
        cache_path: wrote,
        files_indexed: index.files,
        entries: artifact?.entries.length ?? 0,
        source_hash: artifact?.source_hash ?? null,
      },
      null,
      2,
    ));
    Deno.exit(0);
  }

  // `graph <query> [--incoming] [--outgoing] [--kind=K]` — depth-1 typed
  // citation graph: resolved node identities + typed edges (codex Graph-v2 D).
  if (args[0] === "graph") {
    const name = args.slice(1).find((a) => !a.startsWith("--"));
    if (!name) {
      console.error(
        "usage: resolver.ts graph <query> [--incoming] [--outgoing] [--kind=K] [--pretty]",
      );
      Deno.exit(1);
    }
    // Default is both directions; a lone --incoming/--outgoing narrows.
    const onlyIn = args.includes("--incoming") && !args.includes("--outgoing");
    const onlyOut = args.includes("--outgoing") && !args.includes("--incoming");
    const kindArg = flagArg(args, "kind");
    const index = await buildIndex(roots);
    const g = await chordGraph(index, name, {
      incoming: !onlyOut,
      outgoing: !onlyIn,
      kind: kindArg as NameKind | undefined,
    });
    if (args.includes("--pretty")) {
      console.log(renderGraph(g).join("\n"));
    } else {
      console.log(JSON.stringify({ type: "fqdn_graph", ...g }, null, 2));
    }
    Deno.exit(0);
  }

  // `refs <name>` — navigate a chord's citation edges (outgoing + incoming).
  if (args[0] === "refs") {
    const name = args.slice(1).find((a) => !a.startsWith("--"));
    if (!name) {
      console.error("usage: resolver.ts refs <chord-name-or-slug> [--pretty]");
      Deno.exit(1);
    }
    const index = await buildIndex(roots);
    if (args.includes("--pretty")) {
      // refs is the compact projection of graph; the readable view is the graph.
      console.log(renderGraph(await chordGraph(index, name)).join("\n"));
      Deno.exit(0);
    }
    const refs = await chordRefs(index, name);
    console.log(JSON.stringify(
      {
        type: "fqdn_refs",
        query: name,
        found: refs.node.found,
        files_indexed: index.files,
        incoming_count: refs.incoming.length,
        ...refs,
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
        "       resolver.ts list [substring] [--limit=N]   (discover the namespace)\n" +
        "       resolver.ts search <query> [--kind=K]      (find content by keyword)\n" +
        "       resolver.ts refs <chord>                   (navigate citation edges)\n" +
        "       resolver.ts graph <query> [--pretty]       (one node's typed neighbourhood)\n" +
        "       resolver.ts recent [--limit=N] [--voice=V] [--root=S]  (recent chords, newest first)\n" +
        "       resolver.ts overview [--pretty] [--root=S]  (network shape; --root scopes to a substrate)\n" +
        "       resolver.ts atlas [--json]                  (the network for a person: identity + shape + pulse + doorways)\n" +
        "       resolver.ts lineage [--limit=N] [--json]    (the network's becoming: development arcs from the closes-graph)",
    );
    Deno.exit(1);
  }
  const res = await resolveFqdn(fqdn, roots);
  if (args.includes("--show")) {
    Deno.exit(await renderShow(res));
  }
  console.log(JSON.stringify({ type: "fqdn_resolution", ...res }, null, 2));
}
