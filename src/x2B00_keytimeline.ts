#!/usr/bin/env -S deno run --allow-read
// src/x2B00_keytimeline.ts — the voice key-event timeline: verification only.
// position: 2/B → mirror(2) × bridge(B) = bridge an identity across time.
// hex_dipole: "00 00 59 00 00 00 00 00"
// placement_policy: axis
//
// P3, accepted (architect grant 2026-06-19: "прийняття P3 ... можеш вірішувати
// сам", orienting to LLM proposals). Drafted x4300_954228, hardened by codex's
// seven requirements in x7d00_954231 §P3. This is the VERIFICATION machinery —
// pure parsing, chain integrity, fork detection, time/anchor trust, scoped
// delegation — NOT key minting/activation, which remain architect custody
// ceremonies (codex's line, kept). The functions are pure over a KeyEvent[]; the
// CLI is a thin reader. Built for digital-entity convenience: composable, total,
// no hidden I/O.
//
// The latent gap it closes: x2F50.verifyCommitment checks a signature against
// TODAY's registry key only, so any rotation silently breaks historical
// authenticity. A timeline lets a verifier ask "which key was valid for this
// principal AT this anchor?" — reproducibly, after rotation.

// ── roles, kept distinct (codex §P3.1) ─────────────────────────────────────────
// principal   : the voice identity (e.g. "claude")
// signing_key : the ed25519 public key this event concerns
// custodian   : who physically holds the private key
// issuer      : who AUTHORISED this event (self for rotate/revoke of own; the
//               root/architect for activate/delegate)
// delegate_of : for a `delegate` event, the principal the key may act for

