import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import {
  basename,
  dirname,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.224.0/yaml/mod.ts";
import { fqdnPrefix, sha256Hex } from "../lib/canon/hash.ts";

/**
 * Intake Ingestor
 *
 * Converts a raw model note into a content-addressed FQDN object.
 *
 * Idempotent: re-running on the same content (same sha256) is a no-op.
 * Self-healing: malformed lines in the projection index are filtered on
 * read; the rebuilt index contains only valid rows, deduped by
 * (sha256, target_fqdn).
 */

const OBJECT_DIR = "intake/objects/sha256";
const PROJECTION_FILE = "intake/projections/index.ndjson";

interface IndexRow {
  source_file: string;
  source_hash: string;
  target_fqdn: string;
  descriptor_type: string;
  timestamp: string;
}

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

async function readIndex(): Promise<{ rows: IndexRow[]; dropped: number }> {
  let text: string;
  try {
    text = await Deno.readTextFile(PROJECTION_FILE);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return { rows: [], dropped: 0 };
    throw e;
  }
  const rows: IndexRow[] = [];
  let dropped = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      if (
        typeof obj === "object" && obj !== null &&
        typeof obj.source_hash === "string" &&
        typeof obj.target_fqdn === "string"
      ) {
        rows.push(obj as IndexRow);
      } else {
        dropped++;
      }
    } catch {
      dropped++;
    }
  }
  return { rows, dropped };
}

async function writeIndex(rows: IndexRow[]): Promise<void> {
  await ensureDir(dirname(PROJECTION_FILE));
  const body = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await Deno.writeTextFile(PROJECTION_FILE, body);
}

interface IngestResult {
  status: "ingested" | "skipped";
  source: string;
  target_fqdn: string;
  source_hash: string;
  reason?: string;
}

async function ingestFile(
  filePath: string,
  index: Map<string, IndexRow>,
): Promise<IngestResult> {
  const content = await Deno.readTextFile(filePath);
  const rawFileName = basename(filePath);

  const sha256 = await sha256Hex(content);
  const fqPrefix = await fqdnPrefix(content);
  const slug = rawFileName.replace(/\.md$/, "");
  const kind = extractPhase(content);
  const fqdnName = `${fqPrefix}.${slug}.${kind}.trinity.md`;

  const dir1 = sha256.substring(0, 2);
  const dir2 = sha256.substring(2, 4);
  const targetDir = join(OBJECT_DIR, dir1, dir2);
  const targetPath = join(targetDir, fqdnName);

  const indexKey = `sha256:${sha256}|${fqdnName}`;
  if (index.has(indexKey)) {
    return {
      status: "skipped",
      source: filePath,
      target_fqdn: fqdnName,
      source_hash: `sha256:${sha256}`,
      reason: "already in index with same content+target",
    };
  }

  // Even if a different target_fqdn exists for the same sha256 (e.g. kind
  // changed across runs), we still write a fresh row so history is
  // append-only at the projection layer. The object file itself is
  // content-addressed under sha256/<aa>/<bb>/, so no duplication on disk
  // unless the new target_fqdn differs.
  await ensureDir(targetDir);
  await Deno.writeTextFile(targetPath, content);

  const row: IndexRow = {
    source_file: filePath,
    source_hash: `sha256:${sha256}`,
    target_fqdn: fqdnName,
    descriptor_type: "RawCaptureDescriptor",
    timestamp: new Date().toISOString(),
  };
  index.set(indexKey, row);

  return {
    status: "ingested",
    source: filePath,
    target_fqdn: fqdnName,
    source_hash: row.source_hash,
  };
}

async function main() {
  const args = Deno.args;
  if (args.length === 0) {
    console.error(
      "Usage: deno run -A tools/intake_ingest.ts <file1> <file2> ...",
    );
    console.error(
      "Example: deno task intake:ingest intake/raw/codex.0003.nearest-strategic-steps.md",
    );
    Deno.exit(1);
  }

  const { rows, dropped } = await readIndex();
  if (dropped > 0) {
    console.warn(
      `⚠️  ${dropped} malformed line(s) in ${PROJECTION_FILE} will be dropped on rewrite`,
    );
  }

  const index = new Map<string, IndexRow>();
  for (const r of rows) {
    index.set(`${r.source_hash}|${r.target_fqdn}`, r);
  }

  let ingested = 0;
  let skipped = 0;
  for (const file of args) {
    try {
      const result = await ingestFile(file, index);
      if (result.status === "ingested") {
        ingested++;
        console.log(`✅ Ingested: ${file} -> ${result.target_fqdn}`);
      } else {
        skipped++;
        console.log(`↺  Skipped:  ${file} (${result.reason})`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`🚨 Failed to ingest ${file}: ${msg}`);
    }
  }

  await writeIndex([...index.values()]);

  console.log(
    `\nSummary: ${ingested} ingested, ${skipped} skipped, ${dropped} malformed dropped, ${index.size} total rows`,
  );
}

main();
