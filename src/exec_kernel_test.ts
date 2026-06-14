// src/exec_kernel_test.ts — the shared execution kernel (codex Phase B): a
// bounded "run an organ, get a structured result" boundary with a deadline and
// an output byte cap, plus the canonical dispatcher-JSON extractor. Gated by
// `deno task test:unit`.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { extractOrganJson, runOrgan } from "./x0010_dispatch_runner.ts";

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
