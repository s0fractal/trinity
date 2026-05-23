// src/x8F10_external_surfaces_core.ts — core logic and definitions for external surfaces registry
// Coordinate 8/F10 → void-infinity(8) × completion-edge(F) = structural model of external surfaces registry.
// Imports and exports the types and core logic shared between x8F00 and x2F00_self.

import {
  dirname,
  fromFileUrl,
  join,
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
        entry.isFile &&
        entry.name.endsWith(".md") &&
        entry.name !== "README.md"
      ) {
        const relPath = `contracts/${entry.name}`;
        const fullPath = join(dir, entry.name);
        const text = await Deno.readTextFile(fullPath);
        const fm = parseFrontmatter(text.replace(/\r\n/g, "\n"));

        const isPinned = entry.name.includes("BOOTSTRAP_PIN") ||
          /bitcoin\s+attestation|op_return|inscribed/i.test(text) ||
          String(fm?.pinned ?? "").toLowerCase() === "true" ||
          fm?.status === "pinned";

        let canonical_status: SurfaceEntry["canonical_status"] =
          "compatibility";
        let next_action: SurfaceEntry["next_action"] = "keep";
        let blocked_by = "";

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

        const item: SurfaceEntry = {
          surface: relPath,
          category: "compatibility_abi",
          canonical_status,
          canonical_target: "",
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

async function scanDocs(includeVolatile: boolean): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "docs");
  const docTargets: Record<string, string> = {
    "AUDIT_MODEL.md": "src/x6C10_audit_model.myc.md",
    "COGNITIVE_THERMODYNAMICS.md": "src/x2C10_cognitive_thermodynamics.myc.md",
    "PROOF_CARRYING_RAW.md": "src/x5A10_proof_carrying_raw.myc.md",
    "PUBLIC_PROCESS_TRACE.md": "src/x8F10_public_process_trace.myc.md",
  };

  try {
    for await (const entry of Deno.readDir(dir)) {
      if (
        entry.isFile &&
        entry.name.endsWith(".md") &&
        entry.name !== "README.md"
      ) {
        const relPath = `docs/${entry.name}`;
        const fullPath = join(dir, entry.name);
        const target = docTargets[entry.name] ?? "";

        const item: SurfaceEntry = {
          surface: relPath,
          category: "compatibility",
          canonical_status: "migration_input",
          canonical_target: target,
          next_action: target ? "migrate_to_src" : "keep",
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
  } catch { /* ignore missing dir */ }
  return out;
}

async function scanProbes(includeVolatile: boolean): Promise<SurfaceEntry[]> {
  const out: SurfaceEntry[] = [];
  const dir = join(ROOT, "probes");
  try {
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
  const dir = join(ROOT, "state");
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (
        entry.isFile &&
        entry.name !== "audit" &&
        entry.name !== "cognition" &&
        entry.name !== "voices"
      ) {
        const relPath = `state/${entry.name}`;
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
    }
  } catch { /* ignore */ }

  const ecoCachePath = join(ROOT, "src", "x2288_ecosystem.latest.myc.json");
  try {
    const stat = await Deno.stat(ecoCachePath);
    if (stat.isFile) {
      const item: SurfaceEntry = {
        surface: "src/x2288_ecosystem.latest.myc.json",
        category: "local_cache",
        canonical_status: "runtime_cache",
        canonical_target: "",
        next_action: "ignore_runtime",
        blocked_by: "",
      };
      if (includeVolatile) {
        item.size = stat.size;
        item.mtime = stat.mtime
          ? stat.mtime.toISOString().slice(0, 19) + "Z"
          : "unknown";
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

export async function collectExternalSurfaces(options: {
  stable: boolean;
  includeVolatile: boolean;
}): Promise<SurfaceEntry[]> {
  let entries: SurfaceEntry[] = [];

  entries.push(...(await scanContracts(options.includeVolatile)));
  entries.push(...(await scanDocs(options.includeVolatile)));
  entries.push(...(await scanProbes(options.includeVolatile)));
  entries.push(...(await scanChords(options.includeVolatile)));
  entries.push(...(await scanState(options.includeVolatile)));
  entries.push(...(await scanCompost(options.includeVolatile)));

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