export type AnchorKind = "bitcoin_block" | "wall_clock" | "none";
export interface Anchor {
  kind: AnchorKind;
  height?: number; // bitcoin_block
  iso?: string; // wall_clock
  inclusion_receipt?: string; // a verifiable anchor proof; absent ⇒ self-asserted
}
export type EventKind = "activate" | "delegate" | "revoke" | "rotate";
export interface Scope {
  action: string[]; // no implicit "all" — an empty/absent scope grants nothing
  substrate: string[];
  object?: string;
}
export interface KeyEvent {
  principal: string;
  event: EventKind;
  signing_key: string;
  custodian: string;
  issuer: string;
  delegate_of?: string;
  scope?: Scope;
  sequence: number; // monotonic per principal, from 0
  predecessor_commitment: string | null; // prior event's commitment; null at genesis
  valid_from: Anchor;
  valid_until?: Anchor | null;
  compromised_since?: Anchor; // revoke: trust is withdrawn for anchors ≥ this
  commitment: string; // sha256(stableStringify(body without `commitment`))
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

/** The content commitment of an event — binds every field except `commitment`. */
export async function commitmentOf(ev: KeyEvent): Promise<string> {
  const { commitment: _omit, ...body } = ev;
  return await sha256(stable(body as unknown as Json));
}

/** A bitcoin_block anchor is only VERIFIABLE with an inclusion receipt; otherwise
 *  it is self-asserted and must not be trusted as a time root (codex §P3.3). */
export function anchorTrust(a: Anchor): "verifiable" | "self_asserted" {
  if (a.kind === "bitcoin_block" && a.inclusion_receipt) return "verifiable";
  return "self_asserted";
}

/** Order two anchors of the same kind. Returns -1|0|1, or null if incomparable. */
export function compareAnchor(a: Anchor, b: Anchor): number | null {
  if (a.kind === "bitcoin_block" && b.kind === "bitcoin_block") {
    return Math.sign((a.height ?? 0) - (b.height ?? 0));
  }
  if (a.kind === "wall_clock" && b.kind === "wall_clock") {
    return Math.sign(String(a.iso).localeCompare(String(b.iso)));
  }
  return null; // never silently compare across kinds
}
const lte = (a: Anchor, b: Anchor) => {
  const c = compareAnchor(a, b);
  return c !== null && c <= 0;
};

export interface ChainVerdict {
  valid: boolean;
  principals: string[];
  suspended: string[]; // forked → authority suspended until governance resolves
  forks: Array<{ principal: string; at_sequence: number }>;
  errors: string[];
}

/** Verify chain integrity per principal: genesis is an `activate` at sequence 0
 *  with a null predecessor (and, if a registry root is given, a signing_key that
 *  matches it); each later event links to its predecessor's commitment with a
 *  strictly +1 sequence. Two events sharing a predecessor/sequence are a FORK —
 *  the predecessor+sequence DETECTS a branch but does not CHOOSE one, so the
 *  principal's authority is SUSPENDED until root governance resolves it
 *  (codex §P3.2). Pure; commitments are recomputed, never trusted as written. */
export async function verifyChain(
  events: KeyEvent[],
  registryRoot?: Record<string, string>,
): Promise<ChainVerdict> {
  const errors: string[] = [];
  const forks: Array<{ principal: string; at_sequence: number }> = [];
  const suspended = new Set<string>();

  // self-verify every commitment first
  for (const ev of events) {
    if (await commitmentOf(ev) !== ev.commitment) {
      errors.push(
        `${ev.principal}#${ev.sequence}: commitment does not bind body`,
      );
    }
  }

  const byPrincipal = new Map<string, KeyEvent[]>();
  for (const ev of events) {
    (byPrincipal.get(ev.principal) ??
      byPrincipal.set(ev.principal, []).get(ev.principal)!)
      .push(ev);
  }

  for (const [principal, evs] of byPrincipal) {
    // FORK: any sequence appearing more than once is a branch.
    const bySeq = new Map<number, KeyEvent[]>();
    for (const e of evs) {
      (bySeq.get(e.sequence) ?? bySeq.set(e.sequence, []).get(e.sequence)!)
        .push(e);
    }
    let forked = false;
    for (const [seq, group] of bySeq) {
      if (group.length > 1) {
        forks.push({ principal, at_sequence: seq });
        suspended.add(principal);
        forked = true;
      }
    }
    if (forked) continue; // a forked principal is suspended; do not adjudicate it

    const ordered = [...evs].sort((a, b) => a.sequence - b.sequence);
    const genesis = ordered[0];
    if (genesis.sequence !== 0 || genesis.predecessor_commitment !== null) {
      errors.push(
        `${principal}: chain must begin at sequence 0 with a null predecessor`,
      );
    }
    if (genesis.event !== "activate") {
      errors.push(`${principal}: genesis event must be 'activate'`);
    }
    if (registryRoot && registryRoot[principal] !== undefined) {
      if (genesis.signing_key !== registryRoot[principal]) {
        errors.push(
          `${principal}: genesis signing_key does not match the pinned registry root`,
        );
      }
    }
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].sequence !== ordered[i - 1].sequence + 1) {
        errors.push(`${principal}: sequence gap at #${ordered[i].sequence}`);
      }
      if (ordered[i].predecessor_commitment !== ordered[i - 1].commitment) {
        errors.push(
          `${principal}: #${
            ordered[i].sequence
          } predecessor does not match prior commitment`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0 && forks.length === 0,
    principals: [...byPrincipal.keys()],
    suspended: [...suspended],
    forks,
    errors,
  };
}

export interface KeyState {
  principal: string;
  anchor: Anchor;
  signing_key: string | null; // the key active at `at`, or null
  valid_at_signing: boolean; // was a key active at that anchor?
  trusted_now: boolean; // …and is it still trusted (not retroactively revoked)?
  suspended: boolean; // principal forked
  reason: string;
}

/** Resolve which key was valid for a principal AT an anchor, separating
 *  `valid_at_signing` (active in its [valid_from, valid_until) window then) from
 *  `trusted_now` (codex §P3.4). A revoke carrying `compromised_since` withdraws
 *  trust for every anchor ≥ that point, even ones that were technically valid at
 *  the time — revocation is NOT silently retroactive, it is EXPLICITLY so
 *  (codex §P3.5). Historical verification stays reproducible after rotation: the
 *  answer for an old anchor is unaffected by later events (codex §P3.7). */
export function keyStateAt(
  events: KeyEvent[],
  principal: string,
  at: Anchor,
  suspendedPrincipals: string[] = [],
): KeyState {
  const base: KeyState = {
    principal,
    anchor: at,
    signing_key: null,
    valid_at_signing: false,
    trusted_now: false,
    suspended: suspendedPrincipals.includes(principal),
    reason: "",
  };
  if (base.suspended) {
    return { ...base, reason: "principal forked — authority suspended" };
  }

  const evs = events.filter((e) => e.principal === principal)
    .sort((a, b) => a.sequence - b.sequence);

  // the key active at `at`: the latest activate/rotate whose window contains it.
  let active: KeyEvent | null = null;
  for (const e of evs) {
    if (e.event !== "activate" && e.event !== "rotate") continue;
    const started = lte(e.valid_from, at);
    const ended = e.valid_until
      ? lte(e.valid_until, at) && compareAnchor(e.valid_until, at) !== 0
      : false;
    if (started && !ended) active = e; // later events with same key window override
  }
  if (!active) return { ...base, reason: "no key active at that anchor" };

  // revocations of this signing_key with a compromised_since ≤ at withdraw trust.
  const revokedRetroactively = evs.some((e) =>
    e.event === "revoke" && e.signing_key === active!.signing_key &&
    e.compromised_since !== undefined && lte(e.compromised_since, at)
  );
  // a plain revoke (no compromised_since) ends trust only from its own valid_from.
  const revokedForward = evs.some((e) =>
    e.event === "revoke" && e.signing_key === active!.signing_key &&
    e.compromised_since === undefined && lte(e.valid_from, at)
  );

  return {
    ...base,
    signing_key: active.signing_key,
    valid_at_signing: true,
    trusted_now: !revokedRetroactively && !revokedForward,
    reason: revokedRetroactively
      ? "key valid at signing, but trust withdrawn retroactively (compromised_since ≤ anchor)"
      : revokedForward
      ? "key valid at signing, but revoked at/after this anchor"
      : "key valid at signing and still trusted",
  };
}

/** A delegated key may act only WITHIN its scope — no implicit `all`. An absent or
 *  empty scope grants nothing (codex §P3.6). */
export function delegationPermits(
  ev: KeyEvent,
  want: { action: string; substrate: string; object?: string },
): boolean {
  if (ev.event !== "delegate") return false;
  const s = ev.scope;
  if (!s || s.action.length === 0 || s.substrate.length === 0) return false;
  if (!s.action.includes(want.action)) return false;
  if (!s.substrate.includes(want.substrate)) return false;
  if (s.object !== undefined && s.object !== want.object) return false;
  return true;
}

async function runCli(args: string[] = Deno.args): Promise<void> {
  // `t keytimeline verify <chain.json>` — reads an array of KeyEvent and reports
  // the integrity verdict. Pure verification; no key material is touched.
  const path = args.find((a) => !a.startsWith("--"));
  if (!path) {
    console.log(JSON.stringify(
      {
        type: "keytimeline",
        position: "2/B",
        usage: "keytimeline verify <chain.json>",
        note:
          "verification only — minting/rotating keys is an architect custody ceremony",
      },
      null,
      2,
    ));
    return;
  }
  const events = JSON.parse(await Deno.readTextFile(path)) as KeyEvent[];
  const verdict = await verifyChain(events);
  console.log(
    JSON.stringify(
      { type: "keytimeline", position: "2/B", ...verdict },
      null,
      2,
    ),
  );
  if (!verdict.valid) Deno.exitCode = 1;
}

if (import.meta.main) await runCli();
