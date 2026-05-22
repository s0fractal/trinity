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
