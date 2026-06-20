import {
  assert,
  assertFalse,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parse as parseYaml } from "jsr:@std/yaml@1.0.5";
import Ajv2020Module from "npm:ajv@8.17.1/dist/2020.js";

// ─────────────────────────────────────────────────────────────────────────────
// Writer ↔ schema conformance (audit 2026-06-20). The chord schema rotted to 310
// "failures" because it described a form NO tool emits and nothing re-checked the
// alignment. This locks the invariant — the canonical writer `x4001_chord` must
// produce a chord that validates against contracts/schema/chord.schema.json — so a
// future drift in EITHER the writer or the schema fails CI. Invariant-based, not a
// frozen count: it never breaks when a voice merely adds another chord.

// deno-lint-ignore no-explicit-any
const Ajv2020 = (Ajv2020Module as any).default ?? Ajv2020Module;
const ROOT = new URL("..", import.meta.url).pathname;

async function generateChord(args: string[]): Promise<Record<string, unknown>> {
  // dry-run (no --write): the writer prints the chord markdown to stdout.
  const r = await new Deno.Command("./t", { args, cwd: ROOT, stdout: "piped" })
    .output();
  const out = new TextDecoder().decode(r.stdout);
  const m = out.match(/^---\r?\n([\s\S]*?)\r?\n---/m);
  assert(m, `writer produced no frontmatter for: t ${args.join(" ")}`);
  return parseYaml(m![1]) as Record<string, unknown>;
}

async function validator() {
  const schema = JSON.parse(
    await Deno.readTextFile(`${ROOT}contracts/schema/chord.schema.json`),
  );
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

Deno.test("conformance — `t chord receipt` output validates against chord.schema.json", async () => {
  const validate = await validator();
  const fm = await generateChord([
    "chord",
    "receipt",
    "--voice=claude",
    "--topic=schema-conformance-probe",
    "--primary=oct:6.harmony",
  ]);
  const ok = validate(fm);
  assert(
    ok,
    `canonical receipt chord fails its own schema: ${
      JSON.stringify(validate.errors)
    }`,
  );
});

Deno.test("conformance — `t chord init` output validates against chord.schema.json", async () => {
  const validate = await validator();
  for (const type of ["observation", "proposal", "decision"]) {
    const fm = await generateChord([
      "chord",
      "init",
      "--voice=claude",
      `--type=${type}`,
      "--topic=schema-conformance-probe",
      "--primary=oct:5.action",
    ]);
    const ok = validate(fm);
    assert(
      ok,
      `canonical ${type} chord fails its own schema: ${
        JSON.stringify(validate.errors)
      }`,
    );
  }
});

Deno.test("conformance — RED TEAM: isolated marker words are not chord identity", async () => {
  const validate = await validator();
  for (
    const fake of [
      { mode: "banana" },
      { type: "garbage" },
      { stance: 42 },
      { type: "chord.receipt" }, // a typed chord still needs an author identity
    ]
  ) {
    assertFalse(
      validate(fake),
      `non-chord marker object was accepted: ${JSON.stringify(fake)}`,
    );
  }
});

Deno.test("conformance — historical identity branches remain explicit", async () => {
  const validate = await validator();
  assert(validate({ type: "chord.receipt", voice: "claude" }));
  assert(validate({ type: "chord.receipt", author: "codex" }));
  assert(validate({ mode: "RECEIPT", voice: "codex" }));
  assert(validate({ id: "legacy-id", speaker: "gemini" }));
});
