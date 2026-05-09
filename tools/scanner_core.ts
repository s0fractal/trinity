import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.224.0/path/join.ts";
import { parse as parseYaml } from "https://deno.land/std@0.224.0/yaml/mod.ts";
import { calculateFqdnHash } from "../liquid/00_core/liquid_codec.ts";

export const REPOS = ["myc", "liquid", "omega", "trinity"];

export type ThoughtPhase = "raw-fantasy" | "hypothesis" | "proposal" | "experiment" | "receipt" | "formula" | "crystal" | "compost";

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

const ENTRYPOINTS = new Set(["README.MD", "START_HERE.MD", "CONTRIBUTING.MD", "AGENTS.MD", "TRINITY.MD"]);

export function isLiquidNeuron(content: string): boolean {
  return content.includes("Ξ ƒ[") && content.includes("λ\n") && content.includes("Σ\n");
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

export function classifyPhase(path: string, content: string, fm: Record<string, any> | null, isHashVerified: boolean): ThoughtPhase {
  const filename = path.split("/").pop() || "";
  const isPublished = path.includes("/myc/public/objects/");

  if (fm && typeof fm.thought_phase === "string") {
    const p = fm.thought_phase.toLowerCase();
    if (["raw-fantasy", "hypothesis", "proposal", "experiment", "receipt", "formula", "crystal", "compost"].includes(p)) {
      return p as ThoughtPhase;
    }
  }

  if (content.includes("receipt:") || content.includes("signature:") || content.includes("------- output -------")) {
    return "receipt";
  }

  if ((fm && fm.type === "RecipeDescriptor") || content.includes("ƒ[") || filename.includes(".recipe.")) {
    return "experiment";
  }

  if ((fm && fm.formula_kind) || content.includes("invariant") || content.includes("∀") || content.includes("∈")) {
    return "formula";
  }

  if (fm && fm.type === "DecisionDescriptor" && (fm.status === "rejected" || fm.status === "superseded" || fm.status === "compost")) {
    return "compost";
  }

  if (isHashVerified && isPublished) {
    return "crystal";
  }

  if (path.includes("/intake/raw/")) {
    return "raw-fantasy";
  }

  if (fm && (fm.type === "ProposalDescriptor" || fm.proposal_status || fm.status === "proposed")) {
    return "proposal";
  }

  return "hypothesis";
}

export async function analyzeFile(path: string, content: string, repo: string): Promise<FileProfile> {
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

  if (filename.split(".").length > 2 || filename.endsWith(".myc.md")) profile.L1_fqdn = true;

  const fm = parseFrontmatter(content);
  const isLiquid = isLiquidNeuron(content);
  if (fm || isLiquid) profile.L2_parseable = true;

  if (isLiquid && content.includes("ρ:") && content.includes("Σ\n")) {
    profile.L3_schema_valid = true;
  } else if (fm && hasJsonBlock(content)) {
    profile.L3_schema_valid = true;
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

  if (filename.includes(".recipe.") || content.includes("ƒ[") || content.includes('"type": "RecipeDescriptor"')) {
    profile.L6_recipe = true;
  }

  if ((fm && fm["receipt"]) || content.includes("receipt:") || content.includes("signature:")) {
    profile.L7_receipt_backed = true;
  }

  if (path.includes("myc/public/objects/") || path.includes("myc/public/receipts/")) {
    profile.L8_published = true;
  }

  profile.thoughtPhase = classifyPhase(path, content, fm, profile.L4b_hash_verified);

  return profile;
}

export async function scanEcosystem(cwd: string): Promise<FileProfile[]> {
  const profiles: FileProfile[] = [];

  for (const repo of REPOS) {
    const repoPath = repo === "trinity" ? cwd : join(cwd, repo);
    try {
      const walker = walk(repoPath, {
        exts: [".md"],
        skip: [/node_modules/, /\.git/, /\.liquid\/autobiography/, /\.liquid\/autogen/],
        includeDirs: false,
      });

      for await (const entry of walker) {
        if (repo === "trinity" && (entry.path.includes("/myc/") || entry.path.includes("/liquid/") || entry.path.includes("/omega/"))) {
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
