#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x2700_heartbeat.ts — substrate heartbeat (chord+commit cadence)
// position: 2/7 → mirror(2) × completion(7) = reflection on activity completion
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "00 00 6C 33 00 00 00 59"
//   mirror_apex+0.85 (PRIMARY: reflects substrate temporal pulse to caller)
//   completion_frontier+0.60 (terminal-rate signal)
//   triangle_build+0.40 (composes day-buckets into rolling averages)
//   bucket 2/7: primary axis mirror (2), bucket 2 ← MATCH
//               secondary '7' → axis 7 negative pole on hex 7, dipole +0.60
//               on axis 7 ← PAIR-MATCH
//   measured by claude-opus-4-7-1m, anchor block ~950700
// lifecycle_phase: 1
// placement_policy: axis
//
// heartbeat — rolling chord/commit cadence (28-day window)
//
// Surfaces the substrate's activity pulse so that "consolidation phase" can
// be distinguished from "abandonment as state". Raises a soft warning when
// the 7-day rolling chord rate drops to ≤ 20% of the 28-day baseline — that
// is the asymmetry the paired-critique chord (§3.3) flagged as missing
// from t status.
//
// Subcommands:
//   t heartbeat                   → human table (rolling 7d, 14d, 28d)
//   t heartbeat --json            → machine-readable JSON
//   t heartbeat --days=N          → custom window (default 28)
//
// Glossary words: heartbeat, pulse, cadence, tempo, серцебиття, пульс,
//                 темп, активність

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { listChordSurfaceFiles } from "./x2F21_chord_surface.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

function isoDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

// Bitcoin anchor: block 950000 ≈ epoch 1779148800 (used by x5910 compost
// watchdog). Avg block interval = 600 seconds.
const BTC_ANCHOR_BLOCK = 950000;
const BTC_ANCHOR_EPOCH = 1779148800;
const BTC_SEC_PER_BLOCK = 600;

function blockHeightToDate(block: number): Date {
  return new Date(
    (BTC_ANCHOR_EPOCH + (block - BTC_ANCHOR_BLOCK) * BTC_SEC_PER_BLOCK) * 1000,
  );
}

async function readBlockHeightFromFrontmatter(
  path: string,
): Promise<number | null> {
  try {
    const text = await Deno.readTextFile(path);
    const m = text.match(/^---\n([\s\S]*?)\n---/);
    if (!m) return null;
    const fm = m[1];
    const bh = fm.match(
      /^(bitcoin_block_height|anchor_block):\s*(\d+)/m,
    );
    return bh ? Number(bh[2]) : null;
  } catch {
    return null;
  }
}

