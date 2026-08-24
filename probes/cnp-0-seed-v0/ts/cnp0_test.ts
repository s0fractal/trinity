// The gate for the CNP-0 executable seed, wired into `deno task test:unit`
// (and therefore into `./t check` and CI). Self-contained: no sibling checkout,
// no network, no submodule.

import { assert, assertEquals } from "@std/assert";
import { run } from "./runner.ts";
import { runMutations } from "./mutate.ts";
import { parity } from "./parity_warrant.ts";

const ROOT = new URL("../", new URL(".", import.meta.url));

Deno.test("cnp-0 corpus: every case matches its pinned expectation", async () => {
  const report = await run();
  assertEquals(report.failures, [], report.failures.map((f) => `${f.id}: ${f.detail}`).join("\n"));
});

Deno.test("cnp-0 corpus: the counts are non-zero and the classes are covered", async () => {
  const report = await run();
  // A green suite that selected nothing is a failure, not a pass.
  assert(report.cases > 0, "no cases selected");
  assert(report.encoderAccepted > 0, "no positive encoder case");
  assert(report.encoderRejected > 0, "no negative encoder case");
  assert(report.verifierAccepted > 0, "no accepted verifier case");
  assert(report.verifierRejected > 0, "no rejected verifier case");
  assert(report.transformsAccepted > 0, "no accepted transform case");
  assert(report.transformsRejected > 0, "no rejected transform case");
  assert(report.digestGroups > 0, "no distinct-digest group");

  // All eight §5.1.3 categories are present.
  const manifest = JSON.parse(
    await Deno.readTextFile(new URL("corpus/manifest.json", ROOT)),
  );
  const categories = new Set<number>(
    manifest.cases.map((c: { category: number }) => c.category),
  );
  for (let i = 1; i <= 8; i++) {
    assert(categories.has(i), `§5.1.3(${i}) has no case`);
  }

  // Every rejection class the manifest declares is actually exercised.
  const declared: string[] = manifest.rejection_classes;
  const used = new Set<string>();
  for (const c of manifest.cases) {
    for (const side of ["encoder", "verifier", "expect"]) {
      const v = (c as Record<string, unknown>)[side];
      if (v && typeof v === "object" && "reject" in (v as Record<string, unknown>)) {
        used.add(String((v as Record<string, string>).reject));
      }
    }
  }
  const unexercised = declared.filter((c) => !used.has(c));
  assertEquals(
    unexercised,
    [],
    `declared but never exercised: ${unexercised.join(", ")}`,
  );
});

Deno.test("verifier-only path does not import the encoder", async () => {
  const source = await Deno.readTextFile(new URL("ts/reject.ts", ROOT));
  const imports = [...source.matchAll(/^\s*import[^;]*from\s+"([^"]+)"/gm)]
    .map((m) => m[1]);
  // §5.1.3 requires a third path that starts from raw bytes without the
  // canonicalizer. This is the structural half of that requirement; the
  // behavioural half is that it never emits bytes, only a verdict.
  assertEquals(imports, [], `reject.ts must import nothing, got ${imports.join(", ")}`);
  assert(!source.includes("serialize("), "the verifier must not re-encode input");
  assert(!source.includes("canonicalize("), "the verifier must not call the canonicalizer");
});

Deno.test("the verifier never repairs: rejected input yields no bytes", async () => {
  const { verifyRaw } = await import("./reject.ts");
  const notCanonical = new TextEncoder().encode(
    '{"z":1,"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0"}',
  );
  const outcome = await verifyRaw(notCanonical);
  assert(!outcome.ok, "member order out of sequence must be rejected");
  assertEquals(Object.keys(outcome).sort(), ["detail", "offset", "ok", "rejection"]);
});

Deno.test("negative controls: each protected class goes red under mutation", async () => {
  const results = await runMutations();
  const control = results.find((r) => r.id === "control-unmutated");
  assert(control?.wentRed, "the unmutated copy must be green first");
  const bad = results.filter((r) => r.id !== "control-unmutated" && (!r.applied || !r.wentRed));
  assertEquals(bad.map((r) => `${r.id}: ${r.detail}`), []);
  assert(results.length >= 8, "too few mutation classes");
});

Deno.test("warrant parity is UNAVAILABLE, not green, without a pinned checkout", async () => {
  const report = await parity(undefined);
  assertEquals(report.status, "UNAVAILABLE");
  assertEquals(report.matched, 0);
});
