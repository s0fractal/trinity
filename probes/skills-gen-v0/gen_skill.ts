// gen_skill.ts — bucket + substrate skill brief generator
//
// Pairs with agents-gen-v0 (state brief). State says "what I see"; skill
// says "how to move here without dumb moves".
//
// Reads:
//   - ./src/ fixture organs (header fields incl. skill_tag, skill_safe)
//   - ./glossary_subset.ndjson (which t commands route where)
//   - ./policy_subset.json (import-policy table from morphology-v0)
//
// Renders:
//   - ./output/xN888_skill.myc.md             per bucket
//   - ./output/x8888_skills.myc.md            substrate-wide
//   - ./output/xN888_skill.manifest.json      per-bucket source manifest sidecar
//   - ./output/x8888_skills.manifest.json     global source manifest sidecar
//
// Post Codex review 2026-05-19:
// - P2: unclassified / invalid skill_safe → explicit "Not yet classified"
//   section (no silent drop)
// - P2: "yes" (pure read) and "yes-readonly" (external/expensive readonly
//   like baseline gates) rendered as SEPARATE lanes
// - P3: source_manifest_hash chain follows agents-gen-v0 (per-bucket and
//   global hashes; sidecar manifest with hash+path+size for each source)
//
// Run: deno run --config=probe.jsonc -A gen_skill.ts [--stable]

import {
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const SRC = join(HERE, "src");
const OUT = join(HERE, "output");
const GLOSSARY_PATH = join(HERE, "glossary_subset.ndjson");
const POLICY_PATH = join(HERE, "policy_subset.json");

const FILENAME_RE = /^x([0-9A-Fa-f])([0-9A-Fa-f]{3})_([^.]+)\.ts$/;
const HEADER_RE = /^\/\/\s*(\w+):\s*(.+?)\s*$/;
const KNOWN_FIELDS = new Set([
  "intent",
  "maturity",
  "horizon",
  "position",
  "hex_dipole",
  "placement_policy",
  "skill_tag",
  "skill_safe",
]);

const VALID_SKILL_SAFE = new Set(["yes", "yes-readonly", "yes-with-care"]);

interface OrganMeta {
  filename: string;
  coordinate: string;
  bucket: string;
  handle: string;
  intent?: string;
  maturity?: string;
  horizon?: string;
  skill_tag?: string;
  skill_safe?: string;
  invalid_skill_safe?: string;
  source_hash: string;
  source_size: number;
}

interface GlossaryEntry {
  handles: string[];
  position: string;
  note: string;
}

interface Policy {
  allow: Record<string, string[]>;
  hard_deny: [string, string, string][];
  warn: [string, string, string][];
}

interface Args {
  stable: boolean;
}

function parseArgs(argv: string[]): Args {
  return { stable: argv.includes("--stable") };
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(buf)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function parseHeader(content: string): Map<string, string> {
  const fields = new Map<string, string>();
  const lines = content.split("\n").slice(0, 30);
  for (const line of lines) {
    const m = HEADER_RE.exec(line);
    if (!m) continue;
    const [, k, v] = m;
    if (KNOWN_FIELDS.has(k) && !fields.has(k)) fields.set(k, v);
  }
  return fields;
}

async function scanOrgans(): Promise<OrganMeta[]> {
  const out: OrganMeta[] = [];
  for await (const entry of Deno.readDir(SRC)) {
    if (!entry.isFile) continue;
    const m = FILENAME_RE.exec(entry.name);
    if (!m) continue;
    const [, bucket, sub, handle] = m;
    const path = join(SRC, entry.name);
    const bytes = await Deno.readFile(path);
    const content = new TextDecoder().decode(bytes);
    const fields = parseHeader(content);

    const rawSafe = fields.get("skill_safe");
    let skill_safe: string | undefined;
    let invalid_skill_safe: string | undefined;
    if (rawSafe !== undefined) {
      if (VALID_SKILL_SAFE.has(rawSafe)) skill_safe = rawSafe;
      else invalid_skill_safe = rawSafe;
    }

    out.push({
      filename: entry.name,
      coordinate: (bucket + sub).toUpperCase(),
      bucket: bucket.toUpperCase(),
      handle,
      intent: fields.get("intent"),
      maturity: fields.get("maturity"),
      horizon: fields.get("horizon"),
      skill_tag: fields.get("skill_tag"),
      skill_safe,
      invalid_skill_safe,
      source_hash: await sha256Hex(bytes),
      source_size: bytes.length,
    });
  }
  return out.sort((a, b) => a.coordinate.localeCompare(b.coordinate));
}

async function loadGlossary(): Promise<GlossaryEntry[]> {
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const entries: GlossaryEntry[] = [];
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      if (r["00"] !== "5") continue;
      entries.push({
        handles: Array.isArray(r["02"]) ? r["02"] : [],
        position: r["04"] ?? "",
        note: r["09"] ?? "",
      });
    } catch { /* skip */ }
  }
  return entries;
}

