import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  bucketOf,
  coordinateHexOf,
  parseHexDipole,
  strongestAxes,
} from "./x6C00_audit.ts";

// Pure-function coverage for x6C00_audit's match-decision core. The CI
// "Audit coordinates" gate asserts `summary.mismatch == 0`; these functions
// decide match vs mismatch, so a regression here would miscolor that gate.
// File-walking / report assembly stay out of the unit path (they hit the fs).

Deno.test("parseHexDipole - parses 8 signed int8 axes from the header", () => {
  // x2F30's real dipole: strongest byte 6C (=108) sits on axis 2 (mirror).
  const r = parseHexDipole('// hex_dipole: "26 26 6C 26 26 26 26 26"');
  assertEquals(r.values, [38, 38, 108, 38, 38, 38, 38, 38]);
  assertEquals(r.raw, "26 26 6C 26 26 26 26 26");
});

Deno.test("parseHexDipole - signed bytes: >=0x80 wrap negative", () => {
  const r = parseHexDipole('hex_dipole: "FF 80 00 40 7F 00 00 00"');
  // FF=-1, 80=-128, 00=0, 40=64, 7F=127
  assertEquals(r.values, [-1, -128, 0, 64, 127, 0, 0, 0]);
});

Deno.test("parseHexDipole - missing / wrong-length / non-hex are rejected", () => {
  assertEquals(parseHexDipole("no dipole here"), { values: null, raw: null });
  // too few bytes → clean length != 16
  assertEquals(parseHexDipole('hex_dipole: "26 26 6C"'), {
    values: null,
    raw: "26 26 6C",
  });
  // non-hex byte → NaN → rejected, raw preserved
  assertEquals(parseHexDipole('hex_dipole: "ZZ 00 00 00 00 00 00 00"'), {
    values: null,
    raw: "ZZ 00 00 00 00 00 00 00",
  });
});

Deno.test("strongestAxes - single dominant axis, ties, and all-zero", () => {
  assertEquals(strongestAxes([38, 38, 108, 38, 38, 38, 38, 38]), {
    axes: [2],
    mag: 108,
  });
  // magnitude tie (sign-agnostic): -90 and 90 both win
  assertEquals(strongestAxes([10, -90, 90, 5]), { axes: [1, 2], mag: 90 });
  // all zero → every axis tied at 0
  assertEquals(strongestAxes([0, 0, 0]), { axes: [0, 1, 2], mag: 0 });
});

Deno.test("bucketOf - first hex digit of the flat-src filename", () => {
  assertEquals(bucketOf("src/x2F30_fqdn_resolver.ts"), {
    bucket: "2",
    bucketInt: 2,
  });
  assertEquals(bucketOf("src/xA031_liquid_pipe.ts"), {
    bucket: "A",
    bucketInt: 10,
  });
  // non-coordinate name → no bucket (returns the path, null int)
  assertEquals(bucketOf("src/not_hex.ts"), {
    bucket: "src/not_hex.ts",
    bucketInt: null,
  });
});

Deno.test("coordinateHexOf - the full 4-hex coordinate, uppercased", () => {
  assertEquals(coordinateHexOf("src/x2f30_fqdn_resolver.ts"), "2F30");
  assertEquals(coordinateHexOf("src/x6C00_audit.ts"), "6C00");
  assertEquals(coordinateHexOf("README.md"), null);
});
