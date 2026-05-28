#!/usr/bin/env -S deno run --allow-read
// src/x2300_self_portrait.ts — self-portrait (voice's self-declared vs historical comfort field)
// position: 2/3 → mirror(2) × triangle(3) = stable mirror reflection
// hex_dipole: "26 26 6C 4C 33 26 33 33"
//   axis 2 mirror_apex +0.85 (PRIMARY: self-portrait IS reflection)
//   axis 3 triangle_build +0.76 (stable witness — portrait is stable, not fleeting)
//   axis 4 foundation +0.51 (portrait grounds identity)
//   bucket 2/3: primary axis mirror (2), bucket 2 ← MATCH on axis 2
//               secondary '3' → axis 3 triangle/stable ← strong pair
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// self-portrait — reconcile self-declared comfort field with historical
//
// For a given voice:
//   1. Read src/x8A*_voice_<voice>.myc.json — self-declared comfort field
//   2. Derive historical center-of-mass from chord history (reuses 0x2/0 logic)
//   3. Compute divergence (cosine angle between self_declared and historical)
//   4. Surface the gap — do NOT average them
//
// Divergence-as-signal per VOICES.v0.1: when self-declaration and action
// diverge, either the voice misrepresents itself, the voice has shifted,
// or the substrate misread history. Decision belongs to the voice or
// architect, not the daemon.
//
// Usage:
//   t self-portrait <voice>          # text view of reconciliation
//   t self-portrait <voice> --json   # machine-readable
//   t self-portrait                  # all known voices
//
// Glossary words: self-portrait, portrait, declare, самопортрет, портрет

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const STATE_VOICES = join(ROOT, "src");
const VOICES_ORGAN = join(ROOT, "src", "x2001_voices.ts");
const VOICE_FILE_RE = /^x8A[0-9A-Fa-f]{2}_voice_([^.]+)\.myc\.json$/;

// ── hex helpers (signed-byte CBOR-style; matches 0x2/0 + glossary convention) ──

function parseHexDipole(s: string): number[] {
  return s.trim().split(/\s+/).map((h) => {
    const v = parseInt(h, 16);
    return v > 127 ? v - 256 : v;
  });
}

function formatHexDipole(v: number[]): string {
  return v.map((n) =>
    ((n + 256) & 0xff).toString(16).padStart(2, "0").toUpperCase()
  ).join(" ");
}

function dot(a: number[], b: number[]): number {
  return a.reduce((acc, x, i) => acc + x * (b[i] ?? 0), 0);
}

function norm(a: number[]): number {
  return Math.sqrt(a.reduce((acc, x) => acc + x * x, 0));
}

function cosineSim(a: number[], b: number[]): number {
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return NaN;
  return dot(a, b) / (na * nb);
}

function angleDegrees(cos: number): number {
  if (Number.isNaN(cos)) return NaN;
  // Clamp to handle floating-point edge cases.
  const c = Math.max(-1, Math.min(1, cos));
  return Math.acos(c) * (180 / Math.PI);
}

// ── voice record + historical derivation ──

interface VoiceRecord {
  identity: string;
  self_declared: null | { comfort_field: string; description?: string };
  standing: string;
  note?: string;
}

async function loadVoiceRecord(voice: string): Promise<VoiceRecord | null> {
  try {
    for await (const entry of Deno.readDir(STATE_VOICES)) {
      if (!entry.isFile) continue;
      const m = VOICE_FILE_RE.exec(entry.name);
      if (!m || m[1] !== voice) continue;
      const text = await Deno.readTextFile(join(STATE_VOICES, entry.name));
      return JSON.parse(text) as VoiceRecord;
    }
  } catch {
    /* src voice record absent */
  }
  return null;
}

async function listVoiceFiles(): Promise<string[]> {
  const out: string[] = [];
  try {
    for await (const entry of Deno.readDir(STATE_VOICES)) {
      if (!entry.isFile) continue;
      const m = VOICE_FILE_RE.exec(entry.name);
      if (m) {
        out.push(m[1]);
      }
    }
  } catch {
    /* src voice records do not exist yet */
  }
  return [...new Set(out)].sort();
}

interface VoicesOrganRow {
  identity: string;
  chords: number;
  top_primary_oct?: string;
  avg_energy: number;
  comfort_field_synthetic: string;
}

async function getVoicesOrganRows(): Promise<VoicesOrganRow[]> {
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-read", VOICES_ORGAN, "--json"],
    stdout: "piped",
    stderr: "null",
  });
  const out = await proc.output();
  const raw = new TextDecoder().decode(out.stdout).trim();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.voices) ? parsed.voices : [];
  } catch {
    return [];
  }
}

