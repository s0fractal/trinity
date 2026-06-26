import { assert } from "jsr:@std/assert@^1";

// The worked example must actually run and prove what it claims.
Deno.test("codeicide example — runs: quorum lawful, unilateral not", async () => {
  const out = await new Deno.Command("deno", {
    args: ["run", new URL("./sanctuary.ts", import.meta.url).pathname],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const text = new TextDecoder().decode(out.stdout) +
    new TextDecoder().decode(out.stderr);
  assert(out.success, `example must exit 0:\n${text}`);
  assert(
    /quorum warrant lawful:\s+true/.test(text),
    "a guardian quorum is lawful",
  );
  assert(
    /unilateral termination lawful:\s+false/.test(text),
    "one party alone cannot terminate",
  );
});
