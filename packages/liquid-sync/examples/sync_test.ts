import { assert } from "jsr:@std/assert@^1";

// The worked example must actually run and prove what it claims, so a new
// contributor can copy it and trust it.
Deno.test("liquid-sync example — runs: resonance winner, clock-independent, covenant-scoped", async () => {
  const out = await new Deno.Command("deno", {
    args: ["run", new URL("./sync.ts", import.meta.url).pathname],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const text = new TextDecoder().decode(out.stdout) +
    new TextDecoder().decode(out.stderr);
  assert(out.success, `example must exit 0:\n${text}`);
  assert(
    /conflict winner:\s+alice/.test(text),
    "resonance picks the aligned writer",
  );
  assert(
    /clock-independent:\s+true/.test(text),
    "the winner is clock-independent",
  );
  assert(/covenant changed:\s+true/.test(text), "a different covenant reseeds");
  assert(
    /different physics:\s+true/.test(text),
    "different covenant → different resonance",
  );
});
