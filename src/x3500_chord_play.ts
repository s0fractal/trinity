#!/usr/bin/env -S deno run -A
// src/x3500_chord_play.ts — chord_play (Triangle/Build + Action)
// position: 3/5 → triangle(3) × action(5)
// skill_safe: yes-with-care
// hex_dipole: "26 26 26 6C 26 59 26 26"
// placement_policy: axis
// intent: parse and visualize chord structure; scaffold new chord files
// maturity: active
// horizon: extend to new chord coordinate-naming convention (x<type>_<block>_<voice>_<slug>.md)
//
// chord_play.ts — parse and visualize chord structure

import { parse as parseYaml } from "https://deno.land/std@0.224.0/yaml/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { sha256Hex } from "./x4010_hash.ts";
import { type FileProfile, scanEcosystem } from "./x0020_scanner_core.ts";

/**
 * chord_play
 *
 * Reads a chord file, parses its claim_kind, and verifies it against
 * deterministic scanner output. Four kinds are recognized:
 *
 *   action          — pre-snapshot, run commands, post-snapshot, compare
 *   future-fantasy  — single snapshot, check wakeup conditions
 *   observation     — record only, no verification
 *   critique        — pointed at another chord; verifies via inspection
 *
 * Defaults to dry-run for action chords. Use --execute to actually run
 * suggested_commands. Without --execute, the tool computes the *would-be*
 * verdict assuming the action ran but doesn't perform it.
 *
 * TRIAL mode (chord frontmatter `mode: TRIAL` plus --execute):
 *   - requires clean working tree before running
 *   - if expected_after_running not met → auto-reverts via
 *     `git stash push --include-untracked` + `git stash drop`
 *   - implements reversibility-first principle from
 *     governance chord h.1a8cddefa3dc
 *
 * Spec: contracts/CHORD_CLAIM.v0.1.md (TRIAL added in v0.2 amendment)
 */

const CHORDS_DIR = "jazz/chords";

interface ChordFrontmatter {
  chord?: { primary?: string; secondary?: string[] };
  energy?: number;
  mode?: string;
  tension?: string;
  actor?: string;
  fingerprint?: string;
  hears?: string[];
  claim_kind?:
    | "action"
    | "future-fantasy"
    | "observation"
    | "critique";
  suggested_commands?: string[];
  expected_after_running?: Record<string, string>;
  becomes_actionable_when?: Record<string, string>;
  observed?: Record<string, string | number>;
  critiques?: string;
  finding?: string;
  falsifier?: string;
  falsifier_kind?: string;
}

interface Snapshot {
  L4b_hash_verified_count: number;
  L4b_hash_verified_pct: number;
  canon_vectors_pass: boolean;
  trinity_repo_verified_count: number;
  phase: Record<string, number>;
  compost_count: number;
}

function parseFrontmatter(body: string): {
  fm: ChordFrontmatter | null;
  rest: string;
} {
  const m = body.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: null, rest: body };
  try {
    const fm = parseYaml(m[1]) as ChordFrontmatter;
    return { fm, rest: m[2] };
  } catch {
    return { fm: null, rest: m[2] };
  }
}

async function buildSnapshot(): Promise<Snapshot> {
  const profiles = await scanEcosystem(Deno.cwd());
  const ontologyTotal = profiles.filter((p) => !p.isEntrypoint).length;
  const verified = profiles.filter((p) => p.L4b_hash_verified);
  const trinityVerified = verified.filter((p) => p.repo === "trinity");

  const phase: Record<string, number> = {
    "raw-fantasy": 0,
    hypothesis: 0,
    proposal: 0,
    experiment: 0,
    receipt: 0,
    formula: 0,
    crystal: 0,
    compost: 0,
  };
  for (const p of profiles) {
    if (!p.isEntrypoint) {
      phase[p.thoughtPhase] = (phase[p.thoughtPhase] ?? 0) + 1;
    }
  }

  const canonOk = await checkCanonVectors();

  return {
    L4b_hash_verified_count: verified.length,
    L4b_hash_verified_pct: ontologyTotal > 0
      ? +(100 * verified.length / ontologyTotal).toFixed(2)
      : 0,
    canon_vectors_pass: canonOk,
    trinity_repo_verified_count: trinityVerified.length,
    phase,
    compost_count: phase.compost,
  };
}

async function checkCanonVectors(): Promise<boolean> {
  const out = await new Deno.Command("deno", {
    args: ["run", "-A", "src/x6410_verify_vectors.ts"],
    stdout: "null",
    stderr: "null",
  }).output();
  return out.success;
}

