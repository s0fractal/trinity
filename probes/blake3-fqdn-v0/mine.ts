// mine.ts — find a mining_nonce such that SHA-256(file)[:3] matches the
// filename's positions [2:5] (the content_check_prefix slot).
//
// Workflow:
//   filename xA3F2_handle.myc.md  →  target prefix "3F2"
//   iterate mining_nonce in frontmatter until SHA-256(content)[:3] === "3F2"
//
// Run: deno run --config=probe.jsonc -A mine.ts <path-to-myc.md>
//
// Limits: nonce search caps at 100_000. Expected average ~4096 attempts
// for 3-hex match (12-bit space). If cap exceeded, mining failed —
// either filename target is unreachable for this content (statistically
// improbable but possible) or the nonce update logic is broken.

import { basename } from "https://deno.land/std@0.224.0/path/mod.ts";
import { contentCheckPrefix } from "./hash.ts";

const NONCE_RE = /^mining_nonce:\s*(-?\d+)\s*$/m;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const FILENAME_RE = /^x[0-9A-Fa-f]([0-9A-Fa-f]{3})_/;

const MAX_ATTEMPTS = 100_000;

function extractFilenamePrefix(filename: string): string {
  const m = FILENAME_RE.exec(basename(filename));
  if (!m) {
    throw new Error(
      `filename ${filename} does not match x<hex><hex>{3}_*.myc.md pattern`,
    );
  }
  return m[1].toUpperCase();
}

function updateNonce(content: string, nonce: number): string {
  const fm = FRONTMATTER_RE.exec(content);
  if (!fm) {
    throw new Error("file has no YAML frontmatter (---...--- block)");
  }
  if (NONCE_RE.test(fm[1])) {
    // existing nonce — replace
    return content.replace(NONCE_RE, `mining_nonce: ${nonce}`);
  }
  // no nonce field yet — inject before closing ---
  const before = content.slice(0, fm[0].length - 4); // up to before "---\n"
  const after = content.slice(fm[0].length - 4);
  return `${before}mining_nonce: ${nonce}\n${after}`;
}

async function mine(
  path: string,
): Promise<{ nonce: number; attempts: number; final_prefix: string }> {
  const target = extractFilenamePrefix(path);
  const original = await Deno.readTextFile(path);

  console.log(`# target prefix from filename: ${target}`);

  for (let nonce = 0; nonce < MAX_ATTEMPTS; nonce++) {
    const candidate = updateNonce(original, nonce);
    const prefix = await contentCheckPrefix(candidate);
    if (prefix === target) {
      await Deno.writeTextFile(path, candidate);
      return { nonce, attempts: nonce + 1, final_prefix: prefix };
    }
  }
  throw new Error(`mining exceeded ${MAX_ATTEMPTS} attempts without match`);
}

if (import.meta.main) {
  const path = Deno.args[0];
  if (!path) {
    console.error("usage: mine.ts <path-to-myc.md>");
    Deno.exit(2);
  }
  const result = await mine(path);
  console.log(`# mined ${path}`);
  console.log(`# nonce: ${result.nonce}`);
  console.log(`# attempts: ${result.attempts}`);
  console.log(`# final SHA-256[:3]: ${result.final_prefix}`);
}
