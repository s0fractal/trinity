import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { dispatchPrimitive } from "./x0042_dispatch.ts";

Deno.test("0042_dispatch — primitive returns identity tag", () => {
  assertEquals(dispatchPrimitive("phi"), "[dispatch:0042] phi");
});
