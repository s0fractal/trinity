// gen.ts — bucket-state generator (probe v0, post-Codex-review)
//
// Walks ./src/ for files matching x<bucket><sub-3>_<handle>.ts, parses
// header comments for `intent / maturity / horizon` fields, and renders
// xN888_state.myc.md (per-bucket) + x8888_agents.myc.md (substrate-level
// federation pointer).
//
// Self-contained: works against probe fixture in ./src/ only. Does NOT
// touch trinity's real src/. Output goes to ./output/.
//
// Run:
//   deno run --config=probe.jsonc -A gen.ts             # all buckets, full output
//   deno run --config=probe.jsonc -A gen.ts --bucket=6  # one bucket
//   deno run --config=probe.jsonc -A gen.ts --stable    # omit generated_at; diff-friendly
//
// Per Codex review 2026-05-19:
// - --bucket arg now honored (was documented, was not read)
// - maturity values validated against enum (typos → invalid_maturity warning, not silent)
// - --stable mode for deterministic output (omits generated_at)
// - source_manifest_hash emitted in output: receipt-like projection, not just cache

import { dirname, fromFileUrl, join, relative } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const SRC = join(HERE, "src");
const OUT = join(HERE, "output");

const FILENAME_RE = /^x([0-9A-Fa-f])([0-9A-Fa-f]{3})_([^.]+)\.ts$/;
const HEADER_RE = /^\/\/\s*(\w+):\s*(.+?)\s*$/;

const KNOWN_HEADER_FIELDS = new Set([
  "intent",
  "maturity",
  "horizon",
  "position",
  "hex_dipole",
  "placement_policy",
]);

const VALID_MATURITY = new Set(["draft", "active", "frozen", "archived"]);

type Maturity = "draft" | "active" | "frozen" | "archived";

interface OrganMeta {
  filename: string;
  coordinate: string;
  bucket: string;
  sub: string;
  handle: string;
  intent?: string;
  maturity?: Maturity;
  invalid_maturity?: string; // raw string when not in VALID_MATURITY
  horizon?: string;
  position?: string;
  hex_dipole?: string;
  placement_policy?: string;
  source_hash: string;
  source_size: number;
}

interface Args {
  bucket: string | null;
  stable: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { bucket: null, stable: false };
  for (const a of argv) {
    if (a === "--stable") out.stable = true;
    else if (a.startsWith("--bucket=")) out.bucket = a.split("=")[1].toUpperCase();
  }
  return out;
}

