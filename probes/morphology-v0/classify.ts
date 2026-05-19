// classify.ts — lane + lifecycle classification from parsed morphology
//
// Lane := representation format (how to open the file).
// Lifecycle := persistence/regenerability category (when to trust, when to regenerate).
//
// Categories per Codex `x3500_950008_codex_src-as-semantic-address-space.md`:
//
//   lifecycle: authored | generated | checkpoint | sealed | archived
//   lane: organ | chord | state | receipt | proof | unknown

import { ParsedFilename } from "./parse.ts";

export type Lane = "organ" | "chord" | "state" | "receipt" | "proof" | "unknown";
export type Lifecycle =
  | "authored"
  | "generated"
  | "checkpoint"
  | "sealed"
  | "archived";

export interface Classification {
  lane: Lane;
  lifecycle: Lifecycle;
  rationale: string;
}

/** Lane classification from extension + lane suffix + coordinate hints. */
export function classifyLane(parsed: ParsedFilename): Lane {
  if (!parsed.is_morphology) return "unknown";

  // .receipt.* extension
  if (parsed.lane === "receipt") return "receipt";
  if (parsed.lane === "proof") return "proof";

  // .myc.<ext>
  if (parsed.lane === "myc") {
    if (parsed.ext === "md") {
      // chord OR generated state OR neuron — disambiguate by coordinate
      if (parsed.coordinate.endsWith("888")) return "state";
      // mined neurons have hex_prefix anchor
      if (parsed.anchor_kind === "hex_prefix") return "chord"; // or "neuron" — treated as chord-like artifact
      // chord with voice anchor and block height
      if (parsed.anchor_kind === "voice" || parsed.anchor_kind === "block_height") return "chord";
      // fallback for unannotated .myc.md
      return "chord";
    }
    if (parsed.ext === "json") return "state";
  }

  // Plain .ts
  if (parsed.ext === "ts") return "organ";

  return "unknown";
}

/** Lifecycle classification from coordinate + lane + extension. */
export function classifyLifecycle(parsed: ParsedFilename, lane: Lane, archivePathHint = false): Lifecycle {
  if (archivePathHint) return "archived";
  if (!parsed.is_morphology) return "authored"; // best guess
  // x?888 / x8888 — generated state cache
  if (parsed.coordinate.endsWith("888") || parsed.coordinate === "8888") return "generated";
  // receipt lane
  if (lane === "receipt" || lane === "proof") return "sealed";
  // state files (.myc.json) — likely checkpoint
  if (lane === "state" && parsed.ext === "json") return "checkpoint";
  // chord / organ — authored unless otherwise
  return "authored";
}

export function classify(parsed: ParsedFilename, archivePathHint = false): Classification {
  const lane = classifyLane(parsed);
  const lifecycle = classifyLifecycle(parsed, lane, archivePathHint);

  let rationale = "";
  if (!parsed.is_morphology) {
    rationale = "filename did not match morphology — defaulted";
  } else if (archivePathHint) {
    rationale = `archive path → archived (lane=${lane})`;
  } else if (parsed.coordinate.endsWith("888") || parsed.coordinate === "8888") {
    rationale = `coordinate ends in 888 → generated state cache (lane=${lane})`;
  } else if (parsed.lane === "receipt" || parsed.lane === "proof") {
    rationale = `${parsed.lane} lane → sealed`;
  } else if (parsed.lane === "myc" && parsed.ext === "json") {
    rationale = "myc.json → checkpoint";
  } else if (parsed.ext === "ts") {
    rationale = "plain .ts → authored organ";
  } else {
    rationale = `lane=${lane}, default lifecycle=authored`;
  }

  return { lane, lifecycle, rationale };
}
