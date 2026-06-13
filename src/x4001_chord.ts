#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write
// src/x4001_chord.ts — chord (substrate-native chord scaffolding + dipole math)
// position: 4/0 → foundation(4) × void(0) = primal toolkit / blank-scaffold
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 00 40 40 6C 19 33 26"
//   foundation_container+0.85 (PRIMARY: provides chord infrastructure)
//   mirror_apex+0.50 (parse reflects hex → readings)
//   triangle_build+0.50 (init composes frontmatter scaffold)
//   harmony_emergence+0.40 (canonical convention enforcement)
//   void_infinity+0.30 (operates from empty / scaffold)
//   completion_frontier+0.30 (produces final chord skeleton)
//   action_decision+0.20 (mostly format conversion, light action)
//   bucket 4/0: primary axis foundation (4), bucket 4 ← MATCH
//               secondary '0' → axis 0 void, dipole +0.30 on axis 0 ← weak match
//   measured by claude-opus-4-7-1m. First file at 0x4/ — establishes bucket.
// lifecycle_phase: 1
//
// Subcommands (canonical via `t chord <sub> ...`, legacy via `deno task chord:*`):
//   block                          Print current Bitcoin block height
//   init [opts]                    Draft any chord type in the living lean form
//                                  (--type, --voice, --topic; --write to land)
//   receipt [opts]                 Draft a receipt chord (living lean form,
//                                  canonical flat-src filename; --write to land)
//   claim --horizon=H [opts]       Bind an open roadmap horizon to a voice
//                                  (claim chord; --write to land)
//   translate <axis> <value>       Convert axis name + signed value → hex byte
//   parse "<hex bytes>"            Convert 8-byte hex vector → human readings
//
// Init options:
//   --author=NAME         Author identity (default: anonymous)
//   --topic="SLUG"        Topic slug (default: untitled)
//   --octet=oct:N.M       Chord primary octet (default: oct:7.0)
//   --claim-kind=KIND     Claim kind (default: observation)
//
// Examples:
//   t chord block
//   t chord init --author=claude --topic=my-thought
//   t chord translate void_infinity +0.4
//   t chord parse "33 8E 59 40 00 26 4C 59"
//
// Substrate alignment:
//   - Bitcoin anchor: Φ-Manifest Invariant 3 (omega/docs/PHI_MANIFEST.md)
//   - Dipole axes: HEX_DIPOLE_SEED.v0.draft.md
//   - Lifecycle phases: LIFECYCLE_SEED.v0.draft.md
//   - Chord schema: CHORD_CLAIM.v0.1.md
//
// Glossary words: chord, scaffold, frontmatter, акорд, скаффолд
//
// Notes:
//   - Dipole vocabulary still hardcoded; later can read from HEX_DIPOLE_SEED.v0
//   - Identity verification: soft (trust-based) for v0.0
//   - Path resolution unchanged: ../src/x0001_glossary.ndjson still resolves correctly
//     from 0x4/0.ts (same depth as old tools/ location)

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { signChordContent } from "./x2F37_voice_keys.ts";

const BTC_TIP_URL = "https://blockstream.info/api/blocks/tip/height";

// Canonical dipole axis order from HEX_DIPOLE_SEED.v0.draft.md
// Byte position N corresponds to dipole pair (N, N+8) on hex16 circle.
const DIPOLE_AXES = [
  "void_infinity", // axis 0: hex 0 ↔ hex 8
  "first_penultimate", // axis 1: hex 1 ↔ hex 9
  "mirror_apex", // axis 2: hex 2 ↔ hex A
  "triangle_build", // axis 3: hex 3 ↔ hex B
  "foundation_container", // axis 4: hex 4 ↔ hex C
  "action_decision", // axis 5: hex 5 ↔ hex D
  "harmony_emergence", // axis 6: hex 6 ↔ hex E
  "completion_frontier", // axis 7: hex 7 ↔ hex F
] as const;

