// src/x8F10_external_surfaces_core.ts — core logic and definitions for external surfaces registry
// Coordinate 8/F10 → void-infinity(8) × completion-edge(F) = structural model of external surfaces registry.
// Imports and exports the types and core logic shared between x8F00 and x2F00_self.

import {
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { parseFrontmatter } from "./x0020_scanner_core.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

export interface SurfaceEntry {
  surface: string; // relative path from repo root
  category:
    | "compatibility_abi"
    | "compatibility"
    | "experimental"
    | "live_chord"
    | "local_cache"
    | "compost";
  canonical_status:
    | "canonical"
    | "compatibility"
    | "generated"
    | "runtime_cache"
    | "migration_input"
    | "compost"
    | "experimental";
  canonical_target: string;
  next_action:
    | "keep"
    | "generate_index"
    | "migrate_to_src"
    | "compost"
    | "ignore_runtime";
  blocked_by: string;
  size?: number;
  mtime?: string;
}

export interface RuntimeCacheSummary {
  total: number;
  stale_7d: number;
  oldest_days_ago: number | null;
  oldest: Array<{
    surface: string;
    days_ago: number | null;
    mtime: string;
  }>;
}

async function getFileInfo(
  fullPath: string,
): Promise<{ size: number; mtime: string }> {
  try {
    const stat = await Deno.stat(fullPath);
    return {
      size: stat.size,
      mtime: stat.mtime
        ? stat.mtime.toISOString().slice(0, 19) + "Z"
        : "unknown",
    };
  } catch {
    return { size: 0, mtime: "unknown" };
  }
}

async function getSymlinkTarget(
  fullPath: string,
): Promise<string> {
  try {
    const target = await Deno.readLink(fullPath);
    const dir = dirname(fullPath);
    const resolved = join(dir, target);
    return relative(ROOT, resolved);
  } catch {
    return "";
  }
}

export async function getGitTrackedFiles(): Promise<Set<string>> {
  const proc = new Deno.Command("git", {
    args: ["ls-files"],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await proc.output();
  if (code !== 0) {
    const errText = new TextDecoder().decode(stderr).trim();
    throw new Error(`git ls-files failed (code ${code}): ${errText}`);
  }
  const text = new TextDecoder().decode(stdout);
  return new Set(text.split("\n").map((f) => f.trim()).filter(Boolean));
}

async function scanContracts(
  includeVolatile: boolean,
): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "contracts");
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (
        (entry.isFile || entry.isSymlink) &&
        entry.name.endsWith(".md") &&
        entry.name !== "README.md"
      ) {
        const relPath = `contracts/${entry.name}`;
        const fullPath = join(dir, entry.name);

        let canonical_status: SurfaceEntry["canonical_status"] =
          "compatibility";
        let next_action: SurfaceEntry["next_action"] = "keep";
        let blocked_by = "";
        let canonical_target = "";

        if (entry.isSymlink) {
          canonical_target = await getSymlinkTarget(fullPath);
          canonical_status = "compatibility";
          next_action = "keep";
          blocked_by = "symlink shim";
        } else {
          const text = await Deno.readTextFile(fullPath);
          const fm = parseFrontmatter(text.replace(/\r\n/g, "\n"));

          const isPinned = entry.name.includes("BOOTSTRAP_PIN") ||
            /bitcoin\s+attestation|op_return|inscribed/i.test(text) ||
            String(fm?.pinned ?? "").toLowerCase() === "true" ||
            fm?.status === "pinned";

          if (entry.name === "TRINITY_CAPABILITIES.v0.1.md") {
            canonical_status = "compost";
            next_action = "compost";
            blocked_by = "codeicide pending";
          } else if (entry.name === "IN_LEDGER_OUT.v0.1.md") {
            canonical_status = "compatibility";
            next_action = "keep";
            blocked_by = "blocked by liquid v0.1 tools";
          } else if (isPinned) {
            canonical_status = "compatibility";
            next_action = "keep";
            blocked_by = "pinned invariant";
          } else if (fm?.status === "superseded") {
            canonical_status = "compost";
            next_action = "compost";
            blocked_by = "";
          } else if (fm?.status === "draft") {
            canonical_status = "compatibility";
            next_action = "keep";
            blocked_by = "draft status";
          } else {
            canonical_status = "compatibility";
            next_action = "keep";
            blocked_by = "active contract";
          }
        }

        const item: SurfaceEntry = {
          surface: relPath,
          category: "compatibility_abi",
          canonical_status,
          canonical_target,
          next_action,
          blocked_by,
        };

        if (includeVolatile) {
          const { size, mtime } = await getFileInfo(fullPath);
          item.size = size;
          item.mtime = mtime;
        }
        out.push(item);
      }
    }
  } catch { /* ignore missing dir */ }
  return out;
}

