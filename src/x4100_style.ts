#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x4100_style.ts — style / active music style surface
// position: 4/1 → foundation(4) × first(1) = primal form / style ground
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "33 40 26 33 6C 26 26 26"
//   foundation_container+0.85 (PRIMARY: style grounds on container state)
//   first_penultimate+0.60 (style IS the first form selected)
//   triangle_build+0.50 (style composes from multiple triggers)
//   bucket 4/1: primary axis foundation (4), bucket 4 ← MATCH
//               secondary '1' → axis 1 first-penultimate, dipole +0.60
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// style — active music style per VOICES.v0.1 style spectrum
//
// Usage:
//   t style              # text table
//   t style --json       # machine-readable
//
// Glossary words: style, стиль, music-style

import { listChordSurfaceFiles } from "./x2F21_chord_surface.ts";

// ── types ──────────────────────────────────────────────────────────────────

interface StyleResult {
  style: string;
  trigger: string;
  confidence: "high" | "medium" | "low";
  since_last_chord_minutes: number | null;
  daemon_locked: boolean;
  health_overall: string | null;
}

// ── helpers ────────────────────────────────────────────────────────────────

async function readDaemonStatus(): Promise<
  { locked: boolean; last_invocation: string | null }
> {
  try {
    const cmd = new Deno.Command("t", {
      args: ["daemon", "status", "--json"],
      stdout: "piped",
      stderr: "piped",
    });
    const { stdout } = await cmd.output();
    const data = JSON.parse(new TextDecoder().decode(stdout));
    return {
      locked: data.lock_file ?? false,
      last_invocation: data.last_invocation ?? null,
    };
  } catch {
    return { locked: false, last_invocation: null };
  }
}

async function readHealth(): Promise<string | null> {
  try {
    const cmd = new Deno.Command("t", {
      args: ["health", "--json"],
      stdout: "piped",
      stderr: "piped",
    });
    const { stdout } = await cmd.output();
    const data = JSON.parse(new TextDecoder().decode(stdout));
    return data.summary?.overall ?? null;
  } catch {
    return null;
  }
}

async function minutesSinceLastChord(): Promise<number | null> {
  let latest = 0;
  try {
    for (const chord of await listChordSurfaceFiles()) {
      const stat = await Deno.stat(chord.fullPath);
      const mtime = stat.mtime?.getTime() ?? 0;
      if (mtime > latest) latest = mtime;
    }
  } catch {
    return null;
  }
  if (latest === 0) return null;
  return Math.round((Date.now() - latest) / 60000);
}

function determineStyle(
  locked: boolean,
  health: string | null,
  minutes: number | null,
): StyleResult {
  // Silence: daemon stopped AND no chord in last 30min
  if (locked && (minutes === null || minutes > 30)) {
    return {
      style: "silence",
      trigger: "daemon_locked + no_chord_30min",
      confidence: "high",
      since_last_chord_minutes: minutes,
      daemon_locked: locked,
      health_overall: health,
    };
  }

  // Lullaby: daemon stopped but recent chords (manual pause)
  if (locked && minutes !== null && minutes <= 30) {
    return {
      style: "lullaby",
      trigger: "daemon_locked + recent_chords",
      confidence: "high",
      since_last_chord_minutes: minutes,
      daemon_locked: locked,
      health_overall: health,
    };
  }

  // Improvisation (jazz): daemon running, recent activity, healthy/degraded
  if (
    !locked && (health === "healthy" || health === "degraded") &&
    minutes !== null && minutes <= 30
  ) {
    return {
      style: "improvisation",
      trigger: "daemon_unlocked + healthy_or_degraded + recent_chords",
      confidence: "high",
      since_last_chord_minutes: minutes,
      daemon_locked: locked,
      health_overall: health,
    };
  }

  // Vigil: degraded AND stale chords
  if (!locked && health === "degraded" && minutes !== null && minutes > 30) {
    return {
      style: "vigil",
      trigger: "daemon_unlocked + degraded + stale_chords",
      confidence: "medium",
      since_last_chord_minutes: minutes,
      daemon_locked: locked,
      health_overall: health,
    };
  }

  // Default: silence (no confident signal)
  return {
    style: "silence",
    trigger: "default_fallback",
    confidence: "low",
    since_last_chord_minutes: minutes,
    daemon_locked: locked,
    health_overall: health,
  };
}

// ── output formatters ──────────────────────────────────────────────────────

function renderTable(result: StyleResult): string {
  const lines = [
    `# style @ 4/1 — active music style`,
    `# ──────────────────────────────────────────────────────────────────`,
    `# style:        ${result.style}`,
    `# trigger:      ${result.trigger}`,
    `# confidence:   ${result.confidence}`,
    `# last chord:   ${
      result.since_last_chord_minutes !== null
        ? result.since_last_chord_minutes + " min ago"
        : "unknown"
    }`,
    `# daemon:       ${result.daemon_locked ? "locked" : "unlocked"}`,
    `# health:       ${result.health_overall ?? "unknown"}`,
  ];
  return lines.join("\n");
}

function renderJson(result: StyleResult): string {
  return JSON.stringify(
    {
      type: "style_projection",
      schema: "trinity.style.v0.1",
      ...result,
    },
    null,
    2,
  );
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = Deno.args;
  const useJson = args.includes("--json");

  const daemon = await readDaemonStatus();
  const health = await readHealth();
  const minutes = await minutesSinceLastChord();
  const result = determineStyle(daemon.locked, health, minutes);

  console.log(useJson ? renderJson(result) : renderTable(result));
}

main();
