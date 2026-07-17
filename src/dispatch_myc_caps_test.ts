// Tests the capability classification for the `t myc` passthrough, and its parity
// with myc's authoritative typed map (when the submodule is present).
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyMycVerb, MYC_EFFECTFUL } from "./x0100_dispatch.ts";

Deno.test("classifyMycVerb — read surfaces get no write/net", () => {
  for (
    const v of [
      "organism",
      "trust",
      "lifecycle",
      "coord",
      "resolve",
      "verify",
      "effects",
    ]
  ) {
    assertEquals(classifyMycVerb(v), "read", `${v} must classify read`);
  }
});

Deno.test("classifyMycVerb — mutating verbs are effect; serve is net", () => {
  for (const v of MYC_EFFECTFUL) assertEquals(classifyMycVerb(v), "effect", v);
  assertEquals(classifyMycVerb("serve"), "serve");
});

Deno.test("classifyMycVerb — coord --stamp escalates to effect; unknown fails closed to read", () => {
  assertEquals(classifyMycVerb("coord"), "read");
  assertEquals(classifyMycVerb("coord", ["x0000", "--stamp", "me"]), "effect");
  assertEquals(classifyMycVerb("some-future-verb"), "read");
});

Deno.test("classifyMycVerb — PARITY with myc x4A10 (skipped when submodule absent)", async () => {
  let myc: typeof import("../myc/src/x4A10_verb_effects.ts");
  try {
    myc = await import("../myc/src/x4A10_verb_effects.ts");
  } catch {
    // submodule not checked out (e.g. decoupled CI) — parity unverifiable here.
    return;
  }
  for (const [verb, effect] of Object.entries(myc.VERB_EFFECTS)) {
    assertEquals(
      classifyMycVerb(verb),
      effect,
      `mirror drift: trinity classifies '${verb}' differently than myc x4A10`,
    );
  }
  const authoritativeEffects = Object.entries(myc.VERB_EFFECTS)
    .filter(([, effect]) => effect === "effect")
    .map(([verb]) => verb)
    .sort();
  assertEquals(
    [...MYC_EFFECTFUL].sort(),
    authoritativeEffects,
    "trinity effect mirror has missing or ghost verbs",
  );
  // the flag-sensitive case must agree too
  assertEquals(
    classifyMycVerb("coord", ["--stamp"]),
    myc.classify("coord", ["--stamp"]),
  );
});