async function scanContractSchemas(
  includeVolatile: boolean,
): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "contracts", "schema");
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.endsWith(".json")) {
        const relPath = `contracts/schema/${entry.name}`;
        const fullPath = join(dir, entry.name);

        const item: SurfaceEntry = {
          surface: relPath,
          category: "compatibility_abi",
          canonical_status: "compatibility",
          canonical_target: "",
          next_action: "keep",
          blocked_by: "validation schema",
        };

        if (includeVolatile) {
          const { size, mtime } = await getFileInfo(fullPath);
          item.size = size;
          item.mtime = mtime;
        }
        out.push(item);
      }
    }
  } catch { /* ignore missing schema dir */ }
  return out;
}

async function scanDocs(includeVolatile: boolean): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "docs");
  const docTargets: Record<string, string> = {
    "AUDIT_MODEL.md": "src/x6C10_audit_model.myc.md",
    "COGNITIVE_THERMODYNAMICS.md": "src/x2C10_cognitive_thermodynamics.myc.md",
    "PROOF_CARRYING_RAW.md": "src/x5A10_proof_carrying_raw.myc.md",
    "PUBLIC_PROCESS_TRACE.md": "src/x8F11_public_process_trace.myc.md",
  };

  try {
    for await (const entry of Deno.readDir(dir)) {
      if (
        (entry.isFile || entry.isSymlink) &&
        entry.name.endsWith(".md")
      ) {
        const relPath = `docs/${entry.name}`;
        const fullPath = join(dir, entry.name);

        if (entry.isFile) {
          const isIndex = entry.name === "README.md";
          const target = isIndex ? "" : docTargets[entry.name] ?? "";
          const item: SurfaceEntry = {
            surface: relPath,
            category: "compatibility",
            canonical_status: isIndex ? "compatibility" : "migration_input",
            canonical_target: target,
            next_action: target ? "migrate_to_src" : "keep",
            blocked_by: isIndex ? "directory index" : "",
          };

          if (includeVolatile) {
            const { size, mtime } = await getFileInfo(fullPath);
            item.size = size;
            item.mtime = mtime;
          }
          out.push(item);
        } else if (entry.isSymlink) {
          const target = await getSymlinkTarget(fullPath);
          const item: SurfaceEntry = {
            surface: relPath,
            category: "compatibility",
            canonical_status: "compatibility",
            canonical_target: target,
            next_action: "keep",
            blocked_by: "symlink shim",
          };

          if (includeVolatile) {
            const { size, mtime } = await getFileInfo(fullPath);
            item.size = size;
            item.mtime = mtime;
          }
          out.push(item);
        }
      }
    }
  } catch { /* ignore missing dir */ }
  return out;
}

async function scanFixtures(includeVolatile: boolean): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "fixtures");

  async function walk(current: string, prefix: string): Promise<void> {
    try {
      for await (const entry of Deno.readDir(current)) {
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        const fullPath = join(current, entry.name);
        if (entry.isDirectory) {
          await walk(fullPath, relPath);
        } else if (
          entry.isFile &&
          (entry.name.endsWith(".json") || entry.name.endsWith(".md"))
        ) {
          const item: SurfaceEntry = {
            surface: `fixtures/${relPath}`,
            category: "experimental",
            canonical_status: "experimental",
            canonical_target: "",
            next_action: "keep",
            blocked_by: "test fixture",
          };

          if (includeVolatile) {
            const { size, mtime } = await getFileInfo(fullPath);
            item.size = size;
            item.mtime = mtime;
          }
          out.push(item);
        }
      }
    } catch { /* ignore missing fixtures dir */ }
  }

  await walk(dir, "");
  return out;
}