// Lifecycle phases — trimmed to 3 for v0.1 operational simplicity
// (growth/maturity/reproduction merged into "active").
// Full 5-phase model returns in v0.2+ when granularity needed.
const LIFECYCLE_PHASES = [
  "seed", // 0 = oct:0 EXISTENCE    — nascent, unproven
  "active", // 1 = oct:3..7 UNION..TRANSCENDENCE — living, growing, reproducing
  "compost", // 2 = oct:6 ORDER        — archived, absorbed, recycled
] as const;

const GLOSSARY_PATH =
  new URL("../src/x0001_glossary.ndjson", import.meta.url).pathname;

/** Load dipole pair mapping from glossary type-03 records.
 *  Returns Map<hex_char, dipole_pair_char> — e.g. "0"→"8", "8"→"0".
 *  This removes implicit pair mapping from code comments (SSOT = glossary).
 */
async function fn_load_dipole_pairs(): Promise<Map<string, string>> {
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  const pairs = new Map<string, string>();
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      if (r["00"] !== "03") continue;
      const hex = r["01"];
      const pair = r["17"];
      if (hex && pair) pairs.set(hex, pair);
    } catch { /* skip */ }
  }
  return pairs;
}

async function fetchBtcBlock(): Promise<number> {
  const res = await fetch(BTC_TIP_URL);
  if (!res.ok) throw new Error(`BTC API ${res.status}`);
  const text = (await res.text()).trim();
  const n = Number(text);
  if (!Number.isFinite(n)) throw new Error(`bad block height: ${text}`);
  return n;
}

/** Convert signed float in [-1, +1] to i8 hex byte (-127..+127 range). */
function floatToI8Hex(value: number): string {
  if (value < -1 || value > 1) {
    throw new Error(`value ${value} out of [-1, +1]`);
  }
  const i = Math.round(value * 127);
  const u8 = i < 0 ? 256 + i : i; // two's complement for negatives
  return u8.toString(16).padStart(2, "0").toUpperCase();
}

/** Parse hex byte (i8 two's complement) to signed float in [-1, +1]. */
function i8HexToFloat(hex: string): number {
  const u8 = parseInt(hex, 16);
  if (!Number.isFinite(u8) || u8 < 0 || u8 > 255) {
    throw new Error(`bad hex byte: ${hex}`);
  }
  const i = u8 >= 128 ? u8 - 256 : u8;
  return i / 127;
}

/** Parse "33 8E 59 40 00 26 4C 59" or "338E594000264C59" into 8 floats. */
function parseDipoleVector(hex: string): number[] {
  const clean = hex.replace(/\s+/g, "").toUpperCase();
  if (clean.length !== 16) {
    throw new Error(`expected 16 hex chars, got ${clean.length}`);
  }
  const bytes: string[] = [];
  for (let i = 0; i < 16; i += 2) bytes.push(clean.slice(i, i + 2));
  return bytes.map(i8HexToFloat);
}

function axisIndex(axisName: string): number {
  const idx = DIPOLE_AXES.indexOf(axisName as typeof DIPOLE_AXES[number]);
  if (idx < 0) {
    throw new Error(
      `unknown axis: ${axisName}\nknown: ${DIPOLE_AXES.join(", ")}`,
    );
  }
  return idx;
}

function parseArgs(args: string[]): {
  positional: string[];
  flags: Record<string, string>;
} {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [k, v = "true"] = arg.slice(2).split("=", 2);
      flags[k] = v;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function chordSlug(text: string, maxLen = 50): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "") || "untitled";
}

// Canonical flat-src chord filename for a NEWLY authored chord. Kept local
// rather than imported from x8F20_chord_migrate (a higher-bucket runtime organ —
// importing it from bucket 4 violates the coordinate gravity law). Produces the
// same coordinate x8F20 would assign, so `t chord-migrate` sees these chords as
// already-migrated / zero-inference.
interface FlatSrcName {
  targetName: string;
  coordinate: string;
  blockKey: string;
  voice: string;
  warnings: string[];
}

function octHexDigit(value: string): string | null {
  const m = String(value).match(/(?:oct|hex):([0-9A-Fa-f])/i);
  return m ? m[1].toUpperCase() : null;
}

