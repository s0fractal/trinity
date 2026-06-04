#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
// src/x7F00_daemon.ts — daemon status / runtime state surface
// position: 7/F → completion(7) × action(5) = decisive runtime act
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 26 26 33 4C 59 26 6C"
//   completion_frontier+0.85 (PRIMARY: daemon closes the action loop)
//   action_decision+0.70 (runtime IS the decision to act)
//   foundation_container+0.60 (daemon grounds on filesystem state)
//   bucket 7/F: primary axis completion (7), bucket 7 ← MATCH
//               secondary 'F' → hex F = axis 7 positive-pair
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// daemon — crawl-phase runtime state surface
//
// Usage:
//   t daemon status           # text table
//   t daemon status --json    # machine-readable
//   t daemon stop             # write src/x7F88_daemon.lock
//   t daemon start            # remove src/x7F88_daemon.lock
//   t daemon run --once       # single pass: scan new chords, route, log
//   t daemon run --dry-run    # inspect routing without writing receipts
//   t daemon run --backfill   # route all historical chords (first run)
//   t daemon run --since <iso> # explicit replay window
//   t daemon tick             # safe-mode loop driver: orient → choose →
//   t daemon tick --json      # propose next action (READ-ONLY, never acts)
//
// Glossary words: daemon, демон

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { listChordSurfaceFiles } from "./x2F21_chord_surface.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
// Daemon runtime state co-located in src/ per the flat-src migration:
// no more state/ legacy dir. The 88 suffix marks "state cache for organ
// at x7F00". x7F01_daemon_invocations.ndjson stays at sibling coord
// because it's tracked-history, not runtime mutex.
const LOCK_FILE = join(ROOT, "src", "x7F88_daemon.lock");
const LAST_CHECK_FILE = join(ROOT, "src", "x7F88_daemon.last-check");
const LOG_FILE = join(ROOT, "src", "x7F01_daemon_invocations.ndjson");

// ── types ──────────────────────────────────────────────────────────────────

interface DaemonStatus {
  status: "running" | "stopped";
  runtime_state: "unlocked" | "locked";
  process_running: boolean;
  lock_file: boolean;
  last_invocation: string | null;
  style_active: string | null;
  invocation_count_24h: number;
}

// ── state readers ──────────────────────────────────────────────────────────

async function readLockFile(): Promise<boolean> {
  try {
    await Deno.stat(LOCK_FILE);
    return true;
  } catch {
    return false;
  }
}

async function readLastInvocation(): Promise<string | null> {
  try {
    const text = await readInvocationLog();
    const lines = text.trim().split("\n").filter((l) => l.length > 0);
    if (lines.length === 0) return null;
    const last = JSON.parse(lines[lines.length - 1]);
    return last.timestamp ?? null;
  } catch {
    return null;
  }
}

async function countInvocations24h(): Promise<number> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let count = 0;
  try {
    const text = await readInvocationLog();
    for (const line of text.trim().split("\n")) {
      if (line.length === 0) continue;
      try {
        const entry = JSON.parse(line);
        const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : 0;
        if (ts >= cutoff) count++;
      } catch { /* skip malformed */ }
    }
  } catch { /* no log file */ }
  return count;
}

async function readInvocationLog(): Promise<string> {
  try {
    return await Deno.readTextFile(LOG_FILE);
  } catch {
    return "";
  }
}

// ── state mutators ─────────────────────────────────────────────────────────

async function writeLock(): Promise<void> {
  await Deno.mkdir(dirname(LOCK_FILE), { recursive: true });
  await Deno.writeTextFile(
    LOCK_FILE,
    `locked_at: ${new Date().toISOString()}\n`,
  );
}

async function removeLock(): Promise<void> {
  try {
    await Deno.remove(LOCK_FILE);
  } catch { /* already absent */ }
}

// ── output formatters ──────────────────────────────────────────────────────

function renderTable(status: DaemonStatus): string {
  const lines = [
    `# daemon @ 7/F — runtime state`,
    `# ──────────────────────────────────────────────────────────────────`,
    `# status     runtime     process  last_invocation         invocations_24h`,
    `# ──────────────────────────────────────────────────────────────────`,
    `# ${status.status.padEnd(10)} ${status.runtime_state.padEnd(11)} ${
      String(status.process_running).padEnd(8)
    } ${(status.last_invocation ?? "—").padEnd(23)} ${
      String(status.invocation_count_24h).padStart(4)
    }`,
  ];
  return lines.join("\n");
}

