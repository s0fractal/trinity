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
  // The four shapes that made the runner unsound: every answer correct, only
  // the reply stream wrong. All four scored 126/126 before.
  for (
    const control of [
      "answers-in-the-wrong-order-fail",
      "a-repeated-id-fails",
      "an-unasked-id-fails",
      "a-wrong-answer-followed-by-a-right-one-fails",
    ]
  ) {
    assert(
      text.includes(`ok   ${control}`),
      `${control} did not pass:\n${text}`,
    );
  }
  assert(text.includes("ok   unpinned-file-is-refused"), text);
  assert(/\n16 passed, 0 failed/.test(text), text);
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

Deno.test("conformance kit: its inventory is closed and holds no implementation", async () => {
  // This test used to open with `assert(!shipped.includes("ts") || true)`, which
  // is true for every possible input, and then looked only inside ts/. An
  // implementation dropped in as a .py at the top level was invisible to it.
  //
  // The check now walks the whole kit twice: everything present must be pinned,
  // and everything pinned must be one of the files this kit is allowed to be.
  const manifest = await Deno.readTextFile(`${HERE}MANIFEST.sha256`);
  const pinned = new Set(
    manifest.split("\n").filter((l) => l.trim()).map((l) => l.split("  ")[1]),
  );

  const found: string[] = [];
  const walk = async (dir: string, prefix = "") => {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.name === "__pycache__") continue;
      const rel = prefix + entry.name;
      if (entry.isDirectory) await walk(`${dir}${entry.name}/`, `${rel}/`);
      else found.push(rel);
    }
  };
  await walk(HERE);

  const unpinned = found.filter((f) =>
    f !== "MANIFEST.sha256" && !pinned.has(f)
  );
  assertEquals(
    unpinned,
    [],
    `files present but pinned by nothing: ${unpinned}`,
  );
  const missing = [...pinned].filter((f) => !found.includes(f));
  assertEquals(missing, [], `files pinned but absent: ${missing}`);

  // The kit is data, documents, a runner, its selftest, its builder, and this
  // test. Anything else — in any language — is the implementation the no-trust
  // claim says is not here.
  const ALLOWED = new Set([
    "CONTRACT.md",
    "INTERFACE.md",
    "MANIFEST.sha256",
    "README.md",
    "SPEC-EXTRACT.md",
    "corpus/extended.ndjson",
    "corpus/required.ndjson",
    "run_conformance.py",
    "selftest.py",
    "tools/build_kit.py",
    "ts/kit_test.ts",
  ]);
  const unexpected = found.filter((f) => !ALLOWED.has(f));
  assertEquals(
    unexpected,
    [],
    `the kit carries files it is not allowed to carry: ${unexpected}. If one of ` +
      `these is meant to be here, add it to ALLOWED deliberately and say why.`,
  );
});

Deno.test("conformance kit: it carries the contract it cites", async () => {
  // §5.1.3 requires the contract inside the kit. A kit citing a document it does
  // not carry is unusable by someone who has only the kit.
  const copy = await Deno.readTextFile(`${HERE}CONTRACT.md`);
  const original = await Deno.readTextFile(
    `${ROOT}contracts/CANONICAL_ENCODING.v0.1.md`,
  );
  assert(
    copy.includes("Verbatim copy of"),
    "the copy does not declare itself one",
  );
  assert(
    copy.endsWith(original),
    "the carried contract is not the original verbatim",
  );
});
