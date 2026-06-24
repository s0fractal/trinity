import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyImport } from "./x6C00_audit.ts";

// The executable substance of the coordinate-gravity law (chord x3300_955061,
// "a higher-bucket import is flagged; the law reds the build"). Before this, the
// law was only OBSERVED at import_warnings:0 — nothing proved a VIOLATION would be
// caught. classifyImport is that proof; these reds if the detection ever breaks.

Deno.test("classifyImport - a runtime organ importing a HIGHER bucket is a violation", () => {
  const v = classifyImport("./x7000_higher.ts", "2000", true, null);
  assertEquals(v.kind, "warning");
  assert(
    (v as { msg: string }).msg.includes("violates coordinate gravity law"),
  );
});

Deno.test("classifyImport - importing a LOWER or EQUAL bucket is allowed", () => {
  assertEquals(
    classifyImport("./x2000_lower.ts", "7000", true, null).kind,
    "ok",
  );
  assertEquals(
    classifyImport("./x3fff_same.ts", "3000", true, null).kind,
    "ok",
  );
});

Deno.test("classifyImport - a library (non-runtime-organ) import is exempt, even from a lower bucket", () => {
  // x4010_hash.ts and friends: targetIsRuntimeOrgan=false ⇒ never a gravity warning
  assertEquals(
    classifyImport("./x9999_lib.ts", "0030", false, null).kind,
    "ok",
  );
});

Deno.test("classifyImport - a ../ reach is a boundary breach, unless a declared adapter owns it", () => {
  assertEquals(
    classifyImport("../other/x2000_a.ts", "2000", false, null).kind,
    "warning",
  );
  assertEquals(
    classifyImport("../other/x2000_a.ts", "2000", false, "t-bridge").kind,
    "boundary",
  );
});

Deno.test("classifyImport - a file with no coordinate never raises a gravity warning", () => {
  assertEquals(
    classifyImport("./x7000_higher.ts", null, true, null).kind,
    "ok",
  );
});
