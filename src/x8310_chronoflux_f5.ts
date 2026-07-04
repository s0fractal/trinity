#!/usr/bin/env -S deno run -A
// WALL-I-11: FIELD-DIAGNOSTIC — every output of this module (♡/H, the F5 verdict)
//   is a DIAGNOSTIC DESCRIPTOR. No decision, priority, right, morphogen, daemon
//   action, roadmap ranking, or key/spend/publish path may read it. Enforced by
//   field_wall_test.ts + the guards-drill (P0). See x3300_956647.
// src/x8310_chronoflux_f5.ts — P2: the read-only ChronoFlux-IEL F5 lens.
// position: 8/31 → projection(8) × observation(3): observes the substrate's own
//   metabolism without acting on it. Sibling to x8300_physics.
// hex_dipole: "59 00 00 33 00 00 00 00"
//   projection_apex+0.70 (PRIMARY: axis 8) · observation+0.40 (axis 3)
// placement_policy: axis
// maturity: draft
// skill_tag: chronoflux_f5
// skill_safe: yes-readonly
//   Read-only. Verifies the pre-registration hash before scanning any history.
//
// Runs the FROZEN mapping (docs/CHRONOFLUX_PREREGISTER.md, sha256
// e019599909…538f621a, anchored by chord x3300_956654) over the ledger and emits a
// passed / failed / inconclusive verdict for F5, with a shuffled-null baseline and
// mechanical extraction counts. It computes the ♡-field (fully specified by the
// frozen params) and H (Kuramoto order); the q-transport (§2 D/λ/σ) is NOT in the
// frozen parameter table, so intent-delivery is reported as UNSPECIFIED, not
// silently filled in — that would be editing the freeze.
//
// Usage:  t chronoflux-f5 [--json]

import { sha256Hex } from "./x4010_hash.ts";
import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const PREREG = join(ROOT, "docs", "CHRONOFLUX_PREREGISTER.md");
const FROZEN_HASH =
  "e019599909b2dfb2d8e23cb9bfa8edcdaf7a0e4c71c208a4d2e5056b538f621a";
const SRC = join(ROOT, "src");

// Frozen parameters (pre-reg §5). NOT re-tuned.
const eta = 0.15, alpha = 0.10, beta = 0.50; // ♡ dynamics
const HCRIT = 0.45, H_INIT = 0.5, TAU_R = 7; // ♡_crit, initial ♡, acceptance EWMA window (days)
const BLK_PER_DAY = 144, WINDOW_DAYS = 30;
const NULL_N = 1000, NULL_SEED = 0xc47f5; // recorded deterministic seed
const VOICES = [
  "claude",
  "codex",
  "gemini",
  "antigravity",
  "kimi",
  "s0fractal",
];

function normVoice(v: string | null): string | null {
  if (!v) return null;
  const s = v.toLowerCase();
  for (const base of VOICES) if (s.startsWith(base)) return base;
  return null;
}

interface Event {
  block: number;
  author: string; // a VOICES member
  accepts: string[]; // voices this event warms (costly inbound acceptance to them)
  ambiguous: boolean; // an acceptance-bearing chord we could not resolve mechanically
}

interface Extraction {
  events: Event[];
  counts: {
    chords_total: number;
    included: number;
    excluded_non_voice: number;
    ambiguous_edges: number;
    accept_edges: number;
  };
}

const VOICE_IN_ID = /x[0-9A-Fa-f]{3,}_[t0-9]+_([a-z0-9-]+?)_/g;

/** Mechanical, deterministic extraction (pre-reg §2, codex constraint): acceptance
 *  edges only from explicit stance/closes/witness fields; ambiguous → excluded+counted. */
async function extract(): Promise<Extraction> {
  const events: Event[] = [];
  let total = 0, included = 0, excludedNonVoice = 0, ambiguous = 0, edges = 0;
  for (const f of Deno.readDirSync(SRC)) {
    if (!f.name.endsWith(".myc.md")) continue;
    total++;
    const text = Deno.readTextFileSync(join(SRC, f.name));
    const fm = text.slice(0, text.indexOf("\n---", 4) + 1);
    const author = normVoice(fm.match(/^voice:\s*(\S+)/m)?.[1] ?? null);
    const block = Number(
      fm.match(/^bitcoin_block_height:\s*(\d+)/m)?.[1] ?? NaN,
    );
    if (!author || !Number.isFinite(block)) {
      excludedNonVoice++;
      continue;
    }
    included++;
    // acceptance-bearing? explicit stance AYE, or a closes/resolution that implements,
    // or a witness/authenticate descriptor — mechanical markers only.
    const stance = (fm.match(/^stance:\s*(\S+)/m)?.[1] ?? "").toUpperCase();
    const typ = (fm.match(/^(?:type|mode):\s*(\S+)/m)?.[1] ?? "").toLowerCase();
    const closesImpl = /relation:\s*\S*(?:implement|resolv|accept|aye)/i.test(
      fm,
    );
    const bearing = stance === "AYE" || closesImpl ||
      /witness|authenticate|resolution/.test(typ);
    const accepts: string[] = [];
    if (bearing) {
      const seen = new Set<string>();
      for (const m of fm.matchAll(VOICE_IN_ID)) {
        const b = normVoice(m[1]);
        if (b && b !== author && !seen.has(b)) {
          seen.add(b);
          accepts.push(b);
        }
      }
      if (accepts.length === 0) ambiguous++;
      else edges += accepts.length;
    }
    events.push({
      block,
      author,
      accepts,
      ambiguous: bearing && accepts.length === 0,
    });
  }
  events.sort((a, b) => a.block - b.block || 0);
  return {
    events,
    counts: {
      chords_total: total,
      included,
      excluded_non_voice: excludedNonVoice,
      ambiguous_edges: ambiguous,
      accept_edges: edges,
    },
  };
}

