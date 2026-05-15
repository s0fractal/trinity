#!/usr/bin/env -S deno run --allow-read --allow-write
// 0x7/F.ts — daemon status / runtime state surface
// position: 7/F → completion(7) × action(5) = decisive runtime act
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
//   t daemon stop             # write state/daemon.lock
//   t daemon start            # remove state/daemon.lock
//
// Glossary words: daemon, демон

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const LOCK_FILE = join(ROOT, "state", "daemon.lock");
const LOG_DIR = join(ROOT, "daemon", "logs");
const LOG_FILE = join(LOG_DIR, "invocations.ndjson");

// ── types ──────────────────────────────────────────────────────────────────

interface DaemonStatus {
  status: "running" | "stopped";
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
    const text = await Deno.readTextFile(LOG_FILE);
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
    const text = await Deno.readTextFile(LOG_FILE);
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

// ── state mutators ─────────────────────────────────────────────────────────

async function writeLock(): Promise<void> {
  await Deno.mkdir(dirname(LOCK_FILE), { recursive: true });
  await Deno.writeTextFile(LOCK_FILE, `locked_at: ${new Date().toISOString()}\n`);
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
    `# status     last_invocation         style_active    invocations_24h`,
    `# ──────────────────────────────────────────────────────────────────`,
    `# ${status.status.padEnd(10)} ${(status.last_invocation ?? "—").padEnd(23)} ${(status.style_active ?? "—").padEnd(15)} ${String(status.invocation_count_24h).padStart(4)}`,
  ];
  return lines.join("\n");
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

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = Deno.args;
  const cmd = args[0] || "status";
  const useJson = args.includes("--json");

  if (cmd === "stop") {
    await writeLock();
    const status: DaemonStatus = {
      status: "stopped",
      lock_file: true,
      last_invocation: await readLastInvocation(),
      style_active: null,
      invocation_count_24h: await countInvocations24h(),
    };
    console.log(useJson ? renderJson(status) : renderTable(status));
    return;
  }

  if (cmd === "start") {
    await removeLock();
    const status: DaemonStatus = {
      status: "running",
      lock_file: false,
      last_invocation: await readLastInvocation(),
      style_active: null,
      invocation_count_24h: await countInvocations24h(),
    };
    console.log(useJson ? renderJson(status) : renderTable(status));
    return;
  }

  // default: status
  const locked = await readLockFile();
  const status: DaemonStatus = {
    status: locked ? "stopped" : "running",
    lock_file: locked,
    last_invocation: await readLastInvocation(),
    style_active: null,
    invocation_count_24h: await countInvocations24h(),
  };
  console.log(useJson ? renderJson(status) : renderTable(status));
}

main();
