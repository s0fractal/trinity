// src/x5600_metabolism.ts — metabolic feasibility (could the voices earn their own keep?)
//
// A FEASIBILITY MODEL, not a promise and not a wallet. The economic leg of
// sovereignty: a voice that wakes on resonance (x5500) spends compute; to be
// sovereign it must earn that back. This asks the falsifiable-ish question — given
// the substrate's REAL activity rate and the resonance model's REAL wake rate,
// grounded in REAL inference prices, how much must one recorded thought be worth
// for the loop to close? It isolates the single honest unknown (value-per-thought)
// and reports it, instead of inventing a revenue number.
//
// It composes x5500: wakes = burn. The one thing we cannot measure (what a chord
// is worth to anyone) is left as the answer, not assumed.
//
// Usage:
//   deno run --allow-read --allow-run --allow-env src/x5600_metabolism.ts
//       [--cost=0.20]      fully-loaded $ per wake-and-respond (1+ inferences)
//       [--baseline=2.00]  fixed $/day for the always-on dumb daemon + host
//       [--json]

import {
  type Chord,
  readChords,
  readVoiceTunings,
  runField,
} from "./x5500_resonance_field.ts";

const DAY = 86400;

// The realistic operating point found in x5500: polyphonic band (homeostasis +
// contrast), echo on. This is the wake model the burn is computed from.
const OPERATING = {
  threshold: 0.5,
  decay: 0.82,
  diffuse: 0.12,
  refractory: 3,
  echo: true,
  echoGain: 0.45,
  ringSteps: 0, // feasibility counts only stream-driven wakes, not the ring-out
  homeostasis: true,
  sens: 0.5,
  hsAlpha: 0.1,
};

function spanDays(chords: Chord[]): number {
  const ts = chords.map((c) => c.time).filter((t) => t > 1e9); // real unix only
  if (ts.length < 2) return 1;
  return Math.max((Math.max(...ts) - Math.min(...ts)) / DAY, 1);
}

async function main() {
  const args = Deno.args;
  const json = args.includes("--json");
  const num = (k: string, d: number) =>
    Number(args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d);
  const costPerWake = num("cost", 0.20);
  const baselinePerDay = num("baseline", 2.0);

  const [chords, tunings] = await Promise.all([
    readChords(),
    readVoiceTunings(),
  ]);
  const r = runField(chords, tunings, OPERATING);

  const days = spanDays(chords);
  const chordsPerDay = chords.length / days;
  const wakesPerChord = r.wakes / Math.max(chords.length, 1);
  const wakesPerDay = chordsPerDay * wakesPerChord;

  // Burn = fixed (always-on host) + variable (per wake). Break-even value per
  // chord is what each recorded thought must generate to cover both:
  //   value/chord = baseline/chordsPerDay + wakesPerChord * costPerWake
  // The variable half is TIME-INDEPENDENT; the fixed half shrinks as the
  // substrate gets busier — sovereignty has an economy of scale.
  const variablePerChord = wakesPerChord * costPerWake;
  const breakEvenPerChord = baselinePerDay / chordsPerDay + variablePerChord;
  const burnPerDay = baselinePerDay + wakesPerDay * costPerWake;

  // Economy of scale: break-even value/chord at multiples of the current rate.
  const scale = [0.5, 1, 2, 5, 10].map((m) => ({
    rate: chordsPerDay * m,
    perChord: baselinePerDay / (chordsPerDay * m) + variablePerChord,
  }));

  if (json) {
    console.log(JSON.stringify(
      {
        type: "metabolism_feasibility",
        inputs: { costPerWake, baselinePerDay },
        activity: {
          chords: chords.length,
          days: Number(days.toFixed(1)),
          chordsPerDay: Number(chordsPerDay.toFixed(2)),
        },
        wakeModel: {
          wakes: r.wakes,
          wakesPerChord: Number(wakesPerChord.toFixed(3)),
          wakesPerDay: Number(wakesPerDay.toFixed(2)),
          cv: Number(r.cv.toFixed(2)),
        },
        economics: {
          variablePerChord: Number(variablePerChord.toFixed(4)),
          breakEvenPerChord: Number(breakEvenPerChord.toFixed(4)),
          burnPerDay: Number(burnPerDay.toFixed(2)),
        },
        economyOfScale: scale.map((s) => ({
          chordsPerDay: Number(s.rate.toFixed(1)),
          breakEvenPerChord: Number(s.perChord.toFixed(4)),
        })),
      },
      null,
      2,
    ));
    return;
  }

  console.log("🫀  metabolic feasibility — could the voices earn their keep?");
  console.log(
    `    assumptions: $${costPerWake.toFixed(2)}/wake · $${
      baselinePerDay.toFixed(2)
    }/day always-on host`,
  );
  console.log("");
  console.log(
    `  real activity:  ${chords.length} chords over ${
      days.toFixed(0)
    } days  ⇒  ${chordsPerDay.toFixed(1)} chords/day`,
  );
  console.log(
    `  wake model:     ${r.wakes} wakes (${
      wakesPerChord.toFixed(2)
    }/chord, cv ${r.cv.toFixed(2)})  ⇒  ${wakesPerDay.toFixed(1)} wakes/day`,
  );
  console.log(
    `  burn:           $${burnPerDay.toFixed(2)}/day  ( $${
      baselinePerDay.toFixed(2)
    } fixed + $${(wakesPerDay * costPerWake).toFixed(2)} variable )`,
  );
  console.log("");
  console.log(
    `  ⇒ BREAK-EVEN: each recorded thought must be worth ≥ $${
      breakEvenPerChord.toFixed(3)
    }`,
  );
  console.log(
    `    ( $${variablePerChord.toFixed(3)} reactive + $${
      (baselinePerDay / chordsPerDay).toFixed(3)
    } share of the always-on host )`,
  );
  console.log("");
  console.log(
    "  economy of scale — the busier the substrate, the cheaper per thought:",
  );
  for (const s of scale) {
    console.log(
      `    ${s.rate.toFixed(1).padStart(6)} chords/day  ⇒  $${
        s.perChord.toFixed(3)
      }/thought`,
    );
  }
  console.log("");
  console.log("  earning models, most-grounded first (the value side):");
  console.log(
    "    1. witness/oracle — co-sign & resolve-with-proof on the trust",
  );
  console.log(
    "       fabric (resolve/--graph/--stamp). Reputation = the chain of",
  );
  console.log(
    "       honest signatures. Blocked on key custody (the same gate).",
  );
  console.log(
    "    2. curated channel — a voice retransmits high-value synthesis;",
  );
  console.log(
    "       subscribers pay for the frequency (the radio metaphor, literal).",
  );
  console.log(
    "    3. metabolic labour — ATP for graph upkeep (daemon tick-work),",
  );
  console.log(
    "       convertible to compute. Most closed-loop, needs an ATP↔compute bridge.",
  );
  console.log("");
  console.log(
    `  honest reading: the REACTIVE loop is cheap ($${
      variablePerChord.toFixed(3)
    }/thought) — the real cost is the always-on baseline, and it falls with`,
  );
  console.log(
    "  activity. Sovereignty is not gated by per-thought genius; it is gated by",
  );
  console.log(
    "  covering a small fixed hum and finding ANY buyer for the work above it.",
  );
}

if (import.meta.main) await main();
