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
// horizon: incremental export (skip unchanged sections via content-hash); split by bucket for partial reviews
// skill_tag: export
// skill_safe: yes-with-care
//
// Usage:
//   ./t export-clean --dry-run
//   ./t export-clean
//
// Closes Vector 3 organ-gap finding (claude+kimi+antigravity 2026-05-22):
// this was the 1 dispatchable organ flagged "no_dipole organ-gap" by the
// audit-split refinement; now has dipole, becomes audit-visible.

import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { expandGlob } from "https://deno.land/std@0.224.0/fs/expand_glob.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const OUTPUT_DIR = "reports";
const OUTPUT_FILE = join(Deno.cwd(), OUTPUT_DIR, "trinity_clean_export.md");

interface ExportEntry {
  path: string;
  block_type: string;
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

      // Extra safety checks
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
      if (entry.name.endsWith(".ts")) blockType = "typescript";
      if (entry.name.endsWith(".json")) blockType = "json";
      if (entry.name.endsWith(".ndjson")) blockType = "json";

      entries.push({ path: relativePath, block_type: blockType });
    }
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

async function exportCleanCodebase(dryRun: boolean) {
  const entries = await collectExportEntries();
  let bytesWritten = 0;

  if (!dryRun) {
    await ensureDir(join(Deno.cwd(), OUTPUT_DIR));

    const fileObj = await Deno.open(OUTPUT_FILE, {
      write: true,
      create: true,
      truncate: true,
    });
    const encoder = new TextEncoder();
    const write = async (text: string) => {
      const bytes = encoder.encode(text);
      bytesWritten += bytes.length;
      await fileObj.write(bytes);
    };

    await write(`# Trinity Meta-Layer Clean Codebase Export\n\n`);
    await write(`Generated at: ${new Date().toISOString()}\n\n`);
    await write(
      `This is a full source code export of the Trinity substrate, excluding submodules, heavy logs, and tests.\n\n`,
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

  console.log(JSON.stringify(
    {
      type: "export_clean",
      position: "7/4",
      action: "export",
      dry_run: dryRun,
      out: dryRun ? null : OUTPUT_FILE,
      summary: {
        files: entries.length,
        bytes_written: bytesWritten,
        excluded: [
          ".git",
          ".gemini",
          "node_modules",
          "reports",
          "archive",
          "tests",
          "jazz/chords",
          "probes",
          "liquid",
          "omega",
          "myc",
        ],
      },
    },
    null,
    2,
  ));
}

if (import.meta.main) {
  await exportCleanCodebase(Deno.args.includes("--dry-run"));
}
