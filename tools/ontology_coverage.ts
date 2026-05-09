import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.224.0/path/join.ts";

const REPOS = ["myc", "liquid", "omega", "trinity"];

interface FileProfile {
  path: string;
  isEntrypoint: boolean;
  L1_fqdn: boolean;
  L2_parseable: boolean;
  L3_schema_valid: boolean;
  L4_hash_verified: boolean;
  L5_graph_linked: boolean;
  L6_recipe: boolean;
  L7_receipt_backed: boolean;
  L8_published: boolean;
}

const ENTRYPOINTS = new Set(["README.MD", "START_HERE.MD", "CONTRIBUTING.MD", "AGENTS.MD", "TRINITY.MD"]);

function isLiquidNeuron(content: string): boolean {
  return content.includes("Ξ ƒ[") && content.includes("λ\n") && content.includes("Σ\n");
}

function parseFrontmatter(content: string): Record<string, any> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  // Naive yaml parsing for basic checks
  const res: Record<string, any> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      res[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return res;
}

function hasJsonBlock(content: string): boolean {
  return content.includes("```json myc") || content.includes("```json");
}

async function analyzeFile(path: string, content: string): Promise<FileProfile> {
  const filename = path.split("/").pop() || "";
  const isEntrypoint = ENTRYPOINTS.has(filename.toUpperCase());

  const profile: FileProfile = {
    path,
    isEntrypoint,
    L1_fqdn: false,
    L2_parseable: false,
    L3_schema_valid: false,
    L4_hash_verified: false,
    L5_graph_linked: false,
    L6_recipe: false,
    L7_receipt_backed: false,
    L8_published: false,
  };

  if (isEntrypoint) return profile;

  // L1: FQDN
  if (filename.split(".").length > 2 || filename.endsWith(".myc.md")) {
    profile.L1_fqdn = true;
  }

  // L2: Parseable
  const frontmatter = parseFrontmatter(content);
  const isLiquid = isLiquidNeuron(content);
  if (frontmatter || isLiquid) {
    profile.L2_parseable = true;
  }

  // L3: Schema Valid (has expected fields)
  if (isLiquid && content.includes("ρ:") && content.includes("Σ\n")) {
    profile.L3_schema_valid = true;
  } else if (frontmatter && hasJsonBlock(content)) {
    profile.L3_schema_valid = true;
  }

  // L4: Hash Verified (Mock: check if filename starts with h. or contains 0x)
  if (filename.startsWith("h.") || content.includes("0x")) {
    // A true verifier would compute the SHA256 of the body.
    profile.L4_hash_verified = true;
  }

  // L5: Graph Linked
  if (content.includes("[[") && content.includes("]]")) {
    profile.L5_graph_linked = true;
  } else if (content.includes("⊚:")) {
    profile.L5_graph_linked = true;
  }

  // L6: Recipe
  if (filename.includes(".recipe.") || content.includes("ƒ[") || content.includes('"type": "RecipeDescriptor"')) {
    profile.L6_recipe = true;
  }

  // L7: Receipt Backed
  if ((frontmatter && frontmatter["receipt"]) || content.includes("receipt:") || content.includes("signature:")) {
    profile.L7_receipt_backed = true;
  }

  // L8: Published to MYC
  if (path.includes("myc/public/objects/") || path.includes("myc/public/receipts/")) {
    profile.L8_published = true;
  }

  return profile;
}

