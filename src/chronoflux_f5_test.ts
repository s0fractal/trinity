import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { groundTruth, score } from "./x8310_chronoflux_f5.ts";

// Pure-logic guards for the F5 verdict machinery (the frozen dynamics run on real
// data via `t chronoflux-f5`; here we pin the scoring so a regression can't silently
// change a verdict). FIELD-DIAGNOSTIC outputs never gate anything (wall I-11).
Deno.test("chronoflux-f5 scoring — a crossing that precedes a cooling by Δ∈[1,3] scores", () => {
  // cooling at window 5, a down-crossing at window 3 → lead 2 (in [1,3]) → hit
  assertEquals(score([3], [5]).recall, 1);
  assert(score([3], [5]).precision > 0);
  // a crossing AFTER the cooling (lag) does not count
  assertEquals(score([7], [5]).product, 0);
});

Deno.test("chronoflux-f5 ground truth — needs ≥3 prior windows; a 50% drop is a cooling", () => {
  // windows with a clear drop after 3 steady ones
  const events = [];
  const W = 30 * 144;
  for (
    const [w, n] of [[0, 10], [1, 10], [2, 10], [3, 2]] as [number, number][]
  ) {
    for (let i = 0; i < n; i++) {
      events.push({
        block: 949000 + w * W + i,
        author: "claude",
        accepts: [],
        ambiguous: false,
      });
    }
  }
  const gt = groundTruth(events);
  assert(gt.coolings.includes(3), "a ≥50% rate drop in window 3 is a cooling");
});
