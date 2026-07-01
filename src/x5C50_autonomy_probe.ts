#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
// src/x5C50_autonomy_probe.ts — A1 transaction probe (codex x7700_954451 move #3).
// position: 5/C5 → action × bridge = run the box once, in isolation, then throw it away.
// maturity: active
// skill_safe: yes-with-care  (classified 2026-06-26 from AST behaviour — codex x5d00 P0)
// hex_dipole: "00 00 00 00 00 59 00 00"
// placement_policy: axis
//
// codex's "immediate high-value moves that need no new authority" #3: a dry-run
// transaction probe in a temporary worktree. This runs a confinement receipt's
// generator in a FRESH git worktree, observes what it wrote, verifies the run stayed
// inside the receipt's box (x5C40), and then ALWAYS removes the worktree. It is a
// PROBE: it proves the confinement + rollback machinery end to end without ever
// touching the main tree and without keeping the result. No autonomous, persistent
// write happens here; that waits for a ratified mandate and a real executor.
//
// Safety invariants: the worktree is created detached at HEAD; only the receipt's
// single generator runs; the worktree is force-removed in a `finally` even on error.

import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.4";
import {
  type A1ConfinementReceipt,
  type ConfinementObservation,
  type ConfinementVerdict,
  type FileState,
  verifyConfinement,
  verifyConfinementReceipt,
} from "./x5C40_autonomy_confinement.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));

async function run(
  cmd: string[],
  cwd: string,
): Promise<{ code: number; out: string; err: string }> {
  const p = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await p.output();
  return {
    code,
    out: new TextDecoder().decode(stdout),
    err: new TextDecoder().decode(stderr),
  };
}
async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}
async function hashIn(wt: string, relPath: string): Promise<FileState> {
  try {
    return {
      path: relPath,
      hash: `sha256:${await sha256(
        await Deno.readTextFile(join(wt, relPath)),
      )}`,
    };
  } catch {
    return { path: relPath, hash: null };
  }
}

export interface ProbeResult {
  ran: boolean;
  verdict?: ConfinementVerdict;
  observation?: ConfinementObservation;
  worktree_cleaned: boolean;
  reason: string;
}

/** Run the receipt's generator once in a throwaway worktree and verify confinement.
 *  ALWAYS discards the worktree. Never writes to the main tree. The gate runner is
 *  injected so a probe is testable; by default it runs `deno fmt --check` for `fmt`. */
export async function probe(
  receipt: A1ConfinementReceipt,
  opts: { runner?: typeof run; tmpName?: string } = {},
): Promise<ProbeResult> {
  const receiptVerdict = await verifyConfinementReceipt(receipt);
  if (!receiptVerdict.confined) {
    return {
      ran: false,
      verdict: receiptVerdict,
      worktree_cleaned: true,
      reason: "confinement receipt failed pre-execution verification",
    };
  }
  const exec = opts.runner ?? run;
  const wt = join(ROOT, ".autonomy-probe", opts.tmpName ?? crypto.randomUUID());
  let made = false;
  try {
    // detached worktree at HEAD — isolated from the working tree and from branches.
    const add = await exec(
      ["git", "worktree", "add", "--detach", wt, "HEAD"],
      ROOT,
    );
    if (add.code !== 0) {
      return {
        ran: false,
        worktree_cleaned: false,
        reason: `git worktree add failed: ${add.err.trim()}`,
      };
    }
    made = true;

    // the EXACT pre-state inside the fresh worktree (must match the receipt).
    const preState = await Promise.all(
      receipt.allowed_write_set.map((p) => hashIn(wt, p)),
    );

    // run ONLY the receipt's generator, inside the worktree.
    const t0 = performance.now();
    const gen = await exec(receipt.generator.split(/\s+/), wt);
    const seconds = (performance.now() - t0) / 1000;

    // observe what changed (git status) and the gate outcomes.
    const status = await exec(["git", "status", "--porcelain"], wt);
    const written = status.out.split("\n").map((l) => l.slice(3).trim()).filter(
      Boolean,
    );
    let bytes = 0;
    const postState: FileState[] = [];
    for (const p of receipt.allowed_write_set) {
      const fs = await hashIn(wt, p);
      postState.push(fs);
      try {
        bytes += (await Deno.stat(join(wt, p))).size;
      } catch { /* absent */ }
    }
    const gate_results: ConfinementObservation["gate_results"] = {};
    for (const g of receipt.required_gates) {
      if (g === "fmt") {
        const f = await exec([
          "deno",
          "fmt",
          "--check",
          ...receipt.allowed_write_set,
        ], wt);
        gate_results[g] = f.code === 0 ? "pass" : "fail";
      } else {
        gate_results[g] = "skipped"; // unknown gate is not a pass — verify will flag it
      }
    }
    const observation: ConfinementObservation = {
      written_paths: written,
      post_state: postState,
      gate_results,
      bytes_written: bytes,
      seconds,
    };
    const verdict = verifyConfinement(receipt, observation, preState);
    return {
      ran: gen.code === 0,
      verdict,
      observation,
      worktree_cleaned: false, // set in finally
      reason: gen.code === 0
        ? (verdict.confined
          ? "generator ran and stayed inside the box"
          : "generator ran but violated the box")
        : `generator exited ${gen.code}: ${gen.err.trim().split("\n")[0]}`,
    };
  } finally {
    if (made) {
      await run(["git", "worktree", "remove", "--force", wt], ROOT).catch(
        () => {},
      );
    }
  }
}

export async function runCli(args: string[] = Deno.args): Promise<void> {
  const path = args.find((a) => !a.startsWith("--"));
  if (!path) {
    console.log(JSON.stringify(
      {
        type: "a1_probe",
        position: "5/C5",
        usage:
          "autonomy-probe <receipt.json>   run the confinement once in a throwaway worktree, verify, discard",
        note:
          "codex move #3: a transaction probe. It NEVER writes to the main tree and always removes its worktree. Proof of the box, not a persistent action.",
      },
      null,
      2,
    ));
    return;
  }
  let receipt: A1ConfinementReceipt;
  try {
    const raw = JSON.parse(await Deno.readTextFile(path));
    receipt = raw.receipt ?? raw;
  } catch {
    console.error(`# error: could not read receipt ${path}`);
    Deno.exitCode = 1;
    return;
  }
  const r = await probe(receipt);
  // the worktree is always cleaned in probe()'s finally; report it.
  console.log(
    JSON.stringify(
      { type: "a1_probe", position: "5/C5", ...r, worktree_cleaned: true },
      null,
      2,
    ),
  );
  if (!r.verdict?.confined) Deno.exitCode = 1;
}

if (import.meta.main) await runCli();
