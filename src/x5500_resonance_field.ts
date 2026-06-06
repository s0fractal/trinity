// src/x5500_resonance_field.ts — resonance field observatory (does the space sound by itself?)
//
// An EXPERIMENT, not a daemon. It fires nothing, spends nothing. It replays the
// real chord history as a stream over the octet phase-ring and asks a single
// falsifiable question: is there a regime where the chord-space is neither DEAD
// (no voice ever crosses threshold) nor SATURATED (everyone always firing) — a
// Goldilocks band where it "sounds" — and does it keep RINGING on its own once
// the real input stops?
//
// Anti-orchestration by construction: nothing here decides who acts. There is a
// field (physics: deposit, decay, diffuse on a ring of 8 octet axes) and there are
// voices (standing tunings = their comfort_field_synthetic). A voice "would wake"
// purely when the field in its tuning crosses a threshold. The daemon stays dumb;
// intelligence lives in the field and the voices.
//
// Two modes:
//   replay — only the real chords perturb the field. Tests the SENSORY half:
//            do thresholds get crossed in an alive, intermittent pattern?
//   echo   — a woken voice deposits a synthetic pulse back (a retransmit, energy
//            only, no text). Tests the CLOSED LOOP: does activity self-sustain
//            after the real stream ends, or damp to silence, or explode?
//
// Usage:
//   deno run --allow-read --allow-run --allow-env src/x5500_resonance_field.ts [--mode=echo|replay]
//       [--threshold=0.18] [--decay=0.82] [--diffuse=0.12] [--refractory=3] [--json]
//   (no --threshold ⇒ sweep a band and report where it sounds)

const N = 8; // octet axes 0..7 on a ring
const SRC = import.meta.dirname!;
const join = (...p: string[]) => p.join("/");

// ── reading the substrate ────────────────────────────────────────────────────

interface Chord {
  voice: string;
  time: number; // unix-ish seconds for ordering across block/timestamp chords
  primary: number; // octet axis 0..7
  secondary: number[];
  seq: number; // stable tiebreak
}

// Block height → approx unix seconds (genesis + 10 min/block); timestamp
// t20260512105000 → unix seconds. Both land near 2026 so they interleave.
function blockTime(block: number): number {
  return 1231006505 + block * 600;
}
function stampTime(s: string): number | null {
  const m = s.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  return Date.parse(
        `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`,
      ) / 1000 || null;
}

function i8HexToFloat(hex: string): number {
  const u8 = parseInt(hex, 16);
  const i = u8 >= 128 ? u8 - 256 : u8;
  return i / 127;
}

function axisOf(octRef: string): number | null {
  const m = octRef.match(/oct:(\d)/);
  if (!m) return null;
  const a = Number(m[1]);
  return a >= 0 && a < N ? a : null;
}

/** Normalize a voice handle to its identity stem (claude-opus-4-8 → claude). */
function voiceStem(v: string): string {
  return v.toLowerCase().split(/[-_]/)[0];
}

