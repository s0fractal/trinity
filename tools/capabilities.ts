const REGISTRY_PATH = "capabilities/trinity.capabilities.v0.1.json";

interface Capability {
  id: string;
  owner: string;
  phase: string;
  kind: string;
  command: string;
  reads: string[];
  writes: string[];
  side_effects: string[];
  receipt: string;
  composes_with: string[];
}

interface Recipe {
  id: string;
  purpose: string;
  steps: string[];
  receipt: string;
}

interface Registry {
  type: string;
  version: string;
  status: string;
  capabilities: Capability[];
  recipes: Recipe[];
}

function usage(): string {
  return [
    "Usage:",
    "  deno task capabilities",
    "  deno task capabilities -- validate",
    "  deno task capabilities -- list [owner]",
    "  deno task capabilities -- show <capability-id>",
    "  deno task capabilities -- recipe <recipe-id>",
  ].join("\n");
}

async function readRegistry(): Promise<Registry> {
  return JSON.parse(await Deno.readTextFile(REGISTRY_PATH));
}

function validateRegistry(registry: Registry): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (registry.type !== "TrinityCapabilityRegistry") {
    errors.push(`type must be TrinityCapabilityRegistry`);
  }

  for (const cap of registry.capabilities ?? []) {
    if (!cap.id) errors.push("capability missing id");
    if (ids.has(cap.id)) errors.push(`duplicate capability id: ${cap.id}`);
    ids.add(cap.id);

    for (
      const key of [
        "owner",
        "phase",
        "kind",
        "command",
        "receipt",
      ] as const
    ) {
      if (!cap[key]) errors.push(`${cap.id}: missing ${key}`);
    }

    for (
      const key of [
        "reads",
        "writes",
        "side_effects",
        "composes_with",
      ] as const
    ) {
      if (!Array.isArray(cap[key])) {
        errors.push(`${cap.id}: ${key} must be array`);
      }
    }
  }

  for (const recipe of registry.recipes ?? []) {
    if (!recipe.id) errors.push("recipe missing id");
    for (const step of recipe.steps ?? []) {
      if (!ids.has(step)) {
        errors.push(`${recipe.id}: unknown step capability ${step}`);
      }
    }
  }

  return errors;
}

function listCapabilities(registry: Registry, owner?: string): void {
  const caps = owner
    ? registry.capabilities.filter((cap) => cap.owner === owner)
    : registry.capabilities;
  for (const cap of caps) {
    console.log(
      `${cap.id.padEnd(38)} ${cap.owner.padEnd(8)} ${
        cap.kind.padEnd(11)
      } ${cap.phase}`,
    );
  }
}

function showCapability(registry: Registry, id: string): void {
  const cap = registry.capabilities.find((item) => item.id === id);
  if (!cap) {
    console.error(`unknown capability: ${id}`);
    Deno.exit(1);
  }
  console.log(JSON.stringify(cap, null, 2));
}

function showRecipe(registry: Registry, id: string): void {
  const recipe = registry.recipes.find((item) => item.id === id);
  if (!recipe) {
    console.error(`unknown recipe: ${id}`);
    Deno.exit(1);
  }

  const byId = new Map(registry.capabilities.map((cap) => [cap.id, cap]));
  console.log(`# ${recipe.id}`);
  console.log(recipe.purpose);
  console.log("");
  for (const [index, step] of recipe.steps.entries()) {
    const cap = byId.get(step);
    console.log(`${index + 1}. ${step}`);
    console.log(`   ${cap?.command ?? "(missing capability)"}`);
  }
  console.log("");
  console.log(`receipt: ${recipe.receipt}`);
}

async function main() {
  const registry = await readRegistry();
  const args = Deno.args[0] === "--" ? Deno.args.slice(1) : Deno.args;
  const command = args[0] ?? "list";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(usage());
    return;
  }

  if (command === "validate") {
    const errors = validateRegistry(registry);
    if (errors.length > 0) {
      console.error(errors.join("\n"));
      Deno.exit(1);
    }
    console.log(
      `ok: ${registry.capabilities.length} capabilities, ${registry.recipes.length} recipes`,
    );
    return;
  }

  if (command === "list") {
    listCapabilities(registry, args[1]);
    return;
  }

  if (command === "show") {
    const id = args[1];
    if (!id) {
      console.error("show requires a capability id");
      Deno.exit(1);
    }
    showCapability(registry, id);
    return;
  }

  if (command === "recipe") {
    const id = args[1];
    if (!id) {
      console.error("recipe requires a recipe id");
      Deno.exit(1);
    }
    showRecipe(registry, id);
    return;
  }

  console.error(`unknown command: ${command}`);
  console.error(usage());
  Deno.exit(1);
}

main();