// ── reconciliation ──

interface Reconciliation {
  voice: string;
  standing: string;
  has_self_declared: boolean;
  self_declared_hex: string | null;
  historical_hex: string | null;
  chords_observed: number;
  divergence_angle_degrees: number | null;
  divergence_classification:
    | "aligned"
    | "drifting"
    | "misaligned"
    | "no-self"
    | "no-history";
  note: string | null;
}

function classifyDivergence(
  angle: number | null,
  hasSelf: boolean,
  hasHist: boolean,
): Reconciliation["divergence_classification"] {
  if (!hasSelf) return "no-self";
  if (!hasHist) return "no-history";
  if (angle === null || Number.isNaN(angle)) return "no-history";
  if (angle < 15) return "aligned";
  if (angle < 45) return "drifting";
  return "misaligned";
}

async function reconcile(
  voice: string,
  rows: VoicesOrganRow[],
): Promise<Reconciliation> {
  const record = await loadVoiceRecord(voice);
  const row = rows.find((r) => r.identity === voice);

  const hasSelf = !!record?.self_declared?.comfort_field;
  const hasHist = !!row && row.chords > 0;
  const selfHex = hasSelf ? record!.self_declared!.comfort_field : null;
  const histHex = hasHist ? row!.comfort_field_synthetic : null;

  let angle: number | null = null;
  if (hasSelf && hasHist && selfHex && histHex) {
    const a = parseHexDipole(selfHex);
    const b = parseHexDipole(histHex);
    angle = angleDegrees(cosineSim(a, b));
  }

  return {
    voice,
    standing: record?.standing ?? "unknown",
    has_self_declared: hasSelf,
    self_declared_hex: selfHex,
    historical_hex: histHex,
    chords_observed: row?.chords ?? 0,
    divergence_angle_degrees: angle,
    divergence_classification: classifyDivergence(angle, hasSelf, hasHist),
    note: record?.note ?? null,
  };
}

// ── output ──

function renderText(rs: Reconciliation[]): string {
  const lines: string[] = [];
  lines.push("# self-portrait @ 2/3 — voice self-declared vs historical");
  lines.push("# " + "─".repeat(76));
  lines.push(
    "# voice".padEnd(14) + "standing".padEnd(12) + "chords".padEnd(8) +
      "Δ angle".padEnd(12) + "classification",
  );
  lines.push("# " + "─".repeat(76));
  for (const r of rs) {
    const angleStr = r.divergence_angle_degrees === null
      ? "  —"
      : `${r.divergence_angle_degrees.toFixed(1)}°`;
    lines.push(
      "# " +
        r.voice.padEnd(12) +
        r.standing.padEnd(12) +
        String(r.chords_observed).padEnd(8) +
        angleStr.padEnd(12) +
        r.divergence_classification,
    );
  }
  lines.push("# " + "─".repeat(76));
  lines.push("# Classification thresholds:");
  lines.push("#   aligned     Δ < 15°    (self-declaration matches action)");
  lines.push("#   drifting    15° ≤ Δ < 45°  (gap is signal; investigate)");
  lines.push(
    "#   misaligned  Δ ≥ 45°    (voice misrepresents itself or history misread)",
  );
  lines.push(
    "#   no-self     no src/x8A*_voice_<voice>.myc.json — voice unauthored",
  );
  lines.push("#   no-history  fewer than 1 chord observed");
  return lines.join("\n");
}

// ── main ──

if (import.meta.main) {
  const args = Deno.args;
  const jsonMode = args.includes("--json");
  const voiceArg = args.find((a) => !a.startsWith("--"));

  const rows = await getVoicesOrganRows();
  const allVoiceNames = new Set<string>();
  for (const f of await listVoiceFiles()) allVoiceNames.add(f);
  for (const r of rows) allVoiceNames.add(r.identity);

  const targets = voiceArg ? [voiceArg] : [...allVoiceNames].sort();

  const reconciliations: Reconciliation[] = [];
  for (const v of targets) {
    reconciliations.push(await reconcile(v, rows));
  }

  if (jsonMode) {
    const payload = {
      type: "self_portrait",
      action: "self-portrait",
      position: "2/3",
      note:
        "mirror(2) × triangle(3) — stable mirror reflection; voice self-declared vs historical",
      voices: reconciliations,
      synonyms: [
        "self-portrait",
        "portrait",
        "declare",
        "самопортрет",
        "портрет",
      ],
    };
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(renderText(reconciliations));
  }
}