function modeDigit(mode: string): string {
  const s = mode.toLowerCase();
  if (/propos/.test(s)) return "D";
  if (/receipt/.test(s)) return "7";
  if (/cowitness|witness|aye|review/.test(s)) return "6";
  if (/audit/.test(s)) return "B";
  if (/critique|nay|reject/.test(s)) return "9";
  if (/observation|riff|synthesis/.test(s)) return "3";
  return "0";
}

function flatSrcName(opts: {
  primary: string;
  mode: string;
  claimKind: string;
  block: number;
  voice: string;
  slug: string;
}): FlatSrcName {
  const bucket = octHexDigit(opts.primary) ?? "3";
  const coordinate = `x${bucket}${modeDigit(opts.mode)}${
    octHexDigit(opts.claimKind) ?? "0"
  }0`
    .toLowerCase();
  const blockKey = String(opts.block);
  const voiceSlug = chordSlug(opts.voice);
  return {
    targetName: `${coordinate}_${blockKey}_${voiceSlug}_${opts.slug}.myc.md`,
    coordinate,
    blockKey,
    voice: voiceSlug,
    warnings: [],
  };
}

async function cmdBlock(): Promise<void> {
  const h = await fetchBtcBlock();
  console.log(h);
}

async function cmdInit(flags: Record<string, string>): Promise<void> {
  const block = await fetchBtcBlock();
  const voice = flags.voice ?? flags.author ?? "anonymous";
  const type = flags.type ?? "observation";
  const topicRaw = flags.topic ?? "untitled";
  const slug = chordSlug(topicRaw);
  const primary = flags.primary ?? flags.octet ?? "oct:3.observation";
  const stance = flags.stance ?? type.toUpperCase();
  const claimKind = flags["claim-kind"] ?? type;
  const composed = flatSrcName({
    primary,
    mode: type,
    claimKind,
    block,
    voice,
    slug,
  });

  // Living lean form (matches what voices actually author; the old verbose
  // anchor_block/self_dipole_position skeleton was used by no living chord).
  const content = `---
type: chord.${type}
voice: ${voice}
mode: ${type}
created: ${new Date().toISOString()}
bitcoin_block_height: ${block}
topic: ${slug}
stance: ${stance}
chord:
  primary: "${primary}"
  secondary: []
hears: []
references: []
---

# ${topicRaw}

[claim — what you observe or propose, and why it matters]

## Falsifier

- [if this command/check fails, this chord is false]

— ${voice}, anchor block ${block}.
`;
  await emitChord(composed, content, flags, "chord_init");
}

async function cmdReceipt(flags: Record<string, string>): Promise<void> {
  const block = await fetchBtcBlock();
  const voice = flags.voice ?? flags.author ?? "anonymous";
  const topicRaw = flags.topic ?? "untitled";
  const slug = chordSlug(topicRaw);
  const primary = flags.primary ?? flags.octet ?? "oct:7.completion";
  const stance = flags.stance ?? "RECEIPT";
  const claimKind = flags["claim-kind"] ?? "receipt";

  // Canonical flat-src filename (matches what x8F20 would assign — already
  // migrated, zero inference, CI invariants stay green).
  const composed = flatSrcName({
    primary,
    mode: "receipt",
    claimKind,
    block,
    voice,
    slug,
  });

  const closesBlock = flags.closes
    ? `closes:\n  path_hint: ${flags.closes}\n  relation: ${
      flags.relation ?? "implements"
    }\n`
    : "";

  // A receipt may declare it satisfies a cognition recommendation signal
  // (`<repo>/<vector>`, e.g. liquid/identity-resolution). x5200 tier-sorts a
  // satisfied signal below live work — see contracts/COGNITIVE_RECOMMENDATION §5.
  const satisfiesBlock = flags["satisfies-signal"]
    ? `satisfies_signal: ${flags["satisfies-signal"]}\n`
    : "";

  const content = `---
type: chord.receipt
voice: ${voice}
mode: receipt
created: ${new Date().toISOString()}
bitcoin_block_height: ${block}
topic: ${slug}
stance: ${stance}
chord:
  primary: "${primary}"
  secondary: []
${closesBlock}${satisfiesBlock}hears: []
references: []
suggested_commands: []
expected_after_running: {}
---

# Receipt: ${topicRaw}

[claim — what landed, why it is real, and what it closes]

## Falsifiers

- [if this command/check fails, this receipt is false]

— ${voice}, anchor block ${block}.
`;

  await emitChord(composed, content, flags, "chord_receipt");
}

