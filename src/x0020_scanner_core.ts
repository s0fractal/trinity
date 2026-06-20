// src/x0020_scanner_core.ts — scanner_core / scanner / parser
// position: 0/02 → void(0) × mirror-pair(02) = void mirror scanning
// hex_dipole: "6C 00 00 00 00 00 00 00"
//   void_infinity+0.85 (PRIMARY)
// placement_policy: axis
// intent: scan files and build profile metadata
// maturity: active
// horizon: none (schema parsing extended for chords)
// skill_tag: scan
// skill_safe: yes
//

import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.224.0/path/join.ts";
import { parse as parseYaml } from "https://deno.land/std@0.224.0/yaml/mod.ts";
import { fqdnPrefix as calculateFqdnHash } from "./x4010_hash.ts";

export const REPOS = ["myc", "liquid", "omega", "trinity"];

export type ThoughtPhase =
  | "raw-fantasy"
  | "hypothesis"
  | "proposal"
  | "experiment"
  | "receipt"
  | "formula"
  | "crystal"
  | "compost";

export interface FileProfile {
  path: string;
  repo: string;
  isEntrypoint: boolean;
  L1_fqdn: boolean;
  L2_parseable: boolean;
  L3_schema_valid: boolean;
  L4a_hash_claimed: boolean;
  L4b_hash_verified: boolean;
  L5_graph_linked: boolean;
  L6_recipe: boolean;
  L7_receipt_backed: boolean;
  L8_published: boolean;
  thoughtPhase: ThoughtPhase;
}

const ENTRYPOINTS = new Set([
  "README.MD",
  "START_HERE.MD",
  "CONTRIBUTING.MD",
  "AGENTS.MD",
  "SKILLS.MD",
]);

export function isLiquidNeuron(content: string): boolean {
  return content.includes("Ξ ƒ[") && content.includes("λ\n") &&
    content.includes("Σ\n");
}

