import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { firstJson } from "./x6F00_check.ts";

Deno.test("firstJson - extracts the first JSON object after a dispatch header line", () => {
  // dispatch prints a `# verb → pos` header before the JSON payload
  const out = "# audit → 6/C\n" + '{"summary":{"mismatch":0}}\n';
  assertEquals(firstJson(out), { summary: { mismatch: 0 } });
});

Deno.test("firstJson - handles arrays, leading noise, and absent JSON", () => {
  assertEquals(firstJson("noise\nmore\n[1, 2, 3]"), [1, 2, 3]);
  assertEquals(firstJson("no json here at all"), null);
  assertEquals(firstJson(""), null);
  // malformed JSON after the marker → null, not a throw
  assertEquals(firstJson("# x\n{ not valid"), null);
});
