#!/usr/bin/env -S deno run --allow-read --allow-write
// src/x7400_export_clean.ts — export-clean / clean codebase dump
// position: 7/4 → completion(7) × foundation(4) = stable extraction artifact
// hex_dipole: "26 00 26 00 4C 00 26 6C"
//   completion_frontier+0.85 (PRIMARY: produces final extraction terminus; bucket 7 MATCH)
//   foundation_container+0.60 (stable artifact; sub-position 4 PAIR-MATCH)
//   void_infinity+0.30 (reads entire substrate)
//   mirror_apex+0.30 (mirrors substrate to external markdown)
//   harmony_emergence+0.30 (synthesizes ordered single-file output)
// placement_policy: axis
// intent: dump trinity substrate (excluding submodules, heavy logs, tests) to single markdown for external review
// maturity: active
// horizon: none (incremental and bucket-split exports implemented)
// skill_tag: export-clean
// skill_safe: yes-with-care

import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { expandGlob } from "https://deno.land/std@0.224.0/fs/expand_glob.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { sha256Hex, sha256HexBytes } from "./x4010_hash.ts";

const OUTPUT_DIR = "reports";
const OUTPUT_FILE = join(Deno.cwd(), OUTPUT_DIR, "trinity_clean_export.md");
const MANIFEST_FILE = join(
  Deno.cwd(),
  OUTPUT_DIR,
  "trinity_clean_export.manifest.json",
);

interface ExportEntry {
  path: string;
  block_type: string;
  hash: string;
  size: number;
}

interface BucketManifest {
  hash: string;
  files: { path: string; hash: string; size: number }[];
}

interface ExportManifest {
  global_hash: string;
  buckets: Record<string, BucketManifest>;
}

interface Args {
  dryRun: boolean;
  stable: boolean;
  force: boolean;
  bucket: string | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dryRun: argv.includes("--dry-run"),
    stable: argv.includes("--stable"),
    force: argv.includes("--force"),
    bucket: null,
  };

  for (const arg of argv) {
    if (arg.startsWith("--bucket=")) {
      args.bucket = arg.split("=")[1].toUpperCase();
    }
  }

  return args;
}

function getFileBucket(path: string): string {
  // Matches "src/x8C00_..." or just "x8C00_..."
  const match = path.match(/^(?:src\/)?x([0-9A-Fa-f])[0-9A-Fa-f]{3}_/);
  if (match) return match[1].toUpperCase();
  return "ROOT";
}

