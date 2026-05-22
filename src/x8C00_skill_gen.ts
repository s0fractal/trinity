#!/usr/bin/env -S deno run --allow-read --allow-write
// src/x8C00_skill_gen.ts — skill / operating brief generator
// position: 8/C → cache(8) × container-pair(C) = operating knowledge in chaos buffer
// hex_dipole: "93 00 00 00 33 00 33 00"
//   void_infinity-0.85 (PRIMARY: negative pole = infinity/cache; bucket 8 PAIR-MATCH)
//   foundation_container+0.40 (chaos-side reading; captures policy-like patterns)
//   harmony_emergence+0.40 (synthesizes operating guidance from substrate signals)
// placement_policy: axis
// intent: scan organ headers + glossary, render xN888_skill.myc.md per bucket + x8888_skills.myc.md substrate index
// maturity: active
// horizon: extend with skill_tag/skill_safe consistency audit (currently warns invalid, doesn't validate tag-vs-actual-behavior)
//
// skill_gen — substrate operating brief generator
//
// Pairs with x8800_agents_gen.ts: state brief says "what I see"; skill
// brief says "how to move here without dumb moves". Graduates from
// probes/skills-gen-v0/ into live substrate.
//
// Reads:
//   - src/ organ headers (intent / maturity / horizon / skill_tag / skill_safe)
//   - src/x0001_glossary.ndjson (real glossary, not subset)
//   - embedded v0 import-policy table (will swap to live morphology organ
//     when it graduates from probe; coordinate sketched as future x6F00_*)
//
// Renders (all gitignored, regenerable from sources):
//   src/xN888_skill.myc.md            per-bucket operating brief
//   src/xN888_skill.manifest.json     per-bucket source manifest sidecar
//   src/x8888_skills.myc.md           substrate-wide operating brief
//   src/x8CF0_skills_bootstrap.myc.md root SKILLS.md symlink target
//   src/x8888_skills.manifest.json    global source manifest sidecar
//
// Subcommands (via t dispatcher):
//   t skill                  regenerate all buckets + substrate index
//   t skill --bucket=6       regenerate one bucket only (no x8888)
//   t skill --stable         deterministic output (no generated_at)
//
// Glossary words: skill, skills, operating-brief, навик, навички

