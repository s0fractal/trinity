import { assert } from "jsr:@std/assert@^1";

// The wedge must be provable, not just claimed: cross-vendor, multi-hop, no
// shared IdP, no host — and forgery caught. This runs the example and checks it.
Deno.test("agentseal cross-vendor example — two vendors, delegation chain verifies locally; forgery caught", async () => {
  const out = await new Deno.Command("deno", {
    args: ["run", "-A", new URL("./cross_vendor.ts", import.meta.url).pathname],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const text = new TextDecoder().decode(out.stdout) +
    new TextDecoder().decode(out.stderr);
  assert(out.success, `example must exit 0:\n${text}`);
  assert(/hop1 \(vendor A\) verifies:\s+true/.test(text), "hop1 verifies");
  assert(/hop2 \(vendor C\) verifies:\s+true/.test(text), "hop2 verifies");
  assert(/delegation chain intact:\s+true/.test(text), "chain links");
  assert(
    /no shared IdP, no host — provable:\s+true/.test(text),
    "the full cross-vendor chain is provable with no shared IdP and no host",
  );
  assert(
    /forged delegation caught:\s+true/.test(text),
    "a forged delegation link is caught locally",
  );
});
