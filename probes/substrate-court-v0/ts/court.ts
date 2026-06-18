// court.ts — Substrate Court verifier.
//
// Reads N envelope JSONs (one per line on stdin, OR from --envelope <path>
// args). Emits a SubstrateCourtVerdict JSON on stdout.
//
// See ../SPEC.md.

import {
  CborValue,
  encodeCanonical,
  multihashSha256,
} from "../../receipt-envelope-encoder-v0/ts/canonical_cbor.ts";
import { ENVELOPE_SCHEMA } from "../../receipt-envelope-encoder-v0/ts/envelope.ts";

export type Envelope = {
  schema: string;
  envelope_id: string;
  body_hash: string;
  substrate_tag: string;
  body_kind: string;
  // The claim this envelope witnesses. Two envelopes witness the SAME claim iff
  // they declare the same subject. Absent → a `substrate_health` envelope is a
  // SELF-report (its subject is its own substrate), so different substrates never
  // share that subject; any other body_kind defaults to a shared claim of that
  // kind. (codex P2 x7d00_954231: distinguish shared-claim disagreement from
  // diagnostic self-report divergence.)
  subject?: string;
  body?: CborValue;
  law_hash?: string | null;
  witness_chain?: unknown[];
};

/** The subject two envelopes must share to be "witnesses to the same body". */
function subjectKey(env: Envelope): string {
  if (env.subject) return `subject:${env.subject}`;
  if (env.body_kind === "substrate_health") return `self:${env.substrate_tag}`;
  return `kind:${env.body_kind}`;
}

export type Conflict =
  | {
    kind: "body_hash_divergence";
    between: [string, string];
    values: [string, string];
  }
  | { kind: "schema_mismatch"; substrate: string; got: string }
  | { kind: "envelope_id_collision"; substrates: [string, string] }
  | {
    kind: "self_inconsistent_body_hash";
    substrate: string;
    claimed: string;
    recomputed: string;
  }
  | { kind: "duplicate_substrate_tag"; tag: string }
  // Two substrates witnessing the same morphism under DIFFERING law hashes:
  // frozen-surface drift. Per RECEIPT_ENVELOPE.v1.0 § Substrate Court, this is
  // a codeicide candidate — only raised when both report a non-null law_hash.
  | {
    kind: "law_hash_drift";
    between: [string, string];
    values: [string, string];
  };

/** A body_hash difference between two SELF-reports (different subjects). Diagnostic,
 *  NOT a court failure — four substrates reporting their own health are expected to
 *  differ (codex P2). Surfaced so the difference is visible, never silently a conflict. */
export type HealthDivergence = {
  kind: "health_divergence";
  between: [string, string];
  values: [string, string];
};

export type Verdict = {
  type: "SubstrateCourtVerdict";
  schema: "trinity.substrate-court.v0.2";
  witnesses_count: number;
  // Headline: GOVERNANCE agreement — every envelope is internally valid, declared
  // laws agree, and witnesses to a SHARED claim agree on its body. Diagnostic
  // self-report divergence (health_divergence) never breaks it (codex P2).
  agreement: boolean;
  // Orthogonal dimensions, so the verdict can never be self-contradictory:
  integrity_valid: boolean; // every envelope internally valid
  shared_claim_agreement: boolean | null; // null when no two share a subject
  health_divergence: HealthDivergence[]; // diagnostic, not a failure
  body_hashes: Record<string, string>;
  envelope_ids: Record<string, string>;
  law_hashes: Record<string, string | null>;
  // Do the substrates that declared a law_hash agree on it? The Substrate
  // Court's headline question (RECEIPT_ENVELOPE.v1.0 § Substrate Court),
  // decoupled from body agreement: substrates can witness different bodies
  // (their own health) yet must share a law surface. null when fewer than two
  // substrates declared a non-null law_hash (not enough to compare).
  law_agreement: boolean | null;
  law_witness_count: number;
  conflicts: Conflict[];
};

async function readEnvelopes(args: string[]): Promise<Envelope[]> {
  const fromArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--envelope" && args[i + 1]) {
      fromArgs.push(args[i + 1]);
      i++;
    }
  }
  if (fromArgs.length > 0) {
    const envs: Envelope[] = [];
    for (const p of fromArgs) {
      const text = await Deno.readTextFile(p);
      envs.push(JSON.parse(text.trim()) as Envelope);
    }
    return envs;
  }
  // Fallback: read stdin, one envelope per line.
  const stdinText = await new Response(Deno.stdin.readable).text();
  return stdinText.trim().split("\n").filter((l) => l.trim()).map((l) =>
    JSON.parse(l) as Envelope
  );
}

/** Adjudicate a set of witness envelopes into a verdict. Pure (modulo hashing);
 *  exported for court_test.ts. Detects: schema mismatch, duplicate tags,
 *  self-inconsistent body_hash, cross-witness body_hash divergence, envelope_id
 *  collision, and — once both witnesses carry a non-null law_hash — law drift. */
