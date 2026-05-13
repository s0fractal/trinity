#!/usr/bin/env -S deno run --allow-read
// 0x4/A.ts — capabilities / affordances / what-can-I-do
// position: 4/A → foundation(4) × mirror-pair(A) = reflective affordance inventory
// hex_dipole: "26 00 59 40 6C 33 33 40"
//   foundation_container+0.85 (PRIMARY: it IS the affordance inventory)
//   mirror_apex+0.70 (reflects every word's metadata into structured answer)
//   triangle_build+0.50 (composes glossary + headers + tasks)
//   completion_frontier+0.50 (provides the "what I am" edge view)
//   harmony_emergence+0.40 (orders the inventory)
//   action_decision+0.40 (lists action surface)
//   void_infinity+0.30 (covers empty/possible space)
//   bucket 4/A: primary axis foundation (4), bucket 4 ← MATCH
//               secondary 'A' → hex A = axis 2 negative pole, dipole +0.70
//               on axis 2 ← PAIR-MATCH (sign-opposed)
//   measured by claude-opus-4-7-1m, anchor block 949266
// lifecycle_phase: 0
//
// capabilities — live affordance projection (per codex 2026-05-13T210236Z)
//
// Replaces hand-maintained capabilities/trinity.capabilities.v0.1.json with
// live output computed from:
//   - 0x0/00.ndjson glossary (type:05 words / type:06 substrate mappings /
//                              type:07 receipt schemas)
//   - per-file hex_dipole headers in 0xN/.../*.ts
//   - deno.jsonc tasks (compatibility surface)
//
// Per codex's chord, contract'и стають schema records у glossary, не окремі
// замразені файли (except SPORE and externally-pinned consensus).
//
// Subcommands:
//   t capabilities                  → human table of all words
//   t capabilities --json           → machine-readable JSON
//   t capabilities show <word>      → detail for one word
//   t capabilities validate         → internal consistency check
//   t capabilities --legacy         → emit TrinityCapabilityRegistry shape
//                                     (snapshot of old format, for tools
//                                      that still depend on it)
//
// Glossary words: capabilities, affordances, can-do, спроможності, що-можу

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const GLOSSARY_PATH = join(ROOT, "0x0", "00.ndjson");
const DENO_JSON_PATH = join(ROOT, "deno.jsonc");

interface WordRecord {
  primary: string;
  handles: string[];
  position: string;
  dipole: string;
  note: string;
}

interface SubstrateMapping {
  position: string;
  substrate: string;
  command: string;
  cwd: string;
  note: string;
}

interface SchemaRecord {
  type: string;
  required: string[];
  optional?: string[];
  description?: string;
}

interface Capability {
  primary: string;
  handles: string[];
  position: string;
  path: string;
  exists: boolean;
  dipole: string;
  dipole_decoded: Array<{ axis: number; name: string; value: number }>;
  note: string;
  substrate_implementations: SubstrateMapping[];
  receipt_schema: SchemaRecord | null;
  legacy_tasks: string[];
}

const DIPOLE_AXES = [
  "void_infinity", "first_penultimate", "mirror_apex", "triangle_build",
  "foundation_container", "action_decision", "harmony_emergence", "completion_frontier",
] as const;

