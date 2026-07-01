#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env
// src/x5E10_warrant.ts — Actuation Warrant: action-bound authority verification.
// position: 5/E1 → action × emergence = the authority to perform one effect.
// maturity: active
// skill_safe: yes-readonly  (classified 2026-06-26 from AST behaviour — codex x5d00 P0)
// hex_dipole: "00 00 00 00 00 6C 00 00"
// placement_policy: axis
//
// Goal x5000_954398, vector 1 (propose → ratify → APPLY). The authority root of
// codex's ACTUATION_WARRANT.v0 (x5d00_954408), REPAIRED per codex's review
// x5d00_954412: **terminal state is not a capability.** Finality answers "was
// this proposal's outcome accepted under its policy?"; authority must ALSO answer
// "does the accepted proposal commit to THIS exact action?" — and the second
// cannot be derived from the first. So a proposal authorizes actuation ONLY when
// its committed descriptor carries a structured `action_grant.intent_commitment`
// that the requested intent matches. Absence → denied. Narrative resemblance is
// not authority. Fail-closed; exact identity (never substring/prefix); authority
// reads structured fields, never display prose. Verification only — never executes
// or signs. §3-5 (pre-state, transaction, rollback) remain deliberately unbuilt.

import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.4";
import { extractOrganJson, runOrgan } from "./x0010_dispatch_runner.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

/** Typed readiness — codex §4. Unavailable ≠ fail; a pass for another pre-state is
 *  stale. Each verdict also carries a stable reason code (below). */
export type Readiness =
  | "pass"
  | "fail"
  | "unavailable"
  | "stale"
  | "pending"
  | "not_applicable";

export type ReasonCode =
  | "action_authorized"
  | "no_proposal"
  | "not_final"
  | "pending_quorum"
  | "conflict"
  | "missing_action_grant"
  | "intent_mismatch";

/** A normalized action intent — codex §1, narrowed by §5: requested_effects is a
 *  SET (canonical), but input_commitments order is PRESERVED — [a,b] ≠ [b,a]
 *  unless an action schema explicitly declares the field commutative. */
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
/** The content commitment of a normalized intent (codex §1+§5). VENDORED byte-for-
 *  byte from MYC's canonical contract `myc/src/x5820_action_intent.ts` (MYC owns it,
 *  Trinity cannot static-import the submodule under CI decoupling). A shared
 *  known-answer vector pins both sides — see warrant_test.ts + x5820_action_intent_test.ts. */
export async function intentCommitment(intent: ActionIntent): Promise<string> {
  return await sha256(stable({
    args_commitment: intent.args_commitment,
    input_commitments: intent.input_commitments, // ORDER PRESERVED (codex §5)
    requested_effects: [...intent.requested_effects].sort(), // a set
    target_substrate: intent.target_substrate,
    verb: intent.verb,
  }));
}

/** The committed proposal descriptor — the PROOF (not the lifecycle summary, which
 *  is only an index). */
export interface ProposalDescriptor {
  fqdn: string;
  commitment: string;
  action_grant?: { intent_commitment?: string };
}

export interface AuthorityVerdict {
  authorized: boolean;
  readiness: Readiness;
  reason_code: ReasonCode;
  reason: string;
  bound?: { proposal: string; commitment: string; intent_commitment: string };
}

const TERMINAL_FINAL = "implemented";

/** ACTION-BOUND authority (codex §P0). Pure. A proposal authorizes one effect only
 *  when (1) it exists with exact identity, (2) it is final:implemented, and (3) its
 *  committed descriptor carries an `action_grant.intent_commitment` equal to the
 *  requested intent's commitment. Anything else is denied with a reason code that
 *  tells an autonomous actor what to do next. Authority is never inferred from
 *  prose, narrative resemblance, or a bare finality event. */
export function actionBoundAuthority(
  intentCommit: string,
  descriptor: ProposalDescriptor | null,
  finalState: string | null,
): AuthorityVerdict {
  if (!descriptor) {
    return {
      authorized: false,
      readiness: "not_applicable",
      reason_code: "no_proposal",
      reason: "no proposal with this exact identity",
    };
  }
  if (finalState === "conflicted") {
    return {
      authorized: false,
      readiness: "fail",
      reason_code: "conflict",
      reason: "proposal is conflicted — incompatible authenticated outcomes",
    };
  }
  if (finalState !== TERMINAL_FINAL) {
    // codex P0.5: evidence_verified is `pending` (current but a signature short),
    // NOT `stale` (which means evidence for the wrong pre-state).
    const pending = finalState === "evidence_verified";
    return {
      authorized: false,
      readiness: pending ? "pending" : "not_applicable",
      reason_code: pending ? "pending_quorum" : "not_final",
      reason: `proposal is '${finalState}', not final:${TERMINAL_FINAL}`,
    };
  }
  const grant = descriptor.action_grant?.intent_commitment;
  if (!grant) {
    return {
      authorized: false,
      readiness: "not_applicable",
      reason_code: "missing_action_grant",
      reason:
        "final proposal carries no action_grant — it is governance history, not actuation authority",
    };
  }
  if (grant !== intentCommit) {
    return {
      authorized: false,
      readiness: "fail",
      reason_code: "intent_mismatch",
      reason: "the proposal's action_grant does not commit to this intent",
    };
  }
  return {
    authorized: true,
    readiness: "pass",
    reason_code: "action_authorized",
    reason: "a quorum-final proposal commits to exactly this action",
    bound: {
      proposal: descriptor.fqdn,
      commitment: descriptor.commitment,
      intent_commitment: intentCommit,
    },
  };
}