async function scanProbes(includeVolatile: boolean): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "probes");
  try {
    const indexPath = join(dir, "INDEX.md");
    try {
      const stat = await Deno.stat(indexPath);
      if (stat.isFile) {
        const item: SurfaceEntry = {
          surface: "probes/INDEX.md",
          category: "experimental",
          canonical_status: "experimental",
          canonical_target: "src/x8E00_probes.myc.md",
          next_action: "keep",
          blocked_by: "probe directory index",
        };

        if (includeVolatile) {
          const { size, mtime } = await getFileInfo(indexPath);
          item.size = size;
          item.mtime = mtime;
        }
        out.push(item);
      }
    } catch { /* ignore missing probes index */ }

    for await (const entry of Deno.readDir(dir)) {
      if (entry.isDirectory) {
        const probeDir = join(dir, entry.name);
        for await (const pEntry of Deno.readDir(probeDir)) {
          if (pEntry.isFile && pEntry.name.endsWith(".md")) {
            const relPath = `probes/${entry.name}/${pEntry.name}`;
            const fullPath = join(probeDir, pEntry.name);

            const item: SurfaceEntry = {
              surface: relPath,
              category: "experimental",
              canonical_status: "experimental",
              canonical_target: "",
              next_action: "keep",
              blocked_by: "active experiment",
            };

            if (includeVolatile) {
              const { size, mtime } = await getFileInfo(fullPath);
              item.size = size;
              item.mtime = mtime;
            }
            out.push(item);
          }
        }
      }
    }
  } catch { /* ignore */ }
  return out;
}

async function scanChords(includeVolatile: boolean): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "jazz", "chords");
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        const relPath = `jazz/chords/${entry.name}`;
        const fullPath = join(dir, entry.name);

        const item: SurfaceEntry = {
          surface: relPath,
          category: "live_chord",
          canonical_status: "canonical",
          canonical_target: "",
          next_action: "keep",
          blocked_by: "",
        };

        if (includeVolatile) {
          const { size, mtime } = await getFileInfo(fullPath);
          item.size = size;
          item.mtime = mtime;
        }
        out.push(item);
      }
    }
  } catch { /* ignore */ }
  return out;
}

async function scanState(includeVolatile: boolean): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  // state/ legacy dir removed in flat-src migration (2026-05-28). Daemon
  // runtime now at src/x7F88_daemon.*. The function is preserved as a
  // hook for future runtime-cache surfaces that need explicit registration.
  // Runtime caches are ignored by git but useful in `--volatile` diagnostics.
  const runtimeCachePatterns = [
    /^x2288_ecosystem\.latest\.myc\.json$/,
    /^x2488_cognition_snapshot\..+\.myc\.json$/,
    /^x2588_cognition_field\.latest\.myc\.(json|md)$/,
    /^x2A88_lexicon\.myc\.json$/,
    /^x5288_cognition_recommendation\.latest\.myc\.(json|md)$/,
    /^x5E88_cognition_recommendation\.receipt\.myc\.json$/,
    /^x6500_latest-.+\.myc\.(json|md)$/,
    /^x7F88_daemon\.(last-check|lock)$/,
  ];

  const dir = join(ROOT, "src");
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (!entry.isFile) continue;
      if (!runtimeCachePatterns.some((pattern) => pattern.test(entry.name))) {
        continue;
      }
      const relPath = `src/${entry.name}`;
      const fullPath = join(dir, entry.name);
      const item: SurfaceEntry = {
        surface: relPath,
        category: "local_cache",
        canonical_status: "runtime_cache",
        canonical_target: "",
        next_action: "ignore_runtime",
        blocked_by: "",
      };
      if (includeVolatile) {
        const { size, mtime } = await getFileInfo(fullPath);
        item.size = size;
        item.mtime = mtime;
      }
      out.push(item);
    }
  } catch { /* ignore */ }

  return out;
}

async function scanCompost(includeVolatile: boolean): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "src");
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (
        entry.isFile &&
        /^x48F[0-9A-Fa-f]_contract_.*_palimpsest\.myc\.md$/.test(entry.name)
      ) {
        const relPath = `src/${entry.name}`;
        const fullPath = join(dir, entry.name);

        const item: SurfaceEntry = {
          surface: relPath,
          category: "compost",
          canonical_status: "compost",
          canonical_target: "",
          next_action: "compost",
          blocked_by: "",
        };

        if (includeVolatile) {
          const { size, mtime } = await getFileInfo(fullPath);
          item.size = size;
          item.mtime = mtime;
        }
        out.push(item);
      }
    }
  } catch { /* ignore */ }
  return out;
}

