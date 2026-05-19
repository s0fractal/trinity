// parse.ts — substrate filename morphology parser
//
// Reads a filename and returns its structured parts. The morphology
// proposed by Codex 2026-05-19 (x3500_950009):
//
//   x<coord>_<anchor?>_<handle>.<lane>.<ext>
//
// Examples this should handle:
//
//   x0010_runner.ts                                  → organ
//   x3500_950008_codex_src-as-address-space.myc.md   → proposal chord
//   xA3F2_neuron.myc.md                              → mined neuron
//   x6888_state.myc.md                               → generated bucket state
//   x8888_agents.myc.md                              → substrate index
//   x7500_950200_claude_migration.myc.md             → receipt
//
// The anchor slot is optional and weakly-typed. Three shapes are recognized:
//   - decimal block height (≥ 5 digits, all digits): "950008"
//   - hex content-check-prefix (exactly 3 hex chars): "3F2"
//   - voice/session token (alphanumeric, NOT pure digits, NOT 3-hex): "codex", "ant42a"
//
// If the morphology has multiple `_` parts after the coordinate, the parser
// is liberal: the first segment that LOOKS like an anchor is treated as such;
// remaining segments collapse into the handle.

export type AnchorKind = "block_height" | "hex_prefix" | "voice" | null;

export interface ParsedFilename {
  raw: string;
  prefix: string; // "x"
  coordinate: string; // "0010" / "3500" / "A3F2"
  archetype: string; // first hex of coordinate
  anchor: string | null;
  anchor_kind: AnchorKind;
  handle: string;
  lane: string | null; // "myc" if name is "*.myc.<ext>"; null otherwise
  ext: string; // "ts" / "md" / "json"
  is_morphology: boolean; // false if filename did NOT match the morphology pattern
  error?: string;
}

const BASE_RE = /^x([0-9A-Fa-f]{4})_(.+?)\.([^.]+)$/;
const LANE_RE = /^(.+)\.(myc|receipt|proof)$/;
const HEX_PREFIX_RE = /^[0-9A-Fa-f]{3}$/;
const BLOCK_HEIGHT_RE = /^[0-9]{5,8}$/;
const VOICE_RE = /^[a-zA-Z][a-zA-Z0-9-]+$/;

export function parseFilename(filename: string): ParsedFilename {
  const base = BASE_RE.exec(filename);
  if (!base) {
    return {
      raw: filename,
      prefix: "",
      coordinate: "",
      archetype: "",
      anchor: null,
      anchor_kind: null,
      handle: "",
      lane: null,
      ext: "",
      is_morphology: false,
      error: "does not match x<4-hex>_<rest>.<ext>",
    };
  }
  const [, coord, restWithExt, ext] = base;

  // Separate lane suffix from inner-rest:
  //   "state.myc"      → restCore="state", lane="myc"
  //   "950008_codex_topic.myc" → restCore="950008_codex_topic", lane="myc"
  //   "runner"          → restCore="runner", lane=null
  let restCore = restWithExt;
  let lane: string | null = null;
  const laneMatch = LANE_RE.exec(restWithExt);
  if (laneMatch) {
    restCore = laneMatch[1];
    lane = laneMatch[2];
  }

  // Inside restCore: leading anchor? followed by handle.
  // Anchor parsing rules (probe v0):
  //   - hex_prefix anchor (3 hex chars) is recognized standalone
  //   - block_height anchor (5-8 digits) is recognized standalone
  //   - voice anchor is ONLY recognized when it follows a block_height
  //     (i.e., chord pattern x<coord>_<block>_<voice>_<topic>)
  //     A single voice-shaped segment is treated as part of handle to
  //     avoid splitting words like "test_neuron" → anchor="test".
  let anchor: string | null = null;
  let anchorKind: AnchorKind = null;
  let handle = restCore;

  const underscore = restCore.indexOf("_");
  if (underscore !== -1) {
    const candidate = restCore.slice(0, underscore);
    const rest = restCore.slice(underscore + 1);
    if (HEX_PREFIX_RE.test(candidate)) {
      anchor = candidate;
      anchorKind = "hex_prefix";
      handle = rest;
    } else if (BLOCK_HEIGHT_RE.test(candidate)) {
      anchor = candidate;
      anchorKind = "block_height";
      handle = rest;
      // For chord pattern, voice is the SECOND segment after block_height.
      // Probe v0 doesn't normalize it separately — handle stays as "voice_topic-slug".
      // A consumer can post-parse handle if needed.
    }
    // else: candidate is voice-shaped or freeform — leave as part of handle
  }

  return {
    raw: filename,
    prefix: "x",
    coordinate: coord.toUpperCase(),
    archetype: coord[0].toUpperCase(),
    anchor,
    anchor_kind: anchorKind,
    handle,
    lane,
    ext,
    is_morphology: true,
  };
}