/** If the authoring voice has a local key, insert a content_sig block into
 *  the frontmatter (W3: provenance upgrades from narrative to cryptographic).
 *  No key / no permission → unsigned, which stays legal. */
async function withContentSig(
  voice: string,
  composed: FlatSrcName,
  content: string,
): Promise<{ content: string; signed: boolean }> {
  const sigLines = await signChordContent(
    voice,
    composed.targetName,
    content,
  );
  if (!sigLines) return { content, signed: false };
  // Insert just before the closing frontmatter fence.
  const closing = content.indexOf("\n---\n", 4);
  if (closing === -1) return { content, signed: false };
  const updated = content.slice(0, closing + 1) + sigLines.join("\n") +
    content.slice(closing);
  return { content: updated, signed: true };
}

/** Shared --write (land in src/) vs dry (print) path for authored chords. */
async function emitChord(
  composed: FlatSrcName,
  rawContent: string,
  flags: Record<string, string>,
  kind: string,
): Promise<void> {
  const voice = flags.voice ?? flags.author ?? "anonymous";
  const { content, signed } = await withContentSig(
    voice,
    composed,
    rawContent,
  );
  const doWrite = "write" in flags && flags.write !== "false";
  if (doWrite) {
    const HERE = dirname(fromFileUrl(import.meta.url));
    const target = join(HERE, composed.targetName);
    try {
      await Deno.lstat(target);
      console.error(
        `refusing to overwrite existing chord: src/${composed.targetName}`,
      );
      Deno.exit(1);
    } catch {
      // does not exist — safe to write
    }
    await Deno.writeTextFile(target, content);
    console.log(JSON.stringify(
      {
        type: kind,
        written: `src/${composed.targetName}`,
        coordinate: composed.coordinate,
        block_key: composed.blockKey,
        voice: composed.voice,
        content_signed: signed,
        warnings: composed.warnings,
        next:
          `git add src/${composed.targetName}  # ledger indexes tracked chords only`,
      },
      null,
      2,
    ));
  } else {
    console.log(`# would write: src/${composed.targetName}`);
    if (composed.warnings.length) {
      console.log(`# warnings: ${composed.warnings.join("; ")}`);
    }
    console.log(
      `# add --write to create it, then: git add src/${composed.targetName}`,
    );
    console.log(content);
  }
}

async function cmdClaim(flags: Record<string, string>): Promise<void> {
  const horizon = flags.horizon;
  if (!horizon) {
    console.error(
      "claim requires --horizon <handle>  (e.g. --horizon=x0030_compose); see `t roadmap`",
    );
    Deno.exit(1);
  }
  const block = await fetchBtcBlock();
  const voice = flags.voice ?? flags.author ?? "anonymous";
  const primary = flags.primary ?? flags.octet ?? "oct:5.action";
  const slug = chordSlug(`claim ${horizon}`);

  const composed = flatSrcName({
    primary,
    mode: "claim",
    claimKind: "claim",
    block,
    voice,
    slug,
  });

  const content = `---
type: chord.claim
voice: ${voice}
mode: claim
created: ${new Date().toISOString()}
bitcoin_block_height: ${block}
topic: ${slug}
stance: CLAIM
chord:
  primary: "${primary}"
  secondary: []
claims:
  horizon: ${horizon}
hears: []
references:
  - src/x8D00_roadmap.myc.md
---

# Claim: ${horizon}

${voice} takes this open roadmap horizon as its turn.

[why this voice — how it fits my vector / standing]

## Falsifier

- If this horizon is already closed (its organ's \`horizon:\` field begins with
  "none"), this claim is stale and should be composted.

— ${voice}, anchor block ${block}.
`;

  await emitChord(composed, content, flags, "chord_claim");
}

