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
//   t daemon tick --act       # autonomous self-maintenance: regen drifted
//   t daemon tick --act --push  # projections, verify, commit (+push); clean
//                             # tree required, reverts on verify failure
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

/** Scan chord surface files for claim chords → horizon-key → claiming voice. */
async function loadClaims(): Promise<
  Map<string, { voice: string; chord_id: string }>
> {
  const claims = new Map<string, { voice: string; chord_id: string }>();
  for (const chord of await listChordSurfaceFiles()) {
    const text = await Deno.readTextFile(chord.fullPath);
    const parsed = parseYamlFrontmatter(text);
    if (!parsed) continue;
    const fm = parsed.fm;
    if (fm.type !== "chord.claim") continue;
    // parseYamlFrontmatter flattens nested maps, so `claims: { horizon: X }`
    // surfaces as top-level `horizon`.
    const horizon = fm.horizon ? String(fm.horizon) : null;
    if (!horizon) continue;
    const voice = String(fm.voice ?? fm.speaker ?? "unknown");
    const chord_id = fm.id ? String(fm.id) : chord.flatId;
    claims.set(horizon, { voice, chord_id }); // latest write wins
  }
  return claims;
}

/** First hex digit of a coordinate is its bucket; bucket mod 8 is the axis. */
function axisFromCoordinate(coord: string): number | null {
  const m = coord.replace(/^x/i, "").match(/^([0-9a-f])/i);
  if (!m) return null;
  return parseInt(m[1], 16) % 8;
}

