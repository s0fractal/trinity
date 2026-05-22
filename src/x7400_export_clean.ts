// src/x7400_export_clean.ts — export / clean codebase dump
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
// Closes Vector 3 organ-gap finding (claude+kimi+antigravity 2026-05-22):
// this was the 1 dispatchable organ flagged "no_dipole organ-gap" by the
// audit-split refinement; now has dipole, becomes audit-visible.

import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { expandGlob } from "https://deno.land/std@0.224.0/fs/expand_glob.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const OUTPUT_DIR = "reports";
const OUTPUT_FILE = join(Deno.cwd(), OUTPUT_DIR, "trinity_clean_export.md");

async function exportCleanCodebase() {
  await ensureDir(join(Deno.cwd(), OUTPUT_DIR));

  const fileObj = await Deno.open(OUTPUT_FILE, {
    write: true,
    create: true,
    truncate: true,
  });
  const encoder = new TextEncoder();

  await fileObj.write(
    encoder.encode(`# Trinity Meta-Layer Clean Codebase Export\n\n`),
  );
  await fileObj.write(
    encoder.encode(`Generated at: ${new Date().toISOString()}\n\n`),
  );
  await fileObj.write(
    encoder.encode(
      `This is a full source code export of the Trinity substrate, excluding submodules, heavy logs, and tests.\n\n`,
    ),
  );

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

      await fileObj.write(encoder.encode(`\n### ${relativePath}\n\n`));
      await fileObj.write(encoder.encode(`\`\`\`${blockType}\n`));
      try {
        const content = await Deno.readTextFile(entry.path);
        await fileObj.write(encoder.encode(content));
      } catch (e: any) {
        await fileObj.write(
          encoder.encode(`// Could not read file: ${e.message}`),
        );
      }
      await fileObj.write(encoder.encode(`\n\`\`\`\n\n`));
    }
  }

  fileObj.close();
  console.log(`✅ Clean export created -> ${OUTPUT_FILE}`);
}

if (import.meta.main) {
  await exportCleanCodebase();
}