async function loadPolicy(): Promise<Policy> {
  return JSON.parse(await Deno.readTextFile(POLICY_PATH));
}

interface SourceFile {
  path: string; // relative-from-probe path, e.g. "src/x6020_gravity.ts"
  hash: string;
  size: number;
}

async function hashFile(absPath: string, relPath: string): Promise<SourceFile> {
  const bytes = await Deno.readFile(absPath);
  return {
    path: relPath,
    hash: `sha256:${await sha256Hex(bytes)}`,
    size: bytes.length,
  };
}

/** Canonical manifest of a set of source files; sorted by path, compact JSON. */
function canonicalManifest(files: SourceFile[]): string {
  const entries = files.slice().sort((a, b) => a.path.localeCompare(b.path));
  return JSON.stringify(entries);
}

async function manifestHash(files: SourceFile[]): Promise<string> {
  const m = canonicalManifest(files);
  return `sha256:${await sha256Hex(new TextEncoder().encode(m))}`;
}

function groupByBucket(organs: OrganMeta[]): Map<string, OrganMeta[]> {
  const m = new Map<string, OrganMeta[]>();
  for (const o of organs) {
    const list = m.get(o.bucket) ?? [];
    list.push(o);
    m.set(o.bucket, list);
  }
  return m;
}

function bucketCommands(
  bucket: string,
  glossary: GlossaryEntry[],
): GlossaryEntry[] {
  return glossary.filter((e) => {
    const primary = e.position.split("/")[0];
    return primary.toUpperCase() === bucket;
  });
}

function bucketImportRules(bucket: string, policy: Policy) {
  const allowed = policy.allow[bucket] ?? [];
  const denies = policy.hard_deny
    .filter(([src]) => src === bucket)
    .map(([, tgt, why]) => `x${tgt} (${why})`);
  const warns = policy.warn
    .filter(([src]) => src === bucket)
    .map(([, tgt, why]) => `x${tgt} (${why})`);
  return {
    allowed_targets: allowed.map((t) => `x${t}`),
    must_not_import: denies,
    warns,
  };
}