export function parseFrontmatter(content: string): Record<string, any> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    const doc = parseYaml(match[1]);
    return typeof doc === "object" ? (doc as Record<string, any>) : null;
  } catch {
    // Basic fallback parsing for broken yaml
    const res: Record<string, any> = {};
    for (const line of match[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        res[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }
    return res;
  }
}

export function hasJsonBlock(content: string): boolean {
  return content.includes("```json myc") || content.includes("```json");
}

const THOUGHT_PHASES: ThoughtPhase[] = [
  "raw-fantasy",
  "hypothesis",
  "proposal",
  "experiment",
  "receipt",
  "formula",
  "crystal",
  "compost",
];

/** A file is receipt-backed (L7) STRUCTURALLY: a receipt-typed chord
 *  (type/mode/stance), a content-addressed `*.receipt.*` object, or an actual
 *  executed-output block. A bare textual mention of `receipt:`/`signature:` — or a
 *  proposal's `receipt: "file"` policy field — must NOT count (mentions inflated the
 *  signal; audit 2026-06-20). */
export function structuralReceiptBacked(
  fm: Record<string, any> | null,
  filename: string,
  content: string,
): boolean {
  if (filename.includes(".receipt.")) return true;
  if (content.includes("------- output -------")) return true;
  if (!fm) return false;
  return String(fm.type ?? "").toLowerCase().includes("receipt") ||
    String(fm.mode ?? "").toLowerCase() === "receipt" ||
    String(fm.stance ?? "").toLowerCase() === "receipt";
}

/** Map a file's STRUCTURAL ontology profile (the L-ladder computed in analyzeFile)
 *  to a thought phase, per the L0→L8 mapping in x2C10_cognitive_thermodynamics.
 *
 *  This replaced a chain of fragile content-substring guesses (`includes("∀")`,
 *  `includes("receipt:")`, `includes("ƒ[")`, …) with the already-computed structural
 *  signals (refactor 2026-06-21). Two things the substring version got wrong:
 *    • every un-addressed `.md` collapsed to `hypothesis`, so `raw-fantasy` was
 *      structurally unreachable — now a plain markdown with no FQDN (L0) is honestly
 *      `raw-fantasy`, giving `hallucination_risk` a real numerator;
 *    • `receipt` matched any file MENTIONING the word — now it needs a STRUCTURAL
 *      receipt (L7).
 *  The most-advanced signal along the maturity cycle (raw → hypothesis → proposal →
 *  experiment → receipt → formula → crystal) wins; explicit `thought_phase:` and
 *  `compost` (off the active path) are decided first. */
export function classifyPhase(
  p: Pick<
    FileProfile,
    | "L1_fqdn"
    | "L2_parseable"
    | "L3_schema_valid"
    | "L4b_hash_verified"
    | "L5_graph_linked"
    | "L6_recipe"
    | "L7_receipt_backed"
    | "L8_published"
  >,
  fm: Record<string, any> | null,
): ThoughtPhase {
  // explicit author override wins.
  if (fm && typeof fm.thought_phase === "string") {
    const phase = fm.thought_phase.toLowerCase();
    if (THOUGHT_PHASES.includes(phase as ThoughtPhase)) {
      return phase as ThoughtPhase;
    }
  }
  const status = fm ? String(fm.status ?? "").toLowerCase() : "";
  // compost — explicitly off the active maturity path.
  if (["rejected", "superseded", "compost", "deprecated"].includes(status)) {
    return "compost";
  }
  // crystal — published, or a verified + graph-linked load-bearing object, or an
  // active/pinned contract.
  if (
    p.L8_published ||
    (p.L4b_hash_verified && p.L5_graph_linked) ||
    (fm && fm.type === "ContractDescriptor" &&
      (status === "active" || status === "pinned"))
  ) {
    return "crystal";
  }
  // formula — graph-linked compression / a declared invariant family.
  if (p.L5_graph_linked || (fm && fm.formula_kind)) return "formula";
  // receipt — structural receipt-backing, or a content-addressed (hash-verified) object.
  if (p.L7_receipt_backed || p.L4b_hash_verified) return "receipt";
  // experiment — a replayable recipe.
  if (p.L6_recipe) return "experiment";
  // proposal — schema-valid structure, or an explicit proposal descriptor.
  if (
    p.L3_schema_valid ||
    (fm &&
      (fm.type === "ProposalDescriptor" || fm.proposal_status ||
        status === "proposed"))
  ) {
    return "proposal";
  }
  // hypothesis — addressed / structured, but not yet validated.
  if (p.L1_fqdn || p.L2_parseable) return "hypothesis";
  // raw-fantasy — raw markdown, no ontological address (L0).
  return "raw-fantasy";
}

export async function analyzeFile(
  path: string,
  content: string,
  repo: string,
): Promise<FileProfile> {
  const filename = path.split("/").pop() || "";
  const isEntrypoint = ENTRYPOINTS.has(filename.toUpperCase());

  const profile: FileProfile = {
    path,
    repo,
    isEntrypoint,
    L1_fqdn: false,
    L2_parseable: false,
    L3_schema_valid: false,
    L4a_hash_claimed: false,
    L4b_hash_verified: false,
    L5_graph_linked: false,
    L6_recipe: false,
    L7_receipt_backed: false,
    L8_published: false,
    thoughtPhase: "hypothesis", // Default, populated below
  };

  if (isEntrypoint) return profile;

  if (filename.split(".").length > 2 || filename.endsWith(".myc.md")) {
    profile.L1_fqdn = true;
  }

  const fm = parseFrontmatter(content);
  const isLiquid = isLiquidNeuron(content);
  if (fm || isLiquid) profile.L2_parseable = true;

  if (isLiquid && content.includes("ρ:") && content.includes("Σ\n")) {
    profile.L3_schema_valid = true;
  } else if (fm) {
    const normalizedPath = path.replace(/\\/g, "/");
    const filename = normalizedPath.split("/").pop() ?? normalizedPath;
    const isChord = normalizedPath.includes("jazz/chords/") ||
      /^x[0-9A-Fa-f]{4}_(?:\d+|t\d{14})_[a-z0-9-]+_.+\.myc\.md$/.test(
        filename,
      );
    if (isChord) {
      const required = ["id", "speaker", "chord", "mode", "claim"];
      if (required.every((field) => field in fm)) {
        profile.L3_schema_valid = true;
      }
    } else if (hasJsonBlock(content)) {
      profile.L3_schema_valid = true;
    }
  }

  if (filename.startsWith("h.") || content.includes("0x")) {
    profile.L4a_hash_claimed = true;
    if (filename.startsWith("h.")) {
      const parts = filename.split(".");
      if (parts.length >= 2) {
        const claimedHash = parts[1];
        if (claimedHash.length === 12) {
          const computedHash = await calculateFqdnHash(content);
          if (computedHash === `h.${claimedHash}`) {
            profile.L4b_hash_verified = true;
          }
        }
      }
    }
  }

  if (content.includes("[[") && content.includes("]]")) {
    profile.L5_graph_linked = true;
  } else if (content.includes("⊚:")) {
    profile.L5_graph_linked = true;
  }

  if (
    filename.includes(".recipe.") || content.includes("ƒ[") ||
    content.includes('"type": "RecipeDescriptor"')
  ) {
    profile.L6_recipe = true;
  }

  if (structuralReceiptBacked(fm, filename, content)) {
    profile.L7_receipt_backed = true;
  }

  if (
    path.includes("myc/public/objects/") ||
    path.includes("myc/public/receipts/")
  ) {
    profile.L8_published = true;
  }

  profile.thoughtPhase = classifyPhase(profile, fm);

  return profile;
}

export async function scanEcosystem(cwd: string): Promise<FileProfile[]> {
  const profiles: FileProfile[] = [];

  for (const repo of REPOS) {
    const repoPath = repo === "trinity" ? cwd : join(cwd, repo);
    try {
      const walker = walk(repoPath, {
        exts: [".md"],
        skip: [
          /node_modules/,
          /\.git/,
          /\.liquid\/autobiography/,
          /\.liquid\/autogen/,
        ],
        includeDirs: false,
      });

      for await (const entry of walker) {
        if (
          repo === "trinity" &&
          (entry.path.includes("/myc/") || entry.path.includes("/liquid/") ||
            entry.path.includes("/omega/"))
        ) {
          continue;
        }

        const content = await Deno.readTextFile(entry.path);
        const profile = await analyzeFile(entry.path, content, repo);
        profiles.push(profile);
      }
    } catch (e: any) {
      console.error(`Error scanning ${repo}:`, e.message);
    }
  }

  return profiles;
}
