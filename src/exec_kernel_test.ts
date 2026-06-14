// src/exec_kernel_test.ts — the shared execution kernel (codex Phase B): a
// bounded "run an organ, get a structured result" boundary with a deadline and
// an output byte cap, plus the canonical dispatcher-JSON extractor. Gated by
// `deno task test:unit`.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  exists,
  extractOrganJson,
  permissionFlags,
  runOrgan,
} from "./x0010_dispatch_runner.ts";

Deno.test("runOrgan - captures a normal exit", async () => {
  const r = await runOrgan("deno", ["eval", "console.log('hi')"]);
  assertEquals(r.code, 0);
  assertEquals(r.timed_out, false);
  assert(r.stdout.includes("hi"));
});

Deno.test("runOrgan - a deadline aborts the process (timed_out, code 124)", async () => {
  const r = await runOrgan(
    "deno",
    ["eval", "await new Promise((res) => setTimeout(res, 10000))"],
    { timeout_ms: 200 },
  );
  assertEquals(r.timed_out, true);
  assertEquals(r.code, 124);
});

Deno.test("runOrgan - output is capped at max_output_bytes (truncated flag set)", async () => {
  const r = await runOrgan(
    "deno",
    ["eval", "console.log('x'.repeat(5000))"],
    { max_output_bytes: 100 },
  );
  assertEquals(r.truncated, true);
  assert(r.stdout.length <= 100);
});

Deno.test("runOrgan - a missing command never throws (fail-soft)", async () => {
  const r = await runOrgan("definitely-not-a-real-binary-xyz", []);
  assert(r.code !== 0);
  assertEquals(r.timed_out, false);
});

Deno.test("extractOrganJson - parses pure JSON / tolerates # lines / empty / non-JSON", () => {
  assertEquals(extractOrganJson('{"a":1}'), { a: 1 });
  assertEquals(extractOrganJson('# header\n{"b":2}'), { b: 2 });
  assertEquals(extractOrganJson("  \n "), undefined);
  assertEquals(extractOrganJson("plain text"), { text: "plain text" });
});

// ── Phase C: runtime permission profiles (codex x5d00_953682 F3) ────────────

Deno.test("permissionFlags - confined profiles grant no write/net/run/ffi/all", () => {
  const rl = permissionFlags("read-local");
  const joined = rl.join(" ");
  assert(rl.includes("--no-prompt"));
  assert(joined.includes("--allow-read="));
  for (
    const forbidden of [
      "--allow-write",
      "--allow-net",
      "--allow-run",
      "--allow-ffi",
      "--allow-all",
    ]
  ) {
    assert(
      !joined.includes(forbidden),
      `read-local must not grant ${forbidden}`,
    );
  }
  assertEquals(permissionFlags("pure"), ["--no-prompt"]);
  assertEquals(permissionFlags("privileged"), ["--allow-all"]);
});

// Launch an adversarial fixture through the SAME form the kernel uses —
// `deno run <permissionFlags> <script>` — so the test exercises real runtime
// confinement, not a flag the launcher doesn't use. The fixture lives in a
// system temp dir (deno loads the main module regardless of --allow-read).
async function runFixtureReadLocal(body: string) {
  const dir = await Deno.makeTempDir();
  const path = `${dir}/fix.ts`;
  await Deno.writeTextFile(path, body);
  try {
    return await runOrgan("deno", [
      "run",
      ...permissionFlags("read-local"),
      path,
    ]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("read-local physically denies a write even with a wrong (readonly) verdict", async () => {
  const target = `${await Deno.makeTempDir()}/out.txt`;
  const r = await runFixtureReadLocal(
    `await Deno.writeTextFile(${JSON.stringify(target)}, "x");`,
  );
  assert(r.code !== 0, "write under read-local must fail at runtime");
  assert(!(await exists(target)), "no file may be created under read-local");
});

Deno.test("read-local physically denies a network listen", async () => {
  const r = await runFixtureReadLocal(`Deno.listen({ port: 0 });`);
  assert(r.code !== 0, "listen under read-local must fail at runtime");
});

Deno.test("read-local physically denies a subprocess spawn", async () => {
  const r = await runFixtureReadLocal(
    `await new Deno.Command("echo", { args: ["hi"] }).output();`,
  );
  assert(r.code !== 0, "subprocess under read-local must fail at runtime");
});

Deno.test("read-local still allows a repo-local read", async () => {
  // Read a file under the substrate root (the scope read-local grants).
  const repoFile = `${Deno.cwd()}/deno.jsonc`;
  const r = await runFixtureReadLocal(
    `await Deno.readTextFile(${
      JSON.stringify(repoFile)
    }); console.log("read-ok");`,
  );
  assertEquals(r.code, 0);
  assert(r.stdout.includes("read-ok"));
});