async function buildStatus(): Promise<DaemonStatus> {
  const locked = await readLockFile();
  return {
    status: locked ? "stopped" : "running",
    runtime_state: locked ? "locked" : "unlocked",
    // Crawl phase has no long-lived process yet; `t daemon run` is explicit.
    process_running: false,
    lock_file: locked,
    last_invocation: await readLastInvocation(),
    style_active: null,
    invocation_count_24h: await countInvocations24h(),
  };
}

function renderJson(status: DaemonStatus): string {
  return JSON.stringify(
    {
      type: "daemon_status",
      schema: "trinity.daemon.v0.1",
      ...status,
    },
    null,
    2,
  );
}

// ── run --once (crawl phase chord watcher) ─────────────────────────────────

interface ChordFm {
  id?: string;
  speaker?: string;
  created?: string;
  mode?: string;
  oct?: string;
  topic?: string;
  claim_kind?: string;
  energy?: number;
  primary?: string;
  secondary?: string[];
  chord?: string[] | { primary?: string; secondary?: string[] };
  [key: string]: unknown;
}

interface VoiceProfile {
  identity: string;
  top_primary_oct: string;
  top_topic: string;
  comfort_field_synthetic: string;
}

function parseYamlFrontmatter(
  text: string,
): { fm: Record<string, unknown>; body: string } | null {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  const yaml = text.slice(4, end);
  const body = text.slice(end + 4).trimStart();
  const fm: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let inList = false;
  const listItems: unknown[] = [];

  for (const line of yaml.split("\n")) {
    const trimmed = line.trimStart();
    if (trimmed.length === 0) continue;

    const listMatch = trimmed.match(/^-\s+(.*)$/);
    if (listMatch) {
      if (!inList && currentKey) inList = true;
      if (inList) listItems.push(coerce(listMatch[1].trim()));
      continue;
    }

    if (inList && currentKey) {
      fm[currentKey] = listItems.slice();
      listItems.length = 0;
      inList = false;
      currentKey = null;
    }

    const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val.length > 0) fm[currentKey] = coerce(val);
    }
  }

  if (inList && currentKey) fm[currentKey] = listItems.slice();
  return { fm, body };
}

function coerce(v: string): unknown {
  if (v === "true" || v === "True") return true;
  if (v === "false" || v === "False") return false;
  if (v === "null" || v === "~") return null;
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  if (/^\d+\.\d+$/.test(v)) return parseFloat(v);
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) return v.slice(1, -1);
  if (v.startsWith("[") && v.endsWith("]")) {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p;
    } catch {}
  }
  if (v.startsWith("{") && v.endsWith("}")) {
    try {
      const p = JSON.parse(v);
      if (typeof p === "object" && p !== null) return p;
    } catch {}
  }
  return v;
}

