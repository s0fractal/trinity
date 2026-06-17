import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { candidateRouteKey, starterDipole } from "./x4300_scaffold.ts";

Deno.test("candidateRouteKey - strips trailing zeros off the 3-char remainder", () => {
  assertEquals(candidateRouteKey("4300"), "4/3"); // the scaffold organ itself
  assertEquals(candidateRouteKey("6F00"), "6/F");
  assertEquals(candidateRouteKey("6020"), "6/02"); // interior zero preserved
  assertEquals(candidateRouteKey("2F30"), "2/F3");
  assertEquals(candidateRouteKey("a000"), "A/0"); // pure xN000 → N/0, uppercased
});

Deno.test("candidateRouteKey - null for non-4-hex input", () => {
  assertEquals(candidateRouteKey("430"), null);
  assertEquals(candidateRouteKey("43000"), null);
  assertEquals(candidateRouteKey("4Z00"), null);
  assertEquals(candidateRouteKey(""), null);
});

Deno.test("starterDipole - strongest axis (0x59) sits at the bucket index, matching the audit rule", () => {
  // bucket 4 → axis 4 strongest (the dipole-axis-match the audit enforces)
  assertEquals(starterDipole(4), "00 00 00 00 59 00 00 00");
  assertEquals(starterDipole(6), "00 00 00 00 00 00 59 00");
  assertEquals(starterDipole(0), "59 00 00 00 00 00 00 00");
  // buckets 8..F wrap mod 8 onto the 8 octet axes
  assertEquals(starterDipole(0xC), "00 00 00 00 59 00 00 00"); // 12 % 8 == 4
});