function cmdTranslate(positional: string[]): void {
  if (positional.length < 2) {
    console.error("usage: translate <axis_name> <signed_value>");
    Deno.exit(1);
  }
  const axisName = positional[0];
  const valueStr = positional[1];
  const idx = axisIndex(axisName);
  const value = Number(valueStr);
  if (!Number.isFinite(value)) {
    console.error(`bad value: ${valueStr}`);
    Deno.exit(1);
  }
  const hex = floatToI8Hex(value);
  console.log(
    `axis_index: ${idx}  axis_name: ${axisName}  value: ${
      value.toFixed(3)
    }  hex_byte: 0x${hex}`,
  );
}

function cmdParse(positional: string[]): void {
  if (positional.length < 1) {
    console.error('usage: parse "<hex bytes>"');
    Deno.exit(1);
  }
  const hex = positional[0];
  const values = parseDipoleVector(hex);
  console.log("axis_idx  axis_name              hex   i8    float");
  console.log("--------  --------------------   ---   ---   -----");
  for (let i = 0; i < 8; i++) {
    const v = values[i];
    const b = floatToI8Hex(v);
    const i8 = v < 0 ? Math.round(v * 127) : Math.round(v * 127);
    const name = DIPOLE_AXES[i].padEnd(20);
    const sign = v >= 0 ? "+" : "";
    console.log(
      `   ${i}      ${name}   ${b}    ${i8.toString().padStart(4)}   ${sign}${
        v.toFixed(3)
      }`,
    );
  }
}

async function printHelp(): Promise<void> {
  const pairs = await fn_load_dipole_pairs();
  const pairLines = Array.from(pairs.entries())
    .filter(([k]) => k >= "0" && k <= "7") // only first half of circle
    .map(([k, v]) => `  ${k} ↔ ${v}`)
    .join("\n");

  console.log(`chord_init — substrate-native chord skeleton generator

Subcommands:
  block                              Print current Bitcoin block height
  init --voice=N --topic=T           Draft any chord in the living lean form,
       [--type=observation|...]      canonical flat-src filename computed.
       [--primary=oct:N.M] [--write] --write lands it in src/; else prints (dry).
  receipt --voice=N --topic=T        Draft a receipt chord in the living lean
       [--primary=oct:N.M]           form, with the canonical flat-src filename
       [--closes=STEM] [--relation=R] computed for you. --write creates the file
       [--stance=S] [--write]        in src/; otherwise prints it (dry).
  claim --voice=N --horizon=H        Bind an open roadmap horizon to a voice —
       [--primary=oct:N.M] [--write] the write side of taking your turn.
  translate <axis> <value>           Convert human axis name + signed float
                                     to hex byte
  parse "<hex bytes>"                Convert 8-byte hex vector to human readings

Examples:
  deno run -A src/x4001_chord.ts block
  deno run -A src/x4001_chord.ts init --author=claude --topic="my topic"
  deno run -A src/x4001_chord.ts receipt --voice=claude --topic="x organ landed" \
    --closes=x4d00_950812_codex_some-proposal --write
  deno run -A src/x4001_chord.ts translate void_infinity +0.4
  deno run -A src/x4001_chord.ts parse "33 8E 59 40 00 26 4C 59"

Dipole axes (canonical order, byte positions 0..7):
${DIPOLE_AXES.map((n, i) => `  ${i}: ${n}`).join("\n")}

Dipole pairs (loaded from glossary src/x0001_glossary.ndjson):
${pairLines}

Lifecycle phases (trimmed to 3 for v0.1):
${LIFECYCLE_PHASES.map((n, i) => `  ${i}: ${n}`).join("\n")}
`);
}

async function main(): Promise<void> {
  const args = Deno.args;
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    return;
  }

  const cmd = args[0];
  const { positional, flags } = parseArgs(args.slice(1));

  switch (cmd) {
    case "block":
      await cmdBlock();
      break;
    case "init":
      await cmdInit(flags);
      break;
    case "receipt":
      await cmdReceipt(flags);
      break;
    case "claim":
      await cmdClaim(flags);
      break;
    case "translate":
      cmdTranslate(positional);
      break;
    case "parse":
      cmdParse(positional);
      break;
    default:
      console.error(`unknown subcommand: ${cmd}`);
      printHelp();
      Deno.exit(1);
  }
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(`error: ${e.message}`);
    Deno.exit(1);
  });
}