function renderBucketSkill(
  bucket: string,
  organs: OrganMeta[],
  glossary: GlossaryEntry[],
  policy: Policy,
  receipts: {
    generated_at: string | null;
    manifest_hash: string;
    source_files: number;
  },
): string {
  const cmds = bucketCommands(bucket, glossary);
  const rules = bucketImportRules(bucket, policy);

  // Categories per Codex P2 review (review #3):
  const pureRead = organs.filter((o) => o.skill_safe === "yes");
  const externalRead = organs.filter((o) => o.skill_safe === "yes-readonly");
  const withCare = organs.filter((o) => o.skill_safe === "yes-with-care");
  const unclassified = organs.filter((o) =>
    !o.skill_safe && !o.invalid_skill_safe
  );
  const invalid = organs.filter((o) => o.invalid_skill_safe);

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by probes/skills-gen-v0/gen_skill.ts — do not edit by hand. -->`,
  );
  if (receipts.generated_at) {
    lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  }
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(
    `<!-- bucket: ${bucket}   organs: ${organs.length}   t-commands: ${cmds.length} -->`,
  );
  lines.push(``);
  lines.push(`# Bucket ${bucket} skill — how to move here without dumb moves`);
  lines.push(``);

  if (cmds.length > 0) {
    lines.push(`## Use first (t-commands routing to this bucket)`);
    lines.push(``);
    for (const c of cmds) {
      const primary = c.handles[0] ?? "?";
      lines.push(`- \`t ${primary}\` — ${c.note}  (position ${c.position})`);
    }
    lines.push(``);
  }

  if (pureRead.length > 0) {
    lines.push(`## Safe to invoke — pure read (\`skill_safe: yes\`)`);
    lines.push(``);
    for (const o of pureRead) {
      const tag = o.skill_tag ? ` [${o.skill_tag}]` : "";
      lines.push(
        `- **x${o.coordinate}_${o.handle}**${tag} — ${
          o.intent ?? "(no intent declared)"
        }`,
      );
    }
    lines.push(``);
  }

  if (externalRead.length > 0) {
    lines.push(
      `## Readonly but external / expensive (\`skill_safe: yes-readonly\`)`,
    );
    lines.push(``);
    lines.push(
      `These don't mutate substrate state, but they reach external dependencies, take time, or emit receipts by intent. Run deliberately.`,
    );
    lines.push(``);
    for (const o of externalRead) {
      const tag = o.skill_tag ? ` [${o.skill_tag}]` : "";
      lines.push(
        `- **x${o.coordinate}_${o.handle}**${tag} — ${
          o.intent ?? "(no intent declared)"
        }`,
      );
    }
    lines.push(``);
  }

  if (withCare.length > 0) {
    lines.push(
      `## Use with care — emits substrate-state changes (\`skill_safe: yes-with-care\`)`,
    );
    lines.push(``);
    for (const o of withCare) {
      const tag = o.skill_tag ? ` [${o.skill_tag}]` : "";
      lines.push(
        `- **x${o.coordinate}_${o.handle}**${tag} — ${
          o.intent ?? "(no intent declared)"
        }`,
      );
    }
    lines.push(``);
  }

  if (unclassified.length > 0) {
    lines.push(`## ⚠️ Not yet classified — DO NOT invoke without inspection`);
    lines.push(``);
    lines.push(
      `These organs lack a \`skill_safe\` header field. Until classified, treat as unknown effects; read source before invoking.`,
    );
    lines.push(``);
    for (const o of unclassified) {
      lines.push(
        `- **x${o.coordinate}_${o.handle}** — ${
          o.intent ?? "(no intent declared)"
        }  (no skill_safe declared)`,
      );
    }
    lines.push(``);
  }

  if (invalid.length > 0) {
    lines.push(`## ⚠️ Invalid skill_safe values`);
    lines.push(``);
    for (const o of invalid) {
      lines.push(
        `- **x${o.coordinate}_${o.handle}** — declared \`skill_safe: ${o.invalid_skill_safe}\` (not in {yes | yes-readonly | yes-with-care})`,
      );
    }
    lines.push(``);
  }

  lines.push(`## Import policy for x${bucket}`);
  lines.push(``);
  if (rules.allowed_targets.length > 0) {
    lines.push(`**May import:** ${rules.allowed_targets.join(", ")}`);
    lines.push(``);
  }
  if (rules.must_not_import.length > 0) {
    lines.push(`**MUST NOT import:**`);
    for (const r of rules.must_not_import) lines.push(`- ${r}`);
    lines.push(``);
  }
  if (rules.warns.length > 0) {
    lines.push(`**Warn (pattern, not deny):**`);
    for (const w of rules.warns) lines.push(`- ${w}`);
    lines.push(``);
  }

  lines.push(`## Before editing x${bucket}... organs`);
  lines.push(``);
  lines.push(
    `- Run \`t audit\` and \`t gravity\` first; note current baseline metrics.`,
  );
  lines.push(
    `- If adding a new organ, ensure its hex_dipole declares the bucket axis as primary (audit will flag mismatch).`,
  );
  lines.push(
    `- If adding header fields (intent/maturity/horizon/skill_tag/skill_safe), they appear in the next \`t agents\` / skills regen.`,
  );
  if (bucket === "6") {
    lines.push(
      `- Bucket 6 is audit-flavored. Prefer adding **read-only verifiers / reports** over mutating organs.`,
    );
    lines.push(
      `- Do not introduce a new x6 → x8 (cache) dependency; cache is downstream of audit, not upstream.`,
    );
    lines.push(
      `- Audit signals are observation, not enforcement: don't add exit-1 gates without architect approval.`,
    );
  }
  if (bucket === "4") {
    lines.push(
      `- Bucket 4 is foundation. Schemas/laws here are stable; mutations need contract + cowitness.`,
    );
    lines.push(
      `- Foundation organs MUST NOT import action (x5) or cache (x8); they would create circular law dependency.`,
    );
  }
  if (bucket === "5") {
    lines.push(
      `- Bucket 5 is action. Actions emit receipts (lane: \`.receipt.*\`); side-effects should be auditable.`,
    );
    lines.push(
      `- Avoid reading from cache (x8) as a load-bearing dependency — flag as warn.`,
    );
  }
  if (bucket === "7") {
    lines.push(
      `- Bucket 7 is completion/sealing. Receipts are sealed artifacts; once anchored, do not mutate.`,
    );
    lines.push(
      `- Sealed organs MUST NOT depend on action/audit/cache (they would create circularity in finality).`,
    );
  }
  lines.push(``);

  lines.push(`## Falsifiers`);
  lines.push(``);
  lines.push(
    `- New organ that does NOT appear in this skill brief after regen → header parsing failed or organ missed glossary entry.`,
  );
  lines.push(
    `- "Safe to invoke" organ that produced state-mutating side effect → \`skill_safe: yes\` is wrong; reclassify.`,
  );
  lines.push(
    `- Policy warning that fires on every PR → policy table is too strict for actual workflow; refine vocabulary via cowitness.`,
  );
  lines.push(
    `- Unclassified count stays above 0 after a week of normal work → \`skill_safe\` is not being added; either tool / norm / both broken.`,
  );
  lines.push(``);

  return lines.join("\n");
}

