import { assert } from "jsr:@std/assert@^1";

// The worked example must actually run and prove what it claims.
Deno.test("agentseal example — runs: bounded+witnessed, sovereign refused, tamper caught", async () => {
  const out = await new Deno.Command("deno", {
    args: ["run", new URL("./seal.ts", import.meta.url).pathname],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const text = new TextDecoder().decode(out.stdout) +
    new TextDecoder().decode(out.stderr);
  assert(out.success, `example must exit 0:\n${text}`);
  assert(
    /write class:\s+A2\s+allowed:\s*true/.test(text),
    "A2 write is allowed",
  );
  assert(
    /verified locally:\s+true/.test(text),
    "the witnessed action verifies",
  );
  assert(
    /wipe class:\s+A4\s+allowed:\s*false/.test(text),
    "A4 wipe is refused",
  );
  assert(/tamper caught:\s+true/.test(text), "tampering is caught");
});