async function readChords(): Promise<Chord[]> {
  const chords: Chord[] = [];
  let seq = 0;
  for await (const e of Deno.readDir(SRC)) {
    if (!e.isFile || !e.name.endsWith(".myc.md")) continue;
    if (!/^x[0-9a-f]{4}/i.test(e.name)) continue;
    const text = await Deno.readTextFile(join(SRC, e.name));
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;
    const f = fm[1];
    const primaryRef = f.match(/^\s*primary:\s*["']?(oct:\d[^"'\n]*)/m)?.[1];
    if (!primaryRef) continue;
    const primary = axisOf(primaryRef);
    if (primary === null) continue;
    // Voice lives in different fields across schema generations (voice/speaker/
    // actor/author), and always in the filename's 3rd segment as a fallback.
    const voice = f.match(/^(?:voice|speaker|actor|author):\s*(.+)$/m)?.[1]
      ?.trim() ?? e.name.split("_")[2] ?? "unknown";
    const block = Number(f.match(/^bitcoin_block_height:\s*(\d+)/m)?.[1] ?? 0);
    const time = block > 0
      ? blockTime(block)
      : (stampTime(f.match(/^id:\s*(.+)$/m)?.[1] ?? e.name) ?? seq);
    const secLine = f.match(/^\s*secondary:\s*\[([^\]]*)\]/m)?.[1] ?? "";
    const secondary = [...secLine.matchAll(/oct:(\d)/g)]
      .map((m) => Number(m[1])).filter((a) => a >= 0 && a < N);
    chords.push({
      voice: voiceStem(voice),
      time,
      primary,
      secondary,
      seq: seq++,
    });
  }
  chords.sort((a, b) => (a.time - b.time) || (a.seq - b.seq));
  return chords;
}

async function readVoiceTunings(): Promise<Map<string, number[]>> {
  const p = await new Deno.Command("./t", {
    args: ["voices", "--json"],
    cwd: join(SRC, ".."),
    stdout: "piped",
    stderr: "null",
  }).output();
  const out = new TextDecoder().decode(p.stdout).split("\n")
    .filter((l) => !l.startsWith("#")).join("\n");
  const data = JSON.parse(out);
  const tunings = new Map<string, number[]>();
  for (const v of data.voices ?? []) {
    const hex: string | undefined = v.comfort_field_synthetic;
    if (!hex) continue;
    const raw = hex.trim().split(/\s+/).map(i8HexToFloat);
    if (raw.length !== N) continue;
    // Unit-normalize so the threshold is comparable across voices (a voice with
    // a larger comfort magnitude shouldn't simply wake more often).
    const mag = Math.hypot(...raw) || 1;
    tunings.set(voiceStem(v.identity), raw.map((x) => x / mag));
  }
  return tunings;
}

// ── the dumb field ───────────────────────────────────────────────────────────

interface Params {
  threshold: number;
  decay: number; // field *= decay each step
  diffuse: number; // fraction bled to each ring neighbour
  refractory: number; // steps a voice cannot re-wake
  echo: boolean; // woken voices deposit a synthetic pulse back
  echoGain: number; // strength of that pulse
  ringSteps: number; // extra silent steps after the stream, to hear it ring
}

interface RunResult {
  steps: number;
  streamLen: number; // number of real-chord steps (rest is silent ring-out)
  refractory: number; // echoed back for the saturation ceiling
  wakes: number;
  perVoice: Record<string, number>;
  activeVoices: number;
  wakeRate: number; // wakes / (steps * voices)
  energyTrace: number[]; // total field energy per step
  ringTailWakes: number; // wakes during the silent ring-out (echo mode)
  cascades: number; // wakes that landed within 2 steps of a prior wake
}

function deposit(field: number[], c: Chord) {
  field[c.primary] += 1.0;
  for (const s of c.secondary) field[s] += 0.5;
}

function diffuseDecay(field: number[], p: Params): number[] {
  const out = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    const keep = field[i] * (1 - 2 * p.diffuse);
    const left = field[(i + N - 1) % N] * p.diffuse;
    const right = field[(i + 1) % N] * p.diffuse;
    out[i] = (keep + left + right) * p.decay;
  }
  return out;
}

