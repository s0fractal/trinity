// Drift guard — DEV-ONLY (excluded from publish). Proves this package's extracted
// core stays faithful to the trinity organ it came from (src/x5C20_autonomy.ts).
// If the substrate changes the policy logic, this reds in the monorepo, forcing
// the package to be re-extracted. Skips gracefully outside the monorepo.

import { assertEquals } from "jsr:@std/assert@^1";
import * as pkg from "./mod.ts";

Deno.test("parity — package logic matches the trinity x5C20 original", async () => {
  let orig: typeof pkg;
  try {
    orig = await import("../../src/x5C20_autonomy.ts");
  } catch {
    console.warn(
      "[parity] trinity x5C20 absent — skipped (standalone checkout)",
    );
    return;
  }
  const cases = [
    ["read"],
    ["format"],
    ["source_change"],
    ["fetch_public"],
    ["deploy"],
    ["spend"],
    ["mandate_edit"],
    ["unknown_xyz"],
    ["read", "deploy"],
  ];
  const at = { kind: "bitcoin_block", height: 1 } as const;
  for (const effects of cases) {
    const intent = { verb: "v", target: "t", effects };
    assertEquals(
      pkg.classifyIntent(intent).cls,
      orig.classifyIntent(intent).cls,
      `classifyIntent drift on ${JSON.stringify(effects)}`,
    );
    assertEquals(
      pkg.admit(intent, null, at).reason_code,
      orig.admit(intent, null, at).reason_code,
      `admit drift on ${JSON.stringify(effects)}`,
    );
  }
});