function parseHeader(content: string): Map<string, string> {
  const fields = new Map<string, string>();
  const lines = content.split("\n").slice(0, 30);
  for (const line of lines) {
    const m = HEADER_RE.exec(line);
    if (!m) continue;
    const [, key, val] = m;
    if (!KNOWN_HEADER_FIELDS.has(key)) continue;
    if (!fields.has(key)) fields.set(key, val);
  }
  return fields;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function scanSrc(): Promise<OrganMeta[]> {
  const organs: OrganMeta[] = [];
  for await (const entry of Deno.readDir(SRC)) {
    if (!entry.isFile) continue;
    const m = FILENAME_RE.exec(entry.name);
    if (!m) continue;
    const [, bucket, sub, handle] = m;
    const path = join(SRC, entry.name);
    const bytes = await Deno.readFile(path);
    const content = new TextDecoder().decode(bytes);
    const fields = parseHeader(content);

    const rawMaturity = fields.get("maturity");
    let maturity: Maturity | undefined;
    let invalid_maturity: string | undefined;
    if (rawMaturity !== undefined) {
      if (VALID_MATURITY.has(rawMaturity)) {
        maturity = rawMaturity as Maturity;
      } else {
        invalid_maturity = rawMaturity;
      }
    }

    organs.push({
      filename: entry.name,
      coordinate: (bucket + sub).toUpperCase(),
      bucket: bucket.toUpperCase(),
      sub: sub.toUpperCase(),
      handle,
      intent: fields.get("intent"),
      maturity,
      invalid_maturity,
      horizon: fields.get("horizon"),
      position: fields.get("position"),
      hex_dipole: fields.get("hex_dipole"),
      placement_policy: fields.get("placement_policy"),
      source_hash: await sha256Hex(bytes),
      source_size: bytes.length,
    });
  }
  return organs.sort((a, b) => a.coordinate.localeCompare(b.coordinate));
}

function groupByBucket(organs: OrganMeta[]): Map<string, OrganMeta[]> {
  const buckets = new Map<string, OrganMeta[]>();
  for (const o of organs) {
    const list = buckets.get(o.bucket) ?? [];
    list.push(o);
    buckets.set(o.bucket, list);
  }
  return buckets;
}

/** Canonical manifest for a list of organs.
 *  Sorted by path (deterministic); each entry has {path, hash, size}.
 *  Returned as canonical JSON string (sorted keys, no extra whitespace). */
function canonicalManifest(organs: OrganMeta[]): string {
  const entries = organs
    .slice()
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .map((o) => ({
      hash: `sha256:${o.source_hash}`,
      path: o.filename,
      size: o.source_size,
    }));
  // Canonical: keys sorted alphabetically within each object (hash, path, size).
  // Array preserves sort order. Compact (no whitespace).
  return JSON.stringify(entries);
}

async function manifestHash(organs: OrganMeta[]): Promise<string> {
  const manifest = canonicalManifest(organs);
  const bytes = new TextEncoder().encode(manifest);
  const h = await sha256Hex(bytes);
  return `sha256:${h}`;
}

function renderBucketState(
  bucket: string,
  organs: OrganMeta[],
  receipts: { generated_at: string | null; manifest_hash: string; source_root: string; source_files: number },
): string {
  const active = organs.filter((o) => o.maturity === "active");
  const frozen = organs.filter((o) => o.maturity === "frozen");
  const draft = organs.filter((o) => o.maturity === "draft");
  const archived = organs.filter((o) => o.maturity === "archived");
  const unknown = organs.filter((o) => !o.maturity && !o.invalid_maturity);
  const invalid = organs.filter((o) => o.invalid_maturity);

  const lines: string[] = [];
  lines.push(`<!-- AUTO-GENERATED by probes/agents-gen-v0/gen.ts — do not edit by hand. -->`);
  if (receipts.generated_at) lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_root: ${receipts.source_root} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(`<!-- bucket: ${bucket}   organs: ${organs.length} -->`);
  lines.push(``);
  lines.push(`# Bucket ${bucket} state`);
  lines.push(``);

  const counts = [
    `${active.length} active`,
    `${frozen.length} frozen`,
    `${draft.length} draft`,
    `${archived.length} archived`,
  ];
  if (unknown.length > 0) counts.push(`${unknown.length} unknown-maturity`);
  if (invalid.length > 0) counts.push(`${invalid.length} INVALID-maturity`);
  lines.push(`${organs.length} organs in bucket ${bucket} — ${counts.join(", ")}.`);
  lines.push(``);

  if (invalid.length > 0) {
    lines.push(`> ⚠️ ${invalid.length} organs have invalid \`maturity:\` value (typo or unknown enum). See section at end.`);
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);

  // є (current state, lower half x?880..x?887)
  lines.push(`## є — current state  (sub-positions ${bucket}880..${bucket}887)`);
  lines.push(``);

  if (active.length > 0) {
    lines.push(`### ${bucket}884 — foundation (active organs)`);
    lines.push(``);
    for (const o of active) {
      lines.push(`- **x${o.coordinate}_${o.handle}** — ${o.intent ?? "(no intent declared)"}`);
    }
    lines.push(``);
  }

  if (frozen.length > 0) {
    lines.push(`### ${bucket}887 — sealed (frozen organs)`);
    lines.push(``);
    for (const o of frozen) {
      lines.push(`- **x${o.coordinate}_${o.handle}** — ${o.intent ?? "(no intent declared)"}`);
    }
    lines.push(``);
  }

  if (unknown.length > 0) {
    lines.push(`### ${bucket}880 — unclassified (no maturity declared)`);
    lines.push(``);
    for (const o of unknown) {
      lines.push(`- **x${o.coordinate}_${o.handle}** — ${o.intent ?? "(no intent declared)"}`);
    }
    lines.push(``);
  }

  if (archived.length > 0) {
    lines.push(`### ${bucket}880 — origin (archived organs)`);
    lines.push(``);
    for (const o of archived) {
      lines.push(`- **x${o.coordinate}_${o.handle}** — ${o.intent ?? "(archived)"}`);
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);

  // буде
  lines.push(`## буде — intent vector  (sub-positions ${bucket}889..${bucket}88F)`);
  lines.push(``);

  if (draft.length > 0) {
    lines.push(`### ${bucket}889 — next step (draft organs in flight)`);
    lines.push(``);
    for (const o of draft) {
      const horizon = o.horizon ? ` — horizon: ${o.horizon}` : "";
      lines.push(`- **x${o.coordinate}_${o.handle}** — ${o.intent ?? "(no intent declared)"}${horizon}`);
    }
    lines.push(``);
  }

  const horizons = organs.filter((o) => o.horizon).map((o) => ({ coord: o.coordinate, horizon: o.horizon! }));
  if (horizons.length > 0) {
    lines.push(`### ${bucket}88F — frontier (horizon synthesis from all organs)`);
    lines.push(``);
    for (const { coord, horizon } of horizons) {
      lines.push(`- *from x${coord}:* ${horizon}`);
    }
    lines.push(``);
  }

  if (draft.length === 0 && horizons.length === 0) {
    lines.push(`### ${bucket}889..${bucket}88F — empty`);
    lines.push(`No draft organs and no declared horizons. Bucket ${bucket} appears settled.`);
    lines.push(``);
  }

  if (invalid.length > 0) {
    lines.push(`---`);
    lines.push(``);
    lines.push(`## ⚠️ invalid maturity values`);
    lines.push(``);
    lines.push(`The following organs declared \`maturity:\` values not in the canonical enum (\`draft | active | frozen | archived\`):`);
    lines.push(``);
    for (const o of invalid) {
      lines.push(`- **x${o.coordinate}_${o.handle}** — declared \`maturity: ${o.invalid_maturity}\` (likely typo)`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

async function renderSubstrateAgents(
  buckets: Map<string, OrganMeta[]>,
  bucketHashes: Map<string, string>,
  receipts: { generated_at: string | null; manifest_hash: string; source_root: string; source_files: number },
): Promise<string> {
  const lines: string[] = [];
  lines.push(`<!-- AUTO-GENERATED by probes/agents-gen-v0/gen.ts — do not edit by hand. -->`);
  if (receipts.generated_at) lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_root: ${receipts.source_root} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(`<!-- bucket_hashes:`);
  for (const [bucket, hash] of [...bucketHashes.entries()].sort()) {
    lines.push(`     ${bucket}: ${hash}`);
  }
  lines.push(`-->`);
  lines.push(``);
  lines.push(`# Substrate state (federation index)`);
  lines.push(``);
  lines.push(`Total organs: ${[...buckets.values()].flat().length} across ${buckets.size} buckets.`);
  lines.push(``);
  lines.push(`## Local buckets`);
  lines.push(``);
  for (const [bucket, organs] of [...buckets.entries()].sort()) {
    const active = organs.filter((o) => o.maturity === "active").length;
    const draft = organs.filter((o) => o.maturity === "draft").length;
    lines.push(
      `- **bucket ${bucket}** — ${organs.length} organs (${active} active, ${draft} draft) → see [x${bucket}888_state.myc.md](./x${bucket}888_state.myc.md)`,
    );
  }
  lines.push(``);
  lines.push(`## Federated substrates (pointers — substrates self-describe)`);
  lines.push(``);
  lines.push(`- → liquid/src/x8888_agents.myc.md (regenerate inside liquid)`);
  lines.push(`- → omega/src/x8888_agents.myc.md (regenerate inside omega)`);
  lines.push(`- → myc/src/x8888_agents.myc.md (regenerate inside myc)`);
  lines.push(``);
  lines.push(`## How to use this file`);
  lines.push(``);
  lines.push(`Fresh model: read this first, then drill into bucket-specific xN888_state.myc.md as needed.`);
  lines.push(`AGENTS.md (palimpsest dialog) — separate concern, complementary, not replaced.`);
  lines.push(`This file is regenerated by \`t agents\` (or probe \`gen.ts\` while in trial).`);
  lines.push(``);
  lines.push(`## Receipt`);
  lines.push(``);
  lines.push(`The bucket_hashes block above gives \`sha256\` hash of each bucket's xN888_state.myc.md output.`);
  lines.push(`The source_manifest_hash is the hash of the canonical manifest of source organs that produced this projection.`);
  lines.push(`Together they form a chain: source files → manifest → per-bucket state → substrate index.`);
  return lines.join("\n");
}

async function main(argv: string[]) {
  const args = parseArgs(argv);
  await Deno.mkdir(OUT, { recursive: true });

  const allOrgans = await scanSrc();
  const organs = args.bucket
    ? allOrgans.filter((o) => o.bucket === args.bucket)
    : allOrgans;

  if (organs.length === 0) {
    console.log(`no organs found${args.bucket ? ` in bucket ${args.bucket}` : ""}`);
    return;
  }

  const buckets = groupByBucket(organs);
  const generated_at = args.stable ? null : new Date().toISOString();
  const global_manifest_hash = await manifestHash(organs);
  const source_root = relative(HERE, SRC);

  // Mode hygiene: each mode owns specific outputs; clean up artifacts
  // belonging to the OTHER mode so review doesn't confuse stale state
  // for current (per Codex P3 review #1).
  if (args.bucket) {
    // Bucket-mode: full-mode artifacts are stale
    for (const stale of ["x8888_agents.myc.md", "x8888_agents.manifest.json"]) {
      try {
        await Deno.remove(join(OUT, stale));
        console.log(`[remove-stale] ${stale} (bucket-mode does not produce federation index)`);
      } catch { /* didn't exist */ }
    }
    // Also any OTHER bucket's stale per-bucket files (e.g., switched from --bucket=6 to --bucket=4)
    for await (const entry of Deno.readDir(OUT)) {
      if (!entry.isFile) continue;
      const m = /^x([0-9A-Fa-f])888_state\.(myc\.md|manifest\.json)$/.exec(entry.name);
      if (m && m[1].toUpperCase() !== args.bucket) {
        await Deno.remove(join(OUT, entry.name));
        console.log(`[remove-stale] ${entry.name} (bucket-mode --bucket=${args.bucket} supersedes other-bucket outputs)`);
      }
    }
  } else {
    // Full-mode: nothing to clean (per-bucket manifests are LEGITIMATE in full mode now,
    // each bucket gets its own hash so they're version-anchored independently).
    // See Codex review #2 P2: per-bucket manifests prevent cross-bucket noise.
  }

  let written = 0;

  // Per-bucket: each bucket gets its own manifest, hash, and sidecar.
  // Codex P2 (review #2): if global manifest_hash is embedded in every
  // bucket file, then changes in OTHER buckets churn THIS bucket's
  // receipt. Per-bucket hash isolates: bucket X file only changes when
  // bucket X organs change.
  const bucketHashes = new Map<string, string>();         // hash of rendered bucket-state output (for x8888 federation)
  const bucketManifests = new Map<string, string>();      // hash of bucket-scoped canonical manifest (for source-bytes receipt)
  for (const [bucket, bucketOrgans] of buckets) {
    const bucketManifestHash = await manifestHash(bucketOrgans);
    bucketManifests.set(bucket, bucketManifestHash);

    const bucketReceipts = {
      generated_at,
      manifest_hash: bucketManifestHash,
      source_root,
      source_files: bucketOrgans.length,
    };

    const path = join(OUT, `x${bucket}888_state.myc.md`);
    const content = renderBucketState(bucket, bucketOrgans, bucketReceipts);
    await Deno.writeTextFile(path, content + "\n");
    const bucketBytes = new TextEncoder().encode(content + "\n");
    bucketHashes.set(bucket, `sha256:${await sha256Hex(bucketBytes)}`);

    // Per-bucket sidecar manifest (Codex P3-4 review #1 + P2 review #2)
    const sidecarPath = join(OUT, `x${bucket}888_state.manifest.json`);
    await Deno.writeTextFile(sidecarPath, canonicalManifest(bucketOrgans) + "\n");
    written += 2; // state + manifest

    const invalidCount = bucketOrgans.filter((o) => o.invalid_maturity).length;
    const tag = invalidCount > 0 ? ` (${invalidCount} INVALID-maturity)` : "";
    console.log(`[write] x${bucket}888_state.myc.md (${bucketOrgans.length} organs)${tag}`);
    console.log(`[write] x${bucket}888_state.manifest.json (${bucketOrgans.length} entries)`);

    if (invalidCount > 0) {
      for (const o of bucketOrgans.filter((o) => o.invalid_maturity)) {
        console.warn(`  ⚠️  x${o.coordinate}_${o.handle}: invalid maturity '${o.invalid_maturity}' — not in {draft|active|frozen|archived}`);
      }
    }
  }

  // Substrate-level federation file + global sidecar (full mode only)
  if (!args.bucket) {
    const agentsReceipts = {
      generated_at,
      manifest_hash: global_manifest_hash,
      source_root,
      source_files: organs.length,
    };
    const agentsPath = join(OUT, "x8888_agents.myc.md");
    const agentsContent = await renderSubstrateAgents(buckets, bucketHashes, agentsReceipts);
    await Deno.writeTextFile(agentsPath, agentsContent + "\n");

    // Substrate-wide sidecar with ALL organs (Codex P3-4 review #1)
    const globalSidecarPath = join(OUT, "x8888_agents.manifest.json");
    await Deno.writeTextFile(globalSidecarPath, canonicalManifest(organs) + "\n");

    console.log(`[write] x8888_agents.myc.md (${buckets.size} buckets indexed)`);
    console.log(`[write] x8888_agents.manifest.json (${organs.length} entries, whole substrate)`);
    written += 2;
  }

  console.log(`done. ${written} files written to output/. global_manifest_hash=${global_manifest_hash}${args.stable ? " (stable)" : ""}`);
}

if (import.meta.main) {
  await main(Deno.args);
}