async function loadGlossary(): Promise<{
  words: WordRecord[];
  mappings: SubstrateMapping[];
  schemas: SchemaRecord[];
}> {
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const words: WordRecord[] = [];
  const mappings: SubstrateMapping[] = [];
  const schemas: SchemaRecord[] = [];

  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      const kind = r["00"];
      if (kind === "5") {
        // Word record: handles in 02 (mirror), position in 04 (foundation)
        if (Array.isArray(r["02"]) && typeof r["04"] === "string") {
          const handles = (r["02"] as string[]).filter((s) => typeof s === "string");
          words.push({
            primary: handles[0] ?? "",
            handles,
            position: r["04"],
            dipole: r["11"] ?? "00 00 00 00 00 00 00 00",
            note: r["09"] ?? "",
          });
        }
      } else if (kind === "6") {
        // Substrate mapping: handles in 02 (multilingual substrate name),
        // position served in 03, cwd in 04, command in 05, note in 09
        if (Array.isArray(r["02"]) && typeof r["03"] === "string") {
          const handles = (r["02"] as string[]).filter((s) => typeof s === "string");
          mappings.push({
            substrate: handles[0] ?? "",
            position: r["03"],
            command: r["05"] ?? "",
            cwd: r["04"] ?? ".",
            note: r["09"] ?? "",
          });
        }
      } else if (kind === "07") {
        const required = String(r["02"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        const optional = String(r["03"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        schemas.push({
          type: r["01"],
          required,
          optional: optional.length > 0 ? optional : undefined,
          description: r["04"],
        });
      }
    } catch { /* skip */ }
  }

  return { words, mappings, schemas };
}

function parseDipole(raw: string): Array<{ axis: number; name: string; value: number }> {
  const clean = raw.replace(/\s+/g, "").toUpperCase();
  if (clean.length !== 16) return [];
  const out: Array<{ axis: number; name: string; value: number }> = [];
  for (let i = 0; i < 8; i++) {
    const u8 = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    const i8 = u8 >= 128 ? u8 - 256 : u8;
    out.push({ axis: i, name: DIPOLE_AXES[i], value: i8 });
  }
  return out;
}

function positionToPath(pos: string): string {
  const parts = pos.split("/");
  if (parts.length < 2) return "";
  const top = `0x${parts[0]}`;
  const mid = parts.slice(1, -1);
  const file = parts[parts.length - 1] + ".ts";
  return join(ROOT, top, ...mid, file);
}

async function fileExists(p: string): Promise<boolean> {
  try { await Deno.stat(p); return true; } catch { return false; }
}

async function legacyTasksFor(word: string): Promise<string[]> {
  try {
    const text = await Deno.readTextFile(DENO_JSON_PATH);
    const tasks: string[] = [];
    const re = new RegExp(`"(${word}[\\w:-]*)"\\s*:`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      tasks.push(m[1]);
    }
    return tasks;
  } catch { return []; }
}

async function buildCapability(
  w: WordRecord,
  mappings: SubstrateMapping[],
  schemas: SchemaRecord[],
): Promise<Capability> {
  const path = positionToPath(w.position);
  const exists = path ? await fileExists(path) : false;
  const substrates = mappings.filter((m) => m.position === w.position);
  // Receipt schema: try to match any handle → type:07 schema by name
  const schema = schemas.find((s) => w.handles.includes(s.type)) ?? null;
  const tasks = await legacyTasksFor(w.primary);
  return {
    primary: w.primary,
    handles: w.handles,
    position: w.position,
    path: path.replace(ROOT + "/", ""),
    exists,
    dipole: w.dipole,
    dipole_decoded: parseDipole(w.dipole),
    note: w.note,
    substrate_implementations: substrates,
    receipt_schema: schema,
    legacy_tasks: tasks,
  };
}

function strongestAxis(decoded: Array<{ axis: number; value: number }>): { axis: number; value: number; name: string } | null {
  let best = -1, bestAxis = -1;
  for (const d of decoded) {
    const m = Math.abs(d.value);
    if (m > best) { best = m; bestAxis = d.axis; }
  }
  if (bestAxis < 0 || best === 0) return null;
  return { axis: bestAxis, value: decoded[bestAxis].value, name: DIPOLE_AXES[bestAxis] };
}

function renderTable(caps: Capability[]): void {
  console.log("# capabilities @ 4/A — live affordance projection");
  console.log("# " + "─".repeat(82));
  console.log(`# ${caps.length} words known to substrate`);
  console.log("");
  console.log("# primary".padEnd(18) + "pos".padEnd(9) + "primary axis".padEnd(28) + "subs  schema");
  console.log("# " + "─".repeat(76));
  for (const c of caps) {
    const strong = strongestAxis(c.dipole_decoded);
    const axisStr = strong
      ? `axis ${strong.axis} ${strong.name}`.padEnd(28)
      : "—".padEnd(28);
    const exists = c.exists ? "✓" : "✗";
    const subs = c.substrate_implementations.length.toString().padStart(2);
    const schema = c.receipt_schema ? "✓" : "·";
    console.log(`# ${exists} ${c.primary.padEnd(16)} ${c.position.padEnd(7)} ${axisStr}  ${subs}    ${schema}`);
  }
  console.log("# " + "─".repeat(76));
}

function renderDetail(cap: Capability): void {
  console.log(`# capability @ ${cap.primary} (${cap.position})`);
  console.log("# " + "─".repeat(60));
  console.log(`# path:        ${cap.path}`);
  console.log(`# exists:      ${cap.exists ? "yes" : "no"}`);
  console.log(`# dipole:      ${cap.dipole}`);
  for (const d of cap.dipole_decoded) {
    if (d.value !== 0) {
      const f = (d.value / 127).toFixed(3);
      const sign = d.value >= 0 ? "+" : "";
      console.log(`#   axis ${d.axis} ${d.name.padEnd(20)} ${sign}${f}`);
    }
  }
  console.log(`# note:        ${cap.note}`);
  console.log("# handles (equal, no priority):");
  for (const h of cap.handles) console.log(`#   ${h}`);
  if (cap.substrate_implementations.length > 0) {
    console.log("# substrate implementations:");
    for (const s of cap.substrate_implementations) {
      console.log(`#   ${s.substrate.padEnd(10)} ${s.command} (cwd: ${s.cwd})`);
    }
  }
  if (cap.receipt_schema) {
    console.log(`# receipt schema (type:${cap.receipt_schema.type}):`);
    console.log(`#   required: ${cap.receipt_schema.required.join(", ")}`);
    if (cap.receipt_schema.optional) {
      console.log(`#   optional: ${cap.receipt_schema.optional.join(", ")}`);
    }
  }
  if (cap.legacy_tasks.length > 0) {
    console.log(`# legacy deno tasks: ${cap.legacy_tasks.join(", ")}`);
  }
}

function validate(caps: Capability[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const positions = new Set<string>();
  for (const c of caps) {
    if (positions.has(c.position)) {
      errors.push(`duplicate position: ${c.position} (${c.primary})`);
    }
    positions.add(c.position);
    if (!c.exists) {
      errors.push(`word "${c.primary}" maps to ${c.position} but file does not exist`);
    }
    const strong = strongestAxis(c.dipole_decoded);
    if (!strong) {
      warnings.push(`word "${c.primary}" has neutral dipole`);
    }
  }
  return { errors, warnings };
}

function legacyJsonFor(caps: Capability[]): unknown {
  // Emit in the old TrinityCapabilityRegistry shape so legacy consumers can
  // continue. Fields reads/writes/side_effects are derived heuristically or
  // marked unknown; full migration requires header conventions.
  return {
    type: "TrinityCapabilityRegistry",
    version: "0.2-derived",
    status: "live-projection",
    generated_by: "0x4/A.ts (t capabilities)",
    purpose: "Live affordance projection from glossary + headers. Replaces hand-maintained capabilities/trinity.capabilities.v0.1.json per codex 2026-05-13T210236Z.",
    capabilities: caps.map((c) => ({
      id: `trinity.${c.primary.replace(/-/g, ".")}`,
      owner: "trinity",
      phase: c.receipt_schema ? "receipt" : "untyped",
      kind: "word",
      command: `t ${c.primary}`,
      position: c.position,
      reads: ["unknown — header convention pending"],
      writes: ["unknown — header convention pending"],
      side_effects: c.substrate_implementations.length > 0 ? ["substrate-call"] : ["unknown"],
      receipt: c.receipt_schema ? `type:${c.receipt_schema.type}` : "unspecified",
      composes_with: [], // derived from composite-organ scan: future
      substrate_implementations: c.substrate_implementations.length,
      legacy_tasks: c.legacy_tasks,
    })),
  };
}

if (import.meta.main) {
  const args = Deno.args;
  const wantJson = args.includes("--json");
  const wantLegacy = args.includes("--legacy");

  const { words, mappings, schemas } = await loadGlossary();
  const caps: Capability[] = [];
  for (const w of words) {
    caps.push(await buildCapability(w, mappings, schemas));
  }

  // Subcommands
  if (args[0] === "show" && args[1]) {
    const target = args[1];
    const cap = caps.find((c) => c.handles.includes(target));
    if (!cap) {
      console.log(JSON.stringify({ type: "error", message: `unknown word: ${target}` }));
      Deno.exit(1);
    }
    if (wantJson) {
      console.log(JSON.stringify(cap, null, 2));
    } else {
      renderDetail(cap);
    }
    Deno.exit(0);
  }

  if (args[0] === "validate") {
    const { errors, warnings } = validate(caps);
    const result = {
      type: "capabilities_validation",
      position: "4/A",
      summary: {
        total: caps.length,
        errors: errors.length,
        warnings: warnings.length,
        valid: errors.length === 0,
      },
      errors,
      warnings,
    };
    if (wantJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`# capabilities validation @ 4/A`);
      console.log(`# total: ${caps.length}  errors: ${errors.length}  warnings: ${warnings.length}`);
      for (const e of errors) console.log(`# ✗ ${e}`);
      for (const w of warnings) console.log(`# ⚠ ${w}`);
    }
    Deno.exit(errors.length === 0 ? 0 : 1);
  }

  if (wantLegacy) {
    const legacy = legacyJsonFor(caps);
    console.log(JSON.stringify(legacy, null, 2));
    Deno.exit(0);
  }

  const receipt = {
    type: "capabilities",
    position: "4/A",
    action: "list",
    note: "foundation+mirror-pair = live affordance projection from glossary",
    source_of_truth: "0x0/00.ndjson (type:05/06/07) + per-file headers + deno.jsonc",
    legacy_artifact: "capabilities/trinity.capabilities.v0.1.json (deprecated; use --legacy to regenerate)",
    summary: {
      total_words: caps.length,
      with_schema: caps.filter((c) => c.receipt_schema).length,
      with_substrate_impl: caps.filter((c) => c.substrate_implementations.length > 0).length,
      missing_executable: caps.filter((c) => !c.exists).length,
    },
    capabilities: caps,
    synonyms: ["capabilities", "affordances", "can-do", "спроможності", "що-можу"],
    topology: "live read of glossary + headers; not a stored registry",
  };

  if (wantJson) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    renderTable(caps);
  }
}
