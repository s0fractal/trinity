// Drift guard — DEV-ONLY (excluded from publish). The package's canonical encoding
// must stay byte-identical to the probe it was extracted from
// (probes/receipt-envelope-encoder-v0), which the omega substrate also vendors and
// parity-checks. If the probe changes, this reds in the monorepo, forcing a
// re-extraction. Skips gracefully outside the monorepo. The variable specifier keeps
// the type-checker from resolving the probe path in a packages-only checkout.
import { assertEquals } from "jsr:@std/assert@^1";
import { encodeCanonical, toHex } from "./mod.ts";

Deno.test("parity — canonical encoding matches the probe it was extracted from", async () => {
  let probe: { encodeCanonical: (v: unknown) => Uint8Array };
  try {
    const spec =
      "../../probes/receipt-envelope-encoder-v0/ts/canonical_cbor.ts";
    probe = await import(spec);
  } catch {
    console.warn("[parity] probe absent — skipped (standalone checkout)");
    return;
  }
  const cases: unknown[] = [
    0,
    1,
    -1,
    1000,
    255,
    65535,
    "hello",
    "",
    true,
    false,
    null,
    [1, 2, 3],
    { b: 2, a: 1 },
    { nested: { z: 26, a: 1 }, list: [{ k: "v" }, { k: "w" }] },
  ];
  for (const c of cases) {
    assertEquals(
      toHex(encodeCanonical(c as never)),
      toHex(probe.encodeCanonical(c)),
      `drift on ${JSON.stringify(c)}`,
    );
  }
});
