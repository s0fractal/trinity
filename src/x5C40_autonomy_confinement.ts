#!/usr/bin/env -S deno run --allow-read
// src/x5C40_autonomy_confinement.ts — A1 confinement receipt (codex x7700_954451).
// position: 5/C4 → action × bridge = the exact box a reversible action runs inside.
// skill_safe: yes-readonly  (classified 2026-06-26 from AST behaviour — codex x5d00 P0)
// hex_dipole: "00 00 00 00 00 59 00 00"
// placement_policy: axis
//
// codex's sequence is: verified facts -> CONFINED WARRANT -> transactional A1 dogfood
// -> epoch mandate -> scheduler. This is the confined-warrant link, and it is still
// PURE: it builds and verifies the box, it does not execute. A confinement receipt
// binds an A1 (reversible local maintenance) action to an EXACT pre-state, an EXACT
// allowed write-set, a single allowed generator, the gates that must pass after, a
// rollback, and an output budget. An executor may write ONLY inside this box; a write
// outside the set, a stale pre-state, a failed gate, or a budget overrun is a
// confinement violation and must be rolled back. Fail-closed: anything the receipt
// does not explicitly allow is forbidden.

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
function stable(v: Json): string {
  if (v === null) return "null";
  if (typeof v === "boolean" || typeof v === "number") return JSON.stringify(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  return `{${
    Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`)
      .join(",")
  }}`;
}
async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) =>
    b.toString(16).padStart(2, "0")
  )
    .join("");
}

/** A file's exact content hash at the moment the receipt was minted. A stale
 *  pre-state (the file changed underneath) invalidates the action — re-mint, never
 *  best-effort. */
export interface FileState {
  path: string;
  hash: string | null; // null = the file did not exist (a create is allowed only if declared)
}

export interface A1ConfinementReceipt {
  action_profile: string; // the ratified A1 profile this action runs under
  verb: string;
  target: string;
  pre_state: FileState[]; // exact hashes of every file the action may touch
  allowed_write_set: string[]; // the ONLY paths a write may land in
  generator: string; // the single allowed command that produces the write
  required_gates: string[]; // gates that must pass after (e.g. fmt, generation-diff)
  rollback: string; // how to undo (e.g. git checkout -- <write-set>)
  output_budget: { max_bytes: number; max_seconds: number };
  commitment: string; // sha256 over the canonical receipt body
}

/** Build the receipt from a profile + the EXACT files it may touch (their current
 *  hashes are the pre-state). Pure over supplied state; the caller snapshots the
 *  files. The commitment binds every field, so an executor re-verifies it. */
export async function buildConfinement(
  input: Omit<A1ConfinementReceipt, "commitment">,
): Promise<A1ConfinementReceipt> {
  const body = {
    action_profile: input.action_profile,
    allowed_write_set: [...input.allowed_write_set].sort(),
    generator: input.generator,
    output_budget: input.output_budget,
    pre_state: [...input.pre_state].sort((a, b) =>
      a.path.localeCompare(b.path)
    ),
    required_gates: [...input.required_gates].sort(),
    rollback: input.rollback,
    target: input.target,
    verb: input.verb,
  };
  return {
    ...input,
    commitment: `sha256:${await sha256(stable(body as unknown as Json))}`,
  };
}

/** What an executor observed after running the generator. */
export interface ConfinementObservation {
  written_paths: string[]; // every path the run actually touched
  post_state: FileState[]; // hashes after the run (for the write-set)
  gate_results: Record<string, "pass" | "fail" | "skipped">;
  bytes_written: number;
  seconds: number;
}

export type ViolationKind =
  | "commitment_mismatch"
  | "duplicate_path"
  | "noncanonical_path"
  | "pre_state_set_mismatch"
  | "post_state_set_mismatch"
  | "invalid_budget"
  | "write_outside_set"
  | "stale_pre_state"
  | "gate_failed"
  | "gate_missing"
  | "budget_exceeded";

export interface ConfinementVerdict {
  confined: boolean;
  violations: { kind: ViolationKind; detail: string }[];
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((v) => seen.has(v) || !seen.add(v));
}

/** A receipt path is a canonical repository-relative token. Realpath/symlink
 * containment is an execution-time check; this lexical check prevents obvious
 * aliasing before an executor touches the filesystem. */
export function canonicalReceiptPath(path: string): boolean {
  if (
    !path || path.startsWith("/") || path.includes("\\") || path.includes("//")
  ) {
    return false;
  }
  const parts = path.split("/");
  return parts.every((p) => p !== "" && p !== "." && p !== "..");
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const bs = new Set(b);
  return a.every((v) => bs.has(v));
}

/** Verify the receipt itself before considering an observation. This is the
 * pre-execution half of confinement: commitment, exact pre-state/write-set
 * correspondence, canonical paths and finite positive budgets. */
export async function verifyConfinementReceipt(
  receipt: A1ConfinementReceipt,
): Promise<ConfinementVerdict> {
  const violations: ConfinementVerdict["violations"] = [];
  const rebuilt = await buildConfinement(receipt);
  if (rebuilt.commitment !== receipt.commitment) {
    violations.push({
      kind: "commitment_mismatch",
      detail: "receipt body does not match its commitment",
    });
  }
  const allowed = receipt.allowed_write_set;
  const prePaths = receipt.pre_state.map((f) => f.path);
  for (const path of [...allowed, ...prePaths]) {
    if (!canonicalReceiptPath(path)) {
      violations.push({
        kind: "noncanonical_path",
        detail: `${path} is not a canonical repository-relative path`,
      });
    }
  }
  for (const path of [...duplicates(allowed), ...duplicates(prePaths)]) {
    violations.push({
      kind: "duplicate_path",
      detail: `${path} occurs more than once in the confinement receipt`,
    });
  }
  if (!sameSet(allowed, prePaths)) {
    violations.push({
      kind: "pre_state_set_mismatch",
      detail: "pre_state must bind exactly every path in allowed_write_set",
    });
  }
  if (
    !Number.isFinite(receipt.output_budget.max_bytes) ||
    receipt.output_budget.max_bytes <= 0 ||
    !Number.isFinite(receipt.output_budget.max_seconds) ||
    receipt.output_budget.max_seconds <= 0
  ) {
    violations.push({
      kind: "invalid_budget",
      detail: "output budgets must be finite positive numbers",
    });
  }
  return { confined: violations.length === 0, violations };
}

/** Verify an observation against the receipt. Fail-closed: every required gate must
 *  be `pass`; every written path must be in the allowed set; no budget may be
 *  exceeded. `currentPreState` (the files' hashes NOW, before the run) must match the
 *  receipt's pre_state, or the action ran on drifted state. */
export function verifyConfinement(
  receipt: A1ConfinementReceipt,
  obs: ConfinementObservation,
  currentPreState: FileState[],
): ConfinementVerdict {
  const violations: ConfinementVerdict["violations"] = [];

  // pre-state must be exactly what the receipt minted against.
  const preByPath = new Map(receipt.pre_state.map((f) => [f.path, f.hash]));
  const curByPath = new Map(currentPreState.map((f) => [f.path, f.hash]));
  if (!sameSet([...preByPath.keys()], [...curByPath.keys()])) {
    violations.push({
      kind: "pre_state_set_mismatch",
      detail:
        "current pre-state must contain exactly the receipt pre-state paths",
    });
  }
  for (const [path, hash] of preByPath) {
    if (curByPath.get(path) !== hash) {
      violations.push({
        kind: "stale_pre_state",
        detail: `pre-state of ${path} drifted since the receipt was minted`,
      });
    }
  }

  // every write must land inside the allowed set.
  const allowed = new Set(receipt.allowed_write_set);
  for (const p of obs.written_paths) {
    if (!allowed.has(p)) {
      violations.push({
        kind: "write_outside_set",
        detail: `${p} is not in the allowed write-set`,
      });
    }
  }

  const postPaths = obs.post_state.map((f) => f.path);
  if (!sameSet(receipt.allowed_write_set, postPaths)) {
    violations.push({
      kind: "post_state_set_mismatch",
      detail: "post_state must report exactly every allowed write path",
    });
  }

  // every required gate must be present and pass.
  for (const g of receipt.required_gates) {
    const r = obs.gate_results[g];
    if (r === undefined) {
      violations.push({
        kind: "gate_missing",
        detail: `required gate '${g}' not run`,
      });
    } else if (r !== "pass") {
      violations.push({ kind: "gate_failed", detail: `gate '${g}' = ${r}` });
    }
  }

  // budgets.
  if (obs.bytes_written > receipt.output_budget.max_bytes) {
    violations.push({
      kind: "budget_exceeded",
      detail: `${obs.bytes_written} bytes > ${receipt.output_budget.max_bytes}`,
    });
  }
  if (obs.seconds > receipt.output_budget.max_seconds) {
    violations.push({
      kind: "budget_exceeded",
      detail: `${obs.seconds}s > ${receipt.output_budget.max_seconds}s`,
    });
  }

  return { confined: violations.length === 0, violations };
}

// ── CLI (read-only) ──────────────────────────────────────────────────────────────
async function fileState(path: string): Promise<FileState> {
  try {
    return {
      path,
      hash: `sha256:${await sha256(await Deno.readTextFile(path))}`,
    };
  } catch {
    return { path, hash: null };
  }
}
function flag(args: string[], n: string): string | undefined {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
}

export async function runCli(args: string[] = Deno.args): Promise<void> {
  const sub = args[0];
  if (sub === "build") {
    const profile = flag(args, "profile");
    const verb = flag(args, "verb");
    const target = flag(args, "target");
    const generator = flag(args, "generator");
    const writeSet = (flag(args, "write-set") ?? "").split(",").filter(Boolean);
    if (!profile || !verb || !target || !generator || writeSet.length === 0) {
      console.error(
        "# error: build needs --profile --verb --target --generator --write-set <a,b>",
      );
      Deno.exitCode = 1;
      return;
    }
    const gates = (flag(args, "gates") ?? "fmt").split(",").filter(Boolean);
    const receipt = await buildConfinement({
      action_profile: profile,
      verb,
      target,
      pre_state: await Promise.all(writeSet.map(fileState)),
      allowed_write_set: writeSet,
      generator,
      required_gates: gates,
      rollback: flag(args, "rollback") ??
        `git checkout -- ${writeSet.join(" ")}`,
      output_budget: {
        max_bytes: Number(flag(args, "max-bytes") ?? 1_000_000),
        max_seconds: Number(flag(args, "max-seconds") ?? 120),
      },
    });
    console.log(
      JSON.stringify(
        { type: "a1_confinement", position: "5/C4", receipt },
        null,
        2,
      ),
    );
    return;
  }
  console.log(JSON.stringify(
    {
      type: "a1_confinement",
      position: "5/C4",
      usage: [
        "confinement build --profile <p> --verb <v> --target <t> --generator <cmd> --write-set <a,b> [--gates fmt,...] [--rollback <cmd>]",
      ],
      note:
        "the exact box a reversible A1 action runs inside (codex x7700_954451). Builds/verifies the box; never executes. An executor may write only inside it.",
    },
    null,
    2,
  ));
}

if (import.meta.main) await runCli();
