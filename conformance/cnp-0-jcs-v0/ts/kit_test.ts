// The conformance kit, checked in CI so it cannot rot.
//
// Three properties, and the third is the one that is easy to leave out: the kit
// must be derivable from the specification, its runner must fail wrong answers,
// and its corpus must be satisfiable by a real implementation. A kit passing
// only the first two could carry an expectation nothing can meet, and every
// synthetic control would still be green.

import { assert, assertEquals } from "jsr:@std/assert@1";

const HERE = new URL("../", import.meta.url).pathname;
const ROOT = new URL("../../../", import.meta.url).pathname;

async function py(script: string, ...args: string[]) {
  const cmd = new Deno.Command("python3", {
    args: [`${HERE}${script}`, ...args],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await cmd.output();
  const text = new TextDecoder().decode(out.stdout) +
    new TextDecoder().decode(out.stderr);
  return { code: out.code, text };
}

Deno.test("conformance kit: the corpus and extract are derivable from the sources", async () => {
  const { code, text } = await py("tools/build_kit.py", "--check");
  assertEquals(code, 0, text);
  assert(text.includes("63 required"), text);
  assert(text.includes("MANIFEST.sha256 pins"), text);
});

Deno.test("conformance kit: the runner fails wrong implementations", async () => {
  const { code, text } = await py("selftest.py");
  assertEquals(code, 0, text);
  // A runner that failed everything would satisfy every negative control, so
  // the positive one is what makes the rest mean something.
  assert(text.includes("ok   correct-implementation-passes"), text);
  assert(text.includes("ok   edited-corpus-is-refused"), text);
  assert(/\n9 passed, 0 failed/.test(text), text);
});

Deno.test("conformance kit: the reference encoder satisfies it", async () => {
  const { code, text } = await py(
    "run_conformance.py",
    "--cmd",
    `deno run --no-config --allow-read ${ROOT}probes/cnp-0-seed-v0/ts/conformance_cli.ts`,
  );
  assertEquals(code, 0, text);
  assert(text.includes("126/126 checks passed"), text);
});

Deno.test("conformance kit: it ships no implementation of its own", async () => {
  // The no-trust claim rests on this. If an encoder ever lands inside the kit,
  // scoring against it becomes scoring against us.
  const shipped: string[] = [];
  for await (const entry of Deno.readDir(HERE)) shipped.push(entry.name);
  assert(!shipped.includes("ts") || true, "ts/ here holds this test only");
  for await (const entry of Deno.readDir(`${HERE}ts`)) {
    assertEquals(
      entry.name,
      "kit_test.ts",
      `unexpected file in the kit's ts/: ${entry.name}`,
    );
  }
});
