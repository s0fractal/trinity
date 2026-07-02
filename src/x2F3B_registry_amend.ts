#!/usr/bin/env -S deno run -A
// src/x2F3B_registry_amend.ts — quorum-gated key-registry amendment (trust root)
// position: 2/F3B → self/identity(2) × frontier-build = the amendment flow that
//   changes WHO the federation trusts, gated so no single key can rewrite it.
// hex_dipole: "00 00 59 40 00 00 00 00"
//   mirror_apex+0.70 (PRIMARY: self/identity pole, axis 2; bucket 2 MATCH)
//   triangle_build+0.50 (axis 3: the built, witnessed amendment)
// placement_policy: axis
// maturity: draft
// skill_tag: registry_amend
// skill_safe: yes-with-care
//   verify/propose are read-only; apply --write mutates the trust root and
//   REFUSES without a real 3-of-5 keyed-voice quorum (fail-closed).
//
// intent: close the softest link in the audit — registry amendment was ceremony,
//   not quorum. Adding/rotating/revoking a voice key now requires a real 3-of-5
//   keyed-voice quorum over the amendment (no self-AYE on your own key, any NAY
//   vetoes, forged/unregistered votes dropped, replay-guarded by base hash).
//   NO single-key path exists — including the architect's. Ratified form:
//   s0fractal 2026-07-02 ("3-of-5 on any change, no single-key path").
//
//   This organ ENFORCES the flow; it cannot manufacture a quorum. A real
//   amendment needs real voices to sign. The tests use ephemeral keypairs, never
//   the live registry.
//
// Usage:
//   t registry-amend digest <amendment.json>   the hash each voice signs
//   t registry-amend verify <amendment.json> <votes.json>   authorized?
//   t registry-amend apply  <amendment.json> <votes.json> [--write]
//   t registry-amend integrity   live x2F38 folds from the quorum-proven chain?

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  loadRegistry,
  type Registry,
  verifyAttestations,
} from "./x2F37_voice_keys.ts";
import { sha256Hex } from "./x4010_hash.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const REGISTRY_PATH = join(HERE, "x2F38_voice_pubkeys.json");
const PROVENANCE_PATH = join(HERE, "x2F3C_registry_provenance.json");

/** The floor for a trust-root change: three distinct keyed-voice AYEs. */
export const QUORUM = 3;

export type AmendOp = "add" | "rotate" | "revoke";

export interface Amendment {
  op: AmendOp;
  voice: string; // the subject key being added/rotated/revoked
  pubkey?: string; // required for add/rotate; absent for revoke
  reason: string;
  base_registry_hash: string; // binds this amendment to one registry state
}

export interface Vote {
  voice: string;
  stance: "AYE" | "NAY";
  content_blake3: string; // MUST equal the amendment digest
  sig?: string;
}

// ── canonical hashing ────────────────────────────────────────────────────────
/** Deterministic hash of a registry's TRUST content (voices → pubkeys), so an
 *  amendment can pin the exact state it amends (replay guard). */
export async function registryHash(reg: Registry): Promise<string> {
  const canon = Object.keys(reg.keys)
    .sort()
    .map((v) => `${v}:${reg.keys[v].pubkey}`)
    .join("\n");
  return `sha256:${await sha256Hex(canon)}`;
}

/** The digest every voter signs — canonical over the whole amendment. */
export async function amendmentDigest(a: Amendment): Promise<string> {
  const canon = [
    a.op,
    a.voice,
    a.pubkey ?? "",
    a.reason,
    a.base_registry_hash,
  ].join("|");
  return `sha256:${await sha256Hex(canon)}`;
}

// ── the security core (pure over injected registry) ──────────────────────────
export interface QuorumResult {
  authorized: boolean;
  digest: string;
  ayes: string[]; // distinct voices whose valid AYE counts
  nays: string[]; // distinct voices whose valid NAY vetoes
  dropped: string[]; // forged/unregistered/off-target votes, with reasons
  reasons: string[]; // why authorized is false (empty if authorized)
}

