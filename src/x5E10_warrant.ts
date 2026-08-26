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

const SUBSTRATES = ["trinity", "myc", "liquid", "omega"];

/** The closed member set. An ActionIntent has exactly these and nothing else. */
const MEMBERS = [
  "verb",
  "target_substrate",
  "args_commitment",
  "input_commitments",
  "requested_effects",
] as const;

/** The ONE domain check. `validateIntent` and the canonical encoder both call
 *  it, because two guards that are supposed to agree and are written twice are
 *  two guards that will disagree.
 *
 *  An earlier version repeated only the surrogate check inside the encoder and
 *  described itself as "refusing anything else". It did not: a runtime value
 *  with `requested_effects: [1]` was encoded as the JSON number `1` and given a
 *  digest, despite `validateIntent` rejecting it. In an authority path a
 *  commitment must be unreachable for any value the boundary would refuse. */
function domainError(v: unknown): string | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    return "intent must be an object";
  }
  const o = v as Record<string, unknown>;

  // Extra members are REJECTED, not dropped. Silently discarding an unknown
  // member means two different callers can commit to the same digest while
  // believing they asked for different things.
  const extra = Object.keys(o).filter(
    (k) => !(MEMBERS as readonly string[]).includes(k),
  ).sort();
  if (extra.length) {
    return `unknown member(s): ${
      extra.join(", ")
    }; the ActionIntent schema is closed`;
  }
  for (const k of MEMBERS) {
    if (!(k in o)) return `${k} is missing`;
  }

  if (typeof o.verb !== "string" || !o.verb.trim()) {
    return "verb must be a non-empty string";
  }
  if (
    typeof o.target_substrate !== "string" ||
    !SUBSTRATES.includes(o.target_substrate)
  ) {
    return `target_substrate must be one of: ${SUBSTRATES.join(", ")}`;
  }
  if (typeof o.args_commitment !== "string") {
    return "args_commitment must be a string";
  }
  for (const k of ["input_commitments", "requested_effects"] as const) {
    const a = o[k];
    if (!Array.isArray(a) || !a.every((e) => typeof e === "string")) {
      return `${k} must be an array of strings`;
    }
  }

  // Surrogates last, so a shape error is reported as a shape error.
  const strings: [string, string][] = [
    ["verb", o.verb as string],
    ["args_commitment", o.args_commitment as string],
    ...(o.input_commitments as string[]).map((
      x,
      i,
    ): [string, string] => [`input_commitments[${i}]`, x]),
    ...(o.requested_effects as string[]).map((
      x,
      i,
    ): [string, string] => [`requested_effects[${i}]`, x]),
  ];
  for (const [where, value] of strings) {
    const bad = unpairedSurrogateIndex(value);
    if (bad >= 0) {
      return `${where} contains an unpaired UTF-16 surrogate at index ${bad}; ` +
        `strict I-JSON admits only Unicode scalar values, and the string has no ` +
        `UTF-8 encoding a second implementation could reproduce`;
    }
  }
  return null;
}

/** Validate an untrusted value as an ActionIntent. Fail closed: anything
 *  missing, mistyped, carrying an unknown member, or holding an unpaired
 *  surrogate is rejected with a reason. */
export function validateIntent(
  v: unknown,
): { ok: true; intent: ActionIntent } | { ok: false; error: string } {
  const err = domainError(v);
  if (err) return { ok: false, error: err };
  const o = v as Record<string, unknown>;
  return {
    ok: true,
    intent: {
      verb: o.verb as string,
      target_substrate: o.target_substrate as ActionIntent["target_substrate"],
      args_commitment: o.args_commitment as string,
      input_commitments: o.input_commitments as string[],
      requested_effects: o.requested_effects as string[],
    },
  };
}

/** RFC-0003 Part 01 §5.1.2.1: the wire encoding and the numeric profile are
 *  separate identifiers and BOTH live inside the hashed root. A profile without
 *  a byte encoding does not determine a digest. */
export const CANONICAL_ENCODING = "hsp-jcs@v0";
export const NUMERIC_PROFILE = "cnp-0";

/** The index of the first unpaired UTF-16 surrogate, or -1.
 *
 *  Strict I-JSON admits only Unicode scalar values, and RFC-0003 §5.1.3 names
 *  `unpaired-surrogate` as a rejection class for exactly this. The reason is
 *  interoperability rather than anything local: a lone surrogate has no UTF-8
 *  encoding at all, so a second implementation cannot reproduce the commitment.
 *  Python raises `UnicodeEncodeError` on `'x\ud834y'.encode('utf-8')`; Rust
 *  cannot hold the value in a `String`. JavaScript is the outlier that accepts
 *  it, and a cross-substrate authority commitment must not depend on the
 *  quirks of the language that happens to compute it first.
 *
 *  (It is NOT a same-language collision: ES2019 well-formed `JSON.stringify`
 *  escapes a lone surrogate to `\udXXX`, so the canonical text differs from the
 *  U+FFFD text. Measured before this comment was written.) */
export function unpairedSurrogateIndex(s: string): number {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = i + 1 < s.length ? s.charCodeAt(i + 1) : 0;
      if (next < 0xdc00 || next > 0xdfff) return i;
      i++; // a well-formed pair; skip the low half
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      return i; // a low surrogate with no high half before it
    }
  }
  return -1;
}

