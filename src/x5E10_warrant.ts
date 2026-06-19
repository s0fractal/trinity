#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env
// src/x5E10_warrant.ts — Actuation Warrant: authority-root verification.
// position: 5/E1 → action × emergence = the authority to perform one effect.
// hex_dipole: "00 00 00 00 00 6C 00 00"
// placement_policy: axis
//
// Goal x5000_954398, vector 1 (propose → ratify → APPLY). First slice of codex's
// ACTUATION_WARRANT.v0 (x5d00_954408): the AUTHORITY ROOT. A signed warrant does
// not INVENT authority — its authority is DERIVED from a quorum-final proposal.
// This is the pure, fail-closed bridge from finality to "may this action run":
// no proposal, non-final, conflicted, claimed, evidence-unverified, or invalid →
// `denied`. Execution, pre-state snapshot, transaction and rollback (codex §3-5)
// are deliberately NOT here — authority first, actuation later. Pure over the
// lifecycle; the CLI is a thin reader. NEVER touches keys or performs an effect.

import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.4";
import { extractOrganJson, runOrgan } from "./x0010_dispatch_runner.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

/** Typed readiness — codex §4. Infrastructure-unavailable is NOT a failure, and a
 *  pass for another pre-state is stale. Unknown/unavailable/stale never satisfy a
 *  required gate, but stay distinguishable so an actor knows whether to repair
 *  code, refresh evidence, request network, or wait. */
export type Readiness =
  | "pass"
  | "fail"
  | "unavailable"
  | "stale"
  | "not_applicable";

/** A normalized action intent — codex §1. Equivalent actions yield the same
 *  commitment; different args/targets cannot reuse it. */
export interface ActionIntent {
  verb: string;
  target_substrate: "trinity" | "myc" | "liquid" | "omega";
  args_commitment: string;
  input_commitments: string[];
  requested_effects: string[];
}

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
/** The content commitment of a normalized intent. Pure. */
export async function intentCommitment(intent: ActionIntent): Promise<string> {
  return await sha256(stable({
    args_commitment: intent.args_commitment,
    input_commitments: [...intent.input_commitments].sort(),
    requested_effects: [...intent.requested_effects].sort(),
    target_substrate: intent.target_substrate,
    verb: intent.verb,
  }));
}

const TERMINAL_FINAL = "implemented"; // the only outcome that authorizes an effect

export interface AuthorityVerdict {
  authorized: boolean;
  readiness: Readiness;
  reason: string;
  authority?: {
    proposal: string;
    state: string;
    principals: string[];
    policy: string;
  };
}

interface Mutation {
  kind?: string;
  id?: string;
  state?: string;
  detail?: string;
}

/** Derive whether a proposal is a valid AUTHORITY for actuation, purely from the
 *  lifecycle. Fail closed: a proposal that is missing, not `implemented`, or
 *  conflicted/claimed/evidence_verified grants NO authority. (codex §2) */
export function authorityRoot(
  proposalRef: string,
  mutations: Mutation[],
): AuthorityVerdict {
  const hash = proposalRef.match(/h\.[0-9a-fA-F]+/)?.[0] ?? proposalRef;
  const p = mutations.find((m) =>
    m.kind === "proposal" && String(m.id).includes(hash)
  );
  if (!p) {
    return {
      authorized: false,
      readiness: "not_applicable",
      reason: `no proposal matching ${hash}`,
    };
  }
  if (p.state === "conflicted") {
    return {
      authorized: false,
      readiness: "fail",
      reason: "proposal is conflicted — incompatible authenticated outcomes",
    };
  }
  if (p.state !== TERMINAL_FINAL) {
    return {
      authorized: false,
      readiness: p.state === "evidence_verified" ? "stale" : "not_applicable",
      reason:
        `proposal is '${p.state}', not final:${TERMINAL_FINAL} — no authority (${
          p.detail ?? ""
        })`,
    };
  }
  // final:implemented → authority. Surface the quorum/policy that granted it.
  const detail = String(p.detail ?? "");
  const principals =
    detail.match(/principals:\s*([^)]+)\)/)?.[1]?.split(",").map((s) =>
      s.trim()
    ) ??
      [];
  const policy = detail.match(/—\s*(.*?quorum[^(]*)\s*(?:\(|$)/)?.[1]?.trim() ??
    "satisfied";
  return {
    authorized: true,
    readiness: "pass",
    reason: "authority derived from a quorum-final proposal",
    authority: {
      proposal: String(p.id),
      state: String(p.state),
      principals,
      policy,
    },
  };
}

async function runCli(args: string[] = Deno.args): Promise<void> {
  const sub = args[0];
  if (sub !== "authority" || !args[1]) {
    console.log(JSON.stringify(
      {
        type: "warrant",
        position: "5/E1",
        usage: "warrant authority <proposal-fqdn>",
        note:
          "authority-root verification only — derives 'may this action run' from finality; never executes or signs",
      },
      null,
      2,
    ));
    return;
  }
  const life = await runOrgan(join(ROOT, "t"), ["myc", "lifecycle", "--json"], {
    cwd: ROOT,
  });
  const o = (life.code === 0 ? extractOrganJson(life.stdout) : null) as
    | { mutations?: Mutation[] }
    | null;
  const verdict = authorityRoot(args[1], o?.mutations ?? []);
  console.log(
    JSON.stringify({ type: "warrant", position: "5/E1", ...verdict }, null, 2),
  );
  if (!verdict.authorized) Deno.exitCode = 1;
}

if (import.meta.main) await runCli();
