import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { dirname, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.224.0/yaml/mod.ts";

const PROJECTION_FILE = "intake/projections/index.ndjson";
const CANDIDATES_FILE = "public-candidates/myc/process.ndjson";
const OBJECT_DIR = "intake/objects/sha256";

interface IndexRow {
  source_file: string;
  source_hash: string;
  target_fqdn: string;
  descriptor_type: string;
  timestamp: string;
}

function parseFrontmatter(content: string): Record<string, any> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    const doc = parseYaml(match[1]);
    return typeof doc === "object" ? (doc as Record<string, any>) : null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("🔍 Scanning intake projections for MYC publication candidates...");
  
  let projectionText = "";
  try {
    projectionText = await Deno.readTextFile(PROJECTION_FILE);
  } catch (e) {
    console.error("No projection index found.");
    return;
  }

  const existingCandidates = new Set<string>();
  try {
    const candidatesText = await Deno.readTextFile(CANDIDATES_FILE);
    for (const line of candidatesText.split("\n").filter((l) => l.trim())) {
      const parsed = JSON.parse(line);
      existingCandidates.add(parsed.target_fqdn);
    }
  } catch (e) {
    // File may not exist yet
  }

  const lines = projectionText.split("\n").filter((l) => l.trim());
  let addedCount = 0;

  for (const line of lines) {
    const row: IndexRow = JSON.parse(line);
    if (existingCandidates.has(row.target_fqdn)) continue;

    const hashHex = row.source_hash.replace("sha256:", "");
    const dir1 = hashHex.substring(0, 2);
    const dir2 = hashHex.substring(2, 4);
    const objectPath = join(OBJECT_DIR, dir1, dir2, row.target_fqdn);

    let content = "";
    try {
      content = await Deno.readTextFile(objectPath);
    } catch {
      console.warn(`⚠️ Warning: Object not found at ${objectPath}`);
      continue;
    }

    const fm = parseFrontmatter(content);
    if (fm && fm.publish_policy && fm.publish_policy.visibility === "public-candidate") {
      const candidateRow = {
        source_hash: row.source_hash,
        source_path: objectPath,
        target_fqdn: row.target_fqdn,
        descriptor_type: fm.type || row.descriptor_type,
        publish_policy: "public-candidate",
        redaction: fm.publish_policy.redaction || "none",
        status: "candidate",
      };

      await ensureDir(dirname(CANDIDATES_FILE));
      await Deno.writeTextFile(CANDIDATES_FILE, JSON.stringify(candidateRow) + "\n", { append: true });
      console.log(`✅ Emitted MYC Candidate: ${row.target_fqdn}`);
      addedCount++;
    }
  }

  if (addedCount === 0) {
    console.log("No new candidates found.");
  } else {
    console.log(`\n🎉 Emitted ${addedCount} new public-candidates to ${CANDIDATES_FILE}`);
  }
}

main();
