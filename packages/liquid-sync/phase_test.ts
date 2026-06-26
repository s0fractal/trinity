import { assert, assertEquals } from "jsr:@std/assert@^1";
import {
  calculateResonance,
  covenantSeeds,
  floatToPhase,
  initCovenant,
  lookupCos,
  lookupCosDirect,
  phaseToFloat,
  PI_INT,
} from "./phase.ts";

Deno.test("phase — default (no covenant) LUT is the real cosine", () => {
  initCovenant();
  assertEquals(covenantSeeds().combined, 0);
  assert(Math.abs(lookupCos(0) - 32767) < 100, "cos(0) ≈ +1");
  assert(Math.abs(lookupCos(PI_INT) + 32767) < 300, "cos(π) ≈ -1");
});

Deno.test("phase — a covenant rewrites the physics (governance is physics)", () => {
  initCovenant({ covenant: "constitution: right to refuse" });
  const seedA = covenantSeeds().combined;
  const lutA: number[] = [];
  for (let phi = 0; phi < 65536; phi += 256) lutA.push(lookupCosDirect(phi));

  initCovenant({ covenant: "constitution: NO right to refuse" });
  const seedB = covenantSeeds().combined;

  assert(seedA !== 0 && seedB !== 0, "covenants seed the physics");
  assert(seedA !== seedB, "different covenants → different seeds");

  let diffs = 0;
  let i = 0;
  for (let phi = 0; phi < 65536; phi += 256, i++) {
    if (lookupCosDirect(phi) !== lutA[i]) diffs++;
  }
  assert(diffs > 0, "different covenants produce a different LUT");

  initCovenant(); // reset shared module state
});

Deno.test("phase — axioms are part of the physics", () => {
  initCovenant({ covenant: "C", axioms: "with right to refuse" });
  const a = covenantSeeds().combined;
  initCovenant({ covenant: "C", axioms: "without right to refuse" });
  const b = covenantSeeds().combined;
  assert(a !== b, "same covenant, different axioms → different physics");
  initCovenant();
});

Deno.test("phase — resonance is high for aligned, low for opposed, zero for no energy", () => {
  initCovenant();
  const aligned = calculateResonance(1000, 1000, 65535);
  const opposed = calculateResonance(1000, (1000 + PI_INT) & 0xFFFF, 65535);
  assert(aligned > opposed, "aligned phases resonate more than opposed");
  assertEquals(
    calculateResonance(1000, 2000, 0),
    0,
    "no energy → no resonance",
  );
});

Deno.test("phase — float↔phase round-trips", () => {
  const phi = floatToPhase(Math.PI);
  assert(Math.abs(phi - PI_INT) <= 1);
  assert(Math.abs(phaseToFloat(phi) - Math.PI) < 0.001);
});