function metricValue(snap: Snapshot, name: string): number | boolean {
  switch (name) {
    case "L4b_hash_verified":
    case "L4b_hash_verified_count":
      return snap.L4b_hash_verified_count;
    case "L4b_hash_verified_pct":
      return snap.L4b_hash_verified_pct;
    case "canon_vectors_pass":
      return snap.canon_vectors_pass;
    case "trinity_repo_verified_count":
      return snap.trinity_repo_verified_count;
    case "compost_count":
      return snap.compost_count;
  }
  const phaseMatch = name.match(/^phase\[(\w[\w-]*)\]$/);
  if (phaseMatch) return snap.phase[phaseMatch[1]] ?? 0;
  throw new Error(`unknown metric: ${name}`);
}

interface CompareResult {
  metric: string;
  comparator: string;
  pre: number | boolean;
  post: number | boolean;
  pass: boolean;
}

function compare(
  metric: string,
  comparator: string,
  pre: number | boolean,
  post: number | boolean,
): CompareResult {
  const result: CompareResult = { metric, comparator, pre, post, pass: false };

  // Boolean
  if (comparator === "==true") {
    result.pass = post === true;
    return result;
  }
  if (comparator === "==false") {
    result.pass = post === false;
    return result;
  }

  if (typeof post !== "number") {
    throw new Error(`metric ${metric} is not numeric`);
  }
  const preN = typeof pre === "number" ? pre : 0;

  // Delta
  let m;
  if ((m = comparator.match(/^>=\+(\d+(\.\d+)?)$/))) {
    result.pass = post >= preN + parseFloat(m[1]);
    return result;
  }
  if ((m = comparator.match(/^<=-(\d+(\.\d+)?)$/))) {
    result.pass = post <= preN - parseFloat(m[1]);
    return result;
  }
  // Percent absolute
  if ((m = comparator.match(/^>=(\d+(\.\d+)?)%$/))) {
    result.pass = post >= parseFloat(m[1]);
    return result;
  }
  if ((m = comparator.match(/^<=(\d+(\.\d+)?)%$/))) {
    result.pass = post <= parseFloat(m[1]);
    return result;
  }
  // Numeric absolute
  if ((m = comparator.match(/^>=(\d+(\.\d+)?)$/))) {
    result.pass = post >= parseFloat(m[1]);
    return result;
  }
  if ((m = comparator.match(/^<=(\d+(\.\d+)?)$/))) {
    result.pass = post <= parseFloat(m[1]);
    return result;
  }
  if ((m = comparator.match(/^==(\d+(\.\d+)?)$/))) {
    result.pass = post === parseFloat(m[1]);
    return result;
  }
  throw new Error(`unrecognized comparator: ${comparator}`);
}

async function isWorkingTreeClean(): Promise<boolean> {
  // Ignore submodule modifications — trinity's working tree means
  // trinity's own files. Submodules are sovereign.
  const out = await new Deno.Command("git", {
    args: ["status", "--porcelain", "--ignore-submodules=all"],
    stdout: "piped",
    stderr: "null",
  }).output();
  if (!out.success) return false;
  return new TextDecoder().decode(out.stdout).trim() === "";
}

async function revertWorkingTree(): Promise<boolean> {
  // TRIAL revert: stash everything (incl. untracked) and immediately drop.
  // Equivalent to "discard all changes since chord started".
  // Refuses to delete .git or commits — only working-tree state.
  const stash = await new Deno.Command("git", {
    args: [
      "stash",
      "push",
      "--include-untracked",
      "--quiet",
      "-m",
      "chord-trial-revert",
    ],
    stdout: "null",
    stderr: "inherit",
  }).output();
  if (!stash.success) return false;

  // Check if anything was actually stashed (clean tree → no stash entry).
  const list = await new Deno.Command("git", {
    args: ["stash", "list"],
    stdout: "piped",
    stderr: "null",
  }).output();
  const hasEntry = new TextDecoder().decode(list.stdout)
    .split("\n")
    .some((l) => l.includes("chord-trial-revert"));

  if (!hasEntry) return true; // nothing to revert is fine

  const drop = await new Deno.Command("git", {
    args: ["stash", "drop"],
    stdout: "null",
    stderr: "inherit",
  }).output();
  return drop.success;
}

