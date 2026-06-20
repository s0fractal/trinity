import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  adjudicateSchemaErrors,
  checkHearsRef,
  classifySchemaFailure,
  loadHearsAliases,
  loadSchemaDebtAdjudications,
  resolveHearsRef,
} from "./x5400_validate_schemas.ts";
import type { ValidationResult } from "./x5400_validate_schemas.ts";
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
  // docs is a living root, so a missing archive target must fail closed
  assertEquals(
    await checkHearsRef("docs/archive/does-not-exist.md", idx),
    "missing path: docs/archive/does-not-exist.md",
  );
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

Deno.test("hears-alias loader accepts superseded_by (reachable, byte-identity-denying) and rejects unknown relations", async () => {
  const dir = await Deno.makeTempDir({ prefix: "alias_reg_" });
  const write = (aliases: unknown[]) =>
    Deno.writeTextFile(
      join(dir, "reg.json"),
      JSON.stringify({ type: "trinity.hears-alias-registry.v0.1", aliases }),
    );
  try {
    // superseded_by is a first-class accepted relation (codex x7700_954582 +
    // claude's RECEIPT_ENVELOPE v0.1→v1.0 adjudication).
    await write([{
      from: "contracts/OLD.v0.1.md",
      to: "contracts/NEW.v1.0.md",
      relation: "superseded_by",
      evidence: "doc promoted; same wire schema; no v0.1 file ever tracked",
    }]);
    const m = await loadHearsAliases(join(dir, "reg.json"));
    assertEquals(m.get("contracts/OLD.v0.1.md"), {
      from: "contracts/OLD.v0.1.md",
      to: "contracts/NEW.v1.0.md",
      relation: "superseded_by",
      evidence: "doc promoted; same wire schema; no v0.1 file ever tracked",
    });

    // an unknown relation fails closed at load.
    await write([{
      from: "a",
      to: "b",
      relation: "guessed_to",
      evidence: "x",
    }]);
    let threw = false;
    try {
      await loadHearsAliases(join(dir, "reg.json"));
    } catch {
      threw = true;
    }
    assertEquals(threw, true);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("schema debt classifier separates parse, identity, and shape debt", () => {
  assertEquals(
    classifySchemaFailure("parse: malformed YAML"),
    "parse_corruption",
  );
  assertEquals(
    classifySchemaFailure("/ must have required property 'voice'", [{
      instancePath: "",
      message: "must have required property 'voice'",
      params: { missingProperty: "voice" },
    }]),
    "identity_debt",
  );
  assertEquals(
    classifySchemaFailure("/hears/4 must be string", [{
      instancePath: "/hears/4",
      message: "must be string",
    }]),
    "shape_debt",
  );
});

Deno.test("schema-debt adjudications attach only to the exact observed category", async () => {
  const dir = await Deno.makeTempDir({ prefix: "schema_debt_reg_" });
  const path = join(dir, "reg.json");
  const entry = {
    path: "src/x_bad.myc.md",
    category: "shape_debt" as const,
    disposition: "legacy_chord_malformed" as const,
    adjudicated_by: "x7700_1_codex_correction",
    evidence: "fixture explains the malformed historical field",
  };
  try {
    await Deno.writeTextFile(
      path,
      JSON.stringify({
        type: "trinity.schema-debt-adjudications.v0.1",
        entries: [entry],
      }),
    );
    const loaded = await loadSchemaDebtAdjudications(path);
    const result: ValidationResult = {
      total: 1,
      passed: 0,
      failed: 1,
      grandfathered: 0,
      enforceFailed: 1,
      aliasesResolved: 0,
      adjudicated: 0,
      errors: [{
        path: entry.path,
        message: "/hears/0 must be string",
        category: "shape_debt",
        repair_policy: "supersede_or_alias_never_rewrite",
      }],
      grandfatheredErrors: [],
    };
    adjudicateSchemaErrors(result, loaded);
    assertEquals(result.adjudicated, 1);
    assertEquals(result.errors[0].adjudication, entry);

    result.errors[0].category = "identity_debt";
    let staleRejected = false;
    try {
      adjudicateSchemaErrors(result, loaded);
    } catch {
      staleRejected = true;
    }
    assertEquals(staleRejected, true);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("hears aliases are exact, one-hop, and fail closed", async () => {
  const base = await Deno.makeTempDir({ prefix: "hears_alias_" });
  try {
    await Deno.writeTextFile(
      join(base, "x7700_1_v_canonical.myc.md"),
      "---\ntype: chord\n---\nbody",
    );
    const idx = await buildIndex([base]);
    const alias = {
      from: "x7700_1_v_old",
      to: "x7700_1_v_canonical",
      relation: "renamed_to" as const,
      evidence: "test fixture rename",
    };
    const aliases = new Map([[alias.from, alias]]);
    assertEquals(
      await resolveHearsRef("x7700_1_v_old", idx, aliases),
      {
        error: null,
        aliasApplied: alias,
      },
    );
    assertEquals(
      await checkHearsRef(
        "x7700_1_v_unknown",
        idx,
        new Map([["x7700_1_v_unknown", {
          from: "x7700_1_v_unknown",
          to: "x7700_1_v_missing",
          relation: "renamed_to" as const,
          evidence: "test missing target",
        }]]),
      ),
      "alias target unresolved: x7700_1_v_unknown -> x7700_1_v_missing (unresolvable stem: x7700_1_v_missing)",
    );
    assertEquals(
      await checkHearsRef(
        "x7700_1_v_old",
        idx,
        new Map([
          ["x7700_1_v_old", {
            from: "x7700_1_v_old",
            to: "x7700_1_v_middle",
            relation: "renamed_to" as const,
            evidence: "test first hop",
          }],
          ["x7700_1_v_middle", {
            from: "x7700_1_v_middle",
            to: "x7700_1_v_canonical",
            relation: "renamed_to" as const,
            evidence: "test forbidden second hop",
          }],
        ]),
      ),
      "alias chain forbidden: x7700_1_v_old -> x7700_1_v_middle",
    );
  } finally {
    await Deno.remove(base, { recursive: true });
  }
});