import {
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const SRC = HERE;
const OUT = HERE;
const GLOSSARY_PATH = join(HERE, "x0001_glossary.ndjson");

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

// Embedded morphology-v0 import-policy table.
// SWAP-OUT: when morphology graduates to a live organ (probable coord x6F00),
// this generator should import its policy module instead of duplicating.
const POLICY = {
  allow: {
    "0": ["0", "4"],
    "1": ["0", "1", "4"],
    "2": ["0", "1", "2", "4", "5", "6"],
    "3": ["0", "1", "3", "4", "5"],
    "4": ["0", "1", "4"],
    "5": ["0", "4", "5", "6", "7"],
    "6": ["0", "4", "5", "6", "7"],
    "7": ["0", "4", "7"],
    "8": [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ],
  } as Record<string, string[]>,
  hard_deny: [
    ["4", "5", "foundation cannot depend on action"],
    ["4", "8", "foundation cannot depend on cache"],
    ["4", "C", "foundation cannot depend on chaos"],
    ["7", "5", "sealed cannot depend on action"],
    ["7", "6", "sealed cannot depend on audit"],
    ["7", "C", "sealed cannot depend on chaos"],
    ["0", "C", "primitive cannot depend on chaos"],
  ] as [string, string, string][],
  warn: [
    ["5", "8", "action reading cache indicates state-leak pattern"],
    ["6", "8", "audit reading cache should be receipt-style not dependency"],
  ] as [string, string, string][],
};

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

interface Args {
  bucket: string | null;
  stable: boolean;
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
  const lines = content.split("\n").slice(0, 40);
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
    if (entry.name === "x8C00_skill_gen.ts") continue; // skip self
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

interface SourceFile {
  path: string;
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

function canonicalManifest(files: SourceFile[]): string {
  return JSON.stringify(
    files.slice().sort((a, b) => a.path.localeCompare(b.path)),
  );
}

async function manifestHash(files: SourceFile[]): Promise<string> {
  return `sha256:${await sha256Hex(
    new TextEncoder().encode(canonicalManifest(files)),
  )}`;
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

function bucketImportRules(bucket: string) {
  const allowed = POLICY.allow[bucket] ?? [];
  const denies = POLICY.hard_deny.filter(([s]) => s === bucket).map((
    [, t, w],
  ) => `x${t} (${w})`);
  const warns = POLICY.warn.filter(([s]) => s === bucket).map(([, t, w]) =>
    `x${t} (${w})`
  );
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
  receipts: {
    generated_at: string | null;
    manifest_hash: string;
    source_files: number;
  },
): string {
  const cmds = bucketCommands(bucket, glossary);
  const rules = bucketImportRules(bucket);

  const pureRead = organs.filter((o) => o.skill_safe === "yes");
  const externalRead = organs.filter((o) => o.skill_safe === "yes-readonly");
  const withCare = organs.filter((o) => o.skill_safe === "yes-with-care");
  const unclassified = organs.filter((o) =>
    !o.skill_safe && !o.invalid_skill_safe
  );
  const invalid = organs.filter((o) => o.invalid_skill_safe);

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8C00_skill_gen.ts — do not edit by hand. -->`,
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
      `Don't mutate substrate state, but reach external deps, take time, or emit receipts by intent. Run deliberately.`,
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
      `These organs lack a \`skill_safe\` header field. Treat as unknown effects; read source before invoking.`,
    );
    lines.push(``);
    for (const o of unclassified) {
      lines.push(
        `- **x${o.coordinate}_${o.handle}**${
          o.intent ? ` — ${o.intent}` : ""
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
  }
  lines.push(``);
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
    `- Run \`t audit\` and \`t gravity\` first; note baseline metrics.`,
  );
  lines.push(
    `- New organ: ensure hex_dipole declares the bucket axis as primary (audit flags mismatch).`,
  );
  lines.push(
    `- New header fields (intent/maturity/horizon/skill_tag/skill_safe) appear in next \`t agents\` / \`t skill\` regen.`,
  );
  if (bucket === "6") {
    lines.push(
      `- Bucket 6 is audit-flavored. Prefer **read-only verifiers / reports** over mutating organs.`,
    );
    lines.push(
      `- Do NOT introduce a new x6 → x8 (cache) dependency; cache is downstream of audit.`,
    );
    lines.push(
      `- Audit signals are observation, not enforcement: no exit-1 gates without architect approval.`,
    );
  }
  if (bucket === "4") {
    lines.push(
      `- Bucket 4 is foundation. Schemas/laws are stable; mutations need contract + cowitness.`,
    );
    lines.push(
      `- Foundation organs MUST NOT import action (x5) or cache (x8).`,
    );
  }
  if (bucket === "5") {
    lines.push(
      `- Bucket 5 is action. Actions emit receipts; side-effects should be auditable.`,
    );
    lines.push(`- Avoid reading from cache (x8) as a load-bearing dependency.`);
  }
  if (bucket === "7") {
    lines.push(
      `- Bucket 7 is completion/sealing. Receipts are sealed; once anchored, do not mutate.`,
    );
    lines.push(`- Sealed organs MUST NOT depend on action/audit/cache.`);
  }
  lines.push(``);

  lines.push(`## Falsifiers`);
  lines.push(``);
  lines.push(
    `- New organ NOT in this brief after regen → header parsing failed or glossary missed entry.`,
  );
  lines.push(
    `- "Safe to invoke" organ that produced state-mutating side effect → \`skill_safe: yes\` is wrong; reclassify.`,
  );
  lines.push(
    `- Policy warning that fires on every PR → policy table too strict; refine via cowitness.`,
  );
  lines.push(
    `- Unclassified count stays above 0 after a week → \`skill_safe\` not being added; tool / norm / both broken.`,
  );
  lines.push(``);

  return lines.join("\n");
}

function renderSubstrateSkill(
  buckets: Map<string, OrganMeta[]>,
  glossary: GlossaryEntry[],
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
    `<!-- AUTO-GENERATED by src/x8C00_skill_gen.ts — do not edit by hand. -->`,
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
    `Operating brief, paired with \`x8888_agents.myc.md\` (state brief). State = "what I see". Skill = "how to move".`,
  );
  lines.push(``);
  lines.push(`## First moves for a fresh model`);
  lines.push(``);
  lines.push(
    `1. \`t status\` — substrate self-reflection. If "well", proceed.`,
  );
  lines.push(
    `2. \`t audit\` — placement audit (organ dipoles vs bucket archetypes).`,
  );
  lines.push(
    `3. \`t agents\` then read \`src/x8888_agents.myc.md\` — federation state index.`,
  );
  lines.push(
    `4. \`t skill\` then read \`src/x8888_skills.myc.md\` (this file).`,
  );
  lines.push(`5. \`t gravity\` — topology tension (drift signal if rising).`);
  lines.push(`6. Drill into per-bucket: \`src/xN888_skill.myc.md\`.`);
  lines.push(``);

  if (unclassified > 0 || invalid > 0) {
    lines.push(`## ⚠️ Substrate classification gaps`);
    lines.push(``);
    if (unclassified > 0) {
      lines.push(
        `- ${unclassified} organs lack \`skill_safe\` header — see per-bucket "Not yet classified" sections.`,
      );
    }
    if (invalid > 0) {
      lines.push(
        `- ${invalid} organs have invalid \`skill_safe\` value — see per-bucket "Invalid skill_safe values" sections.`,
      );
    }
    lines.push(``);
    lines.push(
      `Classification follows "rename when touched" — no batch-add expected. Most organs predate the skill_tag/skill_safe convention (added 2026-05-19).`,
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
    `- **Read before write.** Generated briefs (xN888_*.myc.md) are projections; to change state, change source organs and regenerate.`,
  );
  lines.push(
    `- **Probe before contract.** Don't stabilize before \`probes/\` graduates.`,
  );
  lines.push(
    `- **Cowitness for cross-bucket moves.** Single-bucket: model decides. Cross-bucket: chord proposal + AYE from ≥1 other model.`,
  );
  lines.push(
    `- **Receipts over assertions.** "t audit reports 51/51 match" beats prose.`,
  );
  lines.push(
    `- **Falsifiers in proposals.** Without falsifier, proposal is opinion not hypothesis.`,
  );
  lines.push(``);

  lines.push(`## Forbidden / requires-cowitness moves`);
  lines.push(``);
  lines.push(`- Touching omega (frozen RFC v1.0) without architect approval`);
  lines.push(
    `- Mutating contracts in pinned SPORE_BOOTSTRAP_PIN (51 files, Bitcoin anchored)`,
  );
  lines.push(
    `- Adding hard-deny to morphology policy without observed real-substrate violation`,
  );
  lines.push(
    `- Batch-renaming files outside one substrate's src/ (cross-substrate refactor)`,
  );
  lines.push(`- Pushing to remote without explicit \`git push\` instruction`);
  lines.push(
    `- Destructive ops (force-push, reset --hard, rm -rf, drop table)`,
  );
  lines.push(``);

  return lines.join("\n");
}

function renderSkillsBootstrap(
  buckets: Map<string, OrganMeta[]>,
  glossary: GlossaryEntry[],
  receipts: { manifest_hash: string; source_files: number },
): string {
  const allOrgans = [...buckets.values()].flat();
  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by src/x8C00_skill_gen.ts — do not edit by hand. -->`,
  );
  lines.push(`<!-- root_abi: SKILLS.md symlink target -->`);
  lines.push(`<!-- source_manifest_hash: ${receipts.manifest_hash} -->`);
  lines.push(`<!-- source_files: ${receipts.source_files} -->`);
  lines.push(
    `<!-- organs: ${allOrgans.length}   t-commands: ${glossary.length} -->`,
  );
  lines.push(``);
  lines.push(`# SKILLS`);
  lines.push(``);
  lines.push(
    `This root skill brief is generated from \`src/x0001_glossary.ndjson\` and organ headers. To refresh it:`,
  );
  lines.push(``);
  lines.push(`\`\`\`sh`);
  lines.push(`./t skill --stable`);
  lines.push(`\`\`\``);
  lines.push(``);
  lines.push(
    `Detailed generated operating briefs live at \`src/x8888_skills.myc.md\` and \`src/x?888_skill.myc.md\`.`,
  );
  lines.push(``);
  lines.push(`## First Commands`);
  lines.push(``);
  lines.push(`- \`./t status\` — check substrate health`);
  lines.push(`- \`./t help\` — list command handles`);
  lines.push(`- \`./t agents\` — regenerate root self-brief projections`);
  lines.push(`- \`./t skill\` — regenerate this command projection`);
  lines.push(`- \`./t memory\` — regenerate voice memory projections`);
  lines.push(`- \`./t roadmap\` — regenerate frontier tension`);
  lines.push(``);
  lines.push(`## All t Commands`);
  lines.push(``);
  for (const [bucket] of [...buckets.entries()].sort()) {
    const cmds = bucketCommands(bucket, glossary);
    if (cmds.length === 0) continue;
    lines.push(`### Bucket ${bucket}`);
    lines.push(``);
    for (const c of cmds) {
      const primary = c.handles[0] ?? "?";
      const aliases = c.handles.slice(1).join(", ");
      const suffix = aliases ? `; aliases: ${aliases}` : "";
      lines.push(`- \`./t ${primary}\` — ${c.note} (${c.position}${suffix})`);
    }
    lines.push(``);
  }
  lines.push(`## Operating Rules`);
  lines.push(``);
  lines.push(
    `- Generated briefs are projections. Change source organs, glossary, contracts, or voice records, then regenerate.`,
  );
  lines.push(
    `- Read before write: \`./t status\`, \`./t audit\`, and relevant \`src/x?888_*.myc.md\`.`,
  );
  lines.push(
    `- Cross-bucket or governance-shaped moves should leave a chord with falsifier in \`jazz/chords/\`.`,
  );
  lines.push(
    `- Destructive git/file operations require explicit architect instruction.`,
  );
  lines.push(
    `- Do not treat ignored generated caches as canonical; tracked \`src/xNNNN_*.myc.*\` sources and root bootstrap targets are the ABI.`,
  );
  lines.push(``);
  lines.push(`## Falsifiers`);
  lines.push(``);
  lines.push(
    `- A command appears in \`./t help\` but not here after \`./t skill --stable\` → glossary parsing is incomplete.`,
  );
  lines.push(
    `- A command here routes to no organ → glossary position or dispatch mapping drifted.`,
  );
  lines.push(
    `- Fresh checkout has a broken \`SKILLS.md\` symlink → root ABI failed; restore a tracked shim.`,
  );
  return lines.join("\n");
}

async function main(argv: string[]) {
  const args = parseArgs(argv);
  const allOrgans = await scanOrgans();
  const organs = args.bucket
    ? allOrgans.filter((o) => o.bucket === args.bucket)
    : allOrgans;

  if (organs.length === 0) {
    console.log(
      `no organs found${args.bucket ? ` in bucket ${args.bucket}` : ""}`,
    );
    return;
  }

  const glossary = await loadGlossary();
  const buckets = groupByBucket(organs);
  const generated_at = args.stable ? null : new Date().toISOString();

  // Source manifest includes organs + glossary (live policy is embedded in this file
  // so it's already part of the generator's identity, not a separate source).
  const probeRel = (abs: string) => relative(join(SRC, ".."), abs);
  const glossaryFile = await hashFile(GLOSSARY_PATH, probeRel(GLOSSARY_PATH));

  // Mode hygiene
  if (args.bucket) {
    for (const stale of ["x8888_skills.myc.md", "x8888_skills.manifest.json"]) {
      try {
        await Deno.remove(join(OUT, stale));
      } catch { /* didn't exist */ }
    }
    for await (const entry of Deno.readDir(OUT)) {
      if (!entry.isFile) continue;
      const m = /^x([0-9A-Fa-f])888_skill\.(myc\.md|manifest\.json)$/.exec(
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
  for (const [bucket, bucketOrgans] of buckets) {
    const bucketSources: SourceFile[] = [
      ...bucketOrgans.map<SourceFile>((o) => ({
        path: probeRel(join(SRC, o.filename)),
        hash: `sha256:${o.source_hash}`,
        size: o.source_size,
      })),
      glossaryFile,
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
      bucketReceipts,
    );
    await Deno.writeTextFile(path, content + "\n");
    await Deno.writeTextFile(
      join(OUT, `x${bucket}888_skill.manifest.json`),
      canonicalManifest(bucketSources) + "\n",
    );

    const unc = bucketOrgans.filter((o) =>
      !o.skill_safe && !o.invalid_skill_safe
    ).length;
    const inv = bucketOrgans.filter((o) => o.invalid_skill_safe).length;
    const tag = unc > 0 || inv > 0
      ? ` (${unc} unclassified${inv > 0 ? `, ${inv} invalid` : ""})`
      : "";
    console.log(
      `[write] x${bucket}888_skill.myc.md (${bucketOrgans.length} organs)${tag}`,
    );
    console.log(
      `[write] x${bucket}888_skill.manifest.json (${bucketSources.length} source entries)`,
    );
    written += 2;

    if (inv > 0) {
      for (const o of bucketOrgans.filter((o) => o.invalid_skill_safe)) {
        console.warn(
          `  ⚠️  x${o.coordinate}_${o.handle}: invalid skill_safe '${o.invalid_skill_safe}'`,
        );
      }
    }
  }

  if (!args.bucket) {
    const allSources: SourceFile[] = [
      ...organs.map<SourceFile>((o) => ({
        path: probeRel(join(SRC, o.filename)),
        hash: `sha256:${o.source_hash}`,
        size: o.source_size,
      })),
      glossaryFile,
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
      renderSubstrateSkill(buckets, glossary, subsReceipts) + "\n",
    );
    await Deno.writeTextFile(
      join(OUT, "x8CF0_skills_bootstrap.myc.md"),
      renderSkillsBootstrap(buckets, glossary, subsReceipts) + "\n",
    );
    await Deno.writeTextFile(
      join(OUT, "x8888_skills.manifest.json"),
      canonicalManifest(allSources) + "\n",
    );
    console.log(`[write] x8888_skills.myc.md (substrate-wide)`);
    console.log(
      `[write] x8CF0_skills_bootstrap.myc.md (root SKILLS.md target)`,
    );
    console.log(
      `[write] x8888_skills.manifest.json (${allSources.length} source entries)`,
    );
    written += 3;
    console.log(
      `done. ${written} files. global_manifest_hash=${globalManifest}${
        args.stable ? " (stable)" : ""
      }`,
    );
  } else {
    console.log(
      `done. ${written} files for bucket ${args.bucket}${
        args.stable ? " (stable)" : ""
      }`,
    );
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