async function collectChordDates(): Promise<Date[]> {
  const dates: Date[] = [];
  const chordFiles = await listChordSurfaceFiles();
  for (const chordFile of chordFiles) {
    const name = chordFile.name;
    // ISO timestamp: 2026-05-23T164713Z-...
    const isoMatch = name.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
    );
    if (isoMatch) {
      const [_, y, mo, d, h, mi, s] = isoMatch;
      dates.push(new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`));
      continue;
    }
    // Legacy compact: 20260509-103147-...
    const legacyMatch = name.match(
      /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/,
    );
    if (legacyMatch) {
      const [_, y, mo, d, h, mi, s] = legacyMatch;
      dates.push(new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`));
      continue;
    }
    // Hex-block convention: xNNNN_<block>_<voice>_<slug>.md — block in
    // filename is authoritative. Fall back to frontmatter bitcoin_block_height
    // when the filename slot isn't a valid integer.
    const topologicalTimestampMatch = name.match(
      /^x[0-9A-Fa-f]{4}_t(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})_/,
    );
    if (topologicalTimestampMatch) {
      const [_, y, mo, d, h, mi, s] = topologicalTimestampMatch;
      dates.push(new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`));
      continue;
    }
    const hexBlockMatch = name.match(
      /^x[0-9A-Fa-f]{4}_(\d+)_/,
    );
    if (hexBlockMatch) {
      const block = Number(hexBlockMatch[1]);
      if (Number.isFinite(block) && block > 0) {
        dates.push(blockHeightToDate(block));
        continue;
      }
    }
    // Last resort: frontmatter scan (slower; used only for non-conforming files).
    const fmBlock = await readBlockHeightFromFrontmatter(
      chordFile.fullPath,
    );
    if (fmBlock !== null) {
      dates.push(blockHeightToDate(fmBlock));
    }
    // Files without any time signal are intentionally excluded — mtime is
    // unreliable because formatter and git operations touch many files.
  }
  return dates;
}

async function collectCommitDates(days: number): Promise<Date[]> {
  try {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const proc = new Deno.Command("git", {
      args: [
        "-C",
        ROOT,
        "log",
        `--since=${since}`,
        "--format=%aI",
        "--no-merges",
      ],
      stdout: "piped",
      stderr: "piped",
    });
    const { stdout } = await proc.output();
    return new TextDecoder().decode(stdout)
      .trim()
      .split("\n")
      .filter((s) => s.length > 0)
      .map((s) => new Date(s));
  } catch {
    return [];
  }
}

interface HeartbeatStats {
  window_days: number;
  total_in_window: number;
  rolling_7d: number;
  rolling_14d: number;
  rolling_28d: number;
  daily_avg_7d: number;
  daily_avg_28d: number;
  ratio_7d_to_28d: number | null;
  last_7_days: { date: string; count: number }[];
}

function statsForDates(dates: Date[], windowDays: number): HeartbeatStats {
  const now = Date.now();
  const inWindow = dates.filter(
    (d) => now - d.getTime() <= windowDays * 86400000,
  );

  const within = (d: Date, days: number) =>
    now - d.getTime() <= days * 86400000;

  const rolling7 = inWindow.filter((d) => within(d, 7)).length;
  const rolling14 = inWindow.filter((d) => within(d, 14)).length;
  const rolling28 = inWindow.filter((d) => within(d, 28)).length;

  const avg7 = rolling7 / 7;
  const avg28 = rolling28 / 28;
  const ratio = avg28 > 0 ? avg7 / avg28 : null;

  const lastDays: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now - (i + 1) * 86400000);
    const dayEnd = new Date(now - i * 86400000);
    const count = dates.filter((d) =>
      d.getTime() >= dayStart.getTime() && d.getTime() < dayEnd.getTime()
    ).length;
    lastDays.push({ date: isoDateOnly(dayEnd), count });
  }

  return {
    window_days: windowDays,
    total_in_window: inWindow.length,
    rolling_7d: rolling7,
    rolling_14d: rolling14,
    rolling_28d: rolling28,
    daily_avg_7d: Number(avg7.toFixed(2)),
    daily_avg_28d: Number(avg28.toFixed(2)),
    ratio_7d_to_28d: ratio !== null ? Number(ratio.toFixed(2)) : null,
    last_7_days: lastDays,
  };
}

const STALL_RATIO_THRESHOLD = 0.2;
type HeartbeatPulseState = "healthy" | "consolidating" | "stalled";

export async function collectHeartbeat(windowDays = 28): Promise<{
  chords: HeartbeatStats;
  commits: HeartbeatStats;
  pulse_state: HeartbeatPulseState;
  stall_warning: string | null;
}> {
  const [chordDates, commitDates] = await Promise.all([
    collectChordDates(),
    collectCommitDates(windowDays),
  ]);

  const chords = statsForDates(chordDates, windowDays);
  const commits = statsForDates(commitDates, windowDays);

  let stall_warning: string | null = null;
  let pulse_state: HeartbeatPulseState = "healthy";
  if (
    chords.ratio_7d_to_28d !== null &&
    chords.ratio_7d_to_28d <= STALL_RATIO_THRESHOLD &&
    chords.rolling_28d >= 14
  ) {
    const commitsActive = commits.rolling_7d > 0 &&
      (commits.ratio_7d_to_28d === null ||
        commits.ratio_7d_to_28d > STALL_RATIO_THRESHOLD);
    pulse_state = commitsActive ? "consolidating" : "stalled";
    stall_warning = `chord cadence: 7d avg ${chords.daily_avg_7d}/day is ${
      Math.round(chords.ratio_7d_to_28d * 100)
    }% of 28d avg ${chords.daily_avg_28d}/day — ${
      commitsActive
        ? "commit cadence is still active; likely consolidation or implementation without enough chord receipts"
        : "commit cadence is also low; possible substrate stall"
    }`;
  }

  return { chords, commits, pulse_state, stall_warning };
}

function renderRow(label: string, s: HeartbeatStats): void {
  console.log(
    `# ${label.padEnd(8)} 7d=${String(s.rolling_7d).padStart(3)} (${
      s.daily_avg_7d.toFixed(2)
    }/d)   14d=${String(s.rolling_14d).padStart(3)}   28d=${
      String(s.rolling_28d).padStart(3)
    } (${s.daily_avg_28d.toFixed(2)}/d)   ratio_7d/28d=${
      s.ratio_7d_to_28d !== null ? s.ratio_7d_to_28d.toFixed(2) : "n/a"
    }`,
  );
}

function renderHistogram(label: string, s: HeartbeatStats): void {
  console.log(`# ${label} (last 7 days):`);
  for (const d of s.last_7_days) {
    const bar = "▇".repeat(Math.min(d.count, 40));
    console.log(`#   ${d.date}  ${String(d.count).padStart(3)}  ${bar}`);
  }
}

if (import.meta.main) {
  const args = Deno.args;
  const wantJson = args.includes("--json");
  const daysArg = args.find((a) => a.startsWith("--days="));
  const windowDays = daysArg ? Number(daysArg.split("=")[1]) : 28;

  const { chords, commits, pulse_state, stall_warning } =
    await collectHeartbeat(
      windowDays,
    );

  if (wantJson) {
    console.log(
      JSON.stringify(
        {
          type: "heartbeat",
          position: "2/7",
          action: "measure",
          note: "rolling chord+commit cadence",
          window_days: windowDays,
          summary: {
            chords_7d: chords.rolling_7d,
            chords_28d: chords.rolling_28d,
            commits_7d: commits.rolling_7d,
            commits_28d: commits.rolling_28d,
            chord_ratio_7d_to_28d: chords.ratio_7d_to_28d,
            pulse_state,
            stalled: pulse_state === "stalled",
          },
          stall_warning,
          chords,
          commits,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `# heartbeat @ 2/7 — substrate pulse (${windowDays}-day window)`,
    );
    console.log("# " + "─".repeat(80));
    renderRow("chords", chords);
    renderRow("commits", commits);
    console.log("# " + "─".repeat(80));
    renderHistogram("chords", chords);
    console.log("# " + "─".repeat(80));
    if (stall_warning) {
      const label = pulse_state === "stalled"
        ? "STALL WARNING"
        : "CONSOLIDATION WARNING";
      console.error(`# [${label}] ${stall_warning}`);
    } else {
      console.log("# pulse healthy (7d cadence within normal range vs 28d)");
    }
  }
}
