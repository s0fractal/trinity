import { assert } from "jsr:@std/assert@^1";

// The under-which-mandate example must run and prove what it claims.
Deno.test("agentseal mandated example — a mandated action verifies, an uncovered one is refused, a mandate swap is caught", async () => {
  const out = await new Deno.Command("deno", {
    args: ["run", "-A", new URL("./mandated.ts", import.meta.url).pathname],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const text = new TextDecoder().decode(out.stdout) +
    new TextDecoder().decode(out.stderr);
  assert(out.success, `example must exit 0:\n${text}`);
  assert(
    /read admitted:\s+true\s+under mandate: mc1/.test(text),
    "read is admitted under mc1",
  );
  assert(/read verifies:\s+true/.test(text), "the mandated action verifies");
  assert(
    /write admitted:\s+false/.test(text),
    "the uncovered write is refused",
  );
  assert(
    /mandate swap caught:\s+true/.test(text),
    "re-pointing the mandate is caught",
  );
});