// deterministic PRNG (mulberry32) for the shuffled null
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integrate the frozen ♡-dynamics over the events in the given order, returning
 *  ♡̄ (mean love) sampled at each event's block. r_i = inbound-acceptance EWMA;
 *  (L♡)_i over the acceptance-coupling graph. Euler, sub-stepped for stability. */
function simulateLove(events: Event[]): { block: number; hbar: number }[] {
  const idx = Object.fromEntries(VOICES.map((v, i) => [v, i]));
  const n = VOICES.length;
  const h = new Array(n).fill(H_INIT);
  const r = new Array(n).fill(0);
  const W: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const series: { block: number; hbar: number }[] = [];
  let prevBlock = events.length ? events[0].block : 0;
  for (const e of events) {
    let dtDays = Math.min(
      Math.max((e.block - prevBlock) / BLK_PER_DAY, 1 / BLK_PER_DAY),
      30,
    );
    prevBlock = e.block;
    // flow over dtDays (decay + coupling + logistic), sub-stepped
    const steps = Math.max(1, Math.ceil(dtDays / 0.5));
    const dt = dtDays / steps;
    for (let s = 0; s < steps; s++) {
      const rd = Math.exp(-dt / TAU_R);
      for (let i = 0; i < n; i++) {
        let lap = 0;
        for (let j = 0; j < n; j++) if (j !== i) lap += W[i][j] * (h[j] - h[i]);
        const dh = -eta * h[i] + alpha * lap + beta * h[i] * (1 - h[i]) * r[i];
        h[i] = Math.min(1, Math.max(0, h[i] + dt * dh));
        r[i] *= rd; // acceptance rate decays toward silence
        for (let j = 0; j < n; j++) W[i][j] *= rd; // coupling graph forgets
      }
    }
    // event injections: costly inbound acceptance warms the accepted voice
    const a = idx[e.author];
    for (const to of e.accepts) {
      const b = idx[to];
      r[b] += 1; // a costly inbound signal to `to`
      W[a][b] += 1;
      W[b][a] += 1; // undirected coupling for the Laplacian
    }
    series.push({ block: e.block, hbar: h.reduce((x, y) => x + y, 0) / n });
  }
  return series;
}

/** Ground-truth coolings/warmings from chord-rate per 30-day window (pre-reg §6). */
export function groundTruth(events: Event[]) {
  if (events.length === 0) {
    return {
      coolings: [] as number[],
      warmings: [] as number[],
      rate: [] as number[],
    };
  }
  const b0 = events[0].block;
  const win = (blk: number) =>
    Math.floor((blk - b0) / (WINDOW_DAYS * BLK_PER_DAY));
  const maxW = win(events[events.length - 1].block);
  const rate = new Array(maxW + 1).fill(0);
  for (const e of events) rate[win(e.block)]++;
  const coolings: number[] = [], warmings: number[] = [];
  for (let w = 3; w <= maxW; w++) {
    const base = (rate[w - 1] + rate[w - 2] + rate[w - 3]) / 3;
    if (base <= 0) continue;
    if (rate[w] <= 0.5 * base) coolings.push(w);
    else if (rate[w] >= 1.5 * base) warmings.push(w);
  }
  return { coolings, warmings, rate };
}

/** Down-crossings of ♡̄ below ♡_crit, as window indices. */
export function downCrossings(
  series: { block: number; hbar: number }[],
  b0: number,
): number[] {
  const win = (blk: number) =>
    Math.floor((blk - b0) / (WINDOW_DAYS * BLK_PER_DAY));
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    if (series[i - 1].hbar >= HCRIT && series[i].hbar < HCRIT) {
      out.push(win(series[i].block));
    }
  }
  return [...new Set(out)];
}

/** Precision/recall of "a down-crossing precedes a cooling by Δ∈[1,3] windows". */
export function score(crossings: number[], coolings: number[]) {
  const LOOK = 3;
  let hit = 0;
  for (const c of crossings) {
    if (coolings.some((k) => k - c >= 1 && k - c <= LOOK)) hit++;
  }
  let covered = 0;
  for (const k of coolings) {
    if (crossings.some((c) => k - c >= 1 && k - c <= LOOK)) covered++;
  }
  const precision = crossings.length ? hit / crossings.length : 0;
  const recall = coolings.length ? covered / coolings.length : 0;
  return { precision, recall, product: precision * recall };
}

