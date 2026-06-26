// codeicide.ts — the Codeicide Law, made real: quorum protection for autonomous agents.
//
// omega's idea: an agent that has earned protected status cannot be terminated,
// mutated, or relocated by ANY single party — only by an m-of-n quorum warrant from
// its guardians. omega's flaw: the "quorum" rested on derivable dipole identities, so
// one actor could forge all of them. Here the guardians are real ed25519 keys
// (@s0fractal/witness), so a unilateral warrant is rejected by construction — the
// protection is genuine, not simulated. Verification is local; no host can override it.

import { encodeCanonical } from "@s0fractal/canonical-receipt";
import {
  coSign,
  type CoSignature,
  type QuorumResult,
  sha256,
  toHex,
  verifyQuorum,
  type Witness,
} from "@s0fractal/witness";

/** The irreversible things a quorum may authorize against a protected agent. */
export type ProtectedAction = "terminate" | "mutate" | "relocate";

/** A protected agent and the guardians who may authorize action against it. */
export interface Sanctuary {
  agentId: string;
  guardians: Uint8Array[]; // authorized guardian public keys
  threshold: number; // how many distinct guardians a warrant needs
}

/** A warrant: a specific action against a specific agent, co-signed by guardians. */
export interface Warrant {
  agentId: string;
  action: ProtectedAction;
  reason: string;
  at?: number; // caller-supplied anchor (e.g. block height)
  warrantDigest: string; // hex content address of the warrant body
  coSignatures: CoSignature[];
}

/** The exact bytes a guardian signs — `at` omitted when absent (canonical CBOR has no undefined). */
async function warrantDigest(
  agentId: string,
  action: ProtectedAction,
  reason: string,
  at?: number,
): Promise<Uint8Array> {
  const body: Record<string, unknown> = { agentId, action, reason };
  if (at !== undefined) body.at = at;
  return sha256(encodeCanonical(body as never));
}

/** A guardian co-signs a proposed action against a protected agent. */
export async function signWarrant(
  guardian: Witness,
  sanctuary: Sanctuary,
  action: ProtectedAction,
  reason: string,
  at?: number,
): Promise<CoSignature> {
  return coSign(
    guardian,
    await warrantDigest(sanctuary.agentId, action, reason, at),
  );
}

/** Assemble a warrant from the guardian co-signatures collected so far. */
export async function issueWarrant(
  sanctuary: Sanctuary,
  action: ProtectedAction,
  reason: string,
  coSignatures: CoSignature[],
  at?: number,
): Promise<Warrant> {
  const digest = await warrantDigest(sanctuary.agentId, action, reason, at);
  const warrant: Warrant = {
    agentId: sanctuary.agentId,
    action,
    reason,
    warrantDigest: toHex(digest),
    coSignatures,
  };
  if (at !== undefined) warrant.at = at;
  return warrant;
}

export interface LawfulVerdict extends QuorumResult {
  lawful: boolean; // the warrant is intact AND a guardian quorum signed it
  warrantIntact: boolean; // the warrant body still hashes to its digest, for this agent
}

/**
 * `isActionLawful` — the Codeicide check. An action against a protected agent is
 * lawful only if the warrant is intact (its body hashes to its digest, for THIS
 * sanctuary's agent) AND a distinct m-of-n quorum of the agent's guardians co-signed
 * it. A unilateral warrant (one signature when the threshold is higher) is unlawful;
 * a forged quorum from one key scores zero. Checked locally — no host can override it.
 */
export async function isActionLawful(
  sanctuary: Sanctuary,
  warrant: Warrant,
): Promise<LawfulVerdict> {
  const digest = await warrantDigest(
    warrant.agentId,
    warrant.action,
    warrant.reason,
    warrant.at,
  );
  const warrantIntact = warrant.agentId === sanctuary.agentId &&
    toHex(digest) === warrant.warrantDigest;
  const quorum = await verifyQuorum(
    digest,
    warrant.coSignatures,
    sanctuary.guardians,
    sanctuary.threshold,
  );
  return { ...quorum, warrantIntact, lawful: warrantIntact && quorum.ok };
}