async function scanRoot(includeVolatile: boolean): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const rootAbi: Record<string, string> = {
    ".gitignore": "git hygiene config",
    ".gitmodules": "submodule boundary",
    "README.md": "human root brief",
    "HUMAN.md": "human root brief",
    "deno.jsonc": "toolchain config",
    "deno.lock": "toolchain lockfile",
    "t": "command launcher",
  };

  try {
    for await (const entry of Deno.readDir(ROOT)) {
      if (entry.isSymlink && entry.name.endsWith(".md")) {
        const relPath = entry.name;
        const fullPath = join(ROOT, entry.name);
        const target = await getSymlinkTarget(fullPath);

        const item: SurfaceEntry = {
          surface: relPath,
          category: "compatibility_abi",
          canonical_status: "compatibility",
          canonical_target: target,
          next_action: "keep",
          blocked_by: "symlink shim",
        };

        if (includeVolatile) {
          const { size, mtime } = await getFileInfo(fullPath);
          item.size = size;
          item.mtime = mtime;
        }
        out.push(item);
      } else if (entry.isFile && rootAbi[entry.name]) {
        const relPath = entry.name;
        const fullPath = join(ROOT, entry.name);

        const item: SurfaceEntry = {
          surface: relPath,
          category: "compatibility_abi",
          canonical_status: "compatibility",
          canonical_target: "",
          next_action: "keep",
          blocked_by: rootAbi[entry.name],
        };

        if (includeVolatile) {
          const { size, mtime } = await getFileInfo(fullPath);
          item.size = size;
          item.mtime = mtime;
        }
        out.push(item);
      }
    }
  } catch { /* ignore */ }
  return out;
}

async function scanToolingAbi(
  includeVolatile: boolean,
): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const toolingAbi: Record<string, string> = {
    ".claude/settings.json": "agent tooling config",
    ".github/workflows/ci.yml": "ci workflow",
  };

  for (const [relPath, blockedBy] of Object.entries(toolingAbi)) {
    const fullPath = join(ROOT, relPath);
    try {
      const stat = await Deno.stat(fullPath);
      if (!stat.isFile) continue;

      const item: SurfaceEntry = {
        surface: relPath,
        category: "compatibility_abi",
        canonical_status: "compatibility",
        canonical_target: "",
        next_action: "keep",
        blocked_by: blockedBy,
      };

      if (includeVolatile) {
        const { size, mtime } = await getFileInfo(fullPath);
        item.size = size;
        item.mtime = mtime;
      }
      out.push(item);
    } catch { /* ignore missing optional tooling surface */ }
  }

  return out;
}

async function scanProposals(
  includeVolatile: boolean,
): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "proposals");

  async function walk(current: string, prefix: string): Promise<void> {
    try {
      for await (const entry of Deno.readDir(current)) {
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        const fullPath = join(current, entry.name);
        if (entry.isDirectory) {
          await walk(fullPath, relPath);
        } else if (entry.isFile && entry.name.endsWith(".json")) {
          const item: SurfaceEntry = {
            surface: `proposals/${relPath}`,
            category: "experimental",
            canonical_status: "experimental",
            canonical_target: "",
            next_action: "keep",
            blocked_by: "active governance proposal",
          };

          if (includeVolatile) {
            const { size, mtime } = await getFileInfo(fullPath);
            item.size = size;
            item.mtime = mtime;
          }
          out.push(item);
        }
      }
    } catch { /* ignore missing proposals dir */ }
  }

  await walk(dir, "");
  return out;
}

