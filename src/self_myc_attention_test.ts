import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { summarizeMycAttention } from "./x2F00_self.ts";

Deno.test("self — myc attention includes judgment states, not settled activity", () => {
  const summary = summarizeMycAttention({
    counts: { proposed: 2, applied: 3, resonant: 1, evidence_verified: 1 },
    mutations: [
      { id: "p1", kind: "proposal", state: "proposed", active: true },
      { id: "a1", kind: "apply", state: "applied", active: true },
      {
        id: "q1",
        kind: "resolution",
        state: "evidence_verified",
        active: true,
      },
    ],
  });

  assertEquals(summary?.requires_attention, 3);
  assertEquals(summary?.by_state, { proposed: 2, evidence_verified: 1 });
  assertEquals(summary?.sample.map((x) => x.id), ["p1", "q1"]);
});

Deno.test("self — absent myc remains an honest optional boundary", () => {
  assertEquals(summarizeMycAttention(null), null);
});