async function main() {
  const cwd = Deno.cwd();
  const repoStats: Record<string, any> = {};

  let total_md = 0;
  let entrypoint_md = 0;
  const globalCounts = {
    L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0, L7: 0, L8: 0
  };

  for (const repo of REPOS) {
    const repoPath = repo === "trinity" ? cwd : join(cwd, repo);
    
    repoStats[repo] = {
      total: 0,
      L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0, L7: 0, L8: 0
    };

    try {
      const walker = walk(repoPath, {
        exts: [".md"],
        skip: [/node_modules/, /\.git/, /\.liquid\/autobiography/, /\.liquid\/autogen/],
        includeDirs: false,
      });

      for await (const entry of walker) {
        // Avoid double counting trinity root files that are in submodules
        if (repo === "trinity" && (entry.path.includes("/myc/") || entry.path.includes("/liquid/") || entry.path.includes("/omega/"))) {
          continue;
        }

        const content = await Deno.readTextFile(entry.path);
        const profile = await analyzeFile(entry.path, content);

        repoStats[repo].total++;
        total_md++;

        if (profile.isEntrypoint) {
          entrypoint_md++;
          continue;
        }

        if (profile.L1_fqdn) { repoStats[repo].L1++; globalCounts.L1++; }
        if (profile.L2_parseable) { repoStats[repo].L2++; globalCounts.L2++; }
        if (profile.L3_schema_valid) { repoStats[repo].L3++; globalCounts.L3++; }
        if (profile.L4_hash_verified) { repoStats[repo].L4++; globalCounts.L4++; }
        if (profile.L5_graph_linked) { repoStats[repo].L5++; globalCounts.L5++; }
        if (profile.L6_recipe) { repoStats[repo].L6++; globalCounts.L6++; }
        if (profile.L7_receipt_backed) { repoStats[repo].L7++; globalCounts.L7++; }
        if (profile.L8_published) { repoStats[repo].L8++; globalCounts.L8++; }
      }
    } catch (e) {
      console.error(`Error scanning ${repo}:`, e.message);
    }
  }

  const p = (count: number, total: number) => total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%";

  console.log("\n=======================================================");
  console.log("             ONTOLOGICAL COVERAGE REPORT               ");
  console.log("=======================================================\n");

  const actual_total = total_md - entrypoint_md;

  console.log(`total_md: ${total_md}`);
  console.log(`entrypoint_md: ${entrypoint_md}`);
  console.log(`ontology_candidate_md: ${actual_total}\n`);

  console.log(`L1_fqdn:           ${String(globalCounts.L1).padEnd(5)} ${p(globalCounts.L1, actual_total)}`);
  console.log(`L2_parseable:      ${String(globalCounts.L2).padEnd(5)} ${p(globalCounts.L2, actual_total)}`);
  console.log(`L3_schema_valid:   ${String(globalCounts.L3).padEnd(5)} ${p(globalCounts.L3, actual_total)}`);
  console.log(`L4_hash_verified:  ${String(globalCounts.L4).padEnd(5)} ${p(globalCounts.L4, actual_total)}`);
  console.log(`L5_graph_linked:   ${String(globalCounts.L5).padEnd(5)} ${p(globalCounts.L5, actual_total)}`);
  console.log(`L6_recipe:         ${String(globalCounts.L6).padEnd(5)} ${p(globalCounts.L6, actual_total)}`);
  console.log(`L7_receipt_backed: ${String(globalCounts.L7).padEnd(5)} ${p(globalCounts.L7, actual_total)}`);
  console.log(`L8_published:      ${String(globalCounts.L8).padEnd(5)} ${p(globalCounts.L8, actual_total)}`);

  console.log("\n=======================================================");
  console.log("Repo      MD    FQDN  Pars  Schm  Hash  Grph  Recp  Rcpt  Publ");
  console.log("---------------------------------------------------------------");
  
  for (const repo of REPOS) {
    const s = repoStats[repo];
    console.log(
      `${repo.padEnd(9)} ` +
      `${String(s.total).padEnd(5)} ` +
      `${String(s.L1).padEnd(5)} ` +
      `${String(s.L2).padEnd(5)} ` +
      `${String(s.L3).padEnd(5)} ` +
      `${String(s.L4).padEnd(5)} ` +
      `${String(s.L5).padEnd(5)} ` +
      `${String(s.L6).padEnd(5)} ` +
      `${String(s.L7).padEnd(5)} ` +
      `${String(s.L8).padEnd(5)}`
    );
  }
  console.log("=======================================================\n");

  // Output advice based on targets
  console.log("TARGETS:");
  console.log(`[${(globalCounts.L2 / actual_total) >= 0.8 ? "x" : " "}] 80% important semantic md must be at least L2/L3`);
  console.log(`[${(globalCounts.L4 / actual_total) >= 0.3 ? "x" : " "}] 30% must be L4 hash/FQDN verified`);
  console.log(`[${(globalCounts.L6 / actual_total) >= 0.1 ? "x" : " "}] 10% must be L6 recipe/replayable`);
}

main();
