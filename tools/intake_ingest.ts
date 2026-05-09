import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { join, basename, dirname } from "https://deno.land/std@0.224.0/path/mod.ts";
import { calculateFqdnHash } from "../liquid/00_core/liquid_codec.ts";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

/**
 * Intake Ingestor (Era 2080 - Codex Step 1)
 * Converts a raw model note into a physical content-addressed FQDN object.
 */

const RAW_DIR = "intake/raw";
const OBJECT_DIR = "intake/objects/sha256";
const PROJECTION_FILE = "intake/projections/index.ndjson";

async function computeSha256Hex(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

import { parse as parseYaml } from "https://deno.land/std@0.224.0/yaml/mod.ts";

function extractPhase(content: string): string {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (match) {
    try {
      const doc = parseYaml(match[1]) as Record<string, unknown>;
      if (doc && typeof doc.thought_phase === "string") {
        return doc.thought_phase;
      }
    } catch {
      // ignore parse errors
    }
  }
  return "raw";
}

async function ingestFile(filePath: string) {
  const content = await Deno.readTextFile(filePath);
  const rawFileName = basename(filePath);

  // 1. Calculate the SHA-256 (Object ID)
  const sha256 = await computeSha256Hex(content);

  // 2. Calculate the FQDN Prefix (h.<12-hex>)
  const fqdnPrefix = await calculateFqdnHash(content);

  // 3. Derive the Semantic Slug (e.g., codex.0003.nearest-strategic-steps)
  const slug = rawFileName.replace(/\.md$/, "");

  // 4. Construct the Target FQDN path
  // intake/objects/sha256/<2>/<2>/h.<12hex>.<slug>.<kind>.trinity.md
  // Using the Holographic Hash Header pattern, 'kind' becomes the structural class
  const kind = extractPhase(content);
  const fqdnName = `${fqdnPrefix}.${slug}.${kind}.trinity.md`;

  const dir1 = sha256.substring(0, 2);
  const dir2 = sha256.substring(2, 4);
  const targetDir = join(OBJECT_DIR, dir1, dir2);
  const targetPath = join(targetDir, fqdnName);

  // 5. Ensure target directory exists and write the file
  await ensureDir(targetDir);
  await Deno.writeTextFile(targetPath, content);
  console.log(`✅ Ingested: ${rawFileName} -> ${targetPath}`);

  // 6. Append to the projection index
  const indexRow = {
    source_file: filePath,
    source_hash: `sha256:${sha256}`,
    target_fqdn: fqdnName,
    descriptor_type: "RawCaptureDescriptor",
    timestamp: new Date().toISOString(),
  };

  await ensureDir(dirname(PROJECTION_FILE));
  await Deno.writeTextFile(PROJECTION_FILE, JSON.stringify(indexRow) + "\n", { append: true });
}

async function main() {
  const args = Deno.args;
  if (args.length === 0) {
    console.error("Usage: deno run -A tools/intake_ingest.ts <file1> <file2> ...");
    console.error("Example: deno task intake:ingest intake/raw/codex.0003.nearest-strategic-steps.md");
    Deno.exit(1);
  }

  for (const file of args) {
    try {
      await ingestFile(file);
    } catch (e: any) {
      console.error(`🚨 Failed to ingest ${file}: ${e.message}`);
    }
  }
}

main();