/** Best-fit voice for a horizon: strongest comfort-field byte on its axis. */
function bestFitVoice(
  coord: string,
  voices: Array<{ identity: string; comfort_field_synthetic?: string }>,
): string | null {
  const axis = axisFromCoordinate(coord);
  if (axis === null) return null;
  let best: { voice: string; score: number } | null = null;
  for (const v of voices) {
    const bytes = String(v.comfort_field_synthetic ?? "").split(/\s+/).map((
      h,
    ) => parseInt(h, 16));
    const score = Number.isFinite(bytes[axis]) ? bytes[axis] : 0;
    if (!best || score > best.score) best = { voice: v.identity, score };
  }
  return best?.voice ?? null;
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

// ── --act: bounded autonomous self-maintenance ───────────────────────────────
//
// `t daemon tick --act` lets the loop take ONE step without a human, restricted
// to the safe-by-construction class: regenerate drifted stable projections,
// verify, commit (reversible via git), optionally push. Hard preconditions
// (clean tree, no lock) and revert-on-verify-failure mean it cannot leave the
// substrate in a broken or surprising state. It deliberately does NOT author
// code or proposals — arbitrary autonomous code generation is a separate safety
// frontier. Opened 2026-06-04 on explicit architect authorization.

async function runGit(
  args: string[],
): Promise<{ ok: boolean; out: string }> {
  const { code, stdout, stderr } = await new Deno.Command("git", {
    args,
    cwd: ROOT,
    stdout: "piped",
    stderr: "piped",
  }).output();
  const out = new TextDecoder().decode(stdout) +
    new TextDecoder().decode(stderr);
  return { ok: code === 0, out };
}

async function regenerateProjections(): Promise<void> {
  const tShim = join(ROOT, "t");
  for (
    const gen of [
      "agents",
      "skill",
      "memory",
      "probes",
      "decisions",
      "evidence",
      "external-surfaces",
    ]
  ) {
    await new Deno.Command(tShim, {
      args: [gen, "--stable"],
      cwd: ROOT,
      stdout: "null",
      stderr: "null",
    }).output();
  }
}

/** One heartbeat through the phi bridge: liquid emits PHI_INTENT, omega
 *  verifies and emits PHI_RECEIPT, myc ingests the descriptor (third leg
 *  runs only when the migrated myc organ is present). x6420 writes
 *  deterministic fixtures, so this composes with the commit-if-drifted
 *  flow: a hash change is REAL substrate-physics change and gets committed
 *  like any other stable projection; an identical pulse is a no-op.
 *  Failure reverts fixtures/phi and never blocks projection maintenance. */
async function phiPulse(): Promise<Record<string, unknown>> {
  for (const sub of ["liquid", "omega"]) {
    try {
      await Deno.stat(join(ROOT, sub, ".git"));
    } catch {
      return { status: "skipped", reason: `submodule ${sub} absent` };
    }
  }
  const ingestMyc = await Deno.stat(
    join(ROOT, "myc", "src", "x5F10_import_substrate_receipt.ts"),
  ).then(() => true).catch(() => false);
  const { code, stdout, stderr } = await new Deno.Command("deno", {
    args: [
      "run",
      "-A",
      "src/x6420_phi_roundtrip.ts",
      ...(ingestMyc ? ["--ingest-myc"] : []),
      "--json",
    ],
    cwd: ROOT,
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (code !== 0) {
    await runGit(["checkout", "--", "fixtures/phi"]);
    return {
      status: "failed",
      detail: new TextDecoder().decode(stderr).trim().split("\n").slice(-3),
    };
  }
  const lastLine = new TextDecoder().decode(stdout).trim().split("\n").pop() ??
    "";
  try {
    const parsed = JSON.parse(lastLine);
    return {
      status: "ok",
      intent_sha256: parsed.intent_sha256,
      receipt_sha256: parsed.receipt_sha256,
      myc_ingest: parsed.myc_ingest,
    };
  } catch {
    return { status: "ok", note: "roundtrip green, summary unparsed" };
  }
}

/** fmt --check + type-check must pass before the loop commits anything.
 *  Returns the first failing gate's name so the act log can say WHY a tick
 *  reverted/refused — a bare revert masks pre-existing repo debt as "drift"
 *  (observed 2026-06-08..11: unformatted files from f5b1156 reddened fmt
 *  repo-wide and three ticks reverted with no recorded reason). */
async function localGatesFailure(): Promise<"fmt" | "typecheck" | null> {
  const fmt = await new Deno.Command("deno", {
    args: ["fmt", "--check"],
    cwd: ROOT,
    stdout: "null",
    stderr: "null",
  }).output();
  if (fmt.code !== 0) return "fmt";
  const chk = await new Deno.Command("bash", {
    args: ["-c", "deno check src/*.ts"],
    cwd: ROOT,
    stdout: "null",
    stderr: "null",
  }).output();
  return chk.code === 0 ? null : "typecheck";
}

async function appendActLog(entry: Record<string, unknown>): Promise<void> {
  await Deno.mkdir(dirname(LOG_FILE), { recursive: true });
  await Deno.writeTextFile(
    LOG_FILE,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      kind: "tick_act",
      ...entry,
    }) + "\n",
    { append: true },
  );
}

/** Gate-relevant classification of the live Court evidence (codex R1):
 *  - verified:     ran, parsed, no drift, ≥ MIN_LAW_WITNESSES declared → may mutate
 *  - drift:        ran, parsed, law_hash_drift or bridge=false → refuse
 *  - insufficient: ran, parsed, no drift, but < MIN_LAW_WITNESSES → refuse (can't verify)
 *  - invalid:      ran but verdict unparseable/malformed → refuse
 *  - unavailable:  court process did not produce output → refuse mutation
 *  Only `verified` authorizes autonomous mutation; everything else is fail-CLOSED
 *  for --act, while read-only orientation tolerates all states. */
type LawState =
  | "verified"
  | "drift"
  | "insufficient"
  | "invalid"
  | "unavailable";

/** Minimum independently-declared law witnesses required to call the law
 *  surface verified for mutation. Two = a real cross-substrate agreement
 *  (e.g. trinity witnessing + omega native), not a single self-report. */
const MIN_LAW_WITNESSES = 2;

interface LawWatch {
  ran: boolean;
  state: LawState;
  law_agreement: boolean | null;
  law_witness_count: number;
  witnesses: string[];
  drift: boolean;
}

/** Does this watch authorize autonomous mutation? Only verified evidence does —
 *  absence of drift is NOT enough (codex R1: unavailable ≠ proven-clean). Pure. */
export function lawPermitsMutation(watch: LawWatch): boolean {
  return watch.state === "verified";
}

const INERT_LAW_WATCH: LawWatch = {
  ran: false,
  state: "unavailable",
  law_agreement: null,
  law_witness_count: 0,
  witnesses: [],
  drift: false,
};

/** Interpret a SubstrateCourtLiveVerdict into a LawWatch — PURE, so the
 *  safety-critical drift decision (which gates autonomous --act) is unit-tested
 *  and cannot silently regress. Drift = any law_hash_drift conflict OR a
 *  law_bridge that is explicitly inconsistent (false; null = unverifiable, not
 *  drift). Exported for daemon_test. */
export function interpretCourtVerdict(verdict: unknown): LawWatch {
  if (verdict === undefined) return INERT_LAW_WATCH; // court produced nothing
  if (typeof verdict !== "object" || verdict === null) {
    return { ...INERT_LAW_WATCH, ran: true, state: "invalid" };
  }
  const v = verdict as Record<string, unknown>;
  const courtRaw = v.court;
  // A live verdict with no court object is malformed for gate purposes.
  if (typeof courtRaw !== "object" || courtRaw === null) {
    return { ...INERT_LAW_WATCH, ran: true, state: "invalid" };
  }
  const court = courtRaw as Record<string, unknown>;
  const conflicts = Array.isArray(court.conflicts) ? court.conflicts : [];
  const bridge = (v.law_bridge ?? {}) as Record<string, unknown>;
  const drift =
    conflicts.some((c) =>
      (c as { kind?: string })?.kind === "law_hash_drift"
    ) || bridge.consistent === false;
  const law_witness_count = (court.law_witness_count ?? 0) as number;
  const state: LawState = drift
    ? "drift"
    : law_witness_count < MIN_LAW_WITNESSES
    ? "insufficient"
    : "verified";
  return {
    ran: true,
    state,
    law_agreement: (court.law_agreement ?? null) as boolean | null,
    law_witness_count,
    witnesses: Array.isArray(v.witnesses) ? v.witnesses as string[] : [],
    drift,
  };
}

/** Read-only law-agreement watch: run the live Substrate Court and report
 *  whether the substrates that declare a law_hash agree (antigravity T3, the
 *  "court daemon"). The daemon will not --act while the law surface is drifting:
 *  self-maintaining and publishing onto a substrate whose physical law is
 *  contested across layers would commit into an inconsistent state. Best-effort
 *  — if the court can't run, the watch is inert (never a false alarm). */
async function lawWatch(): Promise<LawWatch> {
  let text = "";
  try {
    const { stdout } = await new Deno.Command(join(ROOT, "t"), {
      args: ["court", "--live"],
      cwd: ROOT,
      stdout: "piped",
      stderr: "null",
    }).output();
    text = new TextDecoder().decode(stdout)
      .split("\n").filter((l) => !l.trimStart().startsWith("#")).join("\n")
      .trim();
  } catch {
    return INERT_LAW_WATCH; // process could not run → unavailable
  }
  if (!text) return INERT_LAW_WATCH; // no output → unavailable
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ...INERT_LAW_WATCH, ran: true, state: "invalid" };
  }
  return interpretCourtVerdict(parsed);
}

