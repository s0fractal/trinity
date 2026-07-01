#!/usr/bin/env -S deno run --allow-read --allow-env
// src/x5C30_autonomy_context.ts — verified capability evidence for the autonomy
// maturity: active
// kernel (codex x7700_954451 P0.5 next slice). position: 5/C3 → action × bridge.
// skill_safe: yes-readonly  (classified 2026-06-26 from AST behaviour — codex x5d00 P0)
// hex_dipole: "00 00 00 00 00 59 00 00"
// placement_policy: axis
//
// codex: "booleans in JSON are not proofs." The policy compiler (x5C20) decides
// from an AdmissionContext, but a context the caller hand-writes can claim any
// capability. This RECOMPUTES the content-bound capability evidence from the actual
// organ — its TRANSITIVE capability and a verdict hash over the whole import graph's
// dependency hashes (x0013) — so a forged or stale claim cannot survive. `build`
// emits the evidence; `verify` re-derives it and fails closed on any drift. Pure,
// read-only; it produces evidence, it never grants authority — an executor must
// independently re-verify before acting.

import { analyzeTransitive, effectVerdictHash } from "./x0013_capability.ts";
import type { CapabilityEvidence } from "./x5C20_autonomy.ts";

const reader = async (path: string): Promise<string | null> => {
  try {
    return await Deno.readTextFile(path);
  } catch {
    return null;
  }
};

async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) =>
    b.toString(16).padStart(2, "0")
  )
    .join("");
}

/** Recompute content-bound capability evidence for `verb`/`target` from the organ
 *  at `organPath`. The capability is TRANSITIVE (organ + every relative import);
 *  an unreadable edge is fail-closed to `unknown`. `verdict_hash` binds the whole
 *  effect surface + dependency hashes, so any effect-relevant edit anywhere
 *  invalidates it. `organ_hash` is the entry file's content hash. */
export async function buildCapabilityEvidence(
  verb: string,
  target: string,
  organPath: string,
  read: (p: string) => Promise<string | null> = reader,
): Promise<CapabilityEvidence | null> {
  const entry = await read(organPath);
  if (entry === null) return null;
  const verdict = await analyzeTransitive(organPath, read);
  return {
    type: "capability_receipt",
    subject_verb: verb,
    subject_target: target,
    capability: verdict.capability,
    verdict_hash: `sha256:${await effectVerdictHash(verdict)}`,
    organ_hash: `sha256:${await sha256Hex(entry)}`,
    // the recomputed CAPABILITY is the authoritative observed signal (it sets the
    // class floor in x5C20); we do not assert autonomy-tag semantic effects from
    // the AST, so this stays empty rather than claim more than is derived.
    semantic_effects: [],
  };
}

export interface VerifyResult {
  valid: boolean;
  reason: string;
  recomputed_capability?: string;
  recomputed_verdict_hash?: string;
}

/** Re-derive the evidence from the organ NOW and check it matches what the evidence
 *  claims. Any change to the organ or any dependency, or a capability that no longer
 *  matches, is invalid (fail closed). This is what an executor would re-run. */
export async function verifyCapabilityEvidence(
  evidence: CapabilityEvidence,
  organPath: string,
  read: (p: string) => Promise<string | null> = reader,
): Promise<VerifyResult> {
  const fresh = await buildCapabilityEvidence(
    evidence.subject_verb,
    evidence.subject_target,
    organPath,
    read,
  );
  if (!fresh) {
    return { valid: false, reason: `organ ${organPath} could not be read` };
  }
  if (fresh.organ_hash !== evidence.organ_hash) {
    return {
      valid: false,
      reason: "organ content changed since the evidence was built",
      recomputed_capability: fresh.capability,
      recomputed_verdict_hash: fresh.verdict_hash,
    };
  }
  if (fresh.verdict_hash !== evidence.verdict_hash) {
    return {
      valid: false,
      reason: "transitive effect surface / dependency graph changed",
      recomputed_capability: fresh.capability,
      recomputed_verdict_hash: fresh.verdict_hash,
    };
  }
  if (fresh.capability !== evidence.capability) {
    return {
      valid: false,
      reason:
        `capability drifted: claimed ${evidence.capability}, recomputed ${fresh.capability}`,
      recomputed_capability: fresh.capability,
    };
  }
  return {
    valid: true,
    reason:
      "evidence matches a fresh recomputation of the organ and its imports",
    recomputed_capability: fresh.capability,
    recomputed_verdict_hash: fresh.verdict_hash,
  };
}

function flag(args: string[], n: string): string | undefined {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
}

export async function runCli(args: string[] = Deno.args): Promise<void> {
  const sub = args[0];
  if (sub === "build") {
    const verb = flag(args, "verb");
    const target = flag(args, "target");
    const organ = flag(args, "organ");
    if (!verb || !target || !organ) {
      console.error(
        "# error: context build needs --verb, --target and --organ <file>",
      );
      Deno.exitCode = 1;
      return;
    }
    const ev = await buildCapabilityEvidence(verb, target, organ);
    if (!ev) {
      console.error(`# error: could not read organ ${organ}`);
      Deno.exitCode = 1;
      return;
    }
    console.log(
      JSON.stringify(
        { type: "autonomy_context", position: "5/C3", capability_evidence: ev },
        null,
        2,
      ),
    );
    return;
  }
  if (sub === "verify") {
    const path = args[1] && !args[1].startsWith("--") ? args[1] : undefined;
    const organ = flag(args, "organ");
    if (!path || !organ) {
      console.error(
        "# error: context verify needs <evidence.json> --organ <file>",
      );
      Deno.exitCode = 1;
      return;
    }
    let evidence: CapabilityEvidence;
    try {
      const raw = JSON.parse(await Deno.readTextFile(path));
      evidence = raw.capability_evidence ?? raw;
    } catch {
      console.error(`# error: could not read evidence ${path}`);
      Deno.exitCode = 1;
      return;
    }
    const v = await verifyCapabilityEvidence(evidence, organ);
    console.log(
      JSON.stringify(
        { type: "autonomy_context", position: "5/C3", ...v },
        null,
        2,
      ),
    );
    if (!v.valid) Deno.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(
    {
      type: "autonomy_context",
      position: "5/C3",
      usage: [
        "context build --verb <v> --target <t> --organ <file>   recompute capability evidence",
        "context verify <evidence.json> --organ <file>           re-derive + check for drift",
      ],
      note:
        "recomputes content-bound capability evidence from the actual organ + its imports (codex x7700_954451). Produces evidence; never grants authority.",
    },
    null,
    2,
  ));
}

if (import.meta.main) await runCli();