async function readLastCheck(): Promise<number | null> {
  try {
    const text = await Deno.readTextFile(LAST_CHECK_FILE);
    const n = parseInt(text.trim(), 10);
    return isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

async function writeLastCheck(ts: number): Promise<void> {
  await Deno.mkdir(dirname(LAST_CHECK_FILE), { recursive: true });
  await Deno.writeTextFile(LAST_CHECK_FILE, String(ts));
}

async function loadNewChords(
  since: number,
): Promise<{ fm: ChordFm; path: string; mtime: number }[]> {
  const entries: { fm: ChordFm; path: string; mtime: number }[] = [];
  for (const chord of await listChordSurfaceFiles()) {
    const stat = await Deno.stat(chord.fullPath);
    const mtime = stat.mtime?.getTime() ?? 0;
    if (mtime <= since) continue;
    const text = await Deno.readTextFile(chord.fullPath);
    const parsed = parseYamlFrontmatter(text);
    if (!parsed) continue;
    const fm = parsed.fm as ChordFm;
    if (!fm.id) fm.id = chord.flatId;
    entries.push({ fm, path: chord.relPath, mtime });
  }
  entries.sort((a, b) => a.mtime - b.mtime);
  return entries;
}

async function getVoiceProfiles(): Promise<VoiceProfile[]> {
  // Resolve `t` via the substrate's own launcher (TRINITY_ROOT/t shim) rather
  // than $PATH. The bare `t` invocation died on 2026-05-15 when the daemon
  // started running from a context where `t` was not on PATH; using the shim
  // makes invocation location-independent.
  const tShim = join(ROOT, "t");
  const cmd = new Deno.Command(tShim, {
    args: ["voices", "--json"],
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout } = await cmd.output();
  const text = new TextDecoder().decode(stdout);
  // Dispatcher prepends a `# <action> → <position>` header line; find the
  // first JSON-shaped line and parse it.
  const jsonLine = text.split("\n").find((l) => l.trimStart().startsWith("{"));
  if (!jsonLine) {
    throw new Error(`getVoiceProfiles: no JSON in t voices output: ${text}`);
  }
  const data = JSON.parse(jsonLine);
  return (data.voices || []) as VoiceProfile[];
}

async function loadVoiceStanding(identity: string): Promise<string | null> {
  try {
    const path = join(ROOT, "state", "voices", `${identity}.json`);
    const text = await Deno.readTextFile(path);
    const data = JSON.parse(text);
    return data.self_declared?.standing ?? data.standing ?? null;
  } catch {
    return null;
  }
}

function axisFromOct(tag: string): number | null {
  const m = tag.match(/(?:oct:)?(\d)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 0 && n <= 7 ? n : null;
}

function scoreVoice(chord: ChordFm, voice: VoiceProfile): number {
  let score = 0;

  // Topic match (+3)
  if (
    chord.topic && voice.top_topic !== "unknown" &&
    chord.topic === voice.top_topic
  ) {
    score += 3;
  }

  // Primary oct match (+2)
  const chordOcts: string[] = [];
  if (chord.oct) chordOcts.push(String(chord.oct));
  else if (chord.primary) chordOcts.push(String(chord.primary));
  else if (Array.isArray(chord.chord)) {
    chordOcts.push(...chord.chord.map(String));
  } else if (chord.chord && typeof chord.chord === "object") {
    const ch = chord.chord as { primary?: string; secondary?: string[] };
    if (ch.primary) chordOcts.push(ch.primary);
  }
  const pri = chordOcts[0] || "unknown";
  if (pri !== "unknown" && voice.top_primary_oct === pri) {
    score += 2;
  }

  // Comfort field axis alignment (+1 per strong axis match)
  const comfortBytes = voice.comfort_field_synthetic.split(/\s+/).map((h) =>
    parseInt(h, 16)
  );
  for (const oct of chordOcts) {
    const axis = axisFromOct(oct);
    if (axis !== null && comfortBytes[axis] > 0x40) {
      score += 1;
    }
  }

  return score;
}

function route1D(
  chord: ChordFm,
  voices: VoiceProfile[],
): { voice: string; score: number } | null {
  let best: { voice: string; score: number } | null = null;
  for (const v of voices) {
    const s = scoreVoice(chord, v);
    if (!best || s > best.score) best = { voice: v.identity, score: s };
  }
  return best;
}

async function writeInvocationReceipt(
  chordId: string,
  voice: string,
  score: number,
  backfill: boolean,
): Promise<void> {
  await Deno.mkdir(dirname(LOG_FILE), { recursive: true });
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    chord_id: chordId,
    voice,
    score,
    style: "improvisation",
    backend: "1D_keyword_baseline",
  };
  if (backfill) entry.backfill = true;
  await Deno.writeTextFile(LOG_FILE, JSON.stringify(entry) + "\n", {
    append: true,
  });
}

// ── run handler ────────────────────────────────────────────────────────────

async function handleRun(
  useJson: boolean,
  dryRun: boolean,
  backfill: boolean,
  sinceOverride: number | null,
): Promise<void> {
  const locked = await readLockFile();
  if (locked) {
    const msg = useJson
      ? JSON.stringify({ error: "daemon_locked", lock_file: LOCK_FILE })
      : `# daemon @ 7/F — REFUSED (lock file present)\n# ${LOCK_FILE}`;
    console.log(msg);
    return;
  }

  const lastCheck = await readLastCheck();
  let since: number;
  if (sinceOverride !== null) {
    since = sinceOverride;
  } else if (backfill) {
    since = 0; // explicit backfill: route all historical chords
  } else if (lastCheck !== null) {
    since = lastCheck;
  } else {
    // No last-check and no --backfill: initialize to now, route nothing
    const now = Date.now();
    if (!dryRun) await writeLastCheck(now);
    if (useJson) {
      console.log(JSON.stringify(
        {
          type: "daemon_run_receipt",
          schema: "trinity.daemon.v0.1",
          checked_at: new Date(now).toISOString(),
          new_chords: 0,
          routed: 0,
          note: "initialized_last_check_to_now (no --backfill)",
          receipts: [],
        },
        null,
        2,
      ));
    } else {
      console.log(`# daemon @ 7/F — run --once`);
      console.log(
        `# ──────────────────────────────────────────────────────────────────`,
      );
      console.log(`# Initialized last-check to now. No chords routed.`);
      console.log(`# Pass --backfill to route historical chords.`);
    }
    return;
  }

  const chords = await loadNewChords(since);
  const voices = await getVoiceProfiles();

  // Pre-load standing for each voice to skip observing/paused
  const standings = new Map<string, string | null>();
  for (const v of voices) {
    standings.set(v.identity, await loadVoiceStanding(v.identity));
  }

  const receipts: Array<{ chord_id: string; voice: string; score: number }> =
    [];
  for (const c of chords) {
    const match = route1D(c.fm, voices);
    if (match && match.score > 0) {
      const standing = standings.get(match.voice);
      if (standing === "observing" || standing === "paused") continue;
      if (!dryRun) {
        await writeInvocationReceipt(
          c.fm.id!,
          match.voice,
          match.score,
          backfill,
        );
      }
      receipts.push({
        chord_id: c.fm.id!,
        voice: match.voice,
        score: match.score,
      });
    }
  }

  const now = Date.now();
  if (!dryRun) await writeLastCheck(now);

  if (useJson) {
    console.log(JSON.stringify(
      {
        type: "daemon_run_receipt",
        schema: "trinity.daemon.v0.1",
        checked_at: new Date(now).toISOString(),
        new_chords: chords.length,
        routed: receipts.length,
        dry_run: dryRun,
        backfill,
        receipts,
      },
      null,
      2,
    ));
  } else {
    const modeLabel = dryRun ? "run --dry-run" : "run --once";
    console.log(`# daemon @ 7/F — ${modeLabel}`);
    console.log(
      `# ──────────────────────────────────────────────────────────────────`,
    );
    console.log(
      `# Checked:     ${new Date(since).toISOString()} → ${
        new Date(now).toISOString()
      }`,
    );
    console.log(`# New chords:  ${chords.length}`);
    console.log(
      `# Routed:      ${receipts.length}${
        dryRun ? " (DRY RUN — not written)" : ""
      }${backfill ? " (backfill)" : ""}`,
    );
    for (const r of receipts) {
      console.log(`#   → ${r.chord_id} → ${r.voice} (score ${r.score})`);
    }
    if (receipts.length === 0) console.log(`#   (no new chords or no matches)`);
  }
}

// ── tick (safe-mode loop driver) ─────────────────────────────────────────────
//
// One pass of the self-driving loop, READ-ONLY: orient (t self) → choose (the
// roadmap-pointed recommendation) → propose the next action. It never acts:
// the gate.would_act is always false in safe mode. This lets the loop run itself
// up to — but not through — the irreversible step, so a human (or a future
// explicitly-enabled --act capability) decides whether to take it.

async function runTJson(
  args: string[],
): Promise<Record<string, unknown> | null> {
  const tShim = join(ROOT, "t");
  const { stdout } = await new Deno.Command(tShim, {
    args: [...args, "--json"],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const text = new TextDecoder().decode(stdout);
  // Dispatcher prepends `# <action> → <pos>` header lines; drop them and parse.
  const jsonText = text
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("#"))
    .join("\n")
    .trim();
  if (!jsonText) return null;
  try {
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function readLatestRecommendation(): Promise<
  Record<string, unknown> | null
> {
  try {
    const text = await Deno.readTextFile(
      join(ROOT, "src", "x5288_cognition_recommendation.latest.myc.json"),
    );
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function worktreeClean(): Promise<boolean> {
  const { stdout } = await new Deno.Command("git", {
    args: ["status", "--short"],
    cwd: ROOT,
    stdout: "piped",
    stderr: "piped",
  }).output();
  return new TextDecoder().decode(stdout).trim().length === 0;
}

async function handleTick(useJson: boolean): Promise<void> {
  const locked = await readLockFile();
  if (locked) {
    const msg = useJson
      ? JSON.stringify({ type: "daemon_tick", error: "daemon_locked" })
      : `# daemon @ 7/F — tick REFUSED (lock file present)`;
    console.log(msg);
    return;
  }

  const self = await runTJson(["self"]);
  const attention = (self?.attention ?? {}) as {
    level?: string;
    score?: number;
  };
  const clean = await worktreeClean();

  const rec = await readLatestRecommendation();
  const recs = (rec?.recommendations ?? []) as Array<Record<string, unknown>>;
  const top = recs[0] ?? null;
  const openHorizons = (rec?.open_horizons ?? []) as unknown[];

  // Safe mode: the driver never crosses the action boundary on its own.
  const tick = {
    type: "daemon_tick",
    schema: "trinity.daemon-tick.v0.1",
    mode: "safe-readonly",
    oriented: {
      attention_level: attention.level ?? null,
      attention_score: attention.score ?? null,
      worktree_clean: clean,
    },
    chosen: top
      ? {
        repo: top.repo,
        action: top.action,
        pressure: top.pressure,
        phase: `${top.phase_from} → ${top.phase_to}`,
      }
      : null,
    open_horizons: openHorizons.length,
    recommendation_age: rec?.timestamp ?? null,
    gate: {
      would_act: false,
      reason:
        "safe mode: tick is read-only orientation + choice; acting requires an explicit --act capability that is not yet enabled",
      next_command: Array.isArray(top?.commands)
        ? (top!.commands as string[])[(top!.commands as string[]).length - 1] ??
          null
        : null,
    },
  };

  if (useJson) {
    console.log(JSON.stringify(tick, null, 2));
    return;
  }
  console.log(`# daemon @ 7/F — tick (safe, read-only)`);
  console.log(
    `# ──────────────────────────────────────────────────────────────────`,
  );
  console.log(
    `# orient:  attention ${tick.oriented.attention_level}(${tick.oriented.attention_score})  worktree ${
      clean ? "clean" : "DIRTY"
    }`,
  );
  if (top) {
    console.log(`# choose:  ${top.repo} — ${top.action}`);
    console.log(
      `#          pressure ${top.pressure}  phase ${top.phase_from} → ${top.phase_to}`,
    );
  } else {
    console.log(
      `# choose:  (no recommendation — run 't cognition_recommend' first)`,
    );
  }
  console.log(`# open horizons: ${openHorizons.length}`);
  console.log(`# gate:    would_act=false (safe mode) — no action taken`);
  if (tick.gate.next_command) {
    console.log(`# next:    ${tick.gate.next_command}`);
  }
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = Deno.args;
  const cmd = args[0] || "status";
  const useJson = args.includes("--json");
  const dryRun = args.includes("--dry-run");
  const backfill = args.includes("--backfill");

  let sinceOverride: number | null = null;
  const sinceIdx = args.indexOf("--since");
  if (sinceIdx !== -1 && sinceIdx + 1 < args.length) {
    const parsed = new Date(args[sinceIdx + 1]).getTime();
    if (!isNaN(parsed)) sinceOverride = parsed;
  }

  if (cmd === "stop") {
    await writeLock();
    const status = await buildStatus();
    console.log(useJson ? renderJson(status) : renderTable(status));
    return;
  }

  if (cmd === "start") {
    await removeLock();
    const status = await buildStatus();
    console.log(useJson ? renderJson(status) : renderTable(status));
    return;
  }

  if (cmd === "run") {
    await handleRun(useJson, dryRun, backfill, sinceOverride);
    return;
  }

  if (cmd === "tick") {
    await handleTick(useJson);
    return;
  }

  // default: status
  const status = await buildStatus();
  console.log(useJson ? renderJson(status) : renderTable(status));
}

main();