// ── CLI helpers (read-only) ─────────────────────────────────────────────────────
/** Read a proposal descriptor by EXACT fqdn (codex §3 — never substring/prefix).
 *  RECOMPUTES the body commitment (codex P0.5 — never trust the written value): a
 *  descriptor whose commitment does not bind its body, or whose fqdn does not match
 *  its commitment, is rejected as no proposal at all. */
async function readProposal(fqdn: string): Promise<ProposalDescriptor | null> {
  const path = join(ROOT, "myc", "public", "proposals", fqdn);
  try {
    const text = await Deno.readTextFile(path);
    const d = JSON.parse(text.match(/```json myc\s*\n([\s\S]*?)\n```/)![1]);
    if (d?.type !== "ProposedMutationDescriptor") return null;
    const claimed = String(d.commitment?.value ?? "");
    const recomputed = await sha256(stable(d.body ?? {}));
    // commitment must bind the body, and the fqdn must derive from the commitment
    if (!claimed || recomputed !== claimed) return null;
    if (String(d.fqdn) !== `h.${claimed.slice(0, 12)}.proposal.myc.md`) {
      return null;
    }
    if (String(d.fqdn) !== fqdn) return null; // exact identity, no aliasing
    return {
      fqdn: String(d.fqdn),
      commitment: claimed,
      action_grant: d.body?.action_grant,
    };
  } catch {
    return null;
  }
}
/** The proposal's finality state + the verified commitment the lifecycle bound to
 *  it — so the caller can join on the EXACT commitment, not a truncated label
 *  (codex P0.5). The lifecycle is the deterministic-interpretation index; the
 *  commitment is the fact it points at. */
async function finalState(
  fqdn: string,
): Promise<{ state: string; key: string } | null> {
  const r = await runOrgan(join(ROOT, "t"), ["myc", "lifecycle", "--json"], {
    cwd: ROOT,
  });
  const o = (r.code === 0 ? extractOrganJson(r.stdout) : null) as
    | {
      mutations?: Array<
        { kind?: string; id?: string; state?: string; key?: string }
      >;
    }
    | null;
  const idKey = fqdn.slice(0, 26);
  const m = (o?.mutations ?? []).find((x) =>
    x.kind === "proposal" && x.id === idKey
  );
  if (!m || typeof m.state !== "string") return null;
  return { state: m.state, key: String(m.key ?? "") };
}

async function runCli(args: string[] = Deno.args): Promise<void> {
  const sub = args[0];
  const fqdn = args[1];

  // `warrant intent <intent.json>` — compute the canonical intent_commitment, so a
  // proposer can mint the action_grant a future warrant will match. ONE algorithm,
  // here, never re-implemented on the propose side.
  if (sub === "intent" && fqdn) {
    let intent: ActionIntent;
    try {
      intent = JSON.parse(await Deno.readTextFile(fqdn));
    } catch {
      console.error(`# error: could not read intent from ${fqdn}`);
      Deno.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(
      {
        type: "intent_commitment",
        position: "5/E1",
        intent_commitment: await intentCommitment(intent),
      },
      null,
      2,
    ));
    return;
  }

  // `warrant authority <proposal>` — FINALITY DIAGNOSTIC only (codex: never emit
  // authorized:true without an intent; finality_satisfied ≠ action_authorized).
  if (sub === "authority" && fqdn) {
    const fs = await finalState(fqdn);
    console.log(JSON.stringify(
      {
        type: "warrant_finality_diagnostic",
        position: "5/E1",
        proposal: fqdn,
        finality_satisfied: fs?.state === TERMINAL_FINAL,
        state: fs?.state ?? null,
        note:
          "finality_satisfied is NOT action_authorized — use `warrant admit <p> --intent` to test a concrete action",
      },
      null,
      2,
    ));
    return;
  }

  // `warrant admit <proposal> --intent <intent.json>` — action-bound authority.
  if (sub === "admit" && fqdn) {
    const ipath = args[args.indexOf("--intent") + 1];
    if (!args.includes("--intent") || !ipath) {
      console.error("# error: admit requires --intent <intent.json>");
      Deno.exitCode = 1;
      return;
    }
    let intent: ActionIntent;
    try {
      intent = JSON.parse(await Deno.readTextFile(ipath));
    } catch {
      console.error(`# error: could not read intent from ${ipath}`);
      Deno.exitCode = 1;
      return;
    }
    const [descriptor, fs, ic] = await Promise.all([
      readProposal(fqdn),
      finalState(fqdn),
      intentCommitment(intent),
    ]);
    // EXACT commitment join (codex P0.5): trust the lifecycle's finality only when
    // it is bound to this descriptor's recomputed commitment, never a truncated
    // label. Any inconsistency drops finality to null → fail closed.
    const state = descriptor && fs && descriptor.commitment === fs.key
      ? fs.state
      : null;
    const v = actionBoundAuthority(ic, descriptor, state);
    console.log(
      JSON.stringify({ type: "warrant", position: "5/E1", ...v }, null, 2),
    );
    if (!v.authorized) Deno.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(
    {
      type: "warrant",
      position: "5/E1",
      usage: [
        "warrant admit <proposal-fqdn> --intent <intent.json>   (action-bound authority)",
        "warrant authority <proposal-fqdn>                       (finality diagnostic only)",
      ],
      note:
        "authority is action-bound: a final proposal authorizes ONLY the action it grants. Verification only — never executes or signs.",
    },
    null,
    2,
  ));
}

if (import.meta.main) await runCli();