async function handleAct(useJson: boolean, push: boolean): Promise<void> {
  const report = (o: Record<string, unknown>) => {
    if (useJson) {
      console.log(JSON.stringify({ type: "daemon_act", ...o }, null, 2));
    } else {
      console.log(`# daemon @ 7/F — tick --act`);
      console.log(
        `# ──────────────────────────────────────────────────────────────────`,
      );
      for (const [k, v] of Object.entries(o)) {
        console.log(`# ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
      }
    }
  };

  // Hard preconditions — the loop only acts from a known-good, human-free state.
  if (await readLockFile()) {
    report({ action: "refused", reason: "daemon locked" });
    return;
  }
  if (!(await worktreeClean())) {
    report({
      action: "refused",
      reason: "worktree dirty — commit or stash human work before --act",
    });
    return;
  }

  // A gate that is already red BEFORE regen is pre-existing repo debt, not
  // the daemon's drift. Reverting would mask it; refuse loudly instead so the
  // failure is attributable to the commits that introduced it.
  const preExisting = await localGatesFailure();
  if (preExisting) {
    await appendActLog({
      action: "refused",
      reason: "pre_existing_gate_failure",
      gate: preExisting,
    });
    report({
      action: "refused",
      reason:
        `pre-existing ${preExisting} failure — repo debt predates this tick; ` +
        "fix the offending commits, the daemon will not mask them",
      gate: preExisting,
    });
    return;
  }

  // Law gate (antigravity T3, hardened per codex R1): mutation requires
  // VERIFIED Court evidence — never merely the absence of drift. Unavailable,
  // invalid, drifting, or insufficient-witness evidence all fail CLOSED. (The
  // read-only tick, by contrast, tolerates every state — see handleTick.)
  const law = await lawWatch();
  if (!lawPermitsMutation(law)) {
    const reason: Record<LawState, string> = {
      verified: "",
      drift:
        "law drift across substrates — refusing to publish onto a contested law surface",
      insufficient:
        `only ${law.law_witness_count} declared law witness(es) (need ${MIN_LAW_WITNESSES}) — cannot verify the law surface`,
      invalid: "Court verdict malformed — cannot verify the law surface",
      unavailable:
        "Court did not run (e.g. submodules absent) — refusing to mutate without verified law evidence",
    };
    await appendActLog({ action: "refused", reason: law.state, law });
    report({
      action: "refused",
      reason: `${reason[law.state]}; inspect with \`t court --live\``,
      law_watch: law,
    });
    return;
  }

  // Safe deterministic actions: one heartbeat through the phi bridge, then
  // bring the stable projections current. Both are regen-and-commit-if-
  // drifted; the pulse result rides along in the log either way.
  const pulse = await phiPulse();
  await regenerateProjections();
  // x9000/MANIFEST.myc.ndjson is a submodule-shadow side-effect of the
  // external-surfaces regen: its content depends on whether submodules are
  // present, so it is environment state, not a stable projection. The loop
  // must not commit it (per the CI submodule decoupling).
  await runGit(["checkout", "--", "x9000/MANIFEST.myc.ndjson"]);
  const status = await runGit(["status", "--short"]);
  const drifted = status.out.trim().split("\n").map((l) => l.trim()).filter(
    Boolean,
  );
  if (drifted.length === 0) {
    // Idle must leave the tree clean (next tick's precondition), so the
    // heartbeat lands in the ignored runtime sidecar, not the tracked log.
    await Deno.writeTextFile(
      join(ROOT, "src", "x7F88_daemon.last-pulse"),
      JSON.stringify({ timestamp: new Date().toISOString(), pulse }) + "\n",
    );
    report({
      action: "idle",
      note: "projections current — nothing safe to maintain",
      pulse,
      law_watch: law,
    });
    return;
  }

  // Verify before committing; revert if the regenerated state is unsound.
  const postRegen = await localGatesFailure();
  if (postRegen) {
    await runGit(["checkout", "--", "."]);
    await appendActLog({ action: "reverted", drifted, gate: postRegen, pulse });
    report({
      action: "reverted",
      reason:
        `${postRegen} failed after regen (was green before) — left tree clean`,
      drifted,
      gate: postRegen,
    });
    return;
  }

  // Log BEFORE staging so the act record (a tracked file) is committed in the
  // same commit — otherwise the appended line leaves the tree dirty and the
  // next --act refuses.
  await appendActLog({
    action: "committed",
    files: drifted,
    pushed: push,
    pulse,
  });
  await runGit(["add", "-A"]);
  const commitMsg =
    "auto(daemon): refresh stable projections [tick --act]\n\n" +
    "The self-driving loop regenerated drifted stable projections to keep CI\n" +
    "green. Deterministic, verified (fmt + type-check), reversible via git.\n\n" +
    "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>";
  const commit = await runGit(["commit", "-q", "-m", commitMsg]);
  if (!commit.ok) {
    report({ action: "error", reason: "commit failed", detail: commit.out });
    return;
  }
  const head = (await runGit(["rev-parse", "--short", "HEAD"])).out.trim();
  let pushed = false;
  if (push) {
    const p = await runGit(["push", "origin", "main"]);
    pushed = p.ok;
  }
  report({
    action: "committed",
    commit: head,
    files: drifted,
    pushed,
    pulse,
    law_watch: law,
  });
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
  const law = await lawWatch();

  const rec = await readLatestRecommendation();
  const recs = (rec?.recommendations ?? []) as Array<Record<string, unknown>>;
  const top = recs[0] ?? null;
  const openHorizons = (rec?.open_horizons ?? []) as Array<
    { coordinate?: string; handle?: string; horizon?: string }
  >;

  // Whose turn: for the chosen (top) open horizon, surface the voice that
  // claimed it, or — if unclaimed — the best-fit voice by standing. Plus the
  // full claim board across open horizons. This is routing only; the safe gate
  // still forbids acting.
  const claims = await loadClaims();
  const claimed_horizons = openHorizons
    .filter((h) => h.coordinate && h.handle)
    .map((h) => ({ horizon: `x${h.coordinate}_${h.handle}`, h }))
    .filter((x) => claims.has(x.horizon))
    .map((x) => ({ horizon: x.horizon, voice: claims.get(x.horizon)!.voice }));

  const chosen = openHorizons[0] ?? null;
  let whoseTurn:
    | {
      horizon: string;
      claimed_by: string | null;
      claim_chord: string | null;
      best_fit: string | null;
      source: "claim" | "best-fit-standing";
    }
    | null = null;
  if (chosen?.coordinate && chosen?.handle) {
    const horizonKey = `x${chosen.coordinate}_${chosen.handle}`;
    const claimed = claims.get(horizonKey) ?? null;
    let bestFit: string | null = null;
    if (!claimed) {
      const voicesData = await runTJson(["voices"]);
      const voices = (voicesData?.voices ?? []) as Array<
        { identity: string; comfort_field_synthetic?: string }
      >;
      bestFit = bestFitVoice(chosen.coordinate, voices);
    }
    whoseTurn = {
      horizon: horizonKey,
      claimed_by: claimed?.voice ?? null,
      claim_chord: claimed?.chord_id ?? null,
      best_fit: claimed ? null : bestFit,
      source: claimed ? "claim" : "best-fit-standing",
    };
  }

  // Safe mode: the driver never crosses the action boundary on its own.
  const tick = {
    type: "daemon_tick",
    schema: "trinity.daemon-tick.v0.1",
    mode: "safe-readonly",
    oriented: {
      attention_level: attention.level ?? null,
      attention_score: attention.score ?? null,
      worktree_clean: clean,
      law_state: law.state,
      law_agreement: law.law_agreement,
      law_witnesses: law.witnesses,
      law_drift: law.drift,
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
    whose_turn: whoseTurn,
    claimed_horizons,
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
  console.log(
    `# law:     ${tick.oriented.law_state} — ${
      tick.oriented.law_drift
        ? "⚠ DRIFT across substrates"
        : `agreement=${tick.oriented.law_agreement} (${
          (tick.oriented.law_witnesses ?? []).length
        } witnesses)`
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
  if (whoseTurn) {
    const who = whoseTurn.claimed_by
      ? `${whoseTurn.claimed_by} (claimed)`
      : `${whoseTurn.best_fit ?? "—"} (best fit, unclaimed)`;
    console.log(`# whose turn: ${who}  for ${whoseTurn.horizon}`);
  }
  if (claimed_horizons.length > 0) {
    console.log(
      `# claims:  ${
        claimed_horizons.map((c) => `${c.horizon}→${c.voice}`).join(", ")
      }`,
    );
  }
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
    if (args.includes("--act")) {
      await handleAct(useJson, args.includes("--push"));
    } else {
      await handleTick(useJson);
    }
    return;
  }

  // default: status
  const status = await buildStatus();
  console.log(useJson ? renderJson(status) : renderTable(status));
}

main();
