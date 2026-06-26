import { assert } from "jsr:@std/assert@^1";

// codex x5d00 P4 adoption bridge: the worked example must actually run and prove what
// it claims, so a new contributor can copy it and trust it (no trinity ontology needed).
Deno.test("canonical-receipt example — runs end to end: order-independent, verifies, tamper caught", async () => {
  const out = await new Deno.Command("deno", {
    args: ["run", new URL("./receipt.ts", import.meta.url).pathname],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const text = new TextDecoder().decode(out.stdout) +
    new TextDecoder().decode(out.stderr);
  assert(out.success, `example must exit 0:\n${text}`);
  assert(
    /order-independent:\s+true/.test(text),
    "canonical encoding must be order-independent",
  );
  assert(/verifies:\s+true/.test(text), "the receipt must verify");
  assert(/tamper caught:\s+true/.test(text), "tampering must be caught");
});