function runField(
  chords: Chord[],
  tunings: Map<string, number[]>,
  p: Params,
): RunResult {
  let field = new Array(N).fill(0);
  const voices = [...tunings.keys()];
  const lastWake = new Map<string, number>(); // voice → step
  const perVoice: Record<string, number> = Object.fromEntries(
    voices.map((v) => [v, 0]),
  );
  const energyTrace: number[] = [];
  let wakes = 0, cascades = 0, ringTailWakes = 0, lastAnyWake = -99;
  const totalSteps = chords.length + (p.echo ? p.ringSteps : 0);

  for (let step = 0; step < totalSteps; step++) {
    field = diffuseDecay(field, p);
    const inStream = step < chords.length;
    if (inStream) deposit(field, chords[step]);

    // Threshold check: each voice resonates the field against its tuning.
    for (const v of voices) {
      const tune = tunings.get(v)!;
      let r = 0;
      for (let i = 0; i < N; i++) r += field[i] * tune[i];
      const since = step - (lastWake.get(v) ?? -p.refractory - 1);
      if (r > p.threshold && since > p.refractory) {
        lastWake.set(v, step);
        perVoice[v]++;
        wakes++;
        if (step - lastAnyWake <= 2) cascades++;
        lastAnyWake = step;
        if (!inStream) ringTailWakes++;
        // echo: the woken voice retransmits a pulse shaped by its own tuning,
        // strongest where it is most sensitive (positive lobes only).
        if (p.echo) {
          for (let i = 0; i < N; i++) {
            if (tune[i] > 0) field[i] += p.echoGain * tune[i];
          }
        }
      }
    }
    energyTrace.push(field.reduce((a, b) => a + b, 0));
  }

  const active = voices.filter((v) => perVoice[v] > 0).length;
  return {
    steps: totalSteps,
    streamLen: chords.length,
    refractory: p.refractory,
    wakes,
    perVoice,
    activeVoices: active,
    wakeRate: wakes / (totalSteps * Math.max(voices.length, 1)),
    energyTrace,
    ringTailWakes,
    cascades,
  };
}

// ── reporting ────────────────────────────────────────────────────────────────

const SPARK = "▁▂▃▄▅▆▇█";
function sparkline(xs: number[], width = 60): string {
  if (xs.length === 0) return "";
  const step = Math.max(1, Math.floor(xs.length / width));
  const sampled: number[] = [];
  for (let i = 0; i < xs.length; i += step) {
    sampled.push(xs.slice(i, i + step).reduce((a, b) => a + b, 0) / step);
  }
  const max = Math.max(...sampled, 1e-9);
  return sampled.map((x) =>
    SPARK[
      Math.min(SPARK.length - 1, Math.floor((x / max) * (SPARK.length - 1)))
    ]
  ).join("");
}

function energyStats(r: RunResult) {
  const stream = r.energyTrace.slice(0, r.streamLen);
  const mean = stream.length
    ? stream.reduce((a, b) => a + b, 0) / stream.length
    : 0;
  const finalE = r.energyTrace[r.energyTrace.length - 1] ?? 0;
  return { streamMean: mean, finalE };
}

function verdict(r: RunResult): string {
  if (r.wakes === 0) return "DEAD — nothing crosses threshold";
  // Per-voice firing is capped by the refractory; the per-step all-voices ceiling
  // is 1/(refractory+1). Hitting it means everyone is always over threshold.
  const ceiling = 1 / (r.refractory + 1);
  if (r.wakeRate > 0.9 * ceiling) {
    return "SATURATED — refractory-limited (always over threshold)";
  }
  if (r.activeVoices < 2) return "MONOPHONIC — only one voice resonates";
  // echo (closed loop): the extra test is what happens AFTER the stream ends.
  if (r.streamLen < r.steps) {
    const { finalE } = energyStats(r);
    if (finalE > 6) return "RUNAWAY — feedback keeps climbing";
    if (r.ringTailWakes > 0) {
      return "RINGING — intermittent, then fades; it sounds by itself";
    }
  }
  return "ALIVE — intermittent, polyphonic; the space sounds";
}