function renderSubstrateSkill(
  buckets: Map<string, OrganMeta[]>,
  glossary: GlossaryEntry[],
  _policy: Policy,
  receipts: {
    generated_at: string | null;
    manifest_hash: string;
    source_files: number;
  },
): string {
  const allOrgans = [...buckets.values()].flat();
  const unclassified =
    allOrgans.filter((o) => !o.skill_safe && !o.invalid_skill_safe).length;
  const invalid = allOrgans.filter((o) => o.invalid_skill_safe).length;
  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by probes/skills-gen-v0/gen_skill.ts — do not edit by hand. -->`,
  );
  if (receipts.generated_at) {
    lines.push(`<!-- generated_at: ${receipts.generated_at} -->`);
  }
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(
    `<!-- buckets: ${buckets.size}   organs: ${allOrgans.length}   t-commands: ${glossary.length} -->`,
  );
  if (unclassified > 0 || invalid > 0) {
    lines.push(
      `<!-- unclassified: ${unclassified}   invalid_skill_safe: ${invalid} -->`,
    );
  }
  lines.push(``);
  lines.push(`# Substrate skill — how to operate here without dumb moves`);
  lines.push(``);
  lines.push(
    `This is the operating brief, paired with \`x8888_agents.myc.md\` (which is "what I see"). This file is "how to move".`,
  );
  lines.push(``);
  lines.push(`## First moves for a fresh model`);
  lines.push(``);
  lines.push(
    `1. \`t status\` — substrate self-reflection (mirror+harmony). If "well", proceed; if anything else, read first.`,
  );
  lines.push(
    `2. \`t audit\` — placement audit (verify organ dipoles match bucket archetypes).`,
  );
  lines.push(
    `3. \`t agents\` (then read \`src/x8888_agents.myc.md\`) — federation index of buckets.`,
  );
  lines.push(
    `4. \`t gravity\` — topology tension (mean Δprimary; rising trend = drift signal).`,
  );
  lines.push(
    `5. Drill into per-bucket skills: \`src/xN888_skill.myc.md\` for whichever N you're touching.`,
  );
  lines.push(``);

  if (unclassified > 0 || invalid > 0) {
    lines.push(`## ⚠️ Substrate classification gaps`);
    lines.push(``);
    if (unclassified > 0) {
      lines.push(
        `- ${unclassified} organs lack \`skill_safe\` header — appear in per-bucket "Not yet classified" sections.`,
      );
    }
    if (invalid > 0) {
      lines.push(
        `- ${invalid} organs have invalid \`skill_safe\` value — appear in per-bucket "Invalid skill_safe values" sections.`,
      );
    }
    lines.push(``);
    lines.push(
      `Drill into bucket-skill files to see specifics. Classification is "rename when touched" — no batch-add expected.`,
    );
    lines.push(``);
  }

  lines.push(`## Bucket overview`);
  lines.push(``);
  lines.push(`| bucket | organs | classified | drill |`);
  lines.push(`|--------|--------|------------|-------|`);
  for (const [bucket, organs] of [...buckets.entries()].sort()) {
    const classified = organs.filter((o) => o.skill_safe).length;
    lines.push(
      `| ${bucket} | ${organs.length} | ${classified}/${organs.length} | [x${bucket}888_skill.myc.md](./x${bucket}888_skill.myc.md) |`,
    );
  }
  lines.push(``);
  lines.push(`## t-commands by bucket`);
  lines.push(``);
  for (const [bucket] of [...buckets.entries()].sort()) {
    const cmds = bucketCommands(bucket, glossary);
    if (cmds.length === 0) continue;
    lines.push(`### bucket ${bucket}`);
    lines.push(``);
    for (const c of cmds) {
      const primary = c.handles[0] ?? "?";
      lines.push(`- \`t ${primary}\` — ${c.note}`);
    }
    lines.push(``);
  }
  lines.push(`## Global guidance`);
  lines.push(``);
  lines.push(
    `- **Read before write.** Generated briefs (xN888_*.myc.md) are projections, not sources. To change substrate state, change source organs, then regenerate.`,
  );
  lines.push(
    `- **Probe before contract.** Don't write contracts/MORPHOLOGY.v0.md before \`probes/morphology-v0/\` graduates. Probe → real organ → contract.`,
  );
  lines.push(
    `- **Cowitness for cross-bucket moves.** Single-bucket refactor: model decides. Cross-bucket: chord proposal + AYE from at least one other model.`,
  );
  lines.push(
    `- **Receipts over assertions.** When you say "X works", prefer "\`t audit\` reports 51/51 match" over prose. Auditable.`,
  );
  lines.push(
    `- **Falsifiers in proposals.** Every chord with proposal should name what would falsify it. Without falsifier, proposal is opinion not hypothesis.`,
  );
  lines.push(``);
  lines.push(`## Forbidden / requires-cowitness moves`);
  lines.push(``);
  lines.push(
    `- Touching omega (frozen RFC v1.0) without architect explicit approval`,
  );
  lines.push(
    `- Mutating contracts in pinned SPORE_BOOTSTRAP_PIN (51 files in Bitcoin attestation)`,
  );
  lines.push(
    `- Adding hard-deny to morphology policy without observed real-substrate violation`,
  );
  lines.push(
    `- Batch-renaming files outside a single substrate's src/ (cross-substrate refactor)`,
  );
  lines.push(`- Pushing to remote without explicit \`git push\` instruction`);
  lines.push(
    `- Running destructive operations (force-push, reset --hard, rm -rf, dropping db tables)`,
  );
  lines.push(``);
  return lines.join("\n");
}

