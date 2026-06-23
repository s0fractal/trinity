// Probe: does the crown jewel survive transplant?
// The external-mirror chord x2300_955055 named the autonomy/capability kernel
// (src/x5C20_autonomy.ts) as the one organ "the wider world can metabolize", and
// set falsifier #4: "extractable as a standalone lib with zero trinity-ontology
// imports → 'mysticism is load-bearing' is too strong."
//
// This test MAKES THAT FALSIFIER EXECUTABLE. It proves, on every run, that the
// policy core is dependency-free, ontology-free, IO-free, and works as a pure
// library — so the crown jewel is already transplantable, not entangled in the
// oct:N.M ornament. If anyone ever couples the core to the ontology / an import /
// IO, these reds. Run: `deno test -A probes/autonomy-kernel-transplant/`

import { admit, classifyIntent } from "../../src/x5C20_autonomy.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.4";

const KERNEL = join(
  dirname(dirname(dirname(fromFileUrl(import.meta.url)))),
  "src",
  "x5C20_autonomy.ts",
);
const src = Deno.readTextFileSync(KERNEL);
// code with line-comments stripped, so the header's positional metadata
// (`hex_dipole: …`, usage examples) never counts as a logic dependency
const code = src.split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");

Deno.test("transplant: the policy core has ZERO dependencies (not just zero trinity ones)", () => {
  assert(!/^\s*import\b/m.test(src), "kernel declares no import statements");
  assert(!/\bfrom\s+["']/.test(code), "kernel imports nothing at all");
  assert(!/\brequire\(/.test(code), "kernel requires nothing");
});

Deno.test("transplant: ZERO trinity-ontology in the logic (mysticism is NOT load-bearing)", () => {
  // oct:N.M / hex_dipole / octet / dipole / glossary live only in the header
  // comment; the decision logic never references the ontology
  assert(
    !/oct:\d|hex_dipole|\boctet\b|glossary|\bdipole\b/i.test(code),
    "no trinity-ontology tokens survive in the code",
  );
});

Deno.test("transplant: the decision logic is IO-free (only the CLI shell touches Deno)", () => {
  const firstDeno = code.indexOf("Deno.");
  const core = firstDeno < 0 ? code : code.slice(0, firstDeno);
  assert(
    core.includes("export function classifyIntent"),
    "classifyIntent is defined before any IO — it is pure",
  );
  assert(
    core.includes("export function admit"),
    "admit is defined before any IO — it is pure",
  );
});

Deno.test("transplant: runs as a pure library — classification + fail-closed authority", () => {
  const I = (effects: string[]) => ({ verb: "x", target: "y", effects });
  // the effect taxonomy a generic agent harness needs — no trinity context given
  assertEquals(classifyIntent(I(["read"])).cls, "A0");
  assertEquals(classifyIntent(I(["source_change"])).cls, "A2");
  assertEquals(classifyIntent(I(["deploy"])).cls, "A4");
  // the crux: an UNKNOWN effect is sovereign by default (fail-closed)
  assertEquals(classifyIntent(I(["a_brand_new_unknown_effect"])).cls, "A4");
  // admit denies with no mandate, and A4 is categorically un-auto-admittable
  const at = { kind: "bitcoin_block", height: 1000 } as const;
  assert(!admit(I(["read"]), null, at).admitted, "no mandate ⇒ deny");
  assert(!admit(I(["deploy"]), null, at).admitted, "deploy (A4) ⇒ deny");
});