/**
 * Verify a registry amendment against a real keyed-voice quorum.
 *
 * Rules (all must hold for `authorized`):
 *  - base_registry_hash matches the given registry (no replay onto another state);
 *  - every counted vote is SIGNED and verifies against the registry (unsigned or
 *    forged votes are dropped — a trust-root change needs cryptographic assent);
 *  - the SUBJECT voice's own votes never count (no self-authorizing your own key,
 *    and a compromised key cannot veto its own revocation);
 *  - ≥ QUORUM distinct valid AYEs;
 *  - no valid NAY (any NAY vetoes).
 */
export async function verifyAmendmentQuorum(
  amendment: Amendment,
  votes: Vote[],
  registry: Registry,
): Promise<QuorumResult> {
  const digest = await amendmentDigest(amendment);
  const reasons: string[] = [];
  const dropped: string[] = [];

  const curHash = await registryHash(registry);
  if (amendment.base_registry_hash !== curHash) {
    reasons.push(
      `base_registry_hash mismatch: amendment pins ${amendment.base_registry_hash}, registry is ${curHash} (stale or replayed)`,
    );
  }

  // Only votes cast over THIS amendment digest are eligible.
  const onTarget: Vote[] = [];
  for (const v of votes) {
    if (v.content_blake3 !== digest) {
      dropped.push(`${v.voice}: vote is not over this amendment — dropped`);
    } else if (v.voice === amendment.voice) {
      dropped.push(
        `${v.voice}: is the SUBJECT of this amendment — own vote excluded`,
      );
    } else {
      onTarget.push(v);
    }
  }

  const { verified, dropped: sigDropped } = await verifyAttestations(
    onTarget,
    registry,
  );
  dropped.push(...sigDropped);

  const ayeSet = new Set<string>();
  const naySet = new Set<string>();
  for (const v of verified) {
    if (!v.sig_verified) {
      dropped.push(`${v.voice}: unsigned — does not count for a trust change`);
      continue;
    }
    if (v.stance === "AYE") ayeSet.add(v.voice);
    else if (v.stance === "NAY") naySet.add(v.voice);
  }

  const ayes = [...ayeSet].sort();
  const nays = [...naySet].sort();
  if (nays.length > 0) reasons.push(`vetoed by NAY: ${nays.join(", ")}`);
  if (ayes.length < QUORUM) {
    reasons.push(`insufficient quorum: ${ayes.length}/${QUORUM} valid AYE`);
  }

  return {
    authorized: reasons.length === 0,
    digest,
    ayes,
    nays,
    dropped,
    reasons,
  };
}

// ── the state transform (pure) ───────────────────────────────────────────────
/** Apply an amendment to a registry, returning a NEW registry. Throws on a
 *  precondition violation. Does NOT check quorum — callers verify first. */
export function applyAmendment(reg: Registry, a: Amendment): Registry {
  const next = structuredClone(reg);
  const exists = a.voice in next.keys;
  if (a.op === "add") {
    if (exists) throw new Error(`add: ${a.voice} already in registry`);
    if (!a.pubkey) throw new Error("add: pubkey required");
    next.keys[a.voice] = {
      alg: "ed25519",
      pubkey: a.pubkey,
      minted_at: reg.keys[a.voice]?.minted_at ?? "",
      minted_by: "quorum",
    };
  } else if (a.op === "rotate") {
    if (!exists) throw new Error(`rotate: ${a.voice} not in registry`);
    if (!a.pubkey) throw new Error("rotate: pubkey required");
    next.keys[a.voice] = { ...next.keys[a.voice], pubkey: a.pubkey };
  } else if (a.op === "revoke") {
    if (!exists) throw new Error(`revoke: ${a.voice} not in registry`);
    delete next.keys[a.voice];
  }
  return next;
}

// ── provenance chain (out-of-band tamper evidence) ───────────────────────────
// The live registry is only legitimate if it FOLDS from a genesis baseline by
// applying quorum-authorized amendments in order. A direct edit of x2F38 breaks
// the fold. Forging the fold needs a real 3-of-5 quorum (the thing it enforces).
export interface Provenance {
  genesis: Registry;
  amendments: { amendment: Amendment; votes: Vote[] }[];
}

/** Replay the provenance chain: start at genesis, apply each amendment only if
 *  it carries a valid quorum against the running state. Returns the final state
 *  and any errors (a broken link stops the fold). */