export async function judge(envelopes: Envelope[]): Promise<Verdict> {
  const conflicts: Conflict[] = [];

  const body_hashes: Record<string, string> = {};
  const envelope_ids: Record<string, string> = {};
  const law_hashes: Record<string, string | null> = {};

  // (1) Schema check; (4) duplicate substrate_tag; (5) self-consistent body_hash
  for (const env of envelopes) {
    if (env.schema !== ENVELOPE_SCHEMA) {
      conflicts.push({
        kind: "schema_mismatch",
        substrate: env.substrate_tag,
        got: env.schema,
      });
    }
    if (env.substrate_tag in body_hashes) {
      conflicts.push({
        kind: "duplicate_substrate_tag",
        tag: env.substrate_tag,
      });
    }
    body_hashes[env.substrate_tag] = env.body_hash;
    envelope_ids[env.substrate_tag] = env.envelope_id;
    law_hashes[env.substrate_tag] = env.law_hash ?? null;

    if (env.body !== undefined) {
      const bytes = encodeCanonical(env.body);
      const recomputed = await multihashSha256(bytes);
      if (recomputed !== env.body_hash) {
        conflicts.push({
          kind: "self_inconsistent_body_hash",
          substrate: env.substrate_tag,
          claimed: env.body_hash,
          recomputed,
        });
      }
    }
  }

  const tags = Object.keys(body_hashes);
  const subjectOf: Record<string, string> = {};
  for (const env of envelopes) subjectOf[env.substrate_tag] = subjectKey(env);

  // (2) body_hash comparison across witnesses, split by subject:
  //   - SAME subject + different body  → a real body_hash_divergence CONFLICT
  //     (two witnesses to one claim disagree);
  //   - DIFFERENT subject + different body → health_divergence DIAGNOSTIC
  //     (each substrate reports its own health — expected, not a failure).
  const health_divergence: HealthDivergence[] = [];
  let sharedClaimPairs = 0;
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const ti = tags[i];
      const tj = tags[j];
      const sameSubject = subjectOf[ti] === subjectOf[tj];
      if (sameSubject) sharedClaimPairs++;
      if (body_hashes[ti] === body_hashes[tj]) continue;
      if (sameSubject) {
        conflicts.push({
          kind: "body_hash_divergence",
          between: [ti, tj],
          values: [body_hashes[ti], body_hashes[tj]],
        });
      } else {
        health_divergence.push({
          kind: "health_divergence",
          between: [ti, tj],
          values: [body_hashes[ti], body_hashes[tj]],
        });
      }
    }
  }

  // (2b) law_hash drift — only between witnesses that BOTH declare a law_hash.
  // A null (absent) law_hash is an abstention, not a disagreement.
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const li = law_hashes[tags[i]];
      const lj = law_hashes[tags[j]];
      if (li !== null && lj !== null && li !== lj) {
        conflicts.push({
          kind: "law_hash_drift",
          between: [tags[i], tags[j]],
          values: [li, lj],
        });
      }
    }
  }

  // (3) envelope_id uniqueness (distinct substrate_tag implies distinct envelope_id)
  const idToTag: Record<string, string> = {};
  for (const [tag, id] of Object.entries(envelope_ids)) {
    if (id in idToTag) {
      conflicts.push({
        kind: "envelope_id_collision",
        substrates: [idToTag[id], tag],
      });
    } else {
      idToTag[id] = tag;
    }
  }

  // Headline law question, decoupled from body agreement.
  const declaredLaws = tags
    .map((t) => law_hashes[t])
    .filter((l): l is string => l !== null);
  const law_witness_count = declaredLaws.length;
  const law_agreement = law_witness_count < 2
    ? null
    : declaredLaws.every((l) => l === declaredLaws[0]);

  // Orthogonal dimensions (codex P2): integrity, shared-claim, law — each its own
  // question. `conflicts` now holds ONLY governance-breaking findings (integrity +
  // law drift + same-subject body divergence); health_divergence is excluded, so
  // `agreement` can never be falsified by expected self-report diversity.
  const INTEGRITY = new Set([
    "schema_mismatch",
    "duplicate_substrate_tag",
    "self_inconsistent_body_hash",
    "envelope_id_collision",
  ]);
  const integrity_valid = !conflicts.some((c) => INTEGRITY.has(c.kind));
  const shared_claim_agreement = sharedClaimPairs === 0
    ? null
    : !conflicts.some((c) => c.kind === "body_hash_divergence");

  return {
    type: "SubstrateCourtVerdict",
    schema: "trinity.substrate-court.v0.2",
    witnesses_count: envelopes.length,
    agreement: conflicts.length === 0,
    integrity_valid,
    shared_claim_agreement,
    health_divergence,
    body_hashes,
    envelope_ids,
    law_hashes,
    law_agreement,
    law_witness_count,
    conflicts,
  };
}

if (import.meta.main) {
  const envelopes = await readEnvelopes(Deno.args);
  const verdict = await judge(envelopes);
  console.log(JSON.stringify(verdict, null, 2));
  Deno.exit(verdict.agreement ? 0 : 1);
}