async function collectExportEntries(): Promise<ExportEntry[]> {
  const exts = ["**/*.md", "**/*.ts", "**/*.json", "**/*.ndjson"];
  const globOptions = {
    root: Deno.cwd(),
    exclude: [
      ".git",
      ".gemini",
      "node_modules",
      "reports",
      "archive",
      "tests",
      "jazz/chords", // Too massive
      "probes", // Temporary
      "liquid", // Submodule
      "omega", // Submodule
      "myc", // Submodule
    ],
  };

  const entries: ExportEntry[] = [];
  for (const ext of exts) {
    for await (const entry of expandGlob(ext, globOptions)) {
      if (!entry.isFile) continue;
      const relativePath = entry.path.replace(Deno.cwd() + "/", "");

      // Extra safety checks to match excludes
      if (
        relativePath.startsWith("tests/") ||
        relativePath.startsWith("liquid/") ||
        relativePath.startsWith("omega/") ||
        relativePath.startsWith("myc/") ||
        relativePath.startsWith("jazz/chords/") ||
        relativePath.startsWith("probes/") ||
        relativePath.startsWith("archive/")
      ) {
        continue;
      }

      let blockType = "text";
      if (entry.name.endsWith(".md")) blockType = "markdown";
      else if (entry.name.endsWith(".ts")) blockType = "typescript";
      else if (entry.name.endsWith(".json") || entry.name.endsWith(".ndjson")) {
        blockType = "json";
      }

      try {
        const bytes = await Deno.readFile(relativePath);
        const hash = await sha256HexBytes(bytes);
        entries.push({
          path: relativePath,
          block_type: blockType,
          hash,
          size: bytes.length,
        });
      } catch (e: any) {
        console.warn(`⚠️ Could not hash file ${relativePath}: ${e.message}`);
      }
    }
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

async function loadManifest(): Promise<ExportManifest | null> {
  try {
    const text = await Deno.readTextFile(MANIFEST_FILE);
    return JSON.parse(text) as ExportManifest;
  } catch {
    return null;
  }
}

async function writeManifest(manifest: ExportManifest) {
  await Deno.writeTextFile(
    MANIFEST_FILE,
    JSON.stringify(manifest, null, 2) + "\n",
  );
}

async function writeExportFile(
  filePath: string,
  title: string,
  entries: ExportEntry[],
  args: Args,
) {
  const fileObj = await Deno.open(filePath, {
    write: true,
    create: true,
    truncate: true,
  });
  const encoder = new TextEncoder();
  const write = async (text: string) => {
    await fileObj.write(encoder.encode(text));
  };

  await write(`# ${title}\n\n`);
  if (!args.stable) {
    await write(`Generated at: ${new Date().toISOString()}\n\n`);
  }
  await write(
    `This is a full source code export of the codebase segment, excluding submodules, heavy logs, and tests.\n\n`,
  );

  for (const entry of entries) {
    await write(`\n### ${entry.path}\n\n`);
    await write(`\`\`\`${entry.block_type}\n`);
    try {
      const content = await Deno.readTextFile(entry.path);
      await write(content);
    } catch (e: any) {
      await write(`// Could not read file: ${e.message}`);
    }
    await write(`\n\`\`\`\n\n`);
  }

  fileObj.close();
}

async function exportCleanCodebase(argv: string[]) {
  const args = parseArgs(argv);
  await ensureDir(join(Deno.cwd(), OUTPUT_DIR));

  const oldManifest = await loadManifest();
  const entries = await collectExportEntries();

  // Group entries by bucket
  const buckets: Record<string, ExportEntry[]> = {};
  for (const entry of entries) {
    const b = getFileBucket(entry.path);
    if (!buckets[b]) buckets[b] = [];
    buckets[b].push(entry);
  }

  // Calculate bucket hashes and build new manifest structure
  const bucketManifests: Record<string, BucketManifest> = {};
  for (const [b, files] of Object.entries(buckets)) {
    const descriptor = files
      .map((f) => `${f.path}:${f.hash}:${f.size}`)
      .join("\n");
    const hash = await sha256Hex(descriptor);
    bucketManifests[b] = {
      hash,
      files: files.map((f) => ({ path: f.path, hash: f.hash, size: f.size })),
    };
  }

  const globalDescriptor = Object.entries(bucketManifests)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([b, meta]) => `${b}:${meta.hash}`)
    .join("\n");
  const globalHash = await sha256Hex(globalDescriptor);

  const newManifest: ExportManifest = {
    global_hash: globalHash,
    buckets: bucketManifests,
  };

  const writtenFiles: string[] = [];
  const skippedBuckets: string[] = [];

  // Check which buckets actually need writing
  const bucketsToProcess = args.bucket
    ? Object.keys(buckets).filter((b) => b === args.bucket)
    : Object.keys(buckets);

  const globalUnchanged = oldManifest && oldManifest.global_hash === globalHash;

  if (globalUnchanged && !args.force && !args.bucket) {
    console.log(
      JSON.stringify(
        {
          type: "export_clean",
          position: "7/4",
          action: "export",
          dry_run: args.dryRun,
          note: "no changes detected, export skipped",
          summary: {
            files: entries.length,
            global_hash: globalHash,
            status: "skipped",
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  if (!args.dryRun) {
    for (const b of bucketsToProcess) {
      const bucketHash = bucketManifests[b].hash;
      const oldBucketHash = oldManifest?.buckets[b]?.hash;
      const bucketFile = join(
        Deno.cwd(),
        OUTPUT_DIR,
        `trinity_clean_export_bucket_${b.toLowerCase()}.md`,
      );

      if (oldBucketHash === bucketHash && !args.force) {
        skippedBuckets.push(b);
        continue;
      }

      const title = `Trinity Clean Codebase Export — Bucket ${b}`;
      await writeExportFile(bucketFile, title, buckets[b], args);
      writtenFiles.push(bucketFile);
    }

    // Write global unified file if not filtered by bucket
    if (!args.bucket) {
      const title = "Trinity Meta-Layer Clean Codebase Export";
      await writeExportFile(OUTPUT_FILE, title, entries, args);
      writtenFiles.push(OUTPUT_FILE);
    }

    // Merge old manifest with new updates (in case we only processed one bucket)
    if (oldManifest && args.bucket) {
      const mergedBuckets = { ...oldManifest.buckets, ...newManifest.buckets };
      const mergedDescriptor = Object.entries(mergedBuckets)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([b, meta]) => `${b}:${meta.hash}`)
        .join("\n");
      const mergedGlobalHash = await sha256Hex(mergedDescriptor);
      await writeManifest({
        global_hash: mergedGlobalHash,
        buckets: mergedBuckets,
      });
    } else {
      await writeManifest(newManifest);
    }
  }

  console.log(
    JSON.stringify(
      {
        type: "export_clean",
        position: "7/4",
        action: "export",
        dry_run: args.dryRun,
        written: writtenFiles.map((p) => p.replace(Deno.cwd() + "/", "")),
        skipped_buckets: skippedBuckets,
        summary: {
          total_files: entries.length,
          global_hash: globalHash,
          processed_buckets: bucketsToProcess,
        },
      },
      null,
      2,
    ),
  );
}

if (import.meta.main) {
  await exportCleanCodebase(Deno.args);
}