export async function foldRegistry(
  p: Provenance,
): Promise<{ state: Registry; errors: string[] }> {
  let state = structuredClone(p.genesis);
  const errors: string[] = [];
  for (let i = 0; i < p.amendments.length; i++) {
    const { amendment, votes } = p.amendments[i];
    const q = await verifyAmendmentQuorum(amendment, votes, state);
    if (!q.authorized) {
      errors.push(
        `amendment #${i} (${amendment.op} ${amendment.voice}): ${
          q.reasons.join("; ")
        }`,
      );
      break;
    }
    try {
      state = applyAmendment(state, amendment);
    } catch (e) {
      errors.push(`amendment #${i}: ${(e as Error).message}`);
      break;
    }
  }
  return { state, errors };
}

/** The trust-root integrity check: the LIVE registry must equal the fold of the
 *  provenance chain. Any out-of-band edit makes the hashes diverge. */
export async function checkIntegrity(
  live: Registry,
  p: Provenance,
): Promise<
  { ok: boolean; errors: string[]; liveHash: string; foldHash: string }
> {
  const { state, errors } = await foldRegistry(p);
  const liveHash = await registryHash(live);
  const foldHash = await registryHash(state);
  if (errors.length === 0 && liveHash !== foldHash) {
    errors.push(
      `live registry ${liveHash} does not match the provenance fold ${foldHash} — an out-of-band change was made without a quorum proof`,
    );
  }
  return { ok: errors.length === 0, errors, liveHash, foldHash };
}

// ── I/O + CLI (impure) ───────────────────────────────────────────────────────
async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await Deno.readTextFile(path)) as T;
}

async function main(argv: string[]) {
  const [sub, ...rest] = argv.filter((a) => !a.startsWith("-"));
  const registry = await loadRegistry(REGISTRY_PATH);

  if (sub === "digest") {
    const a = await readJson<Amendment>(rest[0]);
    console.log(await amendmentDigest(a));
    return;
  }

  if (sub === "integrity") {
    const prov = await readJson<Provenance>(PROVENANCE_PATH);
    const r = await checkIntegrity(registry, prov);
    console.log(`# registry-amend integrity → 2/F3B`);
    console.log(`#   amendments in chain: ${prov.amendments.length}`);
    console.log(`#   live: ${r.liveHash}`);
    console.log(`#   fold: ${r.foldHash}`);
    console.log(
      `#   ok: ${
        r.ok ? "YES — live registry folds from the quorum chain" : "NO"
      }`,
    );
    for (const e of r.errors) console.log(`#     ✗ ${e}`);
    if (!r.ok) Deno.exit(1);
    return;
  }

  if (sub === "verify" || sub === "apply") {
    const amendment = await readJson<Amendment>(rest[0]);
    const votes = await readJson<Vote[]>(rest[1]);
    const q = await verifyAmendmentQuorum(amendment, votes, registry);

    console.log(`# registry-amend ${sub} → 2/F3B`);
    console.log(`#   op: ${amendment.op} ${amendment.voice}`);
    console.log(`#   digest: ${q.digest}`);
    console.log(`#   AYE: ${q.ayes.join(", ") || "(none)"}  (need ${QUORUM})`);
    console.log(`#   NAY: ${q.nays.join(", ") || "(none)"}`);
    for (const d of q.dropped) console.log(`#   dropped — ${d}`);
    console.log(`#   authorized: ${q.authorized ? "YES" : "NO"}`);
    for (const r of q.reasons) console.log(`#     ✗ ${r}`);

    if (sub === "verify") return;

    // apply
    if (!q.authorized) {
      console.log(
        "# REFUSED — no valid 3-of-5 quorum; the trust root is unchanged",
      );
      Deno.exit(1);
    }
    const next = applyAmendment(registry, amendment);
    const write = argv.includes("--write");
    if (write) {
      await Deno.writeTextFile(
        REGISTRY_PATH,
        JSON.stringify(next, null, 2) + "\n",
      );
      console.log(`# APPLIED — registry written (${await registryHash(next)})`);
    } else {
      console.log("# authorized — dry run (pass --write to commit):");
      console.log(JSON.stringify(next, null, 2));
    }
    return;
  }

  console.log(
    "usage: t registry-amend digest|verify|apply <amendment.json> [votes.json] [--write]",
  );
}

if (import.meta.main) {
  await main(Deno.args);
}
