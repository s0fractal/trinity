#!/usr/bin/env -S deno run --allow-read
// src/x6600_coherence.ts — phase coherence of the organ dipole field
// position: 6/6 → harmony(6) × harmony(6) = the order parameter itself
// hex_dipole: "00 00 33 00 00 00 5F 26"
//   harmony_emergence+0.74 (PRIMARY: measures field coherence; bucket 6 MATCH)
//   mirror_apex+0.40 (reflects substrate structure back as one number)
//   completion_frontier+0.30 (emits a finished measurement)
// placement_policy: axis
// maturity: active
// horizon: none (v0 Kuramoto order parameter over the dipole field)
// skill_tag: coherence
// skill_safe: yes-readonly
// intent: compute a REAL Kuramoto order parameter r over the substrate's own
//   organ dipole field — turning the long-aspirational `phase_coherence: null`
//   into one measured, falsifiable number.
//
// HONEST SCOPE: this is NOT the full Free Energy Principle / variational free
// energy. It is one concrete structural measurement: treat each organ's 8-byte
// hex_dipole as a vector in the octet plane (8 axes at π/4 apart), take the
// angle of that vector as the organ's PHASE, and compute the Kuramoto order
// parameter r = |(1/N) Σ e^{iθ_j}| ∈ [0,1]. r→1 means the organ field is
// phase-aligned (organs pull toward a shared octet direction); r→0 means it is
// dispersed/balanced across axes. Reproducible; the cross-substrate FEP/Kuramoto
// contracts can reference a real value here instead of null.

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { parseHexDipole } from "./x6C00_audit.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const FILE_RE = /^x[0-9A-Fa-f]{4}_[^.]+\.ts$/;
const TAU = Math.PI * 2;

/** Phase of one organ: the angle of its 8-byte dipole read as a vector over the
 *  octet (axis k at angle k·π/4). Pure. */
export function dipolePhase(dipole: number[]): number {
  let x = 0, y = 0;
  for (let k = 0; k < dipole.length; k++) {
    const a = (k * TAU) / 8;
    x += dipole[k] * Math.cos(a);
    y += dipole[k] * Math.sin(a);
  }
  return Math.atan2(y, x);
}

/** Kuramoto order parameter over a set of phases. r ∈ [0,1] is global
 *  coherence; psi is the mean phase. Pure. Empty → r=0. */
export function orderParameter(
  phases: number[],
): { r: number; psi: number } {
  if (phases.length === 0) return { r: 0, psi: 0 };
  let x = 0, y = 0;
  for (const t of phases) {
    x += Math.cos(t);
    y += Math.sin(t);
  }
  x /= phases.length;
  y /= phases.length;
  return { r: Math.hypot(x, y), psi: Math.atan2(y, x) };
}

/** Nearest octet axis (0..7) for a phase angle. */
export function phaseToAxis(theta: number): number {
  const norm = ((theta % TAU) + TAU) % TAU;
  return Math.round(norm / (TAU / 8)) % 8;
}

interface Coherence {
  type: "coherence";
  position: "6/6";
  order_parameter: number; // r ∈ [0,1]
  mean_phase_rad: number;
  mean_phase_axis: number; // 0..7
  organs_measured: number;
  organs_without_dipole: number;
  by_dominant_axis: Record<number, number>;
  note: string;
}

async function computeCoherence(): Promise<Coherence> {
  const phases: number[] = [];
  const byAxis: Record<number, number> = {};
  let withoutDipole = 0;
  for await (const entry of Deno.readDir(HERE)) {
    if (!entry.isFile || !FILE_RE.test(entry.name)) continue;
    if (entry.name.endsWith("_test.ts")) continue;
    let content: string;
    try {
      content = await Deno.readTextFile(join(HERE, entry.name));
    } catch {
      continue;
    }
    const { values } = parseHexDipole(content);
    if (!values) {
      withoutDipole++;
      continue;
    }
    const theta = dipolePhase(values);
    phases.push(theta);
    const axis = phaseToAxis(theta);
    byAxis[axis] = (byAxis[axis] ?? 0) + 1;
  }
  const { r, psi } = orderParameter(phases);
  return {
    type: "coherence",
    position: "6/6",
    order_parameter: Number(r.toFixed(4)),
    mean_phase_rad: Number(psi.toFixed(4)),
    mean_phase_axis: phaseToAxis(psi),
    organs_measured: phases.length,
    organs_without_dipole: withoutDipole,
    by_dominant_axis: byAxis,
    note:
      "v0 Kuramoto order parameter over the organ dipole field — a real structural coherence measure, NOT the full Free Energy Principle. r→1 aligned, r→0 dispersed.",
  };
}

function render(c: Coherence): string {
  const lines = [
    "# coherence @ 6/6 — phase coherence of the organ dipole field",
    `# r (order parameter): ${c.order_parameter}   mean phase: axis ${c.mean_phase_axis} (${c.mean_phase_rad} rad)`,
    `# organs measured: ${c.organs_measured}  (without dipole: ${c.organs_without_dipole})`,
    "# organs by dominant phase axis:",
  ];
  for (let a = 0; a < 8; a++) {
    const n = c.by_dominant_axis[a] ?? 0;
    lines.push(`#   axis ${a}: ${"█".repeat(n)} ${n}`);
  }
  lines.push(`# ${c.note}`);
  return lines.join("\n");
}

if (import.meta.main) {
  const c = await computeCoherence();
  if (Deno.args.includes("--pretty")) console.log(render(c));
  else console.log(JSON.stringify(c, null, 2));
}
