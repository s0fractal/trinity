import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { checkHearsRef } from "./x5400_validate_schemas.ts";
import { buildIndex } from "./x2F30_fqdn_resolver.ts";

// checkHearsRef validates ONLY unambiguous citations (coordinate stems + paths
// under known live roots) and skips free-form context — `hears:` is empirically
// a "what this chord responds to" log holding architect utterances, prompt
// quotes, prose, and free:/ref: notes alongside real citations.
Deno.test("checkHearsRef - skips free-form context (whitespace, prefixes, bare words)", async () => {
  const idx = await buildIndex([]); // empty index — skip cases never query it
  for (
    const ctx of [
      "architect: рухайся по горизонтах",
      "User prompt: ти шось путаєш",
      "git log --oneline -5 (b449ba1)",
      "free:architect-2026-05-13-some-note",
      "ref:lambda-foundation/README.md",
      "https://example.com/x",
      "homeostasis", // bare non-coordinate token = prose, not a citation
      "",
    ]
  ) {
    assertEquals(await checkHearsRef(ctx, idx), null, `should skip: ${ctx}`);
  }
});

Deno.test("checkHearsRef - path under a known root: existence-checked", async () => {
  const idx = await buildIndex([]);
  // a real repo file under a known root resolves clean
  assertEquals(await checkHearsRef("src/x2F30_fqdn_resolver.ts", idx), null);
  // a missing file under a known root is a dangling citation
  assertEquals(
    await checkHearsRef("src/x9999_does_not_exist.ts", idx),
    "missing path: src/x9999_does_not_exist.ts",
  );
  // a path under an UNKNOWN root (legacy/external scheme) is skipped, not flagged
  assertEquals(await checkHearsRef("0x0/01.ts", idx), null);
});

Deno.test("checkHearsRef - coordinate stem: resolved via the FQDN index", async () => {
  const base = await Deno.makeTempDir({ prefix: "hears_stem_" });
  try {
    await Deno.writeTextFile(
      join(base, "x7700_1_v_real.myc.md"),
      "---\ntype: chord\n---\nbody",
    );
    const idx = await buildIndex([base]);
    // a coordinate stem that resolves is reachable
    assertEquals(await checkHearsRef("x7700_1_v_real", idx), null);
    // a coordinate stem that does not resolve is a dangling citation
    assertEquals(
      await checkHearsRef("x7700_2_v_ghost", idx),
      "unresolvable stem: x7700_2_v_ghost",
    );
  } finally {
    await Deno.remove(base, { recursive: true });
  }
});
