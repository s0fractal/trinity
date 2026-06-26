import { assert } from "jsr:@std/assert@^1";

// The worked example must actually run and prove what it claims.
Deno.test("witness example — runs: quorum reached, forged quorum scores zero", async () => {
  const out = await new Deno.Command("deno", {
    args: ["run", new URL("./quorum.ts", import.meta.url).pathname],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const text = new TextDecoder().decode(out.stdout) +
    new TextDecoder().decode(out.stderr);
  assert(out.success, `example must exit 0:\n${text}`);
  assert(
    /quorum reached:\s+true \(2 of 3\)/.test(text),
    "2-of-3 quorum reached",
  );
  assert(/forged quorum valid:\s+0/.test(text), "a lone actor forges nothing");
  assert(/verified locally:\s+true/.test(text), "verification is local");
});
