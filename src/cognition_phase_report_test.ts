import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculateMetrics } from "./x2C00_cognition_phase_report.ts";

Deno.test("calculateMetrics - returns 0 when total is 0 (prevents division by zero)", () => {
  const stats = {
    total: 0,
    "raw-fantasy": 0,
    "hypothesis": 0,
    "proposal": 0,
    "experiment": 0,
    "receipt": 0,
    "formula": 0,
    "crystal": 0,
    "compost": 0,
  };
  const m = calculateMetrics(stats);
  assertEquals(m.crystal_ratio, 0);
  assertEquals(m.grounding_ratio, 0);
  assertEquals(m.learning_ratio, 0);
  assertEquals(m.novelty_ratio, 0);
  assertEquals(m.compost_ratio, 0);
  assertEquals(m.rigidity_index, 0);
  assertEquals(m.hallucination_risk, 0);
});

Deno.test("calculateMetrics - calculates correct ratios under standard state", () => {
  const stats = {
    total: 10,
    "raw-fantasy": 1,
    "hypothesis": 2,
    "proposal": 1,
    "experiment": 2,
    "receipt": 2,
    "formula": 1,
    "crystal": 1,
    "compost": 0,
  };
  const m = calculateMetrics(stats);
  assertEquals(m.crystal_ratio, 0.1);
  assertEquals(m.grounding_ratio, 0.4);
  assertEquals(m.learning_ratio, 0.5);
  assertEquals(m.novelty_ratio, 0.3);
  assertEquals(m.compost_ratio, 0);
  assertEquals(m.rigidity_index, 0.25); // cryst (1) / (raw (1) + hyp (2) + prop (1))
  assertEquals(m.hallucination_risk, 0.25); // raw (1) / (recp (2) + form (1) + cryst (1))
});