async function runCommands(commands: string[]): Promise<boolean> {
  for (const cmd of commands) {
    console.log(`▶  ${cmd}`);
    const parts = cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
    if (!parts) continue;
    const head = parts[0];
    const args = parts.slice(1).map((a) =>
      (a.startsWith('"') && a.endsWith('"')) ||
        (a.startsWith("'") && a.endsWith("'"))
        ? a.slice(1, -1)
        : a
    );
    const out = await new Deno.Command(head, {
      args,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    if (!out.success) {
      console.error(`✗ command failed: ${cmd}`);
      return false;
    }
  }
  return true;
}

const BTC_TIP_URL = "https://blockstream.info/api/blocks/tip/height";

async function fetchBtcBlock(): Promise<number> {
  const res = await fetch(BTC_TIP_URL);
  if (!res.ok) throw new Error(`BTC API ${res.status}`);
  const text = (await res.text()).trim();
  const n = Number(text);
  if (!Number.isFinite(n)) throw new Error(`bad block height: ${text}`);
  return n;
}

async function emitReceiptChord(opts: {
  chordPath: string;
  fm: ChordFrontmatter;
  results: CompareResult[];
  verdict: "passed" | "failed" | "dormant" | "promoted" | "trial-reverted";
  pre: Snapshot;
  post: Snapshot;
}): Promise<string> {
  const { chordPath, fm, results, verdict, pre, post } = opts;
  const chordContent = await Deno.readTextFile(chordPath);
  const chordHash = `h.${(await sha256Hex(chordContent)).slice(0, 12)}`;

  const block = await fetchBtcBlock().catch(() => null);
  const blockStr = block ? String(block) : chordTimestamp();
  const slug = (fm.tension ?? "unspecified").slice(0, 40);
  const filename = `x7500_${blockStr}_trinity_${slug}-receipt.md`;
  const path = join(CHORDS_DIR, filename);

  const lines: string[] = [];
  lines.push("---");
  if (block) {
    lines.push(`anchor_block: ${block}`);
  }
  lines.push("chord:");
  lines.push('  primary: "oct:5.5"');
  lines.push('  secondary: ["oct:7.2"]');
  lines.push(`energy: 0.500`);
  lines.push(`stake_q16: 0`);
  lines.push(`mode: "REVIEW"`);
  lines.push(`tension: "receipt-${slug}"`);
  lines.push(`confidence: "high"`);
  lines.push(`receipt: "ecosystem-delta"`);
  lines.push(`actor: "trinity-chord-play"`);
  lines.push(`claim_kind: "observation"`);
  lines.push(`hears:`);
  lines.push(`  - "${chordHash}"`);
  lines.push(`verdict: "${verdict}"`);
  lines.push(`---`);
  lines.push("");
  lines.push(`# Receipt: ${verdict}`);
  lines.push("");
  lines.push(`Target chord: \`${chordPath}\` (${chordHash})`);
  lines.push(`Claim kind: ${fm.claim_kind ?? "unspecified"}`);
  lines.push("");
  lines.push("## Comparison");
  lines.push("");
  lines.push("| metric | comparator | pre | post | pass |");
  lines.push("|---|---|---:|---:|:---:|");
  for (const r of results) {
    lines.push(
      `| ${r.metric} | \`${r.comparator}\` | ${String(r.pre)} | ${
        String(r.post)
      } | ${r.pass ? "✓" : "✗"} |`,
    );
  }
  lines.push("");
  lines.push("## Pre-snapshot");
  lines.push("```json");
  lines.push(JSON.stringify(pre, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## Post-snapshot");
  lines.push("```json");
  lines.push(JSON.stringify(post, null, 2));
  lines.push("```");

  await ensureDir(CHORDS_DIR);
  await Deno.writeTextFile(path, lines.join("\n") + "\n");
  return path;
}

function chordTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    d.getUTCFullYear(),
    pad(d.getUTCMonth() + 1),
    pad(d.getUTCDate()),
    "-",
    pad(d.getUTCHours()),
    pad(d.getUTCMinutes()),
    pad(d.getUTCSeconds()),
  ].join("");
}

async function main() {
  const args = Deno.args.slice();
  const execute = args.includes("--execute");
  const positional = args.filter((a) => !a.startsWith("--"));
  if (positional.length === 0) {
    console.error("usage: deno task chord:play <chord-file> [--execute]");
    Deno.exit(1);
  }
  const chordPath = positional[0];
  const body = await Deno.readTextFile(chordPath);
  const { fm } = parseFrontmatter(body);
  if (!fm) {
    console.error(`✗ ${chordPath}: no parseable frontmatter`);
    Deno.exit(1);
  }

  const kind = fm.claim_kind;
  console.log(`chord: ${chordPath}`);
  console.log(`claim_kind: ${kind ?? "(none)"}`);

  if (kind === "observation") {
    console.log("→ observation: nothing to verify, recorded as-is.");
    return;
  }
  if (kind === "critique") {
    console.log("→ critique: verification against target chord is manual; ");
    console.log("  this tool only displays the falsifier surface.");
    if (fm.critiques) console.log(`  critiques: ${fm.critiques}`);
    if (fm.finding) console.log(`  finding:   ${fm.finding}`);
    if (fm.falsifier) console.log(`  falsifier: ${fm.falsifier}`);
    return;
  }

  if (kind === "future-fantasy") {
    if (!fm.becomes_actionable_when) {
      console.error("✗ future-fantasy chord lacks becomes_actionable_when");
      Deno.exit(1);
    }
    const snap = await buildSnapshot();
    console.log("snapshot taken; checking wakeup conditions");
    const results: CompareResult[] = [];
    for (
      const [metric, comparator] of Object.entries(fm.becomes_actionable_when)
    ) {
      const v = metricValue(snap, metric);
      results.push(compare(metric, comparator, v, v)); // no pre/post; absolute check
    }
    const allMet = results.every((r) => r.pass);
    console.log("");
    console.log("| metric | comparator | value | wake? |");
    console.log("|---|---|---:|:---:|");
    for (const r of results) {
      console.log(
        `| ${r.metric} | \`${r.comparator}\` | ${String(r.post)} | ${
          r.pass ? "✓" : "✗"
        } |`,
      );
    }
    console.log("");
    console.log(allMet ? "→ DREAM AWAKES" : "→ stay dormant");
    const receiptPath = await emitReceiptChord({
      chordPath,
      fm,
      results,
      verdict: allMet ? "promoted" : "dormant",
      pre: snap,
      post: snap,
    });
    console.log(`receipt-chord: ${receiptPath}`);
    return;
  }

  if (kind === "action") {
    if (!fm.expected_after_running) {
      console.error("✗ action chord lacks expected_after_running");
      Deno.exit(1);
    }
    const isTrial = (fm.mode ?? "").toUpperCase() === "TRIAL";
    if (isTrial && execute) {
      const clean = await isWorkingTreeClean();
      if (!clean) {
        console.error(
          "✗ TRIAL mode requires clean working tree (commit or stash first)",
        );
        Deno.exit(1);
      }
      console.log("TRIAL: clean tree confirmed; will revert on negative delta");
    }
    const commands = fm.suggested_commands ?? [];
    console.log("snapshot pre");
    const pre = await buildSnapshot();
    if (execute) {
      if (commands.length === 0) {
        console.error("✗ --execute requested but no suggested_commands");
        Deno.exit(1);
      }
      console.log("running suggested_commands…");
      const ok = await runCommands(commands);
      if (!ok) console.warn("⚠️  some commands failed; continuing to snapshot");
    } else {
      console.log("dry-run: not executing commands. (use --execute to run)");
    }
    console.log("snapshot post");
    const post = await buildSnapshot();
    const results: CompareResult[] = [];
    for (
      const [metric, comparator] of Object.entries(fm.expected_after_running)
    ) {
      const preV = metricValue(pre, metric);
      const postV = metricValue(post, metric);
      results.push(compare(metric, comparator, preV, postV));
    }
    const allMet = results.every((r) => r.pass);
    console.log("");
    console.log("| metric | comparator | pre | post | pass |");
    console.log("|---|---|---:|---:|:---:|");
    for (const r of results) {
      console.log(
        `| ${r.metric} | \`${r.comparator}\` | ${String(r.pre)} | ${
          String(r.post)
        } | ${r.pass ? "✓" : "✗"} |`,
      );
    }
    console.log("");

    let verdict: "passed" | "failed" | "trial-reverted" = allMet
      ? "passed"
      : "failed";

    if (isTrial && execute && !allMet) {
      console.log("TRIAL: claim missed → reverting working tree…");
      const reverted = await revertWorkingTree();
      if (reverted) {
        console.log("✓ reverted to pre-trial state");
        verdict = "trial-reverted";
      } else {
        console.warn("⚠️  revert failed; manual cleanup required");
      }
    }

    console.log(
      execute
        ? (allMet
          ? "→ CLAIM MET"
          : (isTrial
            ? "→ TRIAL REVERTED"
            : "→ CLAIM MISSED → compost candidate"))
        : (allMet ? "→ would-be-met (dry-run)" : "→ would-be-missed (dry-run)"),
    );
    const receiptPath = await emitReceiptChord({
      chordPath,
      fm,
      results,
      verdict,
      pre,
      post,
    });
    console.log(`receipt-chord: ${receiptPath}`);
    return;
  }

  console.error(`✗ unknown claim_kind: ${kind}`);
  Deno.exit(1);
}

main();
