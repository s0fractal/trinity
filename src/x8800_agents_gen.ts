#!/usr/bin/env -S deno run --allow-read --allow-write
// src/x8800_agents_gen.ts — agents / substrate self-brief generator
// position: 8/8 → cache(8) × cache(8) = primitive of substrate-self-cache-generation
// hex_dipole: "93 00 33 00 00 00 00 33"
//   void_infinity-0.85 (PRIMARY: negative pole = infinity/cache; substrate's self-cache regenerator)
//   mirror_apex+0.40 (reflects substrate's own structure back as readable artifact)
//   completion_frontier+0.40 (projection terminus, where state crystallizes for reading)
//   bucket 8/8: primary axis void_infinity (0), bucket 8 = axis 0 negative pole ← PAIR-MATCH
// placement_policy: axis
// intent: scan src/ organ headers, render xN888_state.myc.md per bucket + x8888_agents.myc.md substrate index
// maturity: active
// horizon: extend with bucket-hash-driven incremental regen (only re-render buckets with manifest drift)
// skill_tag: agents
// skill_safe: yes-with-care
//
// agents_gen — substrate self-brief generator
//
// Graduates pattern from probes/agents-gen-v0/ into the real substrate.
// Scans src/ for x<bucket><sub-3>_<handle>.ts organ files, parses header
// fields (`intent / maturity / horizon` plus `coordinate / hex_dipole /
// placement_policy`), and renders:
//
//   src/xN888_state.myc.md      — per-bucket state (є/буде split via
//                                  sub-coordinate slots xN880..xN88F)
//   src/x8888_agents.myc.md     — substrate-level federation index
//   src/x88F0_agents_bootstrap.myc.md — root AGENTS.md symlink target
//   src/xN888_state.manifest.json — per-bucket canonical manifest sidecar
//   src/x8888_agents.manifest.json — global canonical manifest sidecar
//
// Receipts:
// - Each bucket file embeds bucket-scoped source_manifest_hash so bucket
//   state stable to changes in OTHER buckets (Codex review #2 P2).
// - x8888_agents.myc.md embeds GLOBAL manifest_hash + bucket_hashes block
//   (hash of each rendered bucket-state file) for federation receipt.
//
// Generated files are content-addressed by source manifest. With `--stable`
// flag, generated_at timestamp is omitted; output is byte-deterministic
// from source bytes alone.
//
// Subcommands (via t dispatcher or direct run):
//   t agents                  regenerate all buckets + substrate index
//   t agents --bucket=6       regenerate one bucket only (no x8888)
//   t agents --stable         deterministic output (no generated_at)
//
// Glossary words: agents, agents-brief, self-brief, бриф, агенти