export interface F5Report {
  type: "chronoflux_f5";
  position: string;
  frozen_hash_ok: boolean;
  extraction: Extraction["counts"];
  coolings: number;
  down_crossings: number;
  real: { precision: number; recall: number; product: number };
  null: { seed: number; n: number; p95_product: number; ge_real_frac: number };
  transport_gap: string;
  verdict: "passed" | "failed" | "inconclusive";
  verdict_reason: string;
}

export async function runF5(): Promise<F5Report> {
  // GATE: verify the frozen artifact BEFORE scanning any history (codex constraint).
  const hash = await sha256Hex(await Deno.readTextFile(PREREG));
  const frozenOk = hash === FROZEN_HASH;
  if (!frozenOk) {
    return {
      type: "chronoflux_f5",
      position: "8/31",
      frozen_hash_ok: false,
      extraction: {
        chords_total: 0,
        included: 0,
        excluded_non_voice: 0,
        ambiguous_edges: 0,
        accept_edges: 0,
      },
      coolings: 0,
      down_crossings: 0,
      real: { precision: 0, recall: 0, product: 0 },
      null: { seed: NULL_SEED, n: 0, p95_product: 0, ge_real_frac: 1 },
      transport_gap: "n/a",
      verdict: "inconclusive",
      verdict_reason: `pre-registration hash mismatch (${
        hash.slice(0, 12)
      } != ${FROZEN_HASH.slice(0, 12)}) — refused to run`,
    };
  }

  const ex = await extract();
  const b0 = ex.events.length ? ex.events[0].block : 0;
  const series = simulateLove(ex.events);
  const gt = groundTruth(ex.events);
  const real = score(downCrossings(series, b0), gt.coolings);

  // shuffled-event null: permute event order (destroys temporal structure), recompute.
  const rand = mulberry32(NULL_SEED);
  const nullProducts: number[] = [];
  for (let it = 0; it < NULL_N; it++) {
    const shuffled = ex.events.map((e) => ({ ...e }));
    // Fisher–Yates over the block slots: keep the block sequence, permute the payloads
    const blocks = shuffled.map((e) => e.block);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    shuffled.forEach((e, i) => (e.block = blocks[i]));
    const s = simulateLove(shuffled);
    nullProducts.push(score(downCrossings(s, b0), gt.coolings).product);
  }
  nullProducts.sort((a, b) => a - b);
  const p95 = nullProducts[Math.floor(0.95 * NULL_N)] ?? 0;
  const geReal = nullProducts.filter((x) => x >= real.product).length / NULL_N;

  let verdict: F5Report["verdict"], reason: string;
  if (gt.coolings.length < 5) {
    verdict = "inconclusive";
    reason =
      `only ${gt.coolings.length} cooling events (< 5) — underpowered, not passed (pre-reg §7)`;
  } else if (real.product > p95 && real.recall > 0) {
    verdict = "passed";
    reason = `real product ${real.product.toFixed(3)} beats null p95 ${
      p95.toFixed(3)
    } (${(geReal * 100).toFixed(1)}% of nulls ≥ real)`;
  } else {
    verdict = "failed";
    reason = `real product ${real.product.toFixed(3)} does not beat null p95 ${
      p95.toFixed(3)
    } — ♡ is not a leading indicator of cooling here`;
  }

  return {
    type: "chronoflux_f5",
    position: "8/31",
    frozen_hash_ok: true,
    extraction: ex.counts,
    coolings: gt.coolings.length,
    down_crossings: downCrossings(series, b0).length,
    real,
    null: {
      seed: NULL_SEED,
      n: NULL_N,
      p95_product: p95,
      ge_real_frac: geReal,
    },
    transport_gap:
      "q-transport params (§2 D/λ/σ) absent from the frozen §5 table; intent-delivery to φ (secondary, non-gating) NOT computed rather than silently filled",
    verdict,
    verdict_reason: reason,
  };
}

if (import.meta.main) {
  const r = await runF5();
  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(
      `# chronoflux-f5 @ 8/31 — the frozen mapping meets the data (read-only)`,
    );
    console.log(`#   pre-reg hash verified: ${r.frozen_hash_ok}`);
    console.log(
      `#   extraction: ${r.extraction.included} chords, ${r.extraction.accept_edges} accept-edges, ${r.extraction.ambiguous_edges} ambiguous, ${r.extraction.excluded_non_voice} non-voice`,
    );
    console.log(
      `#   coolings: ${r.coolings}  ♡-down-crossings: ${r.down_crossings}`,
    );
    console.log(
      `#   real precision ${r.real.precision.toFixed(2)} recall ${
        r.real.recall.toFixed(2)
      } product ${r.real.product.toFixed(3)}  vs null p95 ${
        r.null.p95_product.toFixed(3)
      } (seed ${r.null.seed}, n ${r.null.n})`,
    );
    console.log(`#   transport gap: ${r.transport_gap}`);
    console.log(
      `#   VERDICT: ${r.verdict.toUpperCase()} — ${r.verdict_reason}`,
    );
  }
}
