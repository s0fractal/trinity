import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  fieldWallViolations,
  type ModuleImports,
} from "./x6C20_guards_drill.ts";

// Wall I-11 (ChronoFlux-IEL x3300_956647), enforced on the REAL tree: a module
// marked FIELD-DIAGNOSTIC (♡/H/q/θ / weather) may be imported only by declared
// diagnostic consumers. Tests are structurally not authority surfaces, so they are
// allowlisted; ANY non-test module that imports a field module is flagged as a
// potential steering leak — the field becoming an input to a decision. The guard
// exists BEFORE the ChronoFlux model, so the model can never land as a controller.
Deno.test("wall I-11 — no non-diagnostic module reads a field-diagnostic module", () => {
  const modules: ModuleImports[] = [];
  const fieldModules = new Set<string>();
  for (const entry of Deno.readDirSync("src")) {
    if (!entry.name.endsWith(".ts")) continue;
    const name = entry.name.replace(/\.ts$/, "");
    const text = Deno.readTextFileSync(`src/${entry.name}`);
    if (text.includes("WALL-I-11: FIELD-DIAGNOSTIC")) fieldModules.add(name);
    const imports = [
      ...text.matchAll(
        /from\s+["']\.\/(x[0-9A-Fa-f]{4}_[A-Za-z0-9_]+)\.ts["']/g,
      ),
    ].map((m) => m[1]);
    modules.push({ name, imports });
  }
  assert(
    fieldModules.size >= 1,
    "expected at least x8300_physics to carry the FIELD-DIAGNOSTIC marker",
  );
  // tests never make binding decisions → allowlisted as diagnostic consumers
  const allowlist = new Set(
    modules.map((m) => m.name).filter((n) => n.endsWith("_test")),
  );
  const violations = fieldWallViolations(modules, fieldModules, allowlist);
  assert(
    violations.length === 0,
    `wall I-11 breached — a field diagnostic is read by a non-diagnostic surface:\n${
      violations.join("\n")
    }`,
  );
});