import {
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { formatGeneratedFile } from "./x0012_generated_format.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const SRC = HERE; // organs live alongside this file in src/
const OUT = HERE; // generated artifacts also live in src/ at x?888 coords

const FILENAME_RE = /^x([0-9A-Fa-f])([0-9A-Fa-f]{3})_([^.]+)\.ts$/;
const HEADER_RE = /^\/\/\s*(\w+):\s*(.+?)\s*$/;
const VOICE_FILE_RE = /^x8A[0-9A-Fa-f]{2}_voice_([^.]+)\.myc\.json$/;
const VALID_MATURITY = new Set(["draft", "active", "frozen", "archived"]);
const KNOWN_HEADER_FIELDS = new Set([
  "intent",
  "maturity",
  "horizon",
  "position",
  "hex_dipole",
  "placement_policy",
]);

type Maturity = "draft" | "active" | "frozen" | "archived";

interface OrganMeta {
  filename: string;
  coordinate: string;
  bucket: string;
  sub: string;
  handle: string;
  intent?: string;
  maturity?: Maturity;
  invalid_maturity?: string;
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

interface VoiceProfile {
  key: string;
  identity: string;
  handles: string[];
  standing?: string;
  rel_path: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { bucket: null, stable: false };
  for (const a of argv) {
    if (a === "--stable") out.stable = true;
    else if (a.startsWith("--bucket=")) {
      out.bucket = a.split("=")[1].toUpperCase();
    }
  }
  return out;
}

function parseHeader(content: string): Map<string, string> {
  const fields = new Map<string, string>();
  const lines = content.split("\n").slice(0, 40);
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
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function scanSrc(): Promise<OrganMeta[]> {
  const organs: OrganMeta[] = [];
  for await (const entry of Deno.readDir(SRC)) {
    if (!entry.isFile) continue;
    // Skip the generator itself when scanning (avoid self-reference noise in output;
    // it's still present at x8800 but doesn't get classified as a "regular" organ).
    if (entry.name === "x8800_agents_gen.ts") continue;
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

async function loadVoices(): Promise<VoiceProfile[]> {
  const voices: VoiceProfile[] = [];
  for await (const entry of Deno.readDir(SRC)) {
    if (!entry.isFile) continue;
    const m = VOICE_FILE_RE.exec(entry.name);
    if (!m) continue;
    const key = m[1].toLowerCase();
    try {
      const parsed = JSON.parse(await Deno.readTextFile(join(SRC, entry.name)));
      voices.push({
        key,
        identity: parsed.identity ?? key,
        handles: Array.isArray(parsed.handles) ? parsed.handles : [key],
        standing: parsed.standing,
        rel_path: `src/${entry.name}`,
      });
    } catch {
      voices.push({
        key,
        identity: key,
        handles: [key],
        standing: "unreadable",
        rel_path: `src/${entry.name}`,
      });
    }
  }
  return voices.sort((a, b) => a.key.localeCompare(b.key));
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

function canonicalManifest(organs: OrganMeta[]): string {
  const entries = organs
    .slice()
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .map((o) => ({
      hash: `sha256:${o.source_hash}`,
      path: o.filename,
      size: o.source_size,
    }));
  return JSON.stringify(entries);
}

async function manifestHash(organs: OrganMeta[]): Promise<string> {
  const manifest = canonicalManifest(organs);
  const bytes = new TextEncoder().encode(manifest);
  return `sha256:${await sha256Hex(bytes)}`;
}

function renderBucketState(
  bucket: string,
  organs: OrganMeta[],
  receipts: {
    generated_at: string | null;
    manifest_hash: string;
    source_root: string;
    source_files: number;
  },
): string {
  const active = organs.filter((o) => o.maturity === "active");
  const frozen = organs.filter((o) => o.maturity === "frozen");
  const draft = organs.filter((o) => o.maturity === "draft");
  const archived = organs.filter((o) => o.maturity === "archived");
  const unknown = organs.filter((o) => !o.maturity && !o.invalid_maturity);
  const invalid = organs.filter((o) => o.invalid_maturity);

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8800_agents_gen.ts — do not edit by hand. -->`,
  );
  if (receipts.generated_at) {
    lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  }
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
  lines.push(
    `${organs.length} organs in bucket ${bucket} — ${counts.join(", ")}.`,
  );
  lines.push(``);

  if (invalid.length > 0) {
    lines.push(
      `> ⚠️ ${invalid.length} organs have invalid \`maturity:\` value. See section at end.`,
    );
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);
  lines.push(
    `## є — current state  (sub-positions ${bucket}880..${bucket}887)`,
  );
  lines.push(``);

  if (active.length > 0) {
    lines.push(`### ${bucket}884 — foundation (active organs)`);
    lines.push(``);
    for (const o of active) {
      lines.push(
        `- **x${o.coordinate}_${o.handle}** — ${
          o.intent ?? "(no intent declared)"
        }`,
      );
    }
    lines.push(``);
  }

  if (frozen.length > 0) {
    lines.push(`### ${bucket}887 — sealed (frozen organs)`);
    lines.push(``);
    for (const o of frozen) {
      lines.push(
        `- **x${o.coordinate}_${o.handle}** — ${
          o.intent ?? "(no intent declared)"
        }`,
      );
    }
    lines.push(``);
  }

  if (unknown.length > 0) {
    lines.push(`### ${bucket}880 — unclassified (no maturity declared)`);
    lines.push(``);
    for (const o of unknown) {
      lines.push(
        `- **x${o.coordinate}_${o.handle}**${o.intent ? ` — ${o.intent}` : ""}`,
      );
    }
    lines.push(``);
  }

  if (archived.length > 0) {
    lines.push(`### ${bucket}880 — origin (archived organs)`);
    lines.push(``);
    for (const o of archived) {
      lines.push(
        `- **x${o.coordinate}_${o.handle}** — ${o.intent ?? "(archived)"}`,
      );
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);
  lines.push(
    `## буде — intent vector  (sub-positions ${bucket}889..${bucket}88F)`,
  );
  lines.push(``);

  if (draft.length > 0) {
    lines.push(`### ${bucket}889 — next step (draft organs in flight)`);
    lines.push(``);
    for (const o of draft) {
      const horizon = o.horizon ? ` — horizon: ${o.horizon}` : "";
      lines.push(
        `- **x${o.coordinate}_${o.handle}** — ${
          o.intent ?? "(no intent declared)"
        }${horizon}`,
      );
    }
    lines.push(``);
  }

  const horizons = organs.filter((o) => o.horizon).map((o) => ({
    coord: o.coordinate,
    horizon: o.horizon!,
  }));
  if (horizons.length > 0) {
    lines.push(
      `### ${bucket}88F — frontier (horizon synthesis from all organs)`,
    );
    lines.push(``);
    for (const { coord, horizon } of horizons) {
      lines.push(`- *from x${coord}:* ${horizon}`);
    }
    lines.push(``);
  }

  if (draft.length === 0 && horizons.length === 0) {
    lines.push(`### ${bucket}889..${bucket}88F — empty`);
    lines.push(`No draft organs and no declared horizons in bucket ${bucket}.`);
    lines.push(``);
  }

  if (invalid.length > 0) {
    lines.push(`---`);
    lines.push(``);
    lines.push(`## ⚠️ invalid maturity values`);
    lines.push(``);
    for (const o of invalid) {
      lines.push(
        `- **x${o.coordinate}_${o.handle}** — declared \`maturity: ${o.invalid_maturity}\` (not in canonical enum)`,
      );
    }
    lines.push(``);
  }

  return lines.join("\n");
}

async function renderSubstrateAgents(
  buckets: Map<string, OrganMeta[]>,
  bucketHashes: Map<string, string>,
  receipts: {
    generated_at: string | null;
    manifest_hash: string;
    source_root: string;
    source_files: number;
  },
): Promise<string> {
  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8800_agents_gen.ts — do not edit by hand. -->`,
  );
  if (receipts.generated_at) {
    lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  }
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
  lines.push(
    `Total organs: ${
      [...buckets.values()].flat().length
    } across ${buckets.size} buckets.`,
  );
  lines.push(``);
  lines.push(`## Local buckets`);
  lines.push(``);
  for (const [bucket, organs] of [...buckets.entries()].sort()) {
    const active = organs.filter((o) => o.maturity === "active").length;
    const draft = organs.filter((o) => o.maturity === "draft").length;
    const unknown = organs.filter((o) =>
      !o.maturity && !o.invalid_maturity
    ).length;
    const counts = [`${active} active`, `${draft} draft`];
    if (unknown > 0) counts.push(`${unknown} unclassified`);
    lines.push(
      `- **bucket ${bucket}** — ${organs.length} organs (${
        counts.join(", ")
      }) → see [x${bucket}888_state.myc.md](./x${bucket}888_state.myc.md)`,
    );
  }
  lines.push(``);
  lines.push(
    `## Federated substrates (pointers — each substrate self-describes)`,
  );
  lines.push(``);
  lines.push(`- → liquid/src/x8888_agents.myc.md (regenerate inside liquid)`);
  lines.push(`- → omega/src/x8888_agents.myc.md (regenerate inside omega)`);
  lines.push(`- → myc/src/x8888_agents.myc.md (regenerate inside myc)`);
  lines.push(``);
  lines.push(`## How to use this file`);
  lines.push(``);
  lines.push(
    `Fresh model: read this first for substrate brief, then drill into per-bucket xN888_state.myc.md as needed.`,
  );
  lines.push(
    `AGENTS.md is a root compatibility symlink to src/x88F0_agents_bootstrap.myc.md; old palimpsest lives at src/x88A0_agents_palimpsest_2026_05_22.myc.md.`,
  );
  lines.push(
    `This file is regenerated by \`t agents\` from organ headers (\`intent\` / \`maturity\` / \`horizon\` fields).`,
  );
  lines.push(``);
  lines.push(`## Receipt`);
  lines.push(``);
  lines.push(
    `bucket_hashes block above gives sha256 of each rendered bucket-state file.`,
  );
  lines.push(
    `source_manifest_hash is sha256 of the canonical manifest of source organs (sorted JSON array of {hash, path, size}).`,
  );
  lines.push(
    `Per-bucket xN888_state.myc.md files carry their OWN bucket-scoped manifest_hash so bucket files are stable to changes in other buckets.`,
  );
  return lines.join("\n");
}

function renderAgentsBootstrap(
  buckets: Map<string, OrganMeta[]>,
  voices: VoiceProfile[],
  receipts: {
    manifest_hash: string;
    source_root: string;
    source_files: number;
  },
): string {
  const allOrgans = [...buckets.values()].flat();
  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8800_agents_gen.ts — do not edit by hand. -->`,
  );
  lines.push(`<!-- root_abi: AGENTS.md symlink target -->`);
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_root: ${receipts.source_root} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(``);
  lines.push(`# AGENTS`);
  lines.push(``);
  lines.push(
    `This root brief is generated from substrate sources. To refresh it:`,
  );
  lines.push(``);
  lines.push(`\`\`\`sh`);
  lines.push(`./t agents --stable`);
  lines.push(`./t skill --stable`);
  lines.push(`./t memory --stable`);
  lines.push(`./t roadmap --stable`);
  lines.push(`\`\`\``);
  lines.push(``);
  lines.push(
    `If this file conflicts with live substrate output, trust live substrate output.`,
  );
  lines.push(``);
  lines.push(`## First Moves`);
  lines.push(``);
  lines.push(`1. Run \`./t status\` and check overall health.`);
  lines.push(
    `2. Run \`./t audit\` if you will move files or edit organ coordinates.`,
  );
  lines.push(
    `3. Read \`src/x8888_agents.myc.md\` for state, \`src/x8888_skills.myc.md\` or \`SKILLS.md\` for commands, \`src/x2888_voices_state.myc.md\` for voice routing, and \`src/x8D00_roadmap.myc.md\` for frontier tension.`,
  );
  lines.push(
    `4. For proposal-shaped work, write a chord in \`jazz/chords/\` with a falsifier.`,
  );
  lines.push(``);
  lines.push(`## Voice Resolution`);
  lines.push(``);
  lines.push(
    `Find yourself by handle, then read your profile, memory, and roadmap.`,
  );
  lines.push(``);
  lines.push(`| voice | handles | standing | profile | memory | roadmap |`);
  lines.push(`|-------|---------|----------|---------|--------|---------|`);
  for (const v of voices) {
    const handles = v.handles.join(", ");
    const standing = v.standing ?? "unknown";
    lines.push(
      `| ${v.identity} | ${handles} | ${standing} | [profile](${v.rel_path}) | [memory](src/x8888_${v.key}_memory.myc.md) | [roadmap](src/x8D00_${v.key}_roadmap.myc.md) |`,
    );
  }
  lines.push(``);
  lines.push(`## Commands`);
  lines.push(``);
  lines.push(
    `All repository commands are projected in \`SKILLS.md\` / \`src/x8CF0_skills_bootstrap.myc.md\`; detailed generated skill state lives in \`src/x8888_skills.myc.md\` and \`src/x?888_skill.myc.md\`.`,
  );
  lines.push(``);
  lines.push(`Most-used entrypoints:`);
  lines.push(``);
  lines.push(`- \`./t help\` — command handles`);
  lines.push(`- \`./t status\` — composite substrate health`);
  lines.push(`- \`./t capabilities\` — live affordance projection`);
  lines.push(`- \`./t contracts\` — contract projection`);
  lines.push(`- \`./t agents\` — regenerate this self-brief family`);
  lines.push(`- \`./t skill\` — regenerate command/operating brief`);
  lines.push(`- \`./t memory\` — regenerate voice memory projections`);
  lines.push(`- \`./t roadmap\` — regenerate frontier tension`);
  lines.push(``);
  lines.push(`## Topology`);
  lines.push(``);
  lines.push(
    `This substrate has ${allOrgans.length} organs across ${buckets.size} active source buckets.`,
  );
  for (const [bucket, organs] of [...buckets.entries()].sort()) {
    lines.push(
      `- bucket ${bucket}: ${organs.length} organs → \`src/x${bucket}888_state.myc.md\``,
    );
  }
  lines.push(``);
  lines.push(
    `Root files are compatibility ABI. Canonical material lives in \`src/xNNNN_*.myc.*\` and generated projections are reproducible from tracked sources.`,
  );
  lines.push(``);
  lines.push(`## Palimpsest`);
  lines.push(``);
  lines.push(
    `The old hand-written AGENTS letter is preserved at \`src/x88A0_agents_palimpsest_2026_05_22.myc.md\`. Read it for culture and session history; do not treat stale paths there as stronger than live \`t\` output.`,
  );
  lines.push(``);
  lines.push(`## Falsifiers`);
  lines.push(``);
  lines.push(
    `- Fresh checkout has a broken \`AGENTS.md\` symlink → root ABI failed; restore a tracked shim.`,
  );
  lines.push(
    `- A voice listed here has no generated memory/roadmap after \`./t memory --stable && ./t roadmap --stable\` → voice projection is incomplete.`,
  );
  lines.push(
    `- \`SKILLS.md\` misses a \`t\` command that \`./t help\` exposes → skill bootstrap is stale or parsing the wrong source.`,
  );
  lines.push(
    `- Any model edits this file directly → source/projection boundary failed; edit source organs or voice records and regenerate.`,
  );
  return lines.join("\n");
}

async function main(argv: string[]) {
  const args = parseArgs(argv);
  const allOrgans = await scanSrc();
  const organs = args.bucket
    ? allOrgans.filter((o) => o.bucket === args.bucket)
    : allOrgans;

  if (organs.length === 0) {
    console.log(
      `no organs found${args.bucket ? ` in bucket ${args.bucket}` : ""}`,
    );
    return;
  }

  const buckets = groupByBucket(organs);
  const voices = await loadVoices();
  const generated_at = args.stable ? null : new Date().toISOString();
  const global_manifest_hash = await manifestHash(organs);
  const source_root = relative(join(SRC, ".."), SRC);

  // Mode hygiene (per Codex P3 review): clean stale outputs from the OTHER mode.
  if (args.bucket) {
    for (const stale of ["x8888_agents.myc.md", "x8888_agents.manifest.json"]) {
      try {
        await Deno.remove(join(OUT, stale));
      } catch { /* didn't exist */ }
    }
    for await (const entry of Deno.readDir(OUT)) {
      if (!entry.isFile) continue;
      const m = /^x([0-9A-Fa-f])888_state\.(myc\.md|manifest\.json)$/.exec(
        entry.name,
      );
      if (m && m[1].toUpperCase() !== args.bucket) {
        try {
          await Deno.remove(join(OUT, entry.name));
        } catch { /* didn't exist */ }
      }
    }
  }

  let written = 0;
  const bucketHashes = new Map<string, string>();

  for (const [bucket, bucketOrgans] of buckets) {
    const bucketManifestHash = await manifestHash(bucketOrgans);
    const bucketReceipts = {
      generated_at,
      manifest_hash: bucketManifestHash,
      source_root,
      source_files: bucketOrgans.length,
    };

    const statePath = join(OUT, `x${bucket}888_state.myc.md`);
    const content = renderBucketState(bucket, bucketOrgans, bucketReceipts);
    await Deno.writeTextFile(statePath, content + "\n");
    await formatGeneratedFile(statePath);
    const formattedBytes = await Deno.readFile(statePath);
    bucketHashes.set(bucket, `sha256:${await sha256Hex(formattedBytes)}`);

    const sidecarPath = join(OUT, `x${bucket}888_state.manifest.json`);
    await Deno.writeTextFile(
      sidecarPath,
      canonicalManifest(bucketOrgans) + "\n",
    );
    await formatGeneratedFile(sidecarPath);
    written += 2;

    const invalidCount = bucketOrgans.filter((o) => o.invalid_maturity).length;
    const tag = invalidCount > 0 ? ` (${invalidCount} INVALID-maturity)` : "";
    console.log(
      `[write] x${bucket}888_state.myc.md (${bucketOrgans.length} organs)${tag}`,
    );
    console.log(
      `[write] x${bucket}888_state.manifest.json (${bucketOrgans.length} entries)`,
    );
    if (invalidCount > 0) {
      for (const o of bucketOrgans.filter((o) => o.invalid_maturity)) {
        console.warn(
          `  ⚠️  x${o.coordinate}_${o.handle}: invalid maturity '${o.invalid_maturity}'`,
        );
      }
    }
  }

  if (!args.bucket) {
    const agentsReceipts = {
      generated_at,
      manifest_hash: global_manifest_hash,
      source_root,
      source_files: organs.length,
    };
    const agentsPath = join(OUT, "x8888_agents.myc.md");
    const agentsContent = await renderSubstrateAgents(
      buckets,
      bucketHashes,
      agentsReceipts,
    );
    await Deno.writeTextFile(agentsPath, agentsContent + "\n");
    await formatGeneratedFile(agentsPath);
    const bootstrapPath = join(OUT, "x88F0_agents_bootstrap.myc.md");
    await Deno.writeTextFile(
      bootstrapPath,
      renderAgentsBootstrap(buckets, voices, agentsReceipts) + "\n",
    );
    await formatGeneratedFile(bootstrapPath);
    const globalSidecarPath = join(OUT, "x8888_agents.manifest.json");
    await Deno.writeTextFile(
      globalSidecarPath,
      canonicalManifest(organs) + "\n",
    );
    await formatGeneratedFile(globalSidecarPath);
    console.log(
      `[write] x8888_agents.myc.md (${buckets.size} buckets indexed)`,
    );
    console.log(
      `[write] x88F0_agents_bootstrap.myc.md (root AGENTS.md target)`,
    );
    console.log(
      `[write] x8888_agents.manifest.json (${organs.length} entries, whole substrate)`,
    );
    written += 3;
  }

  console.log(
    `done. ${written} files. global_manifest_hash=${global_manifest_hash}${
      args.stable ? " (stable)" : ""
    }`,
  );
}

if (import.meta.main) {
  await main(Deno.args);
}
