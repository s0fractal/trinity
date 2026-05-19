#!/usr/bin/env -S deno run --allow-read
// src/x3C00_recipes.ts — recipes / workflows / templates / sequences
// position: 3/C → triangle(3) × container-pair(C) = composition-templates
// hex_dipole: "19 00 40 66 33 40 40 33"
//   triangle_build+0.80 (PRIMARY: composition of steps)
//   mirror_apex+0.50 (reflects workflow patterns)
//   action_decision+0.50 (recipes ARE about doing)
//   harmony_emergence+0.50 (ordered sequence)
//   foundation_container+0.40 (template container)
//   completion_frontier+0.40 (recipe terminates in receipt)
//   void_infinity+0.20 (template skeleton)
//   bucket 3/C: axis 3 (triangle) primary ← MATCH
//               'C' = axis 4 pair-pole, dipole +0.40 on axis 4
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 0
// placement_policy: axis
// intent: surface kind:8 recipe records from glossary as queryable workflow templates
// maturity: active
// horizon: cross-link recipes to gravity-flagged drift signals (recipe-as-remediation)
//
// recipes — live projection of workflow templates from ledger records.
//
// Reads kind:8 records from src/x0001_glossary.ndjson. This replaces the old
// deleted capabilities registry dependency; recipes
// are now compact ledger projections, not a separate capabilities registry.
//
// Workflow templates are NOT contracts (contracts = stabilized
// schemas) and NOT capabilities (capabilities = what t can do
// atomically). They're TEMPLATES — "if you want X, here's a sequence
// of capabilities that achieves it".
//
// Subcommands:
//   t recipes                   table of recipe templates
//   t recipes --json            machine output
//   t recipes show <id>         detail + steps for one recipe
//
// Glossary words: recipes, workflows, templates, sequences,
//                 рецепти, потоки-роботи, шаблони, послідовності

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const GLOSSARY_PATH = join(ROOT, "src", "x0001_glossary.ndjson");

interface Recipe {
  id: string;
  purpose: string;
  steps: string[];
  receipt: string;
}

async function loadRecipes(): Promise<Recipe[]> {
  const recipes: Recipe[] = [];
  const text = await Deno.readTextFile(GLOSSARY_PATH);
  for (const line of text.trim().split("\n")) {
    try {
      const r = JSON.parse(line);
      if (r["00"] !== "8") continue;
      recipes.push({
        id: String(r["01"] ?? ""),
        purpose: String(r["09"] ?? ""),
        steps: Array.isArray(r["05"]) ? r["05"].map(String) : [],
        receipt: String(r["06"] ?? ""),
      });
    } catch { /* skip malformed non-recipe lines */ }
  }
  return recipes;
}

function renderTable(recipes: Recipe[]): void {
  console.log("# recipes @ 3/C — workflow templates (live projection)");
  console.log("# " + "─".repeat(80));
  console.log(`# ${recipes.length} recipes known`);
  console.log("");
  for (const r of recipes) {
    const id = r.id.replace(/^recipe\./, "");
    console.log(`# ${id}`);
    console.log(`#   purpose:  ${r.purpose}`);
    console.log(`#   steps:    ${r.steps.length}`);
    if (r.receipt) console.log(`#   receipt:  ${r.receipt}`);
    console.log("");
  }
  console.log("# " + "─".repeat(80));
  console.log("# source: src/x0001_glossary.ndjson kind:8 recipe records");
  console.log("# show details: t recipes show <recipe-id-suffix>");
}

function renderDetail(r: Recipe): void {
  console.log(`# recipe: ${r.id}`);
  console.log("# " + "─".repeat(70));
  console.log(`# purpose: ${r.purpose}`);
  if (r.receipt) console.log(`# receipt: ${r.receipt}`);
  console.log("");
  console.log("# steps (composition sequence):");
  for (let i = 0; i < r.steps.length; i++) {
    console.log(`#   ${(i + 1).toString().padStart(2)}. ${r.steps[i]}`);
  }
  console.log("");
  console.log("# Note: step IDs use legacy 'trinity.X.Y' format.");
  console.log("# In future record-graph form, these become t <word> calls.");
}

if (import.meta.main) {
  const args = Deno.args;
  const wantJson = args.includes("--json");
  const recipes = await loadRecipes();

  if (args[0] === "show" && args[1]) {
    const target = args[1].toLowerCase();
    const r = recipes.find((r) =>
      r.id.toLowerCase().includes(target)
    );
    if (!r) {
      console.log(JSON.stringify({ type: "error", message: `unknown recipe: ${args[1]}` }));
      Deno.exit(1);
    }
    if (wantJson) {
      console.log(JSON.stringify(r, null, 2));
    } else {
      renderDetail(r);
    }
    Deno.exit(0);
  }

  const receipt = {
    type: "recipes",
    position: "3/C",
    action: "list",
    note: "triangle+container-pair = workflow composition templates",
    source: "src/x0001_glossary.ndjson kind:8 recipe records",
    summary: {
      total: recipes.length,
    },
    recipes,
    synonyms: ["recipes", "workflows", "templates", "sequences", "рецепти", "потоки-роботи", "шаблони", "послідовності"],
    topology: "live projection from ledger records; templates compose existing t/workflow steps into sequences",
  };

  if (wantJson) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    renderTable(recipes);
  }
}