/** CNP-0-JCS for the ActionIntent shape, and refusing anything else.
 *
 *  Deliberately not a general encoder: this domain is a map of string keys to
 *  strings and arrays of strings, with no numbers, and a serializer that quietly
 *  handled more than its callers can produce would be untested surface in an
 *  authority path. Trinity's `conformance/cnp-0-jcs-v0/` kit is where a general
 *  implementation gets measured.
 *
 *  Member names are ordered by UTF-16 code unit (RFC 8785 §3.2.3), which is what
 *  JavaScript's default string comparison already does — written explicitly here
 *  because "correct by coincidence" is not a property anyone can check. */
function jcsString(s: string): string {
  const bad = unpairedSurrogateIndex(s);
  if (bad >= 0) {
    throw new RangeError(
      `unpaired-surrogate at index ${bad}: the value has no UTF-8 encoding and ` +
        `cannot be reproduced by a second implementation`,
    );
  }
  // ES2019 well-formed JSON.stringify implements RFC 8785 §3.2.2.2 escaping for
  // well-formed input: shortest form for \b \f \n \r \t, \u00XX for other
  // controls, literal otherwise. Verified against the rule, not assumed.
  return JSON.stringify(s);
}

function jcsValue(v: string | string[]): string {
  if (typeof v === "string") return jcsString(v);
  if (Array.isArray(v)) return `[${v.map(jcsString).join(",")}]`;
  throw new TypeError("ActionIntent members are strings or arrays of strings");
}

/** `requested_effects` is a SET: deduplicated, then ordered.
 *
 *  Sorting alone is not set semantics, and the previous code claimed it was —
 *  `["write","write"]` and `["write"]` request the same effect and produced two
 *  different commitments, so an authority grant could be made to depend on how
 *  many times a caller happened to name an effect. Duplicates are canonicalised
 *  away rather than rejected, because a repeated effect is not an error about
 *  what was asked for; it is the same ask written twice.
 *
 *  Ordering is by UTF-16 code unit, matching RFC 8785's member ordering, which
 *  is what JavaScript's default string comparison already does — written out
 *  because "correct by coincidence" is not a property anyone can check. */
function canonicalEffects(effects: string[]): string[] {
  return [...new Set(effects)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** The canonical bytes' text form. Exported so a test can assert the BYTES
 *  rather than only the digest — a digest test passes for two implementations
 *  that agree on a wrong encoding, and says nothing about which bytes either
 *  produced. */
export function canonicalIntentText(intent: ActionIntent): string {
  // The SAME domain check the boundary uses. Not a repeat of part of it.
  const err = domainError(intent);
  if (err) {
    throw new RangeError(`ActionIntent is outside its domain: ${err}`);
  }
  const root: Record<string, string | string[]> = {
    args_commitment: intent.args_commitment,
    canonical_encoding: CANONICAL_ENCODING,
    input_commitments: intent.input_commitments, // ORDER PRESERVED
    numeric_profile: NUMERIC_PROFILE,
    requested_effects: canonicalEffects(intent.requested_effects),
    target_substrate: intent.target_substrate,
    verb: intent.verb,
  };
  const names = Object.keys(root).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${
    names.map((k) => `${jcsString(k)}:${jcsValue(root[k])}`).join(",")
  }}`;
}

/** The canonical bytes themselves: UTF-8, no BOM. */
export function canonicalIntentBytes(
  intent: ActionIntent,
): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(canonicalIntentText(intent));
}

async function sha256Bytes(b: Uint8Array<ArrayBuffer>): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", b);
  return Array.from(new Uint8Array(d)).map((x) =>
    x.toString(16).padStart(2, "0")
  ).join("");
}

// The PROPOSAL-BODY digest, deliberately NOT migrated. It recomputes a
// commitment MYC already wrote with this same stringification, so changing it
// here alone would reject every existing proposal — and migrating it is a
// separate slice with its own stored-state question. Only ActionIntent adopts
// CNP-0-JCS in this commit.
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
  ).join("");
}

/** The content commitment of a normalized intent. SHA-256 over CNP-0-JCS
 *  canonical bytes — RFC-0003 Part 01 §5.1, Tranche A3, ratified 2026-08-26.
 *
 *  VENDORED byte-for-byte from MYC's canonical contract
 *  `myc/src/x5820_action_intent.ts` (MYC owns it; Trinity cannot static-import
 *  the submodule under CI decoupling). Two things pin the copy, and the second
 *  is the one that matters: a shared known-answer vector in both suites, AND a
 *  LIVE parity test that executes both implementations and compares their
 *  canonical BYTES when the submodule is present — see
 *  `src/action_intent_parity_test.ts`. Two matching constants in two files prove
 *  the constants match; only running both proves the implementations do. */
export async function intentCommitment(intent: ActionIntent): Promise<string> {
  return await sha256Bytes(canonicalIntentBytes(intent));
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
    // VALIDATE runtime input before it can reach a commitment. Parsing JSON
    // says the bytes are JSON; it says nothing about whether they are an
    // ActionIntent. Without this the encoder throws a bare RangeError at the
    // caller, which is a failure but not a reason.
    let intent: ActionIntent;
    try {
      const raw = JSON.parse(await Deno.readTextFile(fqdn));
      const v = validateIntent(raw);
      if (!v.ok) {
        console.error(`# error: invalid intent: ${v.error}`);
        Deno.exitCode = 1;
        return;
      }
      intent = v.intent;
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
      const raw = JSON.parse(await Deno.readTextFile(ipath));
      const v = validateIntent(raw);
      if (!v.ok) {
        console.error(`# error: invalid intent: ${v.error}`);
        Deno.exitCode = 1;
        return;
      }
      intent = v.intent;
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
