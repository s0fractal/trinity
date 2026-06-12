// src/x2F36_fqdn_sovereignty.ts — the consensus-root gate.
// position: 2/F36 → mirror(2) × frontier-pair(F) = FQDN sovereignty
// maturity: active
// horizon: none (graduation completed)
// skill_tag: resolve-fqdn
// skill_safe: yes
// intent: adjudicate attestations and check quorum execute verdicts
//
// The missing third leg: a resolved (role lens) + witnessed (content lens) node
// is only a CANDIDATE. It becomes a real, runnable organ when a QUORUM of voices
// attests it — "consensus root", not a single root and not a single key.
//
// This is NOT a new consensus: it mirrors the substrate's own codeicide/verdict
// rules (src/x7D00_verdict.ts) — AYE >= threshold AND zero NAY AND no self-AYE,
// default 3-of-5. The bridge, not a reinvention.
//
// THE LOAD-BEARING PROPERTY: admission is pinned to `content_blake3`, even though
// identity is role-addressed. Attestations name the exact bytes they bless. Edit
// the node and its content hash moves, so old attestations stop counting and the
// node drops back to PENDING until the quorum re-attests the NEW bytes. No single
// root can admit; no one can silently swap code under an admitted role.
//
// IDENTITY: an attestation's identity is its voice name, upgraded to
// cryptographic identity when `sig` (Ed25519 over content_blake3) verifies
// against the committed pubkey registry — x2F37_voice_keys.verifyAttestations
// performs verification and sets `sig_verified`. The registry starts empty:
// minting real voice keys is a custody ceremony that belongs to the architect.

export type Stance = "AYE" | "NAY";

export interface Attestation {
  voice: string; // attesting voice / substrate_tag (placeholder identity for now)
  stance: Stance;
  content_blake3: string; // PINS the exact bytes blessed — admission follows content
  reason?: string;
  sig?: string; // Ed25519 over content_blake3 (mint/sign/verify: x2F37_voice_keys)
  // Set ONLY by x2F37.verifyAttestations after checking sig against the
  // committed pubkey registry. Presence of `sig` alone proves nothing —
  // assurance upgrades exclusively on sig_verified === true.
  sig_verified?: boolean;
}

export interface Policy {
  threshold: number;
  out_of: number;
}

export const DEFAULT_POLICY: Policy = { threshold: 3, out_of: 5 };

// Honest security boundary. A quorum only means something if the voices are
// who they claim to be. With unverified attestations, one actor can mint
// N "voices" and clear any threshold — the gate is Sybil-vulnerable. So the
// verdict self-reports its assurance, and it upgrades ONLY when every counted
// AYE carries a signature VERIFIED against the committed pubkey registry
// (x2F37.verifyAttestations sets sig_verified; sig presence alone is not
// identity). A future model must NOT mistake an "unauthenticated" AYE for a
// real security decision.
export type Assurance = "authenticated" | "unauthenticated";

export interface Verdict {
  admitted: boolean;
  verdict: "AYE" | "NAY" | "PENDING";
  assurance: Assurance;
  content_blake3: string | null;
  ayes: string[];
  nays: { voice: string; reason: string }[];
  reasons: string[];
  policy: Policy;
}

/**
 * Adjudicate whether a content node is admitted as a real organ. Only
 * attestations pinned to `contentBlake3` count. `author` cannot self-admit
 * (self-AYE vetoes, mirroring x7D00_verdict).
 */
export function adjudicate(
  contentBlake3: string | null,
  author: string | null,
  attestations: Attestation[],
  policy: Policy = DEFAULT_POLICY,
): Verdict {
  const reasons: string[] = [];
  // content-pinned: an attestation only counts for the exact bytes it names
  const relevant = attestations.filter((a) =>
    contentBlake3 !== null && a.content_blake3 === contentBlake3
  );
  const stale = attestations.length - relevant.length;
  if (stale > 0) {
    reasons.push(`${stale} attestation(s) ignored — pinned to other bytes`);
  }

  const ayeVoices = new Set<string>();
  const nays: { voice: string; reason: string }[] = [];
  let selfAye = false;
  let allAyesSigned = true;
  for (const a of relevant) {
    if (a.stance === "AYE") {
      if (a.voice === author) selfAye = true;
      else {
        ayeVoices.add(a.voice);
        if (a.sig_verified !== true) allAyesSigned = false;
      }
    } else {
      nays.push({ voice: a.voice, reason: a.reason ?? "(no reason given)" });
    }
  }

  // Authenticated only if there is at least one counted AYE and every one is signed.
  const assurance: Assurance = ayeVoices.size > 0 && allAyesSigned
    ? "authenticated"
    : "unauthenticated";
  if (assurance === "unauthenticated") {
    reasons.push(
      "UNAUTHENTICATED: not every counted AYE has a registry-verified signature — quorum is NOT Sybil-resistant (verify via x2F37_voice_keys)",
    );
  }

  let verdict: "AYE" | "NAY" | "PENDING";
  if (contentBlake3 === null) {
    verdict = "PENDING";
    reasons.push("no content to admit (absent resolution)");
  } else if (selfAye) {
    verdict = "NAY";
    reasons.push("self-AYE: the author cannot admit their own node");
  } else if (nays.length > 0) {
    verdict = "NAY";
    reasons.push(`${nays.length} NAY — a single NAY vetoes (consensus root)`);
  } else if (ayeVoices.size >= policy.threshold) {
    verdict = "AYE";
    reasons.push(
      `AYE ${ayeVoices.size} >= threshold ${policy.threshold} of ${policy.out_of}, zero NAY`,
    );
  } else {
    verdict = "PENDING";
    reasons.push(
      `AYE ${ayeVoices.size} < threshold ${policy.threshold}; no NAY yet`,
    );
  }

  return {
    admitted: verdict === "AYE",
    verdict,
    assurance,
    content_blake3: contentBlake3,
    ayes: [...ayeVoices],
    nays,
    reasons,
    policy,
  };
}

/**
 * A node may execute as a real organ iff the quorum admitted its current bytes.
 * In the keyless PoC `requireAuthenticated` defaults to false; a real deployment
 * (once keys exist) MUST pass `{ requireAuthenticated: true }` so an
 * unauthenticated, Sybil-vulnerable quorum can never gate real execution.
 */
export function mayExecute(
  verdict: Verdict,
  opts: { requireAuthenticated?: boolean } = {},
): boolean {
  if (!verdict.admitted) return false;
  if (opts.requireAuthenticated && verdict.assurance !== "authenticated") {
    return false;
  }
  return true;
}
