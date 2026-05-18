// verify.ts — check that filename's content_check_prefix matches SHA-256(content)[:3]
//
// Run: deno run --config=probe.jsonc -A verify.ts <path-to-myc.md> [...]
//
// Exit codes:
//   0  all files match
//   1  one or more files have drift (filename prefix != content hash prefix)
//   2  usage / parse error

import { basename } from "https://deno.land/std@0.224.0/path/mod.ts";
import { contentCheckPrefix } from "./hash.ts";

const FILENAME_RE = /^x[0-9A-Fa-f]([0-9A-Fa-f]{3})_/;

interface Result {
  path: string;
  filename_prefix: string | null;
  actual_prefix: string | null;
  match: boolean;
  note: string;
}

async function verifyOne(path: string): Promise<Result> {
  const m = FILENAME_RE.exec(basename(path));
  if (!m) {
    return {
      path,
      filename_prefix: null,
      actual_prefix: null,
      match: false,
      note: "filename does not match x<hex><hex>{3}_*.myc.md pattern",
    };
  }
  const filename_prefix = m[1].toUpperCase();
  let body: string;
  try {
    body = await Deno.readTextFile(path);
  } catch (e) {
    return {
      path,
      filename_prefix,
      actual_prefix: null,
      match: false,
      note: `unreadable: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  const actual_prefix = await contentCheckPrefix(body);
  const match = actual_prefix === filename_prefix;
  return {
    path,
    filename_prefix,
    actual_prefix,
    match,
    note: match
      ? "ok"
      : `drift: filename claims ${filename_prefix}, content hashes to ${actual_prefix}`,
  };
}

if (import.meta.main) {
  const paths = Deno.args;
  if (paths.length === 0) {
    console.error("usage: verify.ts <path-to-myc.md> [...]");
    Deno.exit(2);
  }
  const results: Result[] = [];
  for (const p of paths) {
    results.push(await verifyOne(p));
  }
  let drift = 0;
  for (const r of results) {
    const tag = r.match ? "✓" : "✗";
    console.log(`${tag} ${basename(r.path)}  filename:${r.filename_prefix ?? "?"}  content:${r.actual_prefix ?? "?"}  — ${r.note}`);
    if (!r.match) drift++;
  }
  console.log(`---`);
  console.log(`${results.length - drift}/${results.length} match, ${drift} drift`);
  Deno.exit(drift > 0 ? 1 : 0);
}