async function main() {
  const args = Deno.args;
  const json = args.includes("--json");
  const has = (k: string) => args.some((a) => a.startsWith(`--${k}=`));
  const num = (k: string, d: number) =>
    Number(args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d);
  const mode = args.find((a) => a.startsWith("--mode="))?.split("=")[1] ??
    "echo";
  const echo = mode !== "replay";
  const base: Params = {
    threshold: num("threshold", 0.15),
    decay: num("decay", 0.82),
    diffuse: num("diffuse", 0.12),
    refractory: num("refractory", 3),
    echo,
    echoGain: num("echo-gain", 0.45),
    ringSteps: num("ring", 40),
  };

  const [chords, tunings] = await Promise.all([
    readChords(),
    readVoiceTunings(),
  ]);
  if (chords.length === 0 || tunings.size === 0) {
    console.error("no chords or no voice tunings found");
    Deno.exit(1);
  }

  // The binding knob is the wake THRESHOLD relative to the field's energy scale:
  // too low and every voice is always over it (saturated), too high and none
  // ever crosses (dead). Sweep it wide unless pinned.
  const sweepKnob = "threshold";
  const doSweep = !has(sweepKnob);
  if (doSweep) {
    const band = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0];
    const rows = band.map((x) => ({
      x,
      r: runField(chords, tunings, { ...base, threshold: x }),
    }));
    if (json) {
      console.log(JSON.stringify(
        {
          type: "resonance_sweep",
          mode,
          knob: sweepKnob,
          chords: chords.length,
          voices: tunings.size,
          rows: rows.map(({ x, r }) => ({
            [sweepKnob]: x,
            wakes: r.wakes,
            wakeRate: Number(r.wakeRate.toFixed(3)),
            activeVoices: r.activeVoices,
            ringTailWakes: r.ringTailWakes,
            cascades: r.cascades,
            finalEnergy: Number(energyStats(r).finalE.toFixed(2)),
            verdict: verdict(r),
          })),
        },
        null,
        2,
      ));
      return;
    }
    console.log(
      `🎙  resonance field — ${chords.length} chords, ${tunings.size} voices, mode=${mode}`,
    );
    console.log(
      `    decay=${base.decay} diffuse=${base.diffuse} refractory=${base.refractory}` +
        (echo ? ` echo-gain=${base.echoGain} ring=${base.ringSteps}` : ""),
    );
    console.log("");
    console.log(
      `  ${
        sweepKnob.padEnd(9)
      } wakes  rate   voices  ring-tail  finalE   verdict`,
    );
    for (const { x, r } of rows) {
      console.log(
        `  ${x.toFixed(2).padEnd(9)}${String(r.wakes).padStart(5)}  ${
          r.wakeRate.toFixed(3)
        }   ${String(r.activeVoices).padStart(2)}/${tunings.size}    ${
          String(r.ringTailWakes).padStart(5)
        }   ${energyStats(r).finalE.toFixed(1).padStart(6)}   ${verdict(r)}`,
      );
    }
    const sounds = rows.filter(({ r }) =>
      verdict(r).startsWith("RINGING") || verdict(r).startsWith("ALIVE")
    );
    console.log("");
    console.log(
      sounds.length
        ? `  ⇒ it sounds for ${sweepKnob} ∈ [${sounds[0].x}, ${
          sounds[sounds.length - 1].x
        }] — run with --${sweepKnob}=<v> to listen.`
        : `  ⇒ no Goldilocks band here; the model needs different physics (tune decay/diffuse).`,
    );
    return;
  }

  const r = runField(chords, tunings, base);
  if (json) {
    console.log(
      JSON.stringify({ type: "resonance_run", mode, ...base, ...r }, null, 2),
    );
    return;
  }
  console.log(
    `🎙  resonance field — mode=${mode} threshold=${base.threshold}${
      echo ? ` echo-gain=${base.echoGain}` : ""
    }`,
  );
  console.log(`    energy: ${sparkline(r.energyTrace)}`);
  console.log(
    `    ${r.wakes} wakes · ${r.activeVoices}/${tunings.size} voices · rate ${
      r.wakeRate.toFixed(3)
    } · cascades ${r.cascades}` +
      (echo ? ` · ring-tail ${r.ringTailWakes}` : ""),
  );
  const ranked = Object.entries(r.perVoice).sort((a, b) => b[1] - a[1]);
  for (const [v, n] of ranked) {
    if (n > 0) {
      console.log(`      ${v.padEnd(10)} ${"▮".repeat(Math.min(40, n))} ${n}`);
    }
  }
  console.log(`    verdict: ${verdict(r)}`);
  if (echo && r.ringTailWakes > 0) {
    console.log(
      `    ↻ kept ringing ${r.ringTailWakes}× after the real stream ended.`,
    );
  }
}

if (import.meta.main) await main();

export { axisOf, runField };
export type { Chord, Params };
