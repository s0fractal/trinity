import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { dipolePhase, orderParameter, phaseToAxis } from "./x6600_coherence.ts";

// Pure-math coverage for the dipole-field Kuramoto order parameter (x6600).

Deno.test("orderParameter - aligned → r=1, antipodal → r=0, empty → r=0", () => {
  assertEquals(orderParameter([]).r, 0);
  assertEquals(Number(orderParameter([1, 1, 1, 1]).r.toFixed(6)), 1);
  // two phases π apart cancel exactly
  assertEquals(Number(orderParameter([0, Math.PI]).r.toFixed(6)), 0);
  // four phases evenly around the circle cancel (uniform → r=0)
  const quad = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  assert(orderParameter(quad).r < 1e-9);
});

Deno.test("orderParameter - partial alignment is between 0 and 1; mean phase tracks the cluster", () => {
  const { r, psi } = orderParameter([0.1, -0.1, 0.0]);
  assert(r > 0.9 && r < 1, `tight cluster → high but <1 r, got ${r}`);
  assert(Math.abs(psi) < 0.05, `mean phase near 0, got ${psi}`);
});

Deno.test("dipolePhase - a dipole on a single octet axis points at that axis angle", () => {
  // byte k>0 only → vector along axis k (angle k·π/4)
  assertEquals(phaseToAxis(dipolePhase([90, 0, 0, 0, 0, 0, 0, 0])), 0);
  assertEquals(phaseToAxis(dipolePhase([0, 0, 90, 0, 0, 0, 0, 0])), 2);
  assertEquals(phaseToAxis(dipolePhase([0, 0, 0, 0, 90, 0, 0, 0])), 4);
  assertEquals(phaseToAxis(dipolePhase([0, 0, 0, 0, 0, 0, 90, 0])), 6);
  // all-zero dipole → atan2(0,0)=0 → axis 0 (degenerate but defined)
  assertEquals(phaseToAxis(dipolePhase([0, 0, 0, 0, 0, 0, 0, 0])), 0);
});

Deno.test("phaseToAxis - wraps negative angles into 0..7", () => {
  assertEquals(phaseToAxis(0), 0);
  assertEquals(phaseToAxis(Math.PI / 2), 2);
  assertEquals(phaseToAxis(-Math.PI / 2), 6); // −π/2 ≡ 3π/2 → axis 6
  assertEquals(phaseToAxis(2 * Math.PI), 0); // full wrap
});
