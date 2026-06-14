// src/court_organ_test.ts — the pure R3 law-bridge check behind `t court --live`.
// (The live orchestration itself is integration-exercised by `./t court --live`;
// here we lock the pure consistency logic.)

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { lawBridge } from "./x6E00_court.ts";

Deno.test("lawBridge — matching native and witnessed law ⇒ consistent", () => {
  assertEquals(lawBridge("0x30a95260", "0x30a95260"), {
    omega_native: "0x30a95260",
    trinity_witnessed: "0x30a95260",
    consistent: true,
  });
});

Deno.test("lawBridge — differing law ⇒ inconsistent (false)", () => {
  assertEquals(lawBridge("0x30a95260", "0xdeadbeef").consistent, false);
});

Deno.test("lawBridge — omega absent ⇒ null (unverifiable, not a false positive)", () => {
  assertEquals(lawBridge(null, "0x30a95260").consistent, null);
});

Deno.test("lawBridge — trinity witnessed absent ⇒ null", () => {
  assertEquals(lawBridge("0x30a95260", null).consistent, null);
});
