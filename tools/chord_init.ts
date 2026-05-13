#!/usr/bin/env -S deno run --allow-net --allow-env
/**
 * chord_init
 *
 * Substrate-native chord skeleton generator.
 *
 * Replaces ad-hoc timestamping with Bitcoin block anchoring.
 * Provides dipole vocabulary translation (human axis names ↔ hex bytes).
 * Outputs canonical YAML frontmatter for new chord files.
 *
 * Subcommands:
 *   block                          Print current Bitcoin block height
 *   init [opts]                    Print chord skeleton (frontmatter + body)
 *   translate <axis> <value>       Convert human axis name + signed value
 *                                  to hex byte (e.g., translate void_infinity +0.4)
 *   parse "<hex bytes>"            Convert 8-byte hex vector to human readings
 *
 * Init options:
 *   --author=NAME         Author identity (default: anonymous)
 *   --topic="SLUG"        Topic slug (default: untitled)
 *   --octet=oct:N.M       Chord primary octet (default: oct:7.0)
 *   --claim-kind=KIND     Claim kind (default: observation)
 *
 * Examples:
 *   deno run -A tools/chord_init.ts block
 *   deno run -A tools/chord_init.ts init --author=claude --topic=test
 *   deno run -A tools/chord_init.ts translate void_infinity +0.4
 *   deno run -A tools/chord_init.ts parse "33 8E 59 40 00 26 4C 59"
 *
 * Substrate alignment:
 *   - Bitcoin anchor: Φ-Manifest Invariant 3 (omega/docs/PHI_MANIFEST.md)
 *   - Dipole axes: HEX_DIPOLE_SEED.v0.draft.md
 *   - Lifecycle phases: LIFECYCLE_SEED.v0.draft.md
 *   - Chord schema: CHORD_CLAIM.v0.1.md
 *
 * Notes:
 *   - Dipole vocabulary is hardcoded here for PoC. Later: parse from
 *     contracts/HEX_DIPOLE_SEED.v0.draft.md as single source of truth.
 *   - Identity verification: soft (trust-based) for v0.0. Path to
 *     hard (Ed25519): liquid/00_core/node_identity.ts.
 */

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

// Lifecycle phases from LIFECYCLE_SEED.v0.draft.md
const LIFECYCLE_PHASES = [
  "seed", // 0 = oct:0 EXISTENCE
  "growth", // 1 = oct:3 UNION
  "maturity", // 2 = oct:5 EXCHANGE
  "reproduction", // 3 = oct:7 TRANSCENDENCE
  "compost", // 4 = oct:6 ORDER
] as const;

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

/** Format 8 signed floats as space-separated hex bytes. */
function formatDipoleVector(values: number[]): string {
  if (values.length !== 8) {
    throw new Error(`need 8 values, got ${values.length}`);
  }
  return values.map(floatToI8Hex).join(" ");
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

async function cmdBlock(): Promise<void> {
  const h = await fetchBtcBlock();
  console.log(h);
}

async function cmdInit(flags: Record<string, string>): Promise<void> {
  const block = await fetchBtcBlock();
  const author = flags.author ?? "anonymous";
  const topic = chordSlug(flags.topic ?? "untitled");
  const octet = flags.octet ?? "oct:7.0";
  const claimKind = flags["claim-kind"] ?? "observation";

  // Neutral vector as starting point: 8 bytes of 0x00
  const neutralVector = formatDipoleVector(new Array(8).fill(0));

  const skeleton = `---
# Substrate-native anchoring (timestamps deprecated; transitional id below):
anchor_block: ${block}
author_identity: "${author}"
identity_verification: "soft"
id: btc${block}-${author}-${topic}

# Semantic vector (8 i8 hex bytes, dipole axes 0↔8 .. 7↔F):
self_dipole_position: "${neutralVector}"

# Lifecycle (numeric primary, name transitional):
self_lifecycle:
  phase: 0           # 0=seed 1=growth 2=maturity 3=reproduction 4=compost
  spiral_depth: 0
  q_phase: 4         # subnet/chord-level subjective scale

# Existing chord schema fields (kept for backward compat with chord_play.ts):
topic: ${topic}
chord:
  primary: "${octet}"
  secondary: []
energy_hex256: "0x80"      # 50% intensity
stake_q16: 0
mode_position: "hex:E"     # EXPLORATION (replace with chosen)
mode_vector: "hex:0"       # toward existence (replace with chosen)
tension: "fill-this-in-machine-readable"
confidence_hex16: "hex:8"  # medium
receipt: "file"
actor: "${author}"
claim_kind: "${claimKind}"
claim_kind_position: "hex:1"
hears: []
claim:
  summary: |
    [write claim summary here]
falsifiers:
  - "[falsifier 1]"
suggested_commands: []
expected_after_running: {}
---

# [Chord title]

[body]

— ${author}, anchor block ${block}.
`;
  console.log(skeleton);
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
    console.error("usage: parse \"<hex bytes>\"");
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

function printHelp(): void {
  console.log(`chord_init — substrate-native chord skeleton generator

Subcommands:
  block                              Print current Bitcoin block height
  init [--author=N] [--topic=T]      Print chord skeleton (frontmatter + body)
       [--octet=oct:N.M]
       [--claim-kind=KIND]
  translate <axis> <value>           Convert human axis name + signed float
                                     to hex byte
  parse "<hex bytes>"                Convert 8-byte hex vector to human readings

Examples:
  deno run -A tools/chord_init.ts block
  deno run -A tools/chord_init.ts init --author=claude --topic="my topic"
  deno run -A tools/chord_init.ts translate void_infinity +0.4
  deno run -A tools/chord_init.ts parse "33 8E 59 40 00 26 4C 59"

Dipole axes (canonical order, byte positions 0..7):
${DIPOLE_AXES.map((n, i) => `  ${i}: ${n}`).join("\n")}

Lifecycle phases (numeric IDs):
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