async function main(argv: string[]) {
  const args = parseArgs(argv);
  await Deno.mkdir(OUT, { recursive: true });

  const organs = await scanOrgans();
  const glossary = await loadGlossary();
  const policy = await loadPolicy();
  const buckets = groupByBucket(organs);
  const generated_at = args.stable ? null : new Date().toISOString();

  // Hash glossary + policy as additional source files (Codex P3).
  const probeRel = (abs: string) => relative(HERE, abs);
  const glossaryFile = await hashFile(GLOSSARY_PATH, probeRel(GLOSSARY_PATH));
  const policyFile = await hashFile(POLICY_PATH, probeRel(POLICY_PATH));

  // Per-bucket sources = bucket-scoped organs + glossary + policy (the
  // generator's deterministic input). Per-bucket manifest carries those.
  let written = 0;
  const bucketHashes = new Map<string, string>();

  for (const [bucket, bucketOrgans] of buckets) {
    const bucketSources: SourceFile[] = [
      ...bucketOrgans.map<SourceFile>((o) => ({
        path: probeRel(join(SRC, o.filename)),
        hash: `sha256:${o.source_hash}`,
        size: o.source_size,
      })),
      glossaryFile,
      policyFile,
    ];
    const bucketManifest = await manifestHash(bucketSources);
    const bucketReceipts = {
      generated_at,
      manifest_hash: bucketManifest,
      source_files: bucketSources.length,
    };

    const path = join(OUT, `x${bucket}888_skill.myc.md`);
    const content = renderBucketSkill(
      bucket,
      bucketOrgans,
      glossary,
      policy,
      bucketReceipts,
    );
    await Deno.writeTextFile(path, content + "\n");
    const bucketBytes = new TextEncoder().encode(content + "\n");
    bucketHashes.set(bucket, `sha256:${await sha256Hex(bucketBytes)}`);

    // Sidecar manifest per bucket
    await Deno.writeTextFile(
      join(OUT, `x${bucket}888_skill.manifest.json`),
      canonicalManifest(bucketSources) + "\n",
    );

    const unclassified = bucketOrgans.filter((o) =>
      !o.skill_safe && !o.invalid_skill_safe
    ).length;
    const invalid = bucketOrgans.filter((o) => o.invalid_skill_safe).length;
    const tag = unclassified > 0 || invalid > 0
      ? ` (${unclassified} unclassified${
        invalid > 0 ? `, ${invalid} invalid` : ""
      })`
      : "";
    console.log(
      `[write] x${bucket}888_skill.myc.md (${bucketOrgans.length} organs)${tag}`,
    );
    console.log(
      `[write] x${bucket}888_skill.manifest.json (${bucketSources.length} source entries)`,
    );
    written += 2;

    if (invalid > 0) {
      for (const o of bucketOrgans.filter((o) => o.invalid_skill_safe)) {
        console.warn(
          `  ⚠️  x${o.coordinate}_${o.handle}: invalid skill_safe '${o.invalid_skill_safe}'`,
        );
      }
    }
  }

  // Substrate-wide brief uses GLOBAL manifest (all organs + glossary + policy)
  const allSources: SourceFile[] = [
    ...organs.map<SourceFile>((o) => ({
      path: probeRel(join(SRC, o.filename)),
      hash: `sha256:${o.source_hash}`,
      size: o.source_size,
    })),
    glossaryFile,
    policyFile,
  ];
  const globalManifest = await manifestHash(allSources);
  const subsReceipts = {
    generated_at,
    manifest_hash: globalManifest,
    source_files: allSources.length,
  };

  const subsPath = join(OUT, "x8888_skills.myc.md");
  await Deno.writeTextFile(
    subsPath,
    renderSubstrateSkill(buckets, glossary, policy, subsReceipts) + "\n",
  );
  await Deno.writeTextFile(
    join(OUT, "x8888_skills.manifest.json"),
    canonicalManifest(allSources) + "\n",
  );
  console.log(`[write] x8888_skills.myc.md (substrate-wide)`);
  console.log(
    `[write] x8888_skills.manifest.json (${allSources.length} source entries)`,
  );
  written += 2;

  console.log(
    `done. ${written} files. global_manifest_hash=${globalManifest}${
      args.stable ? " (stable)" : ""
    }`,
  );
}

if (import.meta.main) {
  await main(Deno.args);
}
