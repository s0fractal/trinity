// probes/receipt-envelope-encoder-v0/ts/vendor_parity_test.ts
//
// The ReceiptEnvelope encoder (canonical_cbor.ts + envelope.ts) is VENDORED into
// each substrate at <substrate>/src/shared/. Every vendored copy claims (in its
// header) to be "byte-functionally identical to the source by a parity test in
// trinity (this file)". Audit A8 found that claim dangling — this file did not
// exist. Now it does: it enforces that each vendored copy's code (below its
// header comment) is byte-identical to the source here. Reds the instant a copy
// drifts; skips a copy whose submodule is absent (env-gap, not a parity failure).
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

function codeBelowHeader(url: URL): string | null {
  let text: string;
  try {
    text = Deno.readTextFileSync(url);
  } catch {
    return null; // absent (e.g. private submodule not checked out)
  }
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length && (lines[i].startsWith("//") || lines[i].trim() === "")) {
    i++;
  }
  return lines.slice(i).join("\n").trim();
}

const FILES = ["canonical_cbor.ts", "envelope.ts"];
const SUBSTRATES = ["omega", "liquid", "myc"];

for (const fn of FILES) {
  const source = codeBelowHeader(new URL(`./${fn}`, import.meta.url));
  for (const sub of SUBSTRATES) {
    Deno.test(`vendor parity — ${sub}/src/shared/${fn} is byte-identical to source`, () => {
      const copy = codeBelowHeader(
        new URL(`../../../${sub}/src/shared/${fn}`, import.meta.url),
      );
      if (copy === null) return; // submodule absent — cannot compare, not a failure
      assert(source !== null, `source ${fn} missing in the probe`);
      assert(
        copy === source,
        `${sub}/src/shared/${fn} has DRIFTED from the vendored source — re-vendor it (do not hand-edit the copy)`,
      );
    });
  }
}
