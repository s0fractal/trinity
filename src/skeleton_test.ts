import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { AXES, proofPath } from "./x6E10_skeleton.ts";

// Fast structural guard (runs in test:unit): the skeleton must always name exactly
// the six irreducible axes, and each must point at a proof-test that EXISTS on disk.
// If a primitive's proof file is renamed or deleted, this reds here — cheaply —
// instead of `t skeleton` silently dropping an axis. (The actual green/red of each
// proof is what `t skeleton` itself checks; this only guards well-formedness.)

Deno.test("skeleton — exactly the six irreducible axes", () => {
  assertEquals(AXES.length, 6);
  assertEquals(AXES.map((a) => a.n), [1, 2, 3, 4, 5, 6]);
  for (const a of AXES) {
    assert(a.proofs.length >= 1, `axis ${a.n} has no proof`);
  }
});

Deno.test("skeleton — every axis points at a proof-test that exists on disk", async () => {
  const root = new URL("..", import.meta.url).pathname.replace(/\/+$/, "");
  const dirExists = async (d: string) =>
    !!(await Deno.stat(d).catch(() => null))?.isDirectory;
  for (const a of AXES) {
    for (const [sub, test] of a.proofs) {
      // Proofs 1-3 + 6 live in submodules (myc/omega/liquid) that a decoupled CI
      // does not check out. Assert existence only when the submodule is actually
      // populated; otherwise skip (the proof's parent dir absence == not checked out),
      // so a trinity-only CI verifies trinity's proofs without reding on the rest.
      if (sub !== ".") {
        const parent = `${root}/${sub}/${
          test.split("/").slice(0, -1).join("/")
        }`;
        if (!(await dirExists(parent))) continue;
      }
      const path = sub === "." ? `${root}/${test}` : `${root}/${sub}/${test}`;
      const stat = await Deno.stat(path).catch(() => null);
      assert(
        stat?.isFile,
        `axis ${a.n} proof missing on disk: ${proofPath(sub, test)}`,
      );
    }
  }
});