async function scanX9000(
  includeVolatile: boolean,
): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "x9000");
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile || entry.isSymlink) {
        const relPath = `x9000/${entry.name}`;
        const fullPath = join(dir, entry.name);

        let canonical_status: SurfaceEntry["canonical_status"] =
          "compatibility";
        let next_action: SurfaceEntry["next_action"] = "keep";
        let blocked_by = "compatibility projection";
        let canonical_target = "";

        if (entry.isSymlink) {
          canonical_target = await getSymlinkTarget(fullPath);
          blocked_by = "symlink to submodule";
        }

        const item: SurfaceEntry = {
          surface: relPath,
          category: "compatibility",
          canonical_status,
          canonical_target,
          next_action,
          blocked_by,
        };

        if (includeVolatile) {
          const { size, mtime } = await getFileInfo(fullPath);
          item.size = size;
          item.mtime = mtime;
        }
        out.push(item);
      }
    }
  } catch { /* ignore if x9000 doesn't exist yet */ }
  return out;
}

export async function collectExternalSurfaces(options: {
  stable: boolean;
  includeVolatile: boolean;
}): Promise<SurfaceEntry[]> {
  let entries: SurfaceEntry[] = [];

  entries.push(...(await scanContracts(options.includeVolatile)));
  entries.push(...(await scanContractSchemas(options.includeVolatile)));
  entries.push(...(await scanDocs(options.includeVolatile)));
  entries.push(...(await scanRoot(options.includeVolatile)));
  entries.push(...(await scanToolingAbi(options.includeVolatile)));
  entries.push(...(await scanFixtures(options.includeVolatile)));
  entries.push(...(await scanProbes(options.includeVolatile)));
  entries.push(...(await scanProposals(options.includeVolatile)));
  entries.push(...(await scanChords(options.includeVolatile)));
  entries.push(...(await scanState(options.includeVolatile)));
  entries.push(...(await scanCompost(options.includeVolatile)));
  entries.push(...(await scanX9000(options.includeVolatile)));

  // If stable, filter to keep only Git-tracked files
  if (options.stable) {
    const tracked = await getGitTrackedFiles();
    entries = entries.filter((e) => tracked.has(e.surface));
  }

  // Deterministically sort the entries primarily by surface
  entries.sort((a, b) => {
    if (a.surface < b.surface) return -1;
    if (a.surface > b.surface) return 1;
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    if (a.canonical_status < b.canonical_status) return -1;
    if (a.canonical_status > b.canonical_status) return 1;
    if (a.next_action < b.next_action) return -1;
    if (a.next_action > b.next_action) return 1;
    return 0;
  });

  return entries;
}

export function summarizeExternalSurfaces(
  entries: SurfaceEntry[],
): Record<string, number> {
  const counts: Record<string, number> = {
    compatibility_abi: 0,
    compatibility: 0,
    experimental: 0,
    live_chord: 0,
    local_cache: 0,
    compost: 0,
  };
  for (const e of entries) {
    counts[e.category] = (counts[e.category] ?? 0) + 1;
  }
  return counts;
}

export function summarizeRuntimeCaches(
  entries: SurfaceEntry[],
  nowMs = Date.now(),
): RuntimeCacheSummary {
  const caches = entries.filter((e) => e.category === "local_cache");
  const aged = caches.map((e) => {
    const parsed = e.mtime && e.mtime !== "unknown"
      ? new Date(e.mtime).getTime()
      : NaN;
    const days = Number.isNaN(parsed)
      ? null
      : Math.max(0, Math.floor((nowMs - parsed) / 86_400_000));
    return {
      surface: e.surface,
      days_ago: days,
      mtime: e.mtime ?? "unknown",
    };
  });

  aged.sort((a, b) => {
    const ad = a.days_ago ?? -1;
    const bd = b.days_ago ?? -1;
    if (bd !== ad) return bd - ad;
    return a.surface.localeCompare(b.surface);
  });

  const knownAges = aged
    .map((e) => e.days_ago)
    .filter((age): age is number => age !== null);

  return {
    total: caches.length,
    stale_7d: aged.filter((e) => (e.days_ago ?? 0) >= 7).length,
    oldest_days_ago: knownAges.length > 0 ? Math.max(...knownAges) : null,
    oldest: aged.slice(0, 5),
  };
}

export function chooseNextMigration(entries: SurfaceEntry[]): string {
  // Sort entries to make selection stable
  const docs = entries
    .filter((e) => e.next_action === "migrate_to_src" && e.canonical_target)
    .sort((a, b) => a.surface.localeCompare(b.surface));
  if (docs.length > 0) {
    return `${docs[0].surface} -> ${docs[0].canonical_target}`;
  }
  return "none";
}
